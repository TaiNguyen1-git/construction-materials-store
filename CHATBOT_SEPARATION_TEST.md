# Test Plan: Admin vs Customer Chatbot Separation

## Mục đích
Đảm bảo rằng Admin và Customer có các chức năng chatbot **hoàn toàn tách biệt**, không chồng chéo.

---

## 🔐 Security Tests

### Test 1: Customer không thể truy cập Admin functions
**Thực hiện:**
1. Đăng xuất hoặc đăng nhập với tài khoản CUSTOMER
2. Thử các query admin:
   - "Doanh thu hôm nay"
   - "Đơn hàng chờ xử lý"
   - "Top sản phẩm bán chạy"
   - "Ai nghỉ hôm nay"

**Kết quả mong đợi:**
- ❌ Không được phép truy cập
- Response: "⛔ Bạn không có quyền truy cập chức năng này. Chức năng này chỉ dành cho quản trị viên."
- Suggestions: Customer-specific (Tìm sản phẩm, Tính vật liệu, Giá cả)

---

## 👨‍💼 Admin Chatbot Tests

### Test 2: Admin Analytics
**Đăng nhập:** MANAGER hoặc EMPLOYEE

**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Doanh thu hôm nay" | ADMIN_ANALYTICS | Báo cáo doanh thu với số liệu cụ thể |
| "📊 Doanh thu hôm nay" | ADMIN_ANALYTICS | (Same, emoji không ảnh hưởng) |
| "Top sản phẩm bán chạy" | ADMIN_ANALYTICS | Top 5 sản phẩm với revenue |
| "📈 Top sản phẩm bán chạy" | ADMIN_ANALYTICS | (Same) |
| "Khách hàng mới" | ADMIN_ANALYTICS | Danh sách khách hàng mới |
| "Báo cáo tuần này" | ADMIN_ANALYTICS | Báo cáo tổng hợp tuần |

### Test 3: Admin Order Management
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Đơn hàng chờ xử lý" | ADMIN_ORDER_MANAGE | Danh sách đơn PENDING_CONFIRMATION |
| "📦 Đơn chờ xử lý" | ADMIN_ORDER_MANAGE | (Same) |
| "Đơn hàng mới nhất" | ADMIN_ORDER_MANAGE | Recent orders |
| "Xác nhận đơn" | ADMIN_ORDER_MANAGE | Confirmation prompt |

### Test 4: Admin Inventory Check
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Sản phẩm sắp hết" | ADMIN_INVENTORY_CHECK | Low stock warning |
| "⚠️ Sản phẩm sắp hết" | ADMIN_INVENTORY_CHECK | (Same) |
| "Tồn kho xi măng" | ADMIN_INVENTORY_CHECK | Stock levels |

### Test 5: Admin Employee Queries
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Ai nghỉ hôm nay" | ADMIN_EMPLOYEE_QUERY | Employee absence list |
| "Nhân viên làm ca sáng" | ADMIN_EMPLOYEE_QUERY | Morning shift employees |

### Test 6: Admin Fallback
**Test cases:**
| Query | Expected Response Type |
|-------|----------------------|
| "Giúp tôi" | Admin help menu (Analytics, Order Management, Inventory, Employee) |
| "Random text xyz" | Admin fallback with admin-specific suggestions |

**Kết quả mong đợi:**
- ✅ Không BAO GIỜ hiển thị customer suggestions như "Tìm sản phẩm", "Tính vật liệu"
- ✅ Chỉ hiển thị: "Doanh thu hôm nay", "Đơn chờ xử lý", "Sản phẩm sắp hết", "Trợ giúp"

---

## 👥 Customer Chatbot Tests

### Test 7: Customer Product Search
**Đăng nhập:** CUSTOMER hoặc không đăng nhập

**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Tìm xi măng" | PRODUCT_SEARCH | Danh sách xi măng |
| "🔍 Tìm xi măng" | PRODUCT_SEARCH | (Same) |
| "Có gạch ống không" | PRODUCT_SEARCH | Kết quả tìm kiếm gạch ống |
| "Tôi cần thép xây dựng" | PRODUCT_SEARCH | Danh sách thép |

### Test 8: Customer Price Inquiry
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Giá xi măng" | PRICE_INQUIRY | Bảng giá xi măng |
| "💰 Giá xi măng" | PRICE_INQUIRY | (Same) |
| "Xi măng bao nhiêu tiền" | PRICE_INQUIRY | Price info |

