import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Explainable Loan Advisor & Risk System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "SUPER_SECRET_FINTECH_KEY_XAI_2026_IDEA_LAB"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'loan_advisor.db')}"
    
    MODEL_PATH: str = os.path.join(BASE_DIR, "ml_engine", "artifacts", "model.joblib")
    PREPROCESSOR_PATH: str = os.path.join(BASE_DIR, "ml_engine", "artifacts", "preprocessor.joblib")
    CONFORMAL_PATH: str = os.path.join(BASE_DIR, "ml_engine", "artifacts", "conformal.joblib")
    METADATA_PATH: str = os.path.join(BASE_DIR, "ml_engine", "artifacts", "metadata.json")

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
