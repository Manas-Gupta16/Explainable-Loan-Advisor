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
    return [LoanApplicationResponse.from_orm(app) for app in applications]

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
        "application": LoanApplicationResponse.from_orm(app_obj)
    }
