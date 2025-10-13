#!/usr/bin/env tsx
/**
 * Demo script for AI features in the Construction Materials Store
 * This script demonstrates how the AI features would work once properly configured
 */

import { PrismaClient } from '@prisma/client'
import { createWorker } from 'tesseract.js'
import OpenAI from 'openai'

const prisma = new PrismaClient()

// Mock OCR processing function (demonstrates how it would work with real OCR)
async function demoOCRProcessing() {
  console.log('🤖 Demonstrating OCR Processing Feature')
  console.log('=====================================')
  
  // In a real implementation, this would process an actual invoice image
  console.log('Processing sample invoice image...')
  
  // Mock OCR result (what Tesseract.js would extract)
  const mockExtractedText = `
    INVOICE #INV-2023-00123
    DATE: 2023-10-15
    SUPPLIER: ABC Construction Materials Co.
    ADDRESS: 123 Industrial Road, Construction City
    
    ITEMS:
    1. Portland Cement 50kg bags     QTY: 50    UNIT PRICE: $15.00    TOTAL: $750.00
    2. Steel Rebar 12mm 6m length    QTY: 20    UNIT PRICE: $25.00    TOTAL: $500.00
    3. Sand (bulk)                   QTY: 5     UNIT PRICE: $80.00    TOTAL: $400.00
    
    SUBTOTAL: $1,650.00
    TAX (10%): $165.00
    TOTAL: $1,815.00
  `
  
  console.log('Extracted text from invoice:')
  console.log(mockExtractedText)
  
  // Mock AI processing (what OpenAI would do with the extracted text)
  console.log('\n🧠 Processing with AI to extract structured data...')
  
  const mockProcessedData = {
    invoiceNumber: 'INV-2023-00123',
    date: '2023-10-15',
    supplier: {
      name: 'ABC Construction Materials Co.',
      address: '123 Industrial Road, Construction City'
    },
    items: [
      {
        description: 'Portland Cement 50kg bags',
        quantity: 50,
        unitPrice: 15.00,
        total: 750.00
      },
      {
        description: 'Steel Rebar 12mm 6m length',
        quantity: 20,
        unitPrice: 25.00,
        total: 500.00
      },
      {
        description: 'Sand (bulk)',
        quantity: 5,
        unitPrice: 80.00,
        total: 400.00
      }
    ],
    totals: {
      subtotal: 1650.00,
      tax: 165.00,
      total: 1815.00
    }
  }
  
  console.log('Structured data extracted by AI:')
  console.log(JSON.stringify(mockProcessedData, null, 2))
  
  // Create a mock OCR processing record
  const ocrRecord = await prisma.oCRProcessing.create({
    data: {
      fileName: 'sample-invoice.jpg',
      filePath: '/uploads/sample-invoice.jpg',
      extractedText: mockExtractedText,
      processedData: mockProcessedData,
      status: 'COMPLETED',
      confidence: 0.92,
      processedBy: 'demo-script'
    }
  })
  
  console.log(`\n✅ OCR processing record created with ID: ${ocrRecord.id}`)
  
  // Create a draft purchase invoice from the OCR data
  console.log('\n📋 Creating draft purchase invoice from OCR data...')
  
  // Find or create supplier
  let supplier = await prisma.supplier.findFirst({
    where: {
      name: { contains: mockProcessedData.supplier.name, mode: 'insensitive' }
    }
  })
  
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: mockProcessedData.supplier.name,
        address: mockProcessedData.supplier.address,
        isActive: true
      }
    })
    console.log(`Created new supplier: ${supplier.name}`)
  } else {
    console.log(`Found existing supplier: ${supplier.name}`)
  }
  
  // Create draft invoice with a unique invoice number
  const uniqueInvoiceNumber = `INV-DEMO-${Date.now()}`
  const draftInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: uniqueInvoiceNumber,
      invoiceType: 'PURCHASE',
      supplierId: supplier.id,
      issueDate: new Date(mockProcessedData.date),
      status: 'DRAFT',
      subtotal: mockProcessedData.totals.subtotal,
      taxAmount: mockProcessedData.totals.tax,
      totalAmount: mockProcessedData.totals.total,
      balanceAmount: mockProcessedData.totals.total,
      notes: 'Auto-generated from OCR processing. Confidence: 92%'
    }
  })
  
  console.log(`✅ Draft invoice created: ${draftInvoice.invoiceNumber}`)
  
  return { ocrRecord, draftInvoice }
}

