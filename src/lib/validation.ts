import { z } from 'zod'

// Common validation schemas

// User & Authentication
export const emailSchema = z.string().email('Email không hợp lệ')

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')

export const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
  .optional()

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
  phone: phoneSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

// Products
export const productSchema = z.object({
  name: z.string().min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự').max(200),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  price: z.number().positive('Giá phải lớn hơn 0'),
  categoryId: z.string().uuid('Category ID không hợp lệ'),
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'SKU chỉ được chứa chữ in hoa, số và dấu gạch ngang'),
  image: z.string().url('URL hình ảnh không hợp lệ'),
  stockQuantity: z.number().int().min(0, 'Số lượng tồn kho phải >= 0'),
  minStockLevel: z.number().int().min(0).optional(),
  supplierId: z.string().uuid().optional(),
})

export const updateProductSchema = productSchema.partial()

// Orders
export const orderItemSchema = z.object({
  productId: z.string().uuid('Product ID không hợp lệ'),
  quantity: z.number().int().positive('Số lượng phải lớn hơn 0'),
  price: z.number().positive('Giá phải lớn hơn 0'),
})

export const createOrderSchema = z.object({
  customerId: z.string().uuid('Customer ID không hợp lệ'),
  items: z.array(orderItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
  totalAmount: z.number().positive('Tổng tiền phải lớn hơn 0'),
  shippingAddress: z.string().min(10, 'Địa chỉ giao hàng phải có ít nhất 10 ký tự'),
  note: z.string().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
})

// Categories
export const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự').max(100),
  description: z.string().optional(),
  image: z.string().url('URL hình ảnh không hợp lệ').optional(),
})

// Reviews
export const reviewSchema = z.object({
  productId: z.string().uuid('Product ID không hợp lệ'),
  rating: z.number().int().min(1, 'Rating tối thiểu là 1').max(5, 'Rating tối đa là 5'),
  comment: z.string().min(10, 'Đánh giá phải có ít nhất 10 ký tự').max(1000),
})

// Inventory
export const inventoryUpdateSchema = z.object({
  productId: z.string().uuid('Product ID không hợp lệ'),
  quantity: z.number().int('Số lượng phải là số nguyên'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  note: z.string().optional(),
})

// Suppliers
export const supplierSchema = z.object({
  name: z.string().min(2, 'Tên nhà cung cấp phải có ít nhất 2 ký tự').max(200),
  contactPerson: z.string().min(2).max(100),
  email: emailSchema,
  phone: z.string().regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().min(10),
  taxCode: z.string().regex(/^[0-9]{10,13}$/, 'Mã số thuế không hợp lệ').optional(),
})

// Employees
export const employeeSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  position: z.string().min(2).max(100),
  salary: z.number().positive().optional(),
  hireDate: z.string().datetime().optional(),
})

// Pagination & Filtering
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  q: z.string().min(1).optional(),
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
})

// UUID validation
export const uuidSchema = z.string().uuid('ID không hợp lệ')

// Utility function to validate request body
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Sanitize input to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>]
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>]
    }
  }
  return sanitized
}
