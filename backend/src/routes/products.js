const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const requireTenant = require('../middlewares/requireTenant')

// Rota pública: Listar produtos
router.get('/', async (req, res) => {
  const tenantId = req.query.tenant_id

  if (!tenantId) {
    return res.status(400).json({ error: 'tenant_id é obrigatório' })
  }

  try {
    const products = await prisma.product.findMany({
      where: { tenant_id: tenantId },
      orderBy: { display_order: 'asc' }
    })
    res.json(products)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar produtos' })
  }
})

// Rota protegida: Criar produto
router.post('/', requireTenant, async (req, res) => {
  const data = req.body

  if (data.tenant_id && data.tenant_id !== req.tenantId) {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  try {
    // Lógica para auto-criar Subcategory se houver uma (string)
    let subcategoryId = null
    if (data.subcategory) {
      const slug = data.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      let subcat = await prisma.subcategory.findFirst({
        where: { tenant_id: req.tenantId, category_id: data.category_id, name: data.subcategory }
      })
      if (!subcat) {
        subcat = await prisma.subcategory.create({
          data: {
            tenant_id: req.tenantId,
            category_id: data.category_id,
            name: data.subcategory,
            slug
          }
        })
      }
      subcategoryId = subcat.id
    }

    const product = await prisma.product.create({
      data: {
        tenant_id: req.tenantId,
        category_id: data.category_id,
        subcategory_id: subcategoryId,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        image_url: data.image_url || null,
        subcategory: data.subcategory || null,
        available: data.available !== undefined ? data.available : true,
        display_order: data.display_order || 0
      }
    })
    res.status(201).json(product)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar produto' })
  }
})

// Rota protegida: Atualizar produto individual
router.put('/:id', requireTenant, async (req, res) => {
  const { id } = req.params
  const data = req.body

  try {
    const existing = await prisma.product.findFirst({
      where: { id, tenant_id: req.tenantId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Produto não encontrado ou acesso negado' })
    }

    // Lógica para auto-criar Subcategory na atualização
    let subcategoryId = existing.subcategory_id
    if (data.subcategory !== undefined) { // Se enviou subcategoria
      if (!data.subcategory) {
        subcategoryId = null
      } else {
        const slug = data.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const targetCategoryId = data.category_id || existing.category_id
        let subcat = await prisma.subcategory.findFirst({
          where: { tenant_id: req.tenantId, category_id: targetCategoryId, name: data.subcategory }
        })
        if (!subcat) {
          subcat = await prisma.subcategory.create({
            data: {
              tenant_id: req.tenantId,
              category_id: targetCategoryId,
              name: data.subcategory,
              slug
            }
          })
        }
        subcategoryId = subcat.id
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: existing.id },
      data: {
        category_id: data.category_id,
        subcategory_id: subcategoryId,
        name: data.name,
        description: data.description,
        price: data.price !== undefined ? parseFloat(data.price) : undefined,
        image_url: data.image_url,
        subcategory: data.subcategory,
        available: data.available,
        display_order: data.display_order
      }
    })
    res.json(updatedProduct)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
})

// Rota protegida: Bulk update de produtos (para reordenação, etc)
router.put('/', requireTenant, async (req, res) => {
  const data = req.body

  if (data.action === 'upsert' && Array.isArray(data.items)) {
    // Bulk reorder
    try {
      const updates = data.items.map(p => {
        return prisma.product.updateMany({
          where: { id: p.id, tenant_id: req.tenantId },
          data: {
            display_order: p.display_order
          }
        })
      })

      await prisma.$transaction(updates)
      return res.json({ success: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Erro ao atualizar (upsert)' })
    }
  }

  if (data.action === 'rename_subcategory') {
    try {
      // Atualiza a entidade relacional
      await prisma.subcategory.updateMany({
        where: { category_id: data.category_id, name: data.oldName, tenant_id: req.tenantId },
        data: { name: data.newName, slug: data.newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
      })

      // Atualiza o legado (fallback)
      await prisma.product.updateMany({
        where: {
          category_id: data.category_id,
          subcategory: data.oldName,
          tenant_id: req.tenantId
        },
        data: { subcategory: data.newName }
      })
      return res.json({ success: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Erro ao renomear subcategoria' })
    }
  }
  
  if (data.action === 'clear_subcategory') {
    try {
      // Ao limpar uma subcategoria (todos os produtos dela perdem essa subcategoria)
      // Podemos opcionalmente deletar a entidade relacional Subcategory
      await prisma.subcategory.deleteMany({
        where: { category_id: data.category_id, name: data.subcategoryName, tenant_id: req.tenantId }
      })

      await prisma.product.updateMany({
        where: {
          category_id: data.category_id,
          subcategory: data.subcategoryName,
          tenant_id: req.tenantId
        },
        data: { subcategory: null, subcategory_id: null }
      })
      return res.json({ success: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Erro ao limpar subcategoria' })
    }
  }

  res.status(400).json({ error: 'Ação não suportada' })
})


// Rota protegida: Deletar produto
router.delete('/:id', requireTenant, async (req, res) => {
  const { id } = req.params

  try {
    const { count } = await prisma.product.deleteMany({
      where: { id, tenant_id: req.tenantId }
    })

    if (count === 0) {
      return res.status(404).json({ error: 'Produto não encontrado ou acesso negado' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao deletar produto' })
  }
})

// Deletar bulk (fantasma __SUBCAT__)
router.delete('/', requireTenant, async (req, res) => {
  const { name, category_id, subcategory } = req.query

  try {
    if (name === '__SUBCAT__') {
      await prisma.product.deleteMany({
        where: {
          name: '__SUBCAT__',
          category_id,
          subcategory,
          tenant_id: req.tenantId
        }
      })
      // Limpa também a tabela nova se estiver vazia? Por enquanto, mantemos a lógica simples
      await prisma.subcategory.deleteMany({
        where: { category_id, name: subcategory, tenant_id: req.tenantId }
      })
      return res.json({ success: true })
    }
    return res.status(400).json({ error: 'Ação inválida para deleção em lote' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro na deleção em lote' })
  }
})

module.exports = router
