# Tài Liệu Kỹ Thuật: Hệ Thống Dự Đoán Rời Bỏ Khách Hàng (Customer Churn Prediction)

## Tổng Quan

### Mục Tiêu
Xây dựng hệ thống dự đoán khách hàng có nguy cơ rời bỏ (churn) để có biện pháp can thiệp kịp thời, giữ chân khách hàng và tăng lifetime value.

### Định Nghĩa Churn
- **Churn**: Khách hàng không quay lại mua hàng trong một khoảng thời gian nhất định
- **Churn Period**: 90 ngày (có thể điều chỉnh theo ngành)
- **At-Risk**: Khách hàng có xác suất churn > 60%

### Phương Pháp
- **Loại hệ thống**: Binary Classification
- **Thuật toán**: Random Forest / Gradient Boosting / Logistic Regression
- **Target Variable**: Churned (1) hoặc Active (0)

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│               CUSTOMER CHURN PREDICTION SYSTEM              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Data Sources]                                             │
│       ├── Order History                                     │
│       ├── Customer Profile                                  │
│       ├── Support Tickets                                   │
│       └── Review/Feedback Data                              │
│                     │                                       │
│                     ↓                                       │
│  [Feature Engineering]                                      │
│       ├── Recency features                                  │
│       ├── Frequency features                                │
│       ├── Monetary features                                 │
│       └── Behavioral features                               │
│                     │                                       │
│                     ↓                                       │
│  [ML Model]                                                 │
│       └── Random Forest Classifier                          │
│                     │                                       │
│                     ↓                                       │
│  [Output]                                                   │
│       ├── Churn Probability: 0.0 - 1.0                      │
│       ├── Risk Level: LOW/MEDIUM/HIGH/CRITICAL              │
│       └── Top Risk Factors                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Engineering

### 1. RFM Features (Recency, Frequency, Monetary)

#### Recency (Thời gian gần đây)

```
R_days = Current_Date - Last_Order_Date

Recency_Score = 
  if R_days ≤ 30:   5 (Very Active)
  if R_days ≤ 60:   4 (Active)
  if R_days ≤ 90:   3 (At Risk)
  if R_days ≤ 120:  2 (Dormant)
  else:             1 (Churned)
```

#### Frequency (Tần suất)

```
F_count = Total_Orders_Last_12_Months

Frequency_Score =
  if F_count ≥ 12:  5 (Monthly buyer)
  if F_count ≥ 6:   4 (Bi-monthly)
  if F_count ≥ 3:   3 (Quarterly)
  if F_count ≥ 1:   2 (Yearly)
  else:             1 (One-time)
```

#### Monetary (Giá trị)

```
M_value = Total_Spent_Last_12_Months

Monetary_Score = Percentile_Rank(M_value)
  Top 20%:    5
  20-40%:     4
  40-60%:     3
  60-80%:     2
  Bottom 20%: 1
```

### 2. Behavioral Features

| Feature | Công thức | Ý nghĩa |
|---------|-----------|---------|
| `avg_order_value` | Total_Spent / Order_Count | Giá trị TB mỗi đơn |
| `order_frequency` | Order_Count / Active_Months | Đơn/tháng |
| `days_between_orders` | AVG(Order_Date[i+1] - Order_Date[i]) | Khoảng cách TB giữa các đơn |
| `trend_spending` | (Recent_3M_Spent - Previous_3M_Spent) / Previous_3M_Spent | Xu hướng chi tiêu |
| `trend_frequency` | (Recent_3M_Orders - Previous_3M_Orders) / Previous_3M_Orders | Xu hướng tần suất |

### 3. Engagement Features

| Feature | Công thức | Ý nghĩa |
|---------|-----------|---------|
| `has_reviews` | 1 if review_count > 0 else 0 | Có viết review không |
| `avg_rating_given` | AVG(reviews.rating) | Điểm TB khách đánh giá |
| `support_tickets` | COUNT(support_requests) | Số lần liên hệ hỗ trợ |
| `complaint_ratio` | Complaints / Total_Interactions | Tỷ lệ phàn nàn |

### 4. Product Features

