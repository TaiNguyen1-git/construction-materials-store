
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'thanhtai16012004@gmail.com'

    // Check if exists
    const existing = await prisma.supplier.findFirst({
        where: { email }
    })

    if (existing) {
        console.log(`Supplier with email ${email} already exists:`, existing.name)
        return
    }

    const supplier = await prisma.supplier.create({
        data: {
            name: 'Nhà Cung Cấp Test (Tài)',
            email: email,
            contactPerson: 'Thành Tài',
            phone: '0909123456',
            address: 'TP. Hồ Chí Minh',
            isActive: true,
            rating: 5,
        }
    })

    console.log('Created test supplier:', supplier)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
