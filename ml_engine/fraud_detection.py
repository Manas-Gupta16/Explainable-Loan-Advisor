import os
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from ml_engine.data.loader import load_and_normalize_dataset
from ml_engine.preprocessing import LoanPreprocessor

def train_fraud_model():
    print("Training Fraud Detection / Anomaly Model (Isolation Forest)...")
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'ml_engine', 'data')
    artifacts_dir = os.path.join(base_dir, 'ml_engine', 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, 'loan_dataset.csv')
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    # Load data
    df = load_and_normalize_dataset(csv_path)

    # Preprocess
    preprocessor = LoanPreprocessor()
    X_processed, _ = preprocessor.fit_transform(df)

    # We assume 1% of the realistic dataset might be highly anomalous / fraudulent
    contamination = 0.01 
    
    # Train Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=150,
        max_samples='auto',
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    
    iso_forest.fit(X_processed)

    # Save the model
    model_path = os.path.join(artifacts_dir, 'fraud_iso_forest.joblib')
    joblib.dump(iso_forest, model_path)
    
    print(f"Isolation Forest model saved to {model_path}")
    print("Fraud Detection training complete.")

if __name__ == '__main__':
    train_fraud_model()
