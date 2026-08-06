import os
import unittest
import pandas as pd
from ml_engine.data.generate_dataset import generate_loan_dataset
from ml_engine.preprocessing import LoanPreprocessor
from ml_engine.train import train_model
from ml_engine.explainers import XAIExplainerManager

class TestMLEngine(unittest.TestCase):
    def test_dataset_generation(self):
        df = generate_loan_dataset(num_samples=100)
        self.assertEqual(len(df), 100)
        self.assertIn('loan_status', df.columns)
        self.assertIn('cibil_score', df.columns)

    def test_preprocessing(self):
        df = generate_loan_dataset(num_samples=50)
        preprocessor = LoanPreprocessor()
        X_processed, y = preprocessor.fit_transform(df)
        self.assertEqual(len(X_processed), 50)
        self.assertEqual(len(y), 50)
        self.assertTrue(len(preprocessor.feature_names) > 0)

    def test_train_model(self):
        model, preprocessor, metrics = train_model()
        self.assertIsNotNone(model)
        self.assertIsNotNone(preprocessor)
        self.assertIn('accuracy', metrics)
        self.assertGreater(metrics['accuracy'], 0.60)

    def test_xai_explainers(self):
        base_dir = os.path.dirname(os.path.dirname(__file__))
        model_path = os.path.join(base_dir, 'ml_engine', 'artifacts', 'model.joblib')
        preprocessor_path = os.path.join(base_dir, 'ml_engine', 'artifacts', 'preprocessor.joblib')
        
        manager = XAIExplainerManager(model_path, preprocessor_path)
        sample_input = {
            'cibil_score': 750,
            'applicant_income': 85000,
            'coapplicant_income': 15000,
            'loan_amount': 250000,
            'loan_tenure_months': 36,
            'existing_debts': 12000,
            'credit_card_utilization': 0.25,
            'delinquent_lines_2yrs': 0,
            'credit_history_years': 8,
            'employment_status': 'SALARIED',
            'education': 'GRADUATE',
            'home_ownership': 'RENT',
            'loan_purpose': 'PERSONAL'
        }
        
        shap_res = manager.explain_shap(sample_input)
        self.assertIn('top_features', shap_res)
        self.assertGreater(len(shap_res['top_features']), 0)

        dice_res = manager.explain_dice_counterfactual(sample_input)
        self.assertIn('status', dice_res)

if __name__ == '__main__':
    unittest.main()
