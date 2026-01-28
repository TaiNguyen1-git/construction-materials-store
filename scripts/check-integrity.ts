
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const productsWithoutInventory = await prisma.product.findMany({
    where: {
      inventoryItem: {
        is: null
      }
    }
  })

  console.log(`Found ${productsWithoutInventory.length} products without inventory items.`)
  if (productsWithoutInventory.length > 0) {
    console.log('Sample products without inventory:', productsWithoutInventory.slice(0, 5).map(p => p.name))
  }

  const customers = await prisma.customer.findMany({
    take: 5
  })
  console.log('Sample customers:', customers.map(c => ({ id: c.id, type: c.customerType, verified: c.contractorVerified })))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
