import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.update({
        where: { email: 'thanhtai16012004@gmail.com' },
        data: { role: 'CUSTOMER' }
    })
    console.log('UPDATE_SUCCESS: Role changed to CUSTOMER for', user.email)
}

main().catch(console.error).finally(() => prisma.$disconnect())
