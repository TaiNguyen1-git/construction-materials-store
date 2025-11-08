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
    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'production' && !user) {
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
    
    // Check permissions only in production mode
    if (process.env.NODE_ENV === 'production' && user && user.role !== 'MANAGER' && employee?.userId !== user.id) {
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
    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'production' && (!user || user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('PUT /api/payroll/[id] - Request body:', JSON.stringify(body, null, 2))
    console.log('PUT /api/payroll/[id] - Payroll ID:', id)
    const { baseSalary, overtimeHours, bonuses, deductions, status, isPaid } = body

    // Check if payroll record exists
    const existingPayroll = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: true
      }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Calculate total salary if salary components are updated
    let updateData: any = {}
    
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary
    if (overtimeHours !== undefined) updateData.overtimeHours = overtimeHours
    if (bonuses !== undefined) updateData.bonuses = bonuses
    if (deductions !== undefined) updateData.otherDeductions = deductions
    // Note: PayrollRecord schema doesn't have 'note' or 'overtimeRate' fields
    // 'overtime' is the amount (Float), not a rate
    
    // Handle status update: convert status string to isPaid boolean
    if (status !== undefined) {
      console.log('Status update requested:', status, 'Current isPaid:', existingPayroll.isPaid)
      if (status === 'PAID' || status === 'paid') {
        updateData.isPaid = true
        // Always set paidAt when marking as paid, even if already set (refresh the timestamp)
        updateData.paidAt = new Date()
      } else if (status === 'UNPAID' || status === 'unpaid') {
        updateData.isPaid = false
        // Clear paidAt when marking as unpaid
        updateData.paidAt = null
      }
    }
    
    // Also handle direct isPaid update (takes precedence over status)
    if (isPaid !== undefined) {
      console.log('isPaid update requested:', isPaid, 'Current isPaid:', existingPayroll.isPaid)
      updateData.isPaid = isPaid
      if (isPaid) {
        // Always set paidAt when marking as paid
        updateData.paidAt = new Date()
      } else {
        // Clear paidAt when marking as unpaid
        updateData.paidAt = null
      }
    }

    // Recalculate salary if any salary component is updated
    const needsRecalculation = baseSalary !== undefined || overtimeHours !== undefined || bonuses !== undefined || deductions !== undefined
    
    if (needsRecalculation) {
      const newBaseSalary = baseSalary ?? existingPayroll.baseSalary
      const newOvertimeHours = overtimeHours ?? existingPayroll.overtimeHours
      
      // Calculate overtime amount: overtimeHours * (baseSalary / 176 hours per month) * 1.5
      // 176 hours = 22 work days * 8 hours per day
      const hourlyRate = newBaseSalary / 176
      const overtimeRate = hourlyRate * 1.5 // 1.5x for overtime
      const newOvertimeAmount = newOvertimeHours * overtimeRate
      
      const newBonuses = bonuses ?? existingPayroll.bonuses
      const newDeductions = deductions ?? existingPayroll.otherDeductions
      const taxDeductions = existingPayroll.taxDeductions // Keep existing tax deductions

      const grossPay = newBaseSalary + newOvertimeAmount + newBonuses
      const netPay = grossPay - taxDeductions - newDeductions

      updateData.overtime = newOvertimeAmount
      updateData.grossPay = grossPay
      updateData.netPay = netPay
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      console.log('No fields to update - updateData is empty')
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Validate updateData before sending to Prisma
    console.log('Updating payroll with data:', JSON.stringify(updateData, null, 2))
    console.log('Existing payroll:', { 
      isPaid: existingPayroll.isPaid, 
      paidAt: existingPayroll.paidAt,
      baseSalary: existingPayroll.baseSalary,
      netPay: existingPayroll.netPay
    })

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
  } catch (error: any) {
    console.error('Error updating payroll record:', error)
    
    // Return more specific error messages
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate payroll record' }, { status: 400 })
    }
    
    // Return Prisma validation errors
    if (error.message) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/payroll/[id] - Delete payroll record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('DELETE /api/payroll/[id] - Payroll ID:', id)
    const user = await verifyToken(request)
    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'production' && (!user || user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payroll = await prisma.payrollRecord.findUnique({
      where: { id }
    })

    if (!payroll) {
      console.log('DELETE /api/payroll/[id] - Payroll not found:', id)
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    console.log('DELETE /api/payroll/[id] - Payroll found:', { id, isPaid: payroll.isPaid })

    // Allow deletion of payroll records (including paid ones)
    // If user wants to restrict deletion, they can add validation in the frontend
    await prisma.payrollRecord.delete({
      where: { id }
    })

    console.log('DELETE /api/payroll/[id] - Payroll deleted successfully:', id)
    return NextResponse.json({ message: 'Payroll record deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting payroll record:', error)
    
    // Return more specific error messages
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}