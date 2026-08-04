import os
import pandas as pd
import numpy as np
from typing import Tuple, Optional

# Standard Column Schema for the XAI Loan Model
STANDARD_COLUMNS = [
    'cibil_score',
    'applicant_income',
    'coapplicant_income',
    'loan_amount',
    'loan_tenure_months',
    'existing_debts',
    'credit_card_utilization',
    'delinquent_lines_2yrs',
    'credit_history_years',
    'employment_status',
    'education',
    'home_ownership',
    'loan_purpose',
    'loan_status'
]

# Known Kaggle/LendingClub Column Mapping Table
KAGGLE_LOAN_MAP = {
    'ApplicantIncome': 'applicant_income',
    'CoapplicantIncome': 'coapplicant_income',
    'LoanAmount': 'loan_amount',
    'Loan_Amount_Term': 'loan_tenure_months',
    'Credit_History': 'cibil_score',  # Converted to 300-850 scale
    'Gender': 'gender',
    'Married': 'married_status',
    'Education': 'education',
    'Self_Employed': 'employment_status',
    'Property_Area': 'home_ownership',
    'Loan_Status': 'loan_status'
}

def load_and_normalize_dataset(file_path: str) -> pd.DataFrame:
    """
    Dynamically loads any external CSV dataset (Kaggle Loan Prediction, Lending Club, etc.),
    maps heterogenous column names to standard schema, cleans missing values, and returns a clean DataFrame.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at: {file_path}. Please place your CSV file in ml_engine/data/")

    print(f"Loading external dataset from: {file_path}")
    df = pd.read_csv(file_path)

    # 1. Rename columns if Kaggle format detected
    rename_dict = {}
    for col in df.columns:
        if col in KAGGLE_LOAN_MAP:
            rename_dict[col] = KAGGLE_LOAN_MAP[col]
        elif col.lower() in [c.lower() for c in STANDARD_COLUMNS]:
            # Match case-insensitively
            matched = [c for c in STANDARD_COLUMNS if c.lower() == col.lower()][0]
            rename_dict[col] = matched

    df = df.rename(columns=rename_dict)

    # 2. Convert Target Column ('Loan_Status', 'loan_status', etc.)
    target_col = 'loan_status'
    if target_col in df.columns:
        if df[target_col].dtype == object:
            df[target_col] = df[target_col].astype(str).str.strip().str.upper().map({'Y': 1, 'N': 0, '1': 1, '0': 0, 'APPROVED': 1, 'REJECTED': 0}).fillna(0).astype(int)

    # 3. Dynamic Column Filling & Synthesizing missing financial features if external dataset is minimalist
    if 'cibil_score' not in df.columns or df['cibil_score'].nunique() <= 3:
        # If Kaggle binary Credit_History (1/0) is used, map to realistic CIBIL distribution
        if 'cibil_score' in df.columns:
            df['cibil_score'] = df['cibil_score'].apply(lambda x: int(np.random.normal(740, 40)) if x == 1 else int(np.random.normal(580, 50)))
            df['cibil_score'] = np.clip(df['cibil_score'], 300, 850)
        else:
            df['cibil_score'] = np.random.normal(680, 80, size=len(df)).astype(int).clip(300, 850)

    if 'applicant_income' in df.columns and df['applicant_income'].mean() < 1000:
        # Scale monthly to annual if needed
        df['applicant_income'] = df['applicant_income'] * 12

    if 'loan_amount' in df.columns and df['loan_amount'].mean() < 1000:
        # Thousands unit conversion (e.g. 150 -> 150000)
        df['loan_amount'] = df['loan_amount'] * 1000

    if 'existing_debts' not in df.columns:
        df['existing_debts'] = (df['applicant_income'] * np.random.uniform(0.1, 0.4, size=len(df))).round(-2)

    if 'credit_card_utilization' not in df.columns:
        df['credit_card_utilization'] = np.random.uniform(0.1, 0.85, size=len(df)).round(2)

    if 'delinquent_lines_2yrs' not in df.columns:
        df['delinquent_lines_2yrs'] = np.random.choice([0, 1, 2], size=len(df), p=[0.8, 0.15, 0.05])

    if 'credit_history_years' not in df.columns:
        df['credit_history_years'] = np.random.uniform(1.0, 25.0, size=len(df)).round(1)

    if 'employment_status' not in df.columns:
        df['employment_status'] = 'Salaried'

    if 'education' not in df.columns:
        df['education'] = 'Graduate'

    if 'home_ownership' not in df.columns:
        df['home_ownership'] = 'RENT'

    if 'loan_purpose' not in df.columns:
        df['loan_purpose'] = 'Personal'

    # Fill NaNs
    num_cols = df.select_dtypes(include=[np.number]).columns
    cat_cols = df.select_dtypes(include=['object']).columns

    for c in num_cols:
        df[c] = df[c].fillna(df[c].median())
    for c in cat_cols:
        df[c] = df[c].fillna(df[c].mode()[0] if not df[c].mode().empty else 'Unknown')

    print(f"Dataset successfully normalized. Final shape: {df.shape}")
    return df

if __name__ == '__main__':
    data_dir = os.path.dirname(__file__)
    csv_file = os.path.join(data_dir, 'loan_dataset.csv')
    if os.path.exists(csv_file):
        df = load_and_normalize_dataset(csv_file)
        print("Sample data:")
        print(df.head())
