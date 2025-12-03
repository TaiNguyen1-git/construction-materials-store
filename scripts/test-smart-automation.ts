import 'dotenv/config'
import { AIService } from '../src/lib/ai-service'
import { RAGService } from '../src/lib/rag-service'
import { prisma } from '../src/lib/prisma'
import { getAIService, getGeminiModel } from '../src/lib/ai-service'

// Mock NextRequest/NextResponse for route testing if needed, 
// but here we can test the service logic directly to be faster and more precise.

async function testSmartAutomation() {
    console.log('🚀 Starting Smart Automation Test...\n')

    // Initialize services
    await RAGService.initialize()

    // ==========================================
    // TEST 1: Smart Order Parsing (Standard)
    // ==========================================
    console.log('----------------------------------------')
    console.log('🧪 TEST 1: Smart Order Parsing (Standard)')
    const input1 = "Lấy cho anh 100 viên gạch ống và 5 bao xi măng Hà Tiên"
    console.log(`Input: "${input1}"`)

    const result1 = await AIService.parseOrderRequest(input1)
    console.log('Result:', JSON.stringify(result1, null, 2))

    if (result1?.items?.length === 2 && result1.items[0].quantity === 100 && result1.items[1].quantity === 5) {
        console.log('✅ TEST 1 PASSED')
    } else {
        console.log('❌ TEST 1 FAILED')
    }

    // ==========================================
    // TEST 2: Smart Order Parsing (Colloquial/Slang)
    // ==========================================
    console.log('\n----------------------------------------')
    console.log('🧪 TEST 2: Smart Order Parsing (Colloquial/Slang)')
    const input2 = "Ê shop, chở qua nhà tui 50 bao xi măng Hà Tiên với 1 xe cát nha, địa chỉ 123 Nguyễn Văn Linh Q7"
    console.log(`Input: "${input2}"`)

    const result2 = await AIService.parseOrderRequest(input2)
    console.log('Result:', JSON.stringify(result2, null, 2))

    const hasCement = result2?.items?.some((i: any) => i.productName.toLowerCase().includes('xi măng') && i.quantity === 50)
    const hasSand = result2?.items?.some((i: any) => i.productName.toLowerCase().includes('cát') && (i.unit === 'xe' || i.unit === 'khối' || i.quantity === 1))
    const hasAddress = result2?.deliveryAddress?.includes('123 Nguyễn Văn Linh')

    if (hasCement && hasSand && hasAddress) {
        console.log('✅ TEST 2 PASSED')
    } else {
        console.log('❌ TEST 2 FAILED')
    }

    // ==========================================
    // TEST 3: Policy RAG (Shipping)
    // ==========================================
    console.log('\n----------------------------------------')
    console.log('🧪 TEST 3: Policy RAG (Shipping)')
    const input3 = "Shop có freeship không?"
    console.log(`Input: "${input3}"`)

    const prompt3 = await RAGService.generateAugmentedPrompt(input3)
    console.log('Generated Prompt Context (Snippet):', prompt3.substring(0, 200) + '...')

    if ((prompt3.includes('THÔNG TIN GIAO HÀNG') || prompt3.includes('Chính sách giao hàng')) && prompt3.includes('5 triệu')) {
        console.log('✅ TEST 3 PASSED')
    } else {
        console.log('❌ TEST 3 FAILED')
    }

    // ==========================================
    // TEST 4: Policy RAG (Returns)
    // ==========================================
    console.log('\n----------------------------------------')
    console.log('🧪 TEST 4: Policy RAG (Returns)')
    const input4 = "Mua dư có trả lại được không?"
    console.log(`Input: "${input4}"`)

    const prompt4 = await RAGService.generateAugmentedPrompt(input4)
    console.log('Generated Prompt Context (Snippet):', prompt4.substring(0, 200) + '...')

    if ((prompt4.includes('THÔNG TIN ĐỔI TRẢ') || prompt4.includes('Chính sách đổi trả')) && prompt4.includes('3 ngày')) {
        console.log('✅ TEST 4 PASSED')
    } else {
        console.log('❌ TEST 4 FAILED')
    }
}

testSmartAutomation().catch(console.error)
