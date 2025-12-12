/**
 * Validate Dashboard Data Dates
 * Ensures all data has dates <= 2025-12-19 (except forecasts)
 * 
 * Usage: npx tsx scripts/validate-dashboard-dates.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAX_DATE = new Date('2025-12-19T23:59:59+07:00')

async function validateDates() {
    console.log('🔍 Validating Dashboard Data Dates...')
    console.log('='.repeat(70))
    console.log(`📅 Maximum allowed date: ${MAX_DATE.toLocaleDateString('vi-VN')}`)
    console.log('='.repeat(70))

    let totalIssues = 0

    // 1. Check Orders
    console.log('\n📦 Checking Orders...')
    const invalidOrders = await prisma.order.findMany({
        where: {
            createdAt: { gt: MAX_DATE }
        },
        select: {
            id: true,
            orderNumber: true,
            createdAt: true
        }
    })

    if (invalidOrders.length > 0) {
        console.log(`  ❌ Found ${invalidOrders.length} orders with invalid dates:`)
        invalidOrders.slice(0, 5).forEach(order => {
            console.log(`     - ${order.orderNumber}: ${order.createdAt.toLocaleDateString('vi-VN')}`)
        })
        if (invalidOrders.length > 5) {
            console.log(`     ... and ${invalidOrders.length - 5} more`)
        }
        totalIssues += invalidOrders.length
    } else {
        console.log('  ✅ All orders have valid dates')
    }

    // 2. Check Payroll Records
    console.log('\n💰 Checking Payroll Records...')
    const invalidPayroll = await prisma.payrollRecord.findMany({
        where: {
            OR: [
                { createdAt: { gt: MAX_DATE } },
                { paidAt: { gt: MAX_DATE } }
            ]
        },
        select: {
            id: true,
            period: true,
            employee: {
                select: {
                    user: { select: { name: true } }
                }
            },
            createdAt: true,
            paidAt: true
        }
    })

    if (invalidPayroll.length > 0) {
        console.log(`  ❌ Found ${invalidPayroll.length} payroll records with invalid dates:`)
        invalidPayroll.slice(0, 5).forEach(record => {
            console.log(`     - ${record.employee.user.name} (${record.period})`)
        })
        if (invalidPayroll.length > 5) {
            console.log(`     ... and ${invalidPayroll.length - 5} more`)
        }
        totalIssues += invalidPayroll.length
    } else {
        console.log('  ✅ All payroll records have valid dates')
    }

    // 3. Check Work Shifts
    console.log('\n🕐 Checking Work Shifts...')
    const invalidShifts = await prisma.workShift.findMany({
        where: {
            date: { gt: MAX_DATE }
        },
        select: {
            id: true,
            employee: {
                select: {
                    user: { select: { name: true } }
                }
            },
            date: true
        }
    })

    if (invalidShifts.length > 0) {
        console.log(`  ❌ Found ${invalidShifts.length} work shifts with invalid dates:`)
        invalidShifts.slice(0, 5).forEach(shift => {
            console.log(`     - ${shift.employee.user.name}: ${shift.date.toLocaleDateString('vi-VN')}`)
        })
        if (invalidShifts.length > 5) {
            console.log(`     ... and ${invalidShifts.length - 5} more`)
        }
        totalIssues += invalidShifts.length
    } else {
        console.log('  ✅ All work shifts have valid dates')
    }

    // 4. Check Employee Tasks
    console.log('\n✏️  Checking Employee Tasks...')
    const invalidTasks = await prisma.employeeTask.findMany({
        where: {
            OR: [
                { createdAt: { gt: MAX_DATE } },
                { dueDate: { gt: MAX_DATE } },
                { completedAt: { gt: MAX_DATE } }
            ]
        },
        select: {
            id: true,
            title: true,
            employee: {
                select: {
                    user: { select: { name: true } }
                }
            },
            createdAt: true,
            dueDate: true
        }
    })

    if (invalidTasks.length > 0) {
        console.log(`  ❌ Found ${invalidTasks.length} employee tasks with invalid dates:`)
        invalidTasks.slice(0, 5).forEach(task => {
            console.log(`     - ${task.title} (${task.employee.user.name}): ${task.dueDate?.toLocaleDateString('vi-VN')}`)
        })
        if (invalidTasks.length > 5) {
            console.log(`     ... and ${invalidTasks.length - 5} more`)
        }
        totalIssues += invalidTasks.length
    } else {
        console.log('  ✅ All employee tasks have valid dates')
    }

    // 5. Check Product Reviews
    console.log('\n⭐ Checking Product Reviews...')
    const invalidReviews = await prisma.productReview.findMany({
        where: {
            createdAt: { gt: MAX_DATE }
        },
        select: {
            id: true,
            product: { select: { name: true } },
            createdAt: true
        }
    })

    if (invalidReviews.length > 0) {
        console.log(`  ❌ Found ${invalidReviews.length} reviews with invalid dates:`)
        invalidReviews.slice(0, 5).forEach(review => {
            console.log(`     - ${review.product.name}: ${review.createdAt.toLocaleDateString('vi-VN')}`)
        })
        if (invalidReviews.length > 5) {
            console.log(`     ... and ${invalidReviews.length - 5} more`)
        }
        totalIssues += invalidReviews.length
    } else {
        console.log('  ✅ All product reviews have valid dates')
    }

    // 6. Check Projects
    console.log('\n🏗️  Checking Projects...')
    const invalidProjects = await prisma.project.findMany({
        where: {
            OR: [
                { startDate: { gt: MAX_DATE } },
                { endDate: { gt: MAX_DATE } },
                { createdAt: { gt: MAX_DATE } }
            ]
        },
        select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
        }
    })

    if (invalidProjects.length > 0) {
        console.log(`  ❌ Found ${invalidProjects.length} projects with invalid dates:`)
        invalidProjects.slice(0, 5).forEach(project => {
            console.log(`     - ${project.name}: ${project.startDate.toLocaleDateString('vi-VN')}`)
        })
        if (invalidProjects.length > 5) {
            console.log(`     ... and ${invalidProjects.length - 5} more`)
        }
        totalIssues += invalidProjects.length
    } else {
        console.log('  ✅ All projects have valid dates')
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    if (totalIssues === 0) {
        console.log('✅ VALIDATION PASSED - All dates are valid!')
    } else {
        console.log(`❌ VALIDATION FAILED - Found ${totalIssues} records with invalid dates`)
    }
    console.log('='.repeat(70))

    return totalIssues === 0
}

validateDates()
    .then((success) => {
        process.exit(success ? 0 : 1)
    })
    .catch((error) => {
        console.error('❌ Validation error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
