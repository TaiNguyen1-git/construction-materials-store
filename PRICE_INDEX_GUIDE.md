# 📊 Live Price Index - Implementation Guide

## 💡 VỀ PRICE INDEX

Price Index giúp:
- Hiển thị giá real-time
- Track price changes
- AI prediction giá tương lai
- Tạo urgency cho khách mua

---

## 🔍 NGUỒN DỮ LIỆU GIÁ (Price Data Sources)

### Option 1: ✅ **Manual Update (Recommended để bắt đầu)**

**Cách hoạt động:**
```
Admin Panel → Price Management
- Nhập giá mỗi ngày (5-10 phút/ngày)
- Update giá khi có thay đổi
- Hệ thống tự động lưu history
- AI predict based on historical data
```

**Pros:**
- ✅ FREE hoàn toàn
- ✅ Control 100%
- ✅ Legal & safe
- ✅ Accurate (bạn là nguồn chính thống)

**Cons:**
- ⏰ Cần update manual mỗi ngày
- 👤 Cần 1 người chịu trách nhiệm

**Implementation:** 3 ngày

---

### Option 2: ⚠️ **Web Scraping (Legal Gray Area)**

**Cách hoạt động:**
```
Crawl competitor websites:
- tphcm.vlxd.vn
- vlxd24h.vn
- muasamxaydung.vn
- etc.

→ Extract prices
→ Store in database
→ Compare with your prices
```

**Pros:**
- 🤖 Tự động
- 📊 Nhiều data sources
- 💰 Free

**Cons:**
- ⚖️ Legal gray area (có thể vi phạm ToS)
- 🚫 Websites có thể block
- ⚠️ Data không chính xác (giá niêm yết ≠ giá thực)
- 🐛 Phải maintain khi websites thay đổi layout

**Implementation:** 1-2 tuần (complex)

---

### Option 3: 💰 **Market Data API (Paid)**

**Providers:**
- Bloomberg API
- Reuters API
- Local Vietnam commodity APIs
- Construction materials indices

**Pros:**
- ✅ Legal & official
- ✅ Accurate
- ✅ Real-time
- ✅ Reliable

**Cons:**
- 💰 Expensive ($500-2000/month)
- 🌍 Limited coverage cho Vietnam
- 📄 Requires contracts

**Implementation:** 1 tuần (nếu có API)

---

### Option 4: 🤝 **Community Reporting**

**Cách hoạt động:**
```
Cho phép contractors/customers report giá:
- "Hôm nay tôi mua xi măng ở X với giá Y"
- Verify through orders
- Aggregate data
- Show average market price
```

**Pros:**
- ✅ Free
- 📊 Real market data
- 👥 Community engagement
- ✅ Legal

**Cons:**
- ⏳ Cần time để tích lũy data
- ⚠️ Có thể không accurate lúc đầu
- 🔍 Cần verify mechanism

**Implementation:** 1 tuần

---

## 🎯 MY RECOMMENDATION

### Phase 1: **Manual Update** (Start NOW)

Implement manual price tracking:

**Daily Process:**
```
1. Mỗi sáng (15 phút):
   - Check supplier prices
   - Check 2-3 competitor websites
   - Update prices in admin panel

2. Hệ thống auto:
   - Lưu price history
   - Calculate changes (+3%, -2%)
   - Show trends on frontend
   - AI predict based on history
```

**UI Example:**
```
ADMIN PANEL → Price Updates

Today: 13/10/2025

Xi măng INSEE PC40
Current: ₫120,000
New Price: [₫122,000] ←  Input
Change: +₫2,000 (+1.7%) ← Auto calculate
Reason: [Supplier increase] ← Optional note

[Update Price]

---

Price History (Last 7 days):
13/10: ₫122,000 (+1.7%)
12/10: ₫120,000 (0%)
11/10: ₫120,000 (+2.6%)
10/10: ₫117,000 (0%)
09/10: ₫117,000 (-1.7%)
08/10: ₫119,000 (+0.8%)
07/10: ₫118,000

Trend: Rising 📈
```

**Frontend Display:**
```
Xi măng INSEE PC40

Hôm nay: ₫122,000 ↗️ +1.7%
7 ngày qua: ₫118,000 avg
30 ngày qua: ₫115,000 avg

📈 Xu hướng: Tăng giá
🔮 Dự đoán tuần sau: ₫125,000 (+2.5%)

💡 GỢI Ý: MUA NGAY
Giá đang tăng. Tiết kiệm ₫3,000/bao nếu mua hôm nay.
```

---

### Phase 2: **Community Reporting** (Month 2)

