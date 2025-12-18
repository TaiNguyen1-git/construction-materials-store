# Hướng Dẫn Deploy Prophet ML lên Render.com

## Cấu trúc thư mục cần upload

```
ml-service/
├── app.py              # Flask server (Render sử dụng)
├── train_prophet.py    # Script training
├── requirements.txt    # Python dependencies
├── Procfile           # Lệnh khởi động cho Render
├── .python-version    # Version Python
└── models/            # Thư mục chứa trained models (optional)
```

---

## CÁCH 1: Deploy từ GitHub (Đề xuất)

### Bước 1: Push code lên GitHub
```bash
# Tạo repo mới trên GitHub, sau đó:
cd scripts/ml-service
git init
git add .
git commit -m "Prophet ML Server"
git remote add origin https://github.com/YOUR_USERNAME/prophet-ml-server.git
git push -u origin main
```

### Bước 2: Tạo Web Service trên Render
1. Vào [render.com](https://render.com) → Dashboard
2. Click **"New +"** → **"Web Service"**
3. Chọn **"Connect a repository"** → Chọn repo vừa tạo
4. Cấu hình:
   - **Name**: `prophet-ml-server`
   - **Region**: Singapore (gần VN nhất)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click **"Create Web Service"**

### Bước 3: Lấy URL và cấu hình Vercel
- Render sẽ cấp URL dạng: `https://prophet-ml-server.onrender.com`
- Thêm vào `.env` của Next.js project:
```env
PROPHET_SERVER_URL=https://prophet-ml-server.onrender.com
```

---

## CÁCH 2: Deploy thủ công (Upload trực tiếp)

### Bước 1: Tạo Web Service
1. Vào [render.com](https://render.com) → Dashboard
2. Click **"New +"** → **"Web Service"**
3. Chọn **"Upload Files"** (không cần GitHub)

### Bước 2: Upload files
Upload các files sau:
- `app.py`
- `requirements.txt`
- `Procfile`
- `.python-version`
- `train_prophet.py` (optional - để train trên Render)

### Bước 3: Cấu hình
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`

---

## Cấu hình Environment Variables (trên Render)

Nếu cần kết nối MongoDB để training:
```
DATABASE_URL=mongodb+srv://...your-mongodb-connection-string...
```

---

## Kiểm tra sau khi deploy

```bash
# Health check
curl https://your-app.onrender.com/health

# List models
curl https://your-app.onrender.com/models

# Test predict (nếu có model)
curl -X POST https://your-app.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"productId": "your-product-id", "periods": 30}'
```

---

## Lưu ý quan trọng

### ⚠️ Free tier của Render:
- **Spin down sau 15 phút không hoạt động**
- Request đầu tiên sau spin down sẽ chậm (~30s)
- Giới hạn 750 giờ/tháng

### 💡 Giải pháp:
1. Dùng Paid tier ($7/tháng) để không spin down
2. Hoặc set up cron job ping mỗi 14 phút
3. Hoặc chấp nhận cold start (Next.js sẽ fallback về Statistical)

---

## Kết nối với Vercel

1. Thêm environment variable trên Vercel:
```
PROPHET_SERVER_URL=https://prophet-ml-server.onrender.com
```

2. Redeploy Next.js app

3. Hệ thống sẽ tự động:
   - Thử gọi Prophet server
   - Nếu thành công → Dùng Prophet ML
   - Nếu timeout/fail → Fallback về Statistical Ensemble
