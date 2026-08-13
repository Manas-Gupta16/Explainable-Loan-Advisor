from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.app.db.database import get_db
from backend.app.db.models import LoanApplication
from backend.app.schemas.loan import LoanApplicationResponse, DecisionUpdate

router = APIRouter(prefix="/bank", tags=["Bank Portal"])

@router.get("/queue")
def get_applicant_queue(
    status_filter: Optional[str] = Query(None, description="Filter by PENDING, APPROVED, REJECTED"),
    db: Session = Depends(get_db)
):
    """Retrieves all applicant loan requests for the Bank Portal underwriter dashboard."""
    query = db.query(LoanApplication)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(LoanApplication.status == status_filter.upper())

    applications = query.order_by(LoanApplication.created_at.desc()).all()
    return [LoanApplicationResponse.model_validate(app) for app in applications]

@router.post("/decision/{app_id}")
def update_loan_decision(app_id: int, decision: DecisionUpdate, db: Session = Depends(get_db)):
    """Updates loan application approval status and appends underwriter notes."""
    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found.")

    if decision.status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision status must be APPROVED or REJECTED.")

    app_obj.status = decision.status
    if decision.officer_notes:
        app_obj.officer_notes = decision.officer_notes

    db.commit()
    db.refresh(app_obj)

    return {
        "message": f"Application {app_id} status updated to {decision.status}",
        "application": LoanApplicationResponse.model_validate(app_obj)
    }

# --- Feature 2: Demographic Fairness & Bias Audit ---
from backend.app.schemas.loan import (
    FairnessAuditResponse, ModelDriftResponse, RetrainResponse,
    StressTestResponse
)
from backend.app.services.fairness_service import fairness_service
from backend.app.services.monitoring_service import monitoring_service
from backend.app.services.stress_test_service import stress_test_service
from backend.app.db.models import FairnessAuditLog, ModelMonitoringLog
import json

@router.get("/fairness-audit", response_model=FairnessAuditResponse)
def get_demographic_fairness_audit(db: Session = Depends(get_db)):
    """
    Evaluates Disparate Impact Ratio, Demographic Parity, and Equalized Odds for ECOA compliance.
    """
    res = fairness_service.run_compliance_audit()
    
    # Log audit run to database
    audit_log = FairnessAuditLog(
        disparate_impact_ratio=res['disparate_impact_ratio'],
        demographic_parity_diff=res['demographic_parity_diff'],
        equalized_odds_diff=res['equalized_odds_diff'],
        four_fifths_rule_compliant="PASSED" if "PASSED" in res['four_fifths_rule_status'] else "VIOLATED",
        protected_attribute=res['protected_attribute'],
        detailed_metrics_json=json.dumps(res['group_metrics'])
    )
    db.add(audit_log)
    db.commit()

    return FairnessAuditResponse(
        audit_timestamp=audit_log.audit_timestamp.isoformat(),
        protected_attribute=res['protected_attribute'],
        privileged_group=res['privileged_group'],
        unprivileged_group=res['unprivileged_group'],
        disparate_impact_ratio=res['disparate_impact_ratio'],
        demographic_parity_diff=res['demographic_parity_diff'],
        equalized_odds_diff=res['equalized_odds_diff'],
        four_fifths_rule_status=res['four_fifths_rule_status'],
        regulatory_summary=res['regulatory_summary'],
        group_metrics=res['group_metrics']
    )

# --- Feature 5: Model Drift & Production Monitoring ---
@router.get("/model-monitoring", response_model=ModelDriftResponse)
def get_model_drift_monitoring(db: Session = Depends(get_db)):
    """
    Calculates Population Stability Index (PSI) and feature-level data drift across production inferences.
    """
    # Fetch recent inference inputs from db if available
    recent_apps = db.query(LoanApplication).order_by(LoanApplication.created_at.desc()).limit(150).all()
    inferences = []
    for app in recent_apps:
        inferences.append({
            'cibil_score': app.cibil_score,
            'applicant_income': app.applicant_income,
            'loan_amount': app.loan_amount,
            'dti_ratio': round((app.existing_debts / 12.0) / max(app.applicant_income / 12.0, 1.0), 4),
            'credit_card_utilization': app.credit_card_utilization
        })

    res = monitoring_service.check_production_health()

    log_entry = ModelMonitoringLog(
        batch_size=res['total_inferences_analyzed'],
        overall_psi=res['overall_model_psi'],
        drift_status=res['model_health_status'],
        drift_details_json=json.dumps(res['feature_drift_breakdown'])
    )
    db.add(log_entry)
    db.commit()

    return ModelDriftResponse(**res)

@router.post("/trigger-retrain", response_model=RetrainResponse)
def trigger_model_retrain_pipeline():
    """
    Executes automated model retraining and metric recalibration pipeline.
    """
    return monitoring_service.trigger_retraining()

