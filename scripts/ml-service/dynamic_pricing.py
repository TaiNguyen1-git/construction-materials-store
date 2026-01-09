#!/usr/bin/env python3
"""
Dynamic Pricing Service
Multi-factor price optimization for VLXD (Building Materials)

API Endpoints:
    POST /pricing/recommend - Get price recommendation for a product
    POST /pricing/batch-update - Batch price recommendations
"""

import math
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class PriceRecommendation:
    """Result of price optimization"""
    product_id: str
    product_name: str
    current_price: float
    recommended_price: float
    price_change_percent: float
    factors: Dict
    projections: Dict
    constraints: Dict


class DynamicPricingEngine:
    """
    Dynamic Pricing using multi-factor optimization
    
    Master Formula:
    Optimal_Price = Base_Price × Demand_Factor × Inventory_Factor × Competitor_Factor × Time_Factor
    
    Subject to:
    - Min_Price ≤ Optimal_Price ≤ Max_Price
    - Margin ≥ Min_Margin (15%)
    """
    
    # Factor weights for weighted optimization
    FACTOR_WEIGHTS = {
        'demand': 0.30,
        'inventory': 0.25,
        'competitor': 0.25,
        'time': 0.10,
        'margin': 0.10
    }
    
    # Default constraints
    DEFAULT_CONSTRAINTS = {
        'min_margin': 0.15,       # 15% minimum margin
        'max_price_change': 0.25, # 25% max change from base
        'competitor_match': True
    }
    
    # Construction season months (high demand)
    CONSTRUCTION_SEASON = [3, 4, 5, 6, 7, 8, 9, 10]  # March to October
    
    # Category-specific price elasticity (absolute values)
    ELASTICITY_BY_CATEGORY = {
        'xi_mang': 0.8,      # Inelastic (essential)
        'thep': 1.2,         # Elastic
        'cat_da': 0.6,       # Very inelastic
        'gach_trang_tri': 1.5,  # Elastic (non-essential)
        'son': 1.3,          # Elastic
        'default': 1.0
    }
    
    def __init__(self):
        self.today = datetime.now()
    
    def _calculate_demand_factor(self, demand_index: float) -> tuple:
        """
        Calculate demand-based pricing factor
        
        Args:
            demand_index: current_demand / avg_demand (ratio)
            
        Returns:
            (multiplier, reason)
        """
        if demand_index > 1.5:
            return (1.15, "Very high demand (+15%)")
        elif demand_index > 1.2:
            return (1.08, "High demand (+8%)")
        elif demand_index > 0.8:
            return (1.00, "Normal demand")
        elif demand_index > 0.5:
            return (0.95, "Low demand (-5%)")
        else:
            return (0.90, "Very low demand (-10%)")
    
    def _calculate_inventory_factor(
        self, 
        current_stock: int, 
        avg_daily_sales: float,
        lead_time_days: int = 7
    ) -> tuple:
        """
        Calculate inventory-based pricing factor
        
        Args:
            current_stock: Current inventory level
            avg_daily_sales: Average units sold per day
            lead_time_days: Days to restock
            
        Returns:
            (multiplier, reason)
        """
        if avg_daily_sales <= 0:
            days_of_stock = 999
        else:
            days_of_stock = current_stock / avg_daily_sales
        
        if days_of_stock < 7:
            return (1.10, f"Low stock ({days_of_stock:.0f} days) - increase price")
        elif days_of_stock > 60:
            return (0.92, f"Overstock ({days_of_stock:.0f} days) - reduce price")
        elif days_of_stock > 45:
            return (0.96, f"High stock ({days_of_stock:.0f} days) - slight reduction")
        else:
            return (1.00, f"Healthy stock ({days_of_stock:.0f} days)")
    
    def _calculate_competitor_factor(
        self, 
        our_price: float, 
        competitor_avg_price: float,
        strategy: str = 'MATCH'
    ) -> tuple:
        """
        Calculate competitor-based pricing factor
        
        Args:
            our_price: Our current price
            competitor_avg_price: Average competitor price
            strategy: PREMIUM, MATCH, or UNDERCUT
            
        Returns:
            (multiplier, reason)
        """
        if competitor_avg_price <= 0:
            return (1.00, "No competitor data")
        
        price_ratio = our_price / competitor_avg_price
        
        if strategy == 'PREMIUM':
            target_ratio = 1.10  # 10% higher
        elif strategy == 'UNDERCUT':
            target_ratio = 0.95  # 5% lower
        else:  # MATCH
            target_ratio = 1.00
        
        # Calculate adjustment needed
        adjustment = target_ratio / price_ratio
        
        # Limit adjustment range
        adjustment = max(0.85, min(1.15, adjustment))
        
        if adjustment > 1.02:
            reason = f"Below competitor ({price_ratio:.0%}) - raise price"
        elif adjustment < 0.98:
            reason = f"Above competitor ({price_ratio:.0%}) - lower price"
        else:
            reason = "Aligned with market"
        
        return (adjustment, reason)
    
    def _calculate_time_factor(self, date: datetime = None) -> tuple:
        """
        Calculate time-based pricing factor (seasonality)
        
        Returns:
            (multiplier, reason)
        """
        if date is None:
            date = self.today
        
        month = date.month
        day_of_week = date.weekday()  # 0 = Monday
        day_of_month = date.day
        
        # Base multiplier
        multiplier = 1.00
        reasons = []
        
        # Construction season boost
        if month in self.CONSTRUCTION_SEASON:
            multiplier *= 1.05
            reasons.append("Construction season (+5%)")
        else:
            multiplier *= 0.98
            reasons.append("Off-season (-2%)")
        
        # Beginning of month (wholesale orders)
        if day_of_month <= 5:
            multiplier *= 0.98
            reasons.append("Month start - wholesale period")
        
        # End of quarter (budget spending)
        if month in [3, 6, 9, 12] and day_of_month >= 25:
            multiplier *= 1.03
            reasons.append("Quarter end - budget rush")
        
        return (round(multiplier, 3), ", ".join(reasons) if reasons else "Normal period")
    
    def _calculate_optimal_price_from_elasticity(
        self, 
        cost: float, 
        elasticity: float
    ) -> float:
        """
        Calculate optimal price using price elasticity formula
        
        P* = MC × ε / (ε - 1)
        
        Where:
            P* = Optimal price
            MC = Marginal cost
            ε = Price elasticity (absolute value)
        """
        if elasticity <= 1:
            # Inelastic: can charge premium
            return cost * 1.5
        else:
            return cost * elasticity / (elasticity - 1)
    
    def recommend_price(
        self, 
        product: Dict,
        constraints: Dict = None
    ) -> PriceRecommendation:
        """
        Get price recommendation for a product
        
        Args:
            product: Dictionary with:
                - product_id: Product identifier
                - product_name: Product name
                - base_price: Current/base price
                - cost: Product cost
                - category: Product category
                - current_stock: Inventory level
                - avg_daily_sales: Average daily sales
                - demand_index: current/avg demand ratio
                - competitor_avg_price: Competitor average price
                
            constraints: Optional constraints override
                - min_margin: Minimum profit margin
                - max_price_change: Max change from base
                - competitor_match: Whether to match competitors
                
        Returns:
            PriceRecommendation with optimal price and analysis
        """
        # Merge constraints
        constraints = {**self.DEFAULT_CONSTRAINTS, **(constraints or {})}
        
        product_id = product.get('product_id', 'unknown')
        product_name = product.get('product_name', 'Unknown Product')
        base_price = product.get('base_price', 0)
        cost = product.get('cost', base_price * 0.7)  # Estimate 30% margin if not provided
        category = product.get('category', 'default')
        
        # Calculate factors
        demand_multiplier, demand_reason = self._calculate_demand_factor(
            product.get('demand_index', 1.0)
        )
        
        inventory_multiplier, inventory_reason = self._calculate_inventory_factor(
            product.get('current_stock', 100),
            product.get('avg_daily_sales', 5)
        )
        
        competitor_multiplier, competitor_reason = self._calculate_competitor_factor(
            base_price,
            product.get('competitor_avg_price', base_price),
            'MATCH' if constraints.get('competitor_match') else 'PREMIUM'
        )
        
        time_multiplier, time_reason = self._calculate_time_factor()
        
        # Calculate combined multiplier
        combined_multiplier = (
            demand_multiplier * 
            inventory_multiplier * 
            competitor_multiplier * 
            time_multiplier
        )
        
        # Calculate optimal price
        optimal_price = base_price * combined_multiplier
        
        # Apply constraints
        min_margin = constraints.get('min_margin', 0.15)
        min_price = cost * (1 + min_margin)
        
        max_change = constraints.get('max_price_change', 0.25)
        max_price = base_price * (1 + max_change)
        min_price_by_change = base_price * (1 - max_change)
        
        # Constrain optimal price
        final_price = max(min_price, min(optimal_price, max_price))
        final_price = max(final_price, min_price_by_change)
        
        # Round to nice number
        final_price = round(final_price / 1000) * 1000
        
        # Calculate change percent
        price_change_pct = (final_price - base_price) / base_price if base_price > 0 else 0
        
        # Calculate margin achieved
        margin_achieved = (final_price - cost) / final_price if final_price > 0 else 0
        
        # Projections (simplified)
        elasticity = self.ELASTICITY_BY_CATEGORY.get(category, 1.0)
        
        # Estimated demand change: ΔQ/Q = -ε × ΔP/P
        demand_change = -elasticity * price_change_pct
        expected_demand = product.get('avg_daily_sales', 5) * (1 + demand_change)
        expected_revenue = final_price * expected_demand
        expected_profit = (final_price - cost) * expected_demand
        
        # Confidence based on data completeness
        data_points = sum([
            1 if product.get('demand_index') else 0,
            1 if product.get('current_stock') else 0,
            1 if product.get('competitor_avg_price') else 0,
            1 if product.get('avg_daily_sales') else 0
        ])
        confidence = 0.5 + (data_points * 0.1)
        
        return PriceRecommendation(
            product_id=product_id,
            product_name=product_name,
            current_price=base_price,
            recommended_price=final_price,
            price_change_percent=round(price_change_pct * 100, 1),
            factors={
                'demand': {'value': demand_multiplier, 'reason': demand_reason},
                'inventory': {'value': inventory_multiplier, 'reason': inventory_reason},
                'competitor': {'value': competitor_multiplier, 'reason': competitor_reason},
                'time': {'value': time_multiplier, 'reason': time_reason},
                'combined': round(combined_multiplier, 3)
            },
            projections={
                'expectedDemand': round(expected_demand, 1),
                'expectedRevenue': round(expected_revenue),
                'expectedProfit': round(expected_profit),
                'confidence': round(confidence, 2)
            },
            constraints={
                'marginAchieved': round(margin_achieved, 3),
                'withinPriceBounds': min_price_by_change <= final_price <= max_price,
                'minPriceApplied': final_price == min_price
            }
        )
    
    def batch_recommend(
        self, 
        products: List[Dict],
        constraints: Dict = None
    ) -> List[PriceRecommendation]:
        """Get price recommendations for multiple products"""
        return [self.recommend_price(p, constraints) for p in products]


