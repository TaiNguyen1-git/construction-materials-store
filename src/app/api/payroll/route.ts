import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/lib/auth'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('access_token')?.value
    
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/payroll - Get all payroll records
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (year) where.year = parseInt(year)
    if (month) where.month = parseInt(month)

    const [payrolls, total] = await Promise.all([
      prisma.payrollRecord.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payrollRecord.count({ where })
    ])

    return NextResponse.json({
      data: payrolls,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll - Create payroll record
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId, year, month, baseSalary, overtimeHours, overtimeRate, bonuses, deductions, note } = body

    // Validate required fields
    if (!employeeId || !year || !month || baseSalary === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if payroll for this period already exists
    const period = year && month ? `${year}-${month.toString().padStart(2, '0')}` : null
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: {
        employeeId,
        ...(period && { period })
      }
    })

    if (existingPayroll) {
      return NextResponse.json({ error: 'Payroll for this period already exists' }, { status: 400 })
    }

    // Calculate total salary
    const overtimePay = (overtimeHours || 0) * (overtimeRate || 0)
    const totalBonuses = bonuses || 0
    const totalDeductions = deductions || 0
    const grossSalary = baseSalary + overtimePay + totalBonuses
    const netSalary = grossSalary - totalDeductions

    // Create payroll record
    const payroll = await prisma.payrollRecord.create({
      data: {
        employeeId,
        period: period || `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
        baseSalary,
        bonuses: totalBonuses,
        penalties: totalDeductions,
        overtime: overtimePay,
        totalAdvances: 0,
        grossPay: grossSalary,
        taxDeductions: 0,
        otherDeductions: totalDeductions,
        netPay: netSalary,
        hoursWorked: 0,
        overtimeHours: overtimeHours || 0,
        isPaid: false
      },
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

    return NextResponse.json(payroll, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}