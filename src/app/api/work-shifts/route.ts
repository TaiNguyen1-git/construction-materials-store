import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val)),
  limit: z.string().optional().default('20').transform(val => parseInt(val)),
  employeeId: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ABSENT', 'CANCELLED']).optional(),
  shiftType: z.enum(['REGULAR', 'OVERTIME', 'LOADING', 'TRANSPORT']).optional(),
})

const createShiftSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().transform(val => new Date(val)),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  shiftType: z.enum(['REGULAR', 'OVERTIME', 'LOADING', 'TRANSPORT']).default('REGULAR'),
  notes: z.string().optional(),
})

const updateShiftSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ABSENT', 'CANCELLED']).optional(),
  clockIn: z.string().optional().transform(val => val ? new Date(val) : undefined),
  clockOut: z.string().optional().transform(val => val ? new Date(val) : undefined),
  breakTime: z.number().min(0).optional(),
  overtime: z.number().min(0).optional(),
  notes: z.string().optional(),
})

// GET /api/work-shifts - List work shifts with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Check user role from middleware (skip in development)
    const userRole = request.headers.get('x-user-role')
    if (process.env.NODE_ENV === 'production' && !['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Employee access required', 'FORBIDDEN'),
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

    const { page, limit, employeeId, startDate, endDate, status, shiftType } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      }
    } else if (startDate) {
      where.date = { gte: startDate }
    } else if (endDate) {
      where.date = { lte: endDate }
    }

    if (status) {
      where.status = status
    }

    if (shiftType) {
      where.shiftType = shiftType
    }

    // Get work shifts with pagination
    const [workShifts, total] = await Promise.all([
      prisma.workShift.findMany({
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
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workShift.count({ where })
    ])

    const response = createPaginatedResponse(workShifts, total, page, limit)
    
    return NextResponse.json(
      createSuccessResponse(response, 'Work shifts retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get work shifts error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/work-shifts - Create new work shift
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
    const validation = createShiftSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const shiftData = validation.data

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: shiftData.employeeId }
    })

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        createErrorResponse('Employee not found or inactive', 'EMPLOYEE_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check for overlapping shifts
    const existingShift = await prisma.workShift.findFirst({
      where: {
        employeeId: shiftData.employeeId,
        date: shiftData.date,
        status: { not: 'CANCELLED' }
      }
    })

    if (existingShift) {
      return NextResponse.json(
        createErrorResponse('Employee already has a shift on this date', 'SHIFT_CONFLICT'),
        { status: 409 }
      )
    }

    // Create work shift
    const workShift = await prisma.workShift.create({
      data: shiftData,
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
      createSuccessResponse(workShift, 'Work shift created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('Create work shift error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}