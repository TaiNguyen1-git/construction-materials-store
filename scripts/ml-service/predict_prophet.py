import os
import json
from pathlib import Path
import pandas as pd
from prophet import Prophet
from prisma import Prisma

prisma = Prisma()
prisma.connect()

MODEL_DIR = Path(__file__).parent / 'models'

def load_model(product_id: str):
    model_path = MODEL_DIR / f"{product_id}.pkl"
    if not model_path.exists():
        raise FileNotFoundError(f"Model for product {product_id} not found.")
    model = Prophet()
    model = model.load(str(model_path))
    return model

def predict(product_id: str, periods: int = 30):
    model = load_model(product_id)
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    # Return only the needed columns
    result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
    return result.to_dict(orient='records')

def main():
    # Example usage: python predict_prophet.py <product_id>
    import sys
    if len(sys.argv) < 2:
        print('Usage: python predict_prophet.py <product_id>')
        return
    product_id = sys.argv[1]
    preds = predict(product_id)
    print(json.dumps(preds, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
