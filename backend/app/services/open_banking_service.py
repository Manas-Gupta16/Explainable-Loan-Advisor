import numpy as np
from typing import Dict, Any, List, Optional
from ml_engine.account_aggregator import AccountAggregatorEngine

class OpenBankingCashFlowService:
    """
    Open Banking / Account Aggregator (AA) Real-Time Financial Telemetry Service.
    Calculates live Cash Flow Dynamics, NACH E-Mandate Bounce Ratios, Income Volatility,
    and Alternative Credit Scores for prime and thin-file borrowers.
    """
    def __init__(self):
        self.engine = AccountAggregatorEngine

    def analyze_account_transactions(
        self,
        application_id: int,
        monthly_net_salary: Optional[float] = None,
        existing_monthly_emi: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Processes simulated banking activity for an existing loan application.
        Provides both new rich AA metrics and backwards-compatible flattened attributes.
        """
        salary = monthly_net_salary if monthly_net_salary and monthly_net_salary > 0 else 6500.0
        emi = existing_monthly_emi if existing_monthly_emi is not None and existing_monthly_emi >= 0 else 650.0

        # Generate realistic 6-month transaction stream
        account_type = "SALARIED_PRIME" if salary >= 5000.0 else "GIG_VOLATILE"
        txns = self.engine.generate_synthetic_bank_stream(account_type=account_type, monthly_salary=salary, months=6)
        
        analysis = self.engine.analyze_transaction_stream(txns, requested_loan_emi=emi)
        
        # Core metadata
        analysis["application_id"] = application_id
        analysis["account_number_mask"] = "XXXX-XXXX-8921"
        analysis["account_institution"] = "HDFC National Banking Corp"
        analysis["account_type"] = account_type

        # Backwards-compatible flattened fields for legacy endpoints and database ORM
        liq = analysis["liquidity_metrics"]
        vol = analysis["volatility_indices"]
        analysis["avg_monthly_inflow"] = liq["avg_monthly_inflow"]
        analysis["avg_monthly_outflow"] = liq["avg_monthly_outflow"]
        analysis["monthly_free_cashflow"] = liq["net_monthly_cashflow"]
        analysis["debt_service_coverage_ratio"] = vol["cashflow_dscr"]
        analysis["salary_credit_stability_index"] = round(float(np.clip(1.0 - vol["income_volatility_index"], 0.50, 0.99)), 3)
        analysis["cashflow_quality_grade"] = "PRIME" if analysis["cashflow_quality_tier"] == "PRIME_CASHFLOW" else ("MODERATE" if analysis["cashflow_quality_tier"] == "STABLE_CASHFLOW" else "STRESSED")
        analysis["cashflow_risk_adjustment"] = analysis["cashflow_probability_uplift"]
        analysis["summary_insight"] = f"Account Aggregator Score: {analysis['account_aggregator_score']} ({analysis['cashflow_quality_tier']}). Monthly cashflow yields a robust DSCR of {vol['cashflow_dscr']}x with {vol['nach_mandate_bounce_count']} NACH bounces."

        return analysis

    def analyze_raw_transactions(
        self,
        transactions: List[Dict[str, Any]],
        requested_loan_emi: float = 650.0
    ) -> Dict[str, Any]:
        """Processes user-uploaded or aggregator-streamed raw transaction list."""
        analysis = self.engine.analyze_transaction_stream(transactions, requested_loan_emi=requested_loan_emi)
        liq = analysis.get("liquidity_metrics", {})
        vol = analysis.get("volatility_indices", {})
        if liq and vol:
            analysis["avg_monthly_inflow"] = liq["avg_monthly_inflow"]
            analysis["avg_monthly_outflow"] = liq["avg_monthly_outflow"]
            analysis["monthly_free_cashflow"] = liq["net_monthly_cashflow"]
            analysis["debt_service_coverage_ratio"] = vol["cashflow_dscr"]
            analysis["salary_credit_stability_index"] = round(float(np.clip(1.0 - vol["income_volatility_index"], 0.50, 0.99)), 3)
            analysis["cashflow_quality_grade"] = "PRIME" if analysis["cashflow_quality_tier"] == "PRIME_CASHFLOW" else ("MODERATE" if analysis["cashflow_quality_tier"] == "STABLE_CASHFLOW" else "STRESSED")
            analysis["cashflow_risk_adjustment"] = analysis["cashflow_probability_uplift"]
            analysis["summary_insight"] = f"Account Aggregator Score: {analysis['account_aggregator_score']} ({analysis['cashflow_quality_tier']})."
        return analysis

    def get_sample_stream(
        self,
        account_type: str = "SALARIED_PRIME",
        monthly_salary: float = 6500.0
    ) -> List[Dict[str, Any]]:
        """Provides sample transaction stream for interactive testing."""
        return self.engine.generate_synthetic_bank_stream(
            account_type=account_type,
            monthly_salary=monthly_salary,
            months=6
        )

open_banking_service = OpenBankingCashFlowService()
