import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'employee@test.com'
    const user = await prisma.user.findUnique({
        where: { email },
        include: { employee: true }
    })

    if (!user || !user.employee) {
        console.error('Employee not found. Run create-test-employee.ts first.')
        return
    }

    const task = await prisma.employeeTask.create({
        data: {
            employeeId: user.employee.id,
            title: 'Kiểm tra kho vật liệu xây dựng',
            description: 'Chụp ảnh thực tế kho gạch và xi măng để đối chiếu tồn kho.',
            priority: 'HIGH',
            taskType: 'INVENTORY',
            dueDate: new Date(Date.now() + 86400000), // Tomorrow
        }
    })

    console.log('-----------------------------------')
    console.log('Đã giao 1 công việc mới cho nhân viên test:')
    console.log(`Tiêu đề: ${task.title}`)
    console.log(`Priority: ${task.priority}`)
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
