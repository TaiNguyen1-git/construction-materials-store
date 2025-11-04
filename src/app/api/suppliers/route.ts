import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/lib/auth'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('access_token')?.value
    
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/suppliers - Get all suppliers with performance metrics
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'production' && (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const status = searchParams.get('status')
    const minRating = searchParams.get('minRating')
    
    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    
    if (minRating) {
      where.rating = { gte: parseInt(minRating) }
    }

    // Build order by clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: sortOrder }
        break
      case 'totalSpent':
        // We'll sort in memory after calculating performance metrics
        orderBy = { name: 'asc' }
        break
      case 'onTimeDeliveryRate':
        // We'll sort in memory after calculating performance metrics
        orderBy = { name: 'asc' }
        break
      default:
        orderBy = { [sortBy]: sortOrder }
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.supplier.count({ where })
    ])

    // Calculate performance metrics for each supplier
    const suppliersWithMetrics = await Promise.all(
      suppliers.map(async (supplier) => {
        // Get purchase order data
        const purchaseOrders = await prisma.purchaseOrder.findMany({
          where: { supplierId: supplier.id },
          include: {
            purchaseItems: true
          }
        })

        // Calculate metrics
        const totalOrders = purchaseOrders.length
        const totalSpent = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0)
        
        // Calculate on-time delivery rate
        const completedOrders = purchaseOrders.filter(order => order.status === 'RECEIVED')
        const onTimeDeliveries = completedOrders.filter(order => 
          order.receivedDate && order.expectedDate && 
          new Date(order.receivedDate) <= new Date(order.expectedDate)
        ).length
        const onTimeDeliveryRate = completedOrders.length > 0 
          ? Math.round((onTimeDeliveries / completedOrders.length) * 100) 
          : 0

        // Calculate average quality rating from purchase items
        let qualityRatingSum = 0
        let qualityRatingCount = 0
        
        for (const order of purchaseOrders) {
          for (const item of order.purchaseItems) {
            // In a real implementation, we might have quality ratings for items
            // For now, we'll mock this data
            qualityRatingSum += Math.floor(Math.random() * 20) + 30 // 30-50 out of 50
            qualityRatingCount++
          }
        }
        
        const qualityRating = qualityRatingCount > 0 
          ? Math.round(qualityRatingSum / qualityRatingCount) 
          : 0

        // Calculate average response time (mock data for now)
        const responseTime = Math.floor(Math.random() * 48) + 1 // 1-48 hours

        // Get last order date
        const lastOrder = purchaseOrders.length > 0 
          ? purchaseOrders.reduce((latest, order) => 
              !latest || order.createdAt > latest.createdAt ? order : latest
            )
          : null
        const lastOrderDate = lastOrder ? lastOrder.createdAt : null

        return {
          ...supplier,
          totalOrders,
          totalSpent,
          onTimeDeliveryRate,
          qualityRating,
          responseTime,
          lastOrderDate
        }
      })
    )

    // Sort by performance metrics if needed
    let sortedSuppliers = suppliersWithMetrics
    if (sortBy === 'totalSpent') {
      sortedSuppliers = [...suppliersWithMetrics].sort((a, b) => {
        return sortOrder === 'asc' ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent
      })
    } else if (sortBy === 'onTimeDeliveryRate') {
      sortedSuppliers = [...suppliersWithMetrics].sort((a, b) => {
        return sortOrder === 'asc' ? a.onTimeDeliveryRate - b.onTimeDeliveryRate : b.onTimeDeliveryRate - a.onTimeDeliveryRate
      })
    }

    return NextResponse.json({
      data: sortedSuppliers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/suppliers - Create supplier
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, address, contactPerson, taxId, paymentTerms, creditLimit, note } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check if supplier with email already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { email }
    })

    if (existingSupplier) {
      return NextResponse.json({ error: 'Supplier with this email already exists' }, { status: 400 })
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name,
        email,
        phone: phone || '',
        address: address || '',
        contactPerson: contactPerson || '',
        taxId: taxId || '',
        paymentTerms: paymentTerms || '30',
        creditLimit: parseFloat(creditLimit) || 0,
        notes: note || ''
      }
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}