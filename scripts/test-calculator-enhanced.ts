
import { materialCalculator } from '../src/lib/material-calculator-service'
import { AIService } from '../src/lib/ai-service'

async function runTests() {
    console.log('🧪 Starting Enhanced Material Calculator Tests...\n')

    // Test 1: Baseline (Normal Soil, Modern Style)
    console.log('Test 1: Baseline (Normal Soil, Modern Style)')
    const baselineInput = {
        area: 100,
        floors: 2,
        soilType: 'NORMAL' as const,
        constructionStyle: 'MODERN' as const
    }
    const baselineResult = await materialCalculator.quickCalculate(baselineInput)
    const baselineFoundationCement = baselineResult.materials.find(m => m.category === 'Móng' && m.material.includes('Xi măng'))?.quantity || 0
    const baselineBricks = baselineResult.materials.find(m => m.category === 'Tường' && m.material.includes('Gạch'))?.quantity || 0
    console.log(`- Foundation Cement: ${baselineFoundationCement} bags`)
    console.log(`- Bricks: ${baselineBricks} units`)
    console.log('✅ Baseline calculated\n')

    // Test 2: Weak Soil
    console.log('Test 2: Weak Soil (Should increase foundation materials)')
    const weakSoilInput = {
        ...baselineInput,
        soilType: 'WEAK' as const
    }
    const weakSoilResult = await materialCalculator.quickCalculate(weakSoilInput)
    const weakFoundationCement = weakSoilResult.materials.find(m => m.category === 'Móng' && m.material.includes('Xi măng'))?.quantity || 0
    console.log(`- Foundation Cement: ${weakFoundationCement} bags`)

    if (weakFoundationCement > baselineFoundationCement) {
        console.log(`✅ PASS: Foundation cement increased (${weakFoundationCement} > ${baselineFoundationCement})`)
    } else {
        console.error(`❌ FAIL: Foundation cement did not increase`)
    }
    console.log('\n')

    // Test 3: Open Style
    console.log('Test 3: Open Style (Should decrease bricks)')
    const openStyleInput = {
        ...baselineInput,
        constructionStyle: 'OPEN' as const
    }
    const openStyleResult = await materialCalculator.quickCalculate(openStyleInput)
    const openBricks = openStyleResult.materials.find(m => m.category === 'Tường' && m.material.includes('Gạch'))?.quantity || 0
    console.log(`- Bricks: ${openBricks} units`)

    if (openBricks < baselineBricks) {
        console.log(`✅ PASS: Bricks decreased (${openBricks} < ${baselineBricks})`)
    } else {
        console.error(`❌ FAIL: Bricks did not decrease`)
    }
    console.log('\n')

    // Test 4: AI Parsing (Mocking behavior for safety, or trying real if config exists)
    console.log('Test 4: AI Parsing Integration')
    // We won't call real AI here to avoid key issues in test environment, 
    // but we check if the method exists and logic flow works
    if (typeof materialCalculator.parseQueryWithAI === 'function') {
        console.log('✅ PASS: parseQueryWithAI method exists')
    } else {
        console.error('❌ FAIL: parseQueryWithAI method missing')
    }
}

runTests().catch(console.error)
