from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
import datetime
from backend.app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="CUSTOMER")  # CUSTOMER or BANK_OFFICER
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Baseline Financial & Rural Profile (eliminates repetitive form filling)
    monthly_income = Column(Float, default=35000.0)
    coapplicant_income = Column(Float, default=0.0)
    cibil_score = Column(Integer, default=680)
    existing_debts_monthly = Column(Float, default=5000.0)
    credit_card_utilization = Column(Float, default=0.25)
    credit_history_years = Column(Float, default=4.0)
    delinquent_lines_2yrs = Column(Integer, default=0)
    employment_type = Column(String, default="Farmer / Agriculture")
    agri_land_acres = Column(Float, default=3.0)
    kcc_holder = Column(Boolean, default=False)
    home_ownership = Column(String, default="Owned - Ancestral / Pucca")
    preferred_language = Column(String, default="hi")  # hi, mr, gu, ta, te, bn, en
    phone_number = Column(String, nullable=True)

    applications = relationship("LoanApplication", back_populates="applicant")

class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Financial Inputs
    cibil_score = Column(Integer, nullable=False)
    applicant_income = Column(Float, nullable=False)
    coapplicant_income = Column(Float, default=0.0)
    loan_amount = Column(Float, nullable=False)
    loan_tenure_months = Column(Integer, nullable=False)
    existing_debts = Column(Float, default=0.0)
    credit_card_utilization = Column(Float, default=0.3)
    delinquent_lines_2yrs = Column(Integer, default=0)
    credit_history_years = Column(Float, default=5.0)
    employment_status = Column(String, default="Salaried")
    education = Column(String, default="Graduate")
    home_ownership = Column(String, default="RENT")
    loan_purpose = Column(String, default="Personal")
    repayment_cycle = Column(String, default="MONTHLY_EMI")  # MONTHLY_EMI or HARVEST_BIANNUAL_BULLET


    # Prediction & Risk Results
    approval_probability = Column(Float, nullable=True)
    risk_tier = Column(String, nullable=True)  # LOW_RISK, MEDIUM_RISK, HIGH_RISK
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    recommended_bank = Column(String, nullable=True)
    officer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applicant = relationship("User", back_populates="applications")
    xai_logs = relationship("XAILog", back_populates="application", uselist=False)
    doc_verifications = relationship("DocumentVerification", back_populates="application")
    open_banking_profiles = relationship("OpenBankingProfile", back_populates="application")
    stress_test_logs = relationship("StressTestLog", back_populates="application")

class BankCriteria(Base):
    __tablename__ = "bank_criteria"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String, unique=True, nullable=False)
    min_cibil = Column(Integer, nullable=False)
    max_dti = Column(Float, nullable=False)
    min_income = Column(Float, nullable=False)
    base_interest_rate = Column(Float, nullable=False)
    description = Column(String, nullable=True)

class XAILog(Base):
    __tablename__ = "xai_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    shap_data = Column(Text, nullable=True)  # Serialized JSON
    dice_roadmap = Column(Text, nullable=True)  # Serialized JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("LoanApplication", back_populates="xai_logs")

class DocumentVerification(Base):
    __tablename__ = "document_verifications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    document_type = Column(String, default="PAY_SLIP")  # PAY_SLIP, TAX_FORM_16, BANK_STATEMENT
    file_name = Column(String, nullable=False)
    extracted_monthly_income = Column(Float, nullable=True)
    declared_monthly_income = Column(Float, nullable=False)
    extracted_employer = Column(String, nullable=True)
    extracted_tax_id = Column(String, nullable=True)
    discrepancy_ratio = Column(Float, default=0.0)
    verification_status = Column(String, default="VERIFIED")  # VERIFIED, SUSPECT_MISMATCH, FRAUD_FLAGGED
    fraud_risk_score = Column(Float, default=0.0)  # 0.0 to 1.0
    audit_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("LoanApplication", back_populates="doc_verifications")

class OpenBankingProfile(Base):
    __tablename__ = "open_banking_profiles"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    account_number_mask = Column(String, default="XXXX-XXXX-8921")
    avg_monthly_inflow = Column(Float, nullable=False)
    avg_monthly_outflow = Column(Float, nullable=False)
    monthly_free_cashflow = Column(Float, nullable=False)
    debt_service_coverage_ratio = Column(Float, nullable=False)  # DSCR
    salary_credit_stability_index = Column(Float, default=1.0)  # 0.0 to 1.0
    cashflow_quality_grade = Column(String, default="PRIME")  # PRIME, MODERATE, STRESSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("LoanApplication", back_populates="open_banking_profiles")

class FairnessAuditLog(Base):
    __tablename__ = "fairness_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    audit_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    disparate_impact_ratio = Column(Float, nullable=False)
    demographic_parity_diff = Column(Float, nullable=False)
    equalized_odds_diff = Column(Float, nullable=False)
    four_fifths_rule_compliant = Column(String, default="PASSED")  # PASSED or VIOLATED
    protected_attribute = Column(String, default="gender")
    detailed_metrics_json = Column(Text, nullable=True)

class ModelMonitoringLog(Base):
    __tablename__ = "model_monitoring_logs"

    id = Column(Integer, primary_key=True, index=True)
    batch_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    batch_size = Column(Integer, nullable=False)
    overall_psi = Column(Float, nullable=False)  # Population Stability Index
    drift_status = Column(String, default="HEALTHY")  # HEALTHY, MODERATE_DRIFT, CRITICAL_RETRAIN_REQUIRED
    drift_details_json = Column(Text, nullable=True)

class StressTestLog(Base):
    __tablename__ = "stress_test_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    scenario_name = Column(String, nullable=False)  # RATE_HIKE, INFLATION_SURGE, INCOME_SHOCK, STAGFLATION
    simulated_interest_rate_delta = Column(Float, default=0.0)
    simulated_inflation_cost_delta = Column(Float, default=0.0)
    simulated_income_shock_pct = Column(Float, default=0.0)
    baseline_approval_prob = Column(Float, nullable=False)
    stressed_approval_prob = Column(Float, nullable=False)
    stressed_dti_ratio = Column(Float, nullable=False)
    resilience_grade = Column(String, default="RESILIENT")  # RESILIENT, VULNERABLE, HIGH_DEFAULT_RISK
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("LoanApplication", back_populates="stress_test_logs")
