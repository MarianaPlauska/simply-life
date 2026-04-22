"""
tests/test_bem_estar.py — testes de integração para o módulo de bem-estar mental.
cobre: humor (crud + upsert), journaling (crud), weekly review, correlação.
"""


# ── humor ─────────────────────────────────────────────────────

def test_registrar_humor(client, auth_headers):
    """POST /bem-estar/humor deve criar registro de humor."""
    resp = client.post(
        "/bem-estar/humor",
        json={"humor": 4, "emoji": "😊", "nota": "dia bom"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["humor"] == 4
    assert data["emoji"] == "😊"


def test_registrar_humor_upsert(client, auth_headers):
    """Dois POSTs no mesmo dia devem fazer upsert (não duplicar)."""
    client.post(
        "/bem-estar/humor",
        json={"humor": 3, "emoji": "😐"},
        headers=auth_headers,
    )
    resp = client.post(
        "/bem-estar/humor",
        json={"humor": 5, "emoji": "🤩"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["humor"] == 5


def test_humor_invalido(client, auth_headers):
    """Humor fora de 1-5 deve retornar 400."""
    resp = client.post(
        "/bem-estar/humor",
        json={"humor": 6, "emoji": "💀"},
        headers=auth_headers,
    )
    assert resp.status_code == 400


def test_humor_hoje(client, auth_headers):
    """GET /bem-estar/humor/hoje deve retornar o registro de hoje ou null."""
    resp = client.get("/bem-estar/humor/hoje", headers=auth_headers)
    assert resp.status_code == 200


def test_humor_semana(client, auth_headers):
    """GET /bem-estar/humor/semana deve retornar lista dos últimos 7 dias."""
    resp = client.get("/bem-estar/humor/semana", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_humor_historico(client, auth_headers):
    """GET /bem-estar/humor/historico deve retornar lista."""
    resp = client.get("/bem-estar/humor/historico?dias=30", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_humor_sem_autenticacao(client):
    """POST /bem-estar/humor sem token deve retornar 401."""
    resp = client.post("/bem-estar/humor", json={"humor": 3})
    assert resp.status_code == 401


# ── journaling ────────────────────────────────────────────────

def test_criar_entrada_diario(client, auth_headers):
    """POST /bem-estar/diario deve criar uma entrada."""
    resp = client.post(
        "/bem-estar/diario",
        json={"conteudo": "reflexão do dia", "prompt_usado": "O que te fez sorrir hoje?"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["conteudo"] == "reflexão do dia"


def test_listar_entradas(client, auth_headers):
    """GET /bem-estar/diario deve retornar lista de entradas."""
    # cria uma entrada primeiro
    client.post(
        "/bem-estar/diario",
        json={"conteudo": "teste listar"},
        headers=auth_headers,
    )
    resp = client.get("/bem-estar/diario?dias=7", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_diario_hoje(client, auth_headers):
    """GET /bem-estar/diario/hoje deve retornar a última entrada de hoje."""
    client.post(
        "/bem-estar/diario",
        json={"conteudo": "entrada de hoje"},
        headers=auth_headers,
    )
    resp = client.get("/bem-estar/diario/hoje", headers=auth_headers)
    assert resp.status_code == 200


def test_deletar_entrada(client, auth_headers):
    """DELETE /bem-estar/diario/{id} deve remover a entrada."""
    create = client.post(
        "/bem-estar/diario",
        json={"conteudo": "temporária"},
        headers=auth_headers,
    )
    entrada_id = create.json()["id"]
    resp = client.delete(f"/bem-estar/diario/{entrada_id}", headers=auth_headers)
    assert resp.status_code == 204


def test_deletar_entrada_inexistente(client, auth_headers):
    """DELETE de entrada que não existe deve retornar 404."""
    resp = client.delete("/bem-estar/diario/999999", headers=auth_headers)
    assert resp.status_code == 404


def test_prompt_do_dia(client, auth_headers):
    """GET /bem-estar/prompt-do-dia deve retornar um prompt."""
    resp = client.get("/bem-estar/prompt-do-dia", headers=auth_headers)
    assert resp.status_code == 200
    assert "prompt" in resp.json()
    assert len(resp.json()["prompt"]) > 0


# ── weekly review ─────────────────────────────────────────────

def test_weekly_review(client, auth_headers):
    """GET /bem-estar/weekly-review deve retornar review com insight IA."""
    resp = client.get("/bem-estar/weekly-review", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "semana" in data
    assert "humor_medio" in data
    assert "tarefas_concluidas" in data
    assert "insight_ia" in data


# ── correlação ────────────────────────────────────────────────

def test_correlacao_humor_habitos(client, auth_headers):
    """GET /bem-estar/correlacao deve retornar dados de correlação."""
    resp = client.get("/bem-estar/correlacao", headers=auth_headers)
    assert resp.status_code == 200
