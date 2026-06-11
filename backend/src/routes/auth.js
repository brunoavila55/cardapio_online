const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { sendEmail } = require('../lib/email')
const requireTenant = require('../middlewares/requireTenant')
const requireRole = require('../middlewares/requireRole')

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-dev'
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'reset-secret-dev'
const INVITE_TOKEN_SECRET = process.env.INVITE_TOKEN_SECRET || 'invite-secret-dev'

const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, tenant_id: user.tenant_id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // JWT curto (15 minutos)
  )
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, tenant_id: user.tenant_id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' } // Refresh longo (30 dias)
  )
  return { token, refreshToken }
}

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
  })
}
router.post('/register', async (req, res) => {
  const { restaurantName, slug, email, password } = req.body

  if (!restaurantName || !slug || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
  }

  // Validação básica do subdomínio (apenas letras minúsculas, números e hífens)
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    return res.status(400).json({ error: 'Subdomínio inválido. Use apenas letras minúsculas, números e hífens.' })
  }

  try {
    // Verifica se subdomínio já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return res.status(400).json({ error: 'Este subdomínio já está em uso.' })
    }

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' })
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: restaurantName,
          slug,
          primary_color: '#1E2A7A', // default
          onboarding: {
            create: {}
          }
        }
      })

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          tenant_id: tenant.id
        }
      })

      return { tenant, user }
    })

    const { token, refreshToken } = generateTokens(result.user)
    setRefreshTokenCookie(res, refreshToken)

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        user_metadata: {
          tenant_id: result.tenant.id
        }
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const { token, refreshToken } = generateTokens(user)
    setRefreshTokenCookie(res, refreshToken)

    // Formata o usuário para ser compativel com o frontend (user_metadata)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        user_metadata: {
          tenant_id: user.tenant_id
        }
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token ausente' })
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user) {
      return res.status(401).json({ error: 'Usuário inválido' })
    }

    const tokens = generateTokens(user)
    setRefreshTokenCookie(res, tokens.refreshToken)

    res.json({ token: tokens.token })
  } catch (err) {
    return res.status(403).json({ error: 'Refresh token inválido ou expirado' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  res.json({ message: 'Logout realizado com sucesso' })
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' })

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Retorna sucesso para evitar vazamento de dados de usuários existentes
      return res.json({ message: 'Se o e-mail existir, um link de recuperação foi enviado.' })
    }

    const resetToken = jwt.sign({ id: user.id }, RESET_TOKEN_SECRET, { expiresIn: '1h' })
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

    await sendEmail({
      to: user.email,
      subject: 'Recuperação de Senha - Cardápio Online',
      html: `<p>Você solicitou a recuperação de senha.</p><p><a href="${resetLink}">Clique aqui para redefinir sua senha</a></p><p>Este link expira em 1 hora.</p>`
    })

    res.json({ message: 'Se o e-mail existir, um link de recuperação foi enviado.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao processar solicitação' })
  }
})

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' })

  try {
    const decoded = jwt.verify(token, RESET_TOKEN_SECRET)
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Senha redefinida com sucesso' })
  } catch (err) {
    return res.status(400).json({ error: 'Token inválido ou expirado' })
  }
})

router.post('/invite', requireTenant, requireRole(['owner', 'manager']), async (req, res) => {
  const { email, role } = req.body
  
  if (!email || !role) {
    return res.status(400).json({ error: 'Email e role são obrigatórios' })
  }

  // Apenas donos podem convidar gerentes ou outros donos
  if (req.user.role !== 'owner' && ['owner', 'manager'].includes(role)) {
    return res.status(403).json({ error: 'Permissão insuficiente para convidar este papel' })
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe na plataforma' })
    }

    const inviteToken = jwt.sign(
      { email, role, tenant_id: req.tenantId },
      INVITE_TOKEN_SECRET,
      { expiresIn: '48h' }
    )

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const inviteLink = `${frontendUrl}/accept-invite?token=${inviteToken}`

    await sendEmail({
      to: email,
      subject: `Convite para equipe - ${req.user.tenant.name}`,
      html: `<p>Você foi convidado para a equipe do restaurante <b>${req.user.tenant.name}</b> com o papel de <b>${role}</b>.</p><p><a href="${inviteLink}">Clique aqui para aceitar o convite e definir sua senha</a></p><p>Este convite expira em 48 horas.</p>`
    })

    res.json({ message: 'Convite enviado com sucesso' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao enviar convite' })
  }
})

router.post('/accept-invite', async (req, res) => {
  const { token, password } = req.body
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token e senha são obrigatórios' })
  }

  try {
    const decoded = jwt.verify(token, INVITE_TOKEN_SECRET)
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: decoded.email,
        password: hashedPassword,
        role: decoded.role,
        tenant_id: decoded.tenant_id
      }
    })

    res.status(201).json({ message: 'Conta criada com sucesso' })
  } catch (err) {
    return res.status(400).json({ error: 'Convite inválido ou expirado' })
  }
})

// Rota utilitária de me() para verificar o token e retornar os dados
router.get('/me', require('../middlewares/requireTenant'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        user_metadata: {
          tenant_id: user.tenant_id
        }
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

module.exports = router
