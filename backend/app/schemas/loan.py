from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: Optional[str] = "CUSTOMER"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Loan Application Schemas ---
class LoanApplicationCreate(BaseModel):
    cibil_score: int = Field(..., ge=300, le=850)
    applicant_income: float = Field(..., gt=0)
    coapplicant_income: float = Field(default=0.0, ge=0)
    loan_amount: float = Field(..., gt=0)
    loan_tenure_months: int = Field(..., gt=0)
    existing_debts: float = Field(default=0.0, ge=0)
    credit_card_utilization: float = Field(default=0.3, ge=0.0, le=1.0)
    delinquent_lines_2yrs: int = Field(default=0, ge=0)
    credit_history_years: float = Field(default=5.0, ge=0)
    employment_status: str = "Salaried"
    education: str = "Graduate"
    home_ownership: str = "RENT"
    loan_purpose: str = "Personal"

class BankRecommendation(BaseModel):
    bank_name: str
    match_score: float
    base_interest_rate: float
    estimated_monthly_emi: float
    status: str
    reason: str

class LoanApplicationResponse(BaseModel):
    id: int
    user_id: int
    cibil_score: int
    applicant_income: float
    coapplicant_income: float
    loan_amount: float
    loan_tenure_months: int
    existing_debts: float
    credit_card_utilization: float
    delinquent_lines_2yrs: int
    credit_history_years: float
    employment_status: str
    education: str
    home_ownership: str
    loan_purpose: str
    approval_probability: Optional[float] = None
    risk_tier: Optional[str] = None
    status: str
    recommended_bank: Optional[str] = None
    officer_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DecisionUpdate(BaseModel):
    status: str  # APPROVED, REJECTED
    officer_notes: Optional[str] = None