Add feature cho customers report giá:
```
"Tôi vừa mua xi măng ở đâu đó với giá X"
→ Verify qua order history
→ Aggregate data
→ Show "Market Price" vs "Your Price"
```

---

### Phase 3: **Auto Scraping** (Month 3-4, if needed)

Nếu manual quá tốn time, implement scraper:
```
- Chỉ crawl public data
- Respectful crawling (rate limiting)
- Use as reference only
- Main price vẫn là từ admin
```

---

## 💻 IMPLEMENTATION

### Simple Price Index (Manual - 3 days)

**Database Schema:**
```typescript
model PriceHistory {
  id          String   @id @default(cuid())
  productId   String
  price       Float
  oldPrice    Float?
  change      Float?   // Percentage
  changeAmount Float?  // Absolute
  source      String   @default("ADMIN")
  note        String?
  createdAt   DateTime @default(now())
  createdBy   String?  // Admin user
  
  product     Product  @relation(fields: [productId], references: [id])
  
  @@index([productId, createdAt])
}

model PriceAlert {
  id         String   @id @default(cuid())
  customerId String
  productId  String
  targetPrice Float
  condition  String   // "BELOW", "ABOVE"
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  
  customer   Customer @relation(fields: [customerId], references: [id])
  product    Product  @relation(fields: [productId], references: [id])
}
```

**API Endpoints:**
```typescript
// Admin: Update price
POST /api/admin/prices/update
{
  productId: "xi-mang-insee-pc40",
  newPrice: 122000,
  note: "Supplier increase"
}

// Public: Get price index
GET /api/prices/index?productId=xi-mang-insee-pc40

Response:
{
  currentPrice: 122000,
  yesterdayPrice: 120000,
  change: 1.7,
  changeAmount: 2000,
  trend: "rising",
  history7Days: [...],
  history30Days: [...],
  prediction: {
    nextWeek: 125000,
    nextMonth: 130000,
    confidence: 0.78
  },
  recommendation: "BUY_NOW",
  reason: "Giá đang tăng..."
}

// Customer: Set price alert
POST /api/prices/alerts
{
  productId: "xi-mang-insee-pc40",
  targetPrice: 115000,
  condition: "BELOW"
}
```

**Admin UI Component:**
```typescript
// Quick price update widget in admin dashboard
<PriceQuickUpdate />

Shows:
- Top 10 products
- Current price
- Quick input to update
- One-click update
- Shows last update time
```

---

## 📈 AI PRICE PREDICTION

**Simple Algorithm:**
```typescript
function predictPrice(history: PriceHistory[]) {
  // 1. Calculate trend (linear regression)
  const trend = calculateTrend(history)
  
  // 2. Seasonal factors (construction season)
  const seasonal = getSeasonalFactor(currentMonth)
  
  // 3. Recent volatility
  const volatility = calculateVolatility(history.slice(-7))
  
  // 4. External factors (manual input)
  const external = {
    usdRate: checkUSDRate(), // Affects imported materials
    oilPrice: checkOilPrice(), // Affects transport
    constructionIndex: getConstructionIndex() // Market activity
  }
  
  // 5. Predict
  const basePrediction = history[0].price * (1 + trend)
  const adjusted = basePrediction * seasonal * external.multiplier
  
  // 6. Confidence
  const confidence = calculateConfidence(history.length, volatility)
  
  return {
    nextWeek: adjusted * 1.01,
    nextMonth: adjusted * 1.05,
    confidence
  }
}
```

---

## ✅ SUMMARY

### Start with Manual (Best approach):

**Week 1:**
- ✅ Add PriceHistory model
- ✅ Admin UI to update prices
- ✅ Frontend display with trends

**Week 2:**
- ✅ Price alerts for customers
- ✅ AI prediction algorithm
- ✅ Email notifications

**Week 3:**
- ✅ Price comparison features
- ✅ Market insights dashboard

**Cost:** $0  
**Effort:** 5-10 min/day to update  
**Accuracy:** Very High (you control data)

---

## 🎯 Data Sources Summary

| Source | Cost | Accuracy | Effort | Legal | Recommendation |
|--------|------|----------|--------|-------|----------------|
| **Manual** | FREE | ⭐⭐⭐⭐⭐ | 10min/day | ✅ YES | ✅ **START HERE** |
| **Community** | FREE | ⭐⭐⭐⭐ | Med | ✅ YES | ✅ Phase 2 |
| **Scraping** | FREE | ⭐⭐⭐ | High | ⚠️ Gray | ⏳ Last resort |
| **API** | $500+/mo | ⭐⭐⭐⭐⭐ | Low | ✅ YES | 💰 If budget |

---

**Muốn tôi implement Manual Price Index không? 3 ngày có xong!**
