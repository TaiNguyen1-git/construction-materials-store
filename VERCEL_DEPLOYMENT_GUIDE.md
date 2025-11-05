# 🚀 Hướng Dẫn Deploy Lên Vercel

## Vấn đề thường gặp và cách fix

### 1. Environment Variables không được nhận

**Nguyên nhân:**
- Vercel có thể không nhận env vars nếu không được set đúng
- Cần redeploy sau khi thêm env vars

**Cách fix:**
1. Vào **Vercel Dashboard** > **Project Settings** > **Environment Variables**
2. Thêm từng biến một:
   - **Key**: `DATABASE_URL`
   - **Value**: `mongodb+srv://admin:Johnson2%404@smartbuildai.tdstbgu.mongodb.net/construction_store?retryWrites=true&w=majority`
   - **Environment**: Chọn **Production**, **Preview**, **Development**
   - Click **Save**
3. Lặp lại cho tất cả các biến:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NODE_ENV=production`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `GEMINI_TEMPERATURE`
   - `TESSERACT_LANGUAGES`
4. Sau khi thêm xong, **Redeploy** project:
   - Vào **Deployments** tab
   - Click **⋮** (3 dots) > **Redeploy**

### 2. Build Command không tương thích

**Đã fix:**
- ✅ Đã remove `--turbopack` flag khỏi build command
- ✅ Đã remove `output: 'standalone'` khỏi next.config.ts

### 3. MongoDB Atlas Connection

**Kiểm tra:**
1. MongoDB Atlas > **Network Access** > **IP Access List**
2. Thêm `0.0.0.0/0` (cho phép từ mọi nơi) hoặc:
   - Thêm Vercel IPs: https://vercel.com/docs/security/network/firewall#ip-addresses
3. Kiểm tra database name trong connection string:
   - Hiện tại: `construction_store`
   - Đảm bảo database này tồn tại trong MongoDB Atlas

### 4. Kiểm tra Logs trên Vercel

1. Vào **Deployments** tab
2. Click vào deployment mới nhất
3. Xem **Build Logs** và **Runtime Logs**
4. Tìm lỗi liên quan đến:
   - Database connection
   - Environment variables
   - API routes

### 5. Test API sau khi deploy

Sau khi deploy thành công, test các endpoints:
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/products` - Get products
- `https://your-app.vercel.app/api/notifications` - Get notifications (cần auth)

## Environment Variables cần thiết

Copy các biến này vào Vercel (bỏ dấu ngoặc kép):

```
DATABASE_URL=mongodb+srv://admin:Johnson2%404@smartbuildai.tdstbgu.mongodb.net/construction_store?retryWrites=true&w=majority
JWT_SECRET=3cd925b8e44cf5dbdb6cd5e65fe88cdc0a945ac1024c3ebe47426b086573
JWT_REFRESH_SECRET=e2dc4a1aa1015fda0adab5fcbd14bc5d3222c8c92587fbdae030dd349
NODE_ENV=production
GEMINI_API_KEY=AIzaSyC7Fu9Wlfr4dPLmX-pQ50FFCQPnBq7ishw
GEMINI_MODEL=models/gemini-2.5-flash
GEMINI_TEMPERATURE=0.7
TESSERACT_LANGUAGES=eng,vie
```

## Lưu ý quan trọng

1. **Không dùng dấu ngoặc kép** trong Vercel environment variables
2. **URL encode** password trong DATABASE_URL (đã làm: `@` → `%40`)
3. **Redeploy** sau khi thêm/sửa environment variables
4. **Kiểm tra Build Logs** nếu deploy fail
5. **MongoDB Atlas** cần whitelist IP `0.0.0.0/0` hoặc Vercel IPs

## Debug nếu vẫn không hoạt động

1. Kiểm tra Build Logs trên Vercel
2. Kiểm tra Runtime Logs (Function Logs)
3. Test API endpoint: `/api/health` để kiểm tra database connection
4. Kiểm tra MongoDB Atlas logs
5. Kiểm tra Vercel Function Logs cho errors

