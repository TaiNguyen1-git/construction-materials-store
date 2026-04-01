import { X, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'

export default function ProductModal({
    isCreating,
    setIsCreating,
    createData,
    setCreateData,
    categories,
    handleCreate,
    handleFileUpload,
    isUploading
}: any) {
    if (!isCreating) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCreating(false)} />
            <div className="relative bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">Thêm sản phẩm mới</h2>
                    <button onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto max-h-[65vh] custom-scrollbar space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                        <div className="col-span-2 mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">Thông tin cơ bản</h3>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tên sản phẩm *</label>
                            <input
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="Nhập tên sản phẩm..."
                                value={createData.name}
                                onChange={e => setCreateData({ ...createData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Mã SKU *</label>
                            <input
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium font-mono"
                                placeholder="VD: GACH-001"
                                value={createData.sku}
                                onChange={e => setCreateData({ ...createData, sku: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Danh mục *</label>
                            <select
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                                value={createData.categoryId}
                                onChange={e => setCreateData({ ...createData, categoryId: e.target.value })}
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                                <option value="OTHER">-- Khác (Tự đề xuất...) --</option>
                            </select>
                        </div>
                        {createData.categoryId === 'OTHER' && (
                            <div className="space-y-2 col-span-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-bold text-blue-600 uppercase">Tên danh mục đề xuất *</label>
                                <input
                                    className="w-full px-4 py-3 bg-blue-50 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-blue-900 placeholder:text-blue-300"
                                    placeholder="Nhập tên ngành hàng bạn muốn bổ sung..."
                                    value={createData.suggestedCategory}
                                    onChange={e => setCreateData({ ...createData, suggestedCategory: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Pricing & Stock */}
                    <div className="grid grid-cols-2 gap-6 p-6 rounded-[1.5rem] bg-blue-50/50 border border-blue-100/50">
                        <div className="col-span-2 mb-2">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">Định giá & Tồn kho</h3>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Đơn vị tính *</label>
                            <select
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                                value={createData.unit}
                                onChange={e => setCreateData({ ...createData, unit: e.target.value })}
                            >
                                <option value="Viên">Viên</option>
                                <option value="Khối">Khối (m3)</option>
                                <option value="Bao">Bao</option>
                                <option value="Tấn">Tấn</option>
                                <option value="Kg">Kg</option>
                                <option value="Lô">Lô / Pallet</option>
                                <option value="Cái">Cái / Chiếc</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Kho khả dụng</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                value={createData.availableQuantity}
                                onChange={e => setCreateData({ ...createData, availableQuantity: Number(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Giá bán lẻ (VNĐ) *</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                value={createData.price}
                                onChange={e => setCreateData({ ...createData, price: Number(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded-md w-max mb-1 inline-block">Mới</label>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Giá Sỉ Bảng B2B (VNĐ)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-white rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700"
                                placeholder="Để trống nếu không có..."
                                value={createData.wholesalePrice || ''}
                                onChange={e => setCreateData({ ...createData, wholesalePrice: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Số lượng tối thiểu TỰ ĐỘNG KÍCH HOẠT giá sỉ</label>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-400">Mua từ</span>
                                <input
                                    type="number"
                                    className="w-32 px-4 py-2 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-center"
                                    value={createData.minWholesaleQty || 10}
                                    onChange={e => setCreateData({ ...createData, minWholesaleQty: Number(e.target.value) })}
                                />
                                <span className="font-bold text-slate-400">{createData.unit} trở lên</span>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="grid grid-cols-2 gap-6 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                        <div className="col-span-2 mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">Hình ảnh & Mô tả</h3>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">URL Hình ảnh</label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        placeholder="Dán link ảnh hoặc tải lên..."
                                        value={createData.imageUrl}
                                        onChange={e => setCreateData({ ...createData, imageUrl: e.target.value })}
                                    />
                                    <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Upload className="w-5 h-5 text-slate-400" />}
                                    </label>
                                </div>
                                {createData.imageUrl && (
                                    <div className="w-12 h-12 rounded-lg relative overflow-hidden bg-slate-100 border border-slate-200">
                                        <Image src={createData.imageUrl} alt="Preview" fill className="object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Mô tả chi tiết</label>
                            <textarea
                                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium min-h-[100px]"
                                placeholder="Nhập mô tả sản phẩm..."
                                value={createData.description}
                                onChange={e => setCreateData({ ...createData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={() => setIsCreating(false)}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        Tạo sản phẩm
                    </button>
                </div>
            </div>
        </div>
    )
}
