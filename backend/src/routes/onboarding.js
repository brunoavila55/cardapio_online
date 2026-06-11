const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const requireTenant = require('../middlewares/requireTenant')

// GET /api/onboarding
// Retorna o status de onboarding do tenant
router.get('/', requireTenant, async (req, res) => {
  try {
    let onboarding = await prisma.tenantOnboarding.findUnique({
      where: { tenant_id: req.tenantId }
    })

    if (!onboarding) {
      // Cria fallback se não existir (para contas antigas)
      onboarding = await prisma.tenantOnboarding.create({
        data: { tenant_id: req.tenantId }
      })
    }

    res.json(onboarding)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar status de onboarding' })
  }
})

// PUT /api/onboarding/theme
// Marca a etapa de tema como concluída
router.put('/theme', requireTenant, async (req, res) => {
  try {
    const onboarding = await prisma.tenantOnboarding.update({
      where: { tenant_id: req.tenantId },
      data: { has_customized_theme: true }
    })

    // Se as outras estiverem completas, podemos marcar is_completed = true
    if (onboarding.has_created_category && onboarding.has_created_product && onboarding.has_customized_theme) {
      await prisma.tenantOnboarding.update({
        where: { tenant_id: req.tenantId },
        data: { is_completed: true }
      })
      onboarding.is_completed = true
    }

    res.json(onboarding)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar onboarding do tema' })
  }
})

// PUT /api/onboarding/complete
// Força marcação de tudo concluído manualmente
router.put('/complete', requireTenant, async (req, res) => {
  try {
    const onboarding = await prisma.tenantOnboarding.update({
      where: { tenant_id: req.tenantId },
      data: { is_completed: true }
    })
    res.json(onboarding)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao completar onboarding' })
  }
})

module.exports = router
