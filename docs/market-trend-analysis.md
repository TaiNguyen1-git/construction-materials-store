# Tài Liệu Kỹ Thuật: Hệ Thống Phân Tích Xu Hướng Thị Trường (Market Trend Analysis)

## Tổng Quan

### Mục Tiêu
Xây dựng hệ thống thu thập, phân tích và dự báo xu hướng giá vật liệu xây dựng, giúp doanh nghiệp đưa ra quyết định nhập hàng, định giá và chiến lược kinh doanh chính xác.

### Phạm Vi
- **Nguồn dữ liệu**: Web scraping từ các nguồn công khai
- **Loại dữ liệu**: Giá VLXD, tin tức ngành, chỉ số kinh tế
- **Tần suất**: Cập nhật hàng ngày
- **Dự báo**: 1-3 tháng tới

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│              MARKET TREND ANALYSIS SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Data Collection Layer]                                    │
│       ├── Price Scraper (daily)                             │
│       ├── News Scraper (daily)                              │
│       └── Economic Indicators API                           │
│                     │                                       │
│                     ↓                                       │
│  [Data Processing Layer]                                    │
│       ├── Data cleaning & validation                        │
│       ├── Price normalization                               │
│       └── Feature extraction                                │
│                     │                                       │
│                     ↓                                       │
│  [Analysis Layer]                                           │
│       ├── Time Series Analysis                              │
│       ├── Trend Detection                                   │
│       ├── Anomaly Detection                                 │
│       └── Sentiment Analysis (news)                         │
│                     │                                       │
│                     ↓                                       │
│  [Forecasting Layer]                                        │
│       ├── ARIMA / Prophet                                   │
│       └── Ensemble predictions                              │
│                     │                                       │
│                     ↓                                       │
│  [Output Layer]                                             │
│       ├── Price trend charts                                │
│       ├── Alerts & notifications                            │
│       └── Recommendations                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Nguồn Dữ Liệu

### 1. Nguồn Giá VLXD

| Nguồn | URL | Tần suất | Dữ liệu |
|-------|-----|----------|---------|
| **Bộ Xây Dựng** | giavlxd.xaydung.gov.vn | Hàng tuần | Giá tham khảo chính thức |
| **VLXD.com** | vlxd.com.vn | Hàng ngày | Giá thị trường |
| **Thép Online** | steelonline.vn | Hàng ngày | Giá thép |
| **Báo giá NCC** | Nhiều nguồn | Theo đợt | Giá từ nhà cung cấp |

### 2. Nguồn Tin Tức

| Nguồn | Loại | Mục đích |
|-------|------|----------|
| vnexpress.net | Kinh tế | Tin vĩ mô |
| cafef.vn | Tài chính | Giá nguyên liệu thế giới |
| baoxaydung.com.vn | Ngành | Tin xây dựng |
| batdongsan.com.vn | BĐS | Dự án mới |

### 3. Chỉ Số Kinh Tế

| Indicator | Nguồn | Ảnh hưởng |
|-----------|-------|-----------|
| CPI | GSO | Lạm phát → giá VLXD |
| Tỷ giá USD | NHNN | Giá nhập khẩu |
| Giá dầu thế giới | Reuters | Chi phí vận chuyển |
| Giá thép thế giới | LME | Giá thép trong nước |

---

## Web Scraping System

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPING SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [GitHub Actions]                                           │
│       │  Schedule: 0 6 * * * (6AM daily)                    │
│       │                                                     │
│       ↓                                                     │
│  [Python Scraper]                                           │
│       │                                                     │
│       ├── requests + BeautifulSoup (static pages)           │
│       ├── Selenium (JS-rendered pages)                      │
│       └── Rate limiting (1 req/3s)                          │
│                     │                                       │
│                     ↓                                       │
│  [Data Validation]                                          │
│       ├── Schema validation                                 │
│       ├── Outlier detection                                 │
│       └── Duplicate check                                   │
│                     │                                       │
│                     ↓                                       │
│  [MongoDB Atlas]                                            │
│       └── Collection: market_prices                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Scraper Code Structure

