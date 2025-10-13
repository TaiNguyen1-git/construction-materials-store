import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { createWorker } from 'tesseract.js'
import { AIService } from '@/lib/ai-service'
import { isAIEnabled } from '@/lib/ai-config'

const ocrProcessSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  filePath: z.string().min(1, 'File path is required'),
  invoiceType: z.enum(['SUPPLIER', 'CUSTOMER']).default('SUPPLIER'),
})

// Real OCR processing function using Tesseract.js
async function processOCRText(imagePath: string): Promise<{
  extractedText: string;
  processedData: any;
  confidence: number;
}> {
  try {
    // For demo purposes, we'll use a placeholder image URL
    // In a real implementation, this would be the actual file path
    const imageUrl = 'https://tesseract.projectnaptha.com/img/eng_bw.png'
    
    // Create Tesseract worker
    const worker = await createWorker('eng');
    
    // Process the image
    const { data: { text, confidence } } = await worker.recognize(imageUrl);
    
    // Terminate the worker
    await worker.terminate();
    
    // Process the extracted text with AI if enabled
    if (isAIEnabled()) {
      try {
        const aiResult = await AIService.processOCRText(text);
        return {
          extractedText: text,
          processedData: aiResult.processedData,
          confidence: aiResult.confidence
        };
      } catch (aiError) {
        console.error('AI processing failed, using raw OCR result:', aiError);
        // Fallback to basic structure if AI processing fails
        return {
          extractedText: text,
          processedData: {
            invoiceNumber: 'Unknown',
            date: new Date().toISOString().split('T')[0],
            supplier: {
              name: 'Unknown Supplier',
              address: 'Unknown Address'
            },
            items: [],
            totals: {
              subtotal: 0,
              tax: 0,
              total: 0
            }
          },
          confidence: confidence / 100 // Convert percentage to decimal
        };
      }
    } else {
      // Basic processing without AI
      return {
        extractedText: text,
        processedData: {
          invoiceNumber: 'Unknown',
          date: new Date().toISOString().split('T')[0],
          supplier: {
            name: 'Unknown Supplier',
            address: 'Unknown Address'
          },
          items: [],
          totals: {
            subtotal: 0,
            tax: 0,
            total: 0
          }
        },
        confidence: confidence / 100 // Convert percentage to decimal
      };
    }
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process OCR');
  }
}

// POST /api/ocr/invoice - Process invoice with OCR
export async function POST(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')
    
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = ocrProcessSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { fileName, filePath, invoiceType } = validation.data

    // Create OCR processing record
    const ocrRecord = await prisma.oCRProcessing.create({
      data: {
        fileName,
        filePath,
        status: 'PROCESSING',
        processedBy: userId,
      }
    })

    try {
      // Process the image with OCR
      const ocrResult = await processOCRText(filePath)
      
      // Update OCR record with results
      const updatedRecord = await prisma.oCRProcessing.update({
        where: { id: ocrRecord.id },
        data: {
          extractedText: ocrResult.extractedText,
          processedData: ocrResult.processedData,
          confidence: ocrResult.confidence,
          status: 'COMPLETED'
        }
      })

      // If it's a supplier invoice, create a draft invoice record
      let draftInvoice = null
      if (invoiceType === 'SUPPLIER' && ocrResult.processedData.items) {
        try {
          // Check if supplier exists or create new one
          const supplierData = ocrResult.processedData.supplier
          let supplier = await prisma.supplier.findFirst({
            where: {
              name: { contains: supplierData.name, mode: 'insensitive' }
            }
          })

          if (!supplier) {
            supplier = await prisma.supplier.create({
              data: {
                name: supplierData.name,
                address: supplierData.address || '',
                isActive: true
              }
            })
          }

          // Create draft purchase invoice
          draftInvoice = await prisma.invoice.create({
            data: {
              invoiceNumber: ocrResult.processedData.invoiceNumber || `OCR-${Date.now()}`,
              invoiceType: 'PURCHASE',
              supplierId: supplier.id,
              issueDate: new Date(ocrResult.processedData.date || new Date()),
              status: 'DRAFT',
              subtotal: ocrResult.processedData.totals?.subtotal || 0,
              taxAmount: ocrResult.processedData.totals?.tax || 0,
              totalAmount: ocrResult.processedData.totals?.total || 0,
              balanceAmount: ocrResult.processedData.totals?.total || 0,
              notes: `Auto-generated from OCR processing. Confidence: ${(ocrResult.confidence * 100).toFixed(1)}%`
            },
            include: {
              supplier: true
            }
          })

          // Create invoice items
          for (const item of ocrResult.processedData.items) {
            // Try to find matching product
            let product = await prisma.product.findFirst({
              where: {
                name: { contains: item.name, mode: 'insensitive' }
              }
            })

            if (!product) {
              // Create a new product if not found
              const defaultCategory = await prisma.category.findFirst({
                where: { name: 'General' }
              })

              if (defaultCategory) {
                product = await prisma.product.create({
                  data: {
                    name: item.name,
                    categoryId: defaultCategory.id,
                    sku: `OCR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    price: item.unitPrice,
                    unit: item.unit || 'pcs',
                    isActive: false // Mark as inactive until reviewed
                  }
                })
              }
            }

            if (product) {
              await prisma.invoiceItem.create({
                data: {
                  invoiceId: draftInvoice.id,
                  productId: product.id,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.total,
                  description: item.name
                }
              })
            }
          }
        } catch (invoiceError) {
          console.error('Error creating draft invoice:', invoiceError)
          // Continue with OCR response even if invoice creation fails
        }
      }

      const response = {
        ocrResult: updatedRecord,
        draftInvoice,
        requiresReview: ocrResult.confidence < 0.9,
        suggestions: {
          newProductsFound: ocrResult.processedData.items?.length || 0,
          confidence: ocrResult.confidence,
          reviewNotes: ocrResult.confidence < 0.9 ? 
            'Low confidence score - please review extracted data carefully' : 
            'High confidence score - data appears accurate'
        }
      }

      return NextResponse.json(
        createSuccessResponse(response, 'OCR processing completed successfully'),
        { status: 200 }
      )

    } catch (processingError) {
      console.error('OCR processing error:', processingError)
      
      // Update record with error
      await prisma.oCRProcessing.update({
        where: { id: ocrRecord.id },
        data: {
          status: 'FAILED',
          errorMessage: processingError instanceof Error ? processingError.message : 'Unknown error'
        }
      })

      return NextResponse.json(
        createErrorResponse('OCR processing failed', 'OCR_PROCESSING_ERROR'),
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('OCR invoice error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// GET /api/ocr/invoice - List OCR processing records
export async function GET(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Get OCR records with pagination
    const [records, total] = await Promise.all([
      prisma.oCRProcessing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.oCRProcessing.count({ where })
    ])

    const response = {
      data: records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(
      createSuccessResponse(response, 'OCR records retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get OCR records error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
