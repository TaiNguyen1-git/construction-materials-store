# 📋 SmartBuild AI - Demo Scripts Chi Tiết

Tài liệu này chứa các script demo chi tiết, từng bước một, bạn có thể follow theo để demo hệ thống.

---

## 🎬 Demo Script 1: Customer Journey - Mua Hàng Online

**Thời lượng ước tính:** 10-15 phút  
**Mục tiêu:** Demo trải nghiệm khách hàng từ đầu đến cuối

### Scene 1.1: Trang Chủ (2 phút)

```
1. Mở browser → http://localhost:3000
2. ĐIỂM NHẤN: 
   - Giới thiệu banner slider (được quản lý từ Admin)
   - Điểm ra phần "Sản phẩm nổi bật"
   - Chỉ vào icon Chatbot ở góc phải
   - Thanh tìm kiếm thông minh
```

### Scene 1.2: Tìm Kiếm Sản Phẩm (2 phút)

```
1. Click vào thanh tìm kiếm
2. Gõ: "xi măng" → Xem gợi ý tự động xuất hiện
3. Enter để xem kết quả
4. Demo filter:
   - Chọn Category: "Vật liệu cơ bản"
   - Sắp xếp theo: Giá thấp → cao
   - Kéo thanh trượt giá
5. ĐIỂM NHẤN: Tìm kiếm hỗ trợ tiếng Việt có dấu/không dấu
```

### Scene 1.3: Chi Tiết Sản Phẩm (2 phút)

```
1. Click vào sản phẩm "Xi măng Hà Tiên PCB40"
2. ĐIỂM NHẤN:
   - Gallery ảnh sản phẩm
   - Mô tả chi tiết
   - Xem phần đánh giá sao (nếu có)
3. Chọn số lượng: 10
4. CHÚ Ý: Nếu nhập số lượng >= minWholesaleQty → hiện giá sỉ
5. Click "Thêm vào giỏ hàng"
6. Xem toast notification xác nhận
```

### Scene 1.4: Giỏ Hàng (2 phút)

```
1. Click icon giỏ hàng (header)
2. Xem danh sách sản phẩm
3. Demo:
   - Tăng số lượng: + button
   - Giảm số lượng: - button
   - Xóa sản phẩm: X button
4. ĐIỂM NHẤN: Tổng tiền cập nhật realtime
5. Click "Tiến hành thanh toán"
```

### Scene 1.5: Checkout (3 phút)

```
1. Điền thông tin (hoặc đã có sẵn nếu đã login):
   - Họ tên: Nguyễn Văn Demo
   - Số điện thoại: 0912345678
   - Email: demo@test.com
   - Địa chỉ: 123 Nguyễn Du, Q.1, TP.HCM

2. Chọn phương thức thanh toán:
   OPTION A - QR Code:
   - Click "Chuyển khoản ngân hàng"
   - Xem QR Code VietQR được generate
   
   OPTION B - COD:
   - Click "Thanh toán khi nhận hàng"

3. Chọn hình thức đặt cọc (nếu áp dụng):
   - 30% / 40% / 50% / Thanh toán toàn bộ

4. Click "Xác nhận đặt hàng"
5. ĐIỂM NHẤN: Email xác nhận tự động gửi
```

### Scene 1.6: Xác Nhận Đơn Hàng (1 phút)

```
1. Xem trang xác nhận đơn hàng thành công
2. Copy mã đơn hàng: ORD-xxxxxx
3. Click "Theo dõi đơn hàng"
4. ĐIỂM NHẤN:
   - Timeline tracking trực quan
   - Có thể theo dõi không cần đăng nhập
```

---

## 🎬 Demo Script 2: Admin Dashboard

**Thời lượng ước tính:** 15-20 phút  
**Mục tiêu:** Demo các tính năng quản trị

### Scene 2.1: Đăng Nhập Admin (1 phút)

```
1. Mở http://localhost:3000/login
2. Đăng nhập:
   - Email: admin@smartbuild.vn
   - Password: Admin@123
3. Click "Đăng nhập"
4. Tự động redirect đến /admin
```

### Scene 2.2: Tổng Quan Dashboard (3 phút)

```
1. ĐIỂM RA các KPI cards:
   - Tổng doanh thu
   - Số đơn hàng
   - Số khách hàng
   - Số sản phẩm

2. CHARTS:
   - Biểu đồ doanh thu theo thời gian
   - Biểu đồ sản phẩm bán chạy
   - Biểu đồ tình trạng đơn hàng

3. ALERTS:
   - Đơn hàng mới cần xử lý
   - Cảnh báo tồn kho thấp
   - Thông báo hệ thống
```

### Scene 2.3: Xử Lý Đơn Hàng Mới (3 phút)

```
1. Click "Quản lý đơn hàng" (sidebar)
2. Lọc: Trạng thái = "Chờ xác nhận"
3. Click vào đơn hàng đầu tiên
4. XEM chi tiết:
   - Thông tin khách hàng
   - Sản phẩm đã đặt
   - Phương thức thanh toán
   - Địa chỉ giao hàng

5. Click "Xác nhận đơn hàng" 
6. Xem trạng thái chuyển: PENDING → CONFIRMED
7. ĐIỂM NHẤN: Email tự động gửi cho khách
```

