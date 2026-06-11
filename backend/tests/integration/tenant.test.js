const request = require('supertest')
const app = require('../../src/server')
const prisma = require('../../src/lib/prisma')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

let tenantA, tenantB, tenantSuspended, userA, userSuspended, tokenA, tokenSuspended, categoryB, productB

beforeAll(async () => {
  // Limpar dados para evitar conflitos
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  // Criar Tenant A e User A
  tenantA = await prisma.tenant.create({
    data: { name: 'Tenant A', slug: 'tenant-a' }
  })
  
  userA = await prisma.user.create({
    data: { 
      email: 'usera@test.com', 
      password: await bcrypt.hash('123456', 10),
      tenant_id: tenantA.id
    }
  })

  tokenA = jwt.sign(
    { id: userA.id, email: userA.email, tenant_id: tenantA.id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  )

  // Criar Tenant B, User B, Categoria B e Produto B
  tenantB = await prisma.tenant.create({
    data: { name: 'Tenant B', slug: 'tenant-b' }
  })

  categoryB = await prisma.category.create({
    data: { name: 'Cat B', slug: 'cat-b', tenant_id: tenantB.id }
  })

  productB = await prisma.product.create({
    data: {
      name: 'Prod B',
      price: 10,
      tenant_id: tenantB.id,
      category_id: categoryB.id
    }
  })

  // Criar Tenant Suspenso
  tenantSuspended = await prisma.tenant.create({
    data: { name: 'Suspended', slug: 'suspended', status: 'suspended' }
  })

  userSuspended = await prisma.user.create({
    data: {
      email: 'sus@test.com',
      password: await bcrypt.hash('123', 10),
      tenant_id: tenantSuspended.id
    }
  })

  tokenSuspended = jwt.sign(
    { id: userSuspended.id, tenant_id: tenantSuspended.id },
    process.env.JWT_SECRET || 'test-secret'
  )
})

afterAll(async () => {
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.$disconnect()
})

describe('Multitenancy Security', () => {
  it('Deve bloquear Tenant A de atualizar o Produto de Tenant B (Retornar 404/403)', async () => {
    const res = await request(app)
      .put(`/api/products/${productB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Hacked Name',
        price: 1,
        category_id: categoryB.id
      })

    // Como o produto não será encontrado pro tenant_id A, o código retorna 404 (Produto não encontrado ou acesso negado)
    expect(res.statusCode).toBe(404)
    
    // Garantir que o produto B não mudou no banco
    const p = await prisma.product.findUnique({ where: { id: productB.id } })
    expect(p.name).toBe('Prod B')
  })

  it('Deve bloquear Tenant A de deletar a Categoria de Tenant B', async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.statusCode).toBe(404)

    const c = await prisma.category.findUnique({ where: { id: categoryB.id } })
    expect(c).not.toBeNull()
  })

  it('Deve rejeitar com 403 se o Tenant estiver suspenso', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenSuspended}`)
      .send({ name: 'Cat Test', slug: 'cat-test' })

    expect(res.statusCode).toBe(403)
    expect(res.body.error).toMatch(/suspensa/)
  })
})
