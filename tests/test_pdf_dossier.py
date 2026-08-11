import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.pdf_dossier_service import pdf_dossier_service

client = TestClient(app)

SAMPLE_APP_PAYLOAD = {
    "cibil_score": 640,
    "applicant_income": 55000.0,
    "coapplicant_income": 0.0,
    "loan_amount": 40000.0,
    "loan_tenure_months": 36,
    "existing_debts": 18000.0,
    "credit_card_utilization": 0.72,
    "delinquent_lines_2yrs": 1,
    "credit_history_years": 4.0,
    "employment_status": "Salaried",
    "education": "Graduate",
    "home_ownership": "RENT",
    "loan_purpose": "Personal"
}

class TestPDFComplianceDossier:

    def test_direct_pdf_dossier_generation(self):
        """Tests that PDFComplianceDossierService produces a valid, well-formed binary PDF stream."""
        app_dict = {
            'id': 101,
            'user_id': 5,
            'cibil_score': 640,
            'applicant_income': 55000.0,
            'coapplicant_income': 0.0,
            'loan_amount': 40000.0,
            'loan_tenure_months': 36,
            'existing_debts': 18000.0,
            'credit_card_utilization': 0.72,
            'delinquent_lines_2yrs': 1,
            'credit_history_years': 4.0,
            'employment_status': 'Salaried',
            'education': 'Graduate',
            'home_ownership': 'RENT',
            'loan_purpose': 'Personal',
            'approval_probability': 0.38,
            'risk_tier': 'HIGH_RISK',
            'status': 'REJECTED',
            'recommended_bank': 'Apex National Bank',
            'officer_notes': 'Adverse action notice issued due to high DTI and elevated credit utilization.',
            'created_at': '2026-08-11 12:00:00 UTC'
        }

        shap_data = {
            "top_features": [
                {"feature": "dti_ratio", "shap_value": -0.65, "impact": "NEGATIVE"},
                {"feature": "credit_card_utilization", "shap_value": -0.42, "impact": "NEGATIVE"},
                {"feature": "cibil_score", "shap_value": -0.30, "impact": "NEGATIVE"},
                {"feature": "applicant_income", "shap_value": 0.15, "impact": "POSITIVE"}
            ]
        }

        dice_data = {
            "roadmap_steps": [
                {
                    "option_id": 1,
                    "changes": [
                        {"feature": "existing_debts", "original_value": 18000.0, "target_value": 9000.0},
                        {"feature": "credit_card_utilization", "original_value": 0.72, "target_value": 0.28}
                    ]
                }
            ]
        }

        conformal_data = {
            "calibrated_interval": {"lower_bound": 0.29, "upper_bound": 0.47},
            "metrics": {"epistemic_uncertainty_score": 0.08},
            "triage": {"category": "CONFIDENT_REJECTION"}
        }

        pdf_bytes = pdf_dossier_service.generate_dossier_pdf(
            application_data=app_dict,
            conformal_data=conformal_data,
            shap_data=shap_data,
            dice_data=dice_data
        )

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 2000
        assert pdf_bytes[:4] == b'%PDF'  # Standard PDF Magic Header

    def test_bank_compliance_dossier_download_endpoint(self):
        """Tests GET /api/v1/bank/applications/{id}/compliance-dossier."""
        # 1. Create a loan application first
        apply_res = client.post("/api/v1/customer/apply", json=SAMPLE_APP_PAYLOAD)
        assert apply_res.status_code == 200
        app_id = apply_res.json()["application_id"]

        # 2. Request Compliance Dossier PDF
        pdf_res = client.get(f"/api/v1/bank/applications/{app_id}/compliance-dossier")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert f"regulatory_compliance_dossier_{app_id}.pdf" in pdf_res.headers["content-disposition"]
        assert pdf_res.content[:4] == b'%PDF'
        assert len(pdf_res.content) > 3000

    def test_customer_dossier_download_endpoint(self):
        """Tests GET /api/v1/customer/applications/{id}/dossier-pdf."""
        apply_res = client.post("/api/v1/customer/apply", json=SAMPLE_APP_PAYLOAD)
        assert apply_res.status_code == 200
        app_id = apply_res.json()["application_id"]

        pdf_res = client.get(f"/api/v1/customer/applications/{app_id}/dossier-pdf")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content[:4] == b'%PDF'
