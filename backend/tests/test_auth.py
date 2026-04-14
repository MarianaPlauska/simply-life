"""Testes de autenticação: registro, login, acesso protegido."""


def test_registro_e_login(client):
    # Registro
    resp = client.post("/auth/registro", json={
        "email": "user@test.com",
        "senha": "Abc12345!",
        "nome_completo": "User Test",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data

    # Login
    resp = client.post("/auth/login", json={
        "email": "user@test.com",
        "senha": "Abc12345!",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_senha_errada(client):
    client.post("/auth/registro", json={
        "email": "user2@test.com",
        "senha": "CorrectPw1!",
        "nome_completo": "User 2",
    })
    resp = client.post("/auth/login", json={
        "email": "user2@test.com",
        "senha": "WrongPassword",
    })
    assert resp.status_code in (400, 401)


def test_acesso_sem_token(client):
    resp = client.get("/tarefas")
    assert resp.status_code == 401


def test_acesso_com_token(client, auth_headers):
    resp = client.get("/tarefas", headers=auth_headers)
    assert resp.status_code == 200
    assert "tarefas" in resp.json()
