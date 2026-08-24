import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.model_selection import train_test_split

class ConformalPredictor:
    """
    Inductive Conformal Prediction (ICP) & Epistemic Uncertainty Quantification Engine.
    Provides mathematically guaranteed coverage sets Gamma^alpha at user-specified (1-alpha) confidence.
    """

    def __init__(self, model=None, preprocessor=None):
        self.model = model
        self.preprocessor = preprocessor
        self.cal_scores_0: np.ndarray = np.array([])
        self.cal_scores_1: np.ndarray = np.array([])
        self.all_cal_scores: np.ndarray = np.array([])
        self.is_calibrated: bool = False
        self.feature_means: np.ndarray = np.array([])
        self.feature_stds: np.ndarray = np.array([])

    def calibrate(self, X_cal: np.ndarray, y_cal: np.ndarray):
        """
        Calibrates the conformal predictor using held-out calibration data.
        Non-conformity score s_i = 1 - P(Y = y_i | X_i).
        """
        probs = self.model.predict_proba(X_cal)
        
        # Non-conformity score for true labels
        scores = []
        scores_0 = []
        scores_1 = []

        for i in range(len(y_cal)):
            true_label = int(y_cal[i])
            score = 1.0 - probs[i, true_label]
            scores.append(score)
            if true_label == 0:
                scores_0.append(score)
            else:
                scores_1.append(score)

        self.all_cal_scores = np.sort(np.array(scores))
        self.cal_scores_0 = np.sort(np.array(scores_0)) if scores_0 else self.all_cal_scores
        self.cal_scores_1 = np.sort(np.array(scores_1)) if scores_1 else self.all_cal_scores
        
        # Calculate feature distributions for Out-of-Distribution (OOD) distance estimation
        self.feature_means = np.mean(X_cal, axis=0)
        self.feature_stds = np.std(X_cal, axis=0) + 1e-6
        self.is_calibrated = True

    def predict_conformal(
        self, 
        input_dict: Dict[str, Any], 
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        """
        Computes conformal prediction set, p-values, credibility, and epistemic uncertainty.
        confidence_level: (1 - alpha), e.g., 0.95 for 95% coverage.
        """
        if not self.is_calibrated:
            raise RuntimeError("ConformalPredictor must be calibrated before making predictions.")

        alpha = 1.0 - confidence_level
        X_df = self.preprocessor.transform_single(input_dict)
        X_arr = X_df.values
        probs = self.model.predict_proba(X_arr)[0]
        prob_default = float(probs[0])
        prob_approved = float(probs[1])

        # Candidate non-conformity scores
        score_if_0 = 1.0 - prob_default
        score_if_1 = 1.0 - prob_approved

        n = len(self.all_cal_scores)
        # Compute p-values for each candidate class
        # p_value(y) = (1 + sum(s_i >= s_new(y))) / (n + 1)
        p_val_0 = float((1 + np.sum(self.all_cal_scores >= score_if_0)) / (n + 1))
        p_val_1 = float((1 + np.sum(self.all_cal_scores >= score_if_1)) / (n + 1))

        # Construct prediction set Gamma^alpha = {y : p_value(y) > alpha}
        prediction_set = []
        prediction_labels = []
        if p_val_0 > alpha:
            prediction_set.append(0)
            prediction_labels.append("REJECTED_OR_DEFAULT")
        if p_val_1 > alpha:
            prediction_set.append(1)
            prediction_labels.append("APPROVED")

        # Conformal Metrics
        p_vals = [p_val_0, p_val_1]
        sorted_p_vals = sorted(p_vals)
        credibility = float(max(p_vals))  # How typical is this applicant
        confidence = float(1.0 - sorted_p_vals[0])  # How strongly one class dominates

        # Epistemic Uncertainty & Out-of-Distribution (OOD) Z-Score
        z_scores = np.abs((X_arr[0] - self.feature_means) / self.feature_stds)
        max_z_score = float(np.max(z_scores))
        avg_z_score = float(np.mean(z_scores))
        is_ood = bool(credibility < 0.05 or avg_z_score > 2.0 or max_z_score > 2.5)


        # Calibrated Probability Interval [p_lower, p_upper]
        # Quantile cutoff for non-conformity
        q_idx = int(np.ceil((n + 1) * (1.0 - alpha)))
        q_idx = min(q_idx, n - 1)
        q_alpha = float(self.all_cal_scores[q_idx])

        margin = float(q_alpha * np.sqrt(max(prob_approved * (1.0 - prob_approved), 0.01) / max(n, 100)) * 5.0)
        p_lower = round(float(np.clip(prob_approved - margin, 0.0, 1.0)), 4)
        p_upper = round(float(np.clip(prob_approved + margin, 0.0, 1.0)), 4)

        # Triage Category Determination
        if is_ood:
            triage_category = "OUT_OF_DISTRIBUTION"
            triage_recommendation = "Applicant profile differs significantly from historical data. Forensic document verification recommended."
        elif len(prediction_set) == 2:
            triage_category = "BORDERLINE_UNCERTAIN"
            triage_recommendation = "Both Approval and Rejection are statistically plausible at 95% confidence. Mandatory human underwriter review required."
        elif len(prediction_set) == 1 and prediction_set[0] == 1:
            triage_category = "CONFIDENT_APPROVAL"
            triage_recommendation = "High confidence automated approval with calibrated low default risk."
        elif len(prediction_set) == 1 and prediction_set[0] == 0:
            triage_category = "CONFIDENT_REJECTION"
            triage_recommendation = "High confidence adverse decision. Generate DiCE counterfactual recourse roadmap."
        else:
            triage_category = "ANOMALY_EMPTY_SET"
            triage_recommendation = "Model unable to conform with historical patterns at this confidence level."

        uncertainty_score = round(float(np.clip((1.0 - confidence) * 0.6 + (1.0 - credibility) * 0.4, 0.0, 1.0)), 4)

        return {
            "point_probability": round(prob_approved, 4),
            "confidence_level": confidence_level,
            "calibrated_interval": {
                "lower_bound": p_lower,
                "upper_bound": p_upper,
                "interval_width": round(p_upper - p_lower, 4)
            },
            "conformal_prediction_set": prediction_set,
            "conformal_set_labels": prediction_labels,
            "metrics": {
                "p_value_rejected": round(p_val_0, 4),
                "p_value_approved": round(p_val_1, 4),
                "confidence": round(confidence, 4),
                "credibility": round(credibility, 4),
                "epistemic_uncertainty_score": uncertainty_score,
                "ood_z_score_max": round(max_z_score, 2),
                "is_out_of_distribution": is_ood
            },
            "triage": {
                "category": triage_category,
                "recommendation": triage_recommendation,
                "requires_human_override": (triage_category in ["BORDERLINE_UNCERTAIN", "OUT_OF_DISTRIBUTION", "ANOMALY_EMPTY_SET"])
            }
        }

    def save(self, filepath: str):
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> 'ConformalPredictor':
        return joblib.load(filepath)
