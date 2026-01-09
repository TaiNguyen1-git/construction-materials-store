
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const supplierEmail = 'thanhtai16012004@gmail.com'

    // 1. Get the Test Supplier
    const supplier = await prisma.supplier.findFirst({
        where: { email: supplierEmail }
    })

    if (!supplier) {
        console.log('Supplier not found')
        return
    }

    console.log(`Updating prices for supplier: ${supplier.name}`)

    // 2. Get all products
    const products = await prisma.product.findMany()

    // 3. Create or Update SupplierProduct for each product
    for (const product of products) {
        const unitPrice = product.price * 0.8 // Let's say supplier price is 80% of retail price

        await prisma.supplierProduct.upsert({
            where: {
                supplierId_productId: {
                    supplierId: supplier.id,
                    productId: product.id
                }
            },
            create: {
                supplierId: supplier.id,
                productId: product.id,
                unitPrice,
                leadTimeDays: 3,
                minOrderQty: 10,
                isPreferred: true
            },
            update: {
                unitPrice, // Update price if already exists
                isPreferred: true
            }
        })
    }

    console.log(`Updated prices for ${products.length} products.`)

    // 4. Reset Requests again just to be sure
    await prisma.purchaseRequest.updateMany({
        where: {
            status: { in: ['CONVERTED', 'REJECTED'] }
        },
        data: {
            status: 'APPROVED',
            purchaseOrderId: null
        }
    })
    console.log('Requests reset to APPROVED.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
