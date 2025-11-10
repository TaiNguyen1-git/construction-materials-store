import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { requireEmployee } from '@/lib/auth-middleware-api'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val)),
  limit: z.string().optional().default('20').transform(val => parseInt(val)),
  employeeId: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  taskType: z.enum(['GENERAL', 'LOADING', 'TRANSPORT', 'INVENTORY', 'SALES', 'MAINTENANCE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dueDateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const createTaskSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  taskType: z.enum(['GENERAL', 'LOADING', 'TRANSPORT', 'INVENTORY', 'SALES', 'MAINTENANCE']).default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  estimatedHours: z.number().positive().optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
})

// GET /api/employee-tasks - List tasks with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const authError = requireEmployee(request)
    if (authError) return authError

    const userId = request.headers.get('x-user-id')

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = querySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { page, limit, employeeId, status, taskType, priority, dueDateFrom, dueDateTo, sortBy, sortOrder } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // If employee role, only show their own tasks unless they're viewing all
    if (userRole === 'EMPLOYEE' && !employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      })
      if (employee) {
        where.employeeId = employee.id
      }
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (status) {
      where.status = status
    }

    if (taskType) {
      where.taskType = taskType
    }

    if (priority) {
      where.priority = priority
    }

    if (dueDateFrom && dueDateTo) {
      where.dueDate = {
        gte: dueDateFrom,
        lte: dueDateTo
      }
    } else if (dueDateFrom) {
      where.dueDate = { gte: dueDateFrom }
    } else if (dueDateTo) {
      where.dueDate = { lte: dueDateTo }
    }

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
      prisma.employeeTask.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.employeeTask.count({ where })
    ])

    // Transform dates to ISO strings for JSON serialization
    const transformedTasks = tasks.map(task => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
    }))

    // Return in format expected by frontend
    return NextResponse.json(
      createSuccessResponse({
        data: transformedTasks,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, 'Tasks retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/employee-tasks - Create new task
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
    const validation = createTaskSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const taskData = validation.data

    // Check if employee exists and is active
    const employee = await prisma.employee.findUnique({
      where: { id: taskData.employeeId }
    })

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        createErrorResponse('Employee not found or inactive', 'EMPLOYEE_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Create task
    const task = await prisma.employeeTask.create({
      data: taskData,
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
      createSuccessResponse(task, 'Task created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
