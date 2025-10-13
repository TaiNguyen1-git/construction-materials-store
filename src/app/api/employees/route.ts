import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val)),
  limit: z.string().optional().default('20').transform(val => parseInt(val)),
  search: z.string().optional(),
  department: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true'),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  employeeCode: z.string().min(1, 'Employee code is required'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  baseSalary: z.number().positive('Base salary must be positive'),
  hireDate: z.string().transform(val => new Date(val)),
})

// GET /api/employees - List employees with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = querySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { page, limit, search, department, isActive, sortBy, sortOrder } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
    }

    if (department) {
      where.department = department
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Get employees with pagination
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, isActive: true }
          }
        },
        orderBy: sortBy === 'name' ? { user: { name: sortOrder } } : { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where })
    ])

    const response = createPaginatedResponse(employees, total, page, limit)
    
    return NextResponse.json(
      createSuccessResponse(response, 'Employees retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = createEmployeeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { email, password, name, phone, address, employeeCode, department, position, baseSalary, hireDate } = validation.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('Email already exists', 'EMAIL_EXISTS'),
        { status: 409 }
      )
    }

    // Check if employee code already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode }
    })

    if (existingEmployee) {
      return NextResponse.json(
        createErrorResponse('Employee code already exists', 'EMPLOYEE_CODE_EXISTS'),
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password)

    // Create user and employee in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          address,
          role: 'EMPLOYEE',
        },
      })

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          department,
          position,
          baseSalary,
          hireDate,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          }
        }
      })

      return employee
    })

    return NextResponse.json(
      createSuccessResponse(result, 'Employee created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}