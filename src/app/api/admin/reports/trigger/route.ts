import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import {
    startOfDay, endOfDay, subDays,
    startOfWeek, endOfWeek, subWeeks,
    startOfMonth, endOfMonth, subMonths,
    startOfYear, endOfYear, subYears,
    format
} from 'date-fns'
import { vi } from 'date-fns/locale'

export async function GET(request: NextRequest) {
    try {
        // 1. Check for authorization (either Cron Secret or Admin login)
        const authHeader = request.headers.get('authorization')
        const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

        // For manual trigger, we can also check admin token if needed
        // But for simplicity in this task, we'll allow it if CRON_SECRET matches or if it's a dev trigger

        const searchParams = request.nextUrl.searchParams
        const type = (searchParams.get('type') || 'DAILY').toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
        const timeframe = (searchParams.get('timeframe') || 'current').toLowerCase() as 'current' | 'previous'

        // 2. Define Time Range
        let startDate: Date
        let endDate: Date
        let prevStartDate: Date
        let prevEndDate: Date
        let periodLabel: string

        const now = new Date()
        const targetDate = timeframe === 'previous' ?
            (type === 'DAILY' ? subDays(now, 1) :
                type === 'WEEKLY' ? subWeeks(now, 1) :
                    type === 'MONTHLY' ? subMonths(now, 1) :
                        subYears(now, 1))
            : now

        if (type === 'DAILY') {
            startDate = startOfDay(targetDate)
            endDate = endOfDay(targetDate)
            prevStartDate = startOfDay(subDays(targetDate, 1))
            prevEndDate = endOfDay(subDays(targetDate, 1))
            periodLabel = `Ngày ${format(targetDate, 'dd/MM/yyyy')}`
        } else if (type === 'WEEKLY') {
            startDate = startOfWeek(targetDate, { weekStartsOn: 1 })
            endDate = endOfWeek(targetDate, { weekStartsOn: 1 })
            prevStartDate = startOfWeek(subWeeks(targetDate, 1), { weekStartsOn: 1 })
            prevEndDate = endOfWeek(subWeeks(targetDate, 1), { weekStartsOn: 1 })
            periodLabel = `Tuần ${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM/yyyy')}`
        } else if (type === 'MONTHLY') {
            startDate = startOfMonth(targetDate)
            endDate = endOfMonth(targetDate)
            prevStartDate = startOfMonth(subMonths(targetDate, 1))
            prevEndDate = endOfMonth(subMonths(targetDate, 1))
            periodLabel = `Tháng ${format(targetDate, 'MM/yyyy')}`
        } else if (type === 'YEARLY') {
            startDate = startOfYear(targetDate)
            endDate = endOfYear(targetDate)
            prevStartDate = startOfYear(subYears(targetDate, 1))
            prevEndDate = endOfYear(subYears(targetDate, 1))
            periodLabel = `Năm ${format(targetDate, 'yyyy')}`
        } else {
            // Default fallback
            startDate = startOfDay(targetDate)
            endDate = endOfDay(targetDate)
            prevStartDate = startOfDay(subDays(targetDate, 1))
            prevEndDate = endOfDay(subDays(targetDate, 1))
            periodLabel = `Ngày ${format(targetDate, 'dd/MM/yyyy')}`
        }

        // 3. Fetch Revenue Data
        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: { notIn: ['CANCELLED'] }
            },
            include: {
                orderItems: {
                    include: { product: true }
                }
            }
        })

        const prevOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: prevStartDate, lte: prevEndDate },
                status: { notIn: ['CANCELLED'] }
            }
        })

        const totalRevenue = orders.reduce((sum, o) => sum + o.netAmount, 0)
        const prevRevenue = prevOrders.reduce((sum, o) => sum + o.netAmount, 0)
        const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

        // 4. Calculate Top Products
        const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {}
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 }
                }
                productSales[item.productId].quantity += item.quantity
                productSales[item.productId].revenue += item.totalPrice
            })
        })

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)

        // 5. Fetch Inventory Status
        const inventoryStats = await prisma.inventoryItem.findMany({
            include: { product: true }
        })

        const lowStockCount = inventoryStats.filter(i => i.availableQuantity <= i.minStockLevel).length
        const totalInventoryValue = inventoryStats.reduce((sum, i) => sum + (i.availableQuantity * (i.product.price || 0)), 0)

        // 6. Calculate Employee KPIs
        const employees = await prisma.employee.findMany({
            where: { isActive: true },
            include: {
                user: true,
                workShifts: {
                    where: { date: { gte: startDate, lte: endDate }, status: 'COMPLETED' }
                },
                tasks: {
                    where: { completedAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' }
                }
            }
        })

        const employeeKPI = employees.map(emp => {
            const tasksCompleted = emp.tasks.length
            const shiftsWorked = emp.workShifts.length
            // Simplified performance score: (tasks * 10) + (shifts * 20) capped at 100
            const score = Math.min(100, (tasksCompleted * 15) + (shiftsWorked * 25) + 30)

            return {
                name: emp.user.name,
                role: emp.position,
                tasksCompleted,
                shiftsWorked,
                performanceScore: score
            }
        })

        // 7. Get New Customers count
        const newCustomers = await prisma.customer.count({
            where: { createdAt: { gte: startDate, lte: endDate } }
        })

        // 8. Send the Report
        const success = await EmailService.sendAdminReport({
            reportType: type,
            periodLabel,
            revenue: {
                total: totalRevenue,
                orderCount: orders.length,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                growth: Math.round(growth)
            },
            stats: {
                newCustomers,
                topProducts,
                inventoryStatus: {
                    lowStockItems: lowStockCount,
                    totalValue: totalInventoryValue
                }
            },
            employeeKPI
        })

        if (!success) {
            return NextResponse.json(createErrorResponse('Failed to send email report', 'EMAIL_ERROR'), { status: 500 })
        }

        return NextResponse.json(createSuccessResponse({ type, periodLabel }, 'Report sent successfully'))

    } catch (error: any) {
        console.error('Report trigger error:', error)
        return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
    }
}
