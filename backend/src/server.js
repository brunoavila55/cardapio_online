const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const app = express()

const pinoHttp = require('pino-http')
const errorHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser')

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(pinoHttp({
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
}))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Rotas
const authRoutes = require('./routes/auth')
const tenantRoutes = require('./routes/tenants')
const categoryRoutes = require('./routes/categories')
const productRoutes = require('./routes/products')
const uploadRoutes = require('./routes/upload')
const onboardingRouter = require('./routes/onboarding')
const superadminRouter = require('./routes/superadmin')

app.use('/api/auth', authRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/onboarding', onboardingRouter)
app.use('/api/superadmin', superadminRouter)

// Handler global de erros
app.use(errorHandler)

if (require.main === module) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
  })
}

module.exports = app
