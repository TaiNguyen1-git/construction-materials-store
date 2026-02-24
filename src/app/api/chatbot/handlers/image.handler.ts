/**
 * Image Handler - OCR invoice scanning + Customer material image recognition
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { AIService } from '@/lib/ai-service'
import { aiRecognition } from '@/lib/ai-material-recognition'
import { type ConversationState } from '@/lib/chatbot/conversation-state'
import { startOCRInvoiceFlow, clearConversationState } from '@/lib/chatbot/conversation-state'
import { enqueueOCRJob, saveOCRResult } from '@/lib/ocr-queue'
import { isRedisConfigured } from '@/lib/redis'

// ─── OCR Invoice (Admin + Image) ──────────────────────────────────────────────

export async function handleOCRInvoiceFlow(
    sessionId: string,
    image: string,
    message?: string
) {
    // ── Async path: enqueue to Redis, respond instantly ────────────────────────
    if (isRedisConfigured()) {
        const jobId = await enqueueOCRJob(sessionId, image, message)
        if (jobId) {
            // Kick off background processing (fire-and-forget)
            processOCRInBackground(jobId, sessionId, image, message)
            return NextResponse.json(createSuccessResponse({
                message: '⏳ **Đang xử lý hóa đơn...**\n\nHệ thống đang quét và nhận diện hóa đơn bằng AI.\nThông thường mất khoảng 5-15 giây.\n\n💡 Kết quả sẽ xuất hiện ngay khi xong!',
                suggestions: ['Chờ kết quả', 'Hủy'],
                confidence: 1.0,
                sessionId,
                timestamp: new Date().toISOString(),
                asyncJob: { jobId, pollUrl: `/api/chatbot/ocr-result?jobId=${jobId}` }
            }))
        }
    }

    // ── Sync path: original synchronous OCR (fallback when Redis unavailable) ──
    return await processOCRSync(sessionId, image, message)
}

/**
 * Background OCR processing — runs after the API has already responded.
 * Saves the result to Redis so the client can poll for it.
 */
async function processOCRInBackground(
    jobId: string,
    sessionId: string,
    image: string,
    message?: string
): Promise<void> {
    try {
        const response = await processOCRSync(sessionId, image, message)
        const body = await response.json()
        await saveOCRResult({
            jobId, sessionId, status: 'done',
            response: body.data,
            completedAt: Date.now()
        })
    } catch (err) {
        console.error(`[OCRQueue] Background job ${jobId} failed:`, err)
        await saveOCRResult({
            jobId, sessionId, status: 'failed',
            error: String(err), completedAt: Date.now()
        })
    }
}

/**
 * Core synchronous OCR logic (unchanged from original).
 * Used directly when Redis is unavailable, or called by processOCRInBackground.
 */
async function processOCRSync(
    sessionId: string,
    image: string,
    message?: string
) {
    try {
        const parsedInvoice = await AIService.extractInvoiceData(image)

        if (!parsedInvoice) {
            return NextResponse.json(createSuccessResponse({
                message: `❌ Không thể đọc dữ liệu từ hình ảnh này. Vui lòng chụp rõ hơn hoặc thử lại.`,
                suggestions: ['Thử lại', 'Trợ giúp'], confidence: 0, sessionId, timestamp: new Date().toISOString()
            }))
        }

        if (!parsedInvoice.items || parsedInvoice.items.length === 0 || !parsedInvoice.totalAmount) {
            if (!parsedInvoice.rawText) {
                return NextResponse.json(createSuccessResponse({
                    message: `❌ Không thể nhận diện hóa đơn. Vui lòng thử lại với ảnh rõ nét hơn.`,
                    suggestions: ['Thử lại', 'Trợ giúp'], confidence: 0.1, sessionId, timestamp: new Date().toISOString()
                }))
            }
        }

        let formattedMsg = '📄 **HÓA ĐƠN NHẬN DIỆN (Gemini AI)**\n\n'
        if (parsedInvoice.invoiceNumber) formattedMsg += `🔢 Số HĐ: **${parsedInvoice.invoiceNumber}**\n`
        if (parsedInvoice.invoiceDate) formattedMsg += `📅 Ngày: ${parsedInvoice.invoiceDate}\n`
        if (parsedInvoice.supplierName) formattedMsg += `🏢 NCC: ${parsedInvoice.supplierName}\n`

        formattedMsg += `\n📦 **Sản phẩm:**\n`
        if (parsedInvoice.items && parsedInvoice.items.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parsedInvoice.items.forEach((item: any, idx: number) => {
                formattedMsg += `${idx + 1}. ${item.name || 'Sản phẩm'}\n`
                if (item.quantity && item.unit) formattedMsg += `   Số lượng: ${item.quantity} ${item.unit}\n`
                if (item.unitPrice) formattedMsg += `   Đơn giá: ${(item.unitPrice as number).toLocaleString('vi-VN')}đ\n`
                if (item.totalPrice) formattedMsg += `   Thành tiền: ${(item.totalPrice as number).toLocaleString('vi-VN')}đ\n`
            })
        } else {
            formattedMsg += `⚠️ Không nhận diện được chi tiết sản phẩm\n`
        }

        formattedMsg += `\n💰 **Tổng cộng:** ${(parsedInvoice.totalAmount || 0).toLocaleString('vi-VN')}đ\n`
        if (parsedInvoice.taxAmount) formattedMsg += `📊 VAT: ${(parsedInvoice.taxAmount || 0).toLocaleString('vi-VN')}đ\n`
        formattedMsg += `\n🎯 Độ tin cậy: ${((parsedInvoice.confidence || 0.9) * 100).toFixed(0)}%`

        await startOCRInvoiceFlow(sessionId, parsedInvoice)

        return NextResponse.json(createSuccessResponse({
            message: formattedMsg + '\n\n✅ Lưu hóa đơn vào hệ thống?',
            suggestions: ['Lưu hóa đơn', 'Chỉnh sửa', 'Hủy'],
            confidence: parsedInvoice.confidence || 0.9,
            sessionId, timestamp: new Date().toISOString(),
            ocrData: parsedInvoice
        }))
    } catch (error: unknown) {
        const err = error as Error
        console.error('OCR error:', err)
        return NextResponse.json(createSuccessResponse({
            message: `❌ Lỗi xử lý ảnh: ${err.message}`,
            suggestions: ['Thử lại', 'Trợ giúp'], confidence: 0.3, sessionId, timestamp: new Date().toISOString()
        }))
    }
}

