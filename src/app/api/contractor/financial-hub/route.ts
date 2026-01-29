import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api';

export async function GET(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request);
        if (!user || user.role !== 'CONTRACTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId },
            include: {
                contractorProfile: true
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
        }

        // 1. Get Debt Summary
        const totalDebt = customer.currentBalance;
        const creditLimit = customer.creditLimit;

        // 2. Calculate Escrow Balance 
        // Logic: Sum of QuoteRequest milestones that are 'FUNDED' but not 'RELEASED'
        // This is a simplification. Assuming funded milestones are held in escrow.
        const escrowQuotes = await prisma.quoteRequest.findMany({
            where: { contractorId: customer.id },
            include: { milestones: true }
        });

        let escrowBalance = 0;
        escrowQuotes.forEach(quote => {
            if (quote.milestones) {
                escrowBalance += quote.milestones
                    .filter(m => m.status === 'FUNDED')
                    .reduce((sum, m) => sum + m.amount, 0);
            }
        });

        // 3. Aggregate Debt By Project
        // We find orders that are not fully paid (PAYMENT_STATUS != PAID) linked to this contractor
        // and group them by projectId.
        // Since Prisma GroupBy has limitations with Relations, we fetch and process.

        // Fetch orders first (without relation include to avoid stale schema errors)
        const debtOrdersRaw = await prisma.order.findMany({
            where: {
                customerId: customer.id,
                paymentStatus: { not: 'PAID' },
                status: { notIn: ['CANCELLED', 'RETURNED'] }
            },
            include: {
                invoices: { select: { id: true, invoiceNumber: true, dueDate: true, totalAmount: true, paidAmount: true, status: true } }
            }
        });

        // Manually fetch projects to avoid "Unknown field project" if schema is stale
        const projectIds = Array.from(new Set(debtOrdersRaw.map((o: any) => o.projectId).filter(Boolean))) as string[];

        const fetchedProjects = await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true, startDate: true }
        });

        const projectMap = new Map(fetchedProjects.map(p => [p.id, p]));

        // Combine data
        const debtOrders = debtOrdersRaw.map((order: any) => ({
            ...order,
            project: order.projectId ? projectMap.get(order.projectId) : null
        }));

        const projectDebtMap = new Map();
        const invoicesList: any[] = [];
        let dueThisWeek = 0;
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        debtOrders.forEach(order => {
            // Aggregate Project Data
            const projectId = order.projectId || 'uncategorized';
            const projectName = order.project?.name || 'Vật tư lẻ / Khác';
            const projectStartDate = order.project?.startDate ? new Date(order.project.startDate).toISOString().split('T')[0] : 'N/A';

            // Calculate remaining debt for this order
            // If invoices exist, use invoice data. If not, use order remaining amount.
            // Simplified: Use Order remainingAmount (assuming it tracks debt)
            // Or better: Use invoice logic if available.
            // Let's fallback to Order amounts for robustness.
            let debtAmount = order.remainingAmount || (order.totalAmount - (order.depositAmount || 0));
            // Check Invoices for more accurate overdue status
            let hasOverdue = false;
            let nextDueDate: string | null = null;

            if (order.invoices && order.invoices.length > 0) {
                // Use invoices for detail
                order.invoices.forEach((inv: any) => {
                    if (inv.status !== 'PAID') {
                        const remaining = inv.totalAmount - inv.paidAmount;
                        // Add to list
                        invoicesList.push({
                            id: inv.id,
                            invoiceNumber: inv.invoiceNumber,
                            projectName: projectName,
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : 'N/A',
                            amount: inv.totalAmount,
                            paid: inv.paidAmount,
                            status: inv.status
                        });

                        // Check overdue
                        if (inv.dueDate) {
                            const due = new Date(inv.dueDate);
                            if (due < today) hasOverdue = true;
                            // Include OVERDUE items in 'Due This Week' metric as they are immediately payable
                            if (due <= nextWeek) dueThisWeek += remaining;

                            // Track earliest due date
                            const dueStr = due.toISOString().split('T')[0];
                            if (!nextDueDate || dueStr < nextDueDate) {
                                nextDueDate = dueStr;
                            }
                        }
                    }
                });
            } else {
                // If no invoice yet, but order is debt
                // Maybe it's PENDING invoice
                // For this MVP, we treat order as debt source if PaymentType is DEPOSIT/CREDIT
            }

            if (!projectDebtMap.has(projectId)) {
                projectDebtMap.set(projectId, {
                    id: projectId,
                    name: projectName,
                    startDate: projectStartDate,
                    debtAmount: 0,
                    overdueAmount: 0,
                    nextDueDate: null,
                    daysLeft: 0,
                    hasOverdue: false
                });
            }

            const currentProject = projectDebtMap.get(projectId);
            currentProject.debtAmount += debtAmount;

            // Accrue overdue amount
            if (order.invoices && order.invoices.length > 0) {
                order.invoices.forEach((inv: any) => {
                    const due = inv.dueDate ? new Date(inv.dueDate) : null;
                    const remaining = inv.totalAmount - inv.paidAmount;
                    if (due && due < today && inv.status !== 'PAID') {
                        currentProject.overdueAmount += remaining;
                    }
                });
            }

            if (hasOverdue) currentProject.hasOverdue = true;

            if (nextDueDate) {
                // Update project earliest due date
                if (!currentProject.nextDueDate || new Date(nextDueDate) < new Date(currentProject.nextDueDate)) {
                    currentProject.nextDueDate = nextDueDate;

                    // improved days calculations
                    const targetDate = new Date(nextDueDate);
                    const diffTime = targetDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    currentProject.daysLeft = diffDays;
                }
            }
        });

        const projects = Array.from(projectDebtMap.values());

        return NextResponse.json({
            data: {
                summary: {
                    totalDebt,
                    creditLimit,
                    escrowBalance,
                    dueThisWeek
                },
                projects,
                invoices: invoicesList
            }
        });

    } catch (error: any) {
        console.error('Financial Hub API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
