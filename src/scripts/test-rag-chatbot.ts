
import 'dotenv/config';
import { AIService } from '../lib/ai-service';
import { RAGService } from '../lib/rag-service';
import { prisma } from '../lib/prisma';
import { AI_CONFIG } from '../lib/ai-config';

async function main() {
    console.log('Checking AI Config...');
    console.log('Gemini Key present:', !!AI_CONFIG.GEMINI.API_KEY);
    console.log('OpenAI Key present:', !!AI_CONFIG.OPENAI.API_KEY);

    console.log('Initializing RAG Service...');
    try {
        await RAGService.initialize();
        console.log('RAG Service initialized.');

        const query = 'Có loại xi măng nào chống thấm tốt không?';
        console.log(`\nTesting Chatbot with query: "${query}"`);

        const response = await AIService.generateChatbotResponse(query);

        console.log('\n🤖 Chatbot Response:');
        console.log('--------------------------------------------------');
        console.log(response.response);
        console.log('--------------------------------------------------');

        console.log('\nSuggestions:', response.suggestions);

        if (response.productRecommendations && response.productRecommendations.length > 0) {
            console.log('\nProduct Recommendations:', response.productRecommendations);
        }

        console.log(`\nConfidence: ${response.confidence}`);

    } catch (error) {
        console.error('❌ Chatbot Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
