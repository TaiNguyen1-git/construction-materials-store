
import { getWorkingModelConfig } from '../src/lib/ai-service';

async function verifyAI() {
    console.log('🔍 Verifying Gemini Model Configuration...');
    try {
        const { modelName } = await getWorkingModelConfig();
        console.log(`✅ SUCCESS: Found working model: "${modelName}"`);
    } catch (error) {
        console.error('❌ FAILURE: Could not find any working Gemini model.');
        console.error(error);
    }
}

verifyAI();
