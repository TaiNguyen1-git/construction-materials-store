'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  price: number
  unit: string
}

interface SaleEntry {
  productId: string
  productName: string
  quantity: number
  price: number
}

export default function DailySalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<SaleEntry[]>([{ productId: '', productName: '', quantity: 0, price: 0 }])
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit
        })))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const addEntry = () => {
    setEntries([...entries, { productId: '', productName: '', quantity: 0, price: 0 }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: keyof SaleEntry, value: any) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    
    // Auto-fill price when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newEntries[index].productName = product.name
        newEntries[index].price = product.price
      }
    }
    
    setEntries(newEntries)
  }

  const handleSubmit = async () => {
    // Validate
    const validEntries = entries.filter(e => e.productId && e.quantity > 0)
    if (validEntries.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 sản phẩm')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/daily-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleDate,
          entries: validEntries
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Đã lưu doanh số ngày!')
        // Reset form
        setEntries([{ productId: '', productName: '', quantity: 0, price: 0 }])
        setSaleDate(new Date().toISOString().split('T')[0])
      } else {
        toast.error(data.error?.message || 'Lỗi khi lưu')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra!')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return entries.reduce((sum, e) => sum + (e.quantity * e.price), 0)
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nhập Doanh Số Ngày</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          {/* Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Ngày bán</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Entries */}
          <div className="space-y-4 mb-6">
            {entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <label className="block text-sm font-medium mb-2">Sản phẩm</label>
                  <select
                    value={entry.productId}
                    onChange={(e) => updateEntry(index, 'productId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.price.toLocaleString('vi-VN')}đ/{p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Số lượng</label>
                  <input
                    type="number"
                    value={entry.quantity || ''}
                    onChange={(e) => updateEntry(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Đơn giá</label>
                  <input
                    type="number"
                    value={entry.price || ''}
                    onChange={(e) => updateEntry(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Thành tiền</label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-semibold text-blue-600">
                    {(entry.quantity * entry.price).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <div className="col-span-1">
                  <button
                    onClick={() => removeEntry(index)}
                    disabled={entries.length === 1}
                    className="w-full p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addEntry}
            className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>

          {/* Total */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Tổng cộng:</span>
              <span className="text-blue-600">{calculateTotal().toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Đang lưu...' : 'Lưu doanh số'}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Hướng dẫn:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Chọn ngày bán hàng</li>
            <li>2. Chọn sản phẩm đã bán (giá tự động điền)</li>
            <li>3. Nhập số lượng đã bán trong ngày</li>
            <li>4. Click "Lưu doanh số" để cập nhật hệ thống</li>
            <li>5. Hệ thống sẽ tự động trừ tồn kho và dùng cho dự đoán AI</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