### Test 9: Customer Material Calculate
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Tính vật liệu xây nhà 3 tầng" | MATERIAL_CALCULATE | Material estimation |
| "📐 Tính vật liệu" | MATERIAL_CALCULATE | Prompt for details |
| "Cần bao nhiêu xi măng cho 100m2" | MATERIAL_CALCULATE | Calculation result |

### Test 10: Customer Order Creation
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Tôi muốn mua 10 bao xi măng" | ORDER_CREATE | Order confirmation prompt |
| "🛒 Đặt hàng" | ORDER_CREATE | Ask for order details |
| "Mua 20 viên gạch" | ORDER_CREATE | Order confirmation |

### Test 11: Customer Order Tracking
**Test cases:**
| Query | Expected Intent | Expected Response |
|-------|----------------|-------------------|
| "Đơn hàng của tôi ở đâu?" | ORDER_QUERY | Track customer's own orders |
| "📦 Đơn hàng của tôi" | ORDER_QUERY | Customer's order list |
| "Kiểm tra đơn #ORD-123" | ORDER_QUERY | Order status |

**⚠️ CRITICAL:** "Đơn hàng của tôi" PHẢI là ORDER_QUERY (customer), KHÔNG PHẢI ADMIN_ORDER_MANAGE!

### Test 12: Customer Fallback
**Test cases:**
| Query | Expected Response Type |
|-------|----------------------|
| "Giúp tôi" | Customer help menu (Search, Calculate, Order, Track, Image Recognition) |
| "Random text xyz" | Customer fallback with customer-specific suggestions |

**Kết quả mong đợi:**
- ✅ Không BAO GIỜ hiển thị admin suggestions như "Doanh thu", "Top bán chạy", "Nhân viên"
- ✅ Chỉ hiển thị: "🔍 Tìm sản phẩm", "📐 Tính vật liệu", "💰 Giá cả", "🛒 Đặt hàng", "📸 Nhận diện ảnh"

---

## 🔀 Edge Cases: Overlapping Keywords

### Test 13: "Đơn hàng" disambiguation
| User Type | Query | Expected Intent | Note |
|-----------|-------|----------------|------|
| **ADMIN** | "Đơn hàng chờ xử lý" | ADMIN_ORDER_MANAGE | Admin manages ALL orders |
| **ADMIN** | "Đơn hàng mới nhất" | ADMIN_ORDER_MANAGE | Admin views all recent orders |
| **CUSTOMER** | "Đơn hàng của tôi" | ORDER_QUERY | Customer tracks THEIR orders |
| **CUSTOMER** | "Đơn hàng của tôi ở đâu" | ORDER_QUERY | Customer tracking |

### Test 14: "Sản phẩm" disambiguation
| User Type | Query | Expected Intent | Note |
|-----------|-------|----------------|------|
| **ADMIN** | "Sản phẩm sắp hết" | ADMIN_INVENTORY_CHECK | Admin checks stock levels |
| **CUSTOMER** | "Tìm sản phẩm" | PRODUCT_SEARCH | Customer searches products |

---

## ✅ Checklist

### Admin Chatbot:
- [ ] Tất cả admin suggestions hoạt động đúng
- [ ] Analytics queries trả về data chính xác
- [ ] Order management chỉ hiển thị ALL orders (not customer-specific)
- [ ] Inventory check hiển thị system-wide stock
- [ ] Employee queries hoạt động
- [ ] Admin fallback KHÔNG BAO GIỜ gợi ý customer functions

### Customer Chatbot:
- [ ] Tất cả customer suggestions hoạt động đúng
- [ ] Product search trả về results
- [ ] Price inquiry hiển thị giá
- [ ] Material calculate hoạt động
- [ ] Order creation flow hoạt động
- [ ] Order tracking CHỈ hiển thị đơn của customer đó
- [ ] Customer fallback KHÔNG BAO GIỜ gợi ý admin functions

### Security:
- [ ] Customer không thể trigger admin intents
- [ ] HTTP 403 response khi customer thử truy cập admin functions
- [ ] Admin và customer có welcome messages khác nhau
- [ ] Conversation history không leak giữa admin và customer sessions

---

## 🐛 Known Issues (If Any)

_(Document any issues found during testing)_

---

## 📝 Test Results

**Tested by:** _______________
**Date:** _______________
**Environment:** Development / Production
**Status:** ✅ PASSED / ❌ FAILED

**Notes:**

