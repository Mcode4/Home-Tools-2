def test_register(client):
    res = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "TestPass123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["message"] == "User created"

def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "TestPass123!"
    })
    res = client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "TestPass123!"
    })
    assert res.status_code == 409

def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "TestPass123!"
    })
    res = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "TestPass123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "username" in data["data"]["db_user"]
    assert "first_name" in data["data"]["db_user"]
    assert "last_name" in data["data"]["db_user"]

def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "login2@example.com",
        "password": "TestPass123!"
    })
    res = client.post("/api/auth/login", json={
        "email": "login2@example.com",
        "password": "WrongPass123!"
    })
    assert res.status_code == 401

def test_login_nonexistent_user(client):
    res = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "TestPass123!"
    })
    assert res.status_code == 404

def test_session(client):
    client.post("/api/auth/register", json={
        "email": "session@example.com",
        "password": "TestPass123!"
    })
    login_res = client.post("/api/auth/login", json={
        "email": "session@example.com",
        "password": "TestPass123!"
    })
    token = login_res.json()["data"]["token"]
    res = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "session@example.com"
    assert "username" in data
    assert "first_name" in data
    assert "last_name" in data

def test_logout(client):
    res = client.delete("/api/auth/session")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
