from datetime import datetime, timedelta, timezone


def test_create_user_session_and_interruption(client):
    """
    Flujo básico de la API:
    - Crea un usuario
    - Crea una sesión de trabajo
    - Registra una interrupción y comprueba que duration se calcula bien
    """
    # 1) Crear usuario
    resp_user = client.post(
        "/users/",
        json={"name": "Victor", "email": "victor@example.com"},
    )
    assert resp_user.status_code == 201
    user_data = resp_user.json()
    user_id = user_data["id"]

    # 2) Crear sesión
    resp_session = client.post(
        "/sessions/start",
        json={"user_id": user_id},
    )
    assert resp_session.status_code == 201
    session_data = resp_session.json()
    session_id = session_data["id"]
    assert session_data["end_time"] is None

    # 3) Crear interrupción dentro de esa sesión
    start = datetime.now(timezone.utc) - timedelta(minutes=5)
    end = datetime.now(timezone.utc)

    resp_interruption = client.post(
        "/interruptions/",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "type": "phone",
            "description": "WhatsApp messages",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )

    assert resp_interruption.status_code == 201
    interruption_data = resp_interruption.json()
    assert interruption_data["session_id"] == session_id
    assert interruption_data["user_id"] == user_id
    # duración aprox 300s (5 minutos), dejamos margen
    assert 200 <= interruption_data["duration"] <= 400


def test_interruption_rejects_wrong_user(client):
    """
    Comprueba que la API no permite registrar una interrupción
    si el user_id no coincide con el propietario de la sesión.
    """
    # Crear usuario real
    resp_user = client.post(
        "/users/",
        json={"name": "User1", "email": "user1@example.com"},
    )
    assert resp_user.status_code == 201
    user_id = resp_user.json()["id"]

    # Crear sesión para ese usuario
    resp_session = client.post(
        "/sessions/start",
        json={"user_id": user_id},
    )
    assert resp_session.status_code == 201
    session_id = resp_session.json()["id"]

    # Intentar crear interrupción con otro user_id
    start = datetime.now(timezone.utc) - timedelta(minutes=2)
    end = datetime.now(timezone.utc)

    resp_interruption = client.post(
        "/interruptions/",
        json={
            "session_id": session_id,
            "user_id": user_id + 999,  # usuario incorrecto
            "type": "noise",
            "description": "Noise test",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )

    assert resp_interruption.status_code == 400
    assert resp_interruption.json()["detail"] == "Interruption user_id does not match session user_id"
