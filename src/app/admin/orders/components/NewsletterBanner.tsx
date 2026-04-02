import React from 'react'

const NewsletterBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg overflow-hidden relative mb-6">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Chiến dịch Kích cầu Email
          </h2>
          <p className="text-blue-100 max-w-2xl text-sm">
            Bạn đang có <span className="font-bold text-white">450</span> khách đăng ký nhận báo giá. 
            Hãy gửi "Bảng giá vật liệu tháng 04" để tăng tỷ lệ chuyển đổi đơn hàng từ khách vãng lai!
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-50 transition-all">
            Quản lý danh sách
          </button>
          <button className="px-4 py-2 bg-blue-500 bg-opacity-30 border border-blue-400 text-white rounded-lg font-bold text-sm hover:bg-opacity-40 transition-all">
            Tạo chiến dịch mới
          </button>
        </div>
      </div>
      {/* Decorative background circle */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500 rounded-full bg-opacity-20"></div>
    </div>
  )
}

export default NewsletterBanner