// Mock inventory prediction function (demonstrates how ML predictions would work)
async function demoInventoryPrediction() {
  console.log('\n📈 Demonstrating Inventory Prediction Feature')
  console.log('==========================================')
  
  // Get some sample products
  const products = await prisma.product.findMany({
    take: 3,
    include: {
      category: true,
      inventoryItem: true
    }
  })
  
  console.log(`Analyzing ${products.length} sample products for inventory predictions...`)
  
  // Mock predictions for each product
  const predictions = []
  
  for (const product of products) {
    console.log(`\nAnalyzing: ${product.name}`)
    
    // Mock prediction data (what ML model would generate)
    const mockPrediction = {
      productId: product.id,
      productName: product.name,
      category: product.category.name,
      currentStock: product.inventoryItem?.availableQuantity || 0,
      minStockLevel: product.inventoryItem?.minStockLevel || 20,
      predictedDemand: Math.floor(Math.random() * 100) + 50, // Random 50-150
      confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)), // Random 0.7-1.0
      factors: {
        historicalAverage: Math.floor(Math.random() * 50) + 30,
        trend: parseFloat((Math.random() * 20 - 10).toFixed(1)), // -10 to +10
        seasonalMultiplier: parseFloat((Math.random() * 0.4 + 0.8).toFixed(2)), // 0.8-1.2
        dataPoints: Math.floor(Math.random() * 50) + 20
      },
      recommendedOrder: Math.floor(Math.random() * 80) + 20 // Random 20-100
    }
    
    predictions.push(mockPrediction)
    
    // Store prediction in database
    await prisma.inventoryPrediction.create({
      data: {
        productId: product.id,
        predictionDate: new Date(),
        predictedDemand: mockPrediction.predictedDemand,
        confidence: mockPrediction.confidence,
        timeframe: 'MONTH',
        factors: mockPrediction.factors,
        recommendedOrder: mockPrediction.recommendedOrder
      }
    })
    
    console.log(`  Predicted demand: ${mockPrediction.predictedDemand} units`)
    console.log(`  Confidence: ${(mockPrediction.confidence * 100).toFixed(1)}%`)
    console.log(`  Recommended order: ${mockPrediction.recommendedOrder} units`)
  }
  
  // Summary
  const totalRecommendedOrders = predictions.reduce((sum, p) => sum + p.recommendedOrder, 0)
  const highConfidence = predictions.filter(p => p.confidence >= 0.85).length
  
  console.log(`\n📊 Summary:`)
  console.log(`  Total products analyzed: ${predictions.length}`)
  console.log(`  High confidence predictions: ${highConfidence}`)
  console.log(`  Total recommended orders: ${totalRecommendedOrders} units`)
  
  return predictions
}

// Mock chatbot function (demonstrates how AI chatbot would work)
async function demoChatbot() {
  console.log('\n💬 Demonstrating Chatbot Feature')
  console.log('===============================')
  
  // Sample customer queries and mock AI responses
  const sampleConversations = [
    {
      query: "What's the price of cement?",
      response: "Our Portland cement (50kg bags) is priced at $15 per bag. For bulk orders over 100 bags, we offer a 10% discount. Would you like me to help you with a specific quantity quote?",
      suggestions: ["Get bulk pricing", "View cement types", "Calculate total cost"]
    },
    {
      query: "Do you have steel rebar in stock?",
      response: "Yes, we currently have steel rebar in stock in various diameters (10mm, 12mm, 16mm, 20mm). Our 12mm rebar is priced at $8.50 per piece. Would you like to check availability for a specific diameter or quantity?",
      suggestions: ["Check specific diameter", "Get bulk pricing", "View all steel products"]
    },
    {
      query: "What are your store hours?",
      response: "Our store hours are Monday-Friday: 7:00 AM - 6:00 PM, Saturday: 8:00 AM - 4:00 PM, Sunday: Closed. We also offer 24/7 online ordering with next-day pickup available.",
      suggestions: ["Place online order", "Schedule pickup", "Contact us"]
    }
  ]
  
  console.log('Sample chatbot conversations:')
  
  for (const [index, conv] of sampleConversations.entries()) {
    console.log(`\nCustomer: ${conv.query}`)
    console.log(`Chatbot: ${conv.response}`)
    console.log(`Suggestions: ${conv.suggestions.join(', ')}`)
    
    // Log interaction in database
    await prisma.customerInteraction.create({
      data: {
        sessionId: `demo-session-${index + 1}`,
        interactionType: 'CHATBOT',
        query: conv.query,
        response: conv.response,
        metadata: {
          suggestions: conv.suggestions
        }
      }
    })
  }
  
  console.log(`\n✅ ${sampleConversations.length} sample conversations logged`)
}

