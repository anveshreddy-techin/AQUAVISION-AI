"""Authentication endpoints: login, register, profile, token refresh."""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models.users import User
from database.models.reports import AuditLog
from services.api.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from services.api.dependencies import get_current_user, require_admin
from services.api.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Audit log
    audit = AuditLog(user_id=user.id, action="LOGIN", entity_type="user", entity_id=str(user.id))
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse)
def register(request: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Register a new user (admin only)."""
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role=request.role,
        organization=request.organization,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    audit = AuditLog(user_id=admin.id, action="CREATE_USER", entity_type="user", entity_id=str(user.id),
                     details_json=json.dumps({"email": user.email, "role": user.role}))
    db.add(audit)
    db.commit()

    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_tok: str, db: Session = Depends(get_db)):
    """Refresh an access token using a refresh token."""
    payload = decode_token(refresh_tok)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )
