#!/usr/bin/env python3
"""
ML Services API Server
Unified Flask application for all ML/AI services

Services:
- Prophet ML (Inventory Forecasting)
- Contractor Matching (TF-IDF + Cosine Similarity)
- Customer Churn Prediction (RFM Analysis)
- Dynamic Pricing (Multi-factor Optimization)
- Market Trend Analysis (ARIMA + Trend Detection)
- Sentiment Analysis (Vietnamese Lexicon-based)
- Semantic Search (Vector Embeddings)

Deployment:
    gunicorn app:app --bind 0.0.0.0:$PORT
"""

import os
import json
import pickle
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify

# Check for required packages
try:
    import pandas as pd
    import numpy as np
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    raise

# Optional: Prophet for time series
try:
    from prophet import Prophet
    HAS_PROPHET = True
except ImportError:
    HAS_PROPHET = False
    print("⚠️ Prophet not installed. Inventory forecasting limited.")

# Initialize Flask app
app = Flask(__name__)

# Configuration
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# =============================================================================
# Import and Register Service Blueprints
# =============================================================================

# Sentiment Analysis
try:
    from sentiment_analysis import create_sentiment_blueprint
    app.register_blueprint(create_sentiment_blueprint())
    print("✅ Sentiment Analysis service loaded")
except ImportError as e:
    print(f"⚠️ Sentiment Analysis not available: {e}")

# Churn Prediction
try:
    from churn_prediction import create_churn_blueprint
    app.register_blueprint(create_churn_blueprint())
    print("✅ Churn Prediction service loaded")
except ImportError as e:
    print(f"⚠️ Churn Prediction not available: {e}")

# Dynamic Pricing
try:
    from dynamic_pricing import create_pricing_blueprint
    app.register_blueprint(create_pricing_blueprint())
    print("✅ Dynamic Pricing service loaded")
except ImportError as e:
    print(f"⚠️ Dynamic Pricing not available: {e}")

# Contractor Matching
try:
    from contractor_matching import create_contractor_blueprint
    app.register_blueprint(create_contractor_blueprint())
    print("✅ Contractor Matching service loaded")
except ImportError as e:
    print(f"⚠️ Contractor Matching not available: {e}")

# Market Trend Analysis
try:
    from market_trend import create_market_blueprint
    app.register_blueprint(create_market_blueprint())
    print("✅ Market Trend Analysis service loaded")
except ImportError as e:
    print(f"⚠️ Market Trend Analysis not available: {e}")

# Semantic Search
try:
    from semantic_search import create_search_blueprint
    gemini_api_key = os.environ.get('GEMINI_API_KEY')
    app.register_blueprint(create_search_blueprint(gemini_api_key))
    print("✅ Semantic Search service loaded")
except ImportError as e:
    print(f"⚠️ Semantic Search not available: {e}")


# =============================================================================
# Core Endpoints
# =============================================================================