| Feature | Công thức | Ý nghĩa |
|---------|-----------|---------|
| `product_diversity` | COUNT(DISTINCT categories_purchased) | Đa dạng sản phẩm |
| `favorite_category` | MODE(categories) | Danh mục mua nhiều nhất |
| `uses_wholesale` | 1 if any wholesale_order else 0 | Có mua sỉ không |

---

## Công Thức Tính Churn Probability

### Phương Pháp 1: Weighted Score (Rule-Based)

```
Churn_Risk_Score = 
    w1 × Recency_Risk +
    w2 × Frequency_Risk +
    w3 × Monetary_Risk +
    w4 × Trend_Risk +
    w5 × Engagement_Risk

Weights:
  w1 = 0.30 (Recency - quan trọng nhất)
  w2 = 0.25 (Frequency)
  w3 = 0.15 (Monetary)
  w4 = 0.20 (Trend)
  w5 = 0.10 (Engagement)
```

#### Risk Calculations

```
Recency_Risk:
  R_days ≤ 30:   0.0
  R_days ≤ 60:   0.2
  R_days ≤ 90:   0.5
  R_days ≤ 120:  0.8
  R_days > 120:  1.0

Trend_Risk:
  if trend_spending > 0.1:   0.0 (tăng trưởng)
  if trend_spending > -0.1:  0.3 (ổn định)
  if trend_spending > -0.3:  0.6 (giảm nhẹ)
  else:                      1.0 (giảm mạnh)
```

### Phương Pháp 2: Machine Learning

#### Model: Random Forest Classifier

```python
from sklearn.ensemble import RandomForestClassifier

features = [
    'recency_days',
    'frequency_12m',
    'monetary_12m',
    'avg_order_value',
    'days_between_orders',
    'trend_spending',
    'trend_frequency',
    'product_diversity',
    'has_reviews',
    'support_tickets',
    'complaint_ratio'
]

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    class_weight='balanced'
)

# Training
model.fit(X_train, y_train)

# Prediction
churn_probability = model.predict_proba(X_test)[:, 1]
```

#### Feature Importance (Typical)

| Feature | Importance |
|---------|------------|
| recency_days | 0.28 |
| trend_spending | 0.18 |
| days_between_orders | 0.15 |
| frequency_12m | 0.12 |
| complaint_ratio | 0.10 |
| avg_order_value | 0.08 |
| Others | 0.09 |

---

## Ví Dụ Tính Toán

### Customer Profile

```json
{
  "customerId": "C001",
  "name": "Nguyễn Văn A",
  "last_order_date": "2025-10-15",
  "total_orders_12m": 8,
  "total_spent_12m": 45000000,
  "recent_3m_orders": 1,
  "previous_3m_orders": 4,
  "recent_3m_spent": 5000000,
  "previous_3m_spent": 20000000,
  "support_tickets": 2,
  "has_reviews": true,
  "avg_rating_given": 3.5
}
```

### Feature Calculation

```
Current Date: 2026-01-08

recency_days = 85 days
frequency_12m = 8 orders
monetary_12m = 45,000,000đ
avg_order_value = 5,625,000đ
trend_spending = (5M - 20M) / 20M = -0.75 (giảm 75%)
trend_frequency = (1 - 4) / 4 = -0.75 (giảm 75%)
```

### Risk Calculation (Rule-Based)

```
Recency_Risk = 0.5 (85 days → at risk zone)
Frequency_Risk = 0.2 (8 orders/year → decent)
Monetary_Risk = 0.2 (45M → top 40%)
Trend_Risk = 1.0 (giảm 75% chi tiêu)
Engagement_Risk = 0.3 (có review, rating 3.5)

Churn_Score = (0.30 × 0.5) + (0.25 × 0.2) + (0.15 × 0.2) + (0.20 × 1.0) + (0.10 × 0.3)
            = 0.15 + 0.05 + 0.03 + 0.20 + 0.03
            = 0.46

Risk Level: MEDIUM (46%)
```

### ML Prediction

```python
features = [85, 8, 45000000, 5625000, 45, -0.75, -0.75, 3, 1, 2, 0.1]
churn_probability = model.predict_proba([features])[0][1]
# Output: 0.72 (72% - HIGH RISK)
```

