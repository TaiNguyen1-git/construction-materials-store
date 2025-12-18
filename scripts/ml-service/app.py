#!/usr/bin/env python3
"""
Prophet ML Prediction Server for Render.com
Run with: gunicorn app:app --bind 0.0.0.0:$PORT
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
    from prophet import Prophet
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    raise

# Initialize Flask app
app = Flask(__name__)

# Configuration
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "Prophet ML Server",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/models', methods=['GET'])
def list_models():
    """List all available models"""
    models = list(MODELS_DIR.glob("prophet_*.pkl"))
    model_info = []
    
    for model_path in models:
        product_id = model_path.stem.replace("prophet_", "")
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
    """Make prediction for a product"""
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
    """Batch prediction for multiple products"""
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
    """Internal prediction function"""
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


# For local development
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Starting Prophet ML Server on port {port}")
    print(f"📁 Models directory: {MODELS_DIR}")
    app.run(host="0.0.0.0", port=port, debug=True)