# --- Feature 6: Batch Portfolio Stress Testing ---
@router.post("/stress-test-batch")
def run_batch_portfolio_stress_test(
    rate_hike_pct: float = Query(2.0, ge=0.0, le=10.0),
    scenario: str = Query("COMBINED_STAGFLATION"),
    db: Session = Depends(get_db)
):
    """
    Simulates macroeconomic stress shock across all applications in the bank underwriter portfolio.
    """
    apps = db.query(LoanApplication).all()
    if not apps:
        return {
            "total_loans_evaluated": 0,
            "portfolio_resilience_rate": "100%",
            "high_risk_exposure_count": 0,
            "results": []
        }

    results = []
    resilient_count = 0
    for app in apps:
        st = stress_test_service.run_stress_test(
            baseline_prob=app.approval_probability or 0.80,
            cibil_score=app.cibil_score,
            applicant_income=app.applicant_income,
            loan_amount=app.loan_amount,
            existing_debts=app.existing_debts,
            scenario=scenario,
            rate_hike_pct=rate_hike_pct
        )
        if st['resilience_grade'] == "HIGHLY_RESILIENT":
            resilient_count += 1
        results.append({
            "application_id": app.id,
            "applicant_cibil": app.cibil_score,
            "baseline_prob": st['baseline_approval_probability'],
            "stressed_prob": st['stressed_approval_probability'],
            "resilience_grade": st['resilience_grade']
        })

    resilience_pct = f"{round((resilient_count / max(len(apps), 1)) * 100, 1)}%"
    return {
        "total_loans_evaluated": len(apps),
        "portfolio_resilience_rate": resilience_pct,
        "high_risk_exposure_count": len(apps) - resilient_count,
        "results": results
    }

from fastapi.responses import Response
import json

@router.get("/applications/{app_id}/conformal-analysis", response_model=Dict[str, Any])
def get_applicant_conformal_analysis(
    app_id: int, 
    confidence_level: float = Query(0.95, ge=0.50, le=0.99),
    db: Session = Depends(get_db)
):
    """Underwriter deep-dive conformal prediction and uncertainty inspection."""
    from backend.app.services.conformal_service import conformal_service
    
    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
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

    conformal_res = conformal_service.evaluate_uncertainty(input_dict, confidence_level=confidence_level)
    return {
        "application_id": app_id,
        "applicant_name": f"Customer #{app_obj.user_id}",
        "conformal_analysis": conformal_res
    }

@router.get("/applications/{app_id}/compliance-dossier")
def download_regulatory_compliance_dossier(
    app_id: int,
    db: Session = Depends(get_db)
):
    """
    Generates and downloads an official, publication-grade Regulatory XAI Compliance Dossier &
    Adverse Action Notice PDF conforming to RBI, EU AI Act Art. 13 & 14, and US ECOA standards.
    """
    from backend.app.db.models import XAILog
    from backend.app.services.conformal_service import conformal_service
    from backend.app.services.fairness_service import fairness_service
    from backend.app.services.pdf_dossier_service import pdf_dossier_service

    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Loan Application not found.")

    # Pull XAI Logs
    xai = db.query(XAILog).filter(XAILog.application_id == app_id).first()
    shap_data = json.loads(xai.shap_data) if xai and xai.shap_data else None
    dice_data = json.loads(xai.dice_roadmap) if xai and xai.dice_roadmap else None

    # Pull application attributes
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

    # Evaluate Conformal Uncertainty
    try:
        conformal_data = conformal_service.evaluate_uncertainty(app_dict, confidence_level=0.95)
    except Exception:
        conformal_data = None

    # Evaluate Fairness Audit
    try:
        fairness_data = fairness_service.audit_fairness()
    except Exception:
        fairness_data = None

    # Generate In-Memory PDF
    pdf_bytes = pdf_dossier_service.generate_dossier_pdf(
        application_data=app_dict,
        conformal_data=conformal_data,
        shap_data=shap_data,
        dice_data=dice_data,
        fairness_data=fairness_data
    )

    filename = f"regulatory_compliance_dossier_{app_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "X-Report-Title": "Regulatory XAI Compliance Dossier",
            "X-Application-ID": str(app_id)
        }
    )

@router.get("/applications/{app_id}/causal-trajectory", response_model=Dict[str, Any])
def get_applicant_causal_recourse_trajectory(
    app_id: int,
    target_probability: float = Query(0.75, ge=0.50, le=0.99),
    max_horizon_days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db)
):
    """Underwriter inspection of 3-phase temporal causal recourse trajectory and sensitivity ranking."""
    from backend.app.services.causal_service import causal_service

    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Loan Application not found.")

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

    trajectory = causal_service.generate_causal_trajectory(
        input_dict=input_dict,
        target_probability=target_probability,
        max_horizon_days=max_horizon_days
    )

    return {
        "application_id": app_id,
        "applicant_name": f"Customer #{app_obj.user_id}",
        "trajectory": trajectory
    }

@router.get("/applications/{app_id}/budget-recourse", response_model=Dict[str, Any])
def get_applicant_budget_recourse_analysis(
    app_id: int,
    target_probability: float = Query(0.75, ge=0.50, le=0.99),
    horizon_months: int = Query(6, ge=1, le=24),
    max_surplus_allocation_pct: float = Query(0.60, ge=0.10, le=0.90),
    db: Session = Depends(get_db)
):
    """Underwriter inspection of mathematically optimal, cashflow-bounded recourse and affordability score."""
    from backend.app.services.budget_recourse_service import budget_recourse_service

    app_obj = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Loan Application not found.")

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

    result = budget_recourse_service.optimize_recourse(
        input_dict=input_dict,
        target_probability=target_probability,
        horizon_months=horizon_months,
        max_surplus_allocation_pct=max_surplus_allocation_pct
    )

    frontier = budget_recourse_service.get_budget_frontier(
        input_dict=input_dict,
        horizon_months=horizon_months
    )

    return {
        "application_id": app_id,
        "applicant_name": f"Customer #{app_obj.user_id}",
        "budget_recourse": result,
        "pareto_budget_frontier": frontier
    }