### Scene 2.4: Quản Lý Sản Phẩm (4 phút)

```
1. Click "Sản phẩm" (sidebar)
2. XEM danh sách sản phẩm

3. THÊM SẢN PHẨM MỚI:
   - Click "+ Thêm sản phẩm"
   - Điền thông tin:
     * Tên: Gạch Block 20x20
     * SKU: GB-2020
     * Danh mục: Gạch
     * Giá bán: 5000
     * Giá sỉ: 4500
     * Số lượng sỉ tối thiểu: 100
   - Upload ảnh sản phẩm
   - Click "Lưu"

4. SỬA SẢN PHẨM:
   - Click vào sản phẩm bất kỳ
   - Sửa giá hoặc mô tả
   - Click "Cập nhật"

5. ĐIỂM NHẤN:
   - Multi-image upload
   - Quản lý giá lẻ/sỉ
```

### Scene 2.5: Quản Lý Kho (3 phút)

```
1. Click "Quản lý kho" (sidebar)
2. XEM tổng quan:
   - Số sản phẩm tồn kho thấp
   - Biểu đồ biến động kho

3. GHI NHẬN NHẬP KHO:
   - Click "+ Ghi nhận biến động"
   - Chọn sản phẩm: Xi măng Hà Tiên
   - Loại: Nhập kho
   - Số lượng: 100
   - Lý do: Nhập từ NCC ABC
   - Click "Xác nhận"

4. XEM lịch sử biến động
5. ĐIỂM NHẤN: Cảnh báo email khi tồn kho thấp
```

### Scene 2.6: Quản Lý Banner (2 phút)

```
1. Click "Quản lý Banner" (sidebar)
2. XEM danh sách banner hiện tại
3. THÊM BANNER MỚI:
   - Click "+ Thêm banner"
   - Upload ảnh
   - Tiêu đề: "Khuyến mãi tháng 1"
   - Link: /products?category=promotion
   - Click "Lưu"

4. TOGGLE trạng thái Active/Inactive
5. Quay lại trang chủ → Xem banner mới
```

---

## 🎬 Demo Script 3: AI Chatbot

**Thời lượng ước tính:** 5-8 phút  
**Mục tiêu:** Demo khả năng AI

### Scene 3.1: Mở Chatbot

```
1. Ở bất kỳ trang nào, click icon chat (góc phải dưới)
2. Chatbot panel mở ra
3. GIỚI THIỆU: "Đây là trợ lý AI sử dụng Google Gemini với RAG"
```

### Scene 3.2: Demo Câu Hỏi về Sản Phẩm

```
GỬI: "Cho tôi xem các loại xi măng"
CHỜ: Bot trả về danh sách xi măng với giá và link

GỬI: "Loại nào rẻ nhất?"
CHỜ: Bot so sánh và đề xuất
```

### Scene 3.3: Demo Tính Toán Vật Liệu

```
GỬI: "Tôi muốn xây tường diện tích 30m2, cần bao nhiêu gạch?"
CHỜ: Bot tính toán:
- Số lượng gạch cần
- Xi măng dự tính
- Cát dự tính
- Tổng chi phí ước tính
```

### Scene 3.4: Demo Tư Vấn Kỹ Thuật

```
GỬI: "Nên dùng xi măng gì để đổ móng nhà?"
CHỜ: Bot tư vấn loại xi măng phù hợp với giải thích

GỬI: "Khác gì so với xi măng làm tường?"
CHỜ: Bot giải thích sự khác biệt
```

### Scene 3.5: Demo Hỗ Trợ Đơn Hàng

```
GỬI: "Kiểm tra đơn hàng ORD-12345"
CHỜ: Bot trả về trạng thái đơn hàng (nếu có)

GỬI: "Cửa hàng mở cửa lúc mấy giờ?"
CHỜ: Bot trả lời thông tin liên hệ
```

---

## 🎬 Demo Script 4: Contractor Portal

**Thời lượng ước tính:** 10-12 phút  
**Mục tiêu:** Demo cổng nhà thầu

### Scene 4.1: Đăng Nhập Nhà Thầu

```
1. Logout nếu đang login
2. Vào http://localhost:3000/contractor/login
3. Đăng nhập:
   - Email: contractor@test.com
   - Password: Contractor@123
4. Redirect đến Contractor Dashboard
```

### Scene 4.2: Dashboard Nhà Thầu

```
1. ĐIỂM RA:
   - Trust Score (điểm uy tín)
   - Badge xác minh (nếu đã KYC)
   - Tổng đơn hàng
   - Dự án đang thực hiện
   - Hạn mức tín dụng
```

### Scene 4.3: Tạo Báo Giá Nhanh