# Flask Blueprint for integration
def create_pricing_blueprint():
    """Create Flask Blueprint for dynamic pricing"""
    from flask import Blueprint, request, jsonify
    
    bp = Blueprint('pricing', __name__, url_prefix='/pricing')
    engine = DynamicPricingEngine()
    
    @bp.route('/recommend', methods=['POST'])
    def recommend():
        """Get price recommendation for a product"""
        data = request.get_json() or {}
        
        if not data.get('productId') and not data.get('product_id'):
            return jsonify({
                "success": False,
                "error": "Missing productId"
            }), 400
        
        # Map API fields to internal fields
        product = {
            'product_id': data.get('productId') or data.get('product_id'),
            'product_name': data.get('productName') or data.get('product_name', 'Unknown'),
            'base_price': data.get('basePrice') or data.get('base_price') or data.get('currentPrice', 0),
            'cost': data.get('cost', 0),
            'category': data.get('category', 'default'),
            'current_stock': data.get('currentStock') or data.get('current_stock', 100),
            'avg_daily_sales': data.get('avgDailySales') or data.get('avg_daily_sales', 5),
            'demand_index': data.get('demandIndex') or data.get('demand_index', 1.0),
            'competitor_avg_price': data.get('competitorPrice') or data.get('competitor_avg_price', 0)
        }
        
        constraints = data.get('constraints', {})
        
        result = engine.recommend_price(product, constraints)
        
        return jsonify({
            "success": True,
            "data": {
                "productId": result.product_id,
                "productName": result.product_name,
                "currentPrice": result.current_price,
                "recommendedPrice": result.recommended_price,
                "priceChange": f"{result.price_change_percent:+.1f}%",
                "factors": result.factors,
                "projections": result.projections,
                "constraints": result.constraints
            }
        })
    
    @bp.route('/batch-update', methods=['POST'])
    def batch_update():
        """Batch price recommendations"""
        data = request.get_json() or {}
        products = data.get('products', [])
        constraints = data.get('constraints', {})
        
        if not products:
            return jsonify({
                "success": False,
                "error": "Missing products array"
            }), 400
        
        results = engine.batch_recommend(products, constraints)
        
        return jsonify({
            "success": True,
            "data": {
                "recommendations": [
                    {
                        "productId": r.product_id,
                        "currentPrice": r.current_price,
                        "recommendedPrice": r.recommended_price,
                        "priceChange": f"{r.price_change_percent:+.1f}%",
                        "confidence": r.projections['confidence']
                    }
                    for r in results
                ],
                "summary": {
                    "total": len(results),
                    "increases": sum(1 for r in results if r.price_change_percent > 0),
                    "decreases": sum(1 for r in results if r.price_change_percent < 0),
                    "unchanged": sum(1 for r in results if r.price_change_percent == 0)
                }
            }
        })
    
    @bp.route('/elasticity', methods=['GET'])
    def get_elasticity():
        """Get price elasticity by category"""
        return jsonify({
            "success": True,
            "data": {
                "elasticityByCategory": DynamicPricingEngine.ELASTICITY_BY_CATEGORY,
                "interpretation": {
                    "< 1.0": "Inelastic - increase price to increase revenue",
                    "= 1.0": "Unit elastic - revenue unchanged with price change",
                    "> 1.0": "Elastic - decrease price to increase revenue"
                }
            }
        })
    
    return bp


