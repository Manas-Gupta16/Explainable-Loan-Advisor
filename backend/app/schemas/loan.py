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
    monthly_income: Optional[float] = 35000.0
    agri_land_acres: Optional[float] = 3.0
    kcc_holder: Optional[bool] = False
    preferred_language: Optional[str] = "hi"

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    monthly_income: Optional[float] = Field(default=35000.0, ge=0)
    coapplicant_income: Optional[float] = Field(default=0.0, ge=0)
    cibil_score: Optional[int] = Field(default=680, ge=300, le=850)
    existing_debts_monthly: Optional[float] = Field(default=5000.0, ge=0)
    credit_card_utilization: Optional[float] = Field(default=0.25, ge=0.0, le=1.0)
    credit_history_years: Optional[float] = Field(default=4.0, ge=0.0)
    delinquent_lines_2yrs: Optional[int] = Field(default=0, ge=0)
    employment_type: Optional[str] = "Farmer / Agriculture"
    agri_land_acres: Optional[float] = Field(default=3.0, ge=0)
    kcc_holder: Optional[bool] = False
    home_ownership: Optional[str] = "Owned - Ancestral / Pucca"
    preferred_language: Optional[str] = "hi"
    phone_number: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    monthly_income: float
    coapplicant_income: float
    cibil_score: int
    existing_debts_monthly: float
    credit_card_utilization: float
    credit_history_years: float
    delinquent_lines_2yrs: int
    employment_type: str
    agri_land_acres: float
    kcc_holder: bool
    home_ownership: str
    preferred_language: str
    phone_number: Optional[str] = None

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
    repayment_cycle: Optional[str] = "MONTHLY_EMI"  # MONTHLY_EMI or HARVEST_BIANNUAL_BULLET


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

# --- AI Conversational Coach & Voice Guide Schemas ---
class CoachAdviceRequest(BaseModel):
    application_id: Optional[int] = None
    applicant_name: Optional[str] = "Applicant"
    language: str = "en"  # "en", "hi", "mr", "gu", "bn", "ta", "te", "hinglish"
    loan_input: Optional[LoanApplicationCreate] = None
    shap_data: Optional[Dict[str, Any]] = None
    dice_data: Optional[Dict[str, Any]] = None
    bank_recommendations: Optional[List[Dict[str, Any]]] = None
    approval_probability: Optional[float] = None
    risk_tier: Optional[str] = None
    status: Optional[str] = None

class VoiceGuideScriptRequest(BaseModel):
    applicant_name: Optional[str] = "Valued Borrower"
    language: str = "hi"
    loan_input: Optional[Dict[str, Any]] = None
    application_result: Optional[Dict[str, Any]] = None

class VoiceGuideScriptResponse(BaseModel):
    script: str
    headline: str
    approval_percentage: int
    matched_bank: str
    interest_rate: float
    status: str


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

# --- Conformal Prediction & Epistemic Uncertainty Schemas ---
class CalibratedInterval(BaseModel):
    lower_bound: float
    upper_bound: float
    interval_width: float

class ConformalMetrics(BaseModel):
    p_value_rejected: float
    p_value_approved: float
    confidence: float
    credibility: float
    epistemic_uncertainty_score: float
    ood_z_score_max: float
    is_out_of_distribution: bool

class ConformalTriage(BaseModel):
    category: str  # "CONFIDENT_APPROVAL", "CONFIDENT_REJECTION", "BORDERLINE_UNCERTAIN", "OUT_OF_DISTRIBUTION"
    recommendation: str
    requires_human_override: bool

class ConformalPredictionRequest(BaseModel):
    loan_input: Optional[LoanApplicationCreate] = None
    application_id: Optional[int] = None
    confidence_level: float = Field(default=0.95, ge=0.50, le=0.99)

class ConformalPredictionResponse(BaseModel):
    point_probability: float
    confidence_level: float
    calibrated_interval: CalibratedInterval
    conformal_prediction_set: List[int]
    conformal_set_labels: List[str]
    metrics: ConformalMetrics
    triage: ConformalTriage

# --- Causal Directed Acyclic Graph (DAG) Recourse Schemas ---
class CausalNode(BaseModel):
    id: str
    name: str
    type: str  # "ACTIONABLE_EXOGENOUS", "ENDOGENOUS_IMMEDIATE", "ENDOGENOUS_LAGGED", "TARGET_OUTCOME"
    unit: str

class CausalEdge(BaseModel):
    source: str
    target: str
    mechanism: str
    lag_days: int

class CausalGraph(BaseModel):
    nodes: List[CausalNode]
    edges: List[CausalEdge]

class CausalPhaseImpact(BaseModel):
    credit_utilization: str
    dti_ratio: str
    cibil_score: int

class CausalPhase(BaseModel):
    phase_id: int
    timeline_days: str
    milestone_title: str
    direct_actions: List[str]
    structural_impact: CausalPhaseImpact
    estimated_approval_prob: float
    status_verdict: str

