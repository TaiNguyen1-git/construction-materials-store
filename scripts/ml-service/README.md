# Prophet ML Service

Dịch vụ Machine Learning sử dụng Facebook Prophet để dự báo nhu cầu tồn kho.

## Cài đặt

```bash
cd scripts/ml-service
pip install -r requirements.txt
```

## Sử dụng

### 1. Training Models

```bash
# Train tất cả sản phẩm
python train_prophet.py

# Train một sản phẩm cụ thể
python train_prophet.py --product-id 507f1f77bcf86cd799439011

# Export data để debug
python train_prophet.py --export-data
```

### 2. Chạy Prediction Server

```bash
# Chạy server mặc định port 5000
python predict_server.py

# Chạy với port khác
python predict_server.py --port 8080
```

### 3. API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/health` | Health check |
| GET | `/models` | Liệt kê tất cả models |
| GET | `/predict?productId=XXX&periods=30` | Dự báo cho 1 sản phẩm |
| POST | `/predict` | Dự báo (JSON body) |
| POST | `/batch-predict` | Dự báo nhiều sản phẩm |

### 4. Tích hợp với Next.js

API routes trong Next.js đã được cấu hình để:
1. Thử gọi Prophet ML server trước
2. Nếu không có model → fallback về Statistical Ensemble

## Yêu cầu

- Python 3.8+
- Tối thiểu 14 ngày dữ liệu bán hàng
- Lý tưởng: 60+ ngày để có độ chính xác cao

## Độ chính xác

| Phương pháp | Độ chính xác |
|-------------|--------------|
| Statistical Ensemble | 70-85% |
| Prophet ML | 85-95% |

## File Structure

```
scripts/ml-service/
├── train_prophet.py     # Script training
├── predict_server.py    # HTTP server
├── requirements.txt     # Python dependencies
├── README.md           # Documentation
└── models/             # Trained models
    ├── prophet_XXX.pkl
    └── prophet_XXX_metrics.json
```
