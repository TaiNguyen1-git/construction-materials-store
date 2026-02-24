// Backward-compatible shim for ai-service.ts
// All existing imports from '@/lib/ai-service' remain working.
// New code should import directly from '@/lib/ai/*' services.

export { getWorkingModelConfig } from './ai/ai-client'
export type { ChatbotResponse, OCRResponse, AIOrderRequest } from './ai/ai-client'

import { getQuickResponse, generateChatbotResponse, extractChatbotStructure } from './ai/ai-chatbot.service'
import { processOCRText, analyzeImage, extractInvoiceData } from './ai/ai-ocr.service'
import { analyzeSentiment, forecastDemand, analyzeCreditRisk, getProductRecommendations } from './ai/ai-analytics.service'
import { parseOrderRequest, extractMaterialCalculationParams, optimizeLogistics } from './ai/ai-order.service'

/**
 * AIService — facade that re-exports all domain-specific AI methods
 * to maintain backward compatibility with existing code.
 */
export class AIService {
  // ─── Chatbot ───────────────────────────────────────────────
  static getQuickResponse = getQuickResponse
  static generateChatbotResponse = generateChatbotResponse
  static extractChatbotStructure = extractChatbotStructure

  // ─── OCR / Vision ──────────────────────────────────────────
  static processOCRText = processOCRText
  static analyzeImage = analyzeImage
  static extractInvoiceData = extractInvoiceData

  // ─── Analytics / Recommendations ───────────────────────────
  static analyzeSentiment = analyzeSentiment
  static forecastDemand = forecastDemand
  static analyzeCreditRisk = analyzeCreditRisk
  static getProductRecommendations = getProductRecommendations

  // ─── Orders / Logistics ────────────────────────────────────
  static parseOrderRequest = parseOrderRequest
  static extractMaterialCalculationParams = extractMaterialCalculationParams
  static optimizeLogistics = optimizeLogistics
}

export default AIService