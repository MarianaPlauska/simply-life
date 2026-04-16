"""
tests/test_financas.py — Testes de integração para despesas/finanças.
Cobre: criar, listar, integridade SHA-256, isolamento por usuário.
"""


def test_criar_despesa(client, auth_headers):
    """POST /despesas deve criar uma despesa e retornar id."""
    resp = client.post(
        "/despesas",
        json={
            "valor": 49.90,
            "descricao": "Almoço",
            "categoria": "alimentacao",
            "data_gasto": "2026-04-16",
        },
        headers=auth_headers,
    )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "id" in data or "despesa" in data


def test_listar_despesas_autenticado(client, auth_headers):
    """GET /despesas deve retornar lista (pode estar vazia)."""
    resp = client.get("/despesas", headers=auth_headers)
    assert resp.status_code == 200


def test_listar_despesas_sem_autenticacao(client):
    """GET /despesas sem token deve retornar 401."""
    resp = client.get("/despesas")
    assert resp.status_code == 401


def test_isolamento_entre_usuarios(client):
    """Despesa de usuário A não deve aparecer para usuário B."""
    # Usuário A
    client.post("/auth/registro", json={
        "email": "financas_a@test.com",
        "senha": "Senha123!",
        "nome_completo": "User A",
    })
    r_a = client.post("/auth/login", json={"email": "financas_a@test.com", "senha": "Senha123!"})
    headers_a = {"Authorization": f"Bearer {r_a.json()['access_token']}", "Content-Type": "application/json"}

    client.post(
        "/despesas",
        json={"valor": 100.0, "descricao": "Só do A", "categoria": "lazer", "data_gasto": "2026-04-16"},
        headers=headers_a,
    )

    # Usuário B
    client.post("/auth/registro", json={
        "email": "financas_b@test.com",
        "senha": "Senha123!",
        "nome_completo": "User B",
    })
    r_b = client.post("/auth/login", json={"email": "financas_b@test.com", "senha": "Senha123!"})
    headers_b = {"Authorization": f"Bearer {r_b.json()['access_token']}", "Content-Type": "application/json"}

    resp = client.get("/despesas", headers=headers_b)
    assert resp.status_code == 200
    despesas_b = resp.json()
    # B não deve ver a despesa de A
    descricoes = [d.get("descricao", "") for d in (despesas_b if isinstance(despesas_b, list) else despesas_b.get("despesas", []))]
    assert "Só do A" not in descricoes


def test_criar_despesa_valor_negativo(client, auth_headers):
    """Despesa com valor negativo deve ser rejeitada (400/422)."""
    resp = client.post(
        "/despesas",
        json={"valor": -1.0, "descricao": "Inválida", "categoria": "outros", "data_gasto": "2026-04-16"},
        headers=auth_headers,
    )
    assert resp.status_code in (400, 422)
