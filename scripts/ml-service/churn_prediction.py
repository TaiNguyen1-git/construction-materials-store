#!/usr/bin/env python3
"""
Customer Churn Prediction Service
Predicts probability of customer churning based on RFM analysis and behavioral features

API Endpoints:
    GET /churn/customer/<customer_id> - Get churn risk for single customer
    GET /churn/at-risk - Get list of at-risk customers
    POST /churn/predict - Predict churn for customer data
"""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class ChurnPrediction:
    """Result of churn prediction"""
    customer_id: str
    churn_probability: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors: List[Dict]
    recommendation: str
    rfm_scores: Dict


class ChurnPredictor:
    """
    Customer Churn Prediction using RFM Analysis + Behavioral Features
    
    Formula:
    Churn_Risk = w1×Recency_Risk + w2×Frequency_Risk + w3×Monetary_Risk + 
                 w4×Trend_Risk + w5×Engagement_Risk
    
    Weights: 0.30, 0.25, 0.15, 0.20, 0.10
    """
    
    # Risk calculation weights
    WEIGHTS = {
        'recency': 0.30,
        'frequency': 0.25,
        'monetary': 0.15,
        'trend': 0.20,
        'engagement': 0.10
    }
    
    # Risk level thresholds
    RISK_THRESHOLDS = {
        'LOW': (0, 0.4),
        'MEDIUM': (0.4, 0.6),
        'HIGH': (0.6, 0.8),
        'CRITICAL': (0.8, 1.0)
    }
    
    def __init__(self):
        self.today = datetime.now()
    
    def _calculate_recency_risk(self, days_since_last_order: int) -> float:
        """
        Calculate recency risk
        
        Args:
            days_since_last_order: Days since customer's last order
            
        Returns:
            Risk score 0.0 to 1.0
        """
        if days_since_last_order <= 30:
            return 0.0
        elif days_since_last_order <= 60:
            return 0.2
        elif days_since_last_order <= 90:
            return 0.5
        elif days_since_last_order <= 120:
            return 0.8
        else:
            return 1.0
    
    def _calculate_frequency_risk(self, orders_12m: int) -> float:
        """
        Calculate frequency risk
        
        Args:
            orders_12m: Number of orders in last 12 months
            
        Returns:
            Risk score 0.0 to 1.0
        """
        if orders_12m >= 12:  # Monthly buyer
            return 0.0
        elif orders_12m >= 6:  # Bi-monthly
            return 0.2
        elif orders_12m >= 3:  # Quarterly
            return 0.4
        elif orders_12m >= 1:  # Yearly
            return 0.7
        else:  # No orders
            return 1.0
    
    def _calculate_monetary_risk(self, total_spent_12m: float, avg_spent: float = 10000000) -> float:
        """
        Calculate monetary risk based on percentile rank
        
        Args:
            total_spent_12m: Total spent in last 12 months
            avg_spent: Average spending (for comparison)
            
        Returns:
            Risk score 0.0 to 1.0
        """
        ratio = total_spent_12m / avg_spent if avg_spent > 0 else 0
        
        if ratio >= 2.0:  # Top 20%
            return 0.0
        elif ratio >= 1.2:  # 20-40%
            return 0.2
        elif ratio >= 0.8:  # 40-60%
            return 0.4
        elif ratio >= 0.4:  # 60-80%
            return 0.6
        else:  # Bottom 20%
            return 0.8
    
    def _calculate_trend_risk(self, trend_spending: float, trend_frequency: float = 0) -> float:
        """
        Calculate trend risk based on spending/frequency changes
        
        Args:
            trend_spending: (recent_3m - previous_3m) / previous_3m
            trend_frequency: Optional frequency trend
            
        Returns:
            Risk score 0.0 to 1.0
        """
        # Use spending trend as primary indicator
        if trend_spending > 0.1:  # Growing
            return 0.0
        elif trend_spending > -0.1:  # Stable
            return 0.3
        elif trend_spending > -0.3:  # Slight decline
            return 0.6
        else:  # Significant decline
            return 1.0
    
    def _calculate_engagement_risk(
        self, 
        has_reviews: bool, 
        avg_rating_given: float = 0,
        support_tickets: int = 0,
        complaint_ratio: float = 0
    ) -> float:
        """
        Calculate engagement risk
        
        Args:
            has_reviews: Whether customer has written reviews
            avg_rating_given: Average rating given by customer
            support_tickets: Number of support tickets
            complaint_ratio: Ratio of complaints to total interactions
            
        Returns:
            Risk score 0.0 to 1.0
        """
        risk = 0.5  # Start at neutral
        
        # Reviews are positive engagement
        if has_reviews:
            risk -= 0.2
            # Low ratings indicate dissatisfaction
            if avg_rating_given > 0:
                if avg_rating_given < 3.0:
                    risk += 0.3
                elif avg_rating_given >= 4.0:
                    risk -= 0.1
        
        # High complaint ratio is bad
        if complaint_ratio > 0.3:
            risk += 0.3
        elif complaint_ratio > 0.1:
            risk += 0.1
        
        return max(0.0, min(1.0, risk))
    
    def _get_risk_level(self, probability: float) -> str:
        """Get risk level classification"""
        for level, (low, high) in self.RISK_THRESHOLDS.items():
            if low <= probability < high:
                return level
        return 'CRITICAL'
    
    def _get_risk_factors(
        self, 
        recency_risk: float, 
        frequency_risk: float,
        monetary_risk: float,
        trend_risk: float,
        engagement_risk: float,
        customer_data: Dict
    ) -> List[Dict]:
        """Generate list of risk factors for explanation"""
        factors = []
        
        if recency_risk > 0.5:
            days = customer_data.get('days_since_last_order', 0)
            factors.append({
                "factor": f"{days} ngày chưa đặt hàng",
                "impact": "HIGH" if recency_risk > 0.7 else "MEDIUM",
                "score": recency_risk
            })
        
        if trend_risk > 0.5:
            trend = customer_data.get('trend_spending', 0)
            trend_pct = abs(trend * 100)
            factors.append({
                "factor": f"Xu hướng chi tiêu giảm {trend_pct:.0f}%",
                "impact": "HIGH" if trend_risk > 0.7 else "MEDIUM",
                "score": trend_risk
            })
        
        if frequency_risk > 0.5:
            factors.append({
                "factor": "Tần suất đặt hàng thấp",
                "impact": "MEDIUM",
                "score": frequency_risk
            })
        
        if engagement_risk > 0.5:
            factors.append({
                "factor": "Mức độ tương tác thấp",
                "impact": "LOW",
                "score": engagement_risk
            })
        
        # Sort by impact
        impact_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        factors.sort(key=lambda x: impact_order.get(x['impact'], 3))
        
        return factors
    
    def _get_recommendation(self, risk_level: str, risk_factors: List[Dict]) -> str:
        """Generate intervention recommendation"""
        recommendations = {
            'CRITICAL': "Gọi điện trực tiếp + Giảm giá 20% cho đơn tiếp theo",
            'HIGH': "Gửi email khuyến mãi + Giảm giá 15%",
            'MEDIUM': "Push notification + Giảm giá 10%",
            'LOW': "Gửi newsletter thông thường"
        }
        return recommendations.get(risk_level, "Theo dõi thêm")
    
    def predict(self, customer_data: Dict) -> ChurnPrediction:
        """
        Predict churn probability for a customer
        
        Args:
            customer_data: Dictionary with customer features:
                - customer_id: Customer identifier
                - last_order_date: Date of last order (datetime or string)
                - orders_12m: Number of orders in 12 months
                - total_spent_12m: Total spent in 12 months
                - recent_3m_spent: Spending in recent 3 months
                - previous_3m_spent: Spending in previous 3 months
                - has_reviews: Whether has written reviews
                - avg_rating_given: Average rating given
                - support_tickets: Number of support tickets
                - complaint_ratio: Complaints / total interactions
                
        Returns:
            ChurnPrediction with probability and risk analysis
        """
        customer_id = customer_data.get('customer_id', 'unknown')
        
        # Calculate days since last order
        last_order = customer_data.get('last_order_date')
        if isinstance(last_order, str):
            try:
                last_order = datetime.fromisoformat(last_order.replace('Z', '+00:00'))
            except:
                last_order = self.today - timedelta(days=90)
        elif not last_order:
            last_order = self.today - timedelta(days=180)
        
        days_since_last = (self.today - last_order.replace(tzinfo=None)).days if hasattr(last_order, 'replace') else 90
        customer_data['days_since_last_order'] = days_since_last
        
        # Calculate trend
        recent_spent = customer_data.get('recent_3m_spent', 0)
        previous_spent = customer_data.get('previous_3m_spent', 1)
        trend_spending = (recent_spent - previous_spent) / previous_spent if previous_spent > 0 else -0.5
        customer_data['trend_spending'] = trend_spending
        
        # Calculate individual risks
        recency_risk = self._calculate_recency_risk(days_since_last)
        frequency_risk = self._calculate_frequency_risk(customer_data.get('orders_12m', 0))
        monetary_risk = self._calculate_monetary_risk(customer_data.get('total_spent_12m', 0))
        trend_risk = self._calculate_trend_risk(trend_spending)
        engagement_risk = self._calculate_engagement_risk(
            customer_data.get('has_reviews', False),
            customer_data.get('avg_rating_given', 0),
            customer_data.get('support_tickets', 0),
            customer_data.get('complaint_ratio', 0)
        )
        
        # Calculate weighted churn probability
        churn_probability = (
            self.WEIGHTS['recency'] * recency_risk +
            self.WEIGHTS['frequency'] * frequency_risk +
            self.WEIGHTS['monetary'] * monetary_risk +
            self.WEIGHTS['trend'] * trend_risk +
            self.WEIGHTS['engagement'] * engagement_risk
        )
        
        # Ensure probability is in valid range
        churn_probability = max(0.0, min(1.0, churn_probability))
        
        # Get risk level
        risk_level = self._get_risk_level(churn_probability)
        
        # Get risk factors
        risk_factors = self._get_risk_factors(
            recency_risk, frequency_risk, monetary_risk, 
            trend_risk, engagement_risk, customer_data
        )
        
        # Get recommendation
        recommendation = self._get_recommendation(risk_level, risk_factors)
        
        return ChurnPrediction(
            customer_id=customer_id,
            churn_probability=round(churn_probability, 3),
            risk_level=risk_level,
            risk_factors=risk_factors,
            recommendation=recommendation,
            rfm_scores={
                'recency_risk': round(recency_risk, 3),
                'frequency_risk': round(frequency_risk, 3),
                'monetary_risk': round(monetary_risk, 3),
                'trend_risk': round(trend_risk, 3),
                'engagement_risk': round(engagement_risk, 3)
            }
        )
    
    def predict_batch(self, customers: List[Dict]) -> List[ChurnPrediction]:
        """Predict churn for multiple customers"""
        return [self.predict(c) for c in customers]
    
    def get_at_risk_customers(
        self, 
        customers: List[Dict], 
        min_probability: float = 0.6,
        limit: int = 50
    ) -> Dict:
        """
        Get customers at risk of churning
        
        Args:
            customers: List of customer data
            min_probability: Minimum churn probability threshold
            limit: Maximum number of results
            
        Returns:
            Dictionary with at-risk customers and summary
        """
        predictions = self.predict_batch(customers)
        
        at_risk = [p for p in predictions if p.churn_probability >= min_probability]
        at_risk.sort(key=lambda x: x.churn_probability, reverse=True)
        at_risk = at_risk[:limit]
        
        # Summary
        critical = sum(1 for p in at_risk if p.risk_level == 'CRITICAL')
        high = sum(1 for p in at_risk if p.risk_level == 'HIGH')
        medium = sum(1 for p in at_risk if p.risk_level == 'MEDIUM')
        
        return {
            'total_at_risk': len(at_risk),
            'customers': at_risk,
            'summary': {
                'critical': critical,
                'high': high,
                'medium': medium
            }
        }


