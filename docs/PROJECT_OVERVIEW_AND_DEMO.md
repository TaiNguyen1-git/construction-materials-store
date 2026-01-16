# 🏗️ SmartBuild AI - Tổng Quan Dự Án & Hướng Dẫn Demo

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Các Vai Trò Người Dùng](#3-các-vai-trò-người-dùng)
4. [Hướng Dẫn Demo Chi Tiết](#4-hướng-dẫn-demo-chi-tiết)
   - [Demo 1: Luồng Mua Hàng (Customer)](#demo-1-luồng-mua-hàng-customer-journey)
   - [Demo 2: Quản Lý Admin](#demo-2-quản-lý-admin-dashboard)
   - [Demo 3: AI Chatbot](#demo-3-ai-chatbot--trợ-lý-thông-minh)
   - [Demo 4: Quản Lý Nhà Thầu](#demo-4-contractor-management)
   - [Demo 5: Quản Lý Tồn Kho & Dự Báo](#demo-5-inventory-management--ai-forecasting)
   - [Demo 6: Quản Lý Nhân Sự & Lương](#demo-6-hr--payroll-management)
   - [Demo 7: Báo Giá & Dự Án](#demo-7-quote-request--project-management)
   - [Demo 8: Loyalty Program](#demo-8-chương-trình-khách-hàng-thân-thiết)

---

## 1. Tổng Quan Dự Án

### 🎯 Mục Tiêu
**SmartBuild AI** là nền tảng thương mại điện tử vật liệu xây dựng thông minh, tích hợp AI để hỗ trợ các doanh nghiệp vừa và nhỏ (SMEs) trong ngành vật liệu xây dựng tại Việt Nam.

### 🌟 Điểm Nổi Bật

| Tính Năng | Mô Tả |
|-----------|-------|
| 🛒 **E-Commerce Platform** | Mua sắm online với giỏ hàng, thanh toán, theo dõi đơn hàng |
| 🤖 **AI Chatbot (RAG)** | Trợ lý ảo thông minh sử dụng Google Gemini |
| 📊 **Analytics Dashboard** | Báo cáo doanh thu, dự báo nhu cầu, phân tích xu hướng |
| 👷 **Contractor Portal** | Cổng thông tin dành riêng cho nhà thầu |
| 💳 **Flexible Payment** | Thanh toán linh hoạt: QR Code, COD, đặt cọc |
| 📦 **Inventory Management** | Quản lý kho với dự báo AI và cảnh báo tự động |
| 👥 **HR & Payroll** | Quản lý nhân viên, chấm công, tính lương |
| 📋 **Quote System** | Hệ thống báo giá cho nhà thầu |

### 🛠️ Tech Stack

```
Frontend:    Next.js 15 + React 19 + TypeScript + Tailwind CSS
Backend:     Next.js API Routes
Database:    MongoDB + Prisma ORM
AI/ML:       Google Gemini (RAG), Vector Search
Email:       Nodemailer
Charts:      Recharts
State:       Zustand
Testing:     Vitest + Playwright
```

---

## 2. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Customer Web   │   Admin Panel    │   Contractor Portal       │
│   (Public)       │   (Protected)    │   (Protected)             │
└────────┬─────────┴────────┬─────────┴───────────┬───────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER                          │
│  /api/auth    /api/products   /api/orders   /api/chatbot       │
│  /api/inventory   /api/payroll   /api/contractors   /api/ai    │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌───────────────┐  ┌───────────────────────┐
│   MongoDB       │  │  Google AI    │  │   External Services   │
│   (Prisma)      │  │  (Gemini)     │  │   (Email, Firebase)   │
└─────────────────┘  └───────────────┘  └───────────────────────┘
```

---

## 3. Các Vai Trò Người Dùng

| Vai Trò | Mô Tả | Quyền Hạn |
|---------|-------|-----------|
| **CUSTOMER** | Khách hàng thông thường | Mua hàng, xem đơn, viết đánh giá |
| **CONTRACTOR** | Nhà thầu xây dựng | Tất cả quyền Customer + báo giá, dự án, giá sỉ |
| **EMPLOYEE** | Nhân viên | Xử lý đơn hàng, quản lý kho, chấm công |
| **MANAGER** | Quản lý/Admin | Full quyền hệ thống |

### Tài Khoản Demo

```yaml
Admin/Manager:
  Email: admin@smartbuild.vn
  Password: Admin@123

Employee:
  Email: employee@smartbuild.vn
  Password: Employee@123

Customer:
  Email: customer@test.com
  Password: Customer@123

Contractor:
  Email: contractor@test.com
  Password: Contractor@123
```

---

## 4. Hướng Dẫn Demo Chi Tiết

---

### Demo 1: Luồng Mua Hàng (Customer Journey)

**Mục tiêu:** Showcase trải nghiệm mua hàng từ A-Z

#### 📍 Step 1: Truy Cập Trang Chủ
```
URL: http://localhost:3000
```

**Điểm nhấn demo:**
- ✅ Banner slider động (quản lý từ Admin)
- ✅ Danh mục sản phẩm nổi bật
- ✅ Thanh tìm kiếm với autocomplete
- ✅ Chatbot AI ở góc phải màn hình

#### 📍 Step 2: Tìm Kiếm & Duyệt Sản Phẩm
```
URL: http://localhost:3000/products
```

**Actions:**
1. Click vào thanh tìm kiếm
2. Gõ "xi măng" hoặc "gạch" → xem gợi ý tự động
3. Sử dụng bộ lọc: Danh mục, Giá, Sắp xếp
4. Click vào sản phẩm để xem chi tiết

**Điểm nhấn:**
- 🔍 Tìm kiếm thông minh với Vietnamese diacritics
- 📊 Lọc theo nhiều tiêu chí
- ⭐ Hiển thị đánh giá sản phẩm
- 🏷️ Giá sỉ cho số lượng lớn

#### 📍 Step 3: Xem Chi Tiết Sản Phẩm
```
URL: http://localhost:3000/products/[product-id]
```

**Actions:**
1. Xem thông tin sản phẩm, giá, mô tả
2. Xem đánh giá từ khách hàng
3. Chọn số lượng
4. Click "Thêm vào giỏ hàng"

**Điểm nhấn:**
- 💰 Hiển thị giá sỉ khi đủ số lượng
- 📷 Gallery ảnh sản phẩm
- ⭐ Rating và reviews
- 🛒 Thêm vào giỏ không cần đăng nhập

#### 📍 Step 4: Giỏ Hàng
```
URL: http://localhost:3000/cart
```

**Actions:**
1. Xem danh sách sản phẩm trong giỏ
2. Tăng/giảm số lượng
3. Xoá sản phẩm
4. Xem tổng tiền tự động cập nhật
5. Click "Tiến hành thanh toán"

**Điểm nhấn:**
- 💾 Giỏ hàng persistent (LocalStorage)
- 🔄 Real-time price updates
- 🎁 Gợi ý sản phẩm liên quan

#### 📍 Step 5: Checkout
```
URL: http://localhost:3000/checkout
```

**Actions:**
1. Điền thông tin giao hàng (hoặc sử dụng thông tin đã lưu nếu đã đăng nhập)
2. Chọn phương thức thanh toán:
   - 💳 Chuyển khoản (QR Code VietQR)
   - 💵 COD (Thanh toán khi nhận hàng)
3. Chọn hình thức đặt cọc (30%, 40%, 50%) hoặc thanh toán toàn bộ
4. Xác nhận đơn hàng

**Điểm nhấn:**
- 🆓 Hỗ trợ Guest Checkout (không cần đăng ký)
- 📱 QR Code thanh toán tự động generate
- 💳 Hình thức đặt cọc linh hoạt
- ✉️ Email xác nhận tự động

#### 📍 Step 6: Theo Dõi Đơn Hàng
```
URL: http://localhost:3000/order-tracking?orderNumber=ORD-xxx
```

**Actions:**
1. Nhập mã đơn hàng
2. Xem timeline trạng thái đơn hàng
3. Xem chi tiết sản phẩm đã đặt

**Điểm nhấn:**
- 📦 Timeline tracking trực quan
- 📧 Email notification mỗi khi có cập nhật

---

### Demo 2: Quản Lý Admin Dashboard

**Mục tiêu:** Showcase các tính năng quản trị hệ thống

#### 📍 Step 1: Đăng Nhập Admin
```
URL: http://localhost:3000/login
Email: admin@smartbuild.vn
Password: Admin@123
```

#### 📍 Step 2: Tổng Quan Dashboard
```
URL: http://localhost:3000/admin
```

**Điểm nhấn:**
- 📊 KPIs: Doanh thu, Đơn hàng, Khách hàng
- 📈 Biểu đồ doanh thu theo thời gian (Recharts)
- ⚠️ Cảnh báo tồn kho thấp
- 📋 Đơn hàng mới cần xử lý
- 🔔 Thông báo realtime

#### 📍 Step 3: Quản Lý Đơn Hàng
```
URL: http://localhost:3000/admin/orders
```

**Actions:**
1. Xem danh sách đơn hàng với filter
2. Click vào đơn để xem chi tiết
3. Xác nhận đơn hàng (PENDING → CONFIRMED)
4. Cập nhật trạng thái: Đang xử lý → Đang giao → Hoàn thành

**Điểm nhấn:**
- 📨 Tự động gửi email khi cập nhật
- 🔍 Lọc theo trạng thái, ngày, khách hàng
- 📄 Export báo cáo

#### 📍 Step 4: Quản Lý Sản Phẩm
```
URL: http://localhost:3000/admin/products
```

**Actions:**
1. Xem danh sách sản phẩm
2. Thêm sản phẩm mới
3. Sửa thông tin sản phẩm
4. Upload ảnh sản phẩm
5. Đặt sản phẩm Featured

**Điểm nhấn:**
- 📸 Multi-image upload
- 🏷️ Tag và categorization
- 💰 Quản lý giá lẻ/sỉ

#### 📍 Step 5: Quản Lý Banner
```
URL: http://localhost:3000/admin/banners
```

**Actions:**
1. Xem danh sách banner hiện tại
2. Thêm banner mới (upload ảnh, tiêu đề, link)
3. Sắp xếp thứ tự banner
4. Bật/tắt banner

**Điểm nhấn:**
- 🖼️ Upload ảnh banner
- 🔄 Drag & drop sắp xếp
- ✅ Toggle active/inactive

---

### Demo 3: AI Chatbot & Trợ Lý Thông Minh

**Mục tiêu:** Showcase khả năng AI của hệ thống

#### 📍 Step 1: Mở Chatbot
```
Action: Click icon chat ở góc phải màn hình (bất kỳ trang nào)
```

#### 📍 Step 2: Demo Các Tình Huống

**🔹 Hỏi về sản phẩm:**
```
User: "Cho tôi xem các loại xi măng giá dưới 100k"
Bot: [Trả về danh sách sản phẩm phù hợp với link]
```

**🔹 Tính toán vật liệu:**
```
User: "Tôi cần xây tường 50m², cần bao nhiêu gạch?"
Bot: [Tính toán và đưa ra số lượng gạch, xi măng, cát cần thiết]
```

**🔹 Tư vấn kỹ thuật:**
```
User: "Nên dùng xi măng gì để đổ sàn?"
Bot: [Tư vấn loại xi măng phù hợp với giải thích]
```

**🔹 Hỗ trợ đơn hàng:**
```
User: "Kiểm tra đơn hàng ORD-12345"
Bot: [Hiển thị trạng thái đơn hàng]
```

**Điểm nhấn:**
- 🧠 RAG (Retrieval-Augmented Generation) với dữ liệu sản phẩm thực
- 🔤 Hiểu tiếng Việt có dấu/không dấu
- 📊 Calculator tích hợp
- 💬 Context-aware conversations

---

### Demo 4: Contractor Management

**Mục tiêu:** Showcase cổng thông tin nhà thầu

#### 📍 Step 1: Đăng Ký Tài Khoản Nhà Thầu
```
URL: http://localhost:3000/contractor/register
```

**Actions:**
1. Điền thông tin cá nhân
2. Điền thông tin công ty (MST, địa chỉ)
3. Upload giấy phép kinh doanh
4. Chờ xác minh (KYC)

#### 📍 Step 2: Dashboard Nhà Thầu
```
URL: http://localhost:3000/contractor/dashboard
```

**Điểm nhấn:**
- 📊 Tổng quan đơn hàng, doanh số
- 🎖️ Trust Score và verification badge
- 📋 Danh sách dự án đang thực hiện

#### 📍 Step 3: Tạo Báo Giá Nhanh
```
URL: http://localhost:3000/contractor/quick-order
```

**Actions:**
1. Chọn sản phẩm từ catalog
2. Nhập số lượng (tự động áp dụng giá sỉ)
3. Tạo báo giá PDF chuyên nghiệp
4. Gửi cho khách hàng/chủ đầu tư

**Điểm nhấn:**
- 💰 Giá sỉ tự động cho nhà thầu
- 📄 PDF export chuyên nghiệp
- 💳 Credit limit management

#### 📍 Step 4: Quản Lý Dự Án
```
URL: http://localhost:3000/contractor/projects
```

**Actions:**
1. Tạo dự án mới
2. Sử dụng Material Calculator để tính vật liệu
3. Theo dõi tiến độ đặt hàng
4. Quản lý chi phí dự án

---

### Demo 5: Inventory Management & AI Forecasting

**Mục tiêu:** Showcase quản lý kho và dự báo AI

#### 📍 Step 1: Dashboard Tồn Kho
```
URL: http://localhost:3000/admin/inventory
```

**Điểm nhấn:**
- 📊 Overview tổng quan kho
- ⚠️ Cảnh báo tồn kho thấp (Low/Critical)
- 📈 Biểu đồ biến động tồn kho

#### 📍 Step 2: Ghi Nhận Biến Động Kho
```
Actions:
1. Chọn sản phẩm
2. Chọn loại biến động: Nhập kho / Xuất kho / Điều chỉnh
3. Nhập số lượng và lý do
4. Xác nhận
```

**Điểm nhấn:**
- 📝 Lịch sử biến động đầy đủ
- ✉️ Email cảnh báo khi tồn kho thấp
- 🔄 Tự động đề xuất mua hàng

#### 📍 Step 3: AI Demand Forecasting
```
URL: http://localhost:3000/admin/inventory → Tab "Dự Báo"
```

**Điểm nhấn:**
- 📈 Dự báo nhu cầu 7/30/90 ngày
- 🎯 Confidence Score cho mỗi dự báo
- 📊 Biểu đồ trend và seasonality
- 💡 Đề xuất số lượng đặt hàng

#### 📍 Step 4: Auto-Reorder
```
Demo: Khi tồn kho dưới reorder point
→ Hệ thống tự động tạo Purchase Request
→ Gửi đến Supplier
```

---

### Demo 6: HR & Payroll Management

**Mục tiêu:** Showcase quản lý nhân sự

#### 📍 Step 1: Dashboard HR
```
URL: http://localhost:3000/admin/hr-management
```

**Điểm nhấn:**
- 👥 Danh sách nhân viên
- 📊 Tổng quan chấm công
- 💰 Tổng quỹ lương

#### 📍 Step 2: Chấm Công
```
URL: http://localhost:3000/admin/hr-management → Tab "Chấm Công"
```

**Actions:**
1. Xem lịch làm việc nhân viên
2. Ghi nhận Check-in/Check-out
3. Xem tổng giờ làm việc
4. Ghi nhận làm thêm giờ

#### 📍 Step 3: Giao Việc
```
URL: http://localhost:3000/admin/my-tasks
```

**Actions:**
1. Tạo task mới
2. Gán cho nhân viên
3. Set deadline và priority
4. Theo dõi tiến độ

**Điểm nhấn:**
- 📋 Kanban board
- ⏰ Due date reminders
- 📊 Performance tracking

#### 📍 Step 4: Tính Lương
```
URL: http://localhost:3000/admin/payroll
```

**Actions:**
1. Chọn kỳ lương (tháng)
2. Xem bảng lương tự động tính
3. Thêm thưởng/phạt
4. Approve payroll
5. Export payslip

**Điểm nhấn:**
- 💰 Tự động tính từ chấm công
- 💵 Quản lý tạm ứng lương
- 📄 Export payslip PDF

---

### Demo 7: Quote Request & Project Management

**Mục tiêu:** Showcase hệ thống báo giá

#### 📍 Step 1: Khách Hàng Gửi Yêu Cầu Báo Giá
```
URL: http://localhost:3000/account/quotes
```

**Actions:**
1. Click "Tạo yêu cầu báo giá mới"
2. Nhập thông tin dự án
3. Chọn sản phẩm cần báo giá
4. Đính kèm bản vẽ/tài liệu
5. Gửi yêu cầu

#### 📍 Step 2: Admin Xử Lý Báo Giá
```
URL: http://localhost:3000/admin/sales-management
```

**Actions:**
1. Xem danh sách yêu cầu báo giá
2. Click vào yêu cầu để xem chi tiết
3. Điều chỉnh giá, số lượng
4. Gửi báo giá cho khách

**Điểm nhấn:**
- 📧 Email notification tự động
- 📄 PDF báo giá chuyên nghiệp
- 💬 Chat với khách hàng

#### 📍 Step 3: Khách Hàng Approve Báo Giá
```
URL: http://localhost:3000/account/quotes → Chi tiết báo giá
```

**Actions:**
1. Xem báo giá
2. Chấp nhận hoặc yêu cầu chỉnh sửa
3. Tạo đơn hàng từ báo giá

---

### Demo 8: Chương Trình Khách Hàng Thân Thiết

**Mục tiêu:** Showcase Loyalty Program

#### 📍 Step 1: Xem Loyalty Dashboard
```
URL: http://localhost:3000/account/loyalty
```

**Điểm nhấn:**
- 🏆 Tier hiện tại: Bronze → Silver → Gold → Platinum → Diamond
- ⭐ Tổng điểm tích lũy
- 📊 Progress đến tier tiếp theo
- 🎁 Ưu đãi của tier hiện tại

#### 📍 Step 2: Tích Điểm
```
Flow: Mua hàng → Tự động tích điểm (1k VND = 1 điểm)
```

**Điểm nhấn:**
- ✨ Points animation khi tích điểm
- 🎉 Thông báo khi lên tier mới
- 🎂 Bonus điểm sinh nhật

#### 📍 Step 3: Đổi Điểm
```
Actions:
1. Xem catalog phần thưởng
2. Chọn phần thưởng muốn đổi
3. Xác nhận đổi điểm
4. Nhận mã giảm giá/quà tặng
```

**Điểm nhấn:**
- 🎁 Nhiều loại phần thưởng
- 💰 Voucher giảm giá
- 🚚 Free shipping

---

## 5. Các Tính Năng Phụ Trợ

### 📧 Email Notifications
- Xác nhận đơn hàng
- Cập nhật trạng thái shipping
- Cảnh báo tồn kho thấp (cho Admin)
- Nhắc nhở thanh toán
- Welcome email khi đăng ký

### 📊 Báo Cáo
- Báo cáo doanh thu theo ngày/tuần/tháng
- Báo cáo sản phẩm bán chạy
- Báo cáo khách hàng
- Báo cáo tồn kho
- Export PDF/Excel

### 🔒 Bảo Mật
- JWT Authentication
- Role-based Access Control
- Rate Limiting
- CSRF Protection
- Input Validation với Zod

---

## 6. Scripts Hữu Ích cho Demo

```bash
# Seed dữ liệu demo
npm run db:seed

# Seed dữ liệu realistic cho dashboard
npm run db:seed:dashboard

# Seed nhà thầu và dự án
npm run db:seed:demo

# Test AI/Chatbot
npm run test:gemini
npm run test:rag

# Kiểm tra notifications
npm run check:notifications

# Chạy dev server
npm run dev
```

---

## 7. Checklist Trước Khi Demo

- [ ] Database đã được seed dữ liệu
- [ ] Gemini API key đã được cấu hình
- [ ] SMTP đã được setup (cho email demo)
- [ ] Có tài khoản demo với các role khác nhau
- [ ] Clear browser cache để demo fresh
- [ ] Chuẩn bị ảnh/file để demo upload

---

## 8. Troubleshooting

### Lỗi thường gặp:

**1. Chatbot không hoạt động:**
```bash
npm run check:ai
# Kiểm tra GOOGLE_GENERATIVE_AI_API_KEY trong .env
```

**2. Email không gửi được:**
```bash
npm run check:env
# Kiểm tra SMTP settings
```

**3. Database connection error:**
```bash
npx prisma studio
# Kiểm tra DATABASE_URL
```

---

## 📞 Liên Hệ Hỗ Trợ

- 📧 Email: support@smartbuild.vn
- 📱 Hotline: 1900-xxxx
- 📖 Documentation: [docs.smartbuild.vn](https://docs.smartbuild.vn)

---

*Cập nhật lần cuối: Tháng 01/2026*
