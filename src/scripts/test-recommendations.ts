
import { RAGService } from '../lib/rag-service'
import { prisma } from '../lib/prisma'

async function testRecommendations() {
    console.log('🧪 Testing Improved Product Recommendations...')

    try {
        // Initialize RAG Service
        await RAGService.initialize()

        // Test Case 1: Xi măng -> Expect Cát, Đá
        console.log('\n-----------------------------------')
        console.log('Test Case 1: Query "Xi măng"')
        const results1 = await RAGService.getProductRecommendations("Xi măng", 5)

        console.log(`Found ${results1.length} recommendations:`)
        results1.forEach(p => console.log(`- ${p.name} (${p.category}) [${p.id}]`))

        const hasCement = results1.some(p => p.category.toLowerCase().includes('xi măng') || p.name.toLowerCase().includes('xi măng'))
        const hasSand = results1.some(p => p.category.toLowerCase().includes('cát') || p.name.toLowerCase().includes('cát'))
        const hasStone = results1.some(p => p.category.toLowerCase().includes('đá') || p.name.toLowerCase().includes('đá'))

        if (hasCement && (hasSand || hasStone)) {
            console.log('✅ Test Case 1 PASSED: Found primary product (Xi măng) and related products (Cát/Đá)')
        } else {
            console.log('❌ Test Case 1 FAILED: Missing related products')
            console.log(`Has Cement: ${hasCement}, Has Sand: ${hasSand}, Has Stone: ${hasStone}`)
        }

        // Test Case 2: Gạch -> Expect Xi măng, Cát
        console.log('\n-----------------------------------')
        console.log('Test Case 2: Query "Gạch"')
        const results2 = await RAGService.getProductRecommendations("Gạch", 5)

        console.log(`Found ${results2.length} recommendations:`)
        results2.forEach(p => console.log(`- ${p.name} (${p.category}) [${p.id}]`))

        const hasBrick = results2.some(p => p.category.toLowerCase().includes('gạch') || p.name.toLowerCase().includes('gạch'))
        const hasCement2 = results2.some(p => p.category.toLowerCase().includes('xi măng') || p.name.toLowerCase().includes('xi măng'))

        if (hasBrick && hasCement2) {
            console.log('✅ Test Case 2 PASSED: Found primary product (Gạch) and related products (Xi măng)')
        } else {
            console.log('❌ Test Case 2 FAILED: Missing related products')
            console.log(`Has Brick: ${hasBrick}, Has Cement: ${hasCement2}`)
        }

    } catch (error) {
        console.error('Test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testRecommendations()
