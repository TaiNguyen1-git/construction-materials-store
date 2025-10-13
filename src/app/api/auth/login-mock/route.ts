import { NextRequest, NextResponse } from 'next/server'
import { AuthService, UserRole } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Mock users for development
const mockUsers = [
  {
    id: 'user_admin',
    email: 'admin@constructionstore.com',
    name: 'System Administrator',
    password: 'admin123', // In real app, this would be hashed
    role: UserRole.MANAGER,
    phone: '+1234567890',
    employee: {
      id: 'emp_admin',
      employeeCode: 'EMP001',
      department: 'Management',
      position: 'Store Manager',
    }
  },
  {
    id: 'user_employee',
    email: 'employee@constructionstore.com',
    name: 'Store Employee',
    password: 'employee123',
    role: UserRole.EMPLOYEE,
    phone: '+1234567891',
    employee: {
      id: 'emp_employee',
      employeeCode: 'EMP002',
      department: 'Sales',
      position: 'Sales Associate',
    }
  },
  {
    id: 'user_customer',
    email: 'customer@example.com',
    name: 'John Customer',
    password: 'customer123',
    role: UserRole.CUSTOMER,
    phone: '+1234567892',
    customer: {
      id: 'cust_customer',
      customerType: 'REGULAR',
      loyaltyPoints: 100,
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find user in mock data
    const user = mockUsers.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS'),
        { status: 401 }
      )
    }

    // Check password (in real app, use hashing)
    if (user.password !== password) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS'),
        { status: 401 }
      )
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const { accessToken, refreshToken } = AuthService.generateTokenPair(tokenPayload)

    // Return user data and tokens
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      employee: user.employee || null,
      customer: user.customer || null,
    }

    return NextResponse.json(
      createSuccessResponse({
        user: userData,
        accessToken,
        refreshToken,
      }, 'Login successful'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}