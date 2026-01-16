# Tài Liệu Kỹ Thuật: Hệ Thống Định Giá Động (Dynamic Pricing)

## Tổng Quan

### Mục Tiêu
Xây dựng hệ thống tự động điều chỉnh giá sản phẩm dựa trên nhiều yếu tố: cung-cầu, tồn kho, đối thủ, thời điểm, và hành vi khách hàng, nhằm tối ưu hóa doanh thu và lợi nhuận.

### Định Nghĩa
- **Dynamic Pricing**: Chiến lược định giá linh hoạt thay đổi theo thời gian thực
- **Price Elasticity**: Độ nhạy của demand khi giá thay đổi
- **Optimal Price**: Mức giá tối ưu hóa mục tiêu (revenue/profit/volume)

### Phương Pháp
- **Loại hệ thống**: Optimization + Machine Learning
- **Thuật toán**: Regression + Reinforcement Learning
- **Update Frequency**: Daily hoặc Real-time

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                  DYNAMIC PRICING SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Data Inputs]                                              │
│       ├── Historical Sales Data                             │
│       ├── Inventory Levels                                  │
│       ├── Competitor Prices (scraped)                       │
│       ├── Demand Forecast                                   │
│       └── Cost Data                                         │
│                     │                                       │
│                     ↓                                       │
│  [Price Optimization Engine]                                │
│       ├── Demand Forecasting Model                          │
│       ├── Price Elasticity Calculator                       │
│       ├── Constraint Handler                                │
│       └── Profit Optimizer                                  │
│                     │                                       │
│                     ↓                                       │
│  [Output]                                                   │
│       ├── Recommended Price                                 │
│       ├── Expected Demand                                   │
│       ├── Expected Revenue                                  │
│       └── Confidence Level                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Các Chiến Lược Định Giá

### 1. Cost-Plus Pricing (Baseline)

```
Price = Cost × (1 + Markup_Percentage)

Ví dụ:
  Cost = 100,000đ
  Markup = 20%
  Price = 100,000 × 1.20 = 120,000đ
```

### 2. Demand-Based Pricing

```
Price = Base_Price × Demand_Multiplier

Demand_Multiplier:
  if demand_index > 1.5:  1.15 (tăng 15%)
  if demand_index > 1.2:  1.08 (tăng 8%)
  if demand_index > 0.8:  1.00 (giữ nguyên)
  if demand_index > 0.5:  0.95 (giảm 5%)
  else:                   0.90 (giảm 10%)
```

### 3. Inventory-Based Pricing

```
Inventory_Multiplier = f(current_stock, avg_daily_sales, lead_time)

if days_of_stock < 7:
    Multiplier = 1.10  # Sắp hết → tăng giá
elif days_of_stock > 60:
    Multiplier = 0.92  # Tồn nhiều → giảm giá
else:
    Multiplier = 1.00

days_of_stock = current_stock / avg_daily_sales
```

### 4. Competitor-Based Pricing

```
Competitive_Position = Our_Price / Competitor_Avg_Price

Strategy:
  PREMIUM:    Competitive_Position = 1.10 (cao hơn 10%)
  MATCH:      Competitive_Position = 1.00 (bằng)
  UNDERCUT:   Competitive_Position = 0.95 (thấp hơn 5%)

Recommended_Price = Competitor_Avg_Price × Target_Position
```

### 5. Time-Based Pricing

```
Time_Multiplier:
  Mùa xây dựng (T3-T10):     1.05 - 1.10
  Mùa mưa (T11-T2):          0.95 - 1.00
  Cuối tuần:                 1.00
  Đầu tháng (mua sỉ nhiều):  0.98
```

---

## Công Thức Tính Giá Tối Ưu

### Master Formula

```
Optimal_Price = Base_Price 
              × Demand_Factor 
              × Inventory_Factor 
              × Competitor_Factor 
              × Time_Factor
              × Margin_Guard

Subject to:
  Min_Price ≤ Optimal_Price ≤ Max_Price
  Margin ≥ Min_Margin (15%)
```

### Weighted Optimization

```python
def calculate_optimal_price(product):
    base = product.base_price
    
    # Factors with weights
    demand_factor = get_demand_factor(product) * 0.30
    inventory_factor = get_inventory_factor(product) * 0.25
    competitor_factor = get_competitor_factor(product) * 0.25
    time_factor = get_time_factor() * 0.10
    margin_factor = get_margin_factor(product) * 0.10
    
    # Combined multiplier
    multiplier = 1 + (demand_factor + inventory_factor + 
                      competitor_factor + time_factor + margin_factor - 0.5)
    
    optimal_price = base * multiplier
    
    # Apply constraints
    min_price = product.cost * 1.15  # Minimum 15% margin
    max_price = product.base_price * 1.25  # Max 25% above base
    
    return max(min_price, min(optimal_price, max_price))
```

