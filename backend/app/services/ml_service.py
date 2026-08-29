import os
import json
import joblib
from typing import Dict, Any, Tuple
from backend.app.core.config import settings
from ml_engine.preprocessing import LoanPreprocessor
from ml_engine.explainers import XAIExplainerManager

class MLInferenceService:
    """
    Singleton service wrapper managing model inference, risk scoring,
    and XAI explanation generations.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLInferenceService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print("Initializing MLInferenceService...")
        self.model_path = settings.MODEL_PATH
        self.preprocessor_path = settings.PREPROCESSOR_PATH
        self.fraud_model_path = os.path.join(settings.BASE_DIR, "ml_engine", "artifacts", "fraud_iso_forest.joblib")

        if not os.path.exists(self.model_path) or not os.path.exists(self.preprocessor_path):
            print("Model artifacts not found. Training model first...")
            from ml_engine.train import train_model
            train_model()

        if not os.path.exists(self.fraud_model_path):
            print("Fraud model not found. Training fraud model...")
            from ml_engine.fraud_detection import train_fraud_model
            train_fraud_model()

        self.model = joblib.load(self.model_path)
        self.preprocessor = LoanPreprocessor.load(self.preprocessor_path)
        self.fraud_model = joblib.load(self.fraud_model_path)
        self.xai_manager = XAIExplainerManager(self.model_path, self.preprocessor_path)

    def reload(self):
        """Reloads serialized model artifacts into memory."""
        self.model = joblib.load(self.model_path)
        self.preprocessor = LoanPreprocessor.load(self.preprocessor_path)
        self.fraud_model = joblib.load(self.fraud_model_path)
        self.xai_manager = XAIExplainerManager(self.model_path, self.preprocessor_path)

    def predict_fraud(self, input_dict: Dict[str, Any]) -> bool:
        """
        Returns True if the application is flagged as highly anomalous (fraudulent).
        """
        X_df = self.preprocessor.transform_single(input_dict)
        # IsolationForest returns -1 for anomalies (outliers) and 1 for inliers
        prediction = self.fraud_model.predict(X_df)[0]
        return prediction == -1

    def predict_risk(self, input_dict: Dict[str, Any]) -> Tuple[float, str, str]:
        """
        Returns (approval_probability, risk_tier, decision_status)
        """
        X_df = self.preprocessor.transform_single(input_dict)
        prob = float(self.model.predict_proba(X_df)[0][1])

        if prob >= 0.70:
            risk_tier = "LOW_RISK"
            status = "APPROVED"
        elif prob >= 0.45:
            risk_tier = "MEDIUM_RISK"
            status = "PENDING"
        else:
            risk_tier = "HIGH_RISK"
            status = "REJECTED"

        return round(prob, 4), risk_tier, status

    def get_shap_explanation(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        return self.xai_manager.explain_shap(input_dict)

    def get_dice_roadmap(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        return self.xai_manager.explain_dice_counterfactual(input_dict)

ml_service = MLInferenceService()
