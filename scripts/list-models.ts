
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '../src/lib/ai-config';

async function listModels() {
    console.log('🔑 Using API Key:', AI_CONFIG.GEMINI.API_KEY ? 'Present' : 'Missing');

    if (!AI_CONFIG.GEMINI.API_KEY) {
        console.error('❌ API Key is missing');
        return;
    }

    const client = new GoogleGenAI({ apiKey: AI_CONFIG.GEMINI.API_KEY });

    try {
        console.log('📡 Fetching available models...');
        // Note: The new SDK might have a different way to list models, 
        // but often it's on the client or a specific manager. 
        // Trying the standard endpoint or looking for a models service.
        // Based on SDK docs (or assumptions about v1beta), often it's client.models.list()

        // Attempting to use the new SDK structure
        // If client.models.list isn't available, we might need a raw fetch
        // But let's try to infer from the error message "Call ListModels"

        // Checking if we can access the 'models' namespace directly
        if (client.models && typeof client.models.list === 'function') {
            const response = await client.models.list();
            console.log('📋 Models found via SDK:');
            // The response structure depends on the SDK version
            // Assuming it returns an object with 'models' array or is explicitly the array
            const models = (response as any).models || response;
            if (Array.isArray(models)) {
                models.forEach((m: any) => console.log(` - ${m.name} (${m.displayName})`));
            } else {
                console.log('Response:', JSON.stringify(response, null, 2));
            }
        } else {
            console.log('⚠️ client.models.list() not found. Trying raw REST call...');
            // Fallback to fetch if SDK method is obscure
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${AI_CONFIG.GEMINI.API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.models) {
                console.log('📋 Models found via REST:');
                data.models.forEach((m: any) => console.log(` - ${m.name}`));
            } else {
                console.log('❌ No models returned via REST:', JSON.stringify(data));
            }
        }

    } catch (error) {
        console.error('❌ Error listing models:', error);
    }
}

listModels();
