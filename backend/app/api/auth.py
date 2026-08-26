from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime
import bcrypt
from jose import jwt
from backend.app.db.database import get_db
from backend.app.db.models import User
from backend.app.schemas.loan import UserCreate, UserLogin, UserResponse, Token, UserProfileUpdate, UserProfileResponse
from backend.app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role or "CUSTOMER"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int = 1, db: Session = Depends(get_db)):
    """
    Retrieves the borrower's persistent baseline financial & rural profile.
    Default user_id=1 for seamless 1-click demo access without forced login walls.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Auto-create demo profile if table is fresh
        user = User(
            id=1,
            email="rameshwar.patil@ruralbharat.in",
            full_name="Rameshwar Patil",
            hashed_password=hash_password("DemoPassword123"),
            role="CUSTOMER",
            monthly_income=38000.0,
            cibil_score=695,
            existing_debts_monthly=4500.0,
            employment_type="Farmer / Agriculture",
            agri_land_acres=4.0,
            kcc_holder=True,
            home_ownership="Owned - Ancestral / Pucca",
            preferred_language="hi"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserProfileResponse.model_validate(user)

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(profile_in: UserProfileUpdate, user_id: int = 1, db: Session = Depends(get_db)):
    """
    Updates the borrower's persistent baseline financial & rural profile.
    Eliminates repetitive form filling on loan applications.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, email="borrower@ruralbharat.in", full_name="Rural Borrower", hashed_password=hash_password("Demo123"))
        db.add(user)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if hasattr(user, field) and val is not None:
            setattr(user, field, val)

    db.commit()
    db.refresh(user)
    return UserProfileResponse.model_validate(user)

