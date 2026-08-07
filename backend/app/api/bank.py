from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

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

