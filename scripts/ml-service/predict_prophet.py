"""
Prophet Model Prediction Script
Makes predictions using trained Prophet models
"""

import pandas as pd
import numpy as np
import pickle
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).parent
MODEL_DIR = SCRIPT_DIR / "models"

def load_model(product_id: str):
    """
    Load trained Prophet model from disk
    """
    model_path = MODEL_DIR / f"prophet_{product_id}.pkl"
    metrics_path = MODEL_DIR / f"prophet_{product_id}_metrics.json"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found for product: {product_id}")
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Load metrics if available
    metrics = {}
    if metrics_path.exists():
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
    
    return model, metrics

def predict_demand(
    product_id: str,
    timeframe: str = 'MONTH',
    periods: int = None
) -> dict:
    """
    Predict demand using trained Prophet model
    
    Args:
        product_id: Product identifier
        timeframe: 'WEEK', 'MONTH', or 'QUARTER'
        periods: Number of periods to predict (optional)
    
    Returns:
        Prediction dictionary with demand, confidence, and factors
    """
    print(f"[PREDICT] Making prediction for product: {product_id}")
    print(f"[INFO] Timeframe: {timeframe}")
    
    # Load model
    model, metrics = load_model(product_id)
    
    # Determine prediction horizon
    if periods is None:
        periods_map = {
            'WEEK': 7,
            'MONTH': 30,
            'QUARTER': 90
        }
        periods = periods_map.get(timeframe, 30)
    
    # Create future dataframe
    future = model.make_future_dataframe(periods=periods, freq='D')
    
    # Make prediction
    forecast = model.predict(future)
    
    # Get predictions for the future period only
    future_forecast = forecast.tail(periods)
    
    # Calculate aggregate demand for the timeframe
    predicted_demand = future_forecast['yhat'].sum()
    
    # Get confidence interval (uncertainty)
    lower_bound = future_forecast['yhat_lower'].sum()
    upper_bound = future_forecast['yhat_upper'].sum()
    
    # Calculate confidence score based on:
    # 1. Model accuracy from training
    # 2. Prediction interval width
    base_confidence = metrics.get('accuracy', 85) / 100
    interval_width = (upper_bound - lower_bound) / max(predicted_demand, 1)
    uncertainty_penalty = min(0.3, interval_width * 0.1)
    confidence = max(0.5, base_confidence - uncertainty_penalty)
    
    # Calculate trend
    trend_component = future_forecast['trend'].mean()
    
    # Calculate seasonality
    yearly_seasonality = 0
    if 'yearly' in future_forecast.columns:
        yearly_seasonality = future_forecast['yearly'].mean()
    
    # Prepare factors for transparency
    factors = {
        'model_type': 'PROPHET',
        'model_accuracy': metrics.get('accuracy', 0),
        'trained_at': metrics.get('trained_at', 'unknown'),
        'prediction_periods': periods,
        'average_daily_demand': float(future_forecast['yhat'].mean()),
        'trend': float(trend_component),
        'seasonality': float(yearly_seasonality),
        'lower_bound': float(lower_bound),
        'upper_bound': float(upper_bound),
        'interval_width': float(interval_width)
    }
    
    result = {
        'predictedDemand': float(predicted_demand),
        'confidence': float(confidence),
        'factors': factors,
        'timeframe': timeframe,
        'method': 'PROPHET_ML',
        'dailyForecast': [
            {
                'date': row['ds'].strftime('%Y-%m-%d'),
                'demand': float(row['yhat']),
                'lower': float(row['yhat_lower']),
                'upper': float(row['yhat_upper'])
            }
            for _, row in future_forecast.iterrows()
        ][:30]  # Limit to 30 days for response size
    }
    
    print(f"[OK] Predicted Demand: {predicted_demand:.2f}")
    print(f"[INFO] Confidence: {confidence * 100:.1f}%")
    
    return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python predict_prophet.py <product_id> [timeframe]")
        sys.exit(1)
    
    product_id = sys.argv[1]
    timeframe = sys.argv[2] if len(sys.argv) > 2 else 'MONTH'
    
    try:
        result = predict_demand(product_id, timeframe)
        
        # Output as JSON for Node.js to consume
        print("\n--- PREDICTION_RESULT ---")
        print(json.dumps(result, indent=2))
        print("--- END_PREDICTION_RESULT ---")
        
        return 0
        
    except FileNotFoundError as e:
        print(f"[ERROR] {str(e)}")
        print(f"[HINT] Run training first: python train_prophet.py {product_id}")
        return 1
    except Exception as e:
        print(f"[ERROR] Prediction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
