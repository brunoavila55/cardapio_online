const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const requireTenant = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro de token' })
  }

  const [scheme, token] = parts

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Obter o tenant atual e o usuário para validar status e role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { tenant: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    if (user.tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Conta suspensa. Entre em contato com o suporte.' })
    }

    const tenantSlug = req.headers['x-tenant-slug']
    if (tenantSlug && tenantSlug !== user.tenant.slug && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Mismatch de tenant: O slug acessado não corresponde à sua conta.' })
    }

    req.user = user
    req.tenantId = user.tenant_id
    req.tenantSlug = user.tenant.slug
    
    // Opcional: Manter req.userId para compatibilidade com código existente
    req.userId = user.id

    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

module.exports = requireTenant
