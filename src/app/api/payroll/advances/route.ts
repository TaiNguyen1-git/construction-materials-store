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

// GET /api/payroll/advances - Get all salary advances
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {}
    
    // If user is not manager, only show their own advances
    if (user.role !== 'MANAGER') {
      const employee = await prisma.employee.findFirst({
        where: { userId: user.id }
      })
      if (employee) {
        where.employeeId = employee.id
      } else {
        return NextResponse.json({ data: [], pagination: { total: 0, page, limit, pages: 0 } })
      }
    } else if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (status) where.status = status

    const [advances, total] = await Promise.all([
      prisma.salaryAdvance.findMany({
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
      prisma.salaryAdvance.count({ where })
    ])

    return NextResponse.json({
      data: advances,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching salary advances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payroll/advances - Create salary advance request
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId, amount, reason, requestedDate } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    let targetEmployeeId = employeeId

    // If user is not manager, they can only request for themselves
    if (user.role !== 'MANAGER') {
      const employee = await prisma.employee.findFirst({
        where: { userId: user.id }
      })
      if (!employee) {
        return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
      }
      targetEmployeeId = employee.id
    } else if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Create salary advance request
    const advance = await prisma.salaryAdvance.create({
      data: {
        employeeId: targetEmployeeId,
        amount,
        reason: reason || '',
        requestDate: requestedDate ? new Date(requestedDate) : new Date(),
        status: user.role === 'MANAGER' ? 'APPROVED' : 'PENDING'
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

    return NextResponse.json(advance, { status: 201 })
  } catch (error) {
    console.error('Error creating salary advance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}