# Flask Blueprint for integration
def create_churn_blueprint():
    """Create Flask Blueprint for churn prediction"""
    from flask import Blueprint, request, jsonify
    
    bp = Blueprint('churn', __name__, url_prefix='/churn')
    predictor = ChurnPredictor()
    
    @bp.route('/customer/<customer_id>', methods=['GET'])
    def get_customer_risk(customer_id):
        """Get churn risk for single customer"""
        # In real implementation, fetch customer data from database
        # For now, return example based on query params
        
        customer_data = {
            'customer_id': customer_id,
            'last_order_date': request.args.get('lastOrderDate'),
            'orders_12m': int(request.args.get('orders12m', 0)),
            'total_spent_12m': float(request.args.get('totalSpent12m', 0)),
            'recent_3m_spent': float(request.args.get('recent3mSpent', 0)),
            'previous_3m_spent': float(request.args.get('previous3mSpent', 1)),
            'has_reviews': request.args.get('hasReviews', 'false').lower() == 'true',
            'avg_rating_given': float(request.args.get('avgRating', 0)),
            'support_tickets': int(request.args.get('supportTickets', 0)),
            'complaint_ratio': float(request.args.get('complaintRatio', 0))
        }
        
        result = predictor.predict(customer_data)
        
        return jsonify({
            "success": True,
            "data": {
                "customerId": result.customer_id,
                "churnProbability": result.churn_probability,
                "riskLevel": result.risk_level,
                "riskFactors": result.risk_factors,
                "recommendation": result.recommendation,
                "rfmScores": result.rfm_scores
            }
        })
    
    @bp.route('/predict', methods=['POST'])
    def predict_churn():
        """Predict churn for customer data"""
        data = request.get_json() or {}
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Missing customer data"
            }), 400
        
        result = predictor.predict(data)
        
        return jsonify({
            "success": True,
            "data": {
                "customerId": result.customer_id,
                "churnProbability": result.churn_probability,
                "riskLevel": result.risk_level,
                "riskFactors": result.risk_factors,
                "recommendation": result.recommendation,
                "rfmScores": result.rfm_scores
            }
        })
    
    @bp.route('/at-risk', methods=['GET', 'POST'])
    def get_at_risk():
        """Get list of at-risk customers"""
        min_prob = float(request.args.get('minProbability', 0.6))
        limit = int(request.args.get('limit', 50))
        
        if request.method == 'POST':
            data = request.get_json() or {}
            customers = data.get('customers', [])
        else:
            # Return example data for demo
            customers = [
                {
                    'customer_id': f'C{i:03d}',
                    'orders_12m': 12 - i,
                    'total_spent_12m': 50000000 - (i * 5000000),
                    'recent_3m_spent': 5000000 - (i * 500000),
                    'previous_3m_spent': 10000000,
                    'has_reviews': i % 2 == 0
                }
                for i in range(10)
            ]
        
        result = predictor.get_at_risk_customers(customers, min_prob, limit)
        
        return jsonify({
            "success": True,
            "data": {
                "totalAtRisk": result['total_at_risk'],
                "customers": [
                    {
                        "customerId": c.customer_id,
                        "churnProbability": c.churn_probability,
                        "riskLevel": c.risk_level,
                        "recommendation": c.recommendation
                    }
                    for c in result['customers']
                ],
                "summary": result['summary']
            }
        })
    
    return bp


