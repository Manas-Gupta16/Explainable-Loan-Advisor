import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.budget_recourse_service import budget_recourse_service

client = TestClient(app)

SAMPLE_APPLICANT_CANDIDATE = {
    "cibil_score": 620,
    "applicant_income": 52000.0,
    "coapplicant_income": 0.0,
    "loan_amount": 30000.0,
    "loan_tenure_months": 24,
    "existing_debts": 14000.0,
    "credit_card_utilization": 0.70,
    "delinquent_lines_2yrs": 0,
    "credit_history_years": 4.0,
    "employment_status": "Salaried",
    "education": "Graduate",
    "home_ownership": "RENT",
    "loan_purpose": "Personal"
}

class TestBudgetConstrainedRecourse:

    def test_cashflow_profile_calculation(self):
        """Tests that cashflow calculations produce realistic net surplus and safe caps."""
        profile = budget_recourse_service.optimizer.calculate_cashflow_profile(
            applicant_income=60000.0,
            coapplicant_income=0.0,
            existing_debts=12000.0
        )
        assert profile["gross_monthly_income"] == 5000.0
        assert profile["net_monthly_income"] == 4000.0
        assert profile["monthly_debt_service"] > 0
        assert profile["monthly_living_expenses"] > 0
        assert profile["monthly_disposable_surplus"] > 0
        assert profile["safe_monthly_allocation_cap"] <= profile["monthly_disposable_surplus"]

    def test_slsqp_recourse_optimization(self):
        """Tests that SLSQP optimizer satisfies budget constraints while maximizing approval odds."""
        res = budget_recourse_service.optimize_recourse(
            input_dict=SAMPLE_APPLICANT_CANDIDATE,
            target_probability=0.75,
            horizon_months=6,
            max_surplus_allocation_pct=0.60
        )
        assert res["status"] in ["OPTIMAL_RECOURSE_FOUND", "SUB_OPTIMAL_BUDGET_CONSTRAINED"]
        assert res["optimized_probability"] > res["baseline_probability"]
        assert res["feasibility_index"] >= 10.0
        
        # Verify budget adherence: required debt payment must not exceed budget cap
        budget = res["budget_constraints"]
        actions = res["optimized_actions"]
        assert actions["debt_payoff_total"] <= budget["cumulative_budget_cap"] + 1.0  # with tolerance

    def test_pareto_budget_frontier(self):
        """Tests that Pareto budget frontier returns monotonic trade-offs across commitment tiers."""
        frontier = budget_recourse_service.get_budget_frontier(
            input_dict=SAMPLE_APPLICANT_CANDIDATE,
            horizon_months=6
        )
        assert isinstance(frontier, list)
        assert len(frontier) == 4
        
        # Verify commitment increases monotonically
        commitments = [p["monthly_commitment"] for p in frontier]
        assert commitments == sorted(commitments)

    def test_customer_budget_recourse_endpoint(self):
        """Tests POST /api/v1/customer/budget-recourse API endpoint."""
        response = client.post("/api/v1/customer/budget-recourse", json={
            "loan_input": SAMPLE_APPLICANT_CANDIDATE,
            "target_probability": 0.75,
            "horizon_months": 6,
            "max_surplus_allocation_pct": 0.60
        })
        assert response.status_code == 200
        data = response.json()
        assert "optimized_probability" in data
        assert "budget_constraints" in data
        assert "optimized_actions" in data
        assert data["optimized_probability"] > data["baseline_probability"]

    def test_customer_budget_frontier_endpoint(self):
        """Tests POST /api/v1/customer/budget-frontier API endpoint."""
        response = client.post("/api/v1/customer/budget-frontier", json={
            "loan_input": SAMPLE_APPLICANT_CANDIDATE,
            "horizon_months": 6
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4
        assert "achievable_probability" in data[0]

    def test_bank_budget_recourse_endpoint(self):
        """Tests GET /api/v1/bank/applications/{id}/budget-recourse API endpoint."""
        # 1. Create a loan application first
        apply_res = client.post("/api/v1/customer/apply", json=SAMPLE_APPLICANT_CANDIDATE)
        assert apply_res.status_code == 200
        app_id = apply_res.json()["application_id"]

        # 2. Query underwriter budget recourse inspection
        response = client.get(f"/api/v1/bank/applications/{app_id}/budget-recourse?target_probability=0.75&horizon_months=6")
        assert response.status_code == 200
        data = response.json()
        assert data["application_id"] == app_id
        assert "budget_recourse" in data
        assert "pareto_budget_frontier" in data
