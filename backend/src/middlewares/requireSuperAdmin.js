const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Token mal formatado' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev')

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    if (user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acesso restrito apenas a super administradores' })
    }

    req.userId = user.id
    req.userRole = user.role
    
    // We don't strictly require tenant checks for superadmin actions that are cross-tenant,
    // but we inject tenantId if the superadmin wants to impersonate or has a home tenant.
    req.tenantId = user.tenant_id

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = requireSuperAdmin
