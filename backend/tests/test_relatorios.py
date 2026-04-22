"""
tests/test_relatorios.py — testes de integração para relatórios de produtividade.
cobre: relatório semanal, mensal, resumo do dashboard, e limites de paginação.
"""


def test_relatorio_semanal_autenticado(client, auth_headers):
    """GET /relatorios/semanal deve retornar relatório com estrutura completa."""
    resp = client.get("/relatorios/semanal", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "periodo_atual" in data
    assert "periodo_anterior" in data
    assert "variacao_pct" in data
    assert "tendencia_tarefas" in data
    assert "tendencia_foco" in data
    assert "tendencia_score" in data
    assert "ranking_dias_semana" in data


def test_relatorio_semanal_sem_autenticacao(client):
    """GET /relatorios/semanal sem token deve retornar 401."""
    resp = client.get("/relatorios/semanal")
    assert resp.status_code == 401


def test_relatorio_mensal_autenticado(client, auth_headers):
    """GET /relatorios/mensal deve retornar relatório com estrutura completa."""
    resp = client.get("/relatorios/mensal", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "periodo_atual" in data
    assert data["periodo_atual"]["periodo_label"] == "Este Mês"


def test_relatorio_mensal_sem_autenticacao(client):
    """GET /relatorios/mensal sem token deve retornar 401."""
    resp = client.get("/relatorios/mensal")
    assert resp.status_code == 401


def test_resumo_relatorio_autenticado(client, auth_headers):
    """GET /relatorios/resumo deve retornar card resumido."""
    resp = client.get("/relatorios/resumo", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "score_semana" in data
    assert "score_mes" in data
    assert "streak_atual" in data
    assert "tendencia_score" in data


def test_resumo_sem_autenticacao(client):
    """GET /relatorios/resumo sem token deve retornar 401."""
    resp = client.get("/relatorios/resumo")
    assert resp.status_code == 401


def test_relatorio_semanal_com_parametro_semanas(client, auth_headers):
    """Parâmetro semanas deve ser respeitado (1-52)."""
    resp = client.get("/relatorios/semanal?semanas=4", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    # tendencia deve ter no máximo 4 pontos
    assert len(data["tendencia_tarefas"]) <= 4


def test_relatorio_semanal_semanas_excede_maximo(client, auth_headers):
    """semanas > 52 deve ser rejeitado (422)."""
    resp = client.get("/relatorios/semanal?semanas=100", headers=auth_headers)
    assert resp.status_code == 422


def test_relatorio_semanal_semanas_zero(client, auth_headers):
    """semanas < 1 deve ser rejeitado (422)."""
    resp = client.get("/relatorios/semanal?semanas=0", headers=auth_headers)
    assert resp.status_code == 422


def test_periodo_atual_campos_obrigatorios(client, auth_headers):
    """Verifica que período_atual contém todos os campos esperados."""
    resp = client.get("/relatorios/semanal", headers=auth_headers)
    assert resp.status_code == 200
    p = resp.json()["periodo_atual"]
    campos_obrigatorios = [
        "periodo_label", "inicio", "fim",
        "tarefas_criadas", "tarefas_concluidas", "tarefas_pendentes",
        "taxa_conclusao_pct", "sessoes_foco", "minutos_foco_total",
        "xp_ganho", "score_eficiencia", "streak_atual",
    ]
    for campo in campos_obrigatorios:
        assert campo in p, f"campo {campo} ausente no periodo_atual"
