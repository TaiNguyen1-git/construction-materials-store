# SmartBuild Admin Mobile App

Ứng dụng di động quản lý cửa hàng vật liệu xây dựng - Phiên bản Admin.

## 🚀 Tính Năng

### ✅ Đã Hoàn Thành

- **Đăng nhập**: Xác thực JWT với backend
- **Dashboard**: Thống kê tổng quan kinh doanh
- **Quản lý Sản phẩm**: Xem danh sách, chi tiết, tìm kiếm sản phẩm
- **Quản lý Đơn hàng**: Xem, cập nhật trạng thái đơn hàng
- **Quản lý Kho**: Theo dõi tồn kho, cảnh báo hết hàng
- **OCR Scanner**: Quét hóa đơn tự động, trích xuất thông tin
- **Profile**: Thông tin cá nhân, đăng xuất

### 📋 Tính Năng Sẽ Phát Triển

- Thêm/Sửa sản phẩm trên mobile
- Lưu và quản lý kết quả OCR
- Quản lý khách hàng
- Quản lý nhân viên
- Push notifications
- Báo cáo chi tiết
- Scan mã vạch sản phẩm

## 🛠️ Công Nghệ Sử Dụng

- **React Native** với **Expo**
- **TypeScript**
- **React Navigation** (Stack & Bottom Tabs)
- **Axios** cho API calls
- **AsyncStorage** cho local storage
- **Ionicons** cho icons

## 📦 Cài Đặt

### Yêu Cầu

- Node.js >= 16
- npm hoặc yarn
- Expo CLI
- Backend API đang chạy (port 3000)

### Các Bước

1. **Clone repository** (nếu chưa có):
```bash
cd mobile-admin
```

2. **Cài đặt dependencies**:
```bash
npm install
```

3. **Cấu hình môi trường**:
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
API_BASE_URL=http://YOUR_LOCAL_IP:3000  # Không dùng localhost trên thiết bị thật
```

**Lưu ý**: Nếu test trên thiết bị thật, thay `localhost` bằng địa chỉ IP máy tính:
- Windows: Chạy `ipconfig` và tìm IPv4 Address
- Mac/Linux: Chạy `ifconfig` và tìm inet address

Ví dụ: `http://192.168.1.100:3000`

4. **Khởi động backend API** (trong terminal khác):
```bash
cd .. # Quay về thư mục gốc
npm run dev
```

5. **Khởi động mobile app**:
```bash
npm start
```

## 📱 Chạy Ứng Dụng

### Android

```bash
npm run android
```

Hoặc quét QR code bằng ứng dụng Expo Go.

### iOS

```bash
npm run ios
```

Hoặc quét QR code bằng Camera app (iOS 11+).

### Web (Development)

```bash
npm run web
```

## 📂 Cấu Trúc Thư Mục

```
mobile-admin/
├── src/
│   ├── components/       # Các component tái sử dụng
│   ├── constants/        # Config, constants
│   │   └── config.ts     # API endpoints, app config
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/          # Các màn hình chính
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── OrderDetailScreen.tsx
│   │   ├── InventoryScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/         # API services
│   │   ├── api.ts        # Base API service với interceptors
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   └── dashboardService.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── utils/            # Utility functions
├── App.tsx
├── package.json
└── README.md
```

## 🔧 API Configuration

File `src/constants/config.ts` chứa cấu hình API:

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'      // Development
  : 'https://your-domain.com';   // Production

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  // ...
};
```

## 🔐 Authentication

App sử dụng JWT authentication:

1. User đăng nhập → Nhận `accessToken` và `refreshToken`
2. Tokens được lưu trong AsyncStorage
3. Mọi API request tự động thêm `Authorization: Bearer {token}`
4. Auto refresh token khi expired

## 📱 Màn Hình

### 1. Login
- Email & password authentication
- Hiển thị tiếng Việt
- Loading state

### 2. Dashboard
- Thống kê tổng quan (Tổng SP, Đơn hàng, Khách hàng, Doanh thu)
- Cảnh báo tồn kho thấp
- Đơn hàng chờ xử lý
- Quick actions (bao gồm OCR Scanner)

### 3. OCR Scanner (⭐ MỚI)
- Quét hóa đơn/tài liệu bằng camera
- Chọn ảnh từ thư viện
- Trích xuất thông tin tự động
- Hiển thị độ chính xác
- Tạo nháp hóa đơn tự động
- Xem [OCR_GUIDE.md](./OCR_GUIDE.md) để biết chi tiết

### 4. Products (Sản phẩm)
- Danh sách sản phẩm
- Tìm kiếm
- Lọc theo danh mục
- Chi tiết sản phẩm
- Hiển thị tồn kho

### 4. Orders (Đơn hàng)
- Danh sách đơn hàng
- Lọc theo trạng thái
- Chi tiết đơn hàng
- Cập nhật trạng thái
- Thêm mã vận đơn

### 5. Inventory (Kho)
- Danh sách tồn kho
- Cảnh báo sắp hết/hết hàng
- Progress bar tồn kho
- Filter: Tất cả / Sắp hết / Hết hàng

### 6. Profile
- Thông tin tài khoản
- Cài đặt
- Đăng xuất

## 🐛 Debug

### Xem logs

```bash
npx expo start
```

Nhấn `j` để mở debugger trong browser.

### Clear cache

```bash
npx expo start -c
```

### Reset cache và reinstall

```bash
rm -rf node_modules
npm install
npx expo start -c
```

## 🔄 API Endpoints Đã Tích Hợp

- ✅ `POST /api/auth/login` - Đăng nhập
- ✅ `POST /api/auth/logout` - Đăng xuất
- ✅ `GET /api/products` - Danh sách sản phẩm
- ✅ `GET /api/products/:id` - Chi tiết sản phẩm
- ✅ `GET /api/orders` - Danh sách đơn hàng
- ✅ `GET /api/orders/:id` - Chi tiết đơn hàng
- ✅ `PUT /api/orders/:id/status` - Cập nhật trạng thái
- ✅ `POST /api/ocr/invoice` - Quét hóa đơn OCR
- ✅ `GET /api/analytics/dashboard` - Thống kê dashboard

## 🎨 Design

- **Color Palette**:
  - Primary: `#2563eb` (Blue)
  - Success: `#10b981` (Green)
  - Warning: `#f59e0b` (Amber)
  - Danger: `#ef4444` (Red)
  - Background: `#f9fafb` (Gray)

- **Typography**: System fonts
- **Icons**: Ionicons

## 📝 To-Do

- [ ] Thêm/Sửa sản phẩm
- [ ] Upload hình ảnh sản phẩm
- [ ] Quản lý khách hàng
- [ ] Quản lý nhân viên
- [ ] Push notifications với Expo Notifications
- [ ] Scan barcode/QR code
- [ ] Offline mode
- [ ] Export báo cáo PDF
- [ ] Dark mode

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 👥 Team

- Developed for SmartBuild Construction Materials Store

## 📞 Support

Email: support@smartbuild.vn
Phone: +84 xxx xxx xxx
