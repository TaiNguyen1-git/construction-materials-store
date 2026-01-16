# Hướng Dẫn Deploy ML Services lên Render.com

## Tổng Quan

ML Services API cung cấp 7 dịch vụ ML/AI:

| Service | Mô tả | Endpoints |
|---------|-------|-----------|
| **Prophet** | Dự báo tồn kho time-series | `/predict`, `/models` |
| **Sentiment** | Phân tích cảm xúc tiếng Việt | `/sentiment/analyze` |
| **Churn** | Dự đoán rời bỏ khách hàng | `/churn/predict`, `/churn/at-risk` |
| **Pricing** | Định giá động | `/pricing/recommend` |
| **Contractors** | Gợi ý nhà thầu | `/contractors/match` |
| **Market** | Phân tích xu hướng thị trường | `/market/trends`, `/market/forecast` |
| **Search** | Tìm kiếm ngữ nghĩa | `/search/semantic` |

---

## Cấu trúc thư mục cần upload

```
ml-service/
├── app.py                      # Main Flask server
├── requirements.txt            # Python dependencies
├── Procfile                    # Lệnh khởi động cho Render
├── .python-version             # Version Python
│
├── # Core ML Services
├── sentiment_analysis.py       # Sentiment Analysis
├── churn_prediction.py         # Customer Churn Prediction
├── dynamic_pricing.py          # Dynamic Pricing
├── contractor_matching.py      # Contractor Matching
├── market_trend.py             # Market Trend Analysis
├── semantic_search.py          # Semantic Search
├── vietnamese_lexicon.py       # Vietnamese NLP Lexicon
│
├── # Prophet (legacy)
├── train_prophet.py            # Script training Prophet
├── predict_server.py           # Prophet-only server (legacy)
│
└── models/                     # Trained models directory
```

---

## Deploy từ GitHub (Đề xuất)

### Bước 1: Push code lên GitHub
```bash
# Tạo repo mới trên GitHub, sau đó:
cd scripts/ml-service
git init
git add .
git commit -m "ML Services API v2.0"
git remote add origin https://github.com/YOUR_USERNAME/ml-services.git
git push -u origin main
```

### Bước 2: Tạo Web Service trên Render
1. Vào [render.com](https://render.com) → Dashboard
2. Click **"New +"** → **"Web Service"**
3. Chọn **"Connect a repository"** → Chọn repo vừa tạo
4. Cấu hình:
   - **Name**: `ml-services-api`
   - **Region**: Singapore (gần VN nhất)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click **"Create Web Service"**

### Bước 3: Cấu hình Environment Variables

Thêm các biến môi trường trên Render Dashboard:

```env
# Required for Semantic Search
GEMINI_API_KEY=your-gemini-api-key

# Optional for MongoDB connection
DATABASE_URL=mongodb+srv://...your-mongodb-connection-string...
```

### Bước 4: Lấy URL và cấu hình Vercel
- Render sẽ cấp URL dạng: `https://ml-services-api.onrender.com`
- Thêm vào `.env` của Next.js project:
```env
ML_SERVICES_URL=https://ml-services-api.onrender.com
PROPHET_SERVER_URL=https://ml-services-api.onrender.com
```

---

## API Endpoints

### Health Check
```bash
curl https://your-app.onrender.com/health
```

### Sentiment Analysis
```bash
curl -X POST https://your-app.onrender.com/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Giao hàng nhanh, chất lượng tốt!"}'
```

### Churn Prediction
```bash
curl -X POST https://your-app.onrender.com/churn/predict \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "C001",
    "orders_12m": 8,
    "total_spent_12m": 45000000,
    "recent_3m_spent": 5000000,
    "previous_3m_spent": 20000000
  }'
```

### Dynamic Pricing
```bash
curl -X POST https://your-app.onrender.com/pricing/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_001",
    "productName": "Xi măng Holcim",
    "basePrice": 95000,
    "cost": 78000,
    "currentStock": 500,
    "avgDailySales": 15,
    "demandIndex": 1.2
  }'
```

### Contractor Matching
```bash
curl -X POST https://your-app.onrender.com/contractors/match \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "title": "Xây nhà 2 tầng",
      "description": "Cần thợ hồ giỏi",
      "requirements": ["thợ hồ", "xây dựng"],
      "city": "Biên Hòa"
    },
    "contractors": [
      {"id": "C001", "displayName": "Nguyễn Văn A", "skills": ["thợ hồ"], "avgRating": 4.5}
    ]
  }'
```

### Market Trends
```bash
curl https://your-app.onrender.com/market/trends?category=cement&period=30
```

### Semantic Search
```bash
# First, index products
curl -X POST https://your-app.onrender.com/search/index \
  -H "Content-Type: application/json" \
  -d '{"products": [{"id": "1", "name": "Xi măng Holcim", "category": "cement"}]}'

# Then search
curl -X POST https://your-app.onrender.com/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "xi măng chống thấm"}'
```

---

## Lưu ý quan trọng

### ⚠️ Free tier của Render:
- **Spin down sau 15 phút không hoạt động**
- Request đầu tiên sau spin down sẽ chậm (~30-60s)
- Giới hạn 750 giờ/tháng

### 💡 Giải pháp:
1. Dùng Paid tier ($7/tháng) để không spin down
2. Set up GitHub Actions ping mỗi 14 phút
3. Chấp nhận cold start (Next.js sẽ fallback nếu timeout)

### 📊 Memory Requirements:
- **Free Tier**: 512MB RAM - đủ cho tất cả services
- Prophet models: ~50-100MB mỗi model
- Semantic Search vector store: ~10-50MB tùy số products

---

## GitHub Actions Keep-Warm (Optional)

Tạo file `.github/workflows/keep-warm.yml`:

```yaml
name: Keep ML Services Warm

on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping ML Services
        run: |
          curl -f https://ml-services-api.onrender.com/health || true
```

---

## Kết nối với Vercel

1. Thêm environment variables trên Vercel:
```env
ML_SERVICES_URL=https://ml-services-api.onrender.com
PROPHET_SERVER_URL=https://ml-services-api.onrender.com
GEMINI_API_KEY=your-gemini-api-key
```

2. Redeploy Next.js app

3. Sử dụng trong code:
```typescript
const ML_URL = process.env.ML_SERVICES_URL || 'http://localhost:5000';

// Gọi sentiment analysis
const response = await fetch(`${ML_URL}/sentiment/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: reviewText })
});
```

---

## Troubleshooting

### Lỗi "underthesea not found"
```bash
# Thêm vào requirements.txt nếu chưa có
underthesea>=6.8.0
```

### Lỗi "prophet install failed"
Prophet cần CMake và compiler. Trên Render thường OK, nhưng nếu lỗi thử:
```bash
# Thêm vào Build Command
pip install pystan==2.19.1.1 && pip install -r requirements.txt
```

### Lỗi "Memory limit exceeded"
- Giảm số models loaded cùng lúc
- Upgrade lên Paid tier với RAM lớn hơn

---

*Tài liệu cập nhật: 09/01/2026*
*Version: 2.0.0*
