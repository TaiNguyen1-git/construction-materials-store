import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('📊 Checking database data...\n')

    // Check categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
    console.log(`✅ Categories: ${categories.length}`)
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat._count.products} products)`)
    })

    // Check products
    const products = await prisma.product.findMany({
      include: {
        category: true,
        inventoryItem: true
      }
    })
    console.log(`\n✅ Products: ${products.length}`)
    products.forEach(prod => {
      console.log(`   - ${prod.name} (${prod.sku}) - ${prod.price.toLocaleString()}đ`)
      console.log(`     Category: ${prod.category.name}`)
      console.log(`     Stock: ${prod.inventoryItem?.availableQuantity || 0}`)
    })

    // Check suppliers
    const suppliers = await prisma.supplier.count()
    console.log(`\n✅ Suppliers: ${suppliers}`)

    // Check users
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        name: true
      }
    })
    console.log(`\n✅ Users: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.name}`)
    })

    // Check orders
    const orders = await prisma.order.count()
    console.log(`\n✅ Orders: ${orders}`)

    console.log('\n🎉 Database check complete!')

  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
