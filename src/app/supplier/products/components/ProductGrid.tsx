import { Edit2, Save, Trash2, CheckCircle2, AlertCircle, Package, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'

export default function ProductGrid({
    paginatedProducts,
    editingId,
    setEditingId,
    editData,
    setEditData,
    handleToggleActive,
    handleEdit,
    handleSave,
    handleDelete,
    handleImageEditUpload,
    isUploading,
    formatCurrency
}: any) {
    if (paginatedProducts.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product: any) => {
                const isEditing = editingId === product.id;
                const stock = product.inventoryItem?.availableQuantity || 0;

                return (
                    <div key={product.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative">
                        {/* Action Overlay (visible on hover) */}
                        {!isEditing && (
                            <div className="absolute inset-x-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex justify-end gap-2 bg-gradient-to-b from-black/50 to-transparent">
                                <button
                                    onClick={() => handleToggleActive(product.id, product.isActive)}
                                    className="w-10 h-10 bg-white/90 backdrop-blur text-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-blue-600 transition-all shadow-lg"
                                    title="Bật/Tắt"
                                >
                                    {product.isActive ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                                </button>
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="w-10 h-10 bg-white/90 backdrop-blur text-slate-700 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                    title="Sửa nhanh"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id, product.name)}
                                    className="w-10 h-10 bg-white/90 backdrop-blur text-slate-700 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all shadow-lg"
                                    title="Xóa vĩnh viễn"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Image Area */}
                        <div className="aspect-[4/3] w-full relative bg-slate-50 overflow-hidden">
                            {(isEditing ? editData.image : product.images?.[0]) ? (
                                <Image
                                    src={isEditing ? editData.image : product.images![0]}
                                    alt={product.name}
                                    fill
                                    className={`object-cover transition-transform duration-700 ${!isEditing ? 'group-hover:scale-105' : ''} ${!product.isActive ? 'grayscale opacity-70' : ''}`}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Package className="w-16 h-16" />
                                </div>
                            )}

                            {/* Action Overlay for Editing Image */}
                            {isEditing && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in transition-all z-20">
                                    <input type="file" id={`upload-${product.id}`} className="hidden" accept="image/*" onChange={handleImageEditUpload} disabled={isUploading} />
                                    <label htmlFor={`upload-${product.id}`} className={`cursor-pointer bg-white/95 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 hover:bg-white hover:scale-105 transition-all shadow-2xl ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                                        {isUploading ? 'ĐANG TẢI...' : 'THAY ĐỔI ẢNH KÈM'}
                                    </label>
                                </div>
                            )}

                            {/* Stock Badge Overlay */}
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-white/20 z-30">
                                <div className={`w-2 h-2 rounded-full ${stock > 10 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${stock > 10 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="w-16 bg-transparent outline-none border-b border-slate-300 text-center text-slate-900"
                                            value={editData.availableQuantity}
                                            onChange={(e) => setEditData({ ...editData, availableQuantity: Number(e.target.value) })}
                                        />
                                    ) : (
                                        `${stock} có sẵn`
                                    )}
                                </span>
                            </div>
                            {!product.isActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
                                    <span className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-xl rotate-12">Đã ngưng bán</span>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-6 flex flex-col flex-1 bg-white relative z-10">
                            <div className="flex items-center justify-between mb-3 gap-2">
                                <span className="px-2.5 py-1 bg-slate-100/80 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest truncate max-w-[140px] inline-block border border-slate-200/50">
                                    {product.category?.name || 'Khác'}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] font-black bg-slate-100/80 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-slate-200/50">SKU</span>
                                    <span className="text-[10px] font-mono font-bold text-slate-500">{product.sku}</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 flex-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {product.name}
                            </h3>

                            <div className="flex items-end justify-between mt-auto">
                                <div className="w-full">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Giá Sỉ B2B</p>
                                    {isEditing ? (
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">đ</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-blue-600 rounded-xl outline-none shadow-lg shadow-blue-100 font-bold text-slate-900 text-lg"
                                                value={editData.price}
                                                onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xl font-black text-slate-900">{formatCurrency(product.price)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Action row when strictly editing */}
                            {isEditing && (
                                <div className="mt-5 flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex-[1] py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => handleSave(product.id)}
                                        className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Lưu Lại
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
