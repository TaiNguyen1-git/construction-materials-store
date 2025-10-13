import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const clockActionSchema = z.object({
  action: z.enum(['CLOCK_IN', 'CLOCK_OUT']),
  timestamp: z.string().optional().transform(val => val ? new Date(val) : new Date()),
  notes: z.string().optional(),
})

// POST /api/work-shifts/[id]/clock - Clock in/out for a shift
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const validation = clockActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { action, timestamp, notes } = validation.data

    // Get the work shift
    const shift = await prisma.workShift.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!shift) {
      return NextResponse.json(
        createErrorResponse('Work shift not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // If employee role, can only clock in/out their own shifts
    if (userRole === 'EMPLOYEE' && shift.employee.user.id !== userId) {
      return NextResponse.json(
        createErrorResponse('Access denied - can only clock your own shifts', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Validate shift status and action
    if (action === 'CLOCK_IN') {
      if (shift.clockIn) {
        return NextResponse.json(
          createErrorResponse('Already clocked in', 'ALREADY_CLOCKED_IN'),
          { status: 400 }
        )
      }
      if (shift.status !== 'SCHEDULED') {
        return NextResponse.json(
          createErrorResponse('Can only clock in for scheduled shifts', 'INVALID_SHIFT_STATUS'),
          { status: 400 }
        )
      }
    } else if (action === 'CLOCK_OUT') {
      if (!shift.clockIn) {
        return NextResponse.json(
          createErrorResponse('Must clock in first', 'NOT_CLOCKED_IN'),
          { status: 400 }
        )
      }
      if (shift.clockOut) {
        return NextResponse.json(
          createErrorResponse('Already clocked out', 'ALREADY_CLOCKED_OUT'),
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      notes: notes || shift.notes
    }

    if (action === 'CLOCK_IN') {
      updateData.clockIn = timestamp
      updateData.status = 'IN_PROGRESS'
    } else if (action === 'CLOCK_OUT') {
      updateData.clockOut = timestamp
      updateData.status = 'COMPLETED'
      
      // Calculate overtime if applicable
      const clockInTime = shift.clockIn!
      const clockOutTime = timestamp
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
      
      // Parse scheduled hours from time strings
      const [startHour, startMin] = shift.startTime.split(':').map(Number)
      const [endHour, endMin] = shift.endTime.split(':').map(Number)
      const scheduledMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
      const scheduledHours = scheduledMinutes / 60
      
      // Calculate overtime (anything over scheduled hours)
      const overtimeMinutes = Math.max(0, Math.floor((hoursWorked - scheduledHours) * 60))
      updateData.overtime = overtimeMinutes
    }

    // Update work shift
    const updatedShift = await prisma.workShift.update({
      where: { id: params.id },
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
      createSuccessResponse(updatedShift, `Successfully ${action.toLowerCase().replace('_', ' ')}`),
      { status: 200 }
    )

  } catch (error) {
    console.error('Clock action error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// GET /api/work-shifts/[id]/clock - Get current clock status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')
    
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Get the work shift
    const shift = await prisma.workShift.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!shift) {
      return NextResponse.json(
        createErrorResponse('Work shift not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // If employee role, can only view their own shifts
    if (userRole === 'EMPLOYEE' && shift.employee.user.id !== userId) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Calculate current status
    const clockStatus = {
      shiftId: shift.id,
      employeeName: shift.employee.user.name,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: shift.status,
      clockIn: shift.clockIn,
      clockOut: shift.clockOut,
      canClockIn: shift.status === 'SCHEDULED' && !shift.clockIn,
      canClockOut: shift.status === 'IN_PROGRESS' && shift.clockIn && !shift.clockOut,
      overtime: shift.overtime,
      hoursWorked: shift.clockIn && shift.clockOut ? 
        (shift.clockOut.getTime() - shift.clockIn.getTime()) / (1000 * 60 * 60) : null
    }

    return NextResponse.json(
      createSuccessResponse(clockStatus, 'Clock status retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get clock status error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
