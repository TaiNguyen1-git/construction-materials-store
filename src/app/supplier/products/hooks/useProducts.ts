import { useState, useEffect, useCallback } from 'react'
import { Product } from '../types'

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Filter & Pagination States
    const [filterCategory, setFilterCategory] = useState('ALL')
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [filterStock, setFilterStock] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // Edit State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        price: 0,
        availableQuantity: 0,
        image: ''
    })

    // Create State
    const [isCreating, setIsCreating] = useState(false)
    const [createData, setCreateData] = useState({
        name: '',
        sku: '',
        price: 0,
        availableQuantity: 0,
        categoryId: '',
        description: '',
        imageUrl: '',
        suggestedCategory: '',
        unit: 'Viên',
        wholesalePrice: undefined as number | undefined,
        minWholesaleQty: 10
    })
    const [isUploading, setIsUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Bulk Import State
    const [isImporting, setIsImporting] = useState(false)
    const [importLog, setImportLog] = useState<{ success: number, failed: number }>({ success: 0, failed: 0 })
    const [isProcessingImport, setIsProcessingImport] = useState(false)

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories')
            const data = await res.json()
            if (data.success) {
                const flats: { id: string, name: string }[] = []
                data.data.forEach((cat: any) => {
                    flats.push({ id: cat.id, name: cat.name })
                    if (cat.children) {
                        cat.children.forEach((child: any) => {
                            flats.push({ id: child.id, name: `${cat.name} > ${child.name}` })
                        })
                    }
                })
                setCategories(flats)
            }
        } catch (error) {
            console.error('Fetch categories failed')
        }
    }, [])

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')
            const res = await fetch(`/api/supplier/products?supplierId=${supplierId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProducts(data.data)
                    setCurrentPage(1)
                }
            }
        } catch (error) {
            console.error('Fetch products error:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [fetchProducts, fetchCategories])

    const handleEdit = (product: Product) => {
        setEditingId(product.id)
        setEditData({
            price: product.price,
            availableQuantity: product.inventoryItem?.availableQuantity || 0,
            image: product.images?.[0] || ''
        })
    }

    const handleSave = async (id: string) => {
        try {
            const token = localStorage.getItem('supplier_token')
            const payload: any = {
                id,
                price: editData.price,
                availableQuantity: editData.availableQuantity
            }
            if (editData.image) {
                payload.images = [editData.image]
            }

            const res = await fetch('/api/supplier/products', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setMessage({ type: 'success', text: 'Cập nhật sản phẩm thành công' })
                    setEditingId(null)
                    fetchProducts()
                    setTimeout(() => setMessage(null), 3000)
                }
            } else {
                setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' })
        }
    }

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('supplier_token')
            await fetch('/api/supplier/products', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            fetchProducts()
        } catch (error) {
            console.error('Toggle status error:', error)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" vĩnh viễn không?`)) return

        try {
            const token = localStorage.getItem('supplier_token')
            const res = await fetch(`/api/supplier/products?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: 'Đã xóa sản phẩm thành công' })
                fetchProducts()
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: data.message || 'Không thể xóa sản phẩm. Có thể sản phẩm đã được liên kết với một đơn hàng.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa sản phẩm' })
        }
    }

    const handleImageEditUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.success) {
                setEditData(prev => ({ ...prev, image: data.fileUrl }))
                setMessage({ type: 'success', text: 'Tải ảnh lên thành công (Đang xem trước)' })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: 'Lỗi khi tải ảnh lên: ' + data.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi tải ảnh' })
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                setCreateData(prev => ({ ...prev, imageUrl: data.fileUrl }))
                setMessage({ type: 'success', text: 'Tải ảnh lên thành công' })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: 'Lỗi khi tải ảnh lên: ' + data.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi tải ảnh' })
        } finally {
            setIsUploading(false)
        }
    }

    const handleCreate = async () => {
        try {
            if (!createData.name || !createData.sku || !createData.categoryId || createData.price <= 0) {
                setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
                return
            }

            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')

            const payload = {
                ...createData,
                supplierId,
                images: createData.imageUrl ? [createData.imageUrl] : [],
                description: createData.categoryId === 'OTHER'
                    ? `[Đề xuất danh mục: ${createData.suggestedCategory}] ${createData.description}`
                    : createData.description
            }

            if (payload.categoryId === 'OTHER') {
                const uncategorized = categories.find(c =>
                    c.name.toLowerCase().includes('khác') ||
                    c.name.toLowerCase().includes('uncategorized') ||
                    c.name.toLowerCase().includes('chờ')
                )
                payload.categoryId = uncategorized ? uncategorized.id : (categories[0]?.id || '')
            }

            const res = await fetch('/api/supplier/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                setMessage({ type: 'success', text: 'Tạo sản phẩm mới thành công' })
                setIsCreating(false)
                setCreateData({ name: '', sku: '', price: 0, availableQuantity: 0, categoryId: '', description: '', imageUrl: '', suggestedCategory: '', unit: 'Viên', wholesalePrice: undefined, minWholesaleQty: 10 })
                fetchProducts()
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: data.message || 'Lỗi khi tạo sản phẩm' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi hệ thống' })
        }
    }

    const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsProcessingImport(true)
        setImportLog({ success: 0, failed: 0 })

        try {
            const text = await file.text()
            const lines = text.split('\n')
            let successRaw = 0
            let failedRaw = 0
            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue
                const cols = lines[i].split(',')
                if (cols.length < 5) {
                    failedRaw++
                    continue
                }
                const payload = {
                    name: cols[0]?.trim(),
                    sku: cols[1]?.trim(),
                    categoryId: cols[2]?.trim(),
                    price: Number(cols[3]?.trim()) || 0,
                    availableQuantity: Number(cols[4]?.trim()) || 0,
                    supplierId,
                    images: [],
                    description: 'Nhập hàng loạt từ Excel'
                }

                if (!payload.name || !payload.sku || !payload.categoryId || payload.price <= 0) {
                    failedRaw++
                    continue
                }

                const res = await fetch('/api/supplier/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (data.success) successRaw++; else failedRaw++;
            }

            setImportLog({ success: successRaw, failed: failedRaw })
            fetchProducts()
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi định dạng file CSV' })
        } finally {
            setIsProcessingImport(false)
        }
    }

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        const matchCat = filterCategory === 'ALL' || p.category?.id === filterCategory
        const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? p.isActive : !p.isActive)
        const matchStock = filterStock === 'ALL' || (filterStock === 'LOW' ? (p.inventoryItem?.availableQuantity || 0) <= 10 : (p.inventoryItem?.availableQuantity || 0) > 10)
        return matchSearch && matchCat && matchStatus && matchStock
    })

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const exportToCSV = () => {
        const headers = ['SKU', 'Tên sản phẩm', 'Danh mục', 'Giá bán (VND)', 'Kho khả dụng', 'Đơn vị tính', 'Giá Sỉ (VND)', 'SL Kích hoạt sỉ', 'Trạng thái']
        const rows = filteredProducts.map(p => [
            p.sku,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${p.category?.name || 'Khác'}"`,
            p.price,
            p.inventoryItem?.availableQuantity || 0,
            p.unit || 'Cái',
            p.wholesalePrice || '',
            p.minWholesaleQty || '',
            p.isActive ? 'Đang bán' : 'Ngưng bán'
        ])

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `bao-gia-vat-lieu-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    return {
        products, categories, loading, 
        searchQuery, setSearchQuery, 
        filterCategory, setFilterCategory, 
        filterStatus, setFilterStatus, 
        filterStock, setFilterStock, 
        currentPage, setCurrentPage, itemsPerPage,
        viewMode, setViewMode,
        editingId, setEditingId, editData, setEditData,
        isCreating, setIsCreating, createData, setCreateData,
        isUploading,
        message, setMessage,
        isImporting, setIsImporting, importLog, isProcessingImport,
        handleEdit, handleSave, handleToggleActive, handleDelete, 
        handleImageEditUpload, handleFileUpload, handleCreate, 
        handleBulkImport, exportToCSV, formatCurrency,
        filteredProducts, paginatedProducts, totalPages
    }
}
