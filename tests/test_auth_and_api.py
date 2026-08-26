import pytest
from database.models.users import User, Role
from database.models.surveys import Survey
from services.api.security import hash_password, create_access_token

def test_user_creation_and_auth(client, db_session):
    # Create user
    user = User(
        email="testadmin@aquavision.ai",
        full_name="Test Admin",
        password_hash=hash_password("TestPass123!"),
        role="admin",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    # Login via API
    response = client.post("/api/v1/auth/login", json={
        "email": "testadmin@aquavision.ai",
        "password": "TestPass123!"
    })
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    
    # Fetch /me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "testadmin@aquavision.ai"

def test_survey_endpoints(client, db_session):
    # Create user first for operator_id
    user = User(
        email="survey_op@aquavision.ai",
        full_name="Survey Operator",
        password_hash=hash_password("TestPass123!"),
        role="researcher",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Create test survey directly
    survey = Survey(
        name="Test Survey",
        description="Testing API",
        operator_id=user.id,
        status="CREATED",
        frequency="450kHz"
    )
    db_session.add(survey)
    db_session.commit()
    
    # Generate token
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}
    
    # List surveys
    response = client.get("/api/v1/surveys", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["surveys"][0]["name"] == "Test Survey"
