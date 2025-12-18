#!/usr/bin/env python3
"""
Prophet ML Training Service
Train Facebook Prophet models for inventory demand forecasting

Usage:
    python train_prophet.py                  # Train all products
    python train_prophet.py --product-id XXX # Train specific product
    python train_prophet.py --export-data    # Export training data for debugging
"""

import os
import sys
import json
import pickle
from datetime import datetime, timedelta
from pathlib import Path

# Check for required packages
try:
    import pandas as pd
    import numpy as np
    from prophet import Prophet
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    print("Please install: pip install prophet pandas numpy pymongo")
    sys.exit(1)

try:
    from pymongo import MongoClient
except ImportError:
    print("❌ Missing pymongo. Please install: pip install pymongo")
    sys.exit(1)

# Configuration
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# MongoDB connection from environment
MONGODB_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/construction-materials")


def get_mongodb_connection():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGODB_URI)
        # Extract database name from URI
        db_name = MONGODB_URI.split("/")[-1].split("?")[0]
        db = client[db_name]
        print(f"✅ Connected to MongoDB: {db_name}")
        return db
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        sys.exit(1)


def fetch_historical_data(db, product_id: str, days: int = 365) -> pd.DataFrame:
    """Fetch historical sales data for a product"""
    start_date = datetime.now() - timedelta(days=days)
    
    # Get orders with this product
    pipeline = [
        {
            "$match": {
                "status": {"$in": ["DELIVERED", "SHIPPED", "COMPLETED"]},
                "createdAt": {"$gte": start_date}
            }
        },
        {
            "$lookup": {
                "from": "OrderItem",
                "localField": "_id",
                "foreignField": "orderId",
                "as": "items"
            }
        },
        {"$unwind": "$items"},
        {
            "$match": {
                "items.productId": product_id
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}
                },
                "y": {"$sum": "$items.quantity"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    try:
        results = list(db.Order.aggregate(pipeline))
        
        if not results:
            return pd.DataFrame()
        
        # Convert to Prophet format (ds, y)
        df = pd.DataFrame(results)
        df.columns = ["ds", "y"]
        df["ds"] = pd.to_datetime(df["ds"])
        
        return df
    except Exception as e:
        print(f"  ⚠️ Error fetching data: {e}")
        return pd.DataFrame()


def fill_missing_dates(df: pd.DataFrame) -> pd.DataFrame:
    """Fill missing dates with 0 sales"""
    if df.empty:
        return df
    
    date_range = pd.date_range(start=df["ds"].min(), end=df["ds"].max(), freq="D")
    df_full = pd.DataFrame({"ds": date_range})
    df_merged = df_full.merge(df, on="ds", how="left")
    df_merged["y"] = df_merged["y"].fillna(0)
    
    return df_merged


def train_prophet_model(df: pd.DataFrame, product_id: str) -> dict:
    """Train a Prophet model for the given data"""
    if len(df) < 14:  # Need at least 2 weeks of data
        return {
            "success": False,
            "error": f"Insufficient data points: {len(df)} (minimum 14 required)"
        }
    
    try:
        # Initialize Prophet with construction materials specific settings
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode="multiplicative",
            changepoint_prior_scale=0.05,  # Less sensitive to trend changes
            seasonality_prior_scale=10.0,  # More weight on seasonality
        )
        
        # Add Vietnamese holidays (construction-relevant)
        model.add_country_holidays(country_name="VN")
        
        # Fit the model
        model.fit(df)
        
        # Make future predictions for validation
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        
        # Calculate metrics on historical data
        df_with_forecast = df.merge(
            forecast[["ds", "yhat"]], 
            on="ds", 
            how="left"
        )
        
        # Calculate accuracy metrics
        actual = df_with_forecast["y"].values
        predicted = df_with_forecast["yhat"].values
        
        mae = np.mean(np.abs(actual - predicted))
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))
        
        # MAPE (handle zero values)
        non_zero_mask = actual > 0
        if non_zero_mask.sum() > 0:
            mape = np.mean(np.abs((actual[non_zero_mask] - predicted[non_zero_mask]) / actual[non_zero_mask])) * 100
        else:
            mape = 0
        
        accuracy = max(0, 100 - mape)
        
        # Save the model
        model_path = MODELS_DIR / f"prophet_{product_id}.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(model, f)
        
        # Save metrics
        metrics = {
            "productId": product_id,
            "accuracy": round(accuracy, 2),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "dataPoints": len(df),
            "trainedAt": datetime.now().isoformat(),
            "modelPath": str(model_path),
            "model_type": "Prophet"
        }
        
        metrics_path = MODELS_DIR / f"prophet_{product_id}_metrics.json"
        with open(metrics_path, "w") as f:
            json.dump(metrics, f, indent=2)
        
        return {
            "success": True,
            "metrics": metrics,
            "modelPath": str(model_path)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def predict_with_model(product_id: str, periods: int = 30) -> dict:
    """Make predictions using a trained model"""
    model_path = MODELS_DIR / f"prophet_{product_id}.pkl"
    
    if not model_path.exists():
        return {
            "success": False,
            "error": "Model not found"
        }
    
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        # Get the last 'periods' predictions
        predictions = forecast.tail(periods)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
        
        return {
            "success": True,
            "predictions": predictions.to_dict(orient="records"),
            "totalPredicted": round(predictions["yhat"].sum(), 2),
            "avgDaily": round(predictions["yhat"].mean(), 2)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_all_products(db) -> list:
    """Get all active products"""
    products = list(db.Product.find(
        {"isActive": True},
        {"_id": 1, "name": 1, "sku": 1}
    ))
    return products


def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Prophet ML Training Service")
    parser.add_argument("--product-id", type=str, help="Train specific product")
    parser.add_argument("--export-data", action="store_true", help="Export training data")
    parser.add_argument("--predict", type=str, help="Make prediction for product")
    parser.add_argument("--periods", type=int, default=30, help="Prediction periods (days)")
    
    args = parser.parse_args()
    
    print("🚀 Prophet ML Training Service")
    print("=" * 50)
    
    db = get_mongodb_connection()
    
    # Prediction mode
    if args.predict:
        print(f"\n📊 Making prediction for product: {args.predict}")
        result = predict_with_model(args.predict, args.periods)
        print(json.dumps(result, indent=2, default=str))
        return
    
    # Get products to train
    if args.product_id:
        products = [{"_id": args.product_id, "name": "Selected Product"}]
    else:
        products = get_all_products(db)
    
    print(f"\n📦 Found {len(products)} products to train")
    
    results = {
        "successful": 0,
        "failed": 0,
        "skipped": 0,
        "details": []
    }
    
    for i, product in enumerate(products, 1):
        product_id = str(product["_id"])
        product_name = product.get("name", "Unknown")
        
        print(f"\n[{i}/{len(products)}] Training: {product_name[:40]}...")
        
        # Fetch historical data
        df = fetch_historical_data(db, product_id)
        
        if df.empty:
            print(f"  ⏭️ Skipped: No historical data")
            results["skipped"] += 1
            results["details"].append({
                "productId": product_id,
                "productName": product_name,
                "status": "skipped",
                "reason": "No historical data"
            })
            continue
        
        # Fill missing dates
        df = fill_missing_dates(df)
        
        # Export data if requested
        if args.export_data:
            export_path = MODELS_DIR / f"data_{product_id}.csv"
            df.to_csv(export_path, index=False)
            print(f"  📁 Exported to: {export_path}")
        
        # Train model
        result = train_prophet_model(df, product_id)
        
        if result["success"]:
            print(f"  ✅ Success! Accuracy: {result['metrics']['accuracy']}%")
            results["successful"] += 1
            results["details"].append({
                "productId": product_id,
                "productName": product_name,
                "status": "success",
                "metrics": result["metrics"]
            })
        else:
            print(f"  ❌ Failed: {result['error']}")
            results["failed"] += 1
            results["details"].append({
                "productId": product_id,
                "productName": product_name,
                "status": "failed",
                "error": result["error"]
            })
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TRAINING SUMMARY")
    print(f"  ✅ Successful: {results['successful']}")
    print(f"  ❌ Failed: {results['failed']}")
    print(f"  ⏭️ Skipped: {results['skipped']}")
    print(f"  📁 Models saved to: {MODELS_DIR}")
    
    # Save summary
    summary_path = MODELS_DIR / "training_summary.json"
    with open(summary_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "successful": results["successful"],
                "failed": results["failed"],
                "skipped": results["skipped"],
                "total": len(products)
            },
            "details": results["details"]
        }, f, indent=2)
    
    print(f"\n✅ Training complete! Summary saved to: {summary_path}")


if __name__ == "__main__":
    main()
