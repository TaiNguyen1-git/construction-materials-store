# 🧪 Hướng Dẫn Test Sau Khi Deploy

## ✅ Đã hoàn thành:
1. ✅ Environment variables đã được thêm vào Vercel
2. ✅ MongoDB Atlas IP whitelist (`0.0.0.0/0`) đã Active
3. ✅ Code đã được push và deploy

## 🔍 Bước 1: Kiểm tra Deployment Status

1. Vào **Vercel Dashboard** > **Deployments**
2. Kiểm tra deployment mới nhất:
   - Status phải là **"Ready"** (màu xanh)
   - Nếu có lỗi, click vào để xem **Build Logs**

## 🧪 Bước 2: Test API Endpoints

### Test 1: Health Check
```
https://smartbuildai.vercel.app/api/health
```
**Kỳ vọng:** Trả về status 200 với thông tin database connection

### Test 2: Products API
```
https://smartbuildai.vercel.app/api/products?page=1&limit=12
```
**Kỳ vọng:** Trả về status 200 với danh sách products

### Test 3: Manifest
```
https://smartbuildai.vercel.app/manifest.json
```
**Kỳ vọng:** Trả về status 200 với manifest JSON

## 🔍 Bước 3: Kiểm tra Function Logs (Nếu vẫn lỗi)

1. Vào **Vercel Dashboard** > **Deployments**
2. Click vào deployment mới nhất
3. Click tab **"Functions"** hoặc **"Runtime Logs"**
4. Tìm các lỗi:
   - `P1001` = Database connection error
   - `P2002` = Unique constraint violation
   - `P2014` = Relation violation
   - `ENOTFOUND` = DNS resolution error
   - `ECONNREFUSED` = Connection refused

## 🐛 Debug nếu vẫn lỗi 500

### Lỗi Database Connection (P1001)
- **Kiểm tra:** DATABASE_URL có đúng format không
- **Kiểm tra:** Password có được URL encode không (`@` → `%40`)
- **Kiểm tra:** Database name có đúng không (`construction_store`)

### Lỗi MongoDB Query
- **Kiểm tra:** Function Logs trên Vercel để xem lỗi cụ thể
- **Kiểm tra:** Prisma schema có match với MongoDB không

### Lỗi Environment Variables
- **Kiểm tra:** Tất cả biến đã được thêm vào **Production**, **Preview**, **Development**
- **Kiểm tra:** Không có dấu ngoặc kép trong values
- **Redeploy:** Sau khi sửa env vars, phải **Redeploy**

## 📝 Test Checklist

- [ ] Deployment status = "Ready"
- [ ] `/api/health` trả về 200
- [ ] `/api/products` trả về 200
- [ ] `/manifest.json` trả về 200
- [ ] Không có lỗi trong Function Logs
- [ ] Website load được và hiển thị products

## 🚀 Nếu tất cả đều OK

Xin chúc mừng! 🎉 Website đã deploy thành công lên Vercel!

Tiếp theo có thể:
- Test các tính năng khác (login, cart, checkout)
- Kiểm tra performance
- Setup custom domain (nếu cần)

