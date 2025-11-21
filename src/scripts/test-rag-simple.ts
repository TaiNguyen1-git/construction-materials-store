
import { RAGService } from '../lib/rag-service';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Initializing RAG Service...');
    try {
        // Initialize vector store (loads products from DB)
        await RAGService.initialize();
        console.log('RAG Service initialized successfully.');

        const query = 'Có loại xi măng nào chống thấm tốt không?';
        console.log(`\nTesting retrieval for query: "${query}"`);

        const results = await RAGService.retrieveContext(query);

        console.log(`\nFound ${results.length} relevant products:`);
        results.forEach((prod, index) => {
            console.log(`${index + 1}. ${prod.name} (${prod.brand}) - Price: ${prod.pricing.basePrice}`);
        });

        if (results.length > 0) {
            console.log('\n✅ RAG Retrieval Test Passed!');
        } else {
            console.log('\n⚠️ No results found. Check if database has products or if embeddings are working.');
        }

    } catch (error) {
        console.error('❌ RAG Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
