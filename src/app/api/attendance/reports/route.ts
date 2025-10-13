import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const reportQuerySchema = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  reportType: z.enum(['WEEKLY', 'MONTHLY', 'CUSTOM']).default('MONTHLY'),
  includeDetails: z.string().optional().transform(val => val === 'true'),
})

// GET /api/attendance/reports - Generate attendance reports
export async function GET(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')
    
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = reportQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { employeeId, startDate, endDate, reportType, includeDetails } = validation.data

    // Build where clause
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    }

    // If employee role, only show their own data
    if (userRole === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      })
      if (employee) {
        where.employeeId = employee.id
      }
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    // Get work shifts for the period
    const shifts = await prisma.workShift.findMany({
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
      orderBy: [
        { employee: { user: { name: 'asc' } } },
        { date: 'asc' }
      ]
    })

    // Process attendance data
    const attendanceData = new Map()

    shifts.forEach(shift => {
      const employeeKey = shift.employee.id
      if (!attendanceData.has(employeeKey)) {
        attendanceData.set(employeeKey, {
          employee: {
            id: shift.employee.id,
            name: shift.employee.user.name,
            email: shift.employee.user.email,
            employeeCode: shift.employee.employeeCode,
            department: shift.employee.department,
            position: shift.employee.position
          },
          summary: {
            totalShifts: 0,
            completedShifts: 0,
            absentShifts: 0,
            totalHoursWorked: 0,
            totalOvertimeMinutes: 0,
            attendanceRate: 0
          },
          details: []
        })
      }

      const record = attendanceData.get(employeeKey)
      record.summary.totalShifts++

      // Calculate hours worked for this shift
      let hoursWorked = 0
      if (shift.clockIn && shift.clockOut) {
        hoursWorked = (shift.clockOut.getTime() - shift.clockIn.getTime()) / (1000 * 60 * 60)
        record.summary.totalHoursWorked += hoursWorked
        record.summary.completedShifts++
      }

      if (shift.status === 'ABSENT') {
        record.summary.absentShifts++
      }

      if (shift.overtime) {
        record.summary.totalOvertimeMinutes += shift.overtime
      }

      // Add shift details if requested
      if (includeDetails) {
        record.details.push({
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType,
          status: shift.status,
          clockIn: shift.clockIn,
          clockOut: shift.clockOut,
          hoursWorked: hoursWorked,
          overtimeMinutes: shift.overtime || 0,
          notes: shift.notes
        })
      }
    })

    // Calculate attendance rates
    const reportData = Array.from(attendanceData.values()).map(record => {
      const totalScheduled = record.summary.totalShifts - record.summary.absentShifts
      record.summary.attendanceRate = totalScheduled > 0 ? 
        (record.summary.completedShifts / totalScheduled) * 100 : 0

      // Convert overtime minutes to hours for display
      record.summary.totalOvertimeHours = record.summary.totalOvertimeMinutes / 60

      return record
    })

    // Generate overall summary
    const overallSummary = {
      reportType,
      period: {
        startDate,
        endDate
      },
      totalEmployees: reportData.length,
      totalShifts: reportData.reduce((sum, emp) => sum + emp.summary.totalShifts, 0),
      totalCompletedShifts: reportData.reduce((sum, emp) => sum + emp.summary.completedShifts, 0),
      totalAbsentShifts: reportData.reduce((sum, emp) => sum + emp.summary.absentShifts, 0),
      totalHoursWorked: reportData.reduce((sum, emp) => sum + emp.summary.totalHoursWorked, 0),
      totalOvertimeHours: reportData.reduce((sum, emp) => sum + emp.summary.totalOvertimeMinutes, 0) / 60,
      averageAttendanceRate: reportData.length > 0 ? 
        reportData.reduce((sum, emp) => sum + emp.summary.attendanceRate, 0) / reportData.length : 0
    }

    const response = {
      summary: overallSummary,
      employees: reportData
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Attendance report generated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Generate attendance report error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
