import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking VIP customer data...')

    const user = await prisma.user.findUnique({
        where: { email: 'vip.customer@example.com' },
        include: {
            customer: true
        }
    })

    if (!user) {
        console.log('User vip.customer@example.com not found!')
        return
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name
    })

    if (!user.customer) {
        console.log('No customer record found for this user!')
    } else {
        console.log('Customer record:', user.customer)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
