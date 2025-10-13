import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPIQuery() {
  try {
    console.log('🔍 Testing same query as API route...\n')

    // Simulate default params from API
    const page = 1
    const limit = 20
    const skip = (page - 1) * limit
    const sortBy = 'createdAt'
    const sortOrder = 'desc'

    // Empty where clause (no filters)
    const where: any = {}
    const orderBy: any = { [sortBy]: sortOrder }

    console.log('Where clause:', JSON.stringify(where, null, 2))
    console.log('OrderBy:', JSON.stringify(orderBy, null, 2))
    console.log('Skip:', skip, 'Limit:', limit)
    console.log('')

    // Same query as API
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true }
          },
          inventoryItem: {
            select: { quantity: true, availableQuantity: true, minStockLevel: true }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ])

    console.log(`✅ Query returned ${products.length} products`)
    console.log(`✅ Total count: ${total}`)
    
    if (products.length > 0) {
      console.log('\n📦 First product:')
      console.log(JSON.stringify(products[0], null, 2))
    } else {
      console.log('\n❌ No products found!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIQuery()
