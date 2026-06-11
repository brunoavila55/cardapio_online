const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('Nenhum usuário no DB')
      return
    }
    console.log('Primeiro usuário encontrado:', user.email)
    await prisma.user.update({
      where: { email: user.email },
      data: { role: 'superadmin' }
    })
    console.log(`Sucesso: Usuário ${user.email} promovido a Super Admin!`)
    return
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`Usuário com email ${email} não encontrado.`)
    process.exit(1)
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'superadmin' }
  })

  console.log(`Sucesso: Usuário ${email} promovido a Super Admin!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
