# Authentication System - Upgrade Documentation

## Tổng Quan

Hệ thống authentication đã được nâng cấp toàn diện với các tính năng sau:

### 🆕 Tính Năng Mới

1. **Isolated Tab Sessions** - Mỗi browser tab có session riêng biệt
2. **Session Management** - Quản lý và thu hồi sessions qua API
3. **Rate Limiting** - Chống brute force attack trên auth endpoints
4. **Database Session Tracking** - Lưu trữ sessions trong MongoDB
5. **Multi-Account Support** - Có thể login nhiều tài khoản trên các tabs khác nhau
6. **Logout All Devices** - Đăng xuất khỏi tất cả thiết bị

---

## 📁 Files Đã Thay Đổi

### Database Schema
- `prisma/schema.prisma` - Thêm model `UserSession`

### Core Auth
- `src/lib/auth-service.ts` - Service mới với isolated tab sessions
- `src/contexts/auth-context.tsx` - Context được cập nhật, bỏ cross-tab auto-logout

### API Routes
- `src/app/api/auth/login/route.ts` - Thêm rate limiting, session tracking
- `src/app/api/auth/logout/route.ts` - Invalidate session trong database
- `src/app/api/auth/logout-all/route.ts` - **MỚI** Đăng xuất tất cả thiết bị
- `src/app/api/auth/sessions/route.ts` - **MỚI** Liệt kê sessions đang active
- `src/app/api/auth/sessions/[id]/route.ts` - **MỚI** Thu hồi session cụ thể
- `src/app/api/auth/register/route.ts` - Thêm rate limiting, session tracking

### Tests
- `src/__tests__/auth/auth-system.test.ts` - Unit tests
- `src/__tests__/auth/auth-api.integration.test.ts` - Integration tests
- `src/tests/setup.ts` - Vitest setup file

---

## 🔧 Cách Sử Dụng

### Login (Client-side)
```typescript
import { useAuth } from '@/contexts/auth-context'

function LoginComponent() {
  const { login, isLoading, error } = useAuth()
  
  const handleLogin = async () => {
    await login({ email, password }, rememberMe)
    // Mỗi tab sẽ có session riêng
  }
}
```

### Logout Current Tab
```typescript
const { logout } = useAuth()

// Chỉ logout tab hiện tại, các tabs khác không bị ảnh hưởng
await logout()
```

### Logout All Devices
```typescript
const { logoutAll } = useAuth()

// Logout tất cả thiết bị/tabs
await logoutAll()
```

### Xem Danh Sách Sessions
```typescript
// GET /api/auth/sessions
const response = await fetch('/api/auth/sessions', {
  headers: { Authorization: `Bearer ${token}` }
})
const { sessions } = await response.json()

// sessions = [
//   { id, deviceInfo, ipAddress, lastActivityAt, isCurrent: true },
//   { id, deviceInfo, ipAddress, lastActivityAt, isCurrent: false },
// ]
```

### Thu Hồi Session Cụ Thể
```typescript
// DELETE /api/auth/sessions/:id
await fetch(`/api/auth/sessions/${sessionId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## 🔒 Security Features

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 attempts | 15 phút |
| `/api/auth/register` | 5 attempts | 1 phút |

### Token Security
- JWT được hash bằng SHA-256 trước khi lưu vào database
- Không còn fallback secret trong production
- HttpOnly cookies với SameSite=lax

### Session Tracking
- Mỗi session lưu: device info, IP, user agent, tab ID
- Sessions có expiration time (7 ngày)
- Có thể thu hồi sessions bất kỳ lúc nào

---

## 📊 Database Model

```prisma
model UserSession {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  tokenHash    String   // Hash của JWT token
  deviceInfo   String?  // "Windows PC - Chrome"
  ipAddress    String?
  userAgent    String?
  tabId        String?
  isActive     Boolean  @default(true)
  lastActivityAt DateTime
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
  @@index([userId])
  @@index([tokenHash])
  @@index([isActive])
  @@index([expiresAt])
}
```

---

## ✅ Testing

### Chạy Unit Tests
```bash
npx vitest run src/__tests__/auth/auth-system.test.ts
```

### Chạy Integration Tests (yêu cầu dev server chạy)
```bash
npm run dev  # Terminal 1
npx vitest run src/__tests__/auth/auth-api.integration.test.ts  # Terminal 2
```

---

## 🔄 Migration Guide

### Existing Users
- Không cần migration data
- Users có thể tiếp tục sử dụng như bình thường
- Sessions cũ sẽ tự hết hạn

### Frontend Changes
- Import từ cùng path: `@/lib/auth-service` và `@/contexts/auth-context`
- API giữ nguyên backward compatible
- Thêm `logoutAll` function mới

---

## ⚠️ Breaking Changes

1. **Cross-tab auto-logout đã bị remove**
   - Trước: Logout một tab → Tất cả tabs bị logout
   - Sau: Logout một tab → Chỉ tab đó bị logout
   - Muốn logout tất cả: Dùng `logoutAll()`

2. **Session storage thay đổi**
   - Tokens được lưu với tab ID prefix trong sessionStorage
   - localStorage vẫn giữ token gần nhất cho page reload

---

## 🚀 Recommendations

### Giai Đoạn Tiếp Theo (Optional)
1. **UI quản lý sessions** - Thêm trang `/account/sessions` để user xem/thu hồi sessions
2. **Password change → Invalidate all sessions** - Khi đổi password, tự động logout everywhere
3. **Suspicious activity alerts** - Thông báo khi login từ thiết bị/location mới
4. **2FA/MFA** - Thêm xác thực 2 yếu tố
