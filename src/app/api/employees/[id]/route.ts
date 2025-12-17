import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { requireManager } from '@/lib/auth-middleware-api'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().min(1, 'Department is required').optional(),
  position: z.string().min(1, 'Position is required').optional(),
  baseSalary: z.number().positive('Base salary must be positive').optional(),
  isActive: z.boolean().optional(),
})

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Employee access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, address: true, isActive: true }
        },
        workShifts: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        },
        salaryAdvances: {
          where: { status: 'APPROVED', isRepaid: false },
          orderBy: { requestDate: 'desc' }
        },
        _count: {
          select: {
            workShifts: true,
            salaryAdvances: true,
            payrollRecords: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        createErrorResponse('Employee not found', 'EMPLOYEE_NOT_FOUND'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse(employee, 'Employee retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get employee error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check authentication and role
    const authError = requireManager(request)
    if (authError) {
      return authError
    }

    const body = await request.json()

    // Validate input
    const validation = updateEmployeeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        createErrorResponse('Employee not found', 'EMPLOYEE_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Separate user data and employee data
    const { name, phone, address, ...employeeData } = updateData
    const userData: any = {}
    if (name !== undefined) userData.name = name
    if (phone !== undefined) userData.phone = phone
    if (address !== undefined) userData.address = address

    // Update user and employee in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user data if provided
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: userData
        })
      }

      // Update employee data
      const employee = await tx.employee.update({
        where: { id },
        data: employeeData,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, address: true, isActive: true }
          }
        }
      })

      return employee
    })

    return NextResponse.json(
      createSuccessResponse(result, 'Employee updated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Deactivate or Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check authentication and role
    const authError = requireManager(request)
    if (authError) {
      return authError
    }

    const url = new URL(request.url)
    const permanent = url.searchParams.get('permanent') === 'true'

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        createErrorResponse('Employee not found', 'EMPLOYEE_NOT_FOUND'),
        { status: 404 }
      )
    }

    if (permanent) {
      // Permanent Delete logic
      await prisma.$transaction(async (tx) => {
        // 1. Delete related records
        await tx.workShift.deleteMany({ where: { employeeId: id } })
        await tx.employeeTask.deleteMany({ where: { employeeId: id } })
        await tx.salaryAdvance.deleteMany({ where: { employeeId: id } })
        await tx.payrollRecord.deleteMany({ where: { employeeId: id } })

        // 2. Delete employee
        await tx.employee.delete({ where: { id } })

        // 3. Check and delete user if applicable
        const user = await tx.user.findUnique({
          where: { id: existingEmployee.userId },
          include: { customer: true }
        })

        if (user && !user.customer) {
          await tx.user.delete({ where: { id: existingEmployee.userId } })
        }
      })

      return NextResponse.json(
        createSuccessResponse(null, 'Employee permanently deleted successfully'),
        { status: 200 }
      )
    } else {
      // Soft Delete (Deactivate) logic
      await prisma.$transaction(async (tx) => {
        await tx.employee.update({
          where: { id },
          data: { isActive: false }
        })

        // Check if user should also be deactivated (optional, maybe keep user active if they are also customer?)
        // For now, keeping original logic: deactivate user too
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: { isActive: false }
        })
      })

      return NextResponse.json(
        createSuccessResponse(null, 'Employee deactivated successfully'),
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}