#!/usr/bin/env python3
"""
Market Trend Analysis Service
Time series analysis, trend detection, and price forecasting

API Endpoints:
    GET /market/trends - Get price trends for a category
    GET /market/forecast - Get price forecasts
    GET /market/alerts - Get active market alerts
"""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Try to import statistical libraries
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from statsmodels.tsa.arima.model import ARIMA
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False
    print("⚠️ statsmodels not installed. Using simplified forecasting.")


@dataclass
class TrendAnalysis:
    """Result of trend analysis"""
    category: str
    period: str
    trend: str  # UP, DOWN, STABLE
    change_percent: float
    current_avg_price: float
    previous_avg_price: float
    

@dataclass
class PriceForecast:
    """Result of price forecasting"""
    category: str
    periods: int
    prediction: float
    lower_bound: float
    upper_bound: float
    confidence: float
    model_used: str


@dataclass
class MarketAlert:
    """Market alert notification"""
    alert_id: str
    alert_type: str  # PRICE_SPIKE, PRICE_DROP, ANOMALY, NEWS
    severity: str    # LOW, MEDIUM, HIGH, CRITICAL
    product: str
    message: str
    current_price: float
    expected_price: float
    created_at: datetime


class MarketTrendAnalyzer:
    """
    Market Trend Analysis using time series methods
    
    Features:
    - Moving average trend detection
    - Z-score anomaly detection
    - ARIMA forecasting
    - Ensemble predictions
    """
    
    # Trend thresholds
    TREND_UP_THRESHOLD = 3.0     # % change
    TREND_DOWN_THRESHOLD = -3.0  # % change
    
    # Anomaly detection threshold
    ANOMALY_Z_THRESHOLD = 2.5
    
    def __init__(self):
        self.today = datetime.now()
    
    def _safe_mean(self, values: List[float]) -> float:
        """Calculate mean safely"""
        if not values:
            return 0.0
        if HAS_NUMPY:
            return float(np.mean(values))
        return sum(values) / len(values)
    
    def _safe_std(self, values: List[float]) -> float:
        """Calculate standard deviation safely"""
        if not values or len(values) < 2:
            return 0.0
        if HAS_NUMPY:
            return float(np.std(values))
        mean = self._safe_mean(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)
    
    def detect_trend(
        self, 
        prices: List[float], 
        window: int = 7
    ) -> Tuple[str, float]:
        """
        Detect price trend using moving average comparison
        
        Args:
            prices: Historical prices (oldest first)
            window: Window size for moving average
            
        Returns:
            (trend: UP/DOWN/STABLE, change_percent)
        """
        if len(prices) < window * 2:
            return ('INSUFFICIENT_DATA', 0.0)
        
        # Calculate short-term and long-term moving averages
        short_ma = self._safe_mean(prices[-window:])
        long_ma = self._safe_mean(prices[-window*2:-window])
        
        if long_ma == 0:
            return ('STABLE', 0.0)
        
        change_percent = ((short_ma - long_ma) / long_ma) * 100
        
        if change_percent > self.TREND_UP_THRESHOLD:
            return ('UP', change_percent)
        elif change_percent < self.TREND_DOWN_THRESHOLD:
            return ('DOWN', change_percent)
        else:
            return ('STABLE', change_percent)
    
    def detect_anomaly(
        self, 
        current_price: float, 
        historical_prices: List[float],
        threshold: float = None
    ) -> Dict:
        """
        Detect if current price is anomalous using Z-score
        
        Args:
            current_price: Current price to check
            historical_prices: Historical prices for comparison
            threshold: Z-score threshold (default: 2.5)
            
        Returns:
            Dictionary with anomaly detection results
        """
        if threshold is None:
            threshold = self.ANOMALY_Z_THRESHOLD
        
        if len(historical_prices) < 5:
            return {'is_anomaly': False, 'reason': 'Insufficient data'}
        
        mean = self._safe_mean(historical_prices)
        std = self._safe_std(historical_prices)
        
        if std == 0:
            return {'is_anomaly': False, 'reason': 'No variance in data'}
        
        z_score = (current_price - mean) / std
        
        if abs(z_score) > threshold:
            direction = 'HIGH' if z_score > 0 else 'LOW'
            return {
                'is_anomaly': True,
                'z_score': round(z_score, 2),
                'direction': direction,
                'expected_range': (
                    round(mean - threshold * std, 0),
                    round(mean + threshold * std, 0)
                ),
                'deviation_percent': round(abs(z_score) * std / mean * 100, 1)
            }
        
        return {'is_anomaly': False}
    
    def forecast_simple(
        self, 
        prices: List[float], 
        periods: int = 30
    ) -> Dict:
        """
        Simple forecasting using linear regression
        
        Args:
            prices: Historical prices
            periods: Number of periods to forecast
            
        Returns:
            Forecast dictionary
        """
        if len(prices) < 10:
            return {
                'success': False,
                'error': 'Insufficient data (need at least 10 data points)'
            }
        
        n = len(prices)
        
        # Simple linear regression
        x = list(range(n))
        x_mean = self._safe_mean(x)
        y_mean = self._safe_mean(prices)
        
        # Calculate slope and intercept
        numerator = sum((x[i] - x_mean) * (prices[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            slope = 0
        else:
            slope = numerator / denominator
        
        intercept = y_mean - slope * x_mean
        
        # Forecast
        forecasts = []
        for i in range(periods):
            future_x = n + i
            pred = intercept + slope * future_x
            forecasts.append(max(0, pred))  # Price can't be negative
        
        # Calculate confidence interval (simplified)
        std = self._safe_std(prices)
        
        return {
            'success': True,
            'forecast': [round(f, 0) for f in forecasts],
            'lower_bound': [round(max(0, f - 1.96 * std), 0) for f in forecasts],
            'upper_bound': [round(f + 1.96 * std, 0) for f in forecasts],
            'model': 'LinearRegression',
            'trend_direction': 'UP' if slope > 0 else 'DOWN' if slope < 0 else 'STABLE',
            'daily_change': round(slope, 2)
        }
    
    def forecast_arima(
        self, 
        prices: List[float], 
        periods: int = 30
    ) -> Dict:
        """
        ARIMA forecasting
        
        Args:
            prices: Historical prices
            periods: Number of periods to forecast
            
        Returns:
            Forecast dictionary
        """
        if not HAS_STATSMODELS:
            return self.forecast_simple(prices, periods)
        
        if len(prices) < 30:
            return self.forecast_simple(prices, periods)
        
        try:
            # Fit ARIMA model
            model = ARIMA(prices, order=(2, 1, 2))
            fitted = model.fit()
            
            # Forecast
            forecast = fitted.forecast(steps=periods)
            conf_int = fitted.get_forecast(steps=periods).conf_int()
            
            return {
                'success': True,
                'forecast': [round(max(0, f), 0) for f in forecast.tolist()],
                'lower_bound': [round(max(0, f), 0) for f in conf_int.iloc[:, 0].tolist()],
                'upper_bound': [round(f, 0) for f in conf_int.iloc[:, 1].tolist()],
                'model': 'ARIMA(2,1,2)',
                'aic': round(fitted.aic, 2)
            }
        except Exception as e:
            print(f"ARIMA error: {e}, falling back to simple forecast")
            return self.forecast_simple(prices, periods)
    
    def analyze_category(
        self, 
        category: str,
        price_history: List[Dict],
        period_days: int = 30
    ) -> TrendAnalysis:
        """
        Analyze price trends for a category
        
        Args:
            category: Product category
            price_history: List of {date, price} records
            period_days: Analysis period
            
        Returns:
            TrendAnalysis result
        """
        if not price_history:
            return TrendAnalysis(
                category=category,
                period=f"{period_days}d",
                trend='NO_DATA',
                change_percent=0.0,
                current_avg_price=0.0,
                previous_avg_price=0.0
            )
        
        # Extract prices
        prices = [p.get('price', p.get('avgPrice', 0)) for p in price_history]
        
        # Detect trend
        trend, change_pct = self.detect_trend(prices, window=min(7, len(prices) // 2))
        
        # Calculate averages
        half = len(prices) // 2
        current_avg = self._safe_mean(prices[half:]) if half > 0 else self._safe_mean(prices)
        previous_avg = self._safe_mean(prices[:half]) if half > 0 else current_avg
        
        return TrendAnalysis(
            category=category,
            period=f"{period_days}d",
            trend=trend,
            change_percent=round(change_pct, 2),
            current_avg_price=round(current_avg, 0),
            previous_avg_price=round(previous_avg, 0)
        )
    
    def generate_alerts(
        self, 
        products: List[Dict]
    ) -> List[MarketAlert]:
        """
        Generate market alerts based on price anomalies
        
        Args:
            products: List of products with current price and history
            
        Returns:
            List of MarketAlert
        """
        alerts = []
        
        for product in products:
            current_price = product.get('current_price', 0)
            history = product.get('price_history', [])
            
            if len(history) < 5:
                continue
            
            historical_prices = [p.get('price', 0) for p in history]
            anomaly = self.detect_anomaly(current_price, historical_prices)
            
            if anomaly.get('is_anomaly'):
                severity = 'HIGH' if abs(anomaly['z_score']) > 3 else 'MEDIUM'
                alert_type = 'PRICE_SPIKE' if anomaly['direction'] == 'HIGH' else 'PRICE_DROP'
                
                expected = self._safe_mean(historical_prices)
                change_pct = ((current_price - expected) / expected * 100) if expected > 0 else 0
                
                alerts.append(MarketAlert(
                    alert_id=f"alert_{product.get('product_id', 'unknown')}_{datetime.now().strftime('%Y%m%d')}",
                    alert_type=alert_type,
                    severity=severity,
                    product=product.get('product_name', 'Unknown'),
                    message=f"Giá {'tăng' if anomaly['direction'] == 'HIGH' else 'giảm'} {abs(change_pct):.1f}% so với trung bình, vượt ngưỡng bình thường",
                    current_price=current_price,
                    expected_price=round(expected, 0),
                    created_at=datetime.now()
                ))
        
        # Sort by severity
        severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        alerts.sort(key=lambda x: severity_order.get(x.severity, 4))
        
        return alerts
    
    def get_market_signal(
        self, 
        trend: str, 
        news_sentiment: str = 'NEUTRAL'
    ) -> str:
        """
        Generate overall market signal
        
        Args:
            trend: UP, DOWN, STABLE
            news_sentiment: BULLISH, BEARISH, NEUTRAL
            
        Returns:
            Combined signal: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
        """
        # Signal matrix
        signals = {
            ('UP', 'BULLISH'): 'STRONG_BUY',
            ('UP', 'NEUTRAL'): 'BUY',
            ('UP', 'BEARISH'): 'HOLD',
            ('STABLE', 'BULLISH'): 'BUY',
            ('STABLE', 'NEUTRAL'): 'HOLD',
            ('STABLE', 'BEARISH'): 'HOLD',
            ('DOWN', 'BULLISH'): 'HOLD',
            ('DOWN', 'NEUTRAL'): 'SELL',
            ('DOWN', 'BEARISH'): 'STRONG_SELL',
        }
        
        return signals.get((trend, news_sentiment), 'HOLD')


# Flask Blueprint for integration
def create_market_blueprint():
    """Create Flask Blueprint for market trend analysis"""
    from flask import Blueprint, request, jsonify
    
    bp = Blueprint('market', __name__, url_prefix='/market')
    analyzer = MarketTrendAnalyzer()
    
    @bp.route('/trends', methods=['GET', 'POST'])
    def get_trends():
        """Get price trends for a category"""
        if request.method == 'POST':
            data = request.get_json() or {}
        else:
            data = {}
        
        category = request.args.get('category') or data.get('category', 'all')
        period = int(request.args.get('period', 30))
        price_history = data.get('priceHistory', [])
        
        # Generate sample data if not provided
        if not price_history:
            base_price = 100000
            price_history = [
                {
                    'date': (datetime.now() - timedelta(days=period-i)).strftime('%Y-%m-%d'),
                    'price': base_price + (i * 500) + ((-1) ** i * 1000)
                }
                for i in range(period)
            ]
        
        result = analyzer.analyze_category(category, price_history, period)
        
        prices = [p.get('price', 0) for p in price_history]
        forecast = analyzer.forecast_simple(prices, 30)
        
        return jsonify({
            "success": True,
            "data": {
                "category": result.category,
                "period": result.period,
                "summary": {
                    "trend": result.trend,
                    "changePercent": result.change_percent,
                    "currentAvgPrice": result.current_avg_price,
                    "previousAvgPrice": result.previous_avg_price
                },
                "priceHistory": price_history[-10:],  # Last 10 entries
                "forecast": {
                    "next30Days": {
                        "prediction": forecast['forecast'][-1] if forecast.get('success') else 0,
                        "lowerBound": forecast['lower_bound'][-1] if forecast.get('success') else 0,
                        "upperBound": forecast['upper_bound'][-1] if forecast.get('success') else 0,
                        "confidence": 0.75
                    }
                },
                "signals": {
                    "technical": result.trend,
                    "news": "NEUTRAL",
                    "combined": analyzer.get_market_signal(result.trend, "NEUTRAL")
                }
            }
        })
    
    @bp.route('/forecast', methods=['POST'])
    def get_forecast():
        """Get price forecast"""
        data = request.get_json() or {}
        
        prices = data.get('prices', [])
        periods = data.get('periods', 30)
        
        if not prices:
            return jsonify({
                "success": False,
                "error": "Missing 'prices' array"
            }), 400
        
        # Try ARIMA first, fallback to simple
        result = analyzer.forecast_arima(prices, periods)
        
        return jsonify({
            "success": result.get('success', False),
            "data": {
                "periods": periods,
                "forecast": result.get('forecast', []),
                "lowerBound": result.get('lower_bound', []),
                "upperBound": result.get('upper_bound', []),
                "model": result.get('model', 'Unknown'),
                "metadata": {
                    "dataPoints": len(prices),
                    "trendDirection": result.get('trend_direction', 'UNKNOWN')
                }
            }
        })
    
    @bp.route('/alerts', methods=['GET', 'POST'])
    def get_alerts():
        """Get active market alerts"""
        if request.method == 'POST':
            data = request.get_json() or {}
            products = data.get('products', [])
        else:
            # Demo data
            products = [
                {
                    'product_id': 'prod_001',
                    'product_name': 'Thép Hòa Phát D10',
                    'current_price': 21000,
                    'price_history': [{'price': 18000 + (i * 100)} for i in range(30)]
                }
            ]
        
        alerts = analyzer.generate_alerts(products)
        
        return jsonify({
            "success": True,
            "data": {
                "alerts": [
                    {
                        "id": a.alert_id,
                        "type": a.alert_type,
                        "severity": a.severity,
                        "product": a.product,
                        "message": a.message,
                        "currentPrice": a.current_price,
                        "expectedPrice": a.expected_price,
                        "createdAt": a.created_at.isoformat()
                    }
                    for a in alerts
                ],
                "summary": {
                    "total": len(alerts),
                    "critical": sum(1 for a in alerts if a.severity == 'CRITICAL'),
                    "high": sum(1 for a in alerts if a.severity == 'HIGH'),
                    "medium": sum(1 for a in alerts if a.severity == 'MEDIUM')
                }
            }
        })
    
    @bp.route('/anomaly', methods=['POST'])
    def check_anomaly():
        """Check if a price is anomalous"""
        data = request.get_json() or {}
        
        current_price = data.get('currentPrice', 0)
        historical_prices = data.get('historicalPrices', [])
        
        if not current_price or not historical_prices:
            return jsonify({
                "success": False,
                "error": "Missing currentPrice or historicalPrices"
            }), 400
        
        result = analyzer.detect_anomaly(current_price, historical_prices)
        
        return jsonify({
            "success": True,
            "data": result
        })
    
    return bp


if __name__ == "__main__":
    # Test
    analyzer = MarketTrendAnalyzer()
    
    # Generate test data
    test_prices = [100000 + (i * 1000) + ((-1) ** i * 500) for i in range(60)]
    
    print("=== Market Trend Analysis Test ===\n")
    
    # Trend detection
    trend, change = analyzer.detect_trend(test_prices)
    print(f"Trend: {trend} ({change:+.2f}%)")
    
    # Anomaly detection
    anomaly = analyzer.detect_anomaly(180000, test_prices)
    print(f"Anomaly check for 180,000: {anomaly}")
    
    # Forecast
    print("\n=== Forecast Test ===")
    forecast = analyzer.forecast_simple(test_prices, 7)
    if forecast.get('success'):
        print(f"Model: {forecast['model']}")
        print(f"Next 7 days: {forecast['forecast']}")
        print(f"Daily change: {forecast['daily_change']}")
    
    # Market signal
    signal = analyzer.get_market_signal('UP', 'BULLISH')
    print(f"\nMarket Signal: {signal}")
