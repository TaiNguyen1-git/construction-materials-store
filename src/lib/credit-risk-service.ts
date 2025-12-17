/**
 * Enhanced Credit Risk Analysis Service
 * Analyzes customer creditworthiness using actual database data
 */

import { prisma } from './prisma'

export interface CreditRiskResult {
    customerId: string
    customerName: string
    riskScore: number // 0-100 (0 = safe, 100 = high risk)
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    suggestedCreditLimit: number
    currentDebt: number
    maxCreditLimit: number
    factors: {
        paymentHistory: number // 0-30 points
        debtRatio: number // 0-25 points
        orderFrequency: number // 0-20 points
        accountAge: number // 0-15 points
        recentBehavior: number // 0-10 points
    }
    warnings: string[]
    recommendations: string[]
}

export class CreditRiskService {
    /**
     * Analyze credit risk for a specific customer
     */
    static async analyzeCustomer(customerId: string): Promise<CreditRiskResult | null> {
        try {
            // Get customer with all related data
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                include: {
                    user: true, // For name
                    orders: {
                        include: {
                            invoices: {
                                include: {
                                    payments: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 50
                    },
                    invoices: true // For current debt calculation
                }
            })

            if (!customer) return null

            // Calculate each factor
            const factors = {
                paymentHistory: await this.calculatePaymentHistoryScore(customer),
                debtRatio: this.calculateDebtRatioScore(customer),
                orderFrequency: this.calculateOrderFrequencyScore(customer),
                accountAge: this.calculateAccountAgeScore(customer),
                recentBehavior: await this.calculateRecentBehaviorScore(customer)
            }

            // Total risk score (higher = riskier)
            const riskScore = factors.paymentHistory + factors.debtRatio +
                factors.orderFrequency + factors.recentBehavior +
                (15 - factors.accountAge) // Invert account age (new accounts = higher risk)

            // Determine risk level
            let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            if (riskScore <= 25) riskLevel = 'LOW'
            else if (riskScore <= 50) riskLevel = 'MEDIUM'
            else if (riskScore <= 75) riskLevel = 'HIGH'
            else riskLevel = 'CRITICAL'

            // Calculate current debt
            const currentDebt = customer.invoices
                .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
                .reduce((sum, i) => sum + i.balanceAmount, 0)

            // Suggested credit limit based on risk
            const baseLimit = customer.creditLimit || 50000000 // 50M default
            let suggestedMultiplier = 1
            if (riskLevel === 'LOW') suggestedMultiplier = 1.2
            else if (riskLevel === 'MEDIUM') suggestedMultiplier = 1.0
            else if (riskLevel === 'HIGH') suggestedMultiplier = 0.7
            else suggestedMultiplier = 0.3

            const suggestedCreditLimit = Math.round(baseLimit * suggestedMultiplier)

            // Generate warnings
            const warnings: string[] = []
            if (factors.paymentHistory > 20) warnings.push('Lịch sử thanh toán kém')
            if (factors.debtRatio > 15) warnings.push('Tỷ lệ nợ cao')
            if (factors.recentBehavior > 5) warnings.push('Hành vi gần đây đáng lo ngại')
            if (currentDebt > baseLimit * 0.8) warnings.push('Gần đạt giới hạn tín dụng')

            // Generate recommendations
            const recommendations: string[] = []
            if (riskLevel === 'LOW') {
                recommendations.push('Khách hàng uy tín, có thể tăng hạn mức')
            } else if (riskLevel === 'MEDIUM') {
                recommendations.push('Theo dõi thanh toán định kỳ')
            } else if (riskLevel === 'HIGH') {
                recommendations.push('Yêu cầu thanh toán trước khi giao hàng')
                recommendations.push('Giảm hạn mức tín dụng')
            } else {
                recommendations.push('DỪNG cấp thêm tín dụng')
                recommendations.push('Thu hồi công nợ ngay')
            }

            return {
                customerId,
                customerName: customer.companyName || customer.user.name,
                riskScore,
                riskLevel,
                suggestedCreditLimit,
                currentDebt,
                maxCreditLimit: customer.creditLimit || 50000000,
                factors,
                warnings,
                recommendations
            }
        } catch (error) {
            console.error('Credit risk analysis error:', error)
            return null
        }
    }

    /**
     * Payment history score (0-30, higher = worse)
     */
    private static async calculatePaymentHistoryScore(customer: any): Promise<number> {
        const orders = customer.orders || []
        if (orders.length === 0) return 15 // Unknown = medium risk

        let latePayments = 0
        let onTimePayments = 0

        for (const order of orders) {
            if (order.invoices && order.invoices.length > 0) {
                for (const invoice of order.invoices) {
                    if (invoice.status === 'PAID') {
                        // Check if paid on time (before due date)
                        const dueDate = invoice.dueDate ? new Date(invoice.dueDate).getTime() : new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000

                        // Find latest payment date
                        let paidAt = new Date(invoice.updatedAt).getTime() // Fallback
                        if (invoice.payments && invoice.payments.length > 0) {
                            const lastPayment = invoice.payments.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
                            paidAt = new Date(lastPayment.paymentDate).getTime()
                        }

                        if (paidAt <= dueDate) onTimePayments++
                        else latePayments++
                    } else if (invoice.status === 'OVERDUE') {
                        latePayments++
                    }
                }
            }
        }

        const total = latePayments + onTimePayments
        if (total === 0) return 15

        const lateRatio = latePayments / total
        return Math.round(lateRatio * 30)
    }

    /**
     * Debt ratio score (0-25, higher = worse)
     */
    private static calculateDebtRatioScore(customer: any): number {
        const currentDebt = (customer.invoices || [])
            .filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED')
            .reduce((sum: number, i: any) => sum + i.balanceAmount, 0)

        const creditLimit = customer.creditLimit || 50000000
        const ratio = currentDebt / creditLimit

        if (ratio <= 0.3) return 0
        if (ratio <= 0.5) return 8
        if (ratio <= 0.7) return 15
        if (ratio <= 0.9) return 20
        return 25
    }

    /**
     * Order frequency score (0-20, higher for irregular = worse)
     */
    private static calculateOrderFrequencyScore(customer: any): number {
        const orders = customer.orders || []
        if (orders.length < 3) return 10 // Not enough data

        // Calculate average days between orders
        const dates = orders.map((o: any) => new Date(o.createdAt).getTime()).sort()
        let totalGap = 0
        for (let i = 1; i < dates.length; i++) {
            totalGap += dates[i] - dates[i - 1]
        }
        const avgGap = totalGap / (dates.length - 1) / (1000 * 60 * 60 * 24) // in days

        // Regular customers (order every 1-2 weeks) = low risk
        if (avgGap <= 14) return 0
        if (avgGap <= 30) return 5
        if (avgGap <= 60) return 10
        return 20 // Irregular ordering = higher risk
    }

    /**
     * Account age score (0-15, higher = better/safer)
     */
    private static calculateAccountAgeScore(customer: any): number {
        const createdAt = new Date(customer.createdAt)
        const now = new Date()
        const monthsOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)

        if (monthsOld >= 24) return 15 // 2+ years = very trusted
        if (monthsOld >= 12) return 12
        if (monthsOld >= 6) return 8
        if (monthsOld >= 3) return 4
        return 0 // New account = unknown
    }

