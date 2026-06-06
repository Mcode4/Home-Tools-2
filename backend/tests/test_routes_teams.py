def test_create_team(client, auth_headers):
    res = client.post("/api/teams/", json={"name": "Test Team"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["team"]["name"] == "Test Team"

def test_create_team_default_name(client, auth_headers):
    res = client.post("/api/teams/", json={}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    # Default name uses current_user's first_name
    assert "Test's Team" in data["data"]["team"]["name"]

def test_get_team_members(client, auth_headers):
    team_res = client.post("/api/teams/", json={"name": "My Team"}, headers=auth_headers)
    team_id = team_res.json()["data"]["team"]["id"]
    res = client.get(f"/api/teams/{team_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "members" in data["data"]
