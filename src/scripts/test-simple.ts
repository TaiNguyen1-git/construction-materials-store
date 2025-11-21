// Simple Test for Enhanced Recommendations
import { RAGService } from '../lib/rag-service'

async function main() {
    console.log('Testing Enhanced Product Recommendations\n')

    // Test 1: Multiple cement options
    console.log('Test 1: xi mang tot')
    const test1 = await RAGService.getProductRecommendations('xi mang tot', 5)
    console.log(`Found ${test1.length} products`)
    test1.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - ${p.category} - ${p.pricing.basePrice}`)
    })

    const cementCount = test1.filter(p => p.category === 'Xi măng').length
    console.log(`Cement products: ${cementCount} (expected: 3-4)`)
    console.log(cementCount >= 3 ? 'PASS\n' : 'FAIL\n')

    // Test 2: Use-case - Foundation
    console.log('Test 2: xi mang do mong')
    const test2 = await RAGService.getProductRecommendations('xi mang do mong', 5)
    console.log(`Found ${test2.length} products`)
    test2.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name}`)
        if (p.usage) console.log(`     Usage: ${p.usage[0]}`)
    })

    const hasPC40 = test2.some(p => p.name.includes('PC40') || p.name.includes('PCB40'))
    console.log(`Has PC40/PCB40: ${hasPC40}`)
    console.log(hasPC40 ? 'PASS\n' : 'FAIL\n')

    // Test 3: Use-case - Walls
    console.log('Test 3: xi mang xay tuong')
    const test3 = await RAGService.getProductRecommendations('xi mang xay tuong', 5)
    console.log(`Found ${test3.length} products`)
    test3.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name}`)
    })

    const hasPC30 = test3.some(p => p.name.includes('PC30'))
    console.log(`Has PC30: ${hasPC30}`)
    console.log(hasPC30 ? 'PASS\n' : 'FAIL\n')

    // Test 4: Related products
    console.log('Test 4: xi mang (with related products)')
    const test4 = await RAGService.getProductRecommendations('xi mang', 5)
    console.log(`Found ${test4.length} products`)
    test4.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - ${p.category}`)
    })

    const hasCement = test4.some(p => p.category === 'Xi măng')
    const hasRelated = test4.some(p => p.category === 'Cát' || p.category === 'Đá')
    console.log(`Has cement: ${hasCement}, Has related: ${hasRelated}`)
    console.log(hasCement && hasRelated ? 'PASS\n' : 'PARTIAL\n')

    console.log('All tests complete!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