// ─── Save OCR Invoice ──────────────────────────────────────────────────────────

export async function handleOCRInvoiceSave(sessionId: string, state: ConversationState) {
    try {
        const parsedInvoice = state.data.parsedInvoice

        let supplierId: string | undefined = undefined
        if (parsedInvoice.supplierName) {
            const supplier = await prisma.supplier.findFirst({
                where: { name: { contains: parsedInvoice.supplierName, mode: 'insensitive' } }
            })
            if (supplier) {
                supplierId = supplier.id
            } else {
                const newSupplier = await prisma.supplier.create({
                    data: {
                        name: parsedInvoice.supplierName, contactPerson: '', email: '',
                        phone: parsedInvoice.supplierPhone || '', address: parsedInvoice.supplierAddress || '',
                        taxId: parsedInvoice.supplierTaxId || '', isActive: true
                    }
                })
                supplierId = newSupplier.id
            }
        }

        let invoiceStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'DRAFT'
        if (parsedInvoice.paymentStatus === 'PAID') invoiceStatus = 'PAID'
        else if (parsedInvoice.paymentStatus === 'UNPAID') invoiceStatus = 'SENT'

        const invoice = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    invoiceNumber: parsedInvoice.invoiceNumber || `INV-${Date.now()}`,
                    invoiceType: 'PURCHASE', supplierId,
                    issueDate: parsedInvoice.invoiceDate || new Date(),
                    dueDate: parsedInvoice.dueDate, status: invoiceStatus,
                    subtotal: parsedInvoice.subtotal || 0, taxAmount: parsedInvoice.taxAmount || 0,
                    discountAmount: 0, totalAmount: parsedInvoice.totalAmount || 0,
                    paidAmount: invoiceStatus === 'PAID' ? (parsedInvoice.totalAmount || 0) : 0,
                    balanceAmount: invoiceStatus === 'PAID' ? 0 : (parsedInvoice.totalAmount || 0),
                    paymentTerms: parsedInvoice.paymentMethod,
                    notes: `OCR Imported: ${parsedInvoice.rawText?.substring(0, 500)}`
                }
            })

            let itemsCreated = 0
            let inventorySynced = 0

            if (parsedInvoice.items && parsedInvoice.items.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (const item of parsedInvoice.items as any[]) {
                    if (!item.name) continue
                    const product = await tx.product.findFirst({
                        where: { OR: [{ name: { contains: item.name, mode: 'insensitive' } }, { description: { contains: item.name, mode: 'insensitive' } }], isActive: true }
                    })

                    if (product) {
                        const qty = item.quantity || 1
                        await tx.invoiceItem.create({
                            data: {
                                invoiceId: newInvoice.id, productId: product.id,
                                description: item.name, quantity: qty,
                                unitPrice: item.unitPrice || 0,
                                totalPrice: item.totalPrice || qty * (item.unitPrice || 0),
                                discount: 0, taxRate: parsedInvoice.taxRate || 0, taxAmount: 0
                            }
                        })
                        itemsCreated++

                        const inventoryItem = await tx.inventoryItem.findUnique({ where: { productId: product.id } })
                        if (inventoryItem) {
                            const previousStock = inventoryItem.quantity
                            const newStock = previousStock + qty
                            await tx.inventoryItem.update({
                                where: { productId: product.id },
                                data: { quantity: newStock, availableQuantity: newStock - inventoryItem.reservedQuantity, lastStockDate: new Date() }
                            })
                            await tx.inventoryMovement.create({
                                data: {
                                    productId: product.id, inventoryId: inventoryItem.id, movementType: 'IN',
                                    quantity: qty, previousStock, newStock,
                                    reason: `OCR Invoice Import: ${newInvoice.invoiceNumber}`,
                                    referenceType: 'INVOICE', referenceId: newInvoice.id,
                                    performedBy: 'system-ocr',
                                    notes: `Auto-synced from invoice ${newInvoice.invoiceNumber}`
                                }
                            })
                            inventorySynced++
                        }
                    }
                }
            }

            return { invoice: newInvoice, itemsCreated, inventorySynced }
        })

        clearConversationState(sessionId)

        return NextResponse.json(createSuccessResponse({
            message: `✅ Đã lưu hóa đơn **${invoice.invoice.invoiceNumber}**\n\n` +
                `- Nhà cung cấp: ${parsedInvoice.supplierName || 'N/A'}\n` +
                `- Tổng tiền: ${invoice.invoice.totalAmount.toLocaleString('vi-VN')}đ\n` +
                `- Trạng thái: ${invoice.invoice.status}\n` +
                `- Sản phẩm: ${invoice.itemsCreated}/${parsedInvoice.items?.length || 0} matched\n` +
                `- 📦 Đã nhập kho: ${invoice.inventorySynced} sản phẩm\n\n` +
                (invoice.itemsCreated === 0
                    ? `⚠️ Không match được sản phẩm nào. Vui lòng cập nhật thủ công.`
                    : invoice.inventorySynced > 0
                        ? `✅ Tồn kho đã được cập nhật tự động!`
                        : `💡 Một số sản phẩm chưa có trong kho. Vui lòng kiểm tra.`),
            suggestions: ['Xem tồn kho', 'Tạo hóa đơn khác', 'Cập nhật sản phẩm'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any
        console.error('Save invoice error:', error)
        return NextResponse.json(
            createErrorResponse(`Failed to save invoice: ${err.message}`, 'DATABASE_ERROR'),
            { status: 500 }
        )
    }
}

// ─── Customer Image Recognition ────────────────────────────────────────────────

export async function handleCustomerImageRecognition(
    sessionId: string,
    image: string,
    message: string | undefined,
    customerId: string | undefined
) {
    try {
        const recognitionResult = await aiRecognition.recognizeMaterial(image)

        if (!recognitionResult.isConstructionMaterial) {
            return NextResponse.json(createSuccessResponse({
                message: `📸 Tôi nhận diện được: **${recognitionResult.materialType}**\n\nTuy nhiên, đây có vẻ không phải là vật liệu xây dựng mà tôi hỗ trợ. Bạn vui lòng gửi ảnh về **Xi măng, Gạch, Cát, Đá, Sắt thép...** để tôi giúp bạn tốt nhất nhé!`,
                suggestions: ['Bảng giá VLXD', 'Tư vấn xây dựng', 'Thử ảnh khác'],
                confidence: recognitionResult.confidence, sessionId, timestamp: new Date().toISOString()
            }))
        }

        let responseText = `📸 **Tôi nhận diện được:** ${recognitionResult.materialType}\n\n`
        responseText += `🎯 **Độ tin cậy:** ${(recognitionResult.confidence * 100).toFixed(0)}%\n\n`

        if (recognitionResult.matchedProducts.length > 0) {
            responseText += `✅ **Tìm thấy ${recognitionResult.matchedProducts.length} sản phẩm phù hợp:**`
            return NextResponse.json(createSuccessResponse({
                message: responseText, suggestions: recognitionResult.suggestions,
                productRecommendations: recognitionResult.matchedProducts,
                confidence: recognitionResult.confidence, sessionId, timestamp: new Date().toISOString()
            }))
        }

        return NextResponse.json(createSuccessResponse({
            message: responseText + '❌ Không tìm thấy sản phẩm phù hợp.',
            suggestions: ['Thử chụp lại', 'Tìm kiếm bằng text'],
            confidence: recognitionResult.confidence, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error: unknown) {
        console.error('Image recognition error:', error)
        return NextResponse.json(createSuccessResponse({
            message: '❌ Không thể nhận diện ảnh. Vui lòng thử lại.',
            suggestions: ['Thử lại', 'Tìm kiếm bằng text'], confidence: 0.3, sessionId, timestamp: new Date().toISOString()
        }))
    }
}
