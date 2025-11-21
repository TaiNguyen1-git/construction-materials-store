// Test Enhanced Product Recommendations
// Run: npx tsx src/scripts/test-enhanced-recommendations.ts

import { RAGService } from '../lib/rag-service'

async function main() {
    console.log('🧪 Testing Enhanced Product Recommendations...\n')

    // Test Case 1: Multiple cement options
    console.log('='.repeat(50))
    console.log('Test Case 1: Query "xi măng tốt"')
    console.log('Expected: Should return ALL 4 cement types')
    console.log('='.repeat(50))

    const test1 = await RAGService.getProductRecommendations('xi măng tốt', 5)
    console.log(`\n✅ Found ${test1.length} products:`)
    test1.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.pricing.basePrice.toLocaleString()}đ/${p.pricing.unit}`)
        console.log(`   Category: ${p.category}`)
    })

    const cementCount = test1.filter(p => p.category === 'Xi măng').length
    if (cementCount >= 3) {
        console.log(`\n✅ Test Case 1 PASSED: Found ${cementCount} cement types`)
    } else {
        console.log(`\n❌ Test Case 1 FAILED: Only found ${cementCount} cement types (expected 3-4)`)
    }

    // Test Case 2: Use-case specific - Foundation
    console.log('\n' + '='.repeat(50))
    console.log('Test Case 2: Query "xi măng đổ móng"')
    console.log('Expected: Should find PC40/PCB40 (suitable for foundations)')
    console.log('='.repeat(50))

    const test2 = await RAGService.getProductRecommendations('xi măng đổ móng', 5)
    console.log(`\n✅ Found ${test2.length} products:`)
    test2.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.pricing.basePrice.toLocaleString()}đ/${p.pricing.unit}`)
        if (p.usage) {
            console.log(`   Usage: ${p.usage.slice(0, 2).join(', ')}`)
        }
    })

    const foundationCement = test2.filter(p =>
        p.name.includes('PC40') || p.name.includes('PCB40')
    )
    if (foundationCement.length > 0) {
        console.log(`\n✅ Test Case 2 PASSED: Found suitable cement for foundations`)
    } else {
        console.log(`\n❌ Test Case 2 FAILED: Did not find PC40/PCB40 cement`)
    }

    // Test Case 3: Use-case specific - Walls
    console.log('\n' + '='.repeat(50))
    console.log('Test Case 3: Query "xi măng xây tường"')
    console.log('Expected: Should find PC30 (suitable for masonry)')
    console.log('='.repeat(50))

    const test3 = await RAGService.getProductRecommendations('xi măng xây tường', 5)
    console.log(`\n✅ Found ${test3.length} products:`)
    test3.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.pricing.basePrice.toLocaleString()}đ/${p.pricing.unit}`)
        if (p.usage) {
            console.log(`   Usage: ${p.usage.slice(0, 2).join(', ')}`)
        }
    })

    const masonryCement = test3.filter(p =>
        p.name.includes('PC30')
    )
    if (masonryCement.length > 0) {
        console.log(`\n✅ Test Case 3 PASSED: Found suitable cement for walls`)
    } else {
        console.log(`\n❌ Test Case 3 FAILED: Did not find PC30 cement`)
    }

    // Test Case 4: Related products still work
    console.log('\n' + '='.repeat(50))
    console.log('Test Case 4: Query "xi măng"')
    console.log('Expected: Should show cement + suggest sand/stone')
    console.log('='.repeat(50))

    const test4 = await RAGService.getProductRecommendations('xi măng', 5)
    console.log(`\n✅ Found ${test4.length} products:`)
    test4.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p.category}) - ${p.pricing.basePrice.toLocaleString()}đ/${p.pricing.unit}`)
    })

    const hasCement = test4.some(p => p.category === 'Xi măng')
    const hasRelated = test4.some(p => p.category === 'Cát' || p.category === 'Đá')

    if (hasCement && hasRelated) {
        console.log(`\n✅ Test Case 4 PASSED: Shows cement + related products`)
    } else if (hasCement) {
        console.log(`\n⚠️  Test Case 4 PARTIAL: Shows cement but no related products`)
    } else {
        console.log(`\n❌ Test Case 4 FAILED: Missing cement or related products`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Testing Complete!')
    console.log('='.repeat(50))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
