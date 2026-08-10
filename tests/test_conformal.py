import pytest
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app
from ml_engine.conformal import ConformalPredictor
from backend.app.services.ml_service import ml_service
from backend.app.services.conformal_service import conformal_service

client = TestClient(app)

SAMPLE_APPLICANT = {
    "cibil_score": 730,
    "applicant_income": 80000.0,
    "coapplicant_income": 20000.0,
    "loan_amount": 35000.0,
    "loan_tenure_months": 36,
    "existing_debts": 7000.0,
    "credit_card_utilization": 0.18,
    "delinquent_lines_2yrs": 0,
    "credit_history_years": 8.0,
    "employment_status": "Salaried",
    "education": "Graduate",
    "home_ownership": "OWN",
    "loan_purpose": "Personal"
}

ANOMALOUS_APPLICANT = {
    "cibil_score": 310,
    "applicant_income": 5000000.0,  # Extreme outlier income
    "coapplicant_income": 0.0,
    "loan_amount": 950000.0,
    "loan_tenure_months": 12,
    "existing_debts": 400000.0,
    "credit_card_utilization": 0.99,
    "delinquent_lines_2yrs": 10,
    "credit_history_years": 0.2,
    "employment_status": "Unemployed",
    "education": "Not Graduate",
    "home_ownership": "RENT",
    "loan_purpose": "Business"
}

class TestConformalPrediction:

    def test_conformal_calibration_and_metrics(self):
        """Tests that conformal calibration produces valid non-conformity scores and bounded metrics."""
        assert conformal_service.predictor.is_calibrated is True
        assert len(conformal_service.predictor.all_cal_scores) > 0

        res = conformal_service.evaluate_uncertainty(SAMPLE_APPLICANT, confidence_level=0.95)
        
        assert "point_probability" in res
        assert 0.0 <= res["point_probability"] <= 1.0
        
        # Check calibrated interval
        interval = res["calibrated_interval"]
        assert 0.0 <= interval["lower_bound"] <= interval["upper_bound"] <= 1.0
        assert interval["interval_width"] == pytest.approx(interval["upper_bound"] - interval["lower_bound"], 0.001)

        # Check conformal prediction set
        assert isinstance(res["conformal_prediction_set"], list)
        assert len(res["conformal_prediction_set"]) in [1, 2]

        # Check metrics & p-values
        metrics = res["metrics"]
        assert 0.0 <= metrics["p_value_rejected"] <= 1.0
        assert 0.0 <= metrics["p_value_approved"] <= 1.0
        assert 0.0 <= metrics["confidence"] <= 1.0
        assert 0.0 <= metrics["credibility"] <= 1.0
        assert 0.0 <= metrics["epistemic_uncertainty_score"] <= 1.0

        # Check triage
        assert res["triage"]["category"] in ["CONFIDENT_APPROVAL", "CONFIDENT_REJECTION", "BORDERLINE_UNCERTAIN", "OUT_OF_DISTRIBUTION"]

    def test_anomalous_out_of_distribution_detection(self):
        """Tests that anomalous applicant triggers higher uncertainty and OOD flag."""
        res = conformal_service.evaluate_uncertainty(ANOMALOUS_APPLICANT, confidence_level=0.95)
        assert res["metrics"]["ood_z_score_max"] > 2.5
        assert res["triage"]["requires_human_override"] is True

    def test_customer_conformal_endpoint(self):
        """Tests the POST /api/v1/customer/conformal-predict API endpoint."""
        response = client.post("/api/v1/customer/conformal-predict", json={
            "loan_input": SAMPLE_APPLICANT,
            "confidence_level": 0.95
        })
        assert response.status_code == 200
        data = response.json()
        assert "calibrated_interval" in data
        assert "conformal_prediction_set" in data
        assert "triage" in data
        assert data["confidence_level"] == 0.95

    def test_bank_conformal_analysis_endpoint(self):
        """Tests the underwriter GET /api/v1/bank/applications/{id}/conformal-analysis API endpoint."""
        # Create an application first
        app_res = client.post("/api/v1/customer/apply", json=SAMPLE_APPLICANT)
        assert app_res.status_code == 200
        app_id = app_res.json()["application_id"]

        response = client.get(f"/api/v1/bank/applications/{app_id}/conformal-analysis?confidence_level=0.90")
        assert response.status_code == 200
        data = response.json()
        assert data["application_id"] == app_id
        assert "conformal_analysis" in data
        assert data["conformal_analysis"]["confidence_level"] == 0.90
