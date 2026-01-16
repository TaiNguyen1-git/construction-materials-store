
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Resetting Purchase Requests status...')

    // Find requests that are CONVERTED or APPROVED to reset them
    // This helps the user test the flow again
    const result = await prisma.purchaseRequest.updateMany({
        where: {
            status: { in: ['CONVERTED', 'APPROVED'] }
        },
        data: {
            status: 'APPROVED', // Reset to APPROVED so user can act on them
            purchaseOrderId: null // Unlink any POs
        }
    })

    console.log(`Reset ${result.count} requests to APPROVED state.`)

    // Optionally delete the test POs if needed to fully reset
    // const deletedPos = await prisma.purchaseOrder.deleteMany({
    //   where: { createdBy: 'test-user' } 
    // })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
