const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const tenantSlug = 'loja-teste-01'
  const userEmail = 'admin@teste.com'
  const password = 'password123'

  console.log(`Buscando ou criando tenant ${tenantSlug}...`)
  
  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Loja de Teste 01',
        slug: tenantSlug,
        status: 'active',
        plan: 'free',
        trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 dias
      }
    })
    console.log('Tenant criado:', tenant.id)
  }

  console.log(`Buscando ou criando usuário ${userEmail}...`)
  
  let user = await prisma.user.findUnique({ where: { email: userEmail } })
  
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10)
    user = await prisma.user.create({
      data: {
        tenant_id: tenant.id,
        email: userEmail,
        password: hashedPassword,
        role: 'superadmin' // Já coloco como superadmin pra facilitar o teste
      }
    })
    console.log('Usuário criado:', user.email)
  } else {
    console.log('Usuário já existe, promovendo a superadmin...')
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'superadmin' }
    })
  }

  console.log('\n--- DADOS DE LOGIN ---')
  console.log('Email:', userEmail)
  console.log('Senha:', password)
  console.log('----------------------\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
