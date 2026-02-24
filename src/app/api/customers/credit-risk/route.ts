
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/ai-service';
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api';

export async function GET(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request);
        if (!user || (user.role !== 'MANAGER' && user.role !== 'EMPLOYEE')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch customers with payment history/debt
        // Since schema doesn't have explicit PaymentHistory table, we infer from Invoices/Orders
        const customers = await prisma.customer.findMany({
            include: {
                user: { select: { name: true, email: true, phone: true } },
                invoices: {
                    where: { status: { in: ['PAID', 'OVERDUE'] } },
                    orderBy: { dueDate: 'desc' },
                    take: 10
                }
            },
            take: 10 // Analyze top 10 for demo/performance
        });

        const analysisResults = await Promise.all(customers.map(async (customer) => {
            // Prepare data for AI
            const historyData = {
                customerId: customer.id,
                customerName: customer.user.name,
                orderHistory: customer.invoices.map(inv => ({
                    amount: inv.totalAmount,
                    paidOnTime: inv.status === 'PAID',
                    date: inv.dueDate?.toISOString() || new Date().toISOString()
                })),
                totalDebt: customer.currentBalance,
                creditLimit: customer.creditLimit,
                paymentDays: []
            };

            const aiAssessment = await AIService.analyzeCreditRisk(historyData);

            return {
                customerId: customer.id,
                name: customer.user.name,
                currentDebt: customer.currentBalance,
                creditLimit: customer.creditLimit,
                riskScore: aiAssessment?.riskScore || 0,
                riskLevel: aiAssessment?.riskLevel || 'UNKNOWN',
                warning: aiAssessment?.recommendation || '',
                suggestedLimit: aiAssessment?.suggestedCreditLimit || customer.creditLimit
            };
        }));

        return NextResponse.json({
            data: analysisResults.sort((a, b) => b.riskScore - a.riskScore) // Sort by highest risk
        });

    } catch (error: any) {
        console.error('Credit risk API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
