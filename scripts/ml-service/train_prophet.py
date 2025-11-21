import os
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
from prophet import Prophet
from pymongo import MongoClient
from sklearn.metrics import mean_absolute_error
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
DATABASE_URL = os.getenv('DATABASE_URL')
client = MongoClient(DATABASE_URL)
db = client.get_database()

# Directory to store models
MODEL_DIR = Path(__file__).parent / 'models'
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def fetch_order_data(product_id: str) -> pd.DataFrame:
    """Fetch historical order data for a specific product"""
    try:
        # Aggregate order items by date
        pipeline = [
            {'$match': {'productId': product_id}},
            {'$lookup': {
                'from': 'orders',
                'localField': 'orderId',
                'foreignField': '_id',
                'as': 'order'
            }},
            {'$unwind': '$order'},
            {'$match': {'order.status': 'DELIVERED'}},
            {'$project': {
                'date': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$order.createdAt'}},
                'quantity': 1
            }},
            {'$group': {
                '_id': '$date',
                'total_quantity': {'$sum': '$quantity'}
            }},
            {'$sort': {'_id': 1}}
        ]
        
        results = list(db.order_items.aggregate(pipeline))
        
        if not results:
            return pd.DataFrame(columns=['ds', 'y'])
        
        data = []
        for rec in results:
            data.append({
                'ds': pd.to_datetime(rec['_id']),
                'y': float(rec['total_quantity'])
            })
        
        df = pd.DataFrame(data)
        return df
        
    except Exception as e:
        print(f"Error fetching data for product {product_id}: {e}")
        return pd.DataFrame(columns=['ds', 'y'])

def train_model(product_id: str, product_name: str):
    """Train Prophet model for a product"""
    print(f"\\nTraining model for: {product_name} ({product_id})")
    
    df = fetch_order_data(product_id)
    
    if df.empty or len(df) < 2:
        print(f"  ❌ Insufficient data (only {len(df)} records)")
        return None
    
    print(f"  ✓ Found {len(df)} data points")
    
    try:
        # Initialize and fit Prophet model
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05
        )
        
        model.fit(df)
        
        # Make predictions for evaluation
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        
        # Calculate accuracy metrics on historical data
        y_true = df['y'].values
        y_pred = forecast['yhat'][:len(df)].values
        
        mae = mean_absolute_error(y_true, y_pred)
        mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1))) * 100
        accuracy = max(0, 100 - mape)
        
        # Save model
        model_path = MODEL_DIR / f"{product_id}.pkl"
        with open(model_path, 'wb') as f:
            import pickle
            pickle.dump(model, f)
        
        # Save metrics
        metrics = {
            'product_id': product_id,
            'product_name': product_name,
            'mae': float(mae),
            'mape': float(mape),
            'accuracy': float(accuracy),
            'data_points': len(df),
            'trained_at': datetime.now().isoformat()
        }
        
        metrics_path = MODEL_DIR / f"{product_id}_metrics.json"
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print(f"  ✓ Model saved: {model_path}")
        print(f"  ✓ MAE: {mae:.2f}, Accuracy: {accuracy:.1f}%")
        
        return model_path
        
    except Exception as e:
        print(f"  ❌ Training failed: {e}")
        return None

def main():
    """Main training function"""
    print("="*60)
    print("🚀 PROPHET MODEL TRAINING STARTED")
    print("="*60)
    
    try:
        # Get all active products
        products = list(db.products.find(
            {'status': 'ACTIVE'},
            {'_id': 1, 'name': 1}
        ))
        
        print(f"\\nFound {len(products)} active products")
        
        trained_count = 0
        skipped_count = 0
        
        for prod in products:
            product_id = str(prod['_id'])
            product_name = prod['name']
            
            result = train_model(product_id, product_name)
            if result:
                trained_count += 1
            else:
                skipped_count += 1
        
        print("\\n" + "="*60)
        print(f"✅ TRAINING COMPLETE")
        print(f"   Trained: {trained_count} models")
        print(f"   Skipped: {skipped_count} products (insufficient data)")
        print("="*60)
        
    except Exception as e:
        print(f"\\n❌ TRAINING FAILED: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    main()