@app.route('/', methods=['GET'])
def index():
    """API index with service list"""
    return jsonify({
        "name": "Construction Materials Store - ML Services",
        "version": "2.0.0",
        "description": "Unified API for all ML/AI services",
        "services": {
            "prophet": {
                "status": "active" if HAS_PROPHET else "unavailable",
                "endpoints": ["/health", "/predict", "/models", "/batch-predict"]
            },
            "sentiment": {
                "status": "active",
                "endpoints": ["/sentiment/analyze", "/sentiment/batch"]
            },
            "churn": {
                "status": "active",
                "endpoints": ["/churn/customer/<id>", "/churn/predict", "/churn/at-risk"]
            },
            "pricing": {
                "status": "active",
                "endpoints": ["/pricing/recommend", "/pricing/batch-update", "/pricing/elasticity"]
            },
            "contractors": {
                "status": "active",
                "endpoints": ["/contractors/match", "/contractors/predict"]
            },
            "market": {
                "status": "active",
                "endpoints": ["/market/trends", "/market/forecast", "/market/alerts", "/market/anomaly"]
            },
            "search": {
                "status": "active",
                "endpoints": ["/search/semantic", "/search/index", "/search/suggest", "/search/stats"]
            }
        },
        "documentation": "See /docs for detailed API documentation"
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    services_status = {
        "prophet": HAS_PROPHET,
        "sentiment": True,
        "churn": True,
        "pricing": True,
        "contractors": True,
        "market": True,
        "search": True
    }
    
    return jsonify({
        "status": "healthy",
        "service": "ML Services API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "services": services_status,
        "models_directory": str(MODELS_DIR),
        "models_available": len(list(MODELS_DIR.glob("*.pkl")))
    })


@app.route('/docs', methods=['GET'])
def docs():
    """API documentation"""
    return jsonify({
        "title": "ML Services API Documentation",
        "version": "2.0.0",
        "endpoints": {
            # Sentiment Analysis
            "POST /sentiment/analyze": {
                "description": "Analyze sentiment of Vietnamese text",
                "body": {
                    "text": "Review text to analyze",
                    "options": {"includeAspects": True}
                },
                "response": "Sentiment classification with score and aspects"
            },
            
            # Churn Prediction
            "POST /churn/predict": {
                "description": "Predict customer churn probability",
                "body": {
                    "customer_id": "Customer identifier",
                    "last_order_date": "ISO date of last order",
                    "orders_12m": "Number of orders in 12 months",
                    "total_spent_12m": "Total spent in 12 months"
                },
                "response": "Churn probability with risk factors"
            },
            "GET /churn/at-risk": {
                "description": "Get list of at-risk customers",
                "params": {"minProbability": 0.6, "limit": 50}
            },
            
            # Dynamic Pricing
            "POST /pricing/recommend": {
                "description": "Get price recommendation",
                "body": {
                    "productId": "Product identifier",
                    "basePrice": "Current base price",
                    "cost": "Product cost",
                    "currentStock": "Inventory level",
                    "demandIndex": "Demand ratio (current/average)"
                },
                "response": "Recommended price with factors"
            },
            
            # Contractor Matching
            "POST /contractors/match": {
                "description": "Find matching contractors for a project",
                "body": {
                    "project": {"title": "", "description": "", "requirements": [], "city": "", "district": ""},
                    "contractors": [{"id": "", "skills": [], "bio": "", "avgRating": 0}],
                    "limit": 10
                },
                "response": "Ranked list of matching contractors"
            },
            
            # Market Trends
            "GET /market/trends": {
                "description": "Get market price trends",
                "params": {"category": "cement", "period": 30}
            },
            "POST /market/forecast": {
                "description": "Forecast future prices",
                "body": {"prices": [100, 105, 110], "periods": 30}
            },
            
            # Semantic Search
            "POST /search/semantic": {
                "description": "Semantic product search",
                "body": {
                    "query": "Search query",
                    "limit": 20,
                    "filters": {"category": "", "minPrice": 0, "maxPrice": 0}
                }
            },
            "POST /search/index": {
                "description": "Index products for search",
                "body": {
                    "products": [{"id": "", "name": "", "description": "", "category": ""}]
                }
            },
            
            # Prophet (Legacy)
            "GET /predict": {
                "description": "Prophet inventory forecast",
                "params": {"productId": "Product ID", "periods": 30}
            }
        }
    })


# =============================================================================
# Prophet ML Endpoints (Legacy - kept for compatibility)
# =============================================================================

@app.route('/models', methods=['GET'])
def list_models():
    """List all available Prophet models"""
    models = list(MODELS_DIR.glob("prophet_*.pkl"))
    model_info = []
    
    for model_path in models:
        product_id = model_path.stem.replace("prophet_", "")
        if product_id.endswith("_metrics"):
            continue
            
        metrics_path = MODELS_DIR / f"prophet_{product_id}_metrics.json"
        
        if metrics_path.exists():
            with open(metrics_path) as f:
                metrics = json.load(f)
            model_info.append(metrics)
        else:
            model_info.append({
                "productId": product_id,
                "modelPath": str(model_path),
                "metrics": None
            })
    
    return jsonify({
        "success": True,
        "models": model_info,
        "count": len(model_info)
    })


@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Make Prophet prediction for a product"""
    if not HAS_PROPHET:
        return jsonify({
            "success": False,
            "error": "Prophet not installed. Use pip install prophet"
        }), 501
    
    if request.method == 'POST':
        data = request.get_json() or {}
        product_id = data.get('productId')
        periods = data.get('periods', 30)
    else:
        product_id = request.args.get('productId')
        periods = int(request.args.get('periods', 30))
    
    if not product_id:
        return jsonify({
            "success": False,
            "error": "Missing productId parameter"
        }), 400
    
    result = _predict(product_id, periods)
    return jsonify(result)


@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Batch Prophet prediction for multiple products"""
    if not HAS_PROPHET:
        return jsonify({
            "success": False,
            "error": "Prophet not installed"
        }), 501
    
    data = request.get_json() or {}
    product_ids = data.get('productIds', [])
    periods = data.get('periods', 30)
    
    if not product_ids:
        return jsonify({
            "success": False,
            "error": "Missing productIds"
        }), 400
    
    results = {}
    for pid in product_ids:
        results[pid] = _predict(pid, periods)
    
    return jsonify({
        "success": True,
        "predictions": results
    })


def _predict(product_id: str, periods: int = 30) -> dict:
    """Internal Prophet prediction function"""
    model_path = MODELS_DIR / f"prophet_{product_id}.pkl"
    
    if not model_path.exists():
        return {
            "success": False,
            "error": "Model not found",
            "productId": product_id
        }
    
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        # Get predictions for the forecast period
        predictions = forecast.tail(periods)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
        
        # Calculate summary statistics
        total_predicted = float(predictions["yhat"].sum())
        avg_daily = float(predictions["yhat"].mean())
        
        # Convert to list of dicts
        pred_list = []
        for _, row in predictions.iterrows():
            pred_list.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted": round(max(0, row["yhat"]), 2),
                "lower": round(max(0, row["yhat_lower"]), 2),
                "upper": round(max(0, row["yhat_upper"]), 2)
            })
        
        # Load metrics if available
        metrics_path = MODELS_DIR / f"prophet_{product_id}_metrics.json"
        metrics = None
        if metrics_path.exists():
            with open(metrics_path) as f:
                metrics = json.load(f)
        
        return {
            "success": True,
            "productId": product_id,
            "periods": periods,
            "totalPredicted": round(total_predicted, 2),
            "avgDaily": round(avg_daily, 2),
            "predictions": pred_list,
            "metrics": metrics,
            "generatedAt": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "productId": product_id
        }


# =============================================================================
# Error Handlers
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "hint": "Check /docs for available endpoints"
    }), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "success": False,
        "error": "Internal server error",
        "details": str(e)
    }), 500


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Starting ML Services API on port {port}")
    print(f"📁 Models directory: {MODELS_DIR}")
    print(f"📊 Services: Prophet={HAS_PROPHET}, Sentiment=True, Churn=True, Pricing=True, Matching=True, Market=True, Search=True")
    app.run(host="0.0.0.0", port=port, debug=True)
