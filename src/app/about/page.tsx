'use client'

import Link from 'next/link'
import { Package, Truck, Users, Star, Shield, Clock, Award } from 'lucide-react'
import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">SmartBuild Materials</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Đối tác tin cậy trong lĩnh vực cung cấp vật liệu xây dựng chất lượng cao. 
            Chúng tôi cam kết mang đến những sản phẩm tốt nhất để hiện thực hóa công trình của bạn.
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Câu chuyện của chúng tôi</h3>
              <div className="space-y-4 text-gray-600">
                <p>
                  Được thành lập từ năm 2015, SmartBuild Materials bắt đầu từ một cửa hàng nhỏ với mong muốn 
                  cung cấp vật liệu xây dựng chất lượng cao với giá cả hợp lý cho các công trình tại Việt Nam.
                </p>
                <p>
                  Sau 8 năm phát triển, chúng tôi đã trở thành một trong những nhà cung cấp vật liệu xây dựng 
                  hàng đầu, phục vụ hơn 1000+ dự án từ nhà ở cá nhân đến các công trình lớn.
                </p>
                <p>
                  Với đội ngũ chuyên nghiệp và hệ thống kho bãi hiện đại, chúng tôi cam kết mang đến 
                  trải nghiệm mua sắm tốt nhất cho khách hàng.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/images/about-hero.jpg" 
                alt="SmartBuild warehouse"
                className="rounded-lg shadow-lg w-full"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%236b7280'%3ESmartBuild Warehouse%3C/text%3E%3C/svg%3E"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những giá trị định hướng mọi hoạt động của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Chất lượng</h4>
              <p className="text-gray-600">
                Cam kết cung cấp những sản phẩm đạt tiêu chuẩn quốc tế, 
                được kiểm định chất lượng nghiêm ngặt.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Uy tín</h4>
              <p className="text-gray-600">
                Giao hàng đúng hẹn, đúng chất lượng và hỗ trợ khách hàng 
                24/7 trong suốt quá trình hợp tác.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Sáng tạo</h4>
              <p className="text-gray-600">
                Không ngừng cải tiến quy trình, ứng dụng công nghệ để 
                mang đến trải nghiệm tốt nhất cho khách hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Con số ấn tượng</h3>
            <p className="text-gray-600">Minh chứng cho sự tin tưởng của khách hàng</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-gray-600">Dự án hoàn thành</div>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Khách hàng tin tưởng</div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">98%</div>
              <div className="text-gray-600">Giao hàng đúng hẹn</div>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">4.9/5</div>
              <div className="text-gray-600">Đánh giá khách hàng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Đội ngũ lãnh đạo</h3>
            <p className="text-gray-600">Những người dẫn dắt SmartBuild Materials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Nguyễn Văn An</h4>
              <p className="text-blue-600 mb-3">Tổng Giám Đốc</p>
              <p className="text-gray-600 text-sm">
                Hơn 15 năm kinh nghiệm trong lĩnh vực vật liệu xây dựng và quản lý dự án lớn.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Trần Thị Bình</h4>
              <p className="text-blue-600 mb-3">Giám Đốc Kinh Doanh</p>
              <p className="text-gray-600 text-sm">
                Chuyên gia về phát triển thị trường và xây dựng mối quan hệ khách hàng.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Lê Minh Cường</h4>
              <p className="text-blue-600 mb-3">Giám Đốc Kỹ Thuật</p>
              <p className="text-gray-600 text-sm">
                Kỹ sư xây dựng với chuyên môn sâu về chất lượng và tiêu chuẩn vật liệu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu dự án của bạn?</h3>
          <p className="text-xl text-blue-100 mb-8">
            Liên hệ với chúng tôi ngay hôm nay để được tư vấn miễn phí
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Liên hệ ngay
            </Link>
            <Link href="/products" className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}