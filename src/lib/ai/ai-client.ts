// Gemini AI client initialization and shared types

import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG } from '../ai-config'

// Initialize Gemini client (if API key is provided)
export const geminiClient = AI_CONFIG.GEMINI.API_KEY
    ? new GoogleGenAI({ 
        apiKey: AI_CONFIG.GEMINI.API_KEY,
        apiVersion: 'v1' // Force stable v1 to avoid 404 on embeddings
    })
    : null

// Function to find a working Gemini model name (cached)
let workingModelName: string | null = null

export const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2-flash',
    'gemini-2-flash-lite',
    'gemini-1.5-flash'
];

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004'
const API_VERSION = 'v1'

export const getWorkingModelConfig = async () => {
    if (!geminiClient) throw new Error('Gemini client not initialized');
    workingModelName = AI_CONFIG.GEMINI.MODEL || 'gemini-2.5-flash';
    return { client: geminiClient, modelName: workingModelName };
};

export async function generateContentWithFallback(requestOptions: any) {
    if (!geminiClient) throw new Error('Gemini client not initialized');
    
    const primaryModel = AI_CONFIG.GEMINI.MODEL || FALLBACK_MODELS[0];
    const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)];

    let lastError: any;
    for (const model of modelsToTry) {
        try {
            const result = await geminiClient.models.generateContent({
                ...requestOptions,
                model
            });
            return result;
        } catch (error: any) {
            lastError = error;
            const errorStr = String(error?.message || error?.error?.status || '');
            
            // For 503 errors, retry the current model once
            if (errorStr.includes('503') || errorStr.includes('UNAVAILABLE') || error?.status === 503) {
                console.warn(`[AIClient] 503 High Demand on ${model}. Retrying once...`);
                await new Promise(res => setTimeout(res, 1500));
                try {
                    const retryResult = await geminiClient.models.generateContent({
                        ...requestOptions,
                        model
                    });
                    return retryResult;
                } catch (retryError) {
                    lastError = retryError;
                }
            }
            
            console.warn(`[AIClient] Model ${model} failed, trying next fallback...`);
            continue;
        }
    }
    
    throw lastError || new Error('All Gemini models failed');
}

/** Generate text embeddings using text-embedding-004 */
export const getEmbedding = async (text: string) => {
    if (!geminiClient) throw new Error('Gemini client not initialized')
    try {
        const result = await geminiClient.models.embedContent({
            model: DEFAULT_EMBEDDING_MODEL,
            contents: [{ parts: [{ text }] }]
        })
        
        if (!result.embeddings || result.embeddings.length === 0) {
            return null
        }
        
        return result.embeddings[0].values as number[]
    } catch (error) {
        console.error('[AIClient] getEmbedding error:', error)
        return null
    }
}

// Shared Gemini types
export interface GeminiPart {
    text: string
}

export interface GeminiContent {
    role: 'user' | 'model' | 'system'
    parts: GeminiPart[]
}

export interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
    text?: string; // Fallback for stability
}

/** Helper to extract text from @google/genai SDK response */
export function extractTextFromSDKResult(result: any): string {
    if (!result) return '';
    try {
        // SDK @google/genai structure
        if (result.candidates?.[0]?.content?.parts) {
            return result.candidates[0].content.parts
                .filter((p: any) => p.text)
                .map((p: any) => p.text)
                .join('') || '';
        }
        // Fallback for legacy SDK @google/generative-ai
        if (typeof result.text === 'function') return result.text();
        return result.text || '';
    } catch (err) {
        console.error('[AIClient] extractTextFromSDKResult error:', err);
        return '';
    }
}

// Shared AI response types
export interface ChatbotResponse {
    response: string
    suggestions: string[]
    productRecommendations?: Record<string, unknown>[]
    confidence: number
}

export interface OCRResponse {
    extractedText: string
    processedData: Record<string, unknown>
    confidence: number
}

export interface AIOrderRequest {
    items: Array<{ productName: string; quantity: number; unit: string }>
    customerName?: string | null
    phone?: string | null
    deliveryAddress?: string | null
    vatInfo?: { companyName: string; taxId: string; companyAddress: string } | null
}

/** Parse a JSON string returned by Gemini, handling markdown code blocks */
export function parseGeminiJSON<T = Record<string, unknown>>(text: string, fallback: T): T {
    try {
        let cleaned = text
        // Handle markdown code blocks explicitly
        if (cleaned.includes('```json')) {
            const match = cleaned.match(/```json\s*([\s\S]*?)\s*```/)
            if (match && match[1]) cleaned = match[1]
        }
        cleaned = cleaned.replace(/```json\s*|\s*```/g, '').trim()
        return JSON.parse(cleaned) as T
    } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
            try { return JSON.parse(match[0]) as T } catch { /* ignore */ }
        }
        return fallback
    }
}
