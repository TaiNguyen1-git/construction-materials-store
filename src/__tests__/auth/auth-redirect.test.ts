import { describe, it, expect } from 'vitest'
import { getPostLoginRedirectUrl, User } from '../../lib/auth-redirect'

describe('Auth Redirect Logic', () => {
    const mockManager: User = { id: '1', email: 'm@test.com', name: 'Manager', role: 'MANAGER' }
    const mockEmployee: User = { id: '2', email: 'e@test.com', name: 'Employee', role: 'EMPLOYEE' }
    const mockContractor: User = { id: '3', email: 'c@test.com', name: 'Contractor', role: 'CONTRACTOR' }
    const mockCustomer: User = { id: '4', email: 'cu@test.com', name: 'Customer', role: 'CUSTOMER' }

    describe('getDefaultRedirectPath', () => {
        it('should redirect MANAGER to /admin', () => {
            expect(getPostLoginRedirectUrl(mockManager)).toBe('/admin')
        })

        it('should redirect EMPLOYEE to /admin', () => {
            expect(getPostLoginRedirectUrl(mockEmployee)).toBe('/admin')
        })

        it('should redirect CONTRACTOR to /contractor/dashboard', () => {
            expect(getPostLoginRedirectUrl(mockContractor)).toBe('/contractor/dashboard')
        })

        it('should redirect CUSTOMER to /', () => {
            expect(getPostLoginRedirectUrl(mockCustomer)).toBe('/')
        })
    })

    describe('getPostLoginRedirectUrl with callbackUrl', () => {
        it('should use valid local callbackUrl', () => {
            expect(getPostLoginRedirectUrl(mockCustomer, '?callbackUrl=/products/1')).toBe('/products/1')
            expect(getPostLoginRedirectUrl(mockCustomer, 'http://localhost:3000/login?callbackUrl=/products/1')).toBe('/products/1')
        })

        it('should ignore non-local callbackUrl', () => {
            expect(getPostLoginRedirectUrl(mockCustomer, '?callbackUrl=https://google.com')).toBe('/')
            // Should fall back to default
        })

        it('should validate role for protected paths', () => {
            // Customer trying to access Admin path -> Fallback to /
            expect(getPostLoginRedirectUrl(mockCustomer, '?callbackUrl=/admin/settings')).toBe('/')

            // Contractor accessing Contractor path -> OK
            expect(getPostLoginRedirectUrl(mockContractor, '?callbackUrl=/contractor/orders')).toBe('/contractor/orders')

            // Customer accessing Contractor path -> Fallback to /
            expect(getPostLoginRedirectUrl(mockCustomer, '?callbackUrl=/contractor/orders')).toBe('/')

            // Manager accessing Admin path -> OK
            expect(getPostLoginRedirectUrl(mockManager, '?callbackUrl=/admin/users')).toBe('/admin/users')
        })

        it('should allow shared paths', () => {
            expect(getPostLoginRedirectUrl(mockContractor, '?callbackUrl=/account/profile')).toBe('/account/profile')
        })
    })
})
