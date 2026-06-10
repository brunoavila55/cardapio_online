import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import DecoHeader from '../components/menu/DecoHeader'
import CategoryNav from '../components/menu/CategoryNav'
import SubcategoryNav from '../components/menu/SubcategoryNav'
import SectionDivider from '../components/menu/SectionDivider'
import ProductCard from '../components/menu/ProductCard'

export function Menu() {
  const { categories, isLoading: isLoadingCategories, error: errorCategories } = useCategories()
  const { products, isLoading: isLoadingProducts, error: errorProducts } = useProducts()
  
  const [activeCategoryId, setActiveCategoryId] = useState('')
  const [activeSubcategory, setActiveSubcategory] = useState('')

  // Automatically select the first category once categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  // Get active products for the currently selected category to calculate its subcategories
  const getActiveProductsOfSelectedCategory = () => {
    if (!products || !activeCategoryId) return []
    return products.filter((p) => p.category_id === activeCategoryId && p.available)
  }

  const activeProducts = getActiveProductsOfSelectedCategory()
  const activeSubcategories = Array.from(
    new Set(activeProducts.map((p) => p.subcategory).filter(Boolean))
  ).sort((a, b) => {
    const minA = Math.min(...activeProducts.filter((p) => p.subcategory === a).map((p) => p.display_order ?? 0))
    const minB = Math.min(...activeProducts.filter((p) => p.subcategory === b).map((p) => p.display_order ?? 0))
    return minA - minB
  })

  const handleSelectCategory = (categoryId) => {
    setActiveCategoryId(categoryId)
    setActiveSubcategory('') // Reset active subcategory when switching main category
    
    const element = document.getElementById(`category-section-${categoryId}`)
    if (element) {
      const offset = 48 // Approximately height of CategoryNav
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleSelectSubcategory = (subName) => {
    setActiveSubcategory(subName)
    
    const elementId = subName 
      ? `subcategory-section-${activeCategoryId}-${subName}`
      : `category-section-${activeCategoryId}`
      
    const element = document.getElementById(elementId)
    if (element) {
      // Calculate scroll offset taking both sticky navbars into account
      const categoryNavHeight = 44
      const subcategoryNavHeight = activeSubcategories.length > 1 ? 34 : 0
      const totalOffset = categoryNavHeight + subcategoryNavHeight + 8
      
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - totalOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const isLoading = isLoadingCategories || isLoadingProducts
  // Silent error state for client: no raw logs or stacks, just a clean empty cardapio state
  const hasError = errorCategories || errorProducts

  // Group products of a category by subcategory
  const getGroupedProductsByCategory = (categoryId) => {
    const categoryProducts = products.filter((prod) => prod.category_id === categoryId && prod.available)
    const groups = {}
    
    categoryProducts.forEach((prod) => {
      const sub = prod.subcategory || 'Outros'
      if (!groups[sub]) groups[sub] = []
      groups[sub].push(prod)
    })
    return groups
  }

  // Pure Skeleton Loader conforming to requirements
  const SkeletonLoader = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-item"
          style={{
            height: '140px',
            background: 'var(--navy-light)',
            opacity: 0.4,
            borderRadius: '0px',
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  )

  return (
    <div
      style={{
        backgroundColor: 'var(--white)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. DecoHeader at the top */}
      <DecoHeader />

      {/* 2. Sticky Double-Decker Navbars */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%',
        }}
      >
        {!isLoading && !hasError && categories.length > 0 && (
          <>
            <CategoryNav
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelectCategory={handleSelectCategory}
            />
            {activeCategoryId && activeSubcategories.length > 1 && (
              <SubcategoryNav
                subcategories={activeSubcategories}
                activeSubcategory={activeSubcategory}
                onSelectSubcategory={handleSelectSubcategory}
              />
            )}
          </>
        )}
      </div>

      {/* 3. Main Menu Content area: padding 0 16px 40px */}
      <main
        style={{
          padding: '0 16px 40px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          flexGrow: 1,
        }}
      >
        {isLoading ? (
          <div style={{ marginTop: '24px' }}>
            <SkeletonLoader />
          </div>
        ) : hasError || categories.length === 0 ? (
          /* Silent Empty state instead of crashing errors */
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              color: 'var(--bronze)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontStyle: 'italic',
                color: 'var(--navy)',
                marginBottom: '10px',
              }}
            >
              Cardápio Indisponível
            </span>
            <p style={{ fontSize: '10px', letterSpacing: '0.05em', maxWidth: '300px', lineHeight: '1.6' }}>
              Nosso cardápio digital está sendo atualizado. Por favor, solicite a versão física ao garçom ou tente novamente mais tarde.
            </p>
          </div>
        ) : (
          /* Category Sections and Product Cards */
          categories.map((category) => {
            const grouped = getGroupedProductsByCategory(category.id)
            const subKeys = Object.keys(grouped).sort((a, b) => {
              if (a === 'Outros') return 1
              if (b === 'Outros') return -1
              const minA = Math.min(...grouped[a].map((p) => p.display_order ?? 0))
              const minB = Math.min(...grouped[b].map((p) => p.display_order ?? 0))
              return minA - minB
            })
            if (subKeys.length === 0) return null

            return (
              <section
                key={category.id}
                id={`category-section-${category.id}`}
                style={{ scrollMarginTop: '100px' }} // Provides breathing space after scrolling
              >
                {/* Category Title Segment Divider */}
                <SectionDivider title={category.name} />

                {/* Subcategories Subsection Loop */}
                {subKeys.map((subName) => {
                  const subProducts = grouped[subName]
                  if (subProducts.length === 0) return null

                  return (
                    <div
                      key={subName}
                      id={`subcategory-section-${category.id}-${subName}`}
                      style={{ 
                        scrollMarginTop: '100px',
                        marginBottom: '32px' 
                      }}
                    >
                      {/* Elegant subcategory header */}
                      {subName !== 'Outros' && subKeys.length > 1 && (
                        <h3
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '14px',
                            fontWeight: '600',
                            fontStyle: 'italic',
                            color: 'var(--bronze)',
                            paddingBottom: '6px',
                            marginBottom: '14px',
                            borderBottom: '1px dashed rgba(201,168,76,0.22)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {subName}
                        </h3>
                      )}

                      {/* Grid with 1 column on mobile (list style) and 2 on desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })
        )}
      </main>

      {/* Footer matching colors */}
      <footer
        style={{
          backgroundColor: 'var(--navy-dark)',
          borderTop: '1px solid var(--gold)',
          padding: '24px 16px',
          textAlign: 'center',
          marginTop: 'auto',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '8px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--gold-light)',
            margin: 0,
          }}
        >
          © {new Date().getFullYear()} {import.meta.env.VITE_HOTEL_NAME || 'Nome do Estabelecimento'}. Todos os direitos reservados.
        </p>

        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '7px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold-pale)',
            opacity: 0.65,
            margin: '6px 0 0 0',
          }}
        >
          Desenvolvido por IP6 Networks
        </p>

        <Link
          to="/login"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '7px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold-pale)',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '12px',
            opacity: 0.35,
            transition: 'opacity 200ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.35'}
        >
          Acesso Restrito
        </Link>
      </footer>
    </div>
  )
}

export default Menu
