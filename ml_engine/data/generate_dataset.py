import os
import numpy as np
import pandas as pd

def calculate_monthly_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """Calculates Equated Monthly Installment (EMI) in INR."""
    if tenure_months <= 0 or principal <= 0:
        return 0.0
    r = annual_rate / (12.0 * 100.0)
    n = float(tenure_months)
    if r == 0:
        return principal / n
    emi = (principal * r * ((1.0 + r) ** n)) / (((1.0 + r) ** n) - 1.0)
    return emi

def generate_indian_loan_dataset(num_samples: int = 10000, seed: int = 42) -> pd.DataFrame:
    """
    Generates a production-grade, realistic Indian Retail Banking dataset (10,000+ samples)
    incorporating RBI underwriting guidelines, CIBIL score bands (300-850), FOIR / DBR limits,
    Indian income distributions (Salaried / Self-Employed in INR), and multi-product loan parameters.
    """
    np.random.seed(seed)

    # 1. Financial & Demographic Features (in INR)
    # Monthly applicant income in INR: Log-normal distribution with median ~ ₹48,000, range ₹18,000 to ₹3,50,000
    monthly_applicant_income = np.random.lognormal(mean=10.8, sigma=0.55, size=num_samples).round(-2)
    monthly_applicant_income = np.clip(monthly_applicant_income, 18000, 350000)

    # Co-applicant monthly income: 45% have co-applicant (spouse/parent)
    has_coapplicant = np.random.choice([0, 1], p=[0.55, 0.45], size=num_samples)
    monthly_coapplicant_income = has_coapplicant * np.random.lognormal(mean=10.3, sigma=0.5, size=num_samples).round(-2)
    monthly_coapplicant_income = np.clip(monthly_coapplicant_income, 0, 180000)

    # Total Monthly & Annual Income
    total_monthly_income = monthly_applicant_income + monthly_coapplicant_income
    annual_applicant_income = monthly_applicant_income * 12.0
    annual_coapplicant_income = monthly_coapplicant_income * 12.0
    total_annual_income = annual_applicant_income + annual_coapplicant_income

    # CIBIL Score (TransUnion CIBIL India: 300 - 850)
    cibil_mix = np.random.choice(['subprime', 'near_prime', 'prime', 'super_prime'], 
                                  p=[0.20, 0.30, 0.35, 0.15], size=num_samples)
    cibil_score = np.zeros(num_samples, dtype=int)
    for i, tier in enumerate(cibil_mix):
        if tier == 'subprime':
            cibil_score[i] = int(np.random.normal(570, 40))
        elif tier == 'near_prime':
            cibil_score[i] = int(np.random.normal(675, 25))
        elif tier == 'prime':
            cibil_score[i] = int(np.random.normal(745, 25))
        else:
            cibil_score[i] = int(np.random.normal(810, 20))
    cibil_score = np.clip(cibil_score, 300, 850)

    # Loan Purpose & Typical Tenures
    loan_purpose = np.random.choice(
        ['Personal', 'Home', 'Vehicle', 'Education', 'Business'], 
        size=num_samples, 
        p=[0.35, 0.25, 0.15, 0.12, 0.13]
    )

    loan_tenure_months = np.zeros(num_samples, dtype=int)
    loan_amount = np.zeros(num_samples, dtype=float)
    base_interest_rate = np.zeros(num_samples, dtype=float)

    for i in range(num_samples):
        purp = loan_purpose[i]
        m_inc = total_monthly_income[i]
        
        if purp == 'Home':
            # Home Loans: 15L to 1.5Cr, 120-240 months, ~8.5-9.5%
            tenure = np.random.choice([120, 180, 240, 300], p=[0.15, 0.35, 0.40, 0.10])
            amt = np.random.uniform(15, 65) * m_inc
            amt = np.clip(amt, 1500000, 15000000)
            rate = np.random.uniform(8.40, 9.50)
        elif purp == 'Personal':
            # Personal Loans: 50k to 20L, 12-60 months, ~10.5-15.0%
            tenure = np.random.choice([12, 24, 36, 48, 60], p=[0.10, 0.25, 0.35, 0.20, 0.10])
            amt = np.random.uniform(2, 18) * m_inc
            amt = np.clip(amt, 50000, 2000000)
            rate = np.random.uniform(10.50, 15.00)
        elif purp == 'Vehicle':
            # Auto Loans: 2L to 25L, 36-84 months, ~8.8-11.5%
            tenure = np.random.choice([36, 48, 60, 84], p=[0.25, 0.35, 0.30, 0.10])
            amt = np.random.uniform(4, 16) * m_inc
            amt = np.clip(amt, 200000, 2500000)
            rate = np.random.uniform(8.80, 11.50)
        elif purp == 'Education':
            # Education Loans: 2L to 40L, 36-120 months, ~9.5-12.5%
            tenure = np.random.choice([36, 60, 84, 120], p=[0.20, 0.40, 0.30, 0.10])
            amt = np.random.uniform(3, 22) * m_inc
            amt = np.clip(amt, 200000, 4000000)
            rate = np.random.uniform(9.50, 12.50)
        else: # Business / MSME
            # MSME Loans: 1L to 50L, 12-60 months, ~11.5-16.5%
            tenure = np.random.choice([12, 24, 36, 60], p=[0.15, 0.35, 0.35, 0.15])
            amt = np.random.uniform(3, 25) * m_inc
            amt = np.clip(amt, 100000, 5000000)
            rate = np.random.uniform(11.50, 16.50)

        loan_tenure_months[i] = int(tenure)
        loan_amount[i] = round(float(amt), -3)
        base_interest_rate[i] = rate

    # Existing Monthly Debt / EMI obligations (₹0 to ₹60,000)
    existing_monthly_debts = (monthly_applicant_income * np.random.uniform(0.0, 0.45, size=num_samples)).round(-2)
    # Annual existing debts
    existing_debts_annual = existing_monthly_debts * 12.0

    # Credit Card Utilization (0% to 95%)
    credit_card_utilization = np.random.beta(a=2.2, b=3.5, size=num_samples).round(2)
    credit_card_utilization = np.clip(credit_card_utilization, 0.05, 0.95)

    # Delinquent lines / Overdue DPD in past 2 years
    delinquent_lines_2yrs = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.74, 0.16, 0.06, 0.03, 0.01])

    # Credit History Length (years)
    credit_history_years = np.clip(np.random.normal(loc=6.5, scale=4.0, size=num_samples).round(1), 0.5, 30.0)

    # Employment & Demographic Features
    employment_status = np.random.choice(['Salaried', 'Self-Employed', 'Business', 'Unemployed'], size=num_samples, p=[0.58, 0.24, 0.15, 0.03])
    education = np.random.choice(['Graduate', 'Post Graduate', 'Professional', 'Undergraduate'], size=num_samples, p=[0.50, 0.30, 0.12, 0.08])
    home_ownership = np.random.choice(['OWN', 'RENT', 'MORTGAGE'], size=num_samples, p=[0.38, 0.42, 0.20])

    # 2. Derive True Indian Underwriting Metrics
    # Calculate Proposed Monthly Loan EMI
    proposed_emi = np.array([
        calculate_monthly_emi(loan_amount[i], base_interest_rate[i], loan_tenure_months[i])
        for i in range(num_samples)
    ])

    # Total Monthly Obligations (Existing EMIs + Proposed EMI)
    total_obligations = existing_monthly_debts + proposed_emi

    # Fixed Obligation to Income Ratio (FOIR)
    foir_ratio = np.round(total_obligations / np.maximum(total_monthly_income, 1.0), 4)

    # Debt to Income Ratio (DTI on existing debt)
    dti_ratio = np.round(existing_monthly_debts / np.maximum(total_monthly_income, 1.0), 4)

    # Loan to Annual Income Ratio (LTI)
    loan_to_income_ratio = np.round(loan_amount / np.maximum(total_annual_income, 1.0), 4)

    # 3. Ground Truth Underwriting Logic (RBI & Indian Retail Bank Credit Model)
    underwriting_score = np.zeros(num_samples)

    for i in range(num_samples):
        score = 0.0

        # A. CIBIL Bureau Scoring (TransUnion CIBIL India 300-900)
        c = cibil_score[i]
        if c >= 780:
            score += 2.2
        elif c >= 740:
            score += 1.4
        elif c >= 700:
            score += 0.5
        elif c >= 650:
            score -= 0.8
        elif c >= 600:
            score -= 2.0
        elif c >= 550:
            score -= 3.8
        else:
            score -= 6.5

        # B. FOIR (Fixed Obligation to Income Ratio) - The Golden Indian Underwriting Constraint
        f = foir_ratio[i]
        if f <= 0.35:
            score += 2.4
        elif f <= 0.45:
            score += 1.3
        elif f <= 0.55:
            score += 0.1
        elif f <= 0.65:
            score -= 2.0
        elif f <= 0.75:
            score -= 4.2
        else:
            score -= 7.0

        # C. Net Monthly Income Disposable Buffer
        m_inc = monthly_applicant_income[i]
        if m_inc >= 150000:
            score += 1.5
        elif m_inc >= 75000:
            score += 0.8
        elif m_inc >= 40000:
            score += 0.2
        elif m_inc < 22000:
            score -= 1.2

        # D. Co-Applicant Boost
        if monthly_coapplicant_income[i] > 20000:
            score += 0.6

        # E. Credit Card Utilization
        util = credit_card_utilization[i]
        if util <= 0.25:
            score += 0.6
        elif util <= 0.50:
            score += 0.1
        elif util <= 0.75:
            score -= 1.0
        else:
            score -= 2.2

        # F. Delinquent Lines / 30+ DPD
        delinq = delinquent_lines_2yrs[i]
        if delinq == 0:
            score += 0.5
        elif delinq == 1:
            score -= 1.4
        elif delinq == 2:
            score -= 3.2
        else:
            score -= 6.0

        # G. Employment & Stability
        emp = employment_status[i]
        if emp == 'Salaried':
            score += 0.5
        elif emp == 'Business':
            score += 0.2
        elif emp == 'Self-Employed':
            score += 0.0
        elif emp == 'Unemployed':
            score -= 5.0

        # H. Credit History Tenure
        if credit_history_years[i] >= 6.0:
            score += 0.4
        elif credit_history_years[i] < 2.0:
            score -= 0.4

        # I. Home Ownership
        if home_ownership[i] == 'OWN':
            score += 0.3
        elif home_ownership[i] == 'RENT':
            score -= 0.2

        underwriting_score[i] = score

    # Convert to calibrated probability with standard logistic sigmoid + noise
    noise = np.random.normal(0, 0.40, size=num_samples)
    prob = 1.0 / (1.0 + np.exp(-(underwriting_score + noise)))
    loan_status = (prob >= 0.50).astype(int)

    # Construct DataFrame (Annual incomes / debts stored for standardized schema)
    df = pd.DataFrame({
        'cibil_score': cibil_score,
        'applicant_income': annual_applicant_income,
        'coapplicant_income': annual_coapplicant_income,
        'loan_amount': loan_amount,
        'loan_tenure_months': loan_tenure_months,
        'existing_debts': existing_debts_annual,
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

# Backward compatibility aliases
generate_loan_dataset = generate_indian_loan_dataset
generate_synthetic_loan_data = generate_indian_loan_dataset

if __name__ == '__main__':
    data_dir = os.path.dirname(__file__)
    os.makedirs(data_dir, exist_ok=True)
    file_path = os.path.join(data_dir, 'loan_dataset.csv')
    df = generate_indian_loan_dataset(num_samples=10000, seed=42)
    df.to_csv(file_path, index=False)
    print(f"Realistic Indian Banking Dataset generated successfully at {file_path}")
    print(f"Dataset Shape: {df.shape}")
    print(f"Overall Loan Approval Rate: {df['loan_status'].mean() * 100:.2f}%")

