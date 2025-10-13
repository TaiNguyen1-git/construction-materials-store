// Define types for our analytics data
interface SalesDataPoint {
  date: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  totalSold: number;
  revenue: number;
  inventoryLevel: number;
}

interface CustomerSegment {
  segment: string;
  customerCount: number;
  totalSpent: number;
  averageOrderValue: number;
}

interface InventoryTurnover {
  productId: string;
  productName: string;
  sku: string;
  turnoverRate: number;
  daysInInventory: number;
}

import { prisma } from '@/lib/prisma'

export class AnalyticsService {
  // Get sales data for a given period
  static async getSalesData(startDate: Date, endDate: Date, granularity: 'day' | 'week' | 'month' = 'day'): Promise<SalesDataPoint[]> {
    try {
      const orders = await (prisma as any).order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'DELIVERED' // Only count completed orders
        },
        include: {
          orderItems: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Group orders by date based on granularity
      const groupedData: Record<string, { totalSales: number; orderCount: number }> = {}

      orders.forEach((order: any) => {
        let dateKey: string
        
        if (granularity === 'day') {
          dateKey = order.createdAt.toISOString().split('T')[0]
        } else if (granularity === 'week') {
          const date = new Date(order.createdAt)
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
          dateKey = weekStart.toISOString().split('T')[0]
        } else {
          dateKey = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
        }

        if (!groupedData[dateKey]) {
          groupedData[dateKey] = { totalSales: 0, orderCount: 0 }
        }

        const orderTotal = order.orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
        groupedData[dateKey].totalSales += orderTotal
        groupedData[dateKey].orderCount += 1
      })

      // Convert to array and calculate average order value
      return Object.entries(groupedData).map(([date, data]) => ({
        date,
        totalSales: data.totalSales,
        orderCount: data.orderCount,
        averageOrderValue: data.orderCount > 0 ? data.totalSales / data.orderCount : 0
      }))
    } catch (error) {
      console.error('Error fetching sales data:', error)
      throw error
    }
  }

  // Get top selling products
  static async getTopSellingProducts(limit: number = 10): Promise<ProductPerformance[]> {
    try {
      const products = await (prisma as any).product.findMany({
        include: {
          inventoryItem: true,
          orderItems: {
            where: {
              order: {
                status: 'DELIVERED'
              }
            }
          }
        }
      })

      const productPerformance = products.map((product: any) => {
        const totalSold = product.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        const revenue = product.orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
        
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          totalSold,
          revenue,
          inventoryLevel: product.inventoryItem?.availableQuantity || 0
        }
      })

      // Sort by revenue and take top N
      return productPerformance
        .sort((a: ProductPerformance, b: ProductPerformance) => b.revenue - a.revenue)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching top selling products:', error)
      throw error
    }
  }

  // Get customer segmentation data
  static async getCustomerSegments(): Promise<CustomerSegment[]> {
    try {
      const customers = await (prisma as any).customer.findMany({
        include: {
          orders: {
            where: {
              status: 'DELIVERED'
            },
            include: {
              orderItems: true
            }
          }
        }
      })

      const segments: Record<string, { customerCount: number; totalSpent: number }> = {
        'VIP': { customerCount: 0, totalSpent: 0 },
        'Regular': { customerCount: 0, totalSpent: 0 },
        'Wholesale': { customerCount: 0, totalSpent: 0 }
      }

      customers.forEach((customer: any) => {
        const totalSpent = customer.orders.reduce((sum: number, order: any) => {
          return sum + order.orderItems.reduce((orderSum: number, item: any) => orderSum + item.totalPrice, 0)
        }, 0)
        
        const orderCount = customer.orders.length
        const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0
        
        let segment: string
        if (customer.customerType === 'VIP') {
          segment = 'VIP'
        } else if (customer.customerType === 'WHOLESALE') {
          segment = 'Wholesale'
        } else {
          segment = 'Regular'
        }

        segments[segment].customerCount += 1
        segments[segment].totalSpent += totalSpent
      })

      return Object.entries(segments).map(([segment, data]) => ({
        segment,
        customerCount: data.customerCount,
        totalSpent: data.totalSpent,
        averageOrderValue: data.customerCount > 0 ? data.totalSpent / data.customerCount : 0
      }))
    } catch (error) {
      console.error('Error fetching customer segments:', error)
      throw error
    }
  }

  // Get inventory turnover data
  static async getInventoryTurnover(): Promise<InventoryTurnover[]> {
    try {
      const products = await (prisma as any).product.findMany({
        include: {
          inventoryItem: true,
          orderItems: {
            where: {
              order: {
                status: 'DELIVERED'
              }
            }
          }
          // We would need purchase data for accurate turnover calculation
          // This is a simplified version
        }
      })

      const turnoverData = products.map((product: any) => {
        const totalSold = product.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        
        // Simplified turnover calculation
        // In a real implementation, we would use cost of goods sold and average inventory
        const inventoryLevel = product.inventoryItem?.availableQuantity || 0
        const turnoverRate = inventoryLevel > 0 ? totalSold / inventoryLevel : 0
        const daysInInventory = turnoverRate > 0 ? 365 / turnoverRate : 0
        
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          turnoverRate,
          daysInInventory
        }
      })

      // Sort by turnover rate (highest first)
      return turnoverData.sort((a: InventoryTurnover, b: InventoryTurnover) => b.turnoverRate - a.turnoverRate)
    } catch (error) {
      console.error('Error fetching inventory turnover data:', error)
      throw error
    }
  }

  // Get financial summary
  static async getFinancialSummary(period: 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    try {
      const now = new Date()
      let startDate: Date
      
      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (period === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }

      const orders = await (prisma as any).order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now
          },
          status: 'DELIVERED'
        },
        include: {
          orderItems: true
        }
      })

      const totalRevenue = orders.reduce((sum: number, order: any) => {
        return sum + order.orderItems.reduce((orderSum: number, item: any) => orderSum + item.totalPrice, 0)
      }, 0)

      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Get inventory value
      const inventoryItems = await (prisma as any).inventoryItem.findMany({
        include: {
          product: true
        }
      })

      const totalInventoryValue = inventoryItems.reduce((sum: number, item: any) => {
        return sum + (item.availableQuantity * (item.product.price || 0))
      }, 0)

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalInventoryValue,
        periodStartDate: startDate,
        periodEndDate: now
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error)
      throw error
    }
  }
}