'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

interface PredictionStats {
  totalPredictions: number
  totalValidated: number
  averageAccuracy: number
  byTimeframe: {
    WEEK: { count: number; accuracy: number }
    MONTH: { count: number; accuracy: number }
    QUARTER: { count: number; accuracy: number }
  }
  byProduct: Array<{
    productId: string
    productName: string
    predictions: number
    accuracy: number
  }>
  recentValidations: Array<{
    id: string
    productName: string
    targetDate: string
    predicted: number
    actual: number
    accuracy: number
    timeframe: string
  }>
}

export default function PredictionAccuracyPage() {
  const [stats, setStats] = useState<PredictionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/predictions/accuracy')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const runValidation = async () => {
    setValidating(true)
    try {
      const res = await fetch('/api/predictions/validate', {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        alert(`Đã validate ${data.data.validated} predictions!`)
        fetchStats() // Refresh
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Có lỗi xảy ra!')
    } finally {
      setValidating(false)
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 80) return 'text-blue-600'
    if (accuracy >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 90) return { label: 'Xuất sắc', color: 'bg-green-100 text-green-800' }
    if (accuracy >= 80) return { label: 'Tốt', color: 'bg-blue-100 text-blue-800' }
    if (accuracy >= 70) return { label: 'Khá', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Kém', color: 'bg-red-100 text-red-800' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có dữ liệu</h3>
          <p className="text-gray-600 mb-4">Hệ thống chưa có predictions nào được validate.</p>
          <button
            onClick={runValidation}
            disabled={validating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {validating ? 'Đang validate...' : 'Chạy Validation'}
          </button>
        </div>
      </div>
    )
  }

  const badge = getAccuracyBadge(stats.averageAccuracy)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Độ Chính Xác Dự Đoán AI</h1>
        <button
          onClick={runValidation}
          disabled={validating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${validating ? 'animate-spin' : ''}`} />
          {validating ? 'Đang validate...' : 'Chạy Validation'}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng Predictions</p>
              <p className="text-3xl font-bold mt-2">{stats.totalPredictions}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã Validate</p>
              <p className="text-3xl font-bold mt-2">{stats.totalValidated}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Độ chính xác TB</p>
              <p className={`text-3xl font-bold mt-2 ${getAccuracyColor(stats.averageAccuracy)}`}>
                {stats.averageAccuracy.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              {stats.averageAccuracy >= 80 ? (
                <TrendingUp className="w-10 h-10 text-green-500" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-500" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đánh giá</p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            <AlertTriangle className={`w-12 h-12 opacity-20 ${
              stats.averageAccuracy >= 80 ? 'text-green-500' : 'text-yellow-500'
            }`} />
          </div>
        </div>
      </div>

      {/* By Timeframe */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Độ Chính Xác Theo Khung Thời Gian</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.byTimeframe).map(([timeframe, data]) => (
            <div key={timeframe} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{timeframe}</span>
                <span className="text-sm text-gray-600">{data.count} predictions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      data.accuracy >= 90 ? 'bg-green-500' :
                      data.accuracy >= 80 ? 'bg-blue-500' :
                      data.accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.accuracy}%` }}
                  />
                </div>
                <span className={`font-bold ${getAccuracyColor(data.accuracy)}`}>
                  {data.accuracy.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Product */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Độ Chính Xác Theo Sản Phẩm</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Sản phẩm</th>
                <th className="text-center py-3 px-4">Predictions</th>
                <th className="text-center py-3 px-4">Độ chính xác</th>
                <th className="text-center py-3 px-4">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {stats.byProduct.map((product) => {
                const badge = getAccuracyBadge(product.accuracy)
                return (
                  <tr key={product.productId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{product.productName}</td>
                    <td className="text-center py-3 px-4">{product.predictions}</td>
                    <td className={`text-center py-3 px-4 font-semibold ${getAccuracyColor(product.accuracy)}`}>
                      {product.accuracy.toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Validations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Validations Gần Đây</h2>
        <div className="space-y-3">
          {stats.recentValidations.map((validation) => (
            <div key={validation.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{validation.productName}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(validation.targetDate).toLocaleDateString('vi-VN')} • {validation.timeframe}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  getAccuracyBadge(validation.accuracy).color
                }`}>
                  {validation.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Dự đoán</p>
                  <p className="font-semibold">{validation.predicted.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Thực tế</p>
                  <p className="font-semibold">{validation.actual.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sai lệch</p>
                  <p className={`font-semibold ${
                    Math.abs(validation.predicted - validation.actual) < validation.actual * 0.1
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(validation.predicted - validation.actual).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
