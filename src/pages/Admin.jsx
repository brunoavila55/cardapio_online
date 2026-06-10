import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { QRCodeDisplay } from '../components/shared/QRCodeDisplay'
import { ProductForm } from '../components/admin/ProductForm'
import { ConfirmDialog } from '../components/admin/ConfirmDialog'
import BrandLogo from '../components/menu/BrandLogo'
import { Link } from 'react-router-dom'
import { 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Grid, 
  Utensils, 
  QrCode, 
  Eye, 
  EyeOff, 
  Loader2,
  ListOrdered,
  Database,
  HardDrive,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

// Helper to generate slug from name
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export function Admin() {
  const { signOut } = useAuth()
  const { products, createProduct, updateProduct, deleteProduct, isLoading: isLoadingProducts } = useProducts()
  const { categories, createCategory, updateCategory, deleteCategory, isLoading: isLoadingCategories } = useCategories()
  
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('products') // 'products' | 'categories' | 'qrcode'

  // States for Subcategories Management
  const [editingSubcat, setEditingSubcat] = useState(null) // { categoryId, name }
  const [editingSubcatName, setEditingSubcatName] = useState('')
  const [isUpdatingSubcategory, setIsUpdatingSubcategory] = useState(false)
  const [addingSubcatToCategory, setAddingSubcatToCategory] = useState(null)
  const [newSubcatNameValue, setNewSubcatNameValue] = useState('')
  
  // Modals & States for Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [isProductSaving, setIsProductSaving] = useState(false)
  const [isProductDeleting, setIsProductDeleting] = useState(false)

  // States for Categories (Inline Editing & Quick Create)
  const [newCatName, setNewCatName] = useState('')
  const [newCatOrder, setNewCatOrder] = useState('0')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [editingCatOrder, setEditingCatOrder] = useState('0')
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false)
  const [isUpdatingCategoryOrder, setIsUpdatingCategoryOrder] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [isCategoryDeleting, setIsCategoryDeleting] = useState(false)


  // Database & Storage Size Stats States
  const [storageFiles, setStorageFiles] = useState([])
  const [totalStorageSize, setTotalStorageSize] = useState(0)
  const [orphanedFiles, setOrphanedFiles] = useState([])
  const [isStorageLoading, setIsStorageLoading] = useState(false)
  const [isCleaningStorage, setIsCleaningStorage] = useState(false)
  const [dbSizeExact, setDbSizeExact] = useState(null)
  const [showSqlInstructions, setShowSqlInstructions] = useState(false)

  const fetchStorageStats = async () => {
    setIsStorageLoading(true)
    try {
      // 1. Try to get exact DB size via RPC if it exists
      try {
        const { data, error } = await supabase.rpc('get_db_size')
        if (!error && data) {
          setDbSizeExact(data.database_size_bytes || null)
        } else {
          setDbSizeExact(null)
        }
      } catch (err) {
        setDbSizeExact(null)
      }

      // 2. Fetch storage files in 'products' directory
      const { data: files, error: storageError } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 1000 })

      if (storageError) throw storageError

      if (files) {
        setStorageFiles(files)
        const total = files.reduce((acc, f) => acc + (f.metadata?.size || f.size || 0), 0)
        setTotalStorageSize(total)

        // Find orphaned files (not referenced by any product image_url)
        const productImages = products
          .map((p) => p.image_url)
          .filter(Boolean)

        const orphaned = files.filter((f) => {
          const fileFullPath = `products/${f.name}`
          return !productImages.some((url) => url.includes(fileFullPath))
        })
        setOrphanedFiles(orphaned)
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas de armazenamento:', err)
    } finally {
      setIsStorageLoading(false)
    }
  }

  const handleCleanOrphanedFiles = async () => {
    if (orphanedFiles.length === 0) return
    setIsCleaningStorage(true)
    try {
      const pathsToDelete = orphanedFiles.map((f) => `products/${f.name}`)
      const { error } = await supabase.storage.from('product-images').remove(pathsToDelete)
      if (error) throw error
      alert(`${orphanedFiles.length} imagens órfãs foram excluídas com sucesso para liberar espaço!`)
      await fetchStorageStats()
    } catch (err) {
      alert('Erro ao excluir imagens órfãs: ' + err.message)
    } finally {
      setIsCleaningStorage(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'storage') {
      fetchStorageStats()
    }
  }, [activeTab, products])

  // Handle Product Create/Update Form Submission
  const handleProductSubmit = async (formData) => {
    setIsProductSaving(true)
    try {
      if (editingProduct) {
        // Edit flow - if image changed, delete old image from storage
        if (editingProduct.image_url && editingProduct.image_url !== formData.image_url) {
          try {
            const parts = editingProduct.image_url.split('/product-images/')
            if (parts.length > 1) {
              const filename = parts[1]
              await supabase.storage.from('product-images').remove([filename])
            }
          } catch (storageErr) {
            console.error('Erro ao deletar imagem antiga do storage:', storageErr)
          }
        }
        await updateProduct({ id: editingProduct.id, ...formData })
      } else {
        // Create flow
        await createProduct(formData)
      }
      setIsProductModalOpen(false)
      setEditingProduct(null)
    } catch (err) {
      alert('Erro ao salvar produto: ' + err.message)
    } finally {
      setIsProductSaving(false)
    }
  }

  // Toggle availability state directly
  const handleToggleAvailability = async (product) => {
    try {
      await updateProduct({ id: product.id, available: !product.available })
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message)
    }
  }

  // Handle Product Delete Confirmation
  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return
    setIsProductDeleting(true)
    try {
      // Delete associated image from storage if it exists
      if (deletingProduct.image_url) {
        try {
          const parts = deletingProduct.image_url.split('/product-images/')
          if (parts.length > 1) {
            const filename = parts[1]
            await supabase.storage.from('product-images').remove([filename])
          }
        } catch (storageErr) {
          console.error('Erro ao deletar imagem do storage:', storageErr)
        }
      }
      await deleteProduct(deletingProduct.id)
      setDeletingProduct(null)
    } catch (err) {
      alert('Erro ao excluir produto: ' + err.message)
    } finally {
      setIsProductDeleting(false)
    }
  }

  // Handle Category Creation
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsCreatingCategory(true)
    try {
      const slug = slugify(newCatName)
      await createCategory({
        name: newCatName.trim(),
        slug,
        display_order: parseInt(newCatOrder) || 0,
      })
      setNewCatName('')
      setNewCatOrder('0')
    } catch (err) {
      alert('Erro ao criar categoria: ' + err.message)
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Start Editing Category Inline
  const startEditingCategory = (category) => {
    setEditingCategoryId(category.id)
    setEditingCatName(category.name)
    setEditingCatOrder(category.display_order.toString())
  }

  // Save Inline Category changes
  const handleUpdateCategory = async (id) => {
    if (!editingCatName.trim()) return
    setIsUpdatingCategory(true)
    try {
      const slug = slugify(editingCatName)
      await updateCategory({
        id,
        name: editingCatName.trim(),
        slug,
        display_order: parseInt(editingCatOrder) || 0,
      })
      setEditingCategoryId(null)
    } catch (err) {
      alert('Erro ao salvar categoria: ' + err.message)
    } finally {
      setIsUpdatingCategory(false)
    }
  }

  // Handle Category Delete Confirmation
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return
    setIsCategoryDeleting(true)
    try {
      await deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
    } catch (err) {
      alert('Erro ao excluir categoria: ' + err.message)
    } finally {
      setIsCategoryDeleting(false)
    }
  }

  // Handle Subcategory Renaming (Global update in products table)
  const handleRenameSubcategory = async (categoryId, oldName, newName) => {
    if (!newName.trim() || oldName === newName.trim()) return
    setIsUpdatingSubcategory(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ subcategory: newName.trim() })
        .eq('category_id', categoryId)
        .eq('subcategory', oldName)

      if (error) throw error
      alert(`Subcategoria "${oldName}" renomeada para "${newName.trim()}" em todos os pratos!`)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      alert('Erro ao renomear subcategoria: ' + err.message)
    } finally {
      setIsUpdatingSubcategory(false)
      setEditingSubcat(null)
    }
  }

  // Handle Subcategory Creation (Create ghost product)
  const handleCreateSubcategory = async (categoryId) => {
    if (!newSubcatNameValue.trim()) return
    setIsUpdatingSubcategory(true)
    try {
      await createProduct({
        name: '__SUBCAT__',
        subcategory: newSubcatNameValue.trim(),
        price: 0,
        category_id: categoryId,
        available: false
      })
      setNewSubcatNameValue('')
      setAddingSubcatToCategory(null)
    } catch (err) {
      alert('Erro ao criar subcategoria: ' + err.message)
    } finally {
      setIsUpdatingSubcategory(false)
    }
  }

  // Handle Subcategory Deletion (Clear subcategory field for products and delete ghost products)
  const handleDeleteSubcategory = async (categoryId, subcategoryName) => {
    if (!window.confirm(`Tem certeza que deseja remover a subcategoria "${subcategoryName}" de todos os pratos? Os pratos continuarão existindo, mas sem subcategoria.`)) {
      return
    }
    try {
      // 1. Delete ghost products for this subcategory
      await supabase
        .from('products')
        .delete()
        .eq('name', '__SUBCAT__')
        .eq('category_id', categoryId)
        .eq('subcategory', subcategoryName)

      // 2. Clear subcategory field for real products
      const { error } = await supabase
        .from('products')
        .update({ subcategory: '' })
        .eq('category_id', categoryId)
        .eq('subcategory', subcategoryName)

      if (error) throw error
      alert(`Subcategoria "${subcategoryName}" removida com sucesso!`)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      alert('Erro ao excluir subcategoria: ' + err.message)
    }
  }

  // Handle Subcategory Reordering (Bulk update product display_order in a single batch)
  const handleReorderSubcategories = async (categoryId, subcatList, index, direction) => {
    const newSubcatList = [...subcatList]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newSubcatList.length) return
    
    // Swap elements
    const temp = newSubcatList[index]
    newSubcatList[index] = newSubcatList[targetIndex]
    newSubcatList[targetIndex] = temp
    
    setIsUpdatingSubcategory(true)
    try {
      const catProducts = products.filter((p) => p.category_id === categoryId)
      const updates = []
      
      // Products with no subcategory start at order 0
      const noSubProducts = catProducts
        .filter((p) => !p.subcategory)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        
      noSubProducts.forEach((p, idx) => {
        updates.push({
          ...p,
          display_order: idx
        })
      })
      
      // Products for each subcategory sequentially
      newSubcatList.forEach((subcatName, subcatIdx) => {
        const subProducts = catProducts
          .filter((p) => p.subcategory === subcatName)
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          
        const baseOrder = (subcatIdx + 1) * 100
        subProducts.forEach((p, idx) => {
          updates.push({
            ...p,
            display_order: baseOrder + idx
          })
        })
      })
      
      if (updates.length > 0) {
        const { error } = await supabase
          .from('products')
          .upsert(updates)
          
        if (error) throw error
      }
      
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      alert('Erro ao reordenar subcategorias: ' + err.message)
    } finally {
      setIsUpdatingSubcategory(false)
    }
  }

  // Handle Category Reordering (Bulk update category display_order in a single batch)
  const handleReorderCategories = async (catList, index, direction) => {
    const newCatList = [...catList]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newCatList.length) return
    
    // Swap elements
    const temp = newCatList[index]
    newCatList[index] = newCatList[targetIndex]
    newCatList[targetIndex] = temp
    
    setIsUpdatingCategoryOrder(true)
    try {
      const updates = newCatList.map((cat, idx) => ({
        ...cat,
        display_order: idx + 1
      }))
      
      const { error } = await supabase
        .from('categories')
        .upsert(updates)
        
      if (error) throw error
      
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
    } catch (err) {
      alert('Erro ao reordenar categorias: ' + err.message)
    } finally {
      setIsUpdatingCategoryOrder(false)
    }
  }


  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const formatBrl = (price) => {
    if (price === 0 || price === null || price === undefined) return 'Sem preço'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-ui text-slate-800">
      {/* Top Navbar */}
      <header className="bg-navy-dark text-white px-6 py-4 flex justify-between items-center shadow-md">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="p-0.5 border border-gold rounded-full bg-navy-dark">
            <BrandLogo size={42} borderColor="var(--gold)" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide font-display text-ivory">
              Painel Administrativo
            </h1>
            <p className="text-[10px] text-gold tracking-widest uppercase">
              {import.meta.env.VITE_RESTAURANT_NAME || 'Restaurante Principal'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-800 border border-slate-700 text-white hover:text-gold rounded-admin text-xs font-semibold transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Visualizar Cardápio
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-900/30 hover:border-red-950 rounded-admin text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-4 py-3 rounded-admin text-xs uppercase tracking-widest font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'products' ? 'bg-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-4 py-3 rounded-admin text-xs uppercase tracking-widest font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'categories' ? 'bg-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`w-full text-left px-4 py-3 rounded-admin text-xs uppercase tracking-widest font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'qrcode' ? 'bg-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full text-left px-4 py-3 rounded-admin text-xs uppercase tracking-widest font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'storage' ? 'bg-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Fotos & Mídia
          </button>
        </aside>

        {/* Content Box */}
        <main className="flex-grow bg-white border border-slate-200 rounded-admin shadow-sm p-4 md:p-6 overflow-x-hidden">
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gerenciar Pratos</h2>
                  <p className="text-xs text-slate-500">Crie, edite e altere a disponibilidade dos itens no cardápio público.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setIsProductModalOpen(true)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-navy hover:bg-navy-mid text-white rounded-admin text-xs uppercase tracking-widest font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Produto
                </button>
              </div>

              {isLoadingProducts || isLoadingCategories ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-navy animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-500">Carregando produtos...</p>
                </div>
              ) : products.filter(p => p.name !== '__SUBCAT__').length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-admin">
                  <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">Nenhum produto cadastrado</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Clique no botão acima para adicionar seu primeiro prato.</p>
                </div>
              ) : (
                /* Products Table */
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[10px] uppercase tracking-wider font-semibold">
                        <th className="py-3.5 px-4 w-16">Foto</th>
                        <th className="py-3.5 px-4">Nome</th>
                        <th className="py-3.5 px-4 w-36">Categoria</th>
                        <th className="py-3.5 px-4 w-28 text-right">Preço</th>
                        <th className="py-3.5 px-4 w-24 text-center">Status</th>
                        <th className="py-3.5 px-4 w-24 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {products.filter(p => p.name !== '__SUBCAT__').map((prod) => {
                        const cat = categories.find((c) => c.id === prod.category_id)
                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Thumbnail */}
                            <td className="py-3 px-4">
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt={prod.name}
                                  className="w-10 h-10 object-cover rounded border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400">
                                  <Utensils className="w-4 h-4" />
                                </div>
                              )}
                            </td>
                            {/* Name & description */}
                            <td className="py-3 px-4 max-w-xs md:max-w-md">
                              <div className="font-bold text-slate-900">{prod.name}</div>
                              {prod.description && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5" title={prod.description}>
                                  {prod.description}
                                </div>
                              )}
                            </td>
                            {/* Category name */}
                            <td className="py-3 px-4 text-slate-605 font-medium">
                               {cat ? (
                                 <div className="flex flex-col gap-1 items-start">
                                   <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-semibold">
                                     {cat.name}
                                   </span>
                                   {prod.subcategory && (
                                     <span className="text-[10px] text-slate-400 font-medium ml-1">
                                       ➔ {prod.subcategory}
                                     </span>
                                   )}
                                 </div>
                               ) : (
                                 <span className="text-slate-400 italic text-[10px]">Sem categoria</span>
                               )}
                             </td>
                            {/* Price */}
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                              {formatBrl(prod.price)}
                            </td>
                            {/* Available toggle switch */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleAvailability(prod)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                  prod.available
                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                }`}
                                title={prod.available ? 'Disponível. Clique para desativar' : 'Indisponível. Clique para ativar'}
                              >
                                {prod.available ? (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    Ativo
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3" />
                                    Pausado
                                  </>
                                )}
                              </button>
                            </td>
                            {/* Actions edit / delete */}
                            <td className="py-3 px-4">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingProduct(prod)
                                    setIsProductModalOpen(true)
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-navy hover:bg-slate-100 rounded transition-colors"
                                  title="Editar prato"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingProduct(prod)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Excluir prato"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Gerenciar Categorias</h2>
                <p className="text-xs text-slate-500">Agrupe seus pratos (Ex: Entradas, Carnes, Sobremesas, Bebidas).</p>
              </div>

              {/* Quick Create Category Form */}
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-admin p-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Entradas Especiais"
                    disabled={isCreatingCategory}
                    className="w-full px-3 py-2 border border-slate-300 rounded-admin text-sm bg-white focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ordem de Exibição
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newCatOrder}
                      onChange={(e) => setNewCatOrder(e.target.value)}
                      placeholder="0"
                      disabled={isCreatingCategory}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-admin text-sm bg-white focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy text-center"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingCategory || !newCatName.trim()}
                      className="flex-grow flex items-center justify-center gap-1 px-4 py-2 bg-navy hover:bg-navy-mid text-white rounded-admin text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50"
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Adicionar
                    </button>
                  </div>
                </div>
              </form>

              {isLoadingCategories ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-navy animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-500">Carregando categorias...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-admin text-slate-400">
                  <Grid className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">Nenhuma categoria criada ainda.</p>
                </div>
              ) : (
                /* Inline Categories List */
                <div className="border border-slate-200 rounded-admin overflow-hidden divide-y divide-slate-200">
                  {categories.map((cat, idx) => {
                    const isEditing = editingCategoryId === cat.id
                    const catProducts = products.filter((p) => p.category_id === cat.id)
                    const uniqueSubcats = Array.from(new Set(catProducts.map((p) => p.subcategory).filter(Boolean)))
                      .sort((a, b) => {
                        const minA = Math.min(...catProducts.filter((p) => p.subcategory === a).map((p) => p.display_order ?? 0))
                        const minB = Math.min(...catProducts.filter((p) => p.subcategory === b).map((p) => p.display_order ?? 0))
                        return minA - minB
                      })

                    return (
                      <div
                        key={cat.id}
                        className={`p-4 flex flex-col gap-3 transition-colors ${
                          isEditing ? 'bg-navy-light/10' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                          {isEditing ? (
                            /* INLINE EDIT MODE */
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              <div className="md:col-span-8">
                                <input
                                  type="text"
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  disabled={isUpdatingCategory}
                                  className="w-full px-3 py-1.5 border border-navy rounded bg-white text-sm focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-4 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Ordem:</span>
                                <input
                                  type="number"
                                  value={editingCatOrder}
                                  onChange={(e) => setEditingCatOrder(e.target.value)}
                                  disabled={isUpdatingCategory}
                                  className="w-16 px-2 py-1.5 border border-navy rounded text-center text-sm bg-white"
                                />
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategory(cat.id)}
                                    disabled={isUpdatingCategory || !editingCatName.trim()}
                                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                    title="Confirmar alterações"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCategoryId(null)}
                                    disabled={isUpdatingCategory}
                                    className="p-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded transition-colors"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* STANDARD DISPLAY ROW */
                            <>
                              <div className="flex items-center gap-3">
                                <Grid className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">slug: {cat.slug}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between md:justify-end gap-6">
                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-705 font-medium select-none">
                                  <div className="flex items-center gap-0.5 mr-1 border-r border-slate-200 pr-1.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleReorderCategories(categories, idx, 'up')}
                                      disabled={idx === 0 || isUpdatingCategoryOrder}
                                      className="text-slate-400 hover:text-navy disabled:opacity-30 p-0.5 transition-opacity"
                                      title="Mover categoria para cima"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReorderCategories(categories, idx, 'down')}
                                      disabled={idx === categories.length - 1 || isUpdatingCategoryOrder}
                                      className="text-slate-400 hover:text-navy disabled:opacity-30 p-0.5 transition-opacity"
                                      title="Mover categoria para baixo"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span className="flex items-center gap-1">
                                    <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
                                    Ordem: {cat.display_order}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEditingCategory(cat)}
                                    className="p-1.5 text-slate-500 hover:text-navy hover:bg-slate-100 rounded transition-colors"
                                    title="Editar categoria"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingCategory(cat)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir categoria"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Subcategories Subsection */}
                        {!isEditing && (
                          <div className="mt-1 ml-7 pl-4 border-l-2 border-slate-200/80 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Subcategorias deste grupo:
                            </span>
                            {uniqueSubcats.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {uniqueSubcats.map((sub, idx) => {
                                  const isEditingSub = editingSubcat && editingSubcat.categoryId === cat.id && editingSubcat.name === sub
                                  return (
                                    <div
                                      key={sub}
                                      className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:border-slate-300 transition-colors"
                                    >
                                      {isEditingSub ? (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={editingSubcatName}
                                            onChange={(e) => setEditingSubcatName(e.target.value)}
                                            className="px-2 py-0.5 border border-navy rounded text-xs bg-white focus:outline-none w-32"
                                            autoFocus
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleRenameSubcategory(cat.id, sub, editingSubcatName)}
                                            className="text-green-600 hover:text-green-700"
                                            title="Confirmar alteração"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingSubcat(null)}
                                            className="text-slate-400 hover:text-slate-500"
                                            title="Cancelar"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-0.5 mr-1 border-r border-slate-200 pr-1.5 flex-shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleReorderSubcategories(cat.id, uniqueSubcats, idx, 'up')}
                                              disabled={idx === 0 || isUpdatingSubcategory}
                                              className="text-slate-400 hover:text-navy disabled:opacity-30 p-0.5 transition-opacity"
                                              title="Mover para cima"
                                            >
                                              <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleReorderSubcategories(cat.id, uniqueSubcats, idx, 'down')}
                                              disabled={idx === uniqueSubcats.length - 1 || isUpdatingSubcategory}
                                              className="text-slate-400 hover:text-navy disabled:opacity-30 p-0.5 transition-opacity"
                                              title="Mover para baixo"
                                            >
                                              <ArrowDown className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <span>{sub}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingSubcat({ categoryId: cat.id, name: sub })
                                              setEditingSubcatName(sub)
                                            }}
                                            className="text-slate-400 hover:text-navy hover:bg-slate-100 p-0.5 rounded transition-colors"
                                            title="Renomear subcategoria"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSubcategory(cat.id, sub)}
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition-colors"
                                            title="Remover subcategoria"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                Nenhuma subcategoria cadastrada nesta categoria.
                              </p>
                            )}
                            
                            {/* Create Subcategory Input */}
                            <div className="pt-1">
                              {addingSubcatToCategory === cat.id ? (
                                <div className="flex items-center gap-2 max-w-sm">
                                  <input
                                    type="text"
                                    value={newSubcatNameValue}
                                    onChange={(e) => setNewSubcatNameValue(e.target.value)}
                                    placeholder="Nome da subcategoria..."
                                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleCreateSubcategory(cat.id)}
                                    disabled={!newSubcatNameValue.trim() || isUpdatingSubcategory}
                                    className="px-3 py-1.5 bg-navy text-white text-xs font-medium rounded hover:bg-navy-mid transition-colors disabled:opacity-50"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAddingSubcatToCategory(null)
                                      setNewSubcatNameValue('')
                                    }}
                                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-medium rounded transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddingSubcatToCategory(cat.id)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-dashed border-slate-300 rounded text-[11px] font-medium text-slate-500 hover:text-navy hover:border-navy hover:bg-slate-50 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Nova Subcategoria
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE GENERATOR */}
          {activeTab === 'qrcode' && (
            <div className="w-full py-2">
              <QRCodeDisplay />
            </div>
          )}


          {/* TAB 4: DATABASE & STORAGE */}
          {activeTab === 'storage' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Fotos & Mídia</h2>
                  <p className="text-xs text-slate-500">
                    Monitore o espaço ocupado pelas fotos do seu cardápio de forma simples e rápida.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchStorageStats}
                  disabled={isStorageLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:border-navy text-slate-700 hover:text-navy rounded-admin text-xs font-semibold bg-white transition-all disabled:opacity-50"
                >
                  <Loader2 className={`w-3.5 h-3.5 ${isStorageLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {isStorageLoading && storageFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-navy animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-500">Carregando estatísticas do servidor...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-white border border-slate-200 rounded-admin p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="p-2 bg-navy/10 rounded-lg text-navy">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Resumo do Armazenamento</h3>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Espaço ocupado em tempo real</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50 p-4 border border-slate-100 rounded-admin text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Fotos</span>
                        <span className="text-xl font-bold text-navy-dark">{storageFiles.length} arquivos</span>
                      </div>
                      <div className="bg-slate-50 p-4 border border-slate-100 rounded-admin text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Espaço Utilizado</span>
                        <span className="text-xl font-bold text-navy-dark">{formatBytes(totalStorageSize)}</span>
                      </div>
                    </div>

                    {/* Progress Bar showing percentage utilized of 1GB limit */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Capacidade de Armazenamento:</span>
                        <span className="font-bold text-navy-dark">
                          {((totalStorageSize / 1073741824) * 100).toFixed(3)}% utilizado
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                        <div 
                          className="h-full bg-navy rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(0.3, (totalStorageSize / 1073741824) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>0%</span>
                        <span>Limite Recomendado: 1.0 GB</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded p-4 text-[11px] text-slate-600 leading-relaxed border border-slate-200">
                      <p>
                        ✓ <strong>Otimização Automática Ativa</strong>: Sempre que você insere ou substitui uma imagem no cardápio, 
                        o sistema automaticamente ajusta o tamanho físico (800x600px) e realiza a compressão da foto no seu navegador antes de enviá-la ao servidor. 
                        Isso garante um carregamento muito mais rápido para os clientes do restaurante e economiza 90% do seu espaço de armazenamento!
                      </p>
                    </div>
                  </div>

                  {/* Garbage Collector / Inactive files Card */}
                  <div className="bg-white border border-slate-200 rounded-admin p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-800 text-sm">Otimização de Espaço e Limpeza</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Apague imagens inativas antigas (fotos substituídas ou de pratos excluídos no passado) para liberar espaço no servidor.
                      </p>
                    </div>

                    {orphanedFiles.length === 0 ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-admin text-green-800">
                        <div className="p-1.5 bg-green-600 text-white rounded-full flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider">Tudo Otimizado!</h4>
                          <p className="text-[11px] mt-0.5 text-green-700">
                            Excelente! Todas as fotos no servidor estão vinculadas a pratos ativos no cardápio do restaurante. Seu espaço está 100% otimizado e limpo.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-admin text-yellow-800">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider">Imagens Inativas Encontradas</h4>
                          <p className="text-[11px] mt-0.5 text-yellow-700 leading-relaxed">
                            Detectamos que existem <strong>{orphanedFiles.length} fotos antigas</strong> (de pratos editados ou excluídos anteriormente) que não estão mais sendo usadas no cardápio e estão ocupando <strong>{formatBytes(orphanedFiles.reduce((acc, f) => acc + (f.metadata?.size || f.size || 0), 0))}</strong> de forma inútil.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCleanOrphanedFiles}
                          disabled={isCleaningStorage}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-admin text-xs uppercase tracking-widest font-semibold shadow-sm transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {isCleaningStorage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Liberar Espaço Agora
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* PRODUCT FORM MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={isProductSaving ? undefined : () => setIsProductModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-admin shadow-xl p-6 z-10 overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <ProductForm
              initialData={editingProduct}
              categories={categories}
              products={products}
              onSubmit={handleProductSubmit}
              onCancel={() => setIsProductModalOpen(false)}
              isSaving={isProductSaving}
            />
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PRODUCT DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir o prato "${deletingProduct?.name}"? Esta ação é irreversível.`}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeletingProduct(null)}
        isConfirming={isProductDeleting}
      />

      {/* CONFIRM DELETE CATEGORY DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${deletingCategory?.name}"? Qualquer prato associado ficará temporariamente classificado como "Sem Categoria".`}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
        isConfirming={isCategoryDeleting}
      />
    </div>
  )
}

export default Admin
