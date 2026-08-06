import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.database import get_db
from backend.app.db.models import LoanApplication, XAILog
from backend.app.schemas.loan import LoanApplicationCreate, LoanApplicationResponse, BankRecommendation
from backend.app.services.ml_service import ml_service
from backend.app.services.bank_service import evaluate_bank_recommendations

router = APIRouter(prefix="/customer", tags=["Customer Portal"])

@router.post("/apply", response_model=Dict[str, Any])
def submit_application(app_in: LoanApplicationCreate, user_id: int = 1, db: Session = Depends(get_db)):
    input_dict = app_in.model_dump()

    # 1. Run ML Inference
    prob, risk_tier, status = ml_service.predict_risk(input_dict)

    # 2. Get Bank Recommendations
    bank_recs = evaluate_bank_recommendations(input_dict, prob)
    top_bank = bank_recs[0].bank_name if bank_recs else "Apex National Bank"

    # 3. Create Loan Application Record
    db_app = LoanApplication(
        user_id=user_id,
        **input_dict,
        approval_probability=prob,
        risk_tier=risk_tier,
        status=status,
        recommended_bank=top_bank
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)

    # 4. Generate SHAP & DiCE Explanations
    shap_data = ml_service.get_shap_explanation(input_dict)
    dice_data = ml_service.get_dice_roadmap(input_dict)

    xai_log = XAILog(
        application_id=db_app.id,
        shap_data=json.dumps(shap_data),
        dice_roadmap=json.dumps(dice_data)
    )
    db.add(xai_log)
    db.commit()

    return {
        "application_id": db_app.id,
        "approval_probability": prob,
        "risk_tier": risk_tier,
        "status": status,
        "bank_recommendations": bank_recs,
        "shap_explanation": shap_data,
        "dice_roadmap": dice_data
    }

@router.post("/sandbox")
def run_sandbox_simulation(app_in: LoanApplicationCreate):
    """Real-time parametric sandbox simulation for interactive sliders."""
    input_dict = app_in.model_dump()
    prob, risk_tier, status = ml_service.predict_risk(input_dict)
    bank_recs = evaluate_bank_recommendations(input_dict, prob)
    shap_data = ml_service.get_shap_explanation(input_dict)

    return {
        "approval_probability": prob,
        "risk_tier": risk_tier,
        "status": status,
        "bank_recommendations": bank_recs,
        "shap_explanation": shap_data
    }

@router.get("/applications/{app_id}")
def get_application_details(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found.")

    xai = db.query(XAILog).filter(XAILog.application_id == app_id).first()
    shap_data = json.loads(xai.shap_data) if xai and xai.shap_data else {}
    dice_data = json.loads(xai.dice_roadmap) if xai and xai.dice_roadmap else {}

    return {
        "application": LoanApplicationResponse.model_validate(app_obj),
        "shap_explanation": shap_data,
        "dice_roadmap": dice_data
    }
