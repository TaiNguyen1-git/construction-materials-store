/**
 * AI Training Data Collector
 * Tổng hợp và chuẩn bị data cho training các AI models
 */

import { prisma } from './prisma'

export interface TrainingDataExport {
  ocrTrainingData: OCRTrainingRecord[]
  chatbotTrainingData: ChatbotTrainingRecord[]
  recommendationTrainingData: RecommendationTrainingRecord[]
  inventoryTrainingData: InventoryTrainingRecord[]
}

export interface OCRTrainingRecord {
  id: string
  imageUrl: string
  extractedText: string
  processedData: any
  humanCorrections?: any
  confidence: number
  isApproved: boolean
  createdAt: Date
}

export interface ChatbotTrainingRecord {
  id: string
  userQuery: string
  botResponse: string
  userRating?: number
  wasHelpful: boolean
  followupActions: string[]
  sessionContext: any
  createdAt: Date
}

export interface RecommendationTrainingRecord {
  userId: string
  productId: string
  recommendationType: string
  wasClicked: boolean
  wasPurchased: boolean
  userRating?: number
  contextData: any
  createdAt: Date
}

export interface InventoryTrainingRecord {
  productId: string
  predictionDate: Date
  predictedDemand: number
  actualDemand: number
  confidence: number
  accuracyScore: number
  seasonalFactors: any
  createdAt: Date
}

export class AITrainingCollector {
  
  /**
   * Thu thập OCR training data
   */
  async collectOCRTrainingData(startDate?: Date, endDate?: Date): Promise<OCRTrainingRecord[]> {
    const where: any = {}
    if (startDate) where.createdAt = { gte: startDate }
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate }

    const ocrRecords = await prisma.oCRProcessing.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return ocrRecords.map(record => ({
      id: record.id,
      imageUrl: record.filePath,
      extractedText: record.extractedText || '',
      processedData: record.processedData,
      confidence: record.confidence || 0,
      isApproved: record.status === 'REVIEWED',
      humanCorrections: null, // Sẽ được thêm từ user feedback
      createdAt: record.createdAt
    }))
  }

  /**
   * Thu thập Chatbot training data
   */
  async collectChatbotTrainingData(startDate?: Date, endDate?: Date): Promise<ChatbotTrainingRecord[]> {
    const where: any = {
      interactionType: 'CHATBOT'
    }
    if (startDate) where.createdAt = { gte: startDate }
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate }

    const interactions = await prisma.customerInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return interactions.map(interaction => ({
      id: interaction.id,
      userQuery: interaction.query || '',
      botResponse: interaction.response || '',
      userRating: interaction.rating ?? undefined,
      wasHelpful: (interaction.rating || 0) >= 4,
      followupActions: [], // Extract từ metadata
      sessionContext: interaction.metadata,
      createdAt: interaction.createdAt
    }))
  }

  /**
   * Thu thập Recommendation training data
   */
  async collectRecommendationTrainingData(startDate?: Date, endDate?: Date): Promise<RecommendationTrainingRecord[]> {
    const where: any = {
      interactionType: { in: ['PRODUCT_VIEW', 'ADD_TO_CART', 'PURCHASE'] }
    }
    if (startDate) where.createdAt = { gte: startDate }
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate }

    const interactions = await prisma.customerInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return interactions.map(interaction => ({
      userId: interaction.customerId || 'anonymous',
      productId: interaction.productId || '',
      recommendationType: 'RELATED', // Extract từ metadata
      wasClicked: interaction.interactionType === 'PRODUCT_VIEW',
      wasPurchased: interaction.interactionType === 'PURCHASE',
      userRating: interaction.rating ?? undefined,
      contextData: interaction.metadata,
      createdAt: interaction.createdAt
    }))
  }

  /**
   * Thu thập Inventory prediction training data
   */
  async collectInventoryTrainingData(startDate?: Date, endDate?: Date): Promise<InventoryTrainingRecord[]> {
    const where: any = {}
    if (startDate) where.predictionDate = { gte: startDate }
    if (endDate) where.predictionDate = { ...where.predictionDate, lte: endDate }

    const predictions = await prisma.inventoryPrediction.findMany({
      where,
      orderBy: { predictionDate: 'desc' }
    })

    // Tính actual demand từ order data
    const trainingData: InventoryTrainingRecord[] = []
    
    for (const prediction of predictions) {
      // Get actual sales data cho cùng thời kỳ
      const actualSales = await this.getActualSales(
        prediction.productId, 
        prediction.predictionDate,
        prediction.timeframe
      )
      
      const accuracyScore = this.calculateAccuracy(prediction.predictedDemand, actualSales)
      
      trainingData.push({
        productId: prediction.productId,
        predictionDate: prediction.predictionDate,
        predictedDemand: prediction.predictedDemand,
        actualDemand: actualSales,
        confidence: prediction.confidence,
        accuracyScore,
        seasonalFactors: prediction.factors,
        createdAt: prediction.createdAt
      })
    }

    return trainingData
  }

  /**
   * Export tất cả training data
   */
  async exportAllTrainingData(startDate?: Date, endDate?: Date): Promise<TrainingDataExport> {
    const [ocrData, chatbotData, recommendationData, inventoryData] = await Promise.all([
      this.collectOCRTrainingData(startDate, endDate),
      this.collectChatbotTrainingData(startDate, endDate),
      this.collectRecommendationTrainingData(startDate, endDate),
      this.collectInventoryTrainingData(startDate, endDate)
    ])

    return {
      ocrTrainingData: ocrData,
      chatbotTrainingData: chatbotData,
      recommendationTrainingData: recommendationData,
      inventoryTrainingData: inventoryData
    }
  }

  /**
   * Export training data theo format cụ thể
   */
  async exportFormatted(format: 'JSON' | 'CSV' | 'JSONL' = 'JSON'): Promise<string> {
    const data = await this.exportAllTrainingData()
    
    switch (format) {
      case 'JSON':
        return JSON.stringify(data, null, 2)
      
      case 'CSV':
        return this.convertToCSV(data)
      
      case 'JSONL':
        return this.convertToJSONL(data)
      
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  /**
   * Lưu training data vào file
   */
  async saveTrainingData(filePath: string, format: 'JSON' | 'CSV' | 'JSONL' = 'JSON') {
    const data = await this.exportFormatted(format)
    // Trong production sẽ save vào cloud storage
    return data
  }

  // Helper methods
  private async getActualSales(productId: string, date: Date, timeframe: string): Promise<number> {
    const endDate = new Date(date)
    const startDate = new Date(date)
    
    // Adjust date range based on timeframe
    switch (timeframe) {
      case 'WEEK':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'MONTH':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'QUARTER':
        startDate.setMonth(endDate.getMonth() - 3)
        break
    }
    
    const orders = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' }
        }
      }
    })
    
    return orders.reduce((sum, item) => sum + item.quantity, 0)
  }

  private calculateAccuracy(predicted: number, actual: number): number {
    if (actual === 0) return predicted === 0 ? 1 : 0
    return Math.max(0, 1 - Math.abs(predicted - actual) / actual)
  }

  private convertToCSV(data: TrainingDataExport): string {
    // Convert to CSV format - implementation depends on specific needs
    return 'CSV format implementation needed'
  }

  private convertToJSONL(data: TrainingDataExport): string {
    // Convert to JSONL format - one JSON object per line
    return 'JSONL format implementation needed'
  }
}

// Singleton instance
export const aiTrainingCollector = new AITrainingCollector()
