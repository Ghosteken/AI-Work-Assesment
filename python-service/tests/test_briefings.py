import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import get_db
from app.db.base import Base

# Setup a test database (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_create_briefing_success():
    payload = {
        "companyName": "Test Company",
        "ticker": "tst",
        "sector": "Tech",
        "analystName": "John Doe",
        "summary": "Summary content.",
        "recommendation": "Buy",
        "keyPoints": ["Point 1", "Point 2"],
        "risks": ["Risk 1"],
        "metrics": [{"name": "Revenue", "value": "100M"}]
    }
    response = client.post("/briefings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["companyName"] == "Test Company"
    assert data["ticker"] == "TST"  # Normalized
    assert len(data["keyPoints"]) == 2
    assert len(data["risks"]) == 1
    assert len(data["metrics"]) == 1

def test_create_briefing_validation_failure():
    # Missing fields
    response = client.post("/briefings", json={})
    assert response.status_code == 422

    # Too few key points
    payload = {
        "companyName": "Test",
        "ticker": "TST",
        "summary": "S",
        "recommendation": "R",
        "keyPoints": ["Only one"],
        "risks": ["Risk 1"]
    }
    response = client.post("/briefings", json=payload)
    assert response.status_code == 422
    # Check if the error message is present in any of the detail items
    errors = response.json().get("detail", [])
    assert any("At least 2 key points are required" in err.get("msg", "") for err in errors)

    # Duplicate metrics
    payload["keyPoints"].append("Point 2")
    payload["metrics"] = [
        {"name": "M1", "value": "V1"},
        {"name": "M1", "value": "V2"}
    ]
    response = client.post("/briefings", json=payload)
    assert response.status_code == 422
    errors = response.json().get("detail", [])
    assert any("Metric names must be unique" in err.get("msg", "") for err in errors)

def test_generate_and_get_html():
    # 1. Create
    payload = {
        "companyName": "HTML Test",
        "ticker": "HTML",
        "summary": "S",
        "recommendation": "R",
        "keyPoints": ["P1", "P2"],
        "risks": ["R1"]
    }
    create_resp = client.post("/briefings", json=payload)
    briefing_id = create_resp.json()["id"]

    # 2. Try to get HTML before generating
    html_resp = client.get(f"/briefings/{briefing_id}/html")
    assert html_resp.status_code == 404

    # 3. Generate
    gen_resp = client.post(f"/briefings/{briefing_id}/generate")
    assert gen_resp.status_code == 200
    assert "text/html" in gen_resp.headers["content-type"]
    assert "HTML Test" in gen_resp.text

    # 4. Get HTML
    html_resp = client.get(f"/briefings/{briefing_id}/html")
    assert html_resp.status_code == 200
    assert "HTML Test" in html_resp.text
