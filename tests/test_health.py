def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "AquaVision" in data["service"]

def test_api_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "AquaVision AI"
