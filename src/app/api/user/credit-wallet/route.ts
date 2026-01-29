import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api';

export async function GET(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        // 2. Aggregate Debt and Invoices (Real-time calculation)
        const debtOrdersRaw = await prisma.order.findMany({
            where: {
                customerId: customer.id,
                paymentStatus: { not: 'PAID' },
                status: { notIn: ['CANCELLED', 'RETURNED'] }
            },
            include: {
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        dueDate: true,
                        totalAmount: true,
                        paidAmount: true,
                        status: true,
                        orderId: true
                    }
                }
            }
        });

        const invoicesList: any[] = [];
        let calculatedDebt = 0;
        let dueThisWeek = 0;
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        debtOrdersRaw.forEach(order => {
            // Calculate unpaid amount for this order (matching Contractor Finance logic)
            const unpaidOrder = order.remainingAmount || (order.netAmount - (order.depositAmount || 0));
            calculatedDebt += unpaidOrder;

            if (order.invoices && order.invoices.length > 0) {
                order.invoices.forEach((inv: any) => {
                    if (inv.status !== 'PAID') {
                        const remaining = inv.totalAmount - inv.paidAmount;
                        invoicesList.push({
                            id: inv.id,
                            invoiceNumber: inv.invoiceNumber,
                            orderId: inv.orderId,
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : 'N/A',
                            amount: inv.totalAmount,
                            paid: inv.paidAmount,
                            status: inv.status
                        });

                        if (inv.dueDate) {
                            const due = new Date(inv.dueDate);
                            if (due <= nextWeek) dueThisWeek += remaining;
                        }
                    }
                });
            } else {
                // If no invoice yet, add the order itself to the list as a pending item
                invoicesList.push({
                    id: order.id,
                    invoiceNumber: `ORD-${order.orderNumber}`,
                    orderId: order.id,
                    dueDate: 'Chờ hóa đơn',
                    amount: order.netAmount,
                    paid: order.depositAmount || 0,
                    status: 'PENDING'
                });
            }
        });

        // Use the maximum of calculated debt and currentBalance to be safe
        const finalTotalDebt = Math.max(calculatedDebt, customer.currentBalance);

        // 3. Simple Summary for User
        return NextResponse.json({
            data: {
                summary: {
                    totalDebt: finalTotalDebt,
                    creditLimit: customer.creditLimit,
                    dueThisWeek,
                    usagePercent: customer.creditLimit > 0 ? (finalTotalDebt / customer.creditLimit) * 100 : 0
                },
                invoices: invoicesList
            }
        });

    } catch (error: any) {
        console.error('User Credit Wallet API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
