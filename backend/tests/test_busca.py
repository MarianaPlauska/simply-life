"""
testes do endpoint de busca global.
verifica que a busca encontra tarefas e anotações por texto parcial.
"""
import pytest


class TestBuscaGlobal:
    """testa GET /busca?q= em sqlite (fallback LIKE)"""

    def test_busca_sem_query_retorna_vazio(self, client, auth_headers):
        res = client.get("/busca?q=", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 0
        assert data["tarefas"] == []
        assert data["anotacoes"] == []

    def test_busca_encontra_tarefa(self, client, auth_headers):
        # cria uma tarefa
        client.post("/tarefas", headers=auth_headers, json={
            "titulo": "Revisar contrato de pagamento",
            "descricao": "Verificar cláusulas financeiras",
        })
        # busca por termo presente no titulo
        res = client.get("/busca?q=contrato", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        assert any("contrato" in t["titulo"].lower() for t in data["tarefas"])

    def test_busca_encontra_por_descricao(self, client, auth_headers):
        client.post("/tarefas", headers=auth_headers, json={
            "titulo": "Tarefa normal",
            "descricao": "Precisa resolver o problema do orçamento",
        })
        res = client.get("/busca?q=orçamento", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1

    def test_busca_nao_encontra_termo_inexistente(self, client, auth_headers):
        res = client.get("/busca?q=xyzabcdefnaoexiste", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 0

    def test_busca_respeita_limite(self, client, auth_headers):
        # cria varias tarefas com o mesmo termo
        for i in range(5):
            client.post("/tarefas", headers=auth_headers, json={
                "titulo": f"Relatório mensal {i}",
            })
        res = client.get("/busca?q=relatório&limite=2", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data["tarefas"]) <= 2

    def test_busca_sem_autenticacao(self, client):
        res = client.get("/busca?q=teste")
        assert res.status_code in (401, 403)
