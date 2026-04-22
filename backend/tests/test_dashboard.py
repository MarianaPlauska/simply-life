"""
tests/test_dashboard.py — testes de integração para o dashboard /resumo.
cobre: estrutura da resposta, cache, autenticação, isolamento entre usuários.
"""


def test_dashboard_resumo_autenticado(client, auth_headers):
    """GET /dashboard/resumo deve retornar resumo completo."""
    resp = client.get("/dashboard/resumo", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "saudacao_ia" in data
    assert "tarefas_total" in data
    assert "tarefas_pendentes" in data
    assert "tarefas_criticas" in data
    assert "despesas_dia" in data
    assert "despesas_mes" in data
    assert "medicamentos_total" in data
    assert "habitos" in data
    assert "notificacoes_nao_lidas" in data


def test_dashboard_sem_autenticacao(client):
    """GET /dashboard/resumo sem token deve retornar 401."""
    resp = client.get("/dashboard/resumo")
    assert resp.status_code == 401


def test_dashboard_cache_retorna_mesmo_resultado(client, auth_headers):
    """Duas chamadas consecutivas devem retornar o mesmo resultado (cache)."""
    r1 = client.get("/dashboard/resumo", headers=auth_headers)
    r2 = client.get("/dashboard/resumo", headers=auth_headers)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()


def test_saudacao_ia_contem_nome(client, auth_headers):
    """A saudação IA deve conter o nome do usuário."""
    resp = client.get("/dashboard/resumo", headers=auth_headers)
    assert resp.status_code == 200
    saudacao = resp.json()["saudacao_ia"]
    # o conftest registra com nome "Testador"
    assert "Testador" in saudacao or "testador" in saudacao.lower()


def test_dashboard_valores_iniciais_zerados(client, auth_headers):
    """Usuário novo deve ter contadores zerados."""
    resp = client.get("/dashboard/resumo", headers=auth_headers)
    data = resp.json()
    assert data["tarefas_total"] == 0
    assert data["despesas_dia"] == 0
    assert data["medicamentos_total"] == 0


def test_dashboard_isolamento_entre_usuarios(client):
    """Tarefas de um usuário não aparecem no dashboard de outro."""
    # Usuário A
    client.post("/auth/registro", json={
        "email": "dash_a@test.com",
        "senha": "Senha123!",
        "nome_completo": "Dash A",
    })
    r_a = client.post("/auth/login", json={"email": "dash_a@test.com", "senha": "Senha123!"})
    headers_a = {"Authorization": f"Bearer {r_a.json()['access_token']}", "Content-Type": "application/json"}

    # Cria tarefa para A
    client.post("/tarefas", json={
        "titulo": "Tarefa do A",
        "prioridade": "alta",
        "status": "pendente",
    }, headers=headers_a)

    # Usuário B
    client.post("/auth/registro", json={
        "email": "dash_b@test.com",
        "senha": "Senha123!",
        "nome_completo": "Dash B",
    })
    r_b = client.post("/auth/login", json={"email": "dash_b@test.com", "senha": "Senha123!"})
    headers_b = {"Authorization": f"Bearer {r_b.json()['access_token']}", "Content-Type": "application/json"}

    # Dashboard de B deve ter 0 tarefas
    resp = client.get("/dashboard/resumo", headers=headers_b)
    assert resp.status_code == 200
    assert resp.json()["tarefas_total"] == 0
