import { Package, CheckCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import { FormData } from '../types'

interface Step3ConfirmationProps {
    formData: FormData
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Step3Confirmation({ formData, handleInputChange, handleFileChange }: Step3ConfirmationProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Xác nhận ngành hàng</h3>
                        <p className="text-xs text-slate-500 font-medium">Chọn các loại vật tư bạn đang cung cấp</p>
                    </div>
                </div>

                <textarea
                    name="supplyingCategories"
                    value={formData.supplyingCategories}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ví dụ: Thép xây dựng, Xi măng, Gạch ốp lát, Thiết bị vệ sinh..."
                    className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all resize-none"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dữ liệu tài khoản</p>
                    <p className="font-bold text-slate-900 truncate">{formData.email}</p>
                    <p className="text-xs text-slate-500 mt-1">Đại diện: {formData.fullName}</p>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thông tin pháp lý</p>
                    <p className="font-bold text-slate-900 truncate">{formData.companyName}</p>
                    <p className="text-xs text-slate-500 mt-1">MST: {formData.taxId}</p>
                </div>
            </div>

            {/* Upload GPKD */}
            <div className="p-1 text-center">
                <input
                    type="file"
                    name="businessLicense"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="block cursor-pointer p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                >
                    {formData.businessLicense ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="font-black text-slate-900">{formData.businessLicense.name}</p>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Nhấp để thay đổi file</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 uppercase tracking-tight">Upload Giấy phép kinh doanh</p>
                                <p className="text-xs text-slate-400 mt-1 italic">PDF, JPG, PNG (Tối đa 5MB) - Không bắt buộc</p>
                            </div>
                        </div>
                    )}
                </label>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-4 cursor-pointer p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                    required
                />
                <span className="text-xs text-slate-500 font-medium leading-relaxed">
                    Tôi cam kết các thông tin cung cấp là hoàn toàn chính xác và đồng ý với <Link href="/supplier/terms" target="_blank" className="font-bold text-blue-600 hover:underline">Điều khoản đối tác NCC</Link> của SmartBuild.
                </span>
            </label>
        </div>
    )
}
