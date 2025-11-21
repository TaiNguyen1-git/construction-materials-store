import os
import json
from pathlib import Path
import pandas as pd
from prophet import Prophet
from prisma import Prisma

# Initialize Prisma client
prisma = Prisma()
prisma.connect()

# Directory to store models
MODEL_DIR = Path(__file__).parent / 'models'
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def fetch_order_data(product_id: str) -> pd.DataFrame:
    # Fetch order items for a specific product
    records = prisma.orderitem.find_many(
        where={
            'productId': product_id,
        },
        select={
            'order': {'select': {'createdAt': True}},
            'quantity': True,
        }
    )
    # Aggregate daily quantity
    data = []
    for rec in records:
        date = rec['order']['createdAt'].date()
        data.append({'ds': date, 'y': rec['quantity']})
    df = pd.DataFrame(data)
    if df.empty:
        return pd.DataFrame(columns=['ds', 'y'])
    # Sum quantities per day
    df = df.groupby('ds').sum().reset_index()
    return df

def train_model(product_id: str, product_name: str):
    df = fetch_order_data(product_id)
    if df.empty:
        print(f"No data for product {product_name} ({product_id})")
        return None
    model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
    model.fit(df)
    model_path = MODEL_DIR / f"{product_id}.pkl"
    model.save(str(model_path))
    print(f"Trained model for {product_name} saved to {model_path}")
    return model_path

def main():
    # Get all active products
    products = prisma.product.find_many(where={'isActive': True}, select={'id': True, 'name': True})
    for prod in products:
        train_model(prod['id'], prod['name'])
    prisma.disconnect()

if __name__ == "__main__":
    main()
