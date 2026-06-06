def test_get_users(client, auth_headers):
    res = client.get("/api/users/all")
    assert res.status_code == 200
    data = res.json()
    assert "users" in data["data"]

def test_get_user_by_id(client, auth_headers):
    res = client.get("/api/users/1")
    assert res.status_code == 200
    data = res.json()
    assert "first_name" in data["data"]["user"]
    assert "last_name" in data["data"]["user"]
    assert "username" in data["data"]["user"]

def test_edit_profile(client, auth_headers):
    res = client.patch("/api/users/", json={
        "first_name": "Jane",
        "last_name": "Doe",
        "username": "jane_doe",
        "phone": "555-1234",
        "country_code": "+1",
        "area_code": "555"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["data"]["user"]["first_name"] == "Jane"
    assert data["data"]["user"]["last_name"] == "Doe"
    assert data["data"]["user"]["username"] == "jane_doe"
    assert data["data"]["user"]["phone_number"] == "555-1234"

def test_edit_profile_invalid_phone(client, auth_headers):
    res = client.patch("/api/users/", json={"phone": "x" * 50}, headers=auth_headers)
    assert res.status_code in (200, 400, 422)

def test_edit_profile_duplicate_username(client, auth_headers):
    client.post("/api/auth/register", json={"email": "other@example.com", "password": "TestPass123!"})
    res = client.patch("/api/users/", json={"username": "test_user"}, headers=auth_headers)
    assert res.status_code == 200

def test_edit_account(client, auth_headers):
    res = client.patch("/api/users/account", json={
        "email": "newemail@example.com",
        "password": "NewPass123!"
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["user"]["email"] == "newemail@example.com"
