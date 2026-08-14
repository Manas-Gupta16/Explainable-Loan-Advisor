import pytest
from fastapi.testclient import TestClient
from backend.main import app
from ml_engine.account_aggregator import AccountAggregatorEngine
from backend.app.services.open_banking_service import open_banking_service

client = TestClient(app)

SAMPLE_TRANSACTIONS = [
    {"date": "2026-01-01", "description": "TECH CORP AUTOMATED PAYROLL SALARY", "amount": 6000.0, "type": "CREDIT", "category": "SALARY_CREDIT", "running_balance": 9000.0},
    {"date": "2026-01-05", "description": "ACH APARTMENT LEASING RENT PAYMENT", "amount": 1500.0, "type": "DEBIT", "category": "RENT_UTILITY", "running_balance": 7500.0},
    {"date": "2026-01-10", "description": "NACH HDFC AUTO LOAN MANDATE EMI", "amount": 600.0, "type": "DEBIT", "category": "NACH_EMI_DEBIT", "running_balance": 6900.0},
    {"date": "2026-01-15", "description": "AMAZON RETAIL", "amount": 120.0, "type": "DEBIT", "category": "DISCRETIONARY_EXPENSE", "running_balance": 6780.0},
    {"date": "2026-02-01", "description": "TECH CORP AUTOMATED PAYROLL SALARY", "amount": 6000.0, "type": "CREDIT", "category": "SALARY_CREDIT", "running_balance": 12780.0},
    {"date": "2026-02-05", "description": "ACH APARTMENT LEASING RENT PAYMENT", "amount": 1500.0, "type": "DEBIT", "category": "RENT_UTILITY", "running_balance": 11280.0},
    {"date": "2026-02-10", "description": "NACH HDFC AUTO LOAN MANDATE EMI", "amount": 600.0, "type": "DEBIT", "category": "NACH_EMI_DEBIT", "running_balance": 10680.0},
]

class TestAccountAggregatorEngine:

    def test_transaction_categorization(self):
        """Tests that text narrations are correctly mapped to financial transaction categories."""
        assert AccountAggregatorEngine.categorize_transaction("EMPLOYER DIRECT DEP SALARY", 5000, "CREDIT") == "SALARY_CREDIT"
        assert AccountAggregatorEngine.categorize_transaction("NACH MANDATE BOUNCE CHARGE INSUFFICIENT FUNDS", 50, "DEBIT") == "BOUNCE_PENALTY"
        assert AccountAggregatorEngine.categorize_transaction("ELECTRICITY BOARD UTILITY", 120, "DEBIT") == "RENT_UTILITY"
        assert AccountAggregatorEngine.categorize_transaction("STARBUCKS COFFEE ONLINE", 15, "DEBIT") == "DISCRETIONARY_EXPENSE"
        assert AccountAggregatorEngine.categorize_transaction("RAZORPAY CLIENT INVOICE", 1200, "CREDIT") == "BUSINESS_INFLOW"

    def test_synthetic_stream_generation(self):
        """Tests 6-month synthetic banking stream generator across risk profiles."""
        prime_stream = AccountAggregatorEngine.generate_synthetic_bank_stream("SALARIED_PRIME", monthly_salary=7000.0, months=6)
        assert len(prime_stream) >= 20
        assert any(t["category"] == "SALARY_CREDIT" for t in prime_stream)

        stressed_stream = AccountAggregatorEngine.generate_synthetic_bank_stream("BOUNCE_STRESSED", monthly_salary=4000.0, months=6)
        assert any(t["category"] == "BOUNCE_PENALTY" for t in stressed_stream)

    def test_cashflow_volatility_analysis(self):
        """Tests liquidity metrics, NACH bounce ratios, and alternative credit score calculations."""
        analysis = AccountAggregatorEngine.analyze_transaction_stream(SAMPLE_TRANSACTIONS, requested_loan_emi=500.0)
        assert analysis["account_aggregator_score"] >= 300
        assert analysis["account_aggregator_score"] <= 900
        assert "liquidity_metrics" in analysis
        assert "volatility_indices" in analysis
        assert analysis["volatility_indices"]["nach_mandate_bounce_count"] == 0
        assert analysis["volatility_indices"]["cashflow_dscr"] > 1.0
        assert analysis["cashflow_quality_tier"] in ["PRIME_CASHFLOW", "STABLE_CASHFLOW", "STRESSED_CASHFLOW"]

    def test_customer_account_aggregator_analyze_endpoint(self):
        """Tests POST /api/v1/customer/account-aggregator/analyze API endpoint."""
        response = client.post("/api/v1/customer/account-aggregator/analyze", json={
            "account_type": "SALARIED_PRIME",
            "monthly_salary": 6500.0,
            "requested_loan_emi": 650.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "account_aggregator_score" in data
        assert "liquidity_metrics" in data
        assert "volatility_indices" in data
        assert data["liquidity_metrics"]["avg_monthly_inflow"] > 0

    def test_customer_sample_stream_endpoint(self):
        """Tests GET /api/v1/customer/account-aggregator/sample-stream API endpoint."""
        response = client.get("/api/v1/customer/account-aggregator/sample-stream?account_type=SALARIED_PRIME&monthly_salary=6000")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 15

    def test_bank_cashflow_telemetry_endpoint(self):
        """Tests GET /api/v1/bank/applications/{id}/cashflow-telemetry API endpoint."""
        # 1. Create a loan application first
        sample_app = {
            "cibil_score": 680,
            "applicant_income": 72000.0,
            "coapplicant_income": 0.0,
            "loan_amount": 25000.0,
            "loan_tenure_months": 36,
            "existing_debts": 8000.0,
            "credit_card_utilization": 0.40,
            "delinquent_lines_2yrs": 0,
            "credit_history_years": 5.0,
            "employment_status": "Salaried",
            "education": "Graduate",
            "home_ownership": "OWN",
            "loan_purpose": "Home"
        }
        apply_res = client.post("/api/v1/customer/apply", json=sample_app)
        assert apply_res.status_code == 200
        app_id = apply_res.json()["application_id"]

        # 2. Query underwriter cashflow telemetry
        response = client.get(f"/api/v1/bank/applications/{app_id}/cashflow-telemetry")
        assert response.status_code == 200
        data = response.json()
        assert data["application_id"] == app_id
        assert "cashflow_telemetry" in data
        assert "account_aggregator_score" in data["cashflow_telemetry"]
