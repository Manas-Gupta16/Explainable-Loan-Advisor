from typing import List, Dict, Any
from backend.app.schemas.loan import BankRecommendation

BANKS_CONFIG = [
    {
        "bank_name": "Apex National Bank",
        "min_cibil": 740,
        "max_dti": 0.40,
        "min_income": 40000,
        "base_interest_rate": 8.5,
        "description": "Lowest interest rate premier lender for high credit tier applicants."
    },
    {
        "bank_name": "Premier Credit Bank",
        "min_cibil": 680,
        "max_dti": 0.50,
        "min_income": 30000,
        "base_interest_rate": 10.2,
        "description": "Flexible underwriting lender with fast approval processing."
    },
    {
        "bank_name": "Horizon Capital NBFC",
        "min_cibil": 600,
        "max_dti": 0.60,
        "min_income": 20000,
        "base_interest_rate": 12.8,
        "description": "Specialized lender for medium credit scores and self-employed applicants."
    },
    {
        "bank_name": "Vanguard Microfinance",
        "min_cibil": 500,
        "max_dti": 0.70,
        "min_income": 15000,
        "base_interest_rate": 14.5,
        "description": "Inclusive credit lender accepting high debt-to-income applicants."
    }
]

def calculate_monthly_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """Calculates Equated Monthly Installment (EMI)."""
    if tenure_months <= 0 or principal <= 0:
        return 0.0
    r = annual_rate / (12 * 100)
    n = tenure_months
    if r == 0:
        return principal / n
    emi = (principal * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)
    return round(emi, 2)

def evaluate_bank_recommendations(app_dict: Dict[str, Any], approval_prob: float) -> List[BankRecommendation]:
    """
    Evaluates applicant parameters against multi-bank underwriting criteria
    and returns a ranked list of recommended bank options.
    """
    cibil = app_dict.get('cibil_score', 650)
    total_income = app_dict.get('applicant_income', 0) + app_dict.get('coapplicant_income', 0)
    existing_debts = app_dict.get('existing_debts', 0)
    loan_amount = app_dict.get('loan_amount', 0)
    tenure = app_dict.get('loan_tenure_months', 36)

    monthly_income = max(total_income / 12.0, 1.0)
    monthly_debt = existing_debts / 12.0
    dti_ratio = monthly_debt / monthly_income

    recommendations = []

    for bank in BANKS_CONFIG:
        # Check eligibility
        cibil_eligible = cibil >= bank['min_cibil']
        dti_eligible = dti_ratio <= bank['max_dti']
        income_eligible = total_income >= bank['min_income']

        match_score = 0.0
        if cibil_eligible: match_score += 40
        else: match_score += max(0, 40 - (bank['min_cibil'] - cibil) * 0.5)

        if dti_eligible: match_score += 30
        else: match_score += max(0, 30 - (dti_ratio - bank['max_dti']) * 50)

        if income_eligible: match_score += 30

        match_score = min(100.0, round(match_score * approval_prob, 1))

        status = "RECOMMENDED" if (cibil_eligible and dti_eligible and income_eligible and approval_prob >= 0.5) else "CONDITIONAL"

        reason = f"Fits credit criteria ({bank['min_cibil']}+ CIBIL)." if status == "RECOMMENDED" else f"Requires CIBIL score of {bank['min_cibil']}+ or lower DTI."

        emi = calculate_monthly_emi(loan_amount, bank['base_interest_rate'], tenure)

        recommendations.append(BankRecommendation(
            bank_name=bank['bank_name'],
            match_score=match_score,
            base_interest_rate=bank['base_interest_rate'],
            estimated_monthly_emi=emi,
            status=status,
            reason=reason
        ))

    # Sort by match score descending
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations
