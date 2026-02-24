// Gemini AI client initialization and shared types

import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG } from '../ai-config'

// Initialize Gemini client (if API key is provided)
export const geminiClient = AI_CONFIG.GEMINI.API_KEY
    ? new GoogleGenAI({ apiKey: AI_CONFIG.GEMINI.API_KEY })
    : null

// Function to find a working Gemini model name (cached)
let workingModelName: string | null = null

export const getWorkingModelConfig = async () => {
    if (workingModelName) return { client: geminiClient, modelName: workingModelName }

    if (!geminiClient) {
        throw new Error('Gemini client not initialized')
    }

    const modelNames = [
        'gemini-2.5-flash',       // Priority 1
        'gemini-2.5-flash-lite',  // Priority 2
        'gemini-3-flash',         // Priority 3
    ]

    // First try the model specified in the configuration
    if (AI_CONFIG.GEMINI.MODEL) {
        try {
            await geminiClient.models.generateContent({
                model: AI_CONFIG.GEMINI.MODEL,
                contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
                config: {
                    temperature: parseFloat(AI_CONFIG.GEMINI.TEMPERATURE.toString())
                }
            })
            workingModelName = AI_CONFIG.GEMINI.MODEL
            return { client: geminiClient, modelName: workingModelName }
        } catch {
            // If configured model fails, try fallbacks
        }
    }

    // If the configured model fails, try the fallback models
    for (const modelName of modelNames) {
        try {
            await geminiClient.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
                config: {
                    temperature: parseFloat(AI_CONFIG.GEMINI.TEMPERATURE.toString())
                }
            })
            workingModelName = modelName
            return { client: geminiClient, modelName }
        } catch {
            continue
        }
    }

    throw new Error('No working Gemini model found')
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
    text?: string
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
        const cleaned = text.replace(/```json\s*|\s*```/g, '').trim()
        return JSON.parse(cleaned) as T
    } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
            try { return JSON.parse(match[0]) as T } catch { /* ignore */ }
        }
        return fallback
    }
}