---

## Price Elasticity Model

### Định Nghĩa

```
Price Elasticity of Demand (PED) = % Change in Quantity / % Change in Price

PED = (ΔQ/Q) / (ΔP/P)

Interpretation:
  |PED| > 1:  Elastic (nhạy cảm giá) → giảm giá tăng revenue
  |PED| < 1:  Inelastic (ít nhạy cảm) → tăng giá tăng revenue
  |PED| = 1:  Unit elastic
```

### Calculating from Historical Data

```python
def calculate_elasticity(product_id, lookback_days=90):
    # Get price-quantity pairs
    data = get_sales_data(product_id, lookback_days)
    
    # Group by price points
    price_demand = data.groupby('price').agg({
        'quantity': 'sum',
        'date': 'count'  # number of days at this price
    })
    
    # Calculate average daily demand at each price
    price_demand['daily_demand'] = price_demand['quantity'] / price_demand['date']
    
    # Fit log-linear demand curve: log(Q) = a - b*log(P)
    # PED = -b
    log_prices = np.log(price_demand.index)
    log_demands = np.log(price_demand['daily_demand'])
    
    slope, intercept = np.polyfit(log_prices, log_demands, 1)
    
    return -slope  # Price elasticity
```

### Elasticity by Category (Typical for VLXD)

| Category | Elasticity | Interpretation |
|----------|------------|----------------|
| Xi măng | -0.8 | Inelastic (thiết yếu) |
| Thép | -1.2 | Elastic (có thể thay thế) |
| Cát, đá | -0.6 | Very inelastic |
| Gạch trang trí | -1.5 | Elastic (không thiết yếu) |
| Sơn | -1.3 | Elastic (nhiều lựa chọn) |

---

## Revenue Optimization

### Objective Function

```
Maximize: Revenue = P × Q(P)

Where:
  P = Price
  Q(P) = Demand as function of price
  Q(P) = Q₀ × (P/P₀)^(-ε)
  ε = Price elasticity (positive value)
```

### Optimal Price Formula

```
P* = MC × ε / (ε - 1)

Where:
  P* = Optimal price
  MC = Marginal cost
  ε = Price elasticity (absolute value)

Example:
  MC = 100,000đ
  ε = 1.5
  P* = 100,000 × 1.5 / (1.5 - 1) = 100,000 × 3 = 300,000đ
```

### Profit Optimization

```
Maximize: Profit = (P - C) × Q(P)

Taking derivative and solving:
  dProfit/dP = 0
  
  P* = C × ε / (ε - 1)
```

---

## Machine Learning Approach

### Model: Demand Prediction + Price Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                    ML PRICING MODEL                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Stage 1: Demand Prediction]                               │
│       │                                                     │
│       ├── Features:                                         │
│       │   - Price (current)                                 │
│       │   - Day of week                                     │
│       │   - Month/Season                                    │
│       │   - Competitor price                                │
│       │   - Inventory level                                 │
│       │   - Historical demand                               │
│       │                                                     │
│       └── Model: XGBoost Regressor                          │
│           Output: Predicted_Demand(Price)                   │
│                                                             │
│  [Stage 2: Price Optimization]                              │
│       │                                                     │
│       ├── For each candidate price P:                       │
│       │   - Predicted_Demand = Model.predict(features, P)   │
│       │   - Revenue = P × Predicted_Demand                  │
│       │   - Profit = (P - Cost) × Predicted_Demand          │
│       │                                                     │
│       └── Select P that maximizes objective                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Feature Engineering

```python
features = {
    # Price features
    'current_price': float,
    'price_vs_competitor': float,  # ratio
    'price_vs_30d_avg': float,
    
    # Demand features
    'demand_7d': float,  # last 7 days
    'demand_30d': float,
    'demand_trend': float,  # slope
    
    # Inventory features
    'stock_level': float,
    'days_of_stock': float,
    'stock_vs_avg': float,
    
    # Time features
    'day_of_week': int,
    'month': int,
    'is_weekend': bool,
    'is_holiday': bool,
    
    # Category features
    'category_encoded': int,
    'brand_encoded': int
}
```

---

## Ví Dụ Tính Toán

### Scenario

```
Product: Xi măng Holcim PCB40
Base Price: 95,000đ/bao
Cost: 78,000đ/bao
Current Stock: 500 bao
Avg Daily Sales: 15 bao
Competitor Avg Price: 93,000đ
Season: Mùa xây dựng (T5)
```

### Factor Calculation