---

## API Specification

### Endpoint: Get Single Customer Risk

```
GET /api/churn/customer/:customerId
```

### Response

```json
{
  "success": true,
  "data": {
    "customerId": "C001",
    "customerName": "Nguyễn Văn A",
    "churnProbability": 0.72,
    "riskLevel": "HIGH",
    "riskFactors": [
      { "factor": "Xu hướng chi tiêu giảm 75%", "impact": "HIGH" },
      { "factor": "85 ngày chưa đặt hàng", "impact": "MEDIUM" },
      { "factor": "Tần suất đặt hàng giảm", "impact": "MEDIUM" }
    ],
    "recommendation": "Gửi email khuyến mãi với ưu đãi 15% cho đơn tiếp theo",
    "lastOrderDate": "2025-10-15",
    "daysSinceLastOrder": 85
  }
}
```

### Endpoint: Get At-Risk Customers List

```
GET /api/churn/at-risk?minProbability=0.6&limit=50
```

### Response

```json
{
  "success": true,
  "data": {
    "totalAtRisk": 23,
    "customers": [
      {
        "customerId": "C001",
        "name": "Nguyễn Văn A",
        "churnProbability": 0.72,
        "riskLevel": "HIGH",
        "potentialRevenueLoss": 45000000
      },
      ...
    ],
    "summary": {
      "critical": 5,
      "high": 12,
      "medium": 6
    }
  }
}
```

---

## Intervention Strategies

### Risk-Based Actions

| Risk Level | Probability | Action |
|------------|-------------|--------|
| CRITICAL | > 80% | Personal call + 20% discount |
| HIGH | 60-80% | Email + 15% discount |
| MEDIUM | 40-60% | Push notification + 10% discount |
| LOW | < 40% | Regular newsletter |

### Automated Campaigns

```
IF churn_probability > 0.7 AND last_order_value > 10M:
    → Trigger "Win-back VIP" campaign
    → Assign to Sales team
    → Offer: Free shipping + 15% off

IF churn_probability > 0.5 AND trend_spending < -0.5:
    → Trigger "We miss you" email
    → Include personalized product recommendations
    → Offer: 10% off next order
```

---

## Technology Stack

### Python Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| scikit-learn | 1.3.x | ML models |
| pandas | 2.0.x | Data processing |
| numpy | 1.24.x | Numerical operations |
| Flask | 3.0.x | API server |
| joblib | 1.3.x | Model persistence |

### Infrastructure

| Component | Platform |
|-----------|----------|
| ML API | Render Free |
| Scheduler | GitHub Actions (weekly retrain) |
| Database | MongoDB Atlas |

---

## Metrics & Evaluation

### Model Performance

| Metric | Target | Mô tả |
|--------|--------|-------|
| AUC-ROC | > 0.75 | Area under ROC curve |
| Precision | > 70% | Tỷ lệ đúng trong predicted churners |
| Recall | > 65% | Tỷ lệ phát hiện actual churners |
| F1-Score | > 0.67 | Harmonic mean |

### Business Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Churn Rate | 15%/quarter | 10%/quarter |
| Retention Rate | 85% | 90% |
| Customer Lifetime Value | 50M | 65M |
| Recovery Rate | N/A | 30% at-risk saved |

---

## Ưu Điểm & Hạn Chế

### Ưu Điểm
1. **Proactive**: Phát hiện sớm trước khi khách rời bỏ
2. **Personalized**: Hành động can thiệp phù hợp từng khách
3. **Measurable**: Có thể đo lường ROI của chương trình retention
4. **Automated**: Tự động trigger campaigns

### Hạn Chế
1. **Data dependency**: Cần đủ dữ liệu lịch sử (6-12 tháng)
2. **False positives**: Có thể gửi offer cho khách không thực sự at-risk
3. **External factors**: Không dự đoán được yếu tố bên ngoài (kinh tế, đối thủ)
4. **Cold start**: Không áp dụng được cho khách hàng mới

---

*Tài liệu được tạo: 08/01/2026*
*Phiên bản: 1.0*
