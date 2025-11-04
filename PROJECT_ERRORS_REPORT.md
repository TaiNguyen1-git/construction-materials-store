# 📋 Project Errors Report

## Tổng quan

**Tổng số lỗi:** 213 errors trong 56 files

---

## 🔴 Lỗi nghiêm trọng (Cần fix ngay)

### 1. Next.js Route Handlers - Params Type (11 errors)

**Vấn đề:** Next.js 15 đã thay đổi `params` từ synchronous thành `Promise<params>`

**Files bị ảnh hưởng:**
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/orders/[id]/confirm/route.ts`
- `src/app/api/orders/[id]/deposit/route.ts`
- `src/app/api/orders/[id]/status/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/tasks/[taskId]/route.ts`
- `src/app/api/projects/[id]/tasks/route.ts`
- `src/app/api/work-shifts/[id]/clock/route.ts`

**Fix:** Cần update tất cả route handlers để await params:
```typescript
// BEFORE (❌)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
}

// AFTER (✅)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

---

### 2. Database Schema Issues (20+ errors)

#### A. OrderStatus - "COMPLETED" không tồn tại
**Files:**
- `src/lib/chatbot/action-handler.ts` (line 259)
- `src/lib/ml-recommendations.ts` (multiple lines)
- `src/app/admin/orders/page.tsx`

**Vấn đề:** Dùng `'COMPLETED'` nhưng enum có thể là `'DELIVERED'` hoặc khác

**Fix:** Kiểm tra schema Prisma và dùng đúng enum value

#### B. PaymentStatus Type
**Files:**
- `prisma/seed.ts` (line 341)

**Vấn đề:** String literal không match PaymentStatus enum

**Fix:** Dùng enum value đúng

#### C. OrderItem - Missing `subtotal` field
**Files:**
- `src/lib/chatbot/analytics-engine.ts` (lines 237, 447)

**Vấn đề:** Code dùng `item.subtotal` nhưng schema có thể là `totalPrice`

**Fix:** Dùng `totalPrice` thay vì `subtotal`

#### D. WorkShift - Missing `checkIn` field
**Files:**
- `src/lib/chatbot/analytics-engine.ts` (lines 303, 322)

**Vấn đề:** Code dùng `shift.checkIn` nhưng schema có thể không có field này

**Fix:** Kiểm tra schema và dùng field đúng

#### E. Product - Missing `_count` trong orderBy
**Files:**
- `src/lib/ai-material-recognition.ts` (line 272)
- `src/lib/ml-recommendations.ts` (lines 317, 379)

**Vấn đề:** Dùng `orderBy: { _count: { orderItems: 'desc' } }` không được support

**Fix:** Dùng cách khác để sort by count

#### F. Product - Missing `inventoryItem` relation
**Files:**
- `src/lib/ai-material-recognition.ts` (lines 287, 294, 295)

**Vấn đề:** Code dùng `product.inventoryItem` nhưng query không include relation

**Fix:** Thêm `include: { inventoryItem: true }` vào query

#### G. Customer - Missing `name`, `email`, `phone`
**Files:**
- `src/lib/conversation-memory.ts` (lines 64-66)

**Vấn đề:** Code dùng `customer.name` nhưng customer có thể là relation với User

**Fix:** Dùng `customer.user.name` hoặc include relation

---

### 3. Conversation State - Async/Promise Issues (13 errors)

**Files:**
- `src/lib/chatbot/conversation-state.ts`

**Vấn đề:** Các function return `Promise<ConversationState>` nhưng code dùng như synchronous

**Fix:** Cần await tất cả calls đến conversation state functions

---

### 4. Notification Service (1 error)

**Files:**
- `src/components/NotificationBell.tsx` (line 5)
- `src/lib/notification-service.ts` (line 255)

**Vấn đề:**
- Export `NotificationService` không tồn tại
- NotificationType enum mismatch

**Fix:** 
- Check exports trong notification-service.ts
- Fix enum type

---

### 5. VNPay - Querystring Options (3 errors)

**Files:**
- `src/lib/vnpay.ts` (lines 46, 52, 63)

**Vấn đề:** `querystring.stringify()` không nhận options object trong TypeScript

**Fix:** Dùng cách khác hoặc cast type

---

### 6. Middleware - Missing `ip` property (1 error)

**Files:**
- `src/middleware.ts` (line 46)

**Vấn đề:** `request.ip` không tồn tại trong NextRequest

**Fix:** Dùng `request.headers.get('x-forwarded-for')` hoặc `request.headers.get('x-real-ip')`

---

## 🟡 Lỗi không nghiêm trọng (Có thể bỏ qua)

### 1. Mobile Admin - Missing Dependencies (50+ errors)

**Files:**
- `mobile-admin/**/*.tsx`

**Vấn đề:** Thiếu dependencies như `react-native`, `expo`, `@react-navigation/*`

**Fix:** Không cần fix nếu không dùng mobile-admin. Có thể exclude khỏi TypeScript check.

---

### 2. React Native Dependencies trong Web Code (5 errors)

**Files:**
- `src/hooks/useAuth.ts`
- `src/hooks/useNotifications.ts`
- `src/services/authService.ts`
- `src/utils/api.ts`

**Vấn đề:** Import `@react-native-async-storage/async-storage` trong web code

**Fix:** 
- Dùng `localStorage` cho web
- Hoặc tạo abstraction layer

---

### 3. Scripts - Type Errors (5 errors)

**Files:**
- `scripts/comprehensive-fix.ts`
- `scripts/final-data-fix.ts`
- `scripts/fix-data.ts`

**Vấn đề:** Các scripts có lỗi type nhưng không ảnh hưởng runtime

**Fix:** Có thể bỏ qua hoặc fix khi cần

---

## ✅ Không có lỗi

- **Linter:** ✅ Không có lỗi ESLint
- **Build:** Cần test lại sau khi fix TypeScript errors

---

## 🎯 Ưu tiên Fix

### Priority 1 (Critical - Fix ngay):
1. ✅ Next.js Route Handlers params (11 errors)
2. ✅ Database schema mismatches (20+ errors)
3. ✅ Conversation state async issues (13 errors)

### Priority 2 (Important):
4. ⚠️ Notification service (1 error)
5. ⚠️ VNPay querystring (3 errors)
6. ⚠️ Middleware ip (1 error)

### Priority 3 (Low - Có thể bỏ qua):
7. ⚠️ Mobile admin dependencies (50+ errors - exclude khỏi check)
8. ⚠️ React Native imports trong web code (5 errors - tạo abstraction)
9. ⚠️ Scripts type errors (5 errors - không ảnh hưởng runtime)

---

## 📝 Next Steps

1. Fix Next.js route handlers params
2. Fix database schema mismatches
3. Fix conversation state async issues
4. Test build sau khi fix
5. Exclude mobile-admin khỏi TypeScript check (nếu không dùng)

---

**Generated:** $(date)
**Total Errors:** 213
**Files Affected:** 56

