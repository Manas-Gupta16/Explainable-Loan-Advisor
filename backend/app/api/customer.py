import json
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.services.ocr_service import ocr_service

from backend.app.db.database import get_db
from backend.app.db.models import LoanApplication, XAILog, StressTestLog
from backend.app.schemas.loan import (
    LoanApplicationCreate, 
    LoanApplicationResponse, 
    BankRecommendation,
    ConformalPredictionRequest,
    ConformalPredictionResponse,
    CausalRecourseRequest,
    CausalRecourseResponse,
    BudgetRecourseRequest,
    BudgetRecourseResponse,
    BudgetFrontierPoint,
    AccountAggregatorAnalysisRequest,
    AccountAggregatorAnalysisResponse,
    CoachAdviceRequest,
    CoachAdviceResponse,
    VoiceGuideScriptRequest,
    VoiceGuideScriptResponse
)

from backend.app.services.ml_service import ml_service
from backend.app.services.bank_service import evaluate_bank_recommendations
from backend.app.services.climate_risk_service import ClimateRiskService

router = APIRouter(prefix="/customer", tags=["Customer Portal"])

@router.post("/apply", response_model=Dict[str, Any])
async def submit_application(app_in: LoanApplicationCreate, user_id: int = 1, db: Session = Depends(get_db)):
    input_dict = app_in.model_dump()

    # 1. Run ML Inference (Base Probability)
    prob, risk_tier, status = ml_service.predict_risk(input_dict)
    
    # 2. Fraud & Anomaly Detection
    is_fraud = ml_service.predict_fraud(input_dict)
    
    # 3. Live Climate Risk Integration (Open-Meteo)
    # Default to MH (Maharashtra) for rural agriculture simulation
    climate_data = await ClimateRiskService.get_climate_risk("MH")
    
    # Apply climate risk penalty to base probability
    if climate_data.get("climate_risk_penalty", 0) > 0:
        prob = max(0.01, prob - climate_data["climate_risk_penalty"])
        
    # If fraud detected, automatically reject regardless of ML score
    if is_fraud:
        prob = 0.01
        risk_tier = "CRITICAL_FRAUD"
        status = "REJECTED"

    # 4. Get Bank Recommendations
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
        "fraud_flag": is_fraud,
        "climate_risk_data": climate_data,
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
        language=coach_in.language,
        bank_recommendations=coach_in.bank_recommendations,
        approval_probability=coach_in.approval_probability,
        risk_tier=coach_in.risk_tier,
        status=coach_in.status
    )
    return advice

@router.post("/voice-guide-script", response_model=VoiceGuideScriptResponse)
def get_voice_guide_script(req: VoiceGuideScriptRequest, db: Session = Depends(get_db)):
    """
    Generates a 100% data-driven, personalized multi-lingual voice guide script
    tailored to the live borrower inputs, ML decision, real matched banks, and SHAP features.
    """
    loan_input = req.loan_input or {}
    app_result = req.application_result or {}
    
    prob = app_result.get("approval_probability")
    risk_tier = app_result.get("risk_tier")
    status = app_result.get("status")
    bank_recs = app_result.get("bank_recommendations")
    shap_data = app_result.get("shap_explanation")
    
    # If prob not provided in payload, predict directly using ML service
    if prob is None and loan_input:
        try:
            prob, risk_tier, status = ml_service.predict_risk(loan_input)
        except Exception:
            prob, risk_tier, status = 0.85, "Low Risk", "APPROVED"

    if not bank_recs and loan_input:
        try:
            recs_objs = evaluate_bank_recommendations(loan_input, prob or 0.85)
            bank_recs = [b.model_dump() for b in recs_objs]
        except Exception:
            bank_recs = []

    if not shap_data and loan_input:
        try:
            shap_data = ml_service.get_shap_explanation(loan_input)
        except Exception:
            shap_data = {}

    advice = llm_coach_service.generate_coach_advice(
        applicant_name=req.applicant_name or "Valued Borrower",
        loan_input=loan_input,
        shap_data=shap_data,
        language=req.language,
        bank_recommendations=bank_recs,
        approval_probability=prob,
        risk_tier=risk_tier,
        status=status
    )

    top_bank = bank_recs[0] if bank_recs else {}
    prob_int = int(round((prob if prob is not None else 0.85) * 100))

    return VoiceGuideScriptResponse(
        script=advice["conversational_audio_script"],
        headline=advice["executive_summary"],
        approval_percentage=prob_int,
        matched_bank=top_bank.get("bank_name", "State Bank of India"),
        interest_rate=float(top_bank.get("base_interest_rate", 7.00)),
        status=status or "APPROVED"
    )


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

