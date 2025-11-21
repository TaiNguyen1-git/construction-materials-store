// Test Enhanced RAG Prompt
import { RAGService } from '../lib/rag-service'

async function main() {
    console.log('Testing Enhanced RAG Prompt\n')

    // Test 1: General query
    console.log('Test 1: "xi mang tot"')
    const prompt1 = await RAGService.generateAugmentedPrompt('xi mang tot')
    console.log('Generated prompt includes examples:', prompt1.includes('Xây nhà ở') ? 'YES ✅' : 'NO ❌')
    console.log()

    // Test 2: Use-case - Xây nhà ở
    console.log('Test 2: "Xay nha o"')
    const prompt2 = await RAGService.generateAugmentedPrompt('Xay nha o')
    console.log('Prompt length:', prompt2.length)
    console.log('Includes "Xây nhà ở" example:', prompt2.includes('Xây nhà ở') ? 'YES ✅' : 'NO ❌')
    console.log('Includes "kết cấu chịu lực":', prompt2.includes('kết cấu chịu lực') ? 'YES ✅' : 'NO ❌')
    console.log()

    // Test 3: Use-case - Đổ móng
    console.log('Test 3: "Do mong"')
    const prompt3 = await RAGService.generateAugmentedPrompt('Do mong')
    console.log('Includes "Đổ móng" example:', prompt3.includes('Đổ móng') ? 'YES ✅' : 'NO ❌')
    console.log('Includes PC40 recommendation:', prompt3.includes('PC40') ? 'YES ✅' : 'NO ❌')
    console.log()

    // Test 4: Use-case - Trát tường
    console.log('Test 4: "Trat tuong"')
    const prompt4 = await RAGService.generateAugmentedPrompt('Trat tuong')
    console.log('Includes "Trát tường" example:', prompt4.includes('Trát tường') ? 'YES ✅' : 'NO ❌')
    console.log('Includes PC30 recommendation:', prompt4.includes('PC30') ? 'YES ✅' : 'NO ❌')
    console.log()

    console.log('✅ All prompt tests complete!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
