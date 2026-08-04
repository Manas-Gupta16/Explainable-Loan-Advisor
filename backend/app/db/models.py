from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
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

    # Prediction & Risk Results
    approval_probability = Column(Float, nullable=True)
    risk_tier = Column(String, nullable=True)  # LOW_RISK, MEDIUM_RISK, HIGH_RISK
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    recommended_bank = Column(String, nullable=True)
    officer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applicant = relationship("User", back_populates="applications")
    xai_logs = relationship("XAILog", back_populates="application", uselist=False)

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