if __name__ == "__main__":
    # Test
    predictor = ChurnPredictor()
    
    test_customers = [
        {
            "customer_id": "C001",
            "last_order_date": "2025-10-15",
            "orders_12m": 8,
            "total_spent_12m": 45000000,
            "recent_3m_spent": 5000000,
            "previous_3m_spent": 20000000,
            "has_reviews": True,
            "avg_rating_given": 3.5,
            "support_tickets": 2
        },
        {
            "customer_id": "C002",
            "last_order_date": "2025-12-01",
            "orders_12m": 15,
            "total_spent_12m": 80000000,
            "recent_3m_spent": 25000000,
            "previous_3m_spent": 20000000,
            "has_reviews": True,
            "avg_rating_given": 4.5
        },
        {
            "customer_id": "C003",
            "last_order_date": "2025-07-01",
            "orders_12m": 2,
            "total_spent_12m": 5000000,
            "recent_3m_spent": 0,
            "previous_3m_spent": 2000000,
            "has_reviews": False
        }
    ]
    
    print("=== Churn Prediction Test ===\n")
    for customer in test_customers:
        result = predictor.predict(customer)
        print(f"Customer: {result.customer_id}")
        print(f"  Churn Probability: {result.churn_probability:.1%}")
        print(f"  Risk Level: {result.risk_level}")
        print(f"  Recommendation: {result.recommendation}")
        print(f"  RFM Scores: {result.rfm_scores}")
        print(f"  Risk Factors: {[f['factor'] for f in result.risk_factors]}")
        print()