// Mock purchase recommendation function
async function demoPurchaseRecommendations() {
  console.log('\n🛒 Demonstrating Purchase Recommendation Feature')
  console.log('==============================================')
  
  // Get some sample inventory predictions (fix the include statement)
  const recentPredictions = await prisma.inventoryPrediction.findMany({
    take: 3,
    orderBy: { confidence: 'desc' }
    // Remove the incorrect include statement
  })
  
  console.log(`Generating purchase recommendations based on ${recentPredictions.length} predictions...`)
  
  const recommendations = []
  
  for (const prediction of recentPredictions) {
    // Get the product separately
    const product = await prisma.product.findUnique({
      where: { id: prediction.productId },
      include: {
        category: true,
        inventoryItem: true
      }
    })
    
    if (!product) continue
    
    const currentStock = product.inventoryItem?.availableQuantity || 0
    const minStock = product.inventoryItem?.minStockLevel || 20
    
    // Calculate urgency
    let priority = 'NORMAL'
    const reasons = []
    
    if (currentStock <= 0) {
      priority = 'URGENT'
      reasons.push('Out of stock')
    } else if (currentStock <= minStock) {
      priority = 'HIGH'
      reasons.push('Below minimum stock level')
    }
    
    // Mock supplier info
    const supplier = await prisma.supplier.findFirst({
      where: { isActive: true }
    })
    
    const recommendedQuantity = prediction.recommendedOrder || 0;
    const recommendation = {
      productId: product.id,
      productName: product.name,
      category: product.category.name,
      currentStock,
      minStockLevel: minStock,
      predictedDemand: prediction.predictedDemand,
      recommendedQuantity,
      priority,
      reasons,
      estimatedCost: recommendedQuantity * (product.costPrice || product.price * 0.7 || 10),
      supplier: supplier ? {
        id: supplier.id,
        name: supplier.name
      } : null
    }
    
    recommendations.push(recommendation)
    
    console.log(`\nProduct: ${product.name}`)
    console.log(`  Current stock: ${currentStock}`)
    console.log(`  Predicted demand: ${prediction.predictedDemand}`)
    console.log(`  Recommended order: ${recommendedQuantity}`)
    console.log(`  Priority: ${priority}`)
    if (reasons.length > 0) {
      console.log(`  Reasons: ${reasons.join(', ')}`)
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`  Total recommendations: ${recommendations.length}`)
  console.log(`  Urgent items: ${recommendations.filter(r => r.priority === 'URGENT').length}`)
  console.log(`  High priority items: ${recommendations.filter(r => r.priority === 'HIGH').length}`)
  
  return recommendations
}

// Main demo function
async function runDemo() {
  console.log('🏗️ Construction Materials Store - AI Features Demo')
  console.log('==================================================\n')
  
  try {
    // Run all demo functions
    await demoOCRProcessing()
    await demoInventoryPrediction()
    await demoChatbot()
    await demoPurchaseRecommendations()
    
    console.log('\n🎉 All AI feature demos completed successfully!')
    console.log('\nTo use these features in production:')
    console.log('1. Set up OpenAI API key in your .env file')
    console.log('2. Configure Tesseract.js for OCR processing')
    console.log('3. Ensure your database is properly populated with products')
    console.log('4. Train your ML models for inventory predictions')
    
  } catch (error) {
    console.error('❌ Demo error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo()
}

export {
  demoOCRProcessing,
  demoInventoryPrediction,
  demoChatbot,
  demoPurchaseRecommendations
}