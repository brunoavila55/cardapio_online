const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando migração de subcategorias implícitas para relacionais...')

  // 1. Pegar todos os produtos que possuem o campo legado preenchido
  const productsWithSubcategory = await prisma.product.findMany({
    where: { subcategory: { not: null } }
  })

  if (productsWithSubcategory.length === 0) {
    console.log('Nenhum produto com subcategoria legada encontrado.')
    return
  }

  // Agrupar subcategorias por category_id + tenant_id
  const subcategoryMap = {}

  for (const product of productsWithSubcategory) {
    const key = `${product.tenant_id}_${product.category_id}_${product.subcategory}`
    
    if (!subcategoryMap[key]) {
      // Criar slug simples
      const slug = product.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      // Checa se já existe no banco
      let subcat = await prisma.subcategory.findFirst({
        where: {
          tenant_id: product.tenant_id,
          category_id: product.category_id,
          name: product.subcategory
        }
      })

      if (!subcat) {
        subcat = await prisma.subcategory.create({
          data: {
            tenant_id: product.tenant_id,
            category_id: product.category_id,
            name: product.subcategory,
            slug,
            // Mantém a ordem original do primeiro produto que definir essa subcategoria
            display_order: product.display_order 
          }
        })
        console.log(`Subcategoria criada: ${subcat.name} (Cat: ${subcat.category_id})`)
      }
      
      subcategoryMap[key] = subcat.id
    }

    // Atualiza o produto com o ID da nova tabela
    await prisma.product.update({
      where: { id: product.id },
      data: { subcategory_id: subcategoryMap[key] }
    })
  }

  console.log(`Migração concluída! ${productsWithSubcategory.length} produtos atualizados.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
