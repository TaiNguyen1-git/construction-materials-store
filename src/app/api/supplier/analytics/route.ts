
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PurchaseOrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const supplierId = searchParams.get('supplierId');

        if (!supplierId) {
            return NextResponse.json(
                { success: false, error: 'Supplier ID is required' },
                { status: 400 }
            );
        }

        // 1. Fetch Performance Metrics
        const ratings = await prisma.supplierDeliveryRating.findMany({
            where: { supplierId },
            select: {
                qualityRating: true,
                packagingRating: true,
                accuracyRating: true,
                overallScore: true,
            },
            take: 100, // Limit to recent 100 ratings for performance
            orderBy: { createdAt: 'desc' },
        });

        let performance = {
            overall: 5.0,
            quality: 5.0,
            delivery: 5.0,
            accuracy: 5.0,
        };

        if (ratings.length > 0) {
            const sum = ratings.reduce(
                (acc, r) => ({
                    overall: acc.overall + r.overallScore,
                    quality: acc.quality + r.qualityRating,
                    delivery: acc.delivery + r.packagingRating, // Using packaging as proxy for delivery quality
                    accuracy: acc.accuracy + r.accuracyRating,
                }),
                { overall: 0, quality: 0, delivery: 0, accuracy: 0 }
            );

            performance = {
                overall: sum.overall / ratings.length,
                quality: sum.quality / ratings.length,
                delivery: sum.delivery / ratings.length,
                accuracy: sum.accuracy / ratings.length,
            };
        }

        // 2. Fetch Monthly Revenue (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const orders = await prisma.purchaseOrder.findMany({
            where: {
                supplierId,
                status: {
                    in: [
                        'CONFIRMED',
                        'RECEIVED',
                        'PARTIALLY_RETURNED',
                        'SENT'
                    ] as any, // Using 'any' to bypass stale Prisma Client types for PARTIALLY_RETURNED
                },
                orderDate: {
                    gte: sixMonthsAgo,
                },
            },
            select: {
                totalAmount: true,
                orderDate: true,
            },
        });

        const monthlyRevenue: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${months[d.getMonth()]}`;
            monthlyRevenue[monthKey] = 0;
        }

        orders.forEach((order) => {
            const month = months[order.orderDate.getMonth()];
            if (monthlyRevenue[month] !== undefined) {
                monthlyRevenue[month] += order.totalAmount;
            }
        });

        // 3. Fetch Top Products
        // This is more complex since we need to aggregate PurchaseItems
        // Prisma doesn't support deep aggregation easily without raw queries or grouping
        // We'll fetch items for this supplier's orders

        // First find all PO IDs for this supplier (all time)
        // To limit load, maybe last year? Or just fetch relevant items directly.
        // We can use groupBy on PurchaseItem, filtered by purchaseOrder.supplierId
        // But PurchaseItem doesn't have supplierId directly. It has purchaseOrderId.
        // We can allow filtering PurchaseItem by relation? No, groupBy doesn't support that well in Mongo?
        // Start with fetch recent orders and their items.

        const recentOrders = await prisma.purchaseOrder.findMany({
            where: { supplierId, status: { in: [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.RECEIVED] } },
            select: { id: true },
            orderBy: { orderDate: 'desc' },
            take: 50 // Analyze last 50 orders for top products
        });

        const orderIds = recentOrders.map(o => o.id);

        const items = await prisma.purchaseItem.findMany({
            where: {
                purchaseOrderId: { in: orderIds }
            },
            include: {
                product: {
                    select: { name: true }
                }
            }
        });

        const productStats: Record<string, { quantity: number, name: string }> = {};

        items.forEach(item => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = { quantity: 0, name: item.product.name };
            }
            productStats[item.productId].quantity += item.quantity;
        });

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return NextResponse.json({
            success: true,
            data: {
                performance,
                monthlyRevenue,
                topProducts,
            },
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
