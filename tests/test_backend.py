import unittest
import uuid
from fastapi.testclient import TestClient
from backend.main import app

class TestBackendAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("Explainable AI", data["message"])

    def test_auth_register_and_login(self):
        random_email = f"user_{uuid.uuid4().hex[:6]}@example.com"
        
        # Register
        reg_resp = self.client.post("/api/v1/auth/register", json={
            "email": random_email,
            "password": "TestPassword123",
            "full_name": "Test User",
            "role": "CUSTOMER"
        })
        self.assertEqual(reg_resp.status_code, 200)
        token_data = reg_resp.json()
        self.assertIn("access_token", token_data)

        # Login
        login_resp = self.client.post("/api/v1/auth/login", json={
            "email": random_email,
            "password": "TestPassword123"
        })
        self.assertEqual(login_resp.status_code, 200)
        self.assertIn("access_token", login_resp.json())

    def test_customer_apply_and_sandbox(self):
        payload = {
            "cibil_score": 720,
            "applicant_income": 75000,
            "coapplicant_income": 0,
            "loan_amount": 200000,
            "loan_tenure_months": 36,
            "existing_debts": 10000,
            "credit_card_utilization": 0.30,
            "delinquent_lines_2yrs": 0,
            "credit_history_years": 5,
            "employment_status": "SALARIED",
            "education": "GRADUATE",
            "home_ownership": "OWNED",
            "loan_purpose": "PERSONAL"
        }

        # Apply
        apply_resp = self.client.post("/api/v1/customer/apply", json=payload)
        self.assertEqual(apply_resp.status_code, 200)
        apply_data = apply_resp.json()
        self.assertIn("application_id", apply_data)
        self.assertIn("approval_probability", apply_data)
        self.assertIn("shap_explanation", apply_data)

        # Sandbox
        sb_resp = self.client.post("/api/v1/customer/sandbox", json=payload)
        self.assertEqual(sb_resp.status_code, 200)
        self.assertIn("approval_probability", sb_resp.json())

    def test_bank_queue_and_decision(self):
        # Queue
        queue_resp = self.client.get("/api/v1/bank/queue")
        self.assertEqual(queue_resp.status_code, 200)
        queue_data = queue_resp.json()
        self.assertIsInstance(queue_data, list)
        
        if len(queue_data) > 0:
            app_id = queue_data[0]["id"]
            dec_resp = self.client.post(f"/api/v1/bank/decision/{app_id}", json={
                "status": "APPROVED",
                "officer_notes": "Passed manual credit risk underwriting inspection."
            })
            self.assertEqual(dec_resp.status_code, 200)
            self.assertEqual(dec_resp.json()["application"]["status"], "APPROVED")

    def test_xai_endpoints(self):
        payload = {
            "cibil_score": 580,
            "applicant_income": 35000,
            "coapplicant_income": 0,
            "loan_amount": 300000,
            "loan_tenure_months": 48,
            "existing_debts": 25000,
            "credit_card_utilization": 0.85,
            "delinquent_lines_2yrs": 2,
            "credit_history_years": 2,
            "employment_status": "SELF_EMPLOYED",
            "education": "NOT_GRADUATE",
            "home_ownership": "RENT",
            "loan_purpose": "BUSINESS"
        }
        apply_resp = self.client.post("/api/v1/customer/apply", json=payload)
        self.assertEqual(apply_resp.status_code, 200)
        app_id = apply_resp.json()["application_id"]

        # Test SHAP endpoint
        shap_resp = self.client.get(f"/api/v1/xai/shap/{app_id}")
        self.assertEqual(shap_resp.status_code, 200)
        self.assertIn("top_features", shap_resp.json())

        # Test DiCE endpoint
        dice_resp = self.client.get(f"/api/v1/xai/dice/{app_id}")
        self.assertEqual(dice_resp.status_code, 200)
        self.assertIn("status", dice_resp.json())

if __name__ == '__main__':
    unittest.main()
