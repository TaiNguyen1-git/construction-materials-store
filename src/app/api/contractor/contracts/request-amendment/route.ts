import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api';

export async function POST(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request);
        if (!user || user.role !== 'CONTRACTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { contractId, type, reason } = body;

        if (!contractId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
        }

        // Create a Support Ticket or a specific ContractAmendmentRequest
        // For now, let's create a Support Ticket marked as CONTRACT_AMENDMENT
        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber: `TK-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
                customerId: customer.id,
                subject: `Yêu cầu điều chỉnh hợp đồng: ${type || 'Gia hạn'}`,
                description: reason.substring(0, 200), // Required field
                status: 'OPEN',
                priority: 'HIGH',
                category: 'CONTRACT',
                messages: {
                    create: {
                        content: `Hợp đồng ID: ${contractId}\nLý do: ${reason}`,
                        senderType: 'CUSTOMER',
                        senderId: user.userId,
                        senderName: user.name || 'Nhà thầu'
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Yêu cầu của bạn đã được gửi tới bộ phận pháp lý.',
            ticketId: ticket.id
        });

    } catch (error: any) {
        console.error('Contract Amendment API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
