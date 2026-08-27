import unittest
from fastapi.testclient import TestClient
from backend.main import app
from ml_engine.fairness import fairness_engine
from ml_engine.monitoring import model_drift_monitor
from backend.app.services.llm_coach_service import llm_coach_service
from backend.app.services.ocr_service import ocr_service
from backend.app.services.open_banking_service import open_banking_service
from backend.app.services.stress_test_service import stress_test_service

class TestAdvancedFeatures(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    # 1. Test LLM-Powered AI Financial Coach
    def test_llm_financial_coach_service(self):
        loan_input = {
            'cibil_score': 760,
            'applicant_income': 95000.0,
            'loan_amount': 250000.0,
            'existing_debts': 12000.0,
            'credit_card_utilization': 0.22
        }
        shap_data = {
            'top_features': [
                {'feature': 'cibil_score', 'impact': 'POSITIVE'},
                {'feature': 'dti_ratio', 'impact': 'POSITIVE'}
            ]
        }
        advice_en = llm_coach_service.generate_coach_advice(
            applicant_name="Sarah Connor",
            loan_input=loan_input,
            shap_data=shap_data,
            language="en"
        )
        self.assertEqual(advice_en['applicant_name'], "Sarah Connor")
        self.assertIn("ENCOURAGING", advice_en['verdict_tone'])
        self.assertEqual(len(advice_en['actionable_milestones']), 3)

        # Test Multi-Language Support (Spanish & Hindi)
        advice_es = llm_coach_service.generate_coach_advice(applicant_name="Carlos", loan_input=loan_input, language="es")
        self.assertIn("Hola", advice_es['executive_summary'])

        advice_hi = llm_coach_service.generate_coach_advice(applicant_name="Aarav", loan_input=loan_input, language="hi")
        self.assertIn("नमस्ते", advice_hi['executive_summary'])

    # 2. Test OCR Document Verification & Fraud Detection
    def test_ocr_document_extraction_and_fraud_detection(self):
        # Verified Case (accurate pay slip within 10%)
        res_verified = ocr_service.extract_and_verify(
            file_name="payslip_july_2026.pdf",
            document_type="PAY_SLIP",
            declared_monthly_income=7500.0
        )
        self.assertEqual(res_verified['verification_status'], "VERIFIED")
        self.assertLessEqual(res_verified['discrepancy_ratio'], 0.10)

        # Mismatch Case
        res_mismatch = ocr_service.extract_and_verify(
            file_name="salary_mismatch_slip.pdf",
            document_type="PAY_SLIP",
            declared_monthly_income=10000.0
        )
        self.assertIn(res_mismatch['verification_status'], ["SUSPECT_MISMATCH", "FRAUD_FLAGGED"])

    # 3. Test Open Banking & Cash Flow Analysis (DSCR)
    def test_open_banking_cashflow_and_dscr(self):
        res = open_banking_service.analyze_account_transactions(
            application_id=1,
            monthly_net_salary=8000.0,
            existing_monthly_emi=1000.0
        )
        self.assertGreater(res['monthly_free_cashflow'], 0)
        self.assertGreaterEqual(res['debt_service_coverage_ratio'], 1.0)
        self.assertIn(res['cashflow_quality_grade'], ["PRIME", "MODERATE"])

    # 4. Test Demographic Fairness & ECOA Compliance
    def test_fairness_audit_disparate_impact(self):
        fairness_res = fairness_engine.generate_institutional_audit()
        self.assertIn("disparate_impact_ratio", fairness_res)
        self.assertIn("four_fifths_rule_status", fairness_res)
        self.assertGreater(fairness_res['disparate_impact_ratio'], 0.50)
        self.assertEqual(len(fairness_res['group_metrics']), 2)

    # 5. Test Model Drift & Population Stability Index (PSI)
    def test_model_drift_and_psi(self):
        drift_res = model_drift_monitor.audit_production_drift()
        self.assertIn("overall_model_psi", drift_res)
        self.assertIn(drift_res['model_health_status'], ["HEALTHY", "MODERATE_DRIFT", "CRITICAL_RETRAIN_REQUIRED"])
        self.assertGreaterEqual(len(drift_res['feature_drift_breakdown']), 3)

    # 6. Test Macroeconomic Stress Testing
    def test_macroeconomic_stress_testing(self):
        stress_res = stress_test_service.run_stress_test(
            baseline_prob=0.88,
            cibil_score=780,
            applicant_income=100000.0,
            loan_amount=300000.0,
            existing_debts=15000.0,
            scenario="COMBINED_STAGFLATION",
            rate_hike_pct=2.5,
            inflation_pct=10.0,
            income_shock_pct=15.0
        )
        self.assertLessEqual(stress_res['stressed_approval_probability'], 0.88)
        self.assertGreater(stress_res['stressed_dti'], stress_res['baseline_dti'])
        self.assertIn(stress_res['resilience_grade'], ["HIGHLY_RESILIENT", "MODERATELY_VULNERABLE", "HIGH_DEFAULT_RISK"])

    # 7. Test All New FastAPI Endpoints
    def test_new_api_endpoints_integration(self):
        # 1. Customer Coach Advice endpoint
        coach_resp = self.client.post("/api/v1/customer/coach-advice", json={
            "applicant_name": "David Miller",
            "language": "en",
            "loan_input": {
                "cibil_score": 730,
                "applicant_income": 70000,
                "loan_amount": 200000,
                "loan_tenure_months": 36,
                "existing_debts": 10000,
                "credit_card_utilization": 0.28
            }
        })
        self.assertEqual(coach_resp.status_code, 200)
        coach_data = coach_resp.json()
        self.assertIn("David Miller", coach_data['applicant_name'])

        # 2. Document Upload & OCR endpoint
        doc_resp = self.client.post("/api/v1/customer/upload-documents/1", json={
            "application_id": 1,
            "document_type": "PAY_SLIP",
            "declared_monthly_income": 6500.0,
            "file_name": "pay_stub_official.pdf"
        })
        self.assertEqual(doc_resp.status_code, 200)
        doc_data = doc_resp.json()
        self.assertEqual(doc_data['verification_status'], "VERIFIED")

        # 3. Open Banking Connect endpoint
        ob_resp = self.client.post("/api/v1/customer/open-banking/connect", json={
            "application_id": 1,
            "institution_id": "ins_chase_mock",
            "monthly_net_salary": 6500.0,
            "existing_monthly_emi": 900.0
        })
        self.assertEqual(ob_resp.status_code, 200)

        # 4. Stress Test endpoint
        stress_resp = self.client.post("/api/v1/customer/stress-test", json={
            "scenario": "RATE_HIKE",
            "interest_rate_delta_pct": 2.0,
            "loan_input": {
                "cibil_score": 750,
                "applicant_income": 80000,
                "loan_amount": 200000,
                "loan_tenure_months": 36,
                "existing_debts": 12000
            }
        })
        self.assertEqual(stress_resp.status_code, 200)

        # 5. Bank Fairness Audit endpoint
        fair_resp = self.client.get("/api/v1/bank/fairness-audit")
        self.assertEqual(fair_resp.status_code, 200)

        # 6. Bank Model Monitoring endpoint
        mon_resp = self.client.get("/api/v1/bank/model-monitoring")
        self.assertEqual(mon_resp.status_code, 200)

        # 7. Bank Retrain Trigger endpoint
        retrain_resp = self.client.post("/api/v1/bank/trigger-retrain")
        self.assertEqual(retrain_resp.status_code, 200)

        # 8. Bank Batch Stress Test endpoint
        batch_stress_resp = self.client.post("/api/v1/bank/stress-test-batch?rate_hike_pct=2.0")
        self.assertEqual(batch_stress_resp.status_code, 200)

        # 9. Dynamic Voice Guide Script endpoint (100% Data-Driven)
        vg_resp = self.client.post("/api/v1/customer/voice-guide-script", json={
            "applicant_name": "Sunita Devi",
            "language": "en",
            "loan_input": {
                "cibil_score": 740,
                "applicant_income": 480000,
                "loan_amount": 180000,
                "loan_tenure_months": 24,
                "existing_debts": 36000,
                "loan_purpose": "Village Kirana / Rural MSME"
            }
        })
        self.assertEqual(vg_resp.status_code, 200)
        vg_data = vg_resp.json()
        self.assertIn("Sunita Devi", vg_data["script"])
        self.assertIn("Village Kirana", vg_data["script"])
        self.assertGreaterEqual(vg_data["approval_percentage"], 70)
        self.assertIsNotNone(vg_data["matched_bank"])


if __name__ == '__main__':
    unittest.main()
