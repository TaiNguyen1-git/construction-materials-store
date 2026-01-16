#!/usr/bin/env python3
"""
Prophet ML Prediction API
HTTP server for making predictions using trained Prophet models

Usage:
    python predict_server.py           # Start server on port 5000
    python predict_server.py --port 8080
"""

import os
import sys
import json
import pickle
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Check for required packages
try:
    import pandas as pd
    import numpy as np
    from prophet import Prophet
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    print("Please install: pip install prophet pandas numpy")
    sys.exit(1)

# Configuration
MODELS_DIR = Path(__file__).parent / "models"
PORT = int(os.getenv("PROPHET_PORT", 5000))


class PredictionHandler(BaseHTTPRequestHandler):
    """HTTP handler for prediction requests"""
    
    def _send_json_response(self, data: dict, status: int = 200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        
        if parsed.path == "/health":
            self._send_json_response({"status": "ok", "timestamp": datetime.now().isoformat()})
            return
        
        if parsed.path == "/models":
            # List all available models
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
            
            self._send_json_response({
                "success": True,
                "models": model_info,
                "count": len(model_info)
            })
            return
        
        if parsed.path == "/predict":
            product_id = query.get("productId", [None])[0]
            periods = int(query.get("periods", [30])[0])
            
            if not product_id:
                self._send_json_response({
                    "success": False,
                    "error": "Missing productId parameter"
                }, 400)
                return
            
            result = self._predict(product_id, periods)
            self._send_json_response(result)
            return
        
        self._send_json_response({"error": "Not found"}, 404)
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self._send_json_response({"error": "Invalid JSON"}, 400)
            return
        
        parsed = urllib.parse.urlparse(self.path)
        
        if parsed.path == "/predict":
            product_id = data.get("productId")
            periods = data.get("periods", 30)
            
            if not product_id:
                self._send_json_response({
                    "success": False,
                    "error": "Missing productId"
                }, 400)
                return
            
            result = self._predict(product_id, periods)
            self._send_json_response(result)
            return
        
        if parsed.path == "/batch-predict":
            product_ids = data.get("productIds", [])
            periods = data.get("periods", 30)
            
            if not product_ids:
                self._send_json_response({
                    "success": False,
                    "error": "Missing productIds"
                }, 400)
                return
            
            results = {}
            for pid in product_ids:
                results[pid] = self._predict(pid, periods)
            
            self._send_json_response({
                "success": True,
                "predictions": results
            })
            return
        
        self._send_json_response({"error": "Not found"}, 404)
    
    def _predict(self, product_id: str, periods: int = 30) -> dict:
        """Make prediction for a product"""
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
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {args[0]}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Prophet ML Prediction Server")
    parser.add_argument("--port", type=int, default=PORT, help="Server port")
    
    args = parser.parse_args()
    
    print("🚀 Prophet ML Prediction Server")
    print("=" * 50)
    print(f"📁 Models directory: {MODELS_DIR}")
    print(f"🌐 Starting server on port {args.port}...")
    
    # Count available models
    models = list(MODELS_DIR.glob("prophet_*.pkl"))
    print(f"📊 Available models: {len(models)}")
    
    server = HTTPServer(("0.0.0.0", args.port), PredictionHandler)
    
    print(f"\n✅ Server running at http://localhost:{args.port}")
    print("\nAvailable endpoints:")
    print(f"  GET  /health           - Health check")
    print(f"  GET  /models           - List all models")
    print(f"  GET  /predict?productId=XXX&periods=30")
    print(f"  POST /predict          - {{'productId': 'XXX', 'periods': 30}}")
    print(f"  POST /batch-predict    - {{'productIds': ['X','Y'], 'periods': 30}}")
    print("\nPress Ctrl+C to stop...")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
