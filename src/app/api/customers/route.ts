import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/customers - Get all customers (PUBLIC - no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {}
    
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
    }
    
    if (status) {
      where.status = status
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              isActive: true,
            }
          },
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where })
    ])

    // Transform data to match frontend expectations
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      phone: customer.user.phone || undefined,
      address: customer.user.address || undefined,
      status: customer.user.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: customer.createdAt,
      _count: customer._count
    }))

    return NextResponse.json(
      createSuccessResponse({
        data: transformedCustomers,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, 'Customers retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch customers', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address, status } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        createErrorResponse('Name, email, and password are required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('Email already exists', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Create user and customer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password, // In production, hash this!
          phone: phone || null,
          role: 'CUSTOMER'
        }
      })

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          address: address || null,
          status: status || 'ACTIVE'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })

      return customer
    })

    return NextResponse.json(
      createSuccessResponse(result, 'Customer created successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      createErrorResponse('Failed to create customer', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