```
1. Demand Factor:
   demand_index = current_demand / avg_demand = 18/15 = 1.2
   Demand_Multiplier = 1.08 (tăng 8%)

2. Inventory Factor:
   days_of_stock = 500/15 = 33 days (healthy)
   Inventory_Multiplier = 1.00

3. Competitor Factor:
   Our price: 95,000
   Competitor: 93,000
   Ratio: 1.02 (cao hơn 2%)
   Strategy: Match → Competitor_Multiplier = 0.98

4. Time Factor:
   Mùa xây dựng → Time_Multiplier = 1.05

5. Combined:
   Optimal = 95,000 × 1.08 × 1.00 × 0.98 × 1.05
           = 105,524đ
   
   Check margin: (105,524 - 78,000) / 105,524 = 26% ✓
   Check max: 105,524 < 95,000 × 1.25 = 118,750 ✓

Final Recommended Price: 105,000đ (rounded)
```

---

## API Specification

### Endpoint: Get Price Recommendation

```
POST /api/pricing/recommend
```

### Request

```json
{
  "productId": "prod_123",
  "objective": "REVENUE",  // REVENUE | PROFIT | VOLUME
  "constraints": {
    "minMargin": 0.15,
    "maxPriceChange": 0.20,
    "competitorMatch": true
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "productId": "prod_123",
    "productName": "Xi măng Holcim PCB40",
    "currentPrice": 95000,
    "recommendedPrice": 105000,
    "priceChange": "+10.5%",
    "factors": {
      "demand": { "value": 1.08, "reason": "High demand period" },
      "inventory": { "value": 1.00, "reason": "Healthy stock" },
      "competitor": { "value": 0.98, "reason": "Match market" },
      "time": { "value": 1.05, "reason": "Construction season" }
    },
    "projections": {
      "expectedDemand": 16,
      "expectedRevenue": 1680000,
      "expectedProfit": 432000,
      "confidence": 0.78
    },
    "constraints": {
      "marginAchieved": 0.26,
      "withinPriceBounds": true
    }
  }
}
```

### Endpoint: Batch Price Update

```
POST /api/pricing/batch-update
```

### Request

```json
{
  "categoryId": "cement",
  "objective": "PROFIT",
  "applyAutomatically": false
}
```

---

## Dashboard Visualization

```
┌────────────────────────────────────────────────────────────┐
│  💰 DYNAMIC PRICING DASHBOARD                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Price Recommendations Today:                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Product          Current   Recommend  Change  Conf. │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Xi măng Holcim   95,000    105,000   +10.5%   78%  │   │
│  │ Thép Pomina      18,500    17,800    -3.8%    85%  │   │
│  │ Cát xây dựng     180,000   180,000    0%      90%  │   │
│  │ Gạch Đồng Tâm    85,000    89,000    +4.7%    72%  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  📊 Revenue Impact Simulation:                             │
│  Current Strategy:  1,250,000,000đ/month                   │
│  Optimized:         1,380,000,000đ/month (+10.4%)          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Python Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| scikit-learn | 1.3.x | ML models |
| xgboost | 1.7.x | Demand prediction |
| scipy | 1.11.x | Optimization |
| pandas | 2.0.x | Data processing |
| Flask | 3.0.x | API server |

### Infrastructure

| Component | Platform |
|-----------|----------|
| Pricing API | Render Free |
| Scheduler | GitHub Actions (daily) |
| Database | MongoDB Atlas |
| Scraper | GitHub Actions (competitor prices) |

---

## Metrics & Evaluation

### A/B Testing

| Metric | Control | Dynamic Pricing |
|--------|---------|-----------------|
| Revenue per product | Baseline | Target: +8-12% |
| Profit margin | Baseline | Target: +3-5% |
| Sales volume | Baseline | Maintain ±5% |
| Customer satisfaction | Baseline | Maintain |

### Model Performance

| Metric | Target |
|--------|--------|
| Demand Prediction MAPE | < 15% |
| Price Recommendation Accuracy | > 70% |
| Revenue Lift | > 8% |

---

## Ưu Điểm & Hạn Chế

### Ưu Điểm
1. **Revenue optimization**: Tối ưu hóa doanh thu tự động
2. **Market responsive**: Phản ứng nhanh với thị trường
3. **Inventory management**: Giúp clear hàng tồn
4. **Competitive**: Cạnh tranh hiệu quả hơn

### Hạn Chế
1. **Data hungry**: Cần nhiều dữ liệu lịch sử
2. **Customer perception**: Khách có thể phản ứng tiêu cực với giá thay đổi
3. **Complexity**: Cần monitor và fine-tune liên tục
4. **Competitor data**: Cần scrape giá đối thủ (có thể bị chặn)

---

*Tài liệu được tạo: 08/01/2026*
*Phiên bản: 1.0*
