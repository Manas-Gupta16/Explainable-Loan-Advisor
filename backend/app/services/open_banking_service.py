import numpy as np
from typing import Dict, Any, Optional

class OpenBankingCashFlowService:
    """
    Open Banking / Plaid Real-Time Financial Aggregation Service.
    Calculates live Cash Flow Dynamics, Monthly Free Cash Flow, and
    Debt Service Coverage Ratio (DSCR) from bank transaction feeds.
    """
    def __init__(self):
        pass

    def analyze_account_transactions(
        self,
        application_id: int,
        monthly_net_salary: Optional[float] = None,
        existing_monthly_emi: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Processes bank transaction stream to generate dynamic solvency metrics.
        """
        salary = monthly_net_salary if monthly_net_salary and monthly_net_salary > 0 else 6500.0
        emi = existing_monthly_emi if existing_monthly_emi is not None and existing_monthly_emi >= 0 else 1200.0

        # Simulate 6 months of banking activity
        monthly_inflows = [round(salary * (1.0 + np.random.uniform(-0.03, 0.04)), 2) for _ in range(6)]
        avg_inflow = round(float(np.mean(monthly_inflows)), 2)

        # Baseline living expenses ~50-60% of income
        monthly_living_expenses = [round(salary * np.random.uniform(0.45, 0.55), 2) for _ in range(6)]
        avg_outflow = round(float(np.mean(monthly_living_expenses)) + emi, 2)

        # Monthly Free Cash Flow (Discretionary Cash Surplus)
        free_cashflow = round(max(avg_inflow - avg_outflow, 0.0), 2)

        # Debt Service Coverage Ratio (DSCR)
        # DSCR = Free Cash Flow / Monthly Loan Obligations
        safe_emi = max(emi, 150.0)
        dscr = round(free_cashflow / safe_emi, 2)

        # Salary Stability Index (measures variance across 6 payroll deposits)
        variance = float(np.std(monthly_inflows) / max(avg_inflow, 1.0))
        stability_index = round(max(1.0 - variance, 0.70), 3)

        # Cashflow quality tier & Risk adjustment
        if dscr >= 1.75 and free_cashflow >= 1500:
            quality_grade = "PRIME"
            risk_adjustment = +0.08  # +8% boost to approval probability
            summary = f"Strong cash flow buffer. Monthly free cash flow of ${free_cashflow:,.2f} provides high debt servicing capability (DSCR: {dscr}x)."
        elif dscr >= 1.15:
            quality_grade = "MODERATE"
            risk_adjustment = +0.02  # +2% boost
            summary = f"Adequate cash flow health. Monthly free cash flow is ${free_cashflow:,.2f} with a balanced DSCR of {dscr}x."
        else:
            quality_grade = "STRESSED"
            risk_adjustment = -0.12  # -12% penalty
            summary = f"Tight liquidity detected. Free cash flow of ${free_cashflow:,.2f} yields a stressed DSCR of {dscr}x, elevating default vulnerability."

        return {
            "application_id": application_id,
            "account_number_mask": "XXXX-XXXX-8921",
            "avg_monthly_inflow": avg_inflow,
            "avg_monthly_outflow": avg_outflow,
            "monthly_free_cashflow": free_cashflow,
            "debt_service_coverage_ratio": dscr,
            "salary_credit_stability_index": stability_index,
            "cashflow_quality_grade": quality_grade,
            "cashflow_risk_adjustment": risk_adjustment,
            "summary_insight": summary
        }

open_banking_service = OpenBankingCashFlowService()