    /**
     * Recent behavior score (0-10, higher = worse)
     */
    private static async calculateRecentBehaviorScore(customer: any): Promise<number> {
        // Check last 30 days behavior
        const recentOrders = (customer.orders || []).filter((o: any) => {
            const orderDate = new Date(o.createdAt)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            return orderDate >= thirtyDaysAgo
        })

        // No recent activity could be concerning for regular customers
        if (recentOrders.length === 0 && customer.orders.length > 5) return 3

        // Check for recent payment issues
        let recentIssues = 0
        for (const order of recentOrders) {
            if (order.invoices) {
                for (const invoice of order.invoices) {
                    if (invoice.status === 'OVERDUE') recentIssues++
                }
            }
        }

        return Math.min(10, recentIssues * 3)
    }

    /**
     * Batch analyze all contractor customers
     */
    static async analyzeAllContractors(): Promise<CreditRiskResult[]> {
        const contractors = await prisma.customer.findMany({
            where: { customerType: 'CONTRACTOR' },
            select: { id: true }
        })

        const results: CreditRiskResult[] = []
        for (const contractor of contractors) {
            const result = await this.analyzeCustomer(contractor.id)
            if (result) results.push(result)
        }

        // Sort by risk score (highest first)
        return results.sort((a, b) => b.riskScore - a.riskScore)
    }
}

export default CreditRiskService
