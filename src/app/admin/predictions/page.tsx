'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Package, RefreshCw, Calendar, Target } from 'lucide-react'

interface InventoryPrediction {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStockLevel: number
  predictedDemand: number
  recommendedOrder: number
  confidence: number
  factors: {
    historicalAverage: number
    trend: number
    seasonalMultiplier: number
    dataPoints: number
    variability: number
    currentStock: number
    safetyStock: number
  }
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<InventoryPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filters, setFilters] = useState({
    timeframe: 'MONTH',
    minConfidence: '0.7',
    includeSeasonality: true
  })

  useEffect(() => {
    fetchPredictions()
  }, [filters])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, value.toString())
      })

      const response = await fetch(`/api/predictions/inventory?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setPredictions(data.data.predictions || [])
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePredictions = async () => {
    try {
      setGenerating(true)
      const response = await fetch('/api/predictions/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: filters.timeframe,
          includeSeasonality: filters.includeSeasonality
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Cập nhật dự đoán thành công!')
        fetchPredictions()
      } else {
        alert('Lỗi cập nhật: ' + data.error?.message)
      }
    } catch (error) {
      alert('Lỗi cập nhật: ' + error)
    } finally {
      setGenerating(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStockStatus = (currentStock: number, minStock: number, predictedDemand: number) => {
    if (currentStock <= 0) return { label: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    if (currentStock <= minStock) return { label: 'Dưới mức tối thiểu', color: 'bg-orange-100 text-orange-800' }
    if (currentStock < predictedDemand) return { label: 'Có thể thiếu hàng', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Đủ hàng', color: 'bg-green-100 text-green-800' }
  }

  const highPriorityItems = predictions.filter(p => 
    p.currentStock <= p.minStockLevel || p.recommendedOrder > 0
  )

  const lowConfidenceItems = predictions.filter(p => p.confidence < 0.7)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dự đoán Inventory</h1>
          
          <button
            onClick={generatePredictions}
            disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Đang cập nhật...' : 'Cập nhật dự đoán'}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khung thời gian</label>
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="WEEK">Tuần</option>
                <option value="MONTH">Tháng</option>
                <option value="QUARTER">Quý</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Độ tin cậy tối thiểu</label>
              <select
                value={filters.minConfidence}
                onChange={(e) => setFilters({...filters, minConfidence: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="0.5">50%</option>
                <option value="0.6">60%</option>
                <option value="0.7">70%</option>
                <option value="0.8">80%</option>
                <option value="0.9">90%</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="seasonality"
                checked={filters.includeSeasonality}
                onChange={(e) => setFilters({...filters, includeSeasonality: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="seasonality" className="text-sm text-gray-700">Bao gồm yếu tố mùa vụ</label>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng sản phẩm</div>
                <div className="text-2xl font-bold">{predictions.length}</div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Cần đặt hàng</div>
                <div className="text-2xl font-bold text-orange-600">{highPriorityItems.length}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Độ tin cậy thấp</div>
                <div className="text-2xl font-bold text-red-600">{lowConfidenceItems.length}</div>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng đề xuất đặt</div>
                <div className="text-2xl font-bold text-green-600">
                  {predictions.reduce((sum, p) => sum + p.recommendedOrder, 0).toFixed(0)}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự đoán nhu cầu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đề xuất đặt hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ tin cậy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictions.map((prediction) => {
                  const stockStatus = getStockStatus(
                    prediction.currentStock, 
                    prediction.minStockLevel, 
                    prediction.predictedDemand
                  )
                  
                  return (
                    <tr key={prediction.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{prediction.productName}</div>
                          <div className="text-sm text-gray-500">{prediction.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">{prediction.currentStock}</div>
                          <div className="text-gray-500">Min: {prediction.minStockLevel}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{prediction.predictedDemand.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">
                          Trend: {prediction.factors.trend > 0 ? '+' : ''}{prediction.factors.trend.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${prediction.recommendedOrder > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {prediction.recommendedOrder.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {(prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {predictions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Chưa có dự đoán nào
                <div className="mt-2 text-sm">Nhấn &quot;Cập nhật dự đoán&quot; để tạo dự đoán mới</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* High Priority Alert */}
      {highPriorityItems.length > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div className="font-medium text-orange-800">Cảnh báo: {highPriorityItems.length} sản phẩm cần chú ý</div>
          </div>
          <div className="text-sm text-orange-700">
            Có {highPriorityItems.filter(p => p.currentStock <= p.minStockLevel).length} sản phẩm dưới mức tối thiểu và {' '}
            {highPriorityItems.filter(p => p.recommendedOrder > 0).length} sản phẩm được đề xuất đặt hàng.
          </div>
        </div>
      )}
    </div>
  )
}
