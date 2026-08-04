import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import XAILog, LoanApplication
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/xai", tags=["Explainable AI Engine"])

@router.get("/shap/{app_id}")
def get_shap_explanation(app_id: int, db: Session = Depends(get_db)):
    """Retrieves SHAP feature impact explanation for a specific loan application."""
    xai = db.query(XAILog).filter(XAILog.application_id == app_id).first()
    if not xai or not xai.shap_data:
        app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Loan application not found.")
        # Compute on the fly if missing
        input_dict = {
            'cibil_score': app_obj.cibil_score,
            'applicant_income': app_obj.applicant_income,
            'coapplicant_income': app_obj.coapplicant_income,
            'loan_amount': app_obj.loan_amount,
            'loan_tenure_months': app_obj.loan_tenure_months,
            'existing_debts': app_obj.existing_debts,
            'credit_card_utilization': app_obj.credit_card_utilization,
            'delinquent_lines_2yrs': app_obj.delinquent_lines_2yrs,
            'credit_history_years': app_obj.credit_history_years,
            'employment_status': app_obj.employment_status,
            'education': app_obj.education,
            'home_ownership': app_obj.home_ownership,
            'loan_purpose': app_obj.loan_purpose
        }
        shap_data = ml_service.get_shap_explanation(input_dict)
        return shap_data

    return json.loads(xai.shap_data)

@router.get("/dice/{app_id}")
def get_dice_roadmap(app_id: int, db: Session = Depends(get_db)):
    """Retrieves DiCE Counterfactual Approval Roadmap for a rejected loan application."""
    xai = db.query(XAILog).filter(XAILog.application_id == app_id).first()
    if not xai or not xai.dice_roadmap:
        app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Loan application not found.")
        input_dict = {
            'cibil_score': app_obj.cibil_score,
            'applicant_income': app_obj.applicant_income,
            'coapplicant_income': app_obj.coapplicant_income,
            'loan_amount': app_obj.loan_amount,
            'loan_tenure_months': app_obj.loan_tenure_months,
            'existing_debts': app_obj.existing_debts,
            'credit_card_utilization': app_obj.credit_card_utilization,
            'delinquent_lines_2yrs': app_obj.delinquent_lines_2yrs,
            'credit_history_years': app_obj.credit_history_years,
            'employment_status': app_obj.employment_status,
            'education': app_obj.education,
            'home_ownership': app_obj.home_ownership,
            'loan_purpose': app_obj.loan_purpose
        }
        dice_data = ml_service.get_dice_roadmap(input_dict)
        return dice_data

    return json.loads(xai.dice_roadmap)
