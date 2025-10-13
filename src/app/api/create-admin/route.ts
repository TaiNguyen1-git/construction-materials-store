import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
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

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully!',
      data: {
        email: adminUser.email,
        password: 'admin123',
        role: adminUser.role,
        employeeCode: employee.employeeCode,
      }
    })
  } catch (error: any) {
    console.error('Error creating admin:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
