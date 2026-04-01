import { User, Phone, Building2, FileText, MapPin } from 'lucide-react'
import { FormData } from '../types'

interface Step2CompanyInfoProps {
    formData: FormData
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

export default function Step2CompanyInfo({ formData, handleInputChange }: Step2CompanyInfoProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Họ và tên người đại diện <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="09xx xxx xxx"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Tên doanh nghiệp / Kho hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="CÔNG TY TNHH VẬT LIỆU XÂY DỰNG ABC"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                        required
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Mã số thuế <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleInputChange}
                            placeholder="0123456789"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Thành phố hoạt động chính
                    </label>
                    <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none appearance-none"
                    >
                        <option value="">Chọn khu vực</option>
                        <option value="TP.HCM">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Đồng Nai">Đồng Nai</option>
                        <option value="Long An">Long An</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Địa chỉ chi tiết văn phòng / kho
                </label>
                <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleInputChange}
                        placeholder="Số nhà, Tên đường, Phường/Xã..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    )
}
