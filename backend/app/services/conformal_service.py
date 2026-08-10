import os
import joblib
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from ml_engine.conformal import ConformalPredictor
from backend.app.services.ml_service import ml_service

class ConformalService:
    """
    Service wrapper for Inductive Conformal Prediction & Epistemic Uncertainty Quantification.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConformalService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.conformal_path = settings.CONFORMAL_PATH
        if os.path.exists(self.conformal_path):
            try:
                self.predictor = ConformalPredictor.load(self.conformal_path)
            except Exception as e:
                print(f"Failed to load conformal predictor: {e}. Calibrating new one...")
                self._calibrate_from_scratch()
        else:
            print("Conformal predictor artifact not found. Calibrating from scratch...")
            self._calibrate_from_scratch()

    def _calibrate_from_scratch(self):
        from ml_engine.data.loader import load_and_normalize_dataset
        from ml_engine.data.generate_dataset import generate_loan_dataset
        
        csv_path = os.path.join(settings.BASE_DIR, "ml_engine", "data", "loan_dataset.csv")
        if not os.path.exists(csv_path):
            df_gen = generate_loan_dataset(num_samples=3000)
            df_gen.to_csv(csv_path, index=False)
            
        df = load_and_normalize_dataset(csv_path)
        X_processed, y = ml_service.preprocessor.transform(df), df['loan_status'].values
        
        self.predictor = ConformalPredictor(model=ml_service.model, preprocessor=ml_service.preprocessor)
        self.predictor.calibrate(X_processed.values, y)
        try:
            self.predictor.save(self.conformal_path)
        except Exception as e:
            print(f"Warning: Could not save conformal artifact: {e}")

    def evaluate_uncertainty(self, input_dict: Dict[str, Any], confidence_level: float = 0.95) -> Dict[str, Any]:
        """
        Calculates calibrated prediction sets and epistemic uncertainty scores for an applicant.
        """
        return self.predictor.predict_conformal(input_dict, confidence_level=confidence_level)

conformal_service = ConformalService()