```python
# scrapers/price_scraper.py

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time

class VLXDPriceScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
            'Accept-Language': 'vi-VN,vi;q=0.9'
        }
        self.delay = 3  # seconds between requests
    
    def scrape_cement_prices(self):
        """Scrape cement prices from source"""
        url = "https://example.com/gia-xi-mang"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            prices = []
            for row in soup.select('.price-table tbody tr'):
                product_name = row.select_one('.product-name').text.strip()
                price_text = row.select_one('.price').text.strip()
                
                price = self.parse_price(price_text)
                
                prices.append({
                    'product': product_name,
                    'category': 'cement',
                    'price': price,
                    'unit': 'VND/bao',
                    'source': 'example.com',
                    'scraped_at': datetime.utcnow()
                })
            
            return prices
            
        except Exception as e:
            print(f"Error scraping: {e}")
            return []
    
    def parse_price(self, text):
        """Parse Vietnamese price format"""
        # "95.000đ" -> 95000
        clean = text.replace('.', '').replace(',', '').replace('đ', '').strip()
        return int(clean)
```

### Data Schema

```python
price_record = {
    "_id": ObjectId,
    "product_name": str,          # "Xi măng Holcim PCB40"
    "category": str,              # "cement"
    "brand": str,                 # "Holcim"
    "price": float,               # 95000
    "unit": str,                  # "VND/bao"
    "region": str,                # "Dong Nai"
    "source": str,                # "giavlxd.xaydung.gov.vn"
    "source_url": str,
    "scraped_at": datetime,
    "valid_from": datetime,
    "valid_to": datetime,
    "metadata": {
        "spec": str,              # "PCB40 50kg"
        "min_quantity": int,
        "delivery_included": bool
    }
}
```

---

## Time Series Analysis

### 1. Trend Detection

```python
def detect_trend(prices, window=7):
    """
    Detect price trend using moving average
    
    Returns: 'UP', 'DOWN', 'STABLE'
    """
    if len(prices) < window * 2:
        return 'INSUFFICIENT_DATA'
    
    # Calculate short-term and long-term MA
    short_ma = np.mean(prices[-window:])
    long_ma = np.mean(prices[-window*2:-window])
    
    change_percent = (short_ma - long_ma) / long_ma * 100
    
    if change_percent > 3:
        return 'UP'
    elif change_percent < -3:
        return 'DOWN'
    else:
        return 'STABLE'
```

### 2. Seasonality Analysis

```python
from statsmodels.tsa.seasonal import seasonal_decompose

def analyze_seasonality(price_series, period=30):
    """
    Decompose price series into trend, seasonal, and residual
    """
    result = seasonal_decompose(price_series, model='multiplicative', period=period)
    
    return {
        'trend': result.trend,
        'seasonal': result.seasonal,
        'residual': result.resid,
        'seasonal_strength': calculate_seasonal_strength(result)
    }
```

### 3. Anomaly Detection

```python
def detect_price_anomaly(current_price, historical_prices, threshold=2.5):
    """
    Detect if current price is an anomaly using Z-score
    """
    mean = np.mean(historical_prices)
    std = np.std(historical_prices)
    
    z_score = (current_price - mean) / std
    
    if abs(z_score) > threshold:
        direction = 'HIGH' if z_score > 0 else 'LOW'
        return {
            'is_anomaly': True,
            'z_score': z_score,
            'direction': direction,
            'expected_range': (mean - threshold*std, mean + threshold*std)
        }
    
    return {'is_anomaly': False}
```

---

## Forecasting Models

### 1. ARIMA (AutoRegressive Integrated Moving Average)

```python
from statsmodels.tsa.arima.model import ARIMA

def forecast_arima(prices, periods=30):
    """
    Forecast prices using ARIMA model
    """
    # Fit model (p, d, q parameters)
    model = ARIMA(prices, order=(2, 1, 2))
    fitted = model.fit()
    
    # Forecast
    forecast = fitted.forecast(steps=periods)
    conf_int = fitted.get_forecast(steps=periods).conf_int()
    
    return {
        'forecast': forecast.tolist(),
        'lower_bound': conf_int.iloc[:, 0].tolist(),
        'upper_bound': conf_int.iloc[:, 1].tolist(),
        'model': 'ARIMA(2,1,2)',
        'aic': fitted.aic
    }
```

### 2. Prophet (Facebook)

