import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'AWAITING_REVIEW', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
})

// GET /api/employee-tasks/[id] - Get specific task
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')

    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const task = await prisma.employeeTask.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        createErrorResponse('Task not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // If employee role, can only view their own tasks
    if (userRole === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      })
      if (!employee || task.employeeId !== employee.id) {
        return NextResponse.json(
          createErrorResponse('Access denied', 'FORBIDDEN'),
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      createSuccessResponse(task, 'Task retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// PUT /api/employee-tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')

    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = updateTaskSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    let updateData = validation.data

    // Check if task exists
    const existingTask = await prisma.employeeTask.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        createErrorResponse('Task not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // If employee role, can only update their own tasks and limited fields
    if (userRole === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      })
      if (!employee || existingTask.employeeId !== employee.id) {
        return NextResponse.json(
          createErrorResponse('Access denied', 'FORBIDDEN'),
          { status: 403 }
        )
      }

      // Employees can only update status and actualHours
      const allowedFields = ['status', 'actualHours']
      const filteredData: any = {}
      for (const key of allowedFields) {
        if (key in updateData) {
          filteredData[key] = updateData[key as keyof typeof updateData]
        }
      }
      updateData = filteredData
    }

    // If marking task as completed, set completedAt timestamp
    if (updateData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      (updateData as any).completedAt = new Date()
    }

    // Update task
    const task = await prisma.employeeTask.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json(
      createSuccessResponse(task, 'Task updated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// DELETE /api/employee-tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // Only managers can delete tasks
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Check if task exists
    const task = await prisma.employeeTask.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        createErrorResponse('Task not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Delete task
    await prisma.employeeTask.delete({
      where: { id }
    })

    return NextResponse.json(
      createSuccessResponse(null, 'Task deleted successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
