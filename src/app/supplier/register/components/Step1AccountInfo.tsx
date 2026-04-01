import { Mail, Lock } from 'lucide-react'
import { FormData } from '../types'

interface Step1AccountInfoProps {
    formData: FormData
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

export default function Step1AccountInfo({ formData, handleInputChange }: Step1AccountInfoProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-1 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Địa chỉ Email Doanh nghiệp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="supplier@company.com"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                            Mật khẩu truy cập <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Tối thiểu 6 ký tự"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                            Xác nhận mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Nhập lại mật khẩu"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
