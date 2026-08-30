from typing import List, Dict, Any
from backend.app.schemas.loan import BankRecommendation
from backend.app.services.market_data_service import market_data_service

INDIAN_BANKS_CONFIG = [
    {
        "bank_name": "SBI Kisan Credit Card (KCC) & Agri",
        "product_name": "SBI Crop & Farm Investment Scheme",
        "min_cibil": 600,
        "max_foir": 0.65,
        "min_monthly_income": 12000,
        "repo_spread": 0.50, # E.g., Repo 6.50 + 0.50 = 7.00%
        "bank_type": "AGRI_PSU",
        "is_rural": True,
        "description": "Government-subsidized agricultural credit. Base rate linked to RBI Repo with prompt repayment subvention."
    },
    {
        "bank_name": "State Bank of India (SBI)",
        "product_name": "SBI Regular / Xpress Credit Loan",
        "min_cibil": 750,
        "max_foir": 0.50,
        "min_monthly_income": 25000,
        "repo_spread": 2.00, # 6.50 + 2.00 = 8.50%
        "bank_type": "PSU_BANK",
        "is_rural": False,
        "description": "India's largest PSU bank offering premier sovereign rates and lowest processing fees for prime credit tier borrowers."
    },
    {
        "bank_name": "Bank of Baroda Kisan Tatkal / Tractor",
        "product_name": "BoB Rural Agri & Equipment Loan",
        "min_cibil": 640,
        "max_foir": 0.60,
        "min_monthly_income": 15000,
        "repo_spread": 1.65, # 6.50 + 1.65 = 8.15%
        "bank_type": "AGRI_PSU",
        "is_rural": True,
        "description": "Specialized rural equipment & seasonal crop financing with post-harvest bullet repayment options."
    },
    {
        "bank_name": "Regional Rural Banks (RRB / NABARD)",
        "product_name": "Gramin Vikas Farm & Allied Loan",
        "min_cibil": 620,
        "max_foir": 0.65,
        "min_monthly_income": 10000,
        "repo_spread": 1.00, # 6.50 + 1.00 = 7.50%
        "bank_type": "RRB",
        "is_rural": True,
        "description": "NABARD-partnered regional rural banking scheme (e.g. Maharashtra Gramin Bank) tailored for local farmers and rural artisans."
    },
    {
        "bank_name": "Bandhan Bank Rural Micro-Enterprise",
        "product_name": "Suraksha Rural MSME & JLG Credit",
        "min_cibil": 580,
        "max_foir": 0.70,
        "min_monthly_income": 10000,
        "repo_spread": 6.00, # 6.50 + 6.00 = 12.50%
        "bank_type": "MICROFINANCE",
        "is_rural": True,
        "description": "Accessible financial inclusion credit for village Kirana stores, dairy co-ops, and self-help group (SHG) micro-entrepreneurs."
    },
    {
        "bank_name": "HDFC Bank",
        "product_name": "HDFC Express Personal / Rural Loan",
        "min_cibil": 720,
        "max_foir": 0.55,
        "min_monthly_income": 30000,
        "repo_spread": 4.00, # 6.50 + 4.00 = 10.50%
        "bank_type": "PRIVATE_BANK",
        "is_rural": False,
        "description": "Top private sector lender offering instant paperless disbursement for salaried corporate and large business owners."
    },
    {
        "bank_name": "ICICI Bank",
        "product_name": "ICICI Instant Asset Loan",
        "min_cibil": 700,
        "max_foir": 0.60,
        "min_monthly_income": 25000,
        "repo_spread": 4.25, # 6.50 + 4.25 = 10.75%
        "bank_type": "PRIVATE_BANK",
        "is_rural": False,
        "description": "Straight-through digital processing with pre-approved limits and flexible debt tolerance."
    },
    {
        "bank_name": "Axis Bank",
        "product_name": "Axis 24x7 Digital Quick Loan",
        "min_cibil": 680,
        "max_foir": 0.60,
        "min_monthly_income": 22000,
        "repo_spread": 4.49, # 6.50 + 4.49 = 10.99%
        "bank_type": "PRIVATE_BANK",
        "is_rural": False,
        "description": "Accessible multi-purpose credit with transparent digital KYC and quick sanction."
    },
    {
        "bank_name": "Bajaj Finserv Rural Kirana & MSME",
        "product_name": "Bajaj Rural Flexi Term Credit",
        "min_cibil": 620,
        "max_foir": 0.65,
        "min_monthly_income": 15000,
        "repo_spread": 7.00, # 6.50 + 7.00 = 13.50%
        "bank_type": "RETAIL_NBFC",
        "is_rural": True,
        "description": "Flexible working capital and inventory credit for rural traders, fertilizer distributors, and Kirana merchants."
    },
    {
        "bank_name": "Navi / Fibe Fintech NBFC",
        "product_name": "Navi Instant Digital Credit",
        "min_cibil": 550,
        "max_foir": 0.75,
        "min_monthly_income": 12000,
        "repo_spread": 9.00, # 6.50 + 9.00 = 15.50%
        "bank_type": "DIGITAL_NBFC",
        "is_rural": False,
        "description": "Financial inclusion digital lender for gig workers, thin-file borrowers, and emergency liquidity requirements."
    }
]

