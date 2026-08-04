import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from typing import Tuple, Dict, Any, List

NUMERICAL_FEATURES = [
    'cibil_score',
    'applicant_income',
    'coapplicant_income',
    'loan_amount',
    'loan_tenure_months',
    'existing_debts',
    'credit_card_utilization',
    'delinquent_lines_2yrs',
    'credit_history_years',
    'dti_ratio',
    'loan_to_income_ratio'
]

CATEGORICAL_FEATURES = [
    'employment_status',
    'education',
    'home_ownership',
    'loan_purpose'
]

class LoanPreprocessor:
    """
    Production-grade preprocessing & feature engineering pipeline.
    Handles feature extraction, scaling, and categorical encoding.
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.is_fitted = False
        self.feature_names: List[str] = []

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derives financial domain ratios."""
        df_copy = df.copy()

        total_income = df_copy['applicant_income'] + df_copy['coapplicant_income']
        monthly_income = np.maximum(total_income / 12.0, 1.0)
        monthly_debt = df_copy['existing_debts'] / 12.0

        # Derived Ratios
        df_copy['dti_ratio'] = np.round(monthly_debt / monthly_income, 4)
        df_copy['loan_to_income_ratio'] = np.round(df_copy['loan_amount'] / np.maximum(total_income, 1.0), 4)

        return df_copy

    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Fits scalers/encoders on training data and returns preprocessed matrix X and target y."""
        df_engineered = self._engineer_features(df)

        X_num = df_engineered[NUMERICAL_FEATURES].values
        X_cat = df_engineered[CATEGORICAL_FEATURES]

        X_num_scaled = self.scaler.fit_transform(X_num)
        X_cat_encoded = self.encoder.fit_transform(X_cat)

        X_processed = np.hstack([X_num_scaled, X_cat_encoded])

        # Generate feature names for SHAP and model inspectability
        cat_feature_names = self.encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
        self.feature_names = NUMERICAL_FEATURES + cat_feature_names
        self.is_fitted = True

        y = df['loan_status'].values if 'loan_status' in df.columns else None
        return X_processed, y

    def transform_single(self, input_dict: Dict[str, Any]) -> pd.DataFrame:
        """Transforms a single user input payload into a DataFrame ready for transform."""
        df = pd.DataFrame([input_dict])
        df_engineered = self._engineer_features(df)

        X_num = df_engineered[NUMERICAL_FEATURES].values
        X_cat = df_engineered[CATEGORICAL_FEATURES]

        X_num_scaled = self.scaler.transform(X_num)
        X_cat_encoded = self.encoder.transform(X_cat)

        X_processed = np.hstack([X_num_scaled, X_cat_encoded])
        return pd.DataFrame(X_processed, columns=self.feature_names)

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforms a pandas DataFrame into preprocessed feature DataFrame with column names."""
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet!")

        df_engineered = self._engineer_features(df)

        X_num = df_engineered[NUMERICAL_FEATURES].values
        X_cat = df_engineered[CATEGORICAL_FEATURES]

        X_num_scaled = self.scaler.transform(X_num)
        X_cat_encoded = self.encoder.transform(X_cat)

        X_processed = np.hstack([X_num_scaled, X_cat_encoded])
        return pd.DataFrame(X_processed, columns=self.feature_names)

    def save(self, filepath: str):
        joblib.dump(self, filepath)
        print(f"Preprocessor artifact saved to: {filepath}")

    @staticmethod
    def load(filepath: str) -> 'LoanPreprocessor':
        preprocessor = joblib.load(filepath)
        print(f"Preprocessor loaded successfully from: {filepath}")
        return preprocessor