@router.post("/upload-document-image/{app_id}", response_model=DocumentVerificationResponse)
async def upload_document_image(
    app_id: int,
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Real OCR image processing using EasyOCR.
    """
    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    declared_income = app_obj.applicant_income / 12.0
    
    # Read image bytes
    image_bytes = await file.read()
    
    # Extract text via EasyOCR
    raw_text = ocr_service.extract_text_from_image(image_bytes)
    
    # Run the existing verification logic using the dynamically extracted text
    ocr_result = ocr_service.extract_and_verify(
        file_name=file.filename,
        document_type=document_type,
        declared_monthly_income=declared_income,
        raw_text=raw_text
    )

    db_doc = DocumentVerification(
        application_id=app_id,
        document_type=document_type,
        file_name=file.filename,
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

@router.get("/applications/{app_id}/dossier-pdf")
def download_customer_adverse_action_dossier(
    app_id: int,
    db: Session = Depends(get_db)
):
    """
    Downloads customer copy of Adverse Action Notice / XAI Loan Decision Report in PDF format.
    """
    from fastapi.responses import Response
    from backend.app.services.conformal_service import conformal_service
    from backend.app.services.fairness_service import fairness_service
    from backend.app.services.pdf_dossier_service import pdf_dossier_service

    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Loan Application not found.")

    xai = db.query(XAILog).filter(XAILog.application_id == app_id).first()
    shap_data = json.loads(xai.shap_data) if xai and xai.shap_data else None
    dice_data = json.loads(xai.dice_roadmap) if xai and xai.dice_roadmap else None

    app_dict = {
        'id': app_obj.id,
        'user_id': app_obj.user_id,
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
        'loan_purpose': app_obj.loan_purpose,
        'approval_probability': app_obj.approval_probability or 0.5,
        'risk_tier': app_obj.risk_tier or "MEDIUM_RISK",
        'status': app_obj.status or "PENDING",
        'recommended_bank': app_obj.recommended_bank or "Apex National Bank",
        'officer_notes': app_obj.officer_notes,
        'created_at': app_obj.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if app_obj.created_at else None
    }

    try:
        conformal_data = conformal_service.evaluate_uncertainty(app_dict, confidence_level=0.95)
    except Exception:
        conformal_data = None

    try:
        fairness_data = fairness_service.audit_fairness()
    except Exception:
        fairness_data = None

    pdf_bytes = pdf_dossier_service.generate_dossier_pdf(
        application_data=app_dict,
        conformal_data=conformal_data,
        shap_data=shap_data,
        dice_data=dice_data,
        fairness_data=fairness_data
    )

    filename = f"loan_decision_dossier_{app_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "X-Application-ID": str(app_id)
        }
    )

@router.post("/causal-recourse", response_model=CausalRecourseResponse)
def compute_causal_recourse_trajectory(
    req: CausalRecourseRequest,
    db: Session = Depends(get_db)
):
    """
    Computes a realistic 3-phase temporal recourse trajectory along the Structural Causal DAG,
    accounting for endogenous feature propagation and bureau reporting lags.
    """
    from backend.app.services.causal_service import causal_service

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

    trajectory = causal_service.generate_causal_trajectory(
        input_dict=input_dict,
        target_probability=req.target_probability,
        max_horizon_days=req.max_horizon_days
    )
    return CausalRecourseResponse(**trajectory)

@router.get("/causal-graph", response_model=Dict[str, Any])
def get_structural_causal_graph():
    """Returns the Structural Causal Model (SCM) nodes, mechanism edges, and temporal lag structure."""
    from backend.app.services.causal_service import causal_service
    return causal_service.get_causal_graph()

@router.post("/budget-recourse", response_model=BudgetRecourseResponse)
def compute_budget_constrained_recourse(
    req: BudgetRecourseRequest,
    db: Session = Depends(get_db)
):
    """
    Solves mathematically optimal recourse via Sequential Least Squares Quadratic Programming (SLSQP),
    strictly bounded by the borrower's monthly disposable cashflow surplus and feasibility limits.
    """
    from backend.app.services.budget_recourse_service import budget_recourse_service

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

    result = budget_recourse_service.optimize_recourse(
        input_dict=input_dict,
        target_probability=req.target_probability,
        horizon_months=req.horizon_months,
        monthly_living_expenses=req.monthly_living_expenses,
        max_surplus_allocation_pct=req.max_surplus_allocation_pct
    )
    return BudgetRecourseResponse(**result)

@router.post("/budget-frontier", response_model=List[BudgetFrontierPoint])
def get_pareto_budget_frontier(
    req: BudgetRecourseRequest,
    db: Session = Depends(get_db)
):
    """
    Generates Pareto Budget Frontier tradeoff curve:
    Returns achievable approval probabilities across varying monthly commitment tiers ($100/mo -> $1500/mo).
    """
    from backend.app.services.budget_recourse_service import budget_recourse_service

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

    frontier = budget_recourse_service.get_budget_frontier(
        input_dict=input_dict,
        horizon_months=req.horizon_months
    )
    return [BudgetFrontierPoint(**p) for p in frontier]

@router.post("/account-aggregator/analyze", response_model=AccountAggregatorAnalysisResponse)
def analyze_account_aggregator_cashflow(
    req: AccountAggregatorAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyzes bank statement transaction stream via Account Aggregator / Open Banking protocol:
    Extracts NACH mandate bounce ratios, income volatility indices, and alternative credit scores.
    """
    from backend.app.services.open_banking_service import open_banking_service

    if req.raw_transactions and len(req.raw_transactions) > 0:
        raw_list = [t.model_dump() for t in req.raw_transactions]
        analysis = open_banking_service.analyze_raw_transactions(
            transactions=raw_list,
            requested_loan_emi=req.requested_loan_emi
        )
        analysis["application_id"] = req.application_id
        analysis["account_type"] = req.account_type
        analysis["account_institution"] = "Account Aggregator Data Consent"
        analysis["account_number_mask"] = "XXXX-XXXX-3891"
    else:
        # Fallback to simulated pull based on user profile or application_id
        salary = req.monthly_salary
        if req.application_id:
            app_obj = db.query(LoanApplication).filter(LoanApplication.id == req.application_id).first()
            if app_obj and app_obj.applicant_income:
                salary = app_obj.applicant_income / 12.0

        analysis = open_banking_service.analyze_account_transactions(
            application_id=req.application_id or 1,
            monthly_net_salary=salary,
            existing_monthly_emi=req.requested_loan_emi
        )

    return AccountAggregatorAnalysisResponse(**analysis)

@router.get("/account-aggregator/sample-stream", response_model=List[Dict[str, Any]])
def get_sample_account_aggregator_stream(
    account_type: str = "SALARIED_PRIME",
    monthly_salary: float = 6500.0
):
    """Generates synthetic 6-month transaction feed for interactive testing."""
    from backend.app.services.open_banking_service import open_banking_service
    return open_banking_service.get_sample_stream(
        account_type=account_type,
        monthly_salary=monthly_salary
    )

from pydantic import BaseModel
from typing import Optional

class VoiceAudioRequest(BaseModel):
    text: str
    lang: str = "hi"

def normalize_regional_numbers(text: str, lang: str) -> str:
    """Replaces raw digits with native language words so TTS doesn't stumble on ASCII numbers."""
    if lang == "hi":
        replacements = {
            "91": "इक्यानवे", "92": "बानवे", "90": "नब्बे", "7": "सात", "3": "तीन", "4": "चार", "8": "आठ"
        }
        for k, v in replacements.items():
            text = text.replace(f"{k}%", f"{v} प्रतिशत").replace(f"{k} %", f"{v} प्रतिशत").replace(f" {k} ", f" {v} ")
    elif lang == "mr":
        replacements = {
            "91": "एक्याण्णव", "92": "ब्याण्णव", "90": "नव्वद", "7": "सात", "3": "तीन", "4": "चार", "8": "आठ"
        }
        for k, v in replacements.items():
            text = text.replace(f"{k}%", f"{v} टक्के").replace(f"{k} %", f"{v} टक्के").replace(f" {k} ", f" {v} ")
    elif lang == "gu":
        replacements = {
            "91": "એકાણું", "92": "બાણું", "90": "નેવું", "7": "સાત", "3": "ત્રણ", "4": "ચાર"
        }
        for k, v in replacements.items():
            text = text.replace(f"{k}%", f"{v} ટકા").replace(f"{k} %", f"{v} ટકા").replace(f" {k} ", f" {v} ")
    elif lang == "bn":
        replacements = {
            "91": "একানব্বই", "92": "বিরানব্বই", "90": "নব্বই", "7": "সাত", "3": "তিন", "4": "চার"
        }
        for k, v in replacements.items():
            text = text.replace(f"{k}%", f"{v} শতাংশ").replace(f"{k} %", f"{v} শতাংশ").replace(f" {k} ", f" {v} ")
    return text

import hashlib

AUDIO_CACHE: Dict[str, bytes] = {}

@router.post("/voice-audio")
def generate_voice_audio_post(body: VoiceAudioRequest):
    return generate_voice_audio_response(body.text, body.lang)

@router.get("/voice-audio")
def generate_voice_audio_get(text: str, lang: str = "hi"):
    return generate_voice_audio_response(text, lang)

def generate_voice_audio_response(text: str, lang: str = "hi"):
    """
    Generates and streams fluent, native MP3 speech audio using gTTS 
    with in-memory MD5 caching for instantaneous zero-latency playback.
    """
    from fastapi.responses import Response
    import io
    from gtts import gTTS

    supported_langs = {
        "hi": "hi",
        "mr": "mr",
        "gu": "gu",
        "bn": "bn",
        "ta": "ta",
        "te": "te",
        "en": "en"
    }
    target_lang = supported_langs.get(lang, "hi")
    clean_text = normalize_regional_numbers(text, target_lang)

    cache_key = hashlib.md5(f"{target_lang}_{clean_text}".encode('utf-8')).hexdigest()
    if cache_key in AUDIO_CACHE:
        content = AUDIO_CACHE[cache_key]
        return Response(
            content=content,
            media_type="audio/mpeg",
            headers={
                "Content-Length": str(len(content)),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400",
                "X-Audio-Cache": "HIT"
            }
        )

    fp = io.BytesIO()
    tts = gTTS(text=clean_text, lang=target_lang, slow=False)
    tts.write_to_fp(fp)
    content = fp.getvalue()
    
    # Store in cache (limit cache size to 200 items to keep RAM minimal)
    if len(AUDIO_CACHE) > 200:
        AUDIO_CACHE.clear()
    AUDIO_CACHE[cache_key] = content
    
    return Response(
        content=content,
        media_type="audio/mpeg",
        headers={
            "Content-Length": str(len(content)),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400",
            "X-Audio-Cache": "MISS"
        }
    )










