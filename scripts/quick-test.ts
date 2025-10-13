import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickTest() {
  try {
    console.log('🔍 Testing Prisma connection...\n')

    // Test 1: Count products
    const productCount = await prisma.product.count()
    console.log(`✅ Total products in DB: ${productCount}`)

    // Test 2: Get products with relations
    const products = await prisma.product.findMany({
      include: {
        category: true,
        inventoryItem: true
      },
      take: 5
    })
    console.log(`✅ Retrieved ${products.length} products with relations`)
    
    if (products.length > 0) {
      console.log('\n📦 First product:')
      console.log(`   Name: ${products[0].name}`)
      console.log(`   Price: ${products[0].price}`)
      console.log(`   Category: ${products[0].category.name}`)
      console.log(`   Stock: ${products[0].inventoryItem?.availableQuantity || 0}`)
    }

    // Test 3: Count categories
    const categoryCount = await prisma.category.count()
    console.log(`\n✅ Total categories: ${categoryCount}`)

    console.log('\n✅ Prisma connection is working!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickTest()
