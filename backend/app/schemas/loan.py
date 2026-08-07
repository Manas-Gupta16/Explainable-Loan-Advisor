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

# --- AI Conversational Coach Schemas ---
class CoachAdviceRequest(BaseModel):
    application_id: Optional[int] = None
    applicant_name: Optional[str] = "Applicant"
    language: str = "en"  # "en", "es", "hi"
    loan_input: Optional[LoanApplicationCreate] = None
    shap_data: Optional[Dict[str, Any]] = None
    dice_data: Optional[Dict[str, Any]] = None

class ActionMilestone(BaseModel):
    phase: str  # "30_DAYS", "90_DAYS", "180_DAYS"
    target_metric: str
    current_value: Any
    recommended_value: Any
    action_instruction: str
    impact_boost: str

class CoachAdviceResponse(BaseModel):
    applicant_name: str
    executive_summary: str
    verdict_tone: str  # "ENCOURAGING_POSITIVE", "NEEDS_OPTIMIZATION", "RECOVERY_PLAN"
    primary_approval_odds: str
    key_strengths: List[str]
    key_vulnerabilities: List[str]
    actionable_milestones: List[ActionMilestone]
    conversational_audio_script: str

# --- OCR Document Verification Schemas ---
class DocumentVerificationCreate(BaseModel):
    application_id: int
    document_type: str = "PAY_SLIP"
    declared_monthly_income: float
    file_name: str
    raw_text_content: Optional[str] = None

class DocumentVerificationResponse(BaseModel):
    id: int
    application_id: int
    document_type: str
    file_name: str
    extracted_monthly_income: Optional[float]
    declared_monthly_income: float
    extracted_employer: Optional[str]
    extracted_tax_id: Optional[str]
    discrepancy_ratio: float
    discrepancy_percentage: str
    verification_status: str  # VERIFIED, SUSPECT_MISMATCH, FRAUD_FLAGGED
    fraud_risk_score: float
    audit_notes: str

    model_config = ConfigDict(from_attributes=True)

# --- Open Banking Schemas ---
class OpenBankingConnectRequest(BaseModel):
    application_id: int
    institution_id: str = "ins_mock_chase"
    account_type: str = "CHECKING_SAVINGS"
    monthly_net_salary: Optional[float] = None
    existing_monthly_emi: Optional[float] = None

class OpenBankingAnalysisResponse(BaseModel):
    application_id: int
    account_number_mask: str
    avg_monthly_inflow: float
    avg_monthly_outflow: float
    monthly_free_cashflow: float
    debt_service_coverage_ratio: float
    salary_credit_stability_index: float
    cashflow_quality_grade: str  # PRIME, MODERATE, STRESSED
    cashflow_risk_adjustment: float  # e.g., +0.08 or -0.12
    summary_insight: str

# --- Demographic Fairness Schemas ---
class FairnessGroupMetric(BaseModel):
    group_name: str
    total_applicants: int
    approval_count: int
    approval_rate: float
    true_positive_rate: float
    false_positive_rate: float

class FairnessAuditResponse(BaseModel):
    audit_timestamp: str
    protected_attribute: str
    privileged_group: str
    unprivileged_group: str
    disparate_impact_ratio: float
    demographic_parity_diff: float
    equalized_odds_diff: float
    four_fifths_rule_status: str  # "COMPLIANT (PASSED)", "POTENTIAL_BIAS_FLAGGED (FAILED)"
    regulatory_summary: str
    group_metrics: List[FairnessGroupMetric]

# --- Model Monitoring & Drift Schemas ---
class FeatureDriftMetric(BaseModel):
    feature_name: str
    training_mean: float
    inference_mean: float
    drift_score_psi: float
    status: str  # "STABLE", "MODERATE_DRIFT", "SEVERE_DRIFT"

class ModelDriftResponse(BaseModel):
    batch_timestamp: str
    total_inferences_analyzed: int
    overall_model_psi: float
    model_health_status: str  # "HEALTHY", "MODERATE_DRIFT", "CRITICAL_RETRAIN_REQUIRED"
    retrain_recommended: bool
    feature_drift_breakdown: List[FeatureDriftMetric]

class RetrainResponse(BaseModel):
    status: str
    message: str
    new_model_auc: float
    timestamp: str

# --- Macroeconomic Stress Test Schemas ---
class StressTestRequest(BaseModel):
    application_id: Optional[int] = None
    scenario: str = "COMBINED_STAGFLATION"  # "RATE_HIKE", "INFLATION_SURGE", "INCOME_SHOCK", "COMBINED_STAGFLATION"
    interest_rate_delta_pct: float = Field(default=2.0, ge=0.0, le=10.0)  # e.g. +2.0%
    inflation_cost_delta_pct: float = Field(default=8.0, ge=0.0, le=30.0) # e.g. +8.0%
    income_shock_pct: float = Field(default=15.0, ge=0.0, le=50.0)        # e.g. -15.0%
    loan_input: Optional[LoanApplicationCreate] = None

class StressTestResponse(BaseModel):
    scenario_name: str
    baseline_approval_probability: float
    stressed_approval_probability: float
    probability_drop_pct: float
    baseline_dti: float
    stressed_dti: float
    monthly_debt_burden_increase: float
    resilience_grade: str  # "HIGHLY_RESILIENT", "MODERATELY_VULNERABLE", "HIGH_DEFAULT_RISK"
    stress_verdict_notes: str

