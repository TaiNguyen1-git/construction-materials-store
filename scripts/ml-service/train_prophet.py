"""
Prophet Model Training Script
Trains Facebook Prophet model for inventory demand prediction
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import pickle
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).parent
MODEL_DIR = SCRIPT_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

def load_historical_data(product_id: str) -> pd.DataFrame:
    """
    Load historical sales data from database
    Returns DataFrame with 'ds' (date) and 'y' (demand) columns
    """
    # This will be replaced with actual Prisma query
    # For now, mock data structure
    
    # In production, this would query:
    # SELECT DATE(order.createdAt) as ds, SUM(orderItem.quantity) as y
    # FROM orderItem
    # JOIN order ON orderItem.orderId = order.id
    # WHERE orderItem.productId = ? AND order.status != 'CANCELLED'
    # GROUP BY DATE(order.createdAt)
    # ORDER BY ds
    
    print(f"[DATA] Loading historical data for product: {product_id}")
    
    # Mock data for demonstration
    # In production, replace with actual database query
    dates = pd.date_range(
        start=datetime.now() - timedelta(days=365),
        end=datetime.now(),
        freq='D'
    )
    
    # Simulate realistic construction materials demand with seasonality
    np.random.seed(42)
    base_demand = 50
    trend = np.linspace(0, 20, len(dates))
    seasonal = 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 365)
    noise = np.random.normal(0, 5, len(dates))
    demand = base_demand + trend + seasonal + noise
    demand = np.maximum(demand, 0)  # Ensure non-negative
    
    df = pd.DataFrame({
        'ds': dates,
        'y': demand
    })
    
    print(f"[OK] Loaded {len(df)} days of historical data")
    print(f"[INFO] Average daily demand: {df['y'].mean():.2f}")
    print(f"[INFO] Data range: {df['ds'].min().date()} to {df['ds'].max().date()}")
    
    return df

def train_prophet_model(product_id: str, data: pd.DataFrame) -> Prophet:
    """
    Train Prophet model on historical data
    """
    print(f"\n[TRAINING] Prophet model for product: {product_id}")
    print("[INFO] This may take 1-2 minutes...")
    
    # Initialize Prophet with construction industry parameters
    model = Prophet(
        growth='linear',  # Linear growth trend
        seasonality_mode='multiplicative',  # Multiplicative seasonality
        yearly_seasonality=True,  # Capture yearly patterns
        weekly_seasonality=True,  # Capture weekly patterns
        daily_seasonality=False,  # Not needed for construction materials
        changepoint_prior_scale=0.05,  # Moderate flexibility in trend changes
        seasonality_prior_scale=10.0,  # Strong seasonality effect
        interval_width=0.95  # 95% confidence interval
    )
    
    # Add custom seasonality for construction season
    # Peak season: March-October (spring/summer)
    # Low season: November-February (winter)
    model.add_seasonality(
        name='construction_season',
        period=365.25,
        fourier_order=10
    )
    
    # Fit model
    print("[TRAIN] Fitting model...")
    model.fit(data)
    
    print("[OK] Model training completed!")
    
    return model

def evaluate_model(model: Prophet, data: pd.DataFrame) -> dict:
    """
    Evaluate model performance using cross-validation
    """
    print("\n[EVAL] Evaluating model performance...")
    
    # Split data: 80% train, 20% test
    split_point = int(len(data) * 0.8)
    train_data = data[:split_point]
    test_data = data[split_point:]
    
    # Train on subset
    eval_model = Prophet(
        growth='linear',
        seasonality_mode='multiplicative',
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False
    )
    eval_model.add_seasonality(name='construction_season', period=365.25, fourier_order=10)
    eval_model.fit(train_data)
    
    # Predict on test set
    forecast = eval_model.predict(test_data)
    
    # Calculate metrics
    actual = test_data['y'].values
    predicted = forecast['yhat'].values
    
    mae = np.mean(np.abs(actual - predicted))
    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
    mape = np.mean(np.abs((actual - predicted) / np.maximum(actual, 1))) * 100
    
    # Accuracy (100 - MAPE)
    accuracy = max(0, 100 - mape)
    
    print(f"[METRIC] MAE (Mean Absolute Error): {mae:.2f}")
    print(f"[METRIC] RMSE (Root Mean Square Error): {rmse:.2f}")
    print(f"[METRIC] MAPE (Mean Absolute Percentage Error): {mape:.2f}%")
    print(f"[METRIC] Accuracy: {accuracy:.2f}%")
    
    return {
        'mae': float(mae),
        'rmse': float(rmse),
        'mape': float(mape),
        'accuracy': float(accuracy),
        'test_samples': len(test_data)
    }

def save_model(model: Prophet, product_id: str, metrics: dict):
    """
    Save trained model and metrics to disk
    """
    print(f"\n[SAVE] Saving model...")
    
    model_path = MODEL_DIR / f"prophet_{product_id}.pkl"
    metrics_path = MODEL_DIR / f"prophet_{product_id}_metrics.json"
    
    # Save model
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    # Save metrics with timestamp
    metrics['trained_at'] = datetime.now().isoformat()
    metrics['product_id'] = product_id
    metrics['model_type'] = 'prophet'
    
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"[OK] Model saved to: {model_path}")
    print(f"[OK] Metrics saved to: {metrics_path}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python train_prophet.py <product_id>")
        sys.exit(1)
    
    product_id = sys.argv[1]
    
    print("=" * 70)
    print("Prophet Model Training")
    print("=" * 70)
    print(f"Product ID: {product_id}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Step 1: Load data
        data = load_historical_data(product_id)
        
        if len(data) < 60:
            print("[ERROR] Need at least 60 days of historical data")
            print("   Current data points:", len(data))
            sys.exit(1)
        
        # Step 2: Train model
        model = train_prophet_model(product_id, data)
        
        # Step 3: Evaluate
        metrics = evaluate_model(model, data)
        
        # Step 4: Save
        save_model(model, product_id, metrics)
        
        print("\n" + "=" * 70)
        print("[SUCCESS] TRAINING COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print(f"Model Accuracy: {metrics['accuracy']:.2f}%")
        print(f"Ready for predictions!")
        print()
        
        return 0
        
    except Exception as e:
        print(f"\n[ERROR] Training failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
