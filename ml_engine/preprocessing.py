import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
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
    'loan_to_income_ratio',
    'foir_ratio'
]

CATEGORICAL_FEATURES = [
    'employment_status',
    'education',
    'home_ownership',
    'loan_purpose'
]

class LoanPreprocessor:
    """
    Production-grade preprocessing & feature engineering pipeline for Indian Retail Banking.
    Handles feature extraction, FOIR / DTI calculation, scaling, and categorical encoding.
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.is_fitted = False
        self.feature_names: List[str] = []

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derives Indian retail banking domain ratios (FOIR, DTI, LTI)."""
        df_copy = df.copy()

        # Handle potential missing or scalar values
        app_inc = df_copy['applicant_income'] if 'applicant_income' in df_copy.columns else 0.0
        coapp_inc = df_copy['coapplicant_income'] if 'coapplicant_income' in df_copy.columns else 0.0
        debts = df_copy['existing_debts'] if 'existing_debts' in df_copy.columns else 0.0
        loan_amt = df_copy['loan_amount'] if 'loan_amount' in df_copy.columns else 0.0
        tenure = df_copy['loan_tenure_months'] if 'loan_tenure_months' in df_copy.columns else 36

        total_income = app_inc + coapp_inc
        monthly_income = np.maximum(total_income / 12.0, 1.0)
        monthly_debt = debts / 12.0

        # Estimated benchmark EMI at 10.5% APR
        r = 10.5 / (12.0 * 100.0)
        n = np.maximum(tenure, 1.0)
        factor = (1.0 + r) ** n
        estimated_emi = np.where(
            factor > 1.0,
            (loan_amt * r * factor) / np.maximum(factor - 1.0, 1e-6),
            loan_amt / n
        )

        # Derived Ratios
        df_copy['dti_ratio'] = np.round(monthly_debt / monthly_income, 4)
        df_copy['loan_to_income_ratio'] = np.round(loan_amt / np.maximum(total_income, 1.0), 4)
        df_copy['foir_ratio'] = np.round((monthly_debt + estimated_emi) / monthly_income, 4)

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
