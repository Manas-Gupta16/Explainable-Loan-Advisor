import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.database import get_db
from backend.app.db.models import LoanApplication, XAILog, StressTestLog
from backend.app.schemas.loan import (
    LoanApplicationCreate, 
    LoanApplicationResponse, 
    BankRecommendation,
    ConformalPredictionRequest,
    ConformalPredictionResponse
)
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

# --- Feature 1: LLM-Powered AI Financial Coach ---
from backend.app.schemas.loan import (
    CoachAdviceRequest, CoachAdviceResponse,
    DocumentVerificationCreate, DocumentVerificationResponse,
    OpenBankingConnectRequest, OpenBankingAnalysisResponse,
    StressTestRequest, StressTestResponse
)
from backend.app.services.llm_coach_service import llm_coach_service
from backend.app.services.ocr_service import ocr_service
from backend.app.services.open_banking_service import open_banking_service
from backend.app.services.stress_test_service import stress_test_service
from backend.app.db.models import DocumentVerification, OpenBankingProfile, StressTestLog

@router.post("/coach-advice", response_model=CoachAdviceResponse)
def get_ai_coach_advice(coach_in: CoachAdviceRequest, db: Session = Depends(get_db)):
    """
    Generates personalized conversational financial coaching advice, action milestones,
    and text-to-speech audio script from SHAP & DiCE outputs.
    """
    loan_input_dict = coach_in.loan_input.model_dump() if coach_in.loan_input else None
    shap_data = coach_in.shap_data
    dice_data = coach_in.dice_data

    # If application_id provided, look up from DB
    if coach_in.application_id and not loan_input_dict:
        app_obj = db.query(LoanApplication).filter(LoanApplication.id == coach_in.application_id).first()
        if app_obj:
            loan_input_dict = {
                'cibil_score': app_obj.cibil_score,
                'applicant_income': app_obj.applicant_income,
                'loan_amount': app_obj.loan_amount,
                'existing_debts': app_obj.existing_debts,
                'credit_card_utilization': app_obj.credit_card_utilization
            }
            if not shap_data:
                shap_data = ml_service.get_shap_explanation(loan_input_dict)
            if not dice_data:
                dice_data = ml_service.get_dice_roadmap(loan_input_dict)

    advice = llm_coach_service.generate_coach_advice(
        applicant_name=coach_in.applicant_name or "Applicant",
        loan_input=loan_input_dict,
        shap_data=shap_data,
        dice_data=dice_data,
        language=coach_in.language
    )
    return advice

