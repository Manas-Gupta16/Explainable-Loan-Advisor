import json
import datetime
from sqlalchemy.orm import Session
from backend.app.db.database import engine, SessionLocal, Base
from backend.app.db.models import User, LoanApplication, XAILog, BankCriteria
from backend.app.services.ml_service import ml_service
from backend.app.services.bank_service import evaluate_bank_recommendations, INDIAN_BANKS_CONFIG

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding Indian Banking Data into SQLite Database...")

    # 1. Seed Users (Applicants & Bank Officers)
    users_data = [
        {"email": "officer@sbi.co.in", "full_name": "Chief Credit Officer (SBI)", "hashed_password": "hashed_secret_123", "role": "BANK_OFFICER"},
        {"email": "underwriter@hdfcbank.com", "full_name": "Senior Underwriter (HDFC)", "hashed_password": "hashed_secret_123", "role": "BANK_OFFICER"},
        {"email": "rajesh.sharma@gmail.com", "full_name": "Rajesh Sharma", "hashed_password": "hashed_secret_123", "role": "CUSTOMER"},
        {"email": "priya.patel@techcorp.in", "full_name": "Priya Patel", "hashed_password": "hashed_secret_123", "role": "CUSTOMER"},
        {"email": "vikram.singh@delhi-retail.com", "full_name": "Vikram Singh", "hashed_password": "hashed_secret_123", "role": "CUSTOMER"},
        {"email": "ananya.iyer@fintech.co", "full_name": "Ananya Iyer", "hashed_password": "hashed_secret_123", "role": "CUSTOMER"},
        {"email": "rahul.verma@bangalore.org", "full_name": "Rahul Verma", "hashed_password": "hashed_secret_123", "role": "CUSTOMER"},
        {"email": "sneha.kulkarni@mumbai.in", "full_name": "Sneha Kulkarni", "hashed_password": "hashed_secret_123", "role": "CUSTOMER"}
    ]

    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user_obj = User(**u)
            db.add(user_obj)
    db.commit()

    # 2. Seed Bank Criteria
    for b in INDIAN_BANKS_CONFIG:
        existing_bank = db.query(BankCriteria).filter(BankCriteria.bank_name == b["bank_name"]).first()
        if not existing_bank:
            bc = BankCriteria(
                bank_name=b["bank_name"],
                min_cibil=b["min_cibil"],
                max_dti=b["max_foir"],
                min_income=b["min_monthly_income"] * 12,
                base_interest_rate=b["base_interest_rate"],
                description=b["description"]
            )
            db.add(bc)
    db.commit()

    # 3. Seed Realistic Indian Loan Applications
    sample_applications = [
        {
            "user_id": 3,
            "cibil_score": 790,
            "applicant_income": 1500000.0, # ₹1.25 Lakhs/mo
            "coapplicant_income": 360000.0, # ₹30k/mo
            "loan_amount": 1200000.0, # ₹12 Lakhs
            "loan_tenure_months": 48,
            "existing_debts": 180000.0, # ₹15k/mo EMI
            "credit_card_utilization": 0.18,
            "delinquent_lines_2yrs": 0,
            "credit_history_years": 8.5,
            "employment_status": "Salaried",
            "education": "Post Graduate",
            "home_ownership": "OWN",
            "loan_purpose": "Personal",
            "officer_notes": "Prismatic prime salaried profile. Verified with TCS EPFO salary slip and Sahamati AA. Recommended for instant straight-through processing."
        },
        {
            "user_id": 4,
            "cibil_score": 725,
            "applicant_income": 960000.0, # ₹80k/mo
            "coapplicant_income": 0.0,
            "loan_amount": 650000.0, # ₹6.5 Lakhs
            "loan_tenure_months": 36,
            "existing_debts": 144000.0, # ₹12k/mo EMI
            "credit_card_utilization": 0.28,
            "delinquent_lines_2yrs": 0,
            "credit_history_years": 5.0,
            "employment_status": "Salaried",
            "education": "Graduate",
            "home_ownership": "RENT",
            "loan_purpose": "Personal",
            "officer_notes": "Solid IT sector profile. FOIR is 32% (well within HDFC Bank 55% cap). Verified Form 16."
        },
        {
            "user_id": 5,
            "cibil_score": 670,
            "applicant_income": 720000.0, # ₹60k/mo
            "coapplicant_income": 0.0,
            "loan_amount": 800000.0, # ₹8 Lakhs
            "loan_tenure_months": 48,
            "existing_debts": 216000.0, # ₹18k/mo EMI
            "credit_card_utilization": 0.42,
            "delinquent_lines_2yrs": 0,
            "credit_history_years": 4.0,
            "employment_status": "Self-Employed",
            "education": "Graduate",
            "home_ownership": "RENT",
            "loan_purpose": "Business",
            "officer_notes": "MSME retail trader with moderate debt obligations. FOIR is 58%. Recommended for Bajaj Finserv / Axis Bank tier."
        },
        {
            "user_id": 6,
            "cibil_score": 760,
            "applicant_income": 1800000.0, # ₹1.5 Lakhs/mo
            "coapplicant_income": 600000.0, # ₹50k/mo
            "loan_amount": 6500000.0, # ₹65 Lakhs Home Loan
            "loan_tenure_months": 240,
            "existing_debts": 240000.0, # ₹20k/mo EMI
            "credit_card_utilization": 0.15,
            "delinquent_lines_2yrs": 0,
            "credit_history_years": 10.0,
            "employment_status": "Salaried",
            "education": "Post Graduate",
            "home_ownership": "OWN",
            "loan_purpose": "Home",
            "officer_notes": "Excellent SBI Home Loan applicant. FOIR is 38% for ₹65 Lakh housing loan. 100% on-time repayment history."
        },
        {
            "user_id": 7,
            "cibil_score": 580,
            "applicant_income": 420000.0, # ₹35k/mo
            "coapplicant_income": 0.0,
            "loan_amount": 1200000.0, # ₹12 Lakhs
            "loan_tenure_months": 36,
            "existing_debts": 240000.0, # ₹20k/mo EMI
            "credit_card_utilization": 0.82,
            "delinquent_lines_2yrs": 2,
            "credit_history_years": 2.5,
            "employment_status": "Salaried",
            "education": "Undergraduate",
            "home_ownership": "RENT",
            "loan_purpose": "Personal",
            "officer_notes": "Overleveraged profile with high FOIR (78%) and past delinquencies. Rejection mandatory under RBI DBR guidelines. DiCE recourse roadmap provided."
        }
    ]

    # Clear old dummy applications if any to refresh with clean Indian applications
    db.query(XAILog).delete()
    db.query(LoanApplication).delete()
    db.commit()

    for app_data in sample_applications:
        notes = app_data.pop("officer_notes", None)
        prob, risk_tier, status = ml_service.predict_risk(app_data)
        bank_recs = evaluate_bank_recommendations(app_data, prob)
        top_bank = bank_recs[0].bank_name if bank_recs else "State Bank of India (SBI)"

        db_app = LoanApplication(
            **app_data,
            approval_probability=prob,
            risk_tier=risk_tier,
            status=status,
            recommended_bank=top_bank,
            officer_notes=notes,
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(db_app)
        db.commit()
        db.refresh(db_app)

        # Generate SHAP & DiCE
        shap_data = ml_service.get_shap_explanation(app_data)
        dice_data = ml_service.get_dice_roadmap(app_data)

        xai_log = XAILog(
            application_id=db_app.id,
            shap_data=json.dumps(shap_data),
            dice_roadmap=json.dumps(dice_data),
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(xai_log)
        db.commit()

    print(f"Successfully seeded {len(sample_applications)} realistic Indian loan applications!")
    db.close()

if __name__ == '__main__':
    seed_database()
