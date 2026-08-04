import os
import numpy as np
import pandas as pd

def generate_loan_dataset(num_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic loan default & credit scoring dataset incorporating
    standard underwriting factors (CIBIL, DTI, Income, Utilization, Credit History).
    """
    np.random.seed(seed)

    # 1. Financial & Demographic Features
    applicant_income = np.random.lognormal(mean=10.8, sigma=0.6, size=num_samples).round(-2)
    applicant_income = np.clip(applicant_income, 15000, 500000)

    coapplicant_income = np.random.choice([0, 1], p=[0.4, 0.6], size=num_samples) * \
                         np.random.lognormal(mean=10.2, sigma=0.5, size=num_samples).round(-2)
    coapplicant_income = np.clip(coapplicant_income, 0, 250000)

    cibil_score = np.random.normal(loc=690, scale=85, size=num_samples).astype(int)
    cibil_score = np.clip(cibil_score, 300, 850)

    loan_amount = (applicant_income + coapplicant_income) * np.random.uniform(0.5, 4.5, size=num_samples)
    loan_amount = np.clip(loan_amount.round(-2), 2000, 1000000)

    tenure_choices = [12, 24, 36, 48, 60, 120, 180, 240, 360]
    loan_tenure_months = np.random.choice(tenure_choices, size=num_samples, p=[0.05, 0.1, 0.25, 0.15, 0.2, 0.1, 0.05, 0.05, 0.05])

    existing_debts = (applicant_income * np.random.uniform(0.0, 0.6, size=num_samples)).round(-2)
    credit_card_utilization = np.random.beta(a=2, b=3, size=num_samples).round(2)
    
    delinquent_lines_2yrs = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.75, 0.15, 0.06, 0.03, 0.01])
    credit_history_years = np.clip(np.random.normal(loc=8, scale=5, size=num_samples).round(1), 0.5, 35)

    employment_status = np.random.choice(['Salaried', 'Self-Employed', 'Business', 'Unemployed'], size=num_samples, p=[0.55, 0.25, 0.15, 0.05])
    education = np.random.choice(['Graduate', 'Not Graduate', 'Post Graduate'], size=num_samples, p=[0.60, 0.15, 0.25])
    home_ownership = np.random.choice(['OWN', 'RENT', 'MORTGAGE'], size=num_samples, p=[0.35, 0.40, 0.25])
    loan_purpose = np.random.choice(['Personal', 'Home', 'Education', 'Vehicle', 'Business'], size=num_samples, p=[0.30, 0.25, 0.15, 0.15, 0.15])

    # 2. Derive Underwriting Ratios
    total_income = applicant_income + coapplicant_income
    monthly_income = total_income / 12.0
    monthly_debt = existing_debts / 12.0
    dti_ratio = np.round(monthly_debt / np.maximum(monthly_income, 1.0), 3)

    # 3. Formulate Realistic Underwriting Ground Truth Score (Log-odds)
    # Higher CIBIL, higher income, lower DTI, lower utilization -> higher approval odds
    emp_bonus = np.select([employment_status == 'Salaried', employment_status == 'Unemployed'], [0.5, -0.3], default=0.0)
    home_bonus = np.select([home_ownership == 'OWN', home_ownership == 'RENT'], [0.4, -0.2], default=0.1)

    score = (
        0.015 * (cibil_score - 600) +
        0.000008 * applicant_income +
        0.000005 * coapplicant_income -
        0.000006 * loan_amount -
        2.5 * dti_ratio -
        2.0 * credit_card_utilization -
        0.8 * delinquent_lines_2yrs +
        0.05 * credit_history_years +
        emp_bonus +
        home_bonus
    )

    # Convert score to probability using sigmoid and add noise
    prob = 1 / (1 + np.exp(-(score + np.random.normal(0, 0.5, size=num_samples))))
    loan_status = (prob >= 0.5).astype(int)

    df = pd.DataFrame({
        'cibil_score': cibil_score,
        'applicant_income': applicant_income,
        'coapplicant_income': coapplicant_income,
        'loan_amount': loan_amount,
        'loan_tenure_months': loan_tenure_months,
        'existing_debts': existing_debts,
        'credit_card_utilization': credit_card_utilization,
        'delinquent_lines_2yrs': delinquent_lines_2yrs,
        'credit_history_years': credit_history_years,
        'employment_status': employment_status,
        'education': education,
        'home_ownership': home_ownership,
        'loan_purpose': loan_purpose,
        'loan_status': loan_status
    })

    return df

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__))
    os.makedirs(data_dir, exist_ok=True)
    file_path = os.path.join(data_dir, 'loan_dataset.csv')
    df = generate_loan_dataset()
    df.to_csv(file_path, index=False)
    print(f"Dataset generated successfully at {file_path} with shape: {df.shape}")
    print(f"Approval rate: {df['loan_status'].mean() * 100:.2f}%")
