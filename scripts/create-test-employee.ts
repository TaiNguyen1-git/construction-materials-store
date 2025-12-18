import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'employee@test.com'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    // 1. Create or Update User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'EMPLOYEE',
        },
        create: {
            email,
            name: 'Nhân Viên Test',
            password: hashedPassword,
            role: 'EMPLOYEE',
        },
    })

    // 2. Create or Update Employee profile
    const employee = await prisma.employee.upsert({
        where: { userId: user.id },
        update: {
            isActive: true,
            department: 'Kỹ Thuật',
            position: 'Cố Vấn',
        },
        create: {
            userId: user.id,
            employeeCode: 'NV_TEST_001',
            department: 'Kỹ Thuật',
            position: 'Cố Vấn',
            baseSalary: 10000000,
            isActive: true,
            hireDate: new Date(),
        },
    })
    console.log('Employee upserted:', employee);

    console.log('-----------------------------------')
    console.log('Tài khoản nhân viên test đã sẵn sàng:')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log('-----------------------------------')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