if __name__ == "__main__":
    # Test
    engine = DynamicPricingEngine()
    
    test_products = [
        {
            "product_id": "prod_001",
            "product_name": "Xi măng Holcim PCB40",
            "base_price": 95000,
            "cost": 78000,
            "category": "xi_mang",
            "current_stock": 500,
            "avg_daily_sales": 15,
            "demand_index": 1.2,
            "competitor_avg_price": 93000
        },
        {
            "product_id": "prod_002",
            "product_name": "Thép Pomina D10",
            "base_price": 18500,
            "cost": 15000,
            "category": "thep",
            "current_stock": 200,
            "avg_daily_sales": 8,
            "demand_index": 0.9,
            "competitor_avg_price": 19000
        },
        {
            "product_id": "prod_003",
            "product_name": "Gạch trang trí Đồng Tâm",
            "base_price": 85000,
            "cost": 60000,
            "category": "gach_trang_tri",
            "current_stock": 1000,
            "avg_daily_sales": 5,
            "demand_index": 0.6,
            "competitor_avg_price": 82000
        }
    ]
    
    print("=== Dynamic Pricing Test ===\n")
    for product in test_products:
        result = engine.recommend_price(product)
        print(f"Product: {result.product_name}")
        print(f"  Current Price: {result.current_price:,.0f}đ")
        print(f"  Recommended: {result.recommended_price:,.0f}đ ({result.price_change_percent:+.1f}%)")
        print(f"  Factors: {result.factors}")
        print(f"  Projections: {result.projections}")
        print(f"  Margin: {result.constraints['marginAchieved']:.1%}")
        print()