class CausalLever(BaseModel):
    lever_id: str
    name: str
    action: str
    feasibility: str
    marginal_prob_gain: float
    projected_cibil_boost: int
    projected_dti_reduction_pct: float
    resulting_probability: float

class CausalRecourseRequest(BaseModel):
    loan_input: Optional[LoanApplicationCreate] = None
    application_id: Optional[int] = None
    target_probability: float = Field(default=0.75, ge=0.50, le=0.99)
    max_horizon_days: int = Field(default=90, ge=30, le=365)

class CausalRecourseResponse(BaseModel):
    initial_status: str
    baseline_probability: float
    target_probability: float
    final_projected_probability: Optional[float] = None
    total_probability_gain: Optional[float] = None
    projected_cibil_gain: Optional[int] = None
    is_recourse_needed: bool
    horizon_days: Optional[int] = None
    phases: List[CausalPhase]
    causal_levers_ranked: List[CausalLever]
    structural_causal_graph: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None

# --- Budget-Constrained Recourse Optimization (AFRO) Schemas ---
class CashflowProfile(BaseModel):
    gross_monthly_income: float
    net_monthly_income: float
    monthly_debt_service: float
    monthly_living_expenses: float
    monthly_disposable_surplus: float
    safe_monthly_allocation_cap: float

class BudgetConstraints(BaseModel):
    cumulative_budget_cap: float
    monthly_disposable_surplus: float
    monthly_required_allocation: float
    surplus_utilization_pct: float

class OptimizedActions(BaseModel):
    debt_payoff_total: float
    target_debt_balance: float
    loan_downsize_amount: float
    target_loan_amount: float
    tenure_extension_months: int
    target_tenure_months: int

class EndogenousStateTrajectory(BaseModel):
    projected_cibil_score: int
    cibil_gain: int
    projected_dti_ratio: str
    projected_utilization: str

class BudgetFrontierPoint(BaseModel):
    allocation_pct: str
    monthly_commitment: float
    cumulative_cost: float
    achievable_probability: float
    projected_cibil: int
    feasibility_score: float

class BudgetRecourseRequest(BaseModel):
    loan_input: Optional[LoanApplicationCreate] = None
    application_id: Optional[int] = None
    target_probability: float = Field(default=0.75, ge=0.50, le=0.99)
    horizon_months: int = Field(default=6, ge=1, le=24)
    monthly_living_expenses: Optional[float] = Field(default=None, ge=0)
    max_surplus_allocation_pct: float = Field(default=0.60, ge=0.10, le=0.90)

class BudgetRecourseResponse(BaseModel):
    status: str
    baseline_probability: float
    target_probability: float
    optimized_probability: float
    probability_gain: Optional[float] = None
    feasibility_index: float
    horizon_months: int
    budget_constraints: Optional[BudgetConstraints] = None
    optimized_actions: Optional[OptimizedActions] = None
    endogenous_state_trajectory: Optional[EndogenousStateTrajectory] = None
    cashflow_profile: Optional[CashflowProfile] = None
    summary: Optional[str] = None

# --- Account Aggregator & Open Banking Volatility Schemas ---
class TransactionItem(BaseModel):
    date: str
    description: str
    amount: float
    type: str  # "CREDIT" or "DEBIT"
    category: Optional[str] = None
    running_balance: Optional[float] = None

class LiquidityMetrics(BaseModel):
    avg_monthly_inflow: float
    avg_monthly_outflow: float
    net_monthly_cashflow: float
    average_daily_balance: float
    minimum_balance_floor: float

class VolatilityIndices(BaseModel):
    income_volatility_index: float
    nach_mandate_bounce_count: int
    nach_bounce_ratio: float
    cashflow_dscr: float
    discretionary_spend_ratio: float

class SpendingBreakdown(BaseModel):
    total_salary_inflows: float
    total_loan_emi_debits: float
    total_rent_utilities: float
    total_discretionary: float

class AccountAggregatorAnalysisRequest(BaseModel):
    application_id: Optional[int] = None
    account_type: str = "SALARIED_PRIME"  # "SALARIED_PRIME", "GIG_VOLATILE", "BOUNCE_STRESSED"
    monthly_salary: float = Field(default=6500.0, gt=0)
    requested_loan_emi: float = Field(default=650.0, gt=0)
    raw_transactions: Optional[List[TransactionItem]] = None

class AccountAggregatorAnalysisResponse(BaseModel):
    application_id: Optional[int] = None
    account_number_mask: Optional[str] = None
    account_institution: Optional[str] = None
    account_type: Optional[str] = None
    analysis_period_months: float
    total_transactions_analyzed: int
    account_aggregator_score: int  # 300 to 900
    cashflow_quality_tier: str     # "PRIME_CASHFLOW", "STABLE_CASHFLOW", "STRESSED_CASHFLOW"
    cashflow_probability_uplift: float
    liquidity_metrics: LiquidityMetrics
    volatility_indices: VolatilityIndices
    spending_breakdown: SpendingBreakdown
    underwriting_flags: List[str]





