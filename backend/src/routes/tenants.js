const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const requireTenant = require('../middlewares/requireTenant')

// Rota pública para pegar as informações de um tenant via subdomínio
router.get('/by-slug/:slug', async (req, res) => {
  const { slug } = req.params

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        status: true,
        primary_color: true
      }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' })
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Conta suspensa. Acesso ao painel indisponível.' })
    }

    res.json(tenant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar dados do restaurante' })
  }
})

// Rota protegida para buscar o tenant pelo ID (usado no painel)
router.get('/:id', requireTenant, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId }, // Garante buscar apenas o próprio tenant
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        status: true,
        primary_color: true
      }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' })
    }

    res.json(tenant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar configurações' })
  }
})

// Rota protegida para atualizar as configurações do tenant do usuário
router.put('/:id', requireTenant, async (req, res) => {
  const { name, primary_color, logo_url } = req.body

  try {
    // Usar req.tenantId garantido pelo token em vez de confiar no id da URL
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: {
        name,
        primary_color,
        logo_url
      }
    })

    res.json(tenant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar configurações' })
  }
})

module.exports = router
