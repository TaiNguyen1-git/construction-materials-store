// Debug RAG Search
import { RAGService } from '../lib/rag-service'

async function main() {
    console.log('Debug RAG Search\n')

    // Test with Vietnamese diacritics
    console.log('Test 1: "xi măng" (with diacritics)')
    const test1 = await RAGService.retrieveContext('xi măng', 5)
    console.log(`Results: ${test1.length}`)
    test1.forEach(p => console.log(`  - ${p.name}`))

    console.log('\nTest 2: "xi mang" (without diacritics)')
    const test2 = await RAGService.retrieveContext('xi mang', 5)
    console.log(`Results: ${test2.length}`)
    test2.forEach(p => console.log(`  - ${p.name}`))

    console.log('\nTest 3: "cement"')
    const test3 = await RAGService.retrieveContext('cement', 5)
    console.log(`Results: ${test3.length}`)
    test3.forEach(p => console.log(`  - ${p.name}`))

    console.log('\nTest 4: "gạch"')
    const test4 = await RAGService.retrieveContext('gạch', 5)
    console.log(`Results: ${test4.length}`)
    test4.forEach(p => console.log(`  - ${p.name}`))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