```
1. Click "Đặt hàng nhanh" (sidebar)
2. Tìm sản phẩm: "xi măng"
3. Thêm vào đơn:
   - Xi măng Hà Tiên: 500 bao
   - Gạch xây: 5000 viên
4. ĐIỂM NHẤN: Giá sỉ tự động áp dụng
5. Click "Tạo báo giá PDF"
6. Download và xem file PDF
```

### Scene 4.4: Quản Lý Dự Án

```
1. Click "Dự án" (sidebar)
2. XEM danh sách dự án

3. TẠO DỰ ÁN MỚI:
   - Click "+ Thêm dự án"
   - Tên: Công trình nhà ở A
   - Địa điểm: Quận 7, TP.HCM
   - Ngân sách: 500.000.000 VND
   - Thời gian: 6 tháng
   - Click "Tạo"

4. Vào chi tiết dự án
5. Sử dụng Material Calculator:
   - Nhập diện tích sàn: 150m2
   - Nhập diện tích tường: 200m2
   - Click "Tính toán"
   - Xem kết quả vật liệu cần thiết
```

---

## 🎬 Demo Script 5: AI Inventory Forecasting

**Thời lượng ước tính:** 5-7 phút  
**Mục tiêu:** Demo dự báo tồn kho AI

### Scene 5.1: Xem Dự Báo

```
1. Đăng nhập Admin
2. Vào "Quản lý kho" → Tab "Dự báo AI"
3. ĐIỂM RA:
   - Biểu đồ dự báo nhu cầu
   - Confidence Score cho mỗi dự báo
   - Các yếu tố ảnh hưởng: trend, seasonality
```

### Scene 5.2: Đề Xuất Đặt Hàng

```
1. Xem sản phẩm có dự báo cao
2. ĐIỂM RA:
   - Số lượng đề xuất đặt
   - Thời điểm nên đặt
   - Dự báo 7/30/90 ngày
3. Click "Tạo PO" để tạo Purchase Order
```

---

## 🎬 Demo Script 6: HR & Payroll

**Thời lượng ước tính:** 8-10 phút  
**Mục tiêu:** Demo quản lý nhân sự

### Scene 6.1: Dashboard HR

```
1. Đăng nhập Admin
2. Click "Quản lý nhân sự" (sidebar)
3. XEM:
   - Danh sách nhân viên
   - Bảng chấm công tháng
   - Tổng giờ làm việc
```

### Scene 6.2: Chấm Công

```
1. Chọn nhân viên
2. Ghi nhận:
   - Check-in: 8:00 AM
   - Check-out: 5:30 PM
3. Xem tự động tính:
   - Giờ làm việc: 8.5h
   - Làm thêm giờ: 0.5h
```

### Scene 6.3: Giao Việc

```
1. Click "Giao việc" (sidebar)
2. Tạo task mới:
   - Tiêu đề: Kiểm kê kho T1/2026
   - Mô tả: Kiểm đếm số lượng tất cả sản phẩm
   - Gán cho: Nhân viên A
   - Deadline: 15/01/2026
   - Priority: Cao
3. Click "Tạo"
4. Xem task trên Kanban board
```

### Scene 6.4: Tính Lương

```
1. Click "Bảng lương" (sidebar)
2. Chọn kỳ: Tháng 12/2025
3. XEM bảng lương tự động:
   - Lương cơ bản
   - Phụ cấp
   - Làm thêm giờ
   - Khấu trừ
   - Lương NET
4. Thêm thưởng/phạt
5. Click "Approve"
6. Export payslip PDF
```

---

## 🎬 Demo Script 7: Loyalty Program

**Thời lượng ước tính:** 5 phút  
**Mục tiêu:** Demo chương trình khách hàng thân thiết

### Scene 7.1: Xem Loyalty Dashboard

```
1. Đăng nhập với tài khoản Customer
2. Click "Thành viên thân thiết" (menu account)
3. XEM:
   - Tier hiện tại (Bronze/Silver/Gold/Platinum/Diamond)
   - Điểm tích lũy
   - Progress bar đến tier tiếp theo
   - Ưu đãi của tier
```

### Scene 7.2: Quy Đổi Điểm

```
1. Xem catalog phần thưởng
2. Chọn phần thưởng: "Voucher giảm 50k"
3. Xem điểm cần: 500 điểm
4. Click "Đổi điểm"
5. Nhận mã voucher
```

---

## 📌 Tips Demo Hiệu Quả

### ✅ Chuẩn Bị
- [ ] Clear browser cache
- [ ] Seed data trước demo
- [ ] Test email gửi được
- [ ] Test chatbot hoạt động
- [ ] Chuẩn bị tài khoản sẵn

### ✅ Trong Khi Demo
- Tạm dừng sau mỗi action quan trọng
- Giải thích điểm nhấn
- Cho audience hỏi
- Không vội vàng

### ✅ Xử Lý Lỗi
- Nếu chatbot chậm: "AI đang xử lý câu hỏi phức tạp..."
- Nếu email không gửi: "Trong môi trường dev, email được log thay vì gửi thực"
- Nếu dữ liệu trống: Chạy `npm run db:seed`

---

## 📞 Demo Support

Liên hệ khi cần hỗ trợ: support@smartbuild.vn
