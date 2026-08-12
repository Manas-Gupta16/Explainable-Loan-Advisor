import pytest
from fastapi.testclient import TestClient
from backend.main import app
from ml_engine.causal_recourse import StructuralCausalModel, CausalRecourseEngine
from backend.app.services.causal_service import causal_service

client = TestClient(app)

SAMPLE_APPLICANT_REJECTED = {
    "cibil_score": 610,
    "applicant_income": 48000.0,
    "coapplicant_income": 0.0,
    "loan_amount": 35000.0,
    "loan_tenure_months": 24,
    "existing_debts": 16000.0,
    "credit_card_utilization": 0.75,
    "delinquent_lines_2yrs": 0,
    "credit_history_years": 4.5,
    "employment_status": "Salaried",
    "education": "Graduate",
    "home_ownership": "RENT",
    "loan_purpose": "Personal"
}

class TestCausalDAGRecourse:

    def test_structural_causal_propagation(self):
        """Tests endogenous state propagation through the structural equations."""
        baseline = dict(SAMPLE_APPLICANT_REJECTED)
        
        # Test immediate propagation with debt reduction
        interventions = {"existing_debts": 6000.0}
        state_t0 = StructuralCausalModel.propagate_causal_state(baseline, interventions, elapsed_days=0)
        
        assert state_t0["existing_debts"] == 6000.0
        assert state_t0["credit_card_utilization"] < baseline["credit_card_utilization"]
        assert state_t0["dti_ratio"] < 0.5
        
        # Test lagged propagation at 60 days (CIBIL score should increase)
        state_t60 = StructuralCausalModel.propagate_causal_state(baseline, interventions, elapsed_days=60)
        assert state_t60["cibil_score"] > baseline["cibil_score"]
        assert state_t60["cibil_score"] >= state_t0["cibil_score"]

    def test_causal_sensitivity_ranking(self):
        """Tests that causal sensitivity levers are correctly computed and ranked by marginal probability gain."""
        sensitivities = causal_service.engine.compute_causal_sensitivity(SAMPLE_APPLICANT_REJECTED)
        assert isinstance(sensitivities, list)
        assert len(sensitivities) >= 3
        
        for lever in sensitivities:
            assert "lever_id" in lever
            assert "name" in lever
            assert "marginal_prob_gain" in lever
            assert "resulting_probability" in lever

        # Verify descending sort by marginal probability gain
        gains = [s["marginal_prob_gain"] for s in sensitivities]
        assert gains == sorted(gains, reverse=True)

    def test_3phase_causal_trajectory_generation(self):
        """Tests that 3-phase temporal trajectory solves to target probability threshold."""
        trajectory = causal_service.generate_causal_trajectory(
            input_dict=SAMPLE_APPLICANT_REJECTED,
            target_probability=0.70,
            max_horizon_days=90
        )
        
        assert trajectory["is_recourse_needed"] is True
        assert len(trajectory["phases"]) == 3
        assert trajectory["phases"][0]["phase_id"] == 1
        assert trajectory["phases"][1]["phase_id"] == 2
        assert trajectory["phases"][2]["phase_id"] == 3
        assert trajectory["final_projected_probability"] > trajectory["baseline_probability"]
        assert trajectory["projected_cibil_gain"] > 0
        assert "structural_causal_graph" in trajectory

    def test_customer_causal_recourse_endpoint(self):
        """Tests POST /api/v1/customer/causal-recourse API endpoint."""
        response = client.post("/api/v1/customer/causal-recourse", json={
            "loan_input": SAMPLE_APPLICANT_REJECTED,
            "target_probability": 0.75,
            "max_horizon_days": 90
        })
        assert response.status_code == 200
        data = response.json()
        assert "phases" in data
        assert len(data["phases"]) == 3
        assert "causal_levers_ranked" in data

    def test_customer_causal_graph_endpoint(self):
        """Tests GET /api/v1/customer/causal-graph API endpoint."""
        response = client.get("/api/v1/customer/causal-graph")
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) >= 7
        assert len(data["edges"]) >= 8

    def test_bank_causal_trajectory_endpoint(self):
        """Tests GET /api/v1/bank/applications/{id}/causal-trajectory API endpoint."""
        # 1. Create a loan application first
        apply_res = client.post("/api/v1/customer/apply", json=SAMPLE_APPLICANT_REJECTED)
        assert apply_res.status_code == 200
        app_id = apply_res.json()["application_id"]

        # 2. Query underwriter causal trajectory
        response = client.get(f"/api/v1/bank/applications/{app_id}/causal-trajectory?target_probability=0.75&max_horizon_days=90")
        assert response.status_code == 200
        data = response.json()
        assert data["application_id"] == app_id
        assert "trajectory" in data
        assert len(data["trajectory"]["phases"]) == 3
