import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api';

export async function POST(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, reason } = body;

        if (!amount || amount <= 0 || !reason) {
            return NextResponse.json({ error: 'Amount and reason are required' }, { status: 400 });
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        // Create CreditApproval request
        // Since this is a Limit Increase, orderId is null
        const approval = await prisma.creditApproval.create({
            data: {
                customerId: customer.id,
                orderId: null,
                requestedAmount: amount, // The increase amount requested
                currentDebt: customer.currentBalance,
                creditLimit: customer.creditLimit,
                reason: `Yêu cầu nâng hạn mức: ${reason}`,
                status: 'PENDING',
                notes: 'LIMIT_INCREASE_REQUEST' // Use notes to explicitly tag it
            }
        });

        return NextResponse.json({
            success: true,
            data: approval,
            message: 'Yêu cầu của bạn đã được gửi và đang chờ Admin duyệt.'
        });

    } catch (error: any) {
        console.error('Credit Increase Request Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