# --- Feature 3: OCR Document Verification & Fraud Detection ---
@router.post("/upload-documents/{app_id}", response_model=DocumentVerificationResponse)
def upload_verification_document(
    app_id: int,
    doc_in: DocumentVerificationCreate,
    db: Session = Depends(get_db)
):
    """
    Simulates OCR extraction of uploaded Pay Slip / Tax Form 16 and computes discrepancy fraud score.
    """
    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    declared_income = doc_in.declared_monthly_income
    if app_obj and declared_income <= 0:
        declared_income = app_obj.applicant_income / 12.0

    ocr_result = ocr_service.extract_and_verify(
        file_name=doc_in.file_name,
        document_type=doc_in.document_type,
        declared_monthly_income=declared_income,
        raw_text=doc_in.raw_text_content
    )

    db_doc = DocumentVerification(
        application_id=app_id,
        document_type=doc_in.document_type,
        file_name=doc_in.file_name,
        extracted_monthly_income=ocr_result['extracted_monthly_income'],
        declared_monthly_income=declared_income,
        extracted_employer=ocr_result['extracted_employer'],
        extracted_tax_id=ocr_result['extracted_tax_id'],
        discrepancy_ratio=ocr_result['discrepancy_ratio'],
        verification_status=ocr_result['verification_status'],
        fraud_risk_score=ocr_result['fraud_risk_score'],
        audit_notes=ocr_result['audit_notes']
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    return DocumentVerificationResponse(
        id=db_doc.id,
        application_id=app_id,
        document_type=db_doc.document_type,
        file_name=db_doc.file_name,
        extracted_monthly_income=db_doc.extracted_monthly_income,
        declared_monthly_income=db_doc.declared_monthly_income,
        extracted_employer=db_doc.extracted_employer,
        extracted_tax_id=db_doc.extracted_tax_id,
        discrepancy_ratio=db_doc.discrepancy_ratio,
        discrepancy_percentage=ocr_result['discrepancy_percentage'],
        verification_status=db_doc.verification_status,
        fraud_risk_score=db_doc.fraud_risk_score,
        audit_notes=db_doc.audit_notes or ""
    )

@router.get("/document-status/{app_id}")
def get_document_verification_status(app_id: int, db: Session = Depends(get_db)):
    """Retrieves all uploaded verification documents and fraud audit logs for an application."""
    docs = db.query(DocumentVerification).filter(DocumentVerification.application_id == app_id).all()
    return [DocumentVerificationResponse(
        id=d.id,
        application_id=d.application_id,
        document_type=d.document_type,
        file_name=d.file_name,
        extracted_monthly_income=d.extracted_monthly_income,
        declared_monthly_income=d.declared_monthly_income,
        extracted_employer=d.extracted_employer,
        extracted_tax_id=d.extracted_tax_id,
        discrepancy_ratio=d.discrepancy_ratio,
        discrepancy_percentage=f"{round(d.discrepancy_ratio * 100, 2)}%",
        verification_status=d.verification_status,
        fraud_risk_score=d.fraud_risk_score,
        audit_notes=d.audit_notes or ""
    ) for d in docs]

# --- Feature 4: Open Banking / Plaid Real-Time Cash Flow ---
@router.post("/open-banking/connect", response_model=OpenBankingAnalysisResponse)
def connect_open_banking(bank_in: OpenBankingConnectRequest, db: Session = Depends(get_db)):
    """
    Connects to mock Open Banking / Plaid feed, extracts monthly cash inflows/outflows,
    calculates DSCR ratio, and determines dynamic risk adjustments.
    """
    app_obj = db.query(LoanApplication).filter(LoanApplication.id == bank_in.application_id).first()
    salary = bank_in.monthly_net_salary
    if not salary and app_obj:
        salary = app_obj.applicant_income / 12.0

    emi = bank_in.existing_monthly_emi
    if emi is None and app_obj:
        emi = app_obj.existing_debts / 12.0

    res = open_banking_service.analyze_account_transactions(
        application_id=bank_in.application_id,
        monthly_net_salary=salary,
        existing_monthly_emi=emi
    )

    db_profile = OpenBankingProfile(
        application_id=bank_in.application_id,
        account_number_mask=res['account_number_mask'],
        avg_monthly_inflow=res['avg_monthly_inflow'],
        avg_monthly_outflow=res['avg_monthly_outflow'],
        monthly_free_cashflow=res['monthly_free_cashflow'],
        debt_service_coverage_ratio=res['debt_service_coverage_ratio'],
        salary_credit_stability_index=res['salary_credit_stability_index'],
        cashflow_quality_grade=res['cashflow_quality_grade']
    )
    db.add(db_profile)
    db.commit()

    return OpenBankingAnalysisResponse(**res)

# --- Feature 6: Macroeconomic Stress Testing ---
@router.post("/stress-test", response_model=StressTestResponse)
def run_macro_stress_test(test_in: StressTestRequest, db: Session = Depends(get_db)):
    """
    Simulates portfolio resilience against interest rate hikes, inflation surges, and income dips.
    """
    baseline_prob = 0.84
    cibil = 740
    income = 85000.0
    loan_amt = 250000.0
    existing_debts = 12000.0

    if test_in.application_id:
        app_obj = db.query(LoanApplication).filter(LoanApplication.id == test_in.application_id).first()
        if app_obj:
            baseline_prob = app_obj.approval_probability or 0.84
            cibil = app_obj.cibil_score
            income = app_obj.applicant_income
            loan_amt = app_obj.loan_amount
            existing_debts = app_obj.existing_debts
    elif test_in.loan_input:
        li = test_in.loan_input
        prob, _, _ = ml_service.predict_risk(li.model_dump())
        baseline_prob = prob
        cibil = li.cibil_score
        income = li.applicant_income
        loan_amt = li.loan_amount
        existing_debts = li.existing_debts

    res = stress_test_service.run_stress_test(
        baseline_prob=baseline_prob,
        cibil_score=cibil,
        applicant_income=income,
        loan_amount=loan_amt,
        existing_debts=existing_debts,
        scenario=test_in.scenario,
        rate_hike_pct=test_in.interest_rate_delta_pct,
        inflation_pct=test_in.inflation_cost_delta_pct,
        income_shock_pct=test_in.income_shock_pct
    )

    if test_in.application_id:
        db_log = StressTestLog(
            application_id=test_in.application_id,
            scenario_name=test_in.scenario,
            simulated_interest_rate_delta=test_in.interest_rate_delta_pct,
            simulated_inflation_cost_delta=test_in.inflation_cost_delta_pct,
            simulated_income_shock_pct=test_in.income_shock_pct,
            baseline_approval_prob=res['baseline_approval_probability'],
            stressed_approval_prob=res['stressed_approval_probability'],
            stressed_dti_ratio=res['stressed_dti'],
            resilience_grade=res['resilience_grade']
        )
        db.add(db_log)
        db.commit()

    return StressTestResponse(**res)

@router.post("/conformal-predict", response_model=ConformalPredictionResponse)
def evaluate_conformal_uncertainty(
    req: ConformalPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Computes calibrated prediction sets (Gamma^alpha) and epistemic uncertainty
    quantification at user-specified confidence level (e.g. 95%).
    """
    from backend.app.services.conformal_service import conformal_service
    
    if req.loan_input:
        input_dict = req.loan_input.model_dump()
    elif req.application_id:
        app_obj = db.query(LoanApplication).filter(LoanApplication.id == req.application_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Application not found.")
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
    else:
        raise HTTPException(status_code=400, detail="Must provide either loan_input or application_id.")

    result = conformal_service.evaluate_uncertainty(
        input_dict=input_dict,
        confidence_level=req.confidence_level
    )
    return ConformalPredictionResponse(**result)


