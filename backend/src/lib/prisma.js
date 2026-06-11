const { PrismaClient } = require('@prisma/client')

const prismaClient = new PrismaClient()

const prisma = prismaClient.$extends({
  query: {
    category: {
      async create({ args, query }) {
        const result = await query(args)
        if (result.tenant_id) {
          await prismaClient.tenantOnboarding.updateMany({
            where: { tenant_id: result.tenant_id },
            data: { has_created_category: true }
          }).catch(err => console.error('Erro ao atualizar onboarding:', err))
        }
        return result
      }
    },
    product: {
      async create({ args, query }) {
        const result = await query(args)
        if (result.tenant_id) {
          await prismaClient.tenantOnboarding.updateMany({
            where: { tenant_id: result.tenant_id },
            data: { has_created_product: true }
          }).catch(err => console.error('Erro ao atualizar onboarding:', err))
        }
        return result
      }
    }
  }
})

module.exports = prisma
