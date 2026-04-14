// AI OCR Service — handles invoice extraction and image analysis

import { getWorkingModelConfig, GeminiResponse, OCRResponse, parseGeminiJSON, extractTextFromSDKResult } from './ai-client'
import { OCR_SYSTEM_PROMPT } from '../ai-config'
import { InvoiceData, InvoiceDataSchema } from '../validation'

/** Process raw OCR text with Gemini to extract structured invoice data */
export async function processOCRText(extractedText: string): Promise<OCRResponse> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const prompt = `
    ${OCR_SYSTEM_PROMPT}
    
    Please extract structured data from this invoice text:
    
    ${extractedText}
    
    Return only the JSON object, nothing else.
    `

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const processedText = extractTextFromSDKResult(result) || '{}'
        const processedData = parseGeminiJSON<Record<string, unknown>>(processedText, {})

        return { extractedText, processedData, confidence: 0.95 }
    } catch (error) {
        console.error('[OCRService] processOCRText error:', error)
        throw new Error('Failed to process OCR text with Gemini')
    }
}

/** Analyze any image using Gemini Vision with a custom prompt */
export async function analyzeImage(imageData: string, promptText: string): Promise<string> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const match = imageData.match(/^data:([^;]+);base64,(.+)$/)
        const mimeType = match ? match[1] : 'image/jpeg'
        const data = match ? match[2] : imageData

        const imagePart = { inlineData: { data, mimeType } }

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: promptText }, imagePart] }]
        })

        const text = extractTextFromSDKResult(result)
        if (!text) {
            console.warn('⚠️ Gemini Vision returned empty text. Result:', JSON.stringify(result))
        }
        return text
    } catch (error) {
        console.error('[OCRService] analyzeImage error:', error)
        throw error
    }
}

/** Extract structured invoice data directly from an image using Gemini Vision */
export async function extractInvoiceData(imageData: string): Promise<InvoiceData | null> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const match = imageData.match(/^data:([^;]+);base64,(.+)$/)
        const mimeType = match ? match[1] : 'image/jpeg'
        const data = match ? match[2] : imageData

        const prompt = `
    Analyze this image and extract invoice data.
    Return a JSON object with the following structure:
    {
      "invoiceNumber": "string",
      "invoiceDate": "ISO date string or null",
      "dueDate": "ISO date string or null",
      "supplierName": "string",
      "supplierAddress": "string",
      "supplierPhone": "string",
      "supplierTaxId": "string",
      "items": [
        {
          "name": "string (product name)",
          "quantity": number,
          "unit": "string",
          "unitPrice": number,
          "totalPrice": number
        }
      ],
      "subtotal": number,
      "taxAmount": number,
      "taxRate": number,
      "totalAmount": number,
      "paymentMethod": "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "OTHER",
      "paymentStatus": "PAID" | "UNPAID",
      "confidence": number (0-1)
    }

    Rules:
    - If a field is missing, use null or empty string/0 as appropriate.
    - For items, try to be as precise as possible.
    - confidence should reflect how legible the invoice is.
    - Return ONLY valid JSON.
    `

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{
                role: 'user',
                parts: [{ text: prompt }, { inlineData: { data, mimeType } }]
            }]
        })

        const text = extractTextFromSDKResult(result) || '{}'
        const invoiceData = parseGeminiJSON<Record<string, unknown>>(text, {})

        const validated = InvoiceDataSchema.safeParse({ ...invoiceData, rawText: text })
        if (validated.success) return validated.data

        // Fallback if validation fails but we have some data
        return {
            invoiceNumber: (invoiceData.invoiceNumber as string) || null,
            invoiceDate: (invoiceData.invoiceDate as string) || null,
            supplierName: (invoiceData.supplierName as string) || null,
            items: Array.isArray(invoiceData.items) ? invoiceData.items : [],
            totalAmount: (invoiceData.totalAmount as number) || null,
            taxAmount: (invoiceData.taxAmount as number) || null,
            confidence: (invoiceData.confidence as number) || 0.5,
            rawText: text
        }
    } catch (error) {
        console.error('[OCRService] extractInvoiceData error:', error)
        throw error
    }
}
