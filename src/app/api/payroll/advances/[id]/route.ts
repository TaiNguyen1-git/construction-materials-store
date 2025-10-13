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

// PUT /api/payroll/advances/[id] - Update salary advance (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, approvedDate, payrollId, note } = body

    // Check if advance exists
    const advance = await prisma.salaryAdvance.findUnique({
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

    if (!advance) {
      return NextResponse.json({ error: 'Salary advance not found' }, { status: 404 })
    }

    // Check permissions
    if (user.role !== 'MANAGER' && advance.employee.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only managers can approve/reject advances
    if (status && ['APPROVED', 'REJECTED'].includes(status) && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Only managers can approve/reject advances' }, { status: 403 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (approvedDate) updateData.approvedDate = new Date(approvedDate)
    if (payrollId) updateData.payrollId = payrollId
    if (note !== undefined) updateData.note = note

    const updatedAdvance = await prisma.salaryAdvance.update({
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

    return NextResponse.json(updatedAdvance)
  } catch (error) {
    console.error('Error updating salary advance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/advances/[id] - Delete salary advance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advance = await prisma.salaryAdvance.findUnique({
      where: { id },
      include: {
        employee: true
      }
    })

    if (!advance) {
      return NextResponse.json({ error: 'Salary advance not found' }, { status: 404 })
    }

    // Check permissions - only managers or the employee who requested can delete
    if (user.role !== 'MANAGER' && advance.employee.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Can't delete approved advances that are linked to payroll
    // Only check payroll association for approved advances
    if (advance.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot delete approved advance linked to payroll' }, { status: 400 })
    }

    await prisma.salaryAdvance.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Salary advance deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary advance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}