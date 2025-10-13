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

// GET /api/payroll/[id] - Get payroll record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payroll = await prisma.payrollRecord.findUnique({
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

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Check if user has access to this payroll record
    // Check permissions - get employee data first
    const employee = await prisma.employee.findUnique({
      where: { id: payroll.employeeId }
    })
    
    if (user.role !== 'MANAGER' && employee?.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(payroll)
  } catch (error) {
    console.error('Error fetching payroll record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payroll/[id] - Update payroll record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { baseSalary, overtimeHours, overtimeRate, bonuses, deductions, note, status } = body

    // Check if payroll record exists
    const existingPayroll = await prisma.payrollRecord.findUnique({
      where: { id }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Calculate total salary if salary components are updated
    let updateData: any = {}
    
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary
    if (overtimeHours !== undefined) updateData.overtimeHours = overtimeHours
    if (overtimeRate !== undefined) updateData.overtimeRate = overtimeRate
    if (bonuses !== undefined) updateData.bonuses = bonuses
    if (deductions !== undefined) updateData.deductions = deductions
    if (note !== undefined) updateData.note = note
    if (status !== undefined) updateData.status = status

    // Recalculate salary if any salary component is updated
    if (baseSalary !== undefined || overtimeHours !== undefined || overtimeRate !== undefined || bonuses !== undefined || deductions !== undefined) {
      const newBaseSalary = baseSalary ?? existingPayroll.baseSalary
      const newOvertimeHours = overtimeHours ?? existingPayroll.overtimeHours
      const newOvertimeAmount = (overtimeHours ?? existingPayroll.overtimeHours) * 50000 // Fixed rate
      const newBonuses = bonuses ?? existingPayroll.bonuses
      const newDeductions = deductions ?? existingPayroll.otherDeductions

      const overtimePay = newOvertimeAmount
      const grossSalary = newBaseSalary + overtimePay + newBonuses
      const netSalary = grossSalary - newDeductions

      updateData.grossSalary = grossSalary
      updateData.netSalary = netSalary
    }

    const payroll = await prisma.payrollRecord.update({
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

    return NextResponse.json(payroll)
  } catch (error) {
    console.error('Error updating payroll record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payroll/[id] - Delete payroll record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payroll = await prisma.payrollRecord.findUnique({
      where: { id }
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Don't allow deletion of processed payroll
    // Check if payroll record can be deleted
    if (payroll.isPaid) {
      return NextResponse.json({ error: 'Cannot delete paid payroll record' }, { status: 400 })
    }

    await prisma.payrollRecord.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Payroll record deleted successfully' })
  } catch (error) {
    console.error('Error deleting payroll record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}