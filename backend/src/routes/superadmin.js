const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const requireSuperAdmin = require('../middlewares/requireSuperAdmin')
const jwt = require('jsonwebtoken')

// Aplicar middleware de superadmin para todas as rotas neste arquivo
router.use(requireSuperAdmin)

// GET /api/superadmin/tenants
// Retorna a lista de tenants e estatísticas básicas
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, products: true, categories: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    
    // Calculando métricas SaaS
    const metrics = {
      total_tenants: tenants.length,
      active_tenants: tenants.filter(t => t.status === 'active').length,
      trial_tenants: tenants.filter(t => t.status === 'trial').length,
      suspended_tenants: tenants.filter(t => t.status === 'suspended').length
    }

    res.json({ metrics, tenants })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar tenants' })
  }
})

// PUT /api/superadmin/tenants/:id/status
// Suspende ou ativa um tenant
router.put('/tenants/:id/status', async (req, res) => {
  const { id } = req.params
  const { status } = req.body // trial | active | suspended

  if (!['trial', 'active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' })
  }

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { status }
    })
    res.json(updatedTenant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar status do tenant' })
  }
})

// PUT /api/superadmin/tenants/:id/plan
// Troca o plano de um tenant
router.put('/tenants/:id/plan', async (req, res) => {
  const { id } = req.params
  const { plan } = req.body // free | starter | pro

  if (!['free', 'starter', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Plano inválido' })
  }

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { plan }
    })
    res.json(updatedTenant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar plano do tenant' })
  }
})

// POST /api/superadmin/impersonate/:tenantId
// Gera um token para acessar o painel como um dono de outro tenant
router.post('/impersonate/:tenantId', async (req, res) => {
  const { tenantId } = req.params

  try {
    const targetTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { role: 'owner' },
          take: 1
        }
      }
    })

    if (!targetTenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' })
    }

    // Identificar o dono da conta (ou um admin qualquer)
    const targetUser = targetTenant.users[0]
    
    if (!targetUser) {
      return res.status(400).json({ error: 'Este tenant não possui um owner para ser impersonado' })
    }

    // Gerar um access token (curto) "disfarçado" como o owner do tenant
    const accessToken = jwt.sign(
      {
        id: targetUser.id,
        email: targetUser.email,
        tenant_id: targetTenant.id,
        role: targetUser.role,
        impersonated_by: req.userId // Marca que é um token impersonado (segurança para auditoria)
      },
      process.env.JWT_SECRET || 'secret_dev',
      { expiresIn: '1h' }
    )

    res.json({ token: accessToken, tenant: targetTenant })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao gerar token de impersonação' })
  }
})

module.exports = router
