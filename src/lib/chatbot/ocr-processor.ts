/**
 * OCR Processor - Xử lý nhận diện text từ ảnh hóa đơn
 * Uses Tesseract.js for Vietnamese OCR
 */

import { createWorker } from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  lines: string[]
  words: Array<{
    text: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }>
}

let worker: any = null
let isInitializing = false

/**
 * Initialize Tesseract worker (singleton)
 */
async function getWorker() {
  // If already initialized, return existing worker
  if (worker) {
    return worker
  }
  
  // If currently initializing, wait
  while (isInitializing) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // If initialized while waiting, return it
  if (worker) {
    return worker
  }
  
  try {
    isInitializing = true
    worker = await createWorker('vie+eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
        }
      }
    })
    return worker
  } catch (error) {
    worker = null
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * Process image and extract text using OCR
 */
export async function processImageOCR(base64Image: string): Promise<OCRResult> {
  try {
    const workerInstance = await getWorker()
    
    // Remove data URL prefix if exists
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '')
    
    // Perform OCR
    const { data } = await workerInstance.recognize(imageData)
    
    // Extract lines
    const lines = data.lines.map((line: any) => line.text.trim()).filter((text: string) => text.length > 0)
    
    // Extract words with bounding boxes
    const words = data.words.map((word: any) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox
    }))
    
    return {
      text: data.text,
      confidence: data.confidence / 100, // Convert to 0-1 range
      lines,
      words
    }
  } catch (error) {
    console.error('OCR processing error:', error)
    throw new Error('Failed to process image with OCR')
  }
}

/**
 * Terminate worker (call on app shutdown)
 */
export async function terminateOCR() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

/**
 * Preprocess image for better OCR results
 * (This would be enhanced with actual image processing libraries)
 */
export function preprocessImage(base64Image: string): string {
  // TODO: Add image preprocessing
  // - Grayscale conversion
  // - Contrast enhancement
  // - Noise reduction
  // - Deskewing
  
  // For now, return as-is
  return base64Image
}

/**
 * Validate if image is suitable for invoice OCR
 */
export function validateInvoiceImage(base64Image: string): { valid: boolean; reason?: string } {
  // Check if it's a valid base64 image
  if (!base64Image || typeof base64Image !== 'string') {
    return { valid: false, reason: 'Invalid image data' }
  }
  
  // Check size (rough estimate from base64 length)
  const sizeInBytes = Math.ceil((base64Image.length * 3) / 4)
  const sizeInMB = sizeInBytes / (1024 * 1024)
  
  if (sizeInMB > 10) {
    return { valid: false, reason: 'Image too large (max 10MB)' }
  }
  
  if (sizeInMB < 0.01) {
    return { valid: false, reason: 'Image too small (min 10KB)' }
  }
  
  // Check if it's an image
  if (!base64Image.match(/^data:image\/(jpeg|jpg|png|gif|webp|bmp)/i)) {
    return { valid: false, reason: 'Invalid image format' }
  }
  
  return { valid: true }
}

/**
 * Extract structured data from OCR text
 * (Basic version - will be enhanced in invoice-parser.ts)
 */
export function extractInvoiceData(ocrResult: OCRResult): any {
  const { text, lines } = ocrResult
  
  const data: any = {
    rawText: text,
    extractedFields: {}
  }
  
  // Extract date patterns (DD/MM/YYYY, DD-MM-YYYY, etc.)
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i)
  if (dateMatch) {
    data.extractedFields.date = dateMatch[0]
  }
  
  // Extract invoice/receipt number
  const invoiceMatch = text.match(/(?:hóa đơn|hoá đơn|invoice|receipt|phiếu|bill)\s*[:#]?\s*([A-Z0-9\-\/]+)/i)
  if (invoiceMatch) {
    data.extractedFields.invoiceNumber = invoiceMatch[1]
  }
  
  // Extract amounts (numbers followed by đ, VND, etc.)
  const amounts: number[] = []
  const amountMatches = text.matchAll(/(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:đ|vnd|đồng)?/gi)
  for (const match of amountMatches) {
    const amount = parseFloat(match[1].replace(/[.,]/g, ''))
    if (amount > 1000) { // Filter out small numbers
      amounts.push(amount)
    }
  }
  
  if (amounts.length > 0) {
    data.extractedFields.amounts = amounts
    data.extractedFields.totalAmount = Math.max(...amounts) // Assume largest is total
  }
  
  // Extract company/supplier name (lines near top)
  if (lines.length > 0) {
    // Look for company names in first 5 lines
    const topLines = lines.slice(0, 5)
    for (const line of topLines) {
      if (line.match(/công ty|cty|c\.ty|dntn|tnhh|company|corp/i)) {
        data.extractedFields.supplierName = line
        break
      }
    }
  }
  
  return data
}
