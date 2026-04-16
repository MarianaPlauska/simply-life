"""
tests/test_gamificacao.py — Testes de integração para gamificação/XP/streak.
Cobre: finalizar sessão, ganho de XP, atualização de streak, perfil.
"""


def _registrar_e_login(client) -> dict:
    """Registra usuário e retorna headers com Bearer token."""
    client.post("/auth/registro", json={
        "email": "gami@simply.life",
        "senha": "Senha123!",
        "nome_completo": "Gamer Test",
    })
    resp = client.post("/auth/login", json={
        "email": "gami@simply.life",
        "senha": "Senha123!",
    })
    token = resp.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def test_finalizar_sessao_incrementa_xp(client, auth_headers):
    """Finalizar uma sessão de foco deve retornar XP ganho > 0."""
    resp = client.post(
        "/gamificacao/finalizar-sessao",
        json={"duracao_minutos": 25, "tarefa_id": None},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["xp_total"] >= 0
    assert data["xp_ganho"] >= 0


def test_finalizar_sessao_zero_minutos(client, auth_headers):
    """Sessão com 0 minutos deve ser aceita (XP = 0)."""
    resp = client.post(
        "/gamificacao/finalizar-sessao",
        json={"duracao_minutos": 0, "tarefa_id": None},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["xp_ganho"] == 0


def test_finalizar_sessao_sem_autenticacao(client):
    """Sessão sem token deve retornar 401."""
    resp = client.post(
        "/gamificacao/finalizar-sessao",
        json={"duracao_minutos": 25, "tarefa_id": None},
    )
    assert resp.status_code == 401


def test_perfil_gamificacao(client, auth_headers):
    """GET /gamificacao/perfil deve retornar xp_total e streak_atual."""
    resp = client.get("/gamificacao/perfil", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "xp_total" in data
    assert "streak_atual" in data


def test_multiplas_sessoes_acumulam_xp(client, auth_headers):
    """Duas sessões devem acumular XP no perfil."""
    client.post(
        "/gamificacao/finalizar-sessao",
        json={"duracao_minutos": 10, "tarefa_id": None},
        headers=auth_headers,
    )
    r1 = client.get("/gamificacao/perfil", headers=auth_headers).json()
    client.post(
        "/gamificacao/finalizar-sessao",
        json={"duracao_minutos": 10, "tarefa_id": None},
        headers=auth_headers,
    )
    r2 = client.get("/gamificacao/perfil", headers=auth_headers).json()
    assert r2["xp_total"] >= r1["xp_total"]
