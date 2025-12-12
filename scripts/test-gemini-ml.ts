
import { mlPredictionService } from '../src/lib/ml-prediction'
import { mlRecommendations } from '../src/lib/ml-recommendations'
import { prisma } from '../src/lib/prisma'

async function testGeminiML() {
    console.log('🚀 Starting Gemini ML Integration Test...')

    try {
        // 1. Get a test product
        console.log('\nPlease wait, fetching a product with orders...')
        const product = await prisma.product.findFirst({
            where: {
                orderItems: { some: {} }
            },
            include: { orderItems: true }
        })

        if (!product) {
            console.log('⚠️ No product with orders found. switching to MOCK mode to verify Gemini.')

            // Mock Prediction
            console.log('\n🔮 Testing Demand Prediction (Gemini) with MOCK data...')
            const mockHistory = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                quantity: Math.floor(Math.random() * 100) + 50
            }))

            const { AIService } = await import('../src/lib/ai-service')
            const forecast = await AIService.forecastDemand(mockHistory)
            console.log('Result:', JSON.stringify(forecast, null, 2))

            if (forecast.confidence > 0) console.log('✅ Gemini Forecast worked.')

            // Mock Recommendations
            console.log('\n🛒 Testing Smart Recommendations (Gemini) with MOCK data...')
            const recommendations = await AIService.getSmartRecommendations({
                viewedProduct: { name: "Xi măng Hà Tiên", category: "Xi măng", price: 90000 }
            })
            console.log('Result:', JSON.stringify(recommendations, null, 2))

            if (recommendations.length > 0) console.log('✅ Gemini Recommendations worked.')

            return
        }

        console.log(`📦 Testing with Product: ${product.name} (${product.id})`)

        // 2. Test Prediction
        console.log('\n🔮 Testing Demand Prediction (Gemini)...')
        const prediction = await mlPredictionService.predict(product.id)
        console.log('Result:', JSON.stringify(prediction, null, 2))

        if (prediction && prediction.factors.model_type.includes('Gemini')) {
            console.log('✅ Prediction used Gemini successfully.')
        } else {
            console.log('⚠️ Prediction returned fallback or failed.')
        }

        // 3. Test Recommendations
        console.log('\n🛒 Testing Similar Product Recommendations (Gemini)...')
        const recommendations = await mlRecommendations.getMLSimilarProducts(product.id)
        console.log('Result:', JSON.stringify(recommendations, null, 2))

        if (recommendations.length > 0) {
            console.log('✅ Recommendations returned data.')
        } else {
            console.log('⚠️ No recommendations returned (might be expected if DB is small).')
        }

    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testGeminiML()
