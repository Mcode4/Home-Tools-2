def test_get_settings(client, auth_headers):
    res = client.get("/api/settings/", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

def test_update_settings(client, auth_headers):
    res = client.put("/api/settings/", json={
        "theme": "light",
        "map_layer": "satellite-layer"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["data"]["settings"]["theme"] == "light"
    assert data["data"]["settings"]["map_layer"] == "satellite-layer"

def test_get_saved_types(client, auth_headers):
    res = client.get("/api/types", headers=auth_headers)
    assert res.status_code == 200

def test_create_saved_type(client, auth_headers):
    res = client.post("/api/types", json={
        "name": "Pizza",
        "type": "🍕"
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["type"]["name"] == "Pizza"

def test_delete_saved_type(client, auth_headers):
    create_res = client.post("/api/types", json={"name": "Delete", "type": "❌"}, headers=auth_headers)
    type_id = create_res.json()["data"]["type"]["id"]
    res = client.delete(f"/api/types/{type_id}", headers=auth_headers)
    assert res.status_code == 200

def test_get_groups(client, auth_headers):
    res = client.get("/api/groups", headers=auth_headers)
    assert res.status_code == 200

def test_create_group(client, auth_headers):
    res = client.post("/api/groups", json={
        "name": "Downtown Properties",
        "type": "location",
        "pinned": True
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["group"]["name"] == "Downtown Properties"

def test_edit_group(client, auth_headers):
    create_res = client.post("/api/groups", json={"name": "Old Name", "type": "location"}, headers=auth_headers)
    group_id = create_res.json()["data"]["group"]["id"]
    res = client.patch(f"/api/groups/{group_id}", json={"name": "New Name", "type": "location"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["group"]["name"] == "New Name"

def test_delete_group(client, auth_headers):
    create_res = client.post("/api/groups", json={"name": "Delete", "type": "location"}, headers=auth_headers)
    group_id = create_res.json()["data"]["group"]["id"]
    res = client.delete(f"/api/groups/{group_id}", headers=auth_headers)
    assert res.status_code == 200

def test_get_notifications(client, auth_headers):
    res = client.get("/api/notifications", headers=auth_headers)
    assert res.status_code == 200

def test_create_notification(client, auth_headers):
    res = client.post("/api/notifications", json={
        "sender_id": 1,
        "recipient_id": 1,
        "title": "Test Notification",
        "message": "This is a test"
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["notification"]["title"] == "Test Notification"

def test_mark_notification_read(client, auth_headers):
    create_res = client.post("/api/notifications", json={
        "sender_id": 1, "recipient_id": 1,
        "title": "Read Me", "message": "Please"
    }, headers=auth_headers)
    notif_id = create_res.json()["data"]["notification"]["id"]
    res = client.patch(f"/api/notifications/{notif_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]["notification"]
    assert str(data.get("read")) in ("1", "True")

def test_delete_notification(client, auth_headers):
    create_res = client.post("/api/notifications", json={
        "sender_id": 1, "recipient_id": 1,
        "title": "Delete", "message": "Me"
    }, headers=auth_headers)
    notif_id = create_res.json()["data"]["notification"]["id"]
    res = client.delete(f"/api/notifications/{notif_id}", headers=auth_headers)
    assert res.status_code == 200
