import { Edit2, Save, Trash2, X, Package, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'

export default function ProductList({
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
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sản phẩm</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Danh mục</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Giá Sỉ B2B</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tồn kho</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Trạng thái</th>
                            <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {paginatedProducts.map((product: any) => {
                            const isEditing = editingId === product.id;
                            const stock = product.inventoryItem?.availableQuantity || 0;

                            return (
                                <tr key={product.id} className={`group transition-colors duration-200 ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 relative rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0">
                                                {(isEditing ? editData.image : product.images?.[0]) ? (
                                                    <Image
                                                        src={isEditing ? editData.image : product.images![0]}
                                                        alt={product.name}
                                                        fill
                                                        className={`object-cover ${!product.isActive && 'grayscale opacity-70'}`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10 cursor-pointer">
                                                        <input type="file" id={`upload-list-${product.id}`} className="hidden" accept="image/*" onChange={handleImageEditUpload} disabled={isUploading} />
                                                        <label htmlFor={`upload-list-${product.id}`} className="cursor-pointer">
                                                            {isUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 line-clamp-1 break-all max-w-[200px] hover:max-w-none transition-all">{product.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-widest">SKU</span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-500">{product.sku}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg whitespace-nowrap">
                                            {product.category?.name || 'Khác'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">đ</span>
                                                <input
                                                    type="number"
                                                    className="w-32 pl-8 pr-3 py-1.5 bg-white border-2 border-blue-600 rounded-lg outline-none shadow-sm font-bold text-slate-900 text-sm"
                                                    value={editData.price}
                                                    onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                                                />
                                            </div>
                                        ) : (
                                            <span className="font-bold text-slate-900">{formatCurrency(product.price)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-24 px-3 py-1.5 bg-white border-2 border-blue-600 rounded-lg outline-none shadow-sm font-bold text-slate-900 text-sm text-center"
                                                value={editData.availableQuantity}
                                                onChange={(e) => setEditData({ ...editData, availableQuantity: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${stock > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {stock} CÓ SẴN
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => !isEditing && handleToggleActive(product.id, product.isActive)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${product.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'} ${isEditing && 'opacity-50 pointer-events-none'}`}
                                        >
                                            {product.isActive ? 'Đang bán' : 'Tạm ngưng'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all font-bold text-[10px] uppercase tracking-widest"
                                                        title="Hủy"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSave(product.id)}
                                                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5"
                                                        title="Lưu"
                                                    >
                                                        <Save className="w-4 h-4" /> Lưu
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                                        title="Sửa nhanh"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-all"
                                                        title="Xóa vĩnh viễn"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
