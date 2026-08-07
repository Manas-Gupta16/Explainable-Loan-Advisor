from typing import Dict, Any, Optional

class MacroeconomicStressTestingService:
    """
    Macroeconomic Shock & Stress Testing Engine.
    Simulates portfolio resilience against interest rate hikes, inflation surges, and income shocks.
    """
    def __init__(self):
        pass

    def run_stress_test(
        self,
        baseline_prob: float = 0.82,
        cibil_score: int = 740,
        applicant_income: float = 85000.0,
        loan_amount: float = 250000.0,
        loan_tenure_months: int = 36,
        existing_debts: float = 12000.0,
        scenario: str = "COMBINED_STAGFLATION",
        rate_hike_pct: float = 2.0,
        inflation_pct: float = 8.0,
        income_shock_pct: float = 15.0
    ) -> Dict[str, Any]:
        """
        Calculates stressed repayment capacity and revised approval odds under macro shocks.
        """
        monthly_income = max(applicant_income / 12.0, 1.0)
        base_dti = round((existing_debts / 12.0) / monthly_income, 4)

        # Baseline EMI estimate
        base_annual_rate = 0.085
        stressed_rate = base_annual_rate + (rate_hike_pct / 100.0)

        # 1. Shock adjustments
        debt_increase = 0.0
        income_reduction = 0.0

        if scenario in ["RATE_HIKE", "COMBINED_STAGFLATION"]:
            # Higher interest rate bumps monthly loan payments
            debt_increase += (loan_amount * (rate_hike_pct / 100.0)) / 12.0

        if scenario in ["INFLATION_SURGE", "COMBINED_STAGFLATION"]:
            # Inflation escalates living cost burdens
            living_cost_bump = (monthly_income * 0.40) * (inflation_pct / 100.0)
            debt_increase += living_cost_bump

        if scenario in ["INCOME_SHOCK", "COMBINED_STAGFLATION"]:
            income_reduction = monthly_income * (income_shock_pct / 100.0)

        stressed_monthly_income = max(monthly_income - income_reduction, 1.0)
        stressed_monthly_debt = (existing_debts / 12.0) + debt_increase
        stressed_dti = round(stressed_monthly_debt / stressed_monthly_income, 4)

        # 2. Compute stressed probability
        dti_impact = max((stressed_dti - base_dti) * 0.75, 0.0)
        stressed_prob = round(max(baseline_prob - dti_impact, 0.10), 4)
        prob_drop = round(max(baseline_prob - stressed_prob, 0.0) * 100, 1)

        # 3. Classify resilience
        if stressed_prob >= 0.70 and stressed_dti <= 0.40:
            grade = "HIGHLY_RESILIENT"
            notes = f"Profile exhibits outstanding macroeconomic shock absorption. Survives {scenario} with healthy {round(stressed_dti*100, 1)}% stressed DTI."
        elif stressed_prob >= 0.50:
            grade = "MODERATELY_VULNERABLE"
            notes = f"Profile displays moderate sensitivity to rate hikes and inflation. Stressed approval odds drop by {prob_drop}%."
        else:
            grade = "HIGH_DEFAULT_RISK"
            notes = f"Critical vulnerability to stagflation shocks. Debt servicing capacity severely compressed under simulated stress."

        return {
            "scenario_name": scenario,
            "baseline_approval_probability": round(baseline_prob, 4),
            "stressed_approval_probability": stressed_prob,
            "probability_drop_pct": prob_drop,
            "baseline_dti": base_dti,
            "stressed_dti": stressed_dti,
            "monthly_debt_burden_increase": round(debt_increase, 2),
            "resilience_grade": grade,
            "stress_verdict_notes": notes
        }

stress_test_service = MacroeconomicStressTestingService()