```python
from prophet import Prophet

def forecast_prophet(df, periods=30):
    """
    Forecast using Prophet
    
    df: DataFrame with columns 'ds' (date) and 'y' (price)
    """
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05
    )
    
    model.fit(df)
    
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    
    return {
        'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods),
        'trend': forecast['trend'].tolist(),
        'model': 'Prophet'
    }
```

### 3. Ensemble Forecast

```python
def ensemble_forecast(prices, periods=30):
    """
    Combine multiple models for robust forecast
    """
    arima_forecast = forecast_arima(prices, periods)
    prophet_forecast = forecast_prophet(prices, periods)
    
    # Weighted average (adjustable based on historical accuracy)
    weights = {'arima': 0.4, 'prophet': 0.6}
    
    ensemble = []
    for i in range(periods):
        combined = (weights['arima'] * arima_forecast['forecast'][i] +
                    weights['prophet'] * prophet_forecast['forecast'][i])
        ensemble.append(combined)
    
    return {
        'forecast': ensemble,
        'models_used': ['ARIMA', 'Prophet'],
        'weights': weights
    }
```

---

## News Sentiment Analysis

### Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  NEWS ANALYSIS PIPELINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Scrape News]                                              │
│       │ Keywords: "giá thép", "giá xi măng", "VLXD"         │
│       │                                                     │
│       ↓                                                     │
│  [Extract Entities]                                         │
│       │ Products: thép, xi măng, cát, đá                    │
│       │ Actions: tăng, giảm, ổn định                        │
│       │ Numbers: +5%, 100,000đ                              │
│       │                                                     │
│       ↓                                                     │
│  [Sentiment Analysis]                                       │
│       │ Bearish: giá giảm, nguồn cung dồi dào               │
│       │ Bullish: giá tăng, thiếu hụt, nhu cầu cao           │
│       │                                                     │
│       ↓                                                     │
│  [Market Signal]                                            │
│       └── "Thép: BULLISH (3 tin tăng giá trong 7 ngày)"     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Signal Generation

```python
def generate_market_signal(product_category, news_items):
    """
    Generate market signal from news sentiment
    """
    bullish_keywords = ['tăng', 'cao', 'thiếu hụt', 'nhu cầu', 'khan hiếm']
    bearish_keywords = ['giảm', 'thấp', 'dư thừa', 'giảm cầu', 'tồn kho']
    
    bullish_count = 0
    bearish_count = 0
    
    for news in news_items:
        text = news['title'] + ' ' + news['summary']
        
        for word in bullish_keywords:
            if word in text.lower():
                bullish_count += 1
                
        for word in bearish_keywords:
            if word in text.lower():
                bearish_count += 1
    
    if bullish_count > bearish_count + 2:
        return 'BULLISH'
    elif bearish_count > bullish_count + 2:
        return 'BEARISH'
    else:
        return 'NEUTRAL'
```

---

## API Specification

### Endpoint: Get Price Trends

```
GET /api/market/trends?category=cement&period=30d
```

### Response

```json
{
  "success": true,
  "data": {
    "category": "cement",
    "period": "30d",
    "summary": {
      "trend": "UP",
      "changePercent": 5.2,
      "currentAvgPrice": 98500,
      "previousAvgPrice": 93600
    },
    "priceHistory": [
      { "date": "2025-12-10", "avgPrice": 93000, "minPrice": 91000, "maxPrice": 96000 },
      { "date": "2025-12-17", "avgPrice": 95000, "minPrice": 93000, "maxPrice": 98000 },
      ...
    ],
    "forecast": {
      "next30Days": {
        "prediction": 102000,
        "lowerBound": 98000,
        "upperBound": 106000,
        "confidence": 0.75
      }
    },
    "signals": {
      "technical": "UP",
      "news": "BULLISH",
      "combined": "STRONG_BUY"
    },
    "recommendation": "Giá xi măng dự kiến tăng 3-5% trong 30 ngày tới. Đề xuất tăng stock."
  }
}
```

### Endpoint: Get Alerts

```
GET /api/market/alerts?active=true
```

### Response

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_001",
        "type": "PRICE_SPIKE",
        "severity": "HIGH",
        "product": "Thép Hòa Phát D10",
        "message": "Giá tăng 8% trong 7 ngày, cao hơn 2.5 std so với trung bình",
        "currentPrice": 19500,
        "expectedPrice": 18000,
        "createdAt": "2026-01-08T06:00:00Z",
        "actions": ["Review pricing", "Check competitor"]
      }
    ]
  }
}
```

---

## Dashboard Visualization

```
┌────────────────────────────────────────────────────────────┐
│  📈 MARKET TRENDS DASHBOARD                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Price Trend Chart - 30 Days]                             │
│  ┌────────────────────────────────────────────────┐        │
│  │     ╱╲                                  ╱╲     │        │
│  │    ╱  ╲    ___                        ╱  ╲    │        │
│  │   ╱    ╲__╱   ╲____          ________╱    ╲   │        │
│  │  ╱                  ╲________╱               │        │
│  │ ╱                                             │        │
│  └────────────────────────────────────────────────┘        │
│    Xi măng ▲+5.2%  |  Thép ▲+3.1%  |  Cát ▼-1.2%          │
│                                                            │
│  🔮 FORECAST (30 days):                                    │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │ Xi măng      │ Thép         │ Cát          │           │
│  │ ▲ +3-5%      │ ▲ +2-4%      │ ─ ±1%        │           │
│  │ Conf: 75%   │ Conf: 70%   │ Conf: 85%   │           │
│  └──────────────┴──────────────┴──────────────┘           │
│                                                            │
│  ⚠️ ALERTS:                                                │
│  • Thép Hòa Phát: Giá tăng bất thường (+8%)               │
│  • Tin tức: 3 bài về thiếu hụt xi măng miền Nam           │
│                                                            │
│  📰 LATEST NEWS:                                           │
│  • "Giá thép thế giới tăng do cầu Trung Quốc" - VnExpress │
│  • "Dự án hạ tầng 2026 đẩy nhu cầu VLXD" - CafeF          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Python Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| requests | 2.31.x | HTTP requests |
| beautifulsoup4 | 4.12.x | HTML parsing |
| selenium | 4.15.x | Dynamic pages |
| pandas | 2.0.x | Data processing |
| statsmodels | 0.14.x | ARIMA |
| prophet | 1.1.x | Forecasting |
| Flask | 3.0.x | API server |
| pymongo | 4.5.x | MongoDB driver |

### Infrastructure

| Component | Platform | Schedule |
|-----------|----------|----------|
| Scraper | GitHub Actions | Daily 6AM |
| ML API | Render Free | On-demand |
| Database | MongoDB Atlas | Always-on |
| Alerts | GitHub Actions | Every 4 hours |

---

## Ethical & Legal Considerations

### Web Scraping Guidelines

1. **Respect robots.txt**: Check and follow robots.txt rules
2. **Rate limiting**: Maximum 1 request per 3 seconds
3. **User-Agent**: Use honest, identifiable user agent
4. **Data usage**: Only for internal business intelligence
5. **No login bypass**: Only scrape public data
6. **Attribution**: Cite sources in reports

### Data Privacy

- No personal data collection
- Only aggregate market data
- Comply with website terms of service

---

## Metrics & Evaluation

### Forecasting Accuracy

| Metric | Target | Description |
|--------|--------|-------------|
| MAPE | < 10% | Mean Absolute Percentage Error |
| RMSE | < 5000 | Root Mean Square Error (VND) |
| Direction Accuracy | > 70% | Đúng hướng tăng/giảm |

### Business Metrics

| Metric | Measurement |
|--------|-------------|
| Inventory Optimization | Reduce overstock by 15% |
| Procurement Timing | Buy 3-5% cheaper on average |
| Alert Usefulness | 80% alerts actionable |

---

## Ưu Điểm & Hạn Chế

### Ưu Điểm
1. **Proactive**: Biết trước xu hướng giá
2. **Data-driven**: Quyết định dựa trên dữ liệu
3. **Competitive advantage**: Mua hàng đúng thời điểm
4. **Automated**: Cập nhật tự động hàng ngày

### Hạn Chế
1. **Scraping fragility**: Website thay đổi → scraper hỏng
2. **External factors**: Không dự đoán được thiên tai, chính sách
3. **Data quality**: Phụ thuộc vào nguồn dữ liệu
4. **Maintenance**: Cần maintain scraper thường xuyên

---

*Tài liệu được tạo: 08/01/2026*
*Phiên bản: 1.0*
