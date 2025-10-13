import { describe, it, expect } from 'vitest'
import { 
  validateRequest, 
  loginSchema, 
  productSchema,
  sanitizeString,
  sanitizeObject
} from '@/lib/validation'

describe('Validation Utils', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = validateRequest(loginSchema, data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      const result = validateRequest(loginSchema, data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    it('should reject empty password', () => {
      const data = {
        email: 'test@example.com',
        password: ''
      }
      
      const result = validateRequest(loginSchema, data)
      expect(result.success).toBe(false)
    })
  })

  describe('productSchema', () => {
    it('should validate correct product data', () => {
      const data = {
        name: 'Test Product',
        description: 'Test description that is long enough',
        price: 100,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        sku: 'TEST-123',
        image: 'https://example.com/image.jpg',
        stockQuantity: 10
      }
      
      const result = validateRequest(productSchema, data)
      expect(result.success).toBe(true)
    })

    it('should reject negative price', () => {
      const data = {
        name: 'Test Product',
        description: 'Test description',
        price: -100,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        sku: 'TEST-123',
        image: 'https://example.com/image.jpg',
        stockQuantity: 10
      }
      
      const result = validateRequest(productSchema, data)
      expect(result.success).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('should remove < and > characters', () => {
      const input = '<script>alert("xss")</script>'
      const result = sanitizeString(input)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should trim whitespace', () => {
      const input = '  test  '
      const result = sanitizeString(input)
      expect(result).toBe('test')
    })

    it('should handle normal strings', () => {
      const input = 'normal string'
      const result = sanitizeString(input)
      expect(result).toBe('normal string')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com'
      }
      
      const result = sanitizeObject(input)
      expect(result.name).not.toContain('<')
      expect(result.email).toBe('test@example.com')
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>alert("xss")</script>',
          email: 'test@example.com'
        }
      }
      
      const result = sanitizeObject(input)
      expect(result.user.name).not.toContain('<')
      expect(result.user.email).toBe('test@example.com')
    })
  })
})
