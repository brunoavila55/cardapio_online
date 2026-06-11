const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const requireTenant = require('../middlewares/requireTenant')

// Rota pública para listar categorias de um tenant específico
router.get('/', async (req, res) => {
  const tenantId = req.query.tenant_id

  if (!tenantId) {
    return res.status(400).json({ error: 'tenant_id é obrigatório' })
  }

  try {
    const categories = await prisma.category.findMany({
      where: { tenant_id: tenantId },
      orderBy: { display_order: 'asc' }
    })
    res.json(categories)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

// Rota protegida: Criar categoria
router.post('/', requireTenant, async (req, res) => {
  const { name, slug, display_order, tenant_id } = req.body

  if (tenant_id && tenant_id !== req.tenantId) {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        display_order: display_order || 0,
        tenant_id: req.tenantId
      }
    })
    res.status(201).json(category)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar categoria' })
  }
})

// Rota protegida: Atualizar categoria (single item ou array)
router.put('/:id', requireTenant, async (req, res) => {
  const { id } = req.params
  
  try {
    // Validar se a categoria pertence ao tenant
    const existing = await prisma.category.findFirst({
      where: { id, tenant_id: req.tenantId }
    })
    
    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada ou acesso negado' })
    }

    const { name, slug, display_order } = req.body

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, display_order }
    })
    res.json(category)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar categoria' })
  }
})

// Upsert array of categories for reordering
router.put('/', requireTenant, async (req, res) => {
  const categories = req.body // array

  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: 'Corpo deve ser um array' })
  }

  try {
    // Para simplificar, faremos um loop usando transação
    const updates = categories.map(cat => {
      // Garantimos que o update restringe por tenantId localmente validando. Mas no raw do prisma:
      return prisma.category.updateMany({
        where: { id: cat.id, tenant_id: req.tenantId },
        data: {
          display_order: cat.display_order
        }
      })
    })

    await prisma.$transaction(updates)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar categorias' })
  }
})

// Rota protegida: Deletar categoria
router.delete('/:id', requireTenant, async (req, res) => {
  const { id } = req.params

  try {
    const { count } = await prisma.category.deleteMany({
      where: { id, tenant_id: req.tenantId }
    })
    
    if (count === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada ou acesso negado' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao deletar categoria' })
  }
})

module.exports = router
