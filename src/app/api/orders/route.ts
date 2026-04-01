import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, OrderStatus, OrderCustomerType } from '@prisma/client'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { LoyaltyService } from '@/lib/loyalty-service'
import { logger, logAPI } from '@/lib/logger'
import { EmailService } from '@/lib/email/email-service'

const createOrderSchema = z.object({
  customerType: z.enum(['REGISTERED', 'GUEST']).default('GUEST'),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    totalPrice: z.number(),
    selectedUnit: z.string().optional().nullable(),
    conversionFactor: z.number().optional().nullable()
  })),
  shippingAddress: z.object({
    address: z.string(),
    ward: z.string().optional(),
    district: z.string().optional(),
    city: z.string()
  }),
  notes: z.string().optional(),
  paymentMethod: z.string(),
  paymentType: z.enum(['FULL', 'DEPOSIT']).default('FULL'),
  depositPercentage: z.number().min(30).max(50).optional().nullable(),
  depositAmount: z.number().optional().nullable(),
  remainingAmount: z.number().optional().nullable(),
  totalAmount: z.number(),
  shippingAmount: z.number(),
  netAmount: z.number(),
  selectedContractorId: z.string().optional().nullable()
})

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 🛡️ SECURITY FIX: Verify JWT token instead of trusting headers (prevents header spoofing)
    const tokenPayload = verifyTokenFromRequest(request)
    const userId = tokenPayload?.userId || null
    const userRole = tokenPayload?.role || null

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const customerType = searchParams.get('customerType')
    const customerId = searchParams.get('customerId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.OrderWhereInput = {}

    // Regular customers can only see their own orders
    if (userRole === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId: userId || undefined }
      })

      if (customer) {
        where.customerId = customer.id
      } else {
        // No customer record found
        return NextResponse.json(
          createSuccessResponse({ orders: [], pagination: { total: 0, page, limit, pages: 0 } }),
          { status: 200 }
        )
      }
    }

    // Filter by status
    if (status) {
      where.status = status as OrderStatus
    }

    // Filter by customer type (REGISTERED or GUEST)
    if (customerType) {
      where.customerType = customerType as OrderCustomerType
    }

    // Filter by specific registered customer
    if (customerId) {
      where.customerId = customerId
    }

    // Search by order number, phone, name (both guest and registered)
    if (search) {
      const searchLower = search.toLowerCase()
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        // Search in registered customer name
        {
          customer: {
            user: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        },
        // Search in registered customer email  
        {
          customer: {
            user: {
              email: { contains: search, mode: 'insensitive' }
            }
          }
        },
        // Search in registered customer phone
        {
          customer: {
            user: {
              phone: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ]
    }

    // Optimize query by using select instead of include where possible
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          netAmount: true,
          shippingAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          customerType: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          // Add missing fields for order details modal
          shippingAddress: true,
          notes: true,
          paymentType: true,
          depositPercentage: true,
          depositAmount: true,
          remainingAmount: true,
          depositPaidAt: true,
          confirmedBy: true,
          confirmedAt: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              user: {
                select: { name: true, email: true }
              }
            }
          },
          orderItems: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  images: true,
                  unit: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    const response = {
      orders: orders.map((order) => ({
        ...order,
        customerName: order.customer?.user?.name || order.guestName || 'Guest',
        customerEmail: order.customer?.user?.email || order.guestEmail || 'N/A'
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }

    const duration = Date.now() - startTime
    logAPI.response('GET', '/api/orders', 200, duration, { total, page, userId })

    return NextResponse.json(
      createSuccessResponse(response, 'Orders retrieved successfully'),
      { status: 200 }
    )

  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const err = error as Error
    logAPI.error('GET', '/api/orders', err, { duration, userId: request.headers.get('x-user-id') })
    logger.error('Get orders error', { error: err.message, stack: err.stack })

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/orders - Create order (supports both authenticated and guest checkout)
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Optional authentication - supports guest checkout
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    const body = await request.json()

    // Validate input
    const validation = createOrderSchema.safeParse(body)
    if (!validation.success) {
      logAPI.error('POST', '/api/orders', new Error('Validation failed'), { errors: validation.error.issues })
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const data = validation.data

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`

    // Determine customer ID for registered users
    let customerId: string | null = null
    // B2B Logic variables
    let organizationId: string | null = null
    let b2bApprovalStatus: 'NOT_REQUIRED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' = 'NOT_REQUIRED'
    let orderStatus: OrderStatus = 'PENDING'

    if (userId && userRole === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId }
      })
      if (customer) {
        customerId = customer.id

        // --- B2B LOGIC START ---
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId },
          include: { organization: true }
        })

        if (orgMember && orgMember.organization.isActive) {
          organizationId = orgMember.organizationId
          if (orgMember.role === 'BUYER') {
            b2bApprovalStatus = 'PENDING_APPROVAL'
            orderStatus = 'PENDING_CONFIRMATION'
          } else {
            b2bApprovalStatus = 'NOT_REQUIRED'
          }
        }
        // --- B2B LOGIC END ---

        // --- DEBT MANAGEMENT CHECK ---
        const { creditCheckService } = await import('@/lib/credit-check-service')
        const creditResult = await creditCheckService.checkCreditEligibility(customerId, data.totalAmount)

        if (!creditResult.eligible) {
          logger.warn('Order blocked due to credit check', {
            customerId,
            reason: creditResult.reason,
            currentDebt: creditResult.currentDebt,
            amount: data.totalAmount
          })

          return NextResponse.json(
            createErrorResponse(
              creditResult.reason || 'Đơn hàng bị chặn do vấn đề công nợ/tín dụng',
              'CREDIT_CHECK_FAILED',
              {
                currentDebt: creditResult.currentDebt,
                creditLimit: creditResult.creditLimit,
                overdueAmount: creditResult.overdueAmount
              }
            ),
            { status: 400 }
          )
        }
        // --- END DEBT CHECK ---
      }
    }

    // Create order with transaction — stock check is INSIDE to prevent race conditions
    const order = await prisma.$transaction(async (tx) => {
      let calculatedTotalAmount = 0
      
      // ── Step 1: Validate stock INSIDE transaction (atomic check) ──
      for (const item of data.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { productId: item.productId },
          include: { product: true }
        })

        if (!inventoryItem) {
          throw new Error(`STOCK_ERROR:Sản phẩm không tồn tại trong kho`)
        }

        if (inventoryItem.availableQuantity < item.quantity) {
          throw new Error(
            `STOCK_ERROR:${inventoryItem.product.name} chỉ còn ${inventoryItem.availableQuantity} (yêu cầu ${item.quantity})`
          )
        }

        // --- SECURITY 2026: PRICE RE-CALCULATION ---
        // Không bao giờ tin tưởng giá từ Frontend gửi lên, phải lấy từ CSDL
        const p = inventoryItem.product
        const isWholesale = p.wholesalePrice && item.quantity >= p.minWholesaleQty
        const actualUnitPrice = isWholesale ? p.wholesalePrice! : p.price
        
        item.unitPrice = actualUnitPrice
        item.totalPrice = actualUnitPrice * item.quantity
        calculatedTotalAmount += item.totalPrice
      }

      // ── RE-CALCULATE TOTALS ──
      const calculatedShippingAmount = calculatedTotalAmount >= 5000000 ? 0 : 50000
      const calculatedNetAmount = calculatedTotalAmount + calculatedShippingAmount
      
      let calculatedDepositAmount = data.depositAmount
      let calculatedRemainingAmount = data.remainingAmount

      if (data.paymentType === 'DEPOSIT') {
         // Ép cọc 50% cứng tránh Frontend bị hack số tiền cọc
         calculatedDepositAmount = Math.round(calculatedNetAmount * 0.5)
         calculatedRemainingAmount = calculatedNetAmount - calculatedDepositAmount
      } else if (data.paymentType === 'FULL') {
         calculatedDepositAmount = null
         calculatedRemainingAmount = null
      }

      // ── Step 2: Create the order ──
      let initialStatus: OrderStatus = orderStatus

      if (data.paymentType === 'DEPOSIT' && initialStatus === 'PENDING') {
        initialStatus = 'PENDING_CONFIRMATION'
      }

      const qrExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerType: data.customerType,
          customerId,
          organizationId,
          b2bApprovalStatus,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          status: initialStatus,
          totalAmount: calculatedTotalAmount,
          shippingAmount: calculatedShippingAmount,
          netAmount: calculatedNetAmount,
          taxAmount: 0,
          discountAmount: 0,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PENDING',
          paymentType: data.paymentType,
          depositPercentage: data.paymentType === 'DEPOSIT' ? 50 : null,
          depositAmount: calculatedDepositAmount,
          remainingAmount: calculatedRemainingAmount,
          qrExpiresAt: data.paymentMethod === 'BANK_TRANSFER' ? qrExpiresAt : null,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          selectedContractorId: data.selectedContractorId,
          orderItems: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              selectedUnit: item.selectedUnit,
              conversionFactor: item.conversionFactor,
              discount: 0
            }))
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              user: { select: { name: true, email: true } }
            }
          },
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, price: true, images: true, unit: true }
              }
            }
          }
        }
      })

      // ── Step 3: Update inventory (atomic with stock check) ──
      for (const item of data.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { productId: item.productId }
        })

        if (inventoryItem) {
          const previousStock = inventoryItem.availableQuantity

          await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: {
              availableQuantity: { decrement: item.quantity },
              reservedQuantity: { increment: item.quantity }
            }
          })

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              inventoryId: inventoryItem.id,
              movementType: 'OUT',
              quantity: item.quantity,
              previousStock: previousStock,
              newStock: previousStock - item.quantity,
              reason: `Order ${orderNumber}`,
              referenceType: 'ORDER',
              referenceId: newOrder.id,
              performedBy: userId || 'GUEST'
            }
          })
        }
      }

      return newOrder
    })

    // Update customer loyalty points if registered customer
    if (customerId) {
      try {
        await LoyaltyService.updateCustomerLoyalty(customerId, data.totalAmount)
        logger.info('Customer loyalty updated', { customerId, orderAmount: data.totalAmount })
      } catch (loyaltyError: any) {
        logger.error('Error updating customer loyalty', {
          error: loyaltyError.message,
          customerId
        })
      }
    }

    // Create notification for admin about new order
    try {
      const { createOrderNotification } = await import('@/lib/notification-service')
      await createOrderNotification({
        id: order.id,
        orderNumber: order.orderNumber,
        netAmount: order.netAmount,
        customerType: order.customerType,
        guestName: order.guestName,
        guestPhone: order.guestPhone,
        customer: order.customer
      })
    } catch (notifError: any) {
      logger.error('Error creating order notification', {
        error: notifError.message,
        orderId: order.id
      })
    }

    // Create notification for customer about successful order
    if (userId && order.customer) {
      try {
        const { createOrderStatusNotificationForCustomer } = await import('@/lib/notification-service')
        await createOrderStatusNotificationForCustomer({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customer: {
            userId: userId
          }
        })
      } catch (notifError: any) {
        logger.error('Error creating customer order notification', {
          error: notifError.message,
          orderId: order.id
        })
      }
    }

    // --- SEND ORDER CONFIRMATION EMAIL ---
    try {
      const emailToUse = order.customer?.user?.email || order.guestEmail
      const nameToUse = order.customer?.user?.name || order.guestName || 'Quý khách'

      if (emailToUse) {
        await EmailService.sendOrderConfirmation({
          email: emailToUse,
          name: nameToUse,
          orderNumber: order.orderNumber,
          totalAmount: order.netAmount,
          items: order.orderItems.map(item => ({
             name: item.product.name,
             quantity: (item as any).conversionFactor ? item.quantity / (item as any).conversionFactor : item.quantity,
             unit: (item as any).selectedUnit || (item.product as any).unit,
             price: (item as any).conversionFactor ? item.unitPrice * (item as any).conversionFactor : item.unitPrice
          }))
        })
        logger.info('Order confirmation email sent', { orderId: order.id, email: emailToUse })
      }
    } catch (emailError: any) {
      logger.error('Error sending order confirmation email', {
        error: emailError.message,
        orderId: order.id
      })
    }

    const duration = Date.now() - startTime
    logger.info('Order created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
      customerType: data.customerType,
      totalAmount: data.totalAmount,
      duration
    })
    logAPI.response('POST', '/api/orders', 201, duration)

    const res = NextResponse.json(
      createSuccessResponse(order, 'Order created successfully'),
      { status: 201 }
    )

    // 🛡️ SECURITY 2026: Set Guest Access Cookie if guest countdown
    if (data.customerType === 'GUEST') {
      const guestAccessToken = AuthService.generateGuestOrderToken(order.id)
      res.cookies.set(`order_access_${order.id}`, guestAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
    }

    return res

  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const err = error as Error

    // Handle stock errors thrown from inside the transaction
    if (err.message?.startsWith('STOCK_ERROR:')) {
      const stockMessage = err.message.replace('STOCK_ERROR:', '')
      logger.warn('Order failed due to stock issue', { message: stockMessage })
      return NextResponse.json(
        createErrorResponse(stockMessage, 'INSUFFICIENT_STOCK'),
        { status: 400 }
      )
    }

    logAPI.error('POST', '/api/orders', err, { duration })
    logger.error('Create order error', { error: err.message, stack: err.stack })

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}