import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@constructionstore.com' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        createErrorResponse('Admin user already exists', 'USER_EXISTS'),
        { status: 409 }
      )
    }

    // Create default categories
    const categories = [
      {
        name: 'Cement & Concrete',
        description: 'Portland cement, ready-mix concrete, concrete blocks, and cement-based materials',
      },
      {
        name: 'Steel & Metal',
        description: 'Rebar, steel pipes, metal sheets, and structural steel products',
      },
      {
        name: 'Bricks & Blocks',
        description: 'Clay bricks, concrete blocks, interlocking pavers, and masonry materials',
      },
      {
        name: 'Tools & Hardware',
        description: 'Hand tools, power tools, fasteners, and construction hardware',
      },
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      })
    }

    // Create default admin user
    const hashedPassword = await AuthService.hashPassword('admin123')
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@constructionstore.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'MANAGER',
        phone: '+1234567890',
        address: '123 Construction Ave, Building City',
      },
    })

    // Create employee record for admin
    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        employeeCode: 'EMP001',
        department: 'Management',
        position: 'Store Manager',
        baseSalary: 5000,
        hireDate: new Date(),
      },
    })

    // Create a sample customer user
    const customerPassword = await AuthService.hashPassword('customer123')
    const customerUser = await prisma.user.create({
      data: {
        email: 'customer@example.com',
        name: 'John Customer',
        password: customerPassword,
        role: 'CUSTOMER',
        phone: '+1234567891',
        address: '456 Customer St, Client City',
      },
    })

    await prisma.customer.create({
      data: {
        userId: customerUser.id,
        customerType: 'REGULAR',
      },
    })

    return NextResponse.json(
      createSuccessResponse({
        message: 'Database initialized successfully',
        adminCredentials: {
          email: 'admin@constructionstore.com',
          password: 'admin123'
        },
        customerCredentials: {
          email: 'customer@example.com',
          password: 'customer123'
        }
      }, 'Initialization complete'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      createErrorResponse('Database initialization failed', 'INIT_ERROR', error),
      { status: 500 }
    )
  }
}