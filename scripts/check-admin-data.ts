/**
 * Script to check admin data in database
 * Usage: npx tsx scripts/check-admin-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdminData() {
  try {
    console.log('🔍 Checking admin data in database...\n')
    
    // Check Payroll Records
    console.log('📋 PAYROLL RECORDS:')
    const payrollCount = await prisma.payrollRecord.count()
    console.log(`  Total: ${payrollCount}`)
    if (payrollCount > 0) {
      const payrolls = await prisma.payrollRecord.findMany({
        take: 5,
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
      payrolls.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.employee?.user?.name || 'N/A'} - ${p.period} - ${p.netPay.toLocaleString('vi-VN')}đ`)
      })
    } else {
      console.log('  ⚠️  No payroll records found')
    }
    
    // Check Product Reviews
    console.log('\n⭐ PRODUCT REVIEWS:')
    const reviewsCount = await prisma.productReview.count()
    console.log(`  Total: ${reviewsCount}`)
    if (reviewsCount > 0) {
      const reviews = await prisma.productReview.findMany({
        take: 5,
        include: {
          product: {
            select: { name: true }
          }
        }
      })
      reviews.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.product.name} - ${r.rating}⭐ - ${r.title || 'No title'}`)
      })
    } else {
      console.log('  ⚠️  No reviews found')
    }
    
    // Check Employees
    console.log('\n👥 EMPLOYEES:')
    const employeesCount = await prisma.employee.count()
    console.log(`  Total: ${employeesCount}`)
    if (employeesCount > 0) {
      const employees = await prisma.employee.findMany({
        take: 5,
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })
      employees.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.user.name} - ${e.employeeCode} - ${e.department} - ${e.position}`)
      })
    } else {
      console.log('  ⚠️  No employees found')
    }
    
    // Check Shifts
    console.log('\n🕐 SHIFTS:')
    const shiftsCount = await prisma.shift.count()
    console.log(`  Total: ${shiftsCount}`)
    if (shiftsCount > 0) {
      const shifts = await prisma.shift.findMany({
        take: 5,
        include: {
          employee: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      })
      shifts.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.employee?.user?.name || 'N/A'} - ${s.date.toISOString().split('T')[0]} - ${s.startTime} - ${s.endTime}`)
      })
    } else {
      console.log('  ⚠️  No shifts found')
    }
    
    // Check Tasks
    console.log('\n✅ TASKS:')
    const tasksCount = await prisma.task.count()
    console.log(`  Total: ${tasksCount}`)
    if (tasksCount > 0) {
      const tasks = await prisma.task.findMany({
        take: 5,
        include: {
          assignedTo: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      })
      tasks.forEach((t, idx) => {
        console.log(`  ${idx + 1}. ${t.title} - ${t.assignedTo?.user?.name || 'Unassigned'} - ${t.status}`)
      })
    } else {
      console.log('  ⚠️  No tasks found')
    }
    
    console.log('\n✅ Data check completed!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminData()


