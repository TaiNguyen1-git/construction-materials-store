import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireEmployee } from '@/lib/auth-middleware-api'
import type { SupplierDeliveryRating } from '@prisma/client'

// GET /api/suppliers - Get all suppliers with performance metrics
export async function GET(request: NextRequest) {
  try {
    const authError = requireEmployee(request)
    if (authError) return authError


    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as Prisma.SortOrder
    const status = searchParams.get('status')
    const minRating = searchParams.get('minRating')

    const skip = (page - 1) * limit

    // Build filter object
    const where: Prisma.SupplierWhereInput = {}

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
    let orderBy: Prisma.SupplierOrderByWithRelationInput = {}
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
        take: limit,
        // 🚀 PERFORMANCE FIX: Include related data to avoid N+1 queries
        include: {
          purchaseOrders: {
            include: {
              purchaseItems: true
            }
          },
          deliveryRatings: {
            orderBy: { ratedAt: 'desc' },
            take: 50 // Last 50 ratings for calculation
          }
        }
      }),
      prisma.supplier.count({ where })
    ])

    // Calculate performance metrics for each supplier (now using included data)
    const suppliersWithMetrics = suppliers.map((supplier) => {
      const purchaseOrders = supplier.purchaseOrders || []
      const deliveryRatings = supplier.deliveryRatings || []

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

      // Calculate quality rating from REAL delivery ratings
      let qualityRating = 0
      let responseTime = 24 // Default 24 hours

      if (deliveryRatings.length > 0) {
        // Calculate average quality from real ratings (convert 1-5 scale to 0-50 scale)
        const avgQuality = deliveryRatings.reduce((sum, r) => sum + r.qualityRating, 0) / deliveryRatings.length
        const avgPackaging = deliveryRatings.reduce((sum, r) => sum + r.packagingRating, 0) / deliveryRatings.length
        const avgAccuracy = deliveryRatings.reduce((sum, r) => sum + r.accuracyRating, 0) / deliveryRatings.length

        // Weighted average: Quality 50%, Accuracy 30%, Packaging 20%
        const weightedAvg = (avgQuality * 0.5 + avgAccuracy * 0.3 + avgPackaging * 0.2)
        qualityRating = Math.round(weightedAvg * 10) // Convert 1-5 scale to 0-50

        // Calculate response time from real data
        const ratingsWithResponse = deliveryRatings.filter(r => r.responseHours != null)
        if (ratingsWithResponse.length > 0) {
          responseTime = Math.round(
            ratingsWithResponse.reduce((sum, r) => sum + (r.responseHours || 0), 0) / ratingsWithResponse.length
          )
        }
      } else if (supplier.rating && supplier.rating > 0) {
        // Fallback to supplier's overall rating field
        qualityRating = supplier.rating
      } else if (completedOrders.length > 0) {
        // Estimate from on-time delivery if no ratings exist
        qualityRating = Math.round((onTimeDeliveryRate / 100) * 50)
      } else {
        // Default for new suppliers
        qualityRating = 35
      }

      // If no rating data, calculate response time from order dates
      if (deliveryRatings.length === 0) {
        const ordersWithDates = completedOrders.filter(o => o.receivedDate && o.orderDate)
        if (ordersWithDates.length > 0) {
          const totalHours = ordersWithDates.reduce((sum, order) => {
            const orderDate = new Date(order.orderDate)
            const receivedDate = new Date(order.receivedDate!)
            const hours = (receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
            return sum + Math.min(hours, 168) // Cap at 7 days
          }, 0)
          responseTime = Math.round(totalHours / ordersWithDates.length)
        }
      }

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
        lastOrderDate,
        ratingsCount: deliveryRatings.length // Show how many ratings exist
      }
    })

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
  } catch (error: unknown) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/suppliers - Create supplier
export async function POST(request: NextRequest) {
  try {
    const authError = requireEmployee(request)
    if (authError) return authError

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
  } catch (error: unknown) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}