# Aliased for backward compatibility
BANKS_CONFIG = INDIAN_BANKS_CONFIG

def calculate_monthly_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """Calculates Equated Monthly Installment (EMI) in INR."""
    if tenure_months <= 0 or principal <= 0:
        return 0.0
    r = annual_rate / (12.0 * 100.0)
    n = float(tenure_months)
    if r == 0:
        return round(principal / n, 2)
    emi = (principal * r * ((1.0 + r) ** n)) / (((1.0 + r) ** n) - 1.0)
    return round(emi, 2)

def evaluate_bank_recommendations(app_dict: Dict[str, Any], approval_prob: float) -> List[BankRecommendation]:
    """
    Evaluates applicant parameters against real Indian banking underwriting criteria (CIBIL, FOIR, Monthly Income).
    Dynamically calculates base_interest_rate using Live RBI Repo Rate + Bank Spread (EBLR model).
    Returns a ranked list of recommended Indian Banks and NBFC options.
    """
    cibil = app_dict.get('cibil_score', 650)
    applicant_income = app_dict.get('applicant_income', 0.0)
    coapplicant_income = app_dict.get('coapplicant_income', 0.0)
    total_annual_income = applicant_income + coapplicant_income
    
    # Standard schema stores annual income
    monthly_income = max(total_annual_income / 12.0, 1.0)
    
    existing_debts_annual = app_dict.get('existing_debts', 0.0)
    existing_monthly_debts = existing_debts_annual / 12.0
    
    loan_amount = app_dict.get('loan_amount', 0.0)
    tenure = app_dict.get('loan_tenure_months', 36)

    # 1. Fetch live RBI Repo Rate from market data service
    current_repo_rate = market_data_service.get_rbi_repo_rate()

    recommendations = []

    for bank in INDIAN_BANKS_CONFIG:
        # 2. Dynamically calculate interest rate (EBLR formula)
        dynamic_interest_rate = current_repo_rate + bank['repo_spread']
        
        # Calculate bank-specific EMI
        emi = calculate_monthly_emi(loan_amount, dynamic_interest_rate, tenure)
        total_monthly_obligations = existing_monthly_debts + emi
        foir = total_monthly_obligations / monthly_income

        cibil_eligible = cibil >= bank['min_cibil']
        foir_eligible = foir <= bank['max_foir']
        income_eligible = monthly_income >= bank['min_monthly_income']

        # Multi-factor Match Score Calculation
        match_score = 0.0
        
        if cibil_eligible:
            match_score += 40.0
        else:
            cibil_gap = bank['min_cibil'] - cibil
            match_score += max(0.0, 40.0 - (cibil_gap * 0.4))

        if foir_eligible:
            match_score += 35.0
        else:
            foir_excess = (foir - bank['max_foir']) * 100.0
            match_score += max(0.0, 35.0 - (foir_excess * 1.5))

        if income_eligible:
            match_score += 25.0
        else:
            match_score += max(0.0, 25.0 * (monthly_income / max(bank['min_monthly_income'], 1.0)))

        # Calibrate match score by overall ML approval probability
        effective_match = min(100.0, round((match_score * 0.60) + (approval_prob * 40.0), 1))

        is_recommended = cibil_eligible and foir_eligible and income_eligible and approval_prob >= 0.45

        status = "RECOMMENDED" if is_recommended else "CONDITIONAL"

        if is_recommended:
            reason = f"Excellent fit: CIBIL {cibil} meets {bank['min_cibil']}+ cutoff and FOIR of {foir*100:.1f}% is safely within {bank['max_foir']*100:.0f}% limit."
        else:
            reasons_list = []
            if not cibil_eligible:
                reasons_list.append(f"Requires CIBIL {bank['min_cibil']}+ (Current: {cibil})")
            if not foir_eligible:
                reasons_list.append(f"FOIR {foir*100:.1f}% exceeds bank max {bank['max_foir']*100:.0f}%")
            if not income_eligible:
                reasons_list.append(f"Min monthly income ₹{bank['min_monthly_income']:,} required")
            reason = " | ".join(reasons_list) if reasons_list else "Subject to manual underwriting review."

        recommendations.append(BankRecommendation(
            bank_name=bank['bank_name'],
            match_score=effective_match,
            base_interest_rate=dynamic_interest_rate, # Now populated dynamically
            estimated_monthly_emi=emi,
            status=status,
            reason=reason
        ))

    # Sort by match score descending
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations
