'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Clock, 
  Star,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface SupplierData {
  id: string
  name: string
  contactPerson: string | null
  email: string | null
  phone: string | null
  address: string | null
  rating: number | null
  creditLimit: number
  currentBalance: number
  paymentTerms: string | null
  totalOrders: number
  totalSpent: number
  onTimeDeliveryRate: number
  qualityRating: number
  responseTime: number
  lastOrderDate: string | null
}

interface OrderHistoryItem {
  date: string
  orderNumber: string
  amount: number
  status: string
  deliveryTime: number | null
  qualityRating: number | null
}

interface MonthlySpending {
  month: string
  amount: number
}

export default function SupplierPerformancePage() {
  const params = useParams()
  const supplierId = params.id as string
  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSupplierData()
  }, [supplierId])

  const fetchSupplierData = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, we would fetch actual data from the API
      // For now, we'll use mock data
      
      // Mock supplier data
      const mockSupplier: SupplierData = {
        id: supplierId,
        name: 'ABC Construction Materials Co.',
        contactPerson: 'Nguyễn Văn B',
        email: 'contact@abcmaterials.com',
        phone: '0987654321',
        address: '123 Industrial Road, Construction City',
        rating: 45,
        creditLimit: 50000000,
        currentBalance: 15000000,
        paymentTerms: '30',
        totalOrders: 24,
        totalSpent: 125000000,
        onTimeDeliveryRate: 87,
        qualityRating: 42,
        responseTime: 12,
        lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      setSupplier(mockSupplier)
      
      // Mock order history
      const mockOrderHistory: OrderHistoryItem[] = [
        { date: '2023-10-01', orderNumber: 'PO-2023-0012', amount: 5000000, status: 'RECEIVED', deliveryTime: 2, qualityRating: 45 },
        { date: '2023-09-15', orderNumber: 'PO-2023-0011', amount: 7500000, status: 'RECEIVED', deliveryTime: 1, qualityRating: 48 },
        { date: '2023-09-01', orderNumber: 'PO-2023-0010', amount: 3000000, status: 'RECEIVED', deliveryTime: 3, qualityRating: 40 },
        { date: '2023-08-20', orderNumber: 'PO-2023-0009', amount: 4500000, status: 'RECEIVED', deliveryTime: 2, qualityRating: 42 },
        { date: '2023-08-05', orderNumber: 'PO-2023-0008', amount: 6000000, status: 'RECEIVED', deliveryTime: 1, qualityRating: 46 },
        { date: '2023-07-22', orderNumber: 'PO-2023-0007', amount: 3500000, status: 'RECEIVED', deliveryTime: 4, qualityRating: 38 },
        { date: '2023-07-10', orderNumber: 'PO-2023-0006', amount: 5500000, status: 'RECEIVED', deliveryTime: 2, qualityRating: 44 },
        { date: '2023-06-28', orderNumber: 'PO-2023-0005', amount: 4000000, status: 'RECEIVED', deliveryTime: 3, qualityRating: 41 },
      ]
      
      setOrderHistory(mockOrderHistory)
      
      // Mock monthly spending
      const mockMonthlySpending: MonthlySpending[] = [
        { month: 'Jan', amount: 8000000 },
        { month: 'Feb', amount: 9500000 },
        { month: 'Mar', amount: 7500000 },
        { month: 'Apr', amount: 11000000 },
        { month: 'May', amount: 10000000 },
        { month: 'Jun', amount: 12000000 },
        { month: 'Jul', amount: 9000000 },
        { month: 'Aug', amount: 10500000 },
        { month: 'Sep', amount: 11500000 },
        { month: 'Oct', amount: 5000000 },
      ]
      
      setMonthlySpending(mockMonthlySpending)
      
    } catch (error) {
      console.error('Error fetching supplier data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Supplier not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested supplier could not be found.</p>
      </div>
    )
  }

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'text-gray-400'
    if (rating >= 40) return 'text-green-500'
    if (rating >= 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-green-100 text-green-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supplier Performance: {supplier.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed performance metrics and analytics
        </p>
      </div>

      {/* Supplier Info */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="text-sm font-medium">{supplier.contactPerson || 'N/A'}</p>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium">{supplier.email || 'N/A'}</p>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium">{supplier.phone || 'N/A'}</p>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-sm font-medium">{supplier.address || 'N/A'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">Credit Limit</p>
              <p className="text-sm font-medium">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(supplier.creditLimit)}
              </p>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-sm font-medium">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(supplier.currentBalance)}
              </p>
              <p className="text-sm text-gray-500">Payment Terms</p>
              <p className="text-sm font-medium">{supplier.paymentTerms || 'N/A'} days</p>
              <p className="text-sm text-gray-500">Last Order</p>
              <p className="text-sm font-medium">
                {supplier.lastOrderDate 
                  ? new Date(supplier.lastOrderDate).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            <div className="mt-2 space-y-3">
              <div className="flex items-center">
                <Star className={`h-5 w-5 ${getRatingColor(supplier.rating)} mr-2`} />
                <div>
                  <p className="text-sm font-medium">
                    {supplier.rating ? (supplier.rating / 10).toFixed(1) : 'N/A'} Stars
                  </p>
                  <p className="text-xs text-gray-500">Overall Rating</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">{supplier.onTimeDeliveryRate}%</p>
                  <p className="text-xs text-gray-500">On-Time Delivery</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">{supplier.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">{supplier.responseTime} hrs</p>
                  <p className="text-xs text-gray-500">Avg. Response Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Monthly Spending Trend
          </h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)), 'Amount']} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Volume */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-green-500" />
            Order Volume & Quality
          </h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderHistory.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="orderNumber" />
                <YAxis yAxisId="left" tickFormatter={(value) => `${value / 1000000}M`} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 50]} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'amount') {
                      return [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)), 'Amount']
                    }
                    return [value, name === 'qualityRating' ? 'Quality Rating' : 'Amount']
                  }}
                />
                <Bar yAxisId="left" dataKey="amount" fill="#10b981" name="Amount" />
                <Bar yAxisId="right" dataKey="qualityRating" fill="#8b5cf6" name="Quality Rating" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-500" />
            Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderHistory.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.deliveryTime ? `${order.deliveryTime} days` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Star className={`h-4 w-4 ${getRatingColor(order.qualityRating)} mr-1`} />
                      <span>{order.qualityRating ? (order.qualityRating / 10).toFixed(1) : 'N/A'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}