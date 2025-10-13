import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@smartbuild.vn' },
      update: {
        password: hashedPassword,
        role: 'MANAGER',
      },
      create: {
        email: 'admin@smartbuild.vn',
        name: 'Admin SmartBuild',
        password: hashedPassword,
        role: 'MANAGER',
        phone: '0987654321',
        address: '123 Đường Xây Dựng, TP.HCM',
      },
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminUser.email)
    console.log('🔐 Password: admin123')
    console.log('👤 Role:', adminUser.role)
    console.log('🆔 ID:', adminUser.id)

    // Create employee record for admin
    const employee = await prisma.employee.upsert({
      where: { userId: adminUser.id },
      update: {
        department: 'Management',
        position: 'Administrator',
        baseSalary: 10000,
      },
      create: {
        userId: adminUser.id,
        employeeCode: 'ADMIN001',
        department: 'Management',
        position: 'Administrator',
        baseSalary: 10000,
        hireDate: new Date(),
      },
    })

    console.log('✅ Employee record created!')
    console.log('👔 Employee Code:', employee.employeeCode)
    console.log('🏢 Department:', employee.department)
    console.log('💼 Position:', employee.position)

  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
