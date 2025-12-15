
import { prisma } from '../src/lib/prisma';
import { AIService } from '../src/lib/ai-service';

async function debugCart() {
    console.log('🔍 Starting Cart Recommendation Debug...');

    // 1. Fetch available categories (Simulation of cart/route.ts)
    const allCategories = await prisma.category.findMany({
        select: { name: true },
        where: { isActive: true }
    });
    const availableCategoryNames = allCategories.map(c => c.name);
    console.log('📂 Available Categories in DB:', availableCategoryNames);

    // 2. Simulate Cart Item: Cát vàng
    const cartItems = [{
        name: "Cát vàng",
        category: "Cát",
        price: 320000
    }];

    console.log('🛒 Simulating Cart:', cartItems);

    // 3. Call AI Service
    console.log('🤖 Calling AI Service...');
    try {
        const aiResults = await AIService.getSmartRecommendations({
            cartItems: cartItems,
            availableCategories: availableCategoryNames
        });
        console.log('🧠 AI returned:', JSON.stringify(aiResults, null, 2));

        // 4. Test DB Matching Logic
        console.log('🕵️ Testing DB Match for each result...');
        for (const rec of aiResults) {
            const cleanName = rec.name.replace(/[^a-zA-Z0-9\s\u00C0-\u1EF9]/g, '').split(' ').slice(0, 2).join(' ').trim();
            console.log(`\n   Checking: "${rec.name}" (Clean: "${cleanName}", Cat: "${rec.category}")`);

            const dbProduct = await prisma.product.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: cleanName, mode: 'insensitive' } },
                        { category: { name: { contains: rec.category || cleanName, mode: 'insensitive' } } },
                        { name: { contains: rec.category || '______', mode: 'insensitive' } }
                    ]
                },
                select: { id: true, name: true, category: { select: { name: true } } }
            });

            if (dbProduct) {
                console.log(`   ✅ MATCH FOUND: ${dbProduct.name} (${dbProduct.category.name})`);
            } else {
                console.log(`   ❌ NO MATCH FOUND`);
            }
        }

    } catch (e) {
        console.error('❌ Error during debug:', e);
    }
}

debugCart();
