// Debug RAG Prompt Generation
import { RAGService } from '../lib/rag-service'

async function main() {
    console.log('Debug RAG Prompt Generation\n')

    // Test with "Xay nha o"
    console.log('Query: "Xay nha o"')

    // First, check if we get product recommendations
    const recs = await RAGService.getProductRecommendations('Xay nha o', 5)
    console.log(`Product recommendations: ${recs.length}`)
    recs.forEach(r => console.log(`  - ${r.name}`))
    console.log()

    // Then check the full prompt
    const prompt = await RAGService.generateAugmentedPrompt('Xay nha o')
    console.log('Prompt length:', prompt.length)
    console.log('Prompt preview (first 500 chars):')
    console.log(prompt.substring(0, 500))
    console.log()

    // Check if prompt contains examples
    console.log('Contains "YÊU CẦU":', prompt.includes('YÊU CẦU'))
    console.log('Contains "VÍ DỤ":', prompt.includes('VÍ DỤ'))
    console.log('Contains "Xây nhà ở":', prompt.includes('Xây nhà ở'))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
