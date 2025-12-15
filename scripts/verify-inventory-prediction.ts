
import { prisma } from '../src/lib/prisma';
import { AIService } from '../src/lib/ai-service';

async function verifyInventory() {
    console.log('🔍 Verifying Inventory Data...');

    // 1. Check Orders
    const orderCount = await prisma.order.count();
    console.log(`📦 Total Orders: ${orderCount}`);

    // 2. Check Order Items
    const orderItemCount = await prisma.orderItem.count();
    console.log(`🛒 Total Order Items: ${orderItemCount}`);

    if (orderCount === 0) {
        console.log('⚠️ No orders found! Predictions will likely fail or be empty.');
        return;
    }

    // 3. Test Prediction for one product
    const product = await prisma.product.findFirst({
        where: { isActive: true },
        include: { orderItems: true }
    });

    if (!product) {
        console.log('❌ No active products found.');
        return;
    }

    console.log(`🧪 Testing prediction for: ${product.name} (ID: ${product.id})`);
    console.log(`   - Order History: ${product.orderItems.length} items`);

    try {
        // Mock getHistoricalSales logic
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 12);

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: startDate, lte: endDate }, status: { not: 'CANCELLED' } },
            select: { id: true }
        });
        const orderIds = orders.map(o => o.id);

        const sales = await prisma.orderItem.findMany({
            where: { productId: product.id, orderId: { in: orderIds } },
            include: { order: true },
            orderBy: { order: { createdAt: 'asc' } }
        });

        const history = sales.map(s => ({
            date: s.order.createdAt.toISOString().split('T')[0],
            quantity: s.quantity
        }));

        console.log(`   - Sales Data Points: ${history.length}`);

        if (history.length === 0) {
            console.log('   ⚠️ No sales history in timeframe.');
        } else {
            // 4. Call AI Forecast
            console.log('   🤖 Calling AI Forecast...');
            const aiResult = await AIService.forecastDemand(product.id, history, 'MONTH');
            console.log('   🧠 AI Result:', JSON.stringify(aiResult, null, 2));
        }

    } catch (e) {
        console.error('❌ Error during verification:', e);
    }
}

verifyInventory();
