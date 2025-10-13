# Hướng Dẫn Setup Chi Tiết

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Backend](#cài-đặt-backend)
3. [Cài Đặt Mobile App](#cài-đặt-mobile-app)
4. [Cấu Hình Kết Nối](#cấu-hình-kết-nối)
5. [Chạy Ứng Dụng](#chạy-ứng-dụng)
6. [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Hệ Thống

### Máy Tính
- **Node.js**: >= 16.x
- **npm**: >= 8.x hoặc **yarn**: >= 1.22
- **Git**: Latest version

### Thiết Bị Test
- **Android**: Android 5.0+ (API 21+)
- **iOS**: iOS 13.0+
- Hoặc: Simulator/Emulator

---

## Cài Đặt Backend

### 1. Khởi động Backend API

Từ thư mục gốc của project:

```bash
cd D:\SmartBuildAI\construction-materials-store
```

### 2. Cài đặt dependencies (nếu chưa):

```bash
npm install
```

### 3. Cấu hình Database

Đảm bảo file `.env` có cấu hình đúng:

```env
DATABASE_URL="your-database-url"
REDIS_URL="your-redis-url"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
```

### 4. Migrate database:

```bash
npm run db:generate
npm run db:push
```

### 5. (Optional) Seed dữ liệu mẫu:

```bash
npm run db:seed
npm run db:sample
```

### 6. Khởi động server:

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

**Quan trọng**: Giữ terminal này mở!

---

## Cài Đặt Mobile App

### 1. Mở terminal mới, navigate đến thư mục mobile:

```bash
cd D:\SmartBuildAI\construction-materials-store\mobile-admin
```

### 2. Cài đặt dependencies:

```bash
npm install
```

### 3. Cài đặt Expo CLI (global):

```bash
npm install -g expo-cli
```

Hoặc dùng npx (không cần cài global):
```bash
npx expo --version
```

---

## Cấu Hình Kết Nối

### Test trên Emulator/Simulator

Sử dụng `localhost`:

**File**: `src/constants/config.ts`
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Emulator/Simulator
  : 'https://your-domain.com';
```

### Test trên Thiết Bị Thật

Cần dùng IP address của máy tính:

#### Windows:
1. Mở CMD hoặc PowerShell
2. Chạy: `ipconfig`
3. Tìm "IPv4 Address" (ví dụ: `192.168.1.100`)

#### Mac/Linux:
1. Mở Terminal
2. Chạy: `ifconfig | grep "inet "`
3. Tìm địa chỉ inet (ví dụ: `192.168.1.100`)

**Cập nhật file**: `src/constants/config.ts`
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3000'  // Thay bằng IP của bạn
  : 'https://your-domain.com';
```

**Lưu ý**: Máy tính và điện thoại phải cùng mạng WiFi!

---

## Chạy Ứng Dụng

### 1. Khởi động Expo Dev Server

```bash
npm start
```

Hoặc:
```bash
npx expo start
```

Bạn sẽ thấy QR code và các options:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

### 2. Chọn Platform

#### a) Android Emulator
```bash
# Nhấn 'a' hoặc
npm run android
```

**Yêu cầu**: Android Studio với emulator đã setup

#### b) iOS Simulator (chỉ trên Mac)
```bash
# Nhấn 'i' hoặc
npm run ios
```

**Yêu cầu**: Xcode đã được cài đặt

#### c) Thiết Bị Thật

**Android**:
1. Tải **Expo Go** từ Google Play Store
2. Mở app
3. Quét QR code từ terminal

**iOS**:
1. Tải **Expo Go** từ App Store
2. Mở Camera app
3. Quét QR code
4. Tap vào notification để mở Expo Go

#### d) Web Browser (Development)
```bash
# Nhấn 'w' hoặc
npm run web
```

---

## Troubleshooting

### 1. "Cannot connect to backend"

**Nguyên nhân**: IP/URL không đúng hoặc backend không chạy

**Giải pháp**:
```bash
# Kiểm tra backend đang chạy
curl http://localhost:3000/api/status

# Nếu test trên thiết bị thật, kiểm tra IP
ping 192.168.1.100  # Thay bằng IP của bạn
```

### 2. "Network request failed"

**Nguyên nhân**: Firewall chặn hoặc không cùng mạng

**Giải pháp**:
1. Tắt firewall tạm thời (Windows Defender)
2. Đảm bảo cùng WiFi
3. Thử dùng IP khác (có thể có nhiều network adapters)

### 3. "Cannot find module 'react-native-gesture-handler'"

**Giải pháp**:
```bash
npm install react-native-gesture-handler react-native-reanimated
```

### 4. Expo không khởi động được

**Giải pháp**:
```bash
# Clear cache
npm start -- --clear

# Hoặc
npx expo start -c

# Nếu vẫn lỗi, reinstall
rm -rf node_modules
npm install
```

### 5. "Metro bundler error"

**Giải pháp**:
```bash
# Kill process trên port 8081
# Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8081 | xargs kill -9

# Sau đó restart
npm start
```

### 6. API trả về 401 Unauthorized

**Nguyên nhân**: Token hết hạn hoặc không có token

**Giải pháp**:
1. Đăng xuất và đăng nhập lại
2. Xóa app data:
   ```bash
   # Android
   adb shell pm clear com.smartbuild.admin
   ```

### 7. Không thấy QR code

**Giải pháp**:
```bash
# Restart với tunnel mode
npm start -- --tunnel
```

---

## Tài Khoản Test

**Admin Account**:
```
Email: admin@smartbuild.com
Password: Admin@123
```

**Manager Account**:
```
Email: manager@smartbuild.com
Password: Manager@123
```

---

## Commands Hữu Ích

```bash
# Clear cache và restart
npm run clean

# Check Expo version
npx expo --version

# Update Expo
npm install expo@latest

# Check package versions
npm list

# Fix dependencies
npm audit fix

# Reinstall all packages
rm -rf node_modules package-lock.json
npm install
```

---

## Development Tips

### 1. Live Reload

Khi code thay đổi, app tự động reload. Nếu không:
- Nhấn `r` trong terminal
- Hoặc shake device → chọn "Reload"

### 2. Debug Menu

**Physical Device**:
- iOS: Shake device
- Android: Shake device hoặc `adb shell input keyevent 82`

**Simulator**:
- iOS: Cmd+D
- Android: Cmd+M (Mac) hoặc Ctrl+M (Windows)

### 3. View Logs

```bash
# Terminal sẽ show logs tự động
# Hoặc dùng React Native Debugger
```

### 4. Performance

Nếu app chạy chậm trong development:
- Tắt live reload
- Dùng production build:
  ```bash
  eas build --platform android --profile preview
  ```

---

## Next Steps

Sau khi setup thành công:

1. ✅ Test login với tài khoản admin
2. ✅ Xem dashboard statistics
3. ✅ **Test OCR Scanner** (tính năng mới!)
4. ✅ Browse products
5. ✅ View orders
6. ✅ Check inventory
7. ✅ Update order status
8. ✅ Test logout

### Test OCR Scanner

1. Vào Dashboard → Chọn "Quét Hóa Đơn"
2. Cấp quyền camera khi được hỏi
3. Chụp ảnh hóa đơn hoặc chọn từ thư viện
4. Chọn loại "Hóa Đơn"
5. Nhấn "Quét" và xem kết quả
6. Xem [OCR_GUIDE.md](./OCR_GUIDE.md) để biết thêm chi tiết

---

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề:

1. Check [README.md](./README.md) để biết thêm thông tin
2. Xem logs trong terminal
3. Google error message
4. Liên hệ team

---

**Chúc bạn code vui vẻ! 🚀**
