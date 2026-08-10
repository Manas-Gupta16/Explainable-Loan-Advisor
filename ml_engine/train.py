import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except Exception:
    HAS_XGBOOST = False

from sklearn.ensemble import RandomForestClassifier

from ml_engine.data.loader import load_and_normalize_dataset
from ml_engine.data.generate_dataset import generate_loan_dataset
from ml_engine.preprocessing import LoanPreprocessor

def train_model():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'ml_engine', 'data')
    artifacts_dir = os.path.join(base_dir, 'ml_engine', 'artifacts')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, 'loan_dataset.csv')
    if not os.path.exists(csv_path):
        print(f"No existing dataset found at {csv_path}. Generating default dataset...")
        df_gen = generate_loan_dataset(num_samples=5000)
        df_gen.to_csv(csv_path, index=False)

    df = load_and_normalize_dataset(csv_path)

    # Preprocessing
    preprocessor = LoanPreprocessor()
    X_processed, y = preprocessor.fit_transform(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X_processed, y, test_size=0.2, random_state=42, stratify=y
    )

    model_type = 'XGBoostClassifier'
    if HAS_XGBOOST:
        try:
            scale_pos_weight = (len(y_train) - sum(y_train)) / max(sum(y_train), 1)
            model = XGBClassifier(
                n_estimators=150,
                max_depth=5,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                random_state=42,
                eval_metric='logloss'
            )
            model.fit(X_train, y_train)
        except Exception as e:
            print(f"XGBoost runtime load failed: {e}. Falling back to RandomForestClassifier...")
            model = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, class_weight='balanced')
            model.fit(X_train, y_train)
            model_type = 'RandomForestClassifier'
    else:
        print("XGBoost library unavailable. Training RandomForestClassifier fallback...")
        model = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, class_weight='balanced')
        model.fit(X_train, y_train)
        model_type = 'RandomForestClassifier'

    print(f"Trained {model_type} on {len(X_train)} samples with {X_train.shape[1]} features...")

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, zero_division=0)),
        'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
        'roc_auc': float(roc_auc_score(y_test, y_proba))
    }

    print("\n--- MODEL PERFORMANCE METRICS ---")
    for k, v in metrics.items():
        print(f"  {k.upper()}: {v:.4f}")

    from ml_engine.conformal import ConformalPredictor
    conformal_predictor = ConformalPredictor(model=model, preprocessor=preprocessor)
    conformal_predictor.calibrate(X_test, y_test)
    conformal_path = os.path.join(artifacts_dir, 'conformal.joblib')
    conformal_predictor.save(conformal_path)

    # Save artifacts
    model_path = os.path.join(artifacts_dir, 'model.joblib')
    preprocessor_path = os.path.join(artifacts_dir, 'preprocessor.joblib')
    metadata_path = os.path.join(artifacts_dir, 'metadata.json')

    joblib.dump(model, model_path)
    preprocessor.save(preprocessor_path)

    metadata = {
        'metrics': metrics,
        'feature_names': preprocessor.feature_names,
        'dataset_shape': df.shape,
        'model_type': model_type,
        'has_conformal_calibrator': True
    }
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\nArtifacts successfully saved to: {artifacts_dir}")
    return model, preprocessor, metrics

if __name__ == '__main__':
    train_model()
