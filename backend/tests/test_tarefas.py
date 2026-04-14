"""
test_tarefas.py — Testes de integração para o CRUD de tarefas, labels e subtarefas.
"""
import pytest


class TestTarefasCRUD:
    """Testes do CRUD básico de tarefas."""

    def test_criar_tarefa(self, client, auth_headers):
        res = client.post("/tarefas", json={
            "titulo": "Estudar Python",
            "descricao": "Cap. 5 ao 8",
            "prioridade": "alta",
        }, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["tarefa"]["titulo"] == "Estudar Python"
        assert data["tarefa"]["prioridade"] == "alta"
        assert data["tarefa"]["status"] == "pendente"
        # Sprint 1: deve ter subtarefas e labels vazios
        assert data["tarefa"]["subtarefas"] == []
        assert data["tarefa"]["labels"] == []

    def test_listar_tarefas(self, client, auth_headers):
        client.post("/tarefas", json={"titulo": "Tarefa 1"}, headers=auth_headers)
        client.post("/tarefas", json={"titulo": "Tarefa 2"}, headers=auth_headers)
        res = client.get("/tarefas", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 2

    def test_atualizar_tarefa_parcial(self, client, auth_headers):
        r = client.post("/tarefas", json={"titulo": "Inicial"}, headers=auth_headers)
        tarefa_id = r.json()["tarefa"]["id"]
        res = client.patch(f"/tarefas/{tarefa_id}", json={"titulo": "Alterado"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["tarefa"]["titulo"] == "Alterado"

    def test_deletar_tarefa(self, client, auth_headers):
        r = client.post("/tarefas", json={"titulo": "Para deletar"}, headers=auth_headers)
        tarefa_id = r.json()["tarefa"]["id"]
        res = client.delete(f"/tarefas/{tarefa_id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "sucesso"
        # Confirma que não existe mais
        res2 = client.get("/tarefas", headers=auth_headers)
        assert res2.json()["total"] == 0

    def test_buscar_tarefas(self, client, auth_headers):
        client.post("/tarefas", json={"titulo": "Relatório urgente"}, headers=auth_headers)
        client.post("/tarefas", json={"titulo": "Almoço"}, headers=auth_headers)
        res = client.get("/tarefas/busca?q=urgente", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["total"] == 1

    def test_validacao_status_invalido(self, client, auth_headers):
        res = client.post("/tarefas", json={"titulo": "X", "status": "inexistente"}, headers=auth_headers)
        assert res.status_code == 422


class TestLabels:
    """Testes do CRUD de labels (Sprint 1)."""

    def test_criar_label(self, client, auth_headers):
        res = client.post("/labels", json={"nome": "Bug", "cor": "#ef4444"}, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["nome"] == "Bug"
        assert data["cor"] == "#ef4444"

    def test_listar_labels(self, client, auth_headers):
        client.post("/labels", json={"nome": "Feature"}, headers=auth_headers)
        client.post("/labels", json={"nome": "Bug"}, headers=auth_headers)
        res = client.get("/labels", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_label_duplicada(self, client, auth_headers):
        client.post("/labels", json={"nome": "Bug"}, headers=auth_headers)
        res = client.post("/labels", json={"nome": "Bug"}, headers=auth_headers)
        assert res.status_code == 409

    def test_deletar_label(self, client, auth_headers):
        r = client.post("/labels", json={"nome": "Temp"}, headers=auth_headers)
        label_id = r.json()["id"]
        res = client.delete(f"/labels/{label_id}", headers=auth_headers)
        assert res.status_code == 200

    def test_associar_e_remover_label(self, client, auth_headers):
        # Cria tarefa e label
        t = client.post("/tarefas", json={"titulo": "Com label"}, headers=auth_headers)
        tarefa_id = t.json()["tarefa"]["id"]
        l = client.post("/labels", json={"nome": "Urgente"}, headers=auth_headers)
        label_id = l.json()["id"]

        # Associar
        res = client.post(f"/tarefas/{tarefa_id}/labels/{label_id}", headers=auth_headers)
        assert res.status_code == 201

        # Verifica que a tarefa agora tem a label
        tarefa = client.get("/tarefas", headers=auth_headers).json()["tarefas"]
        tarefa_com_label = next(t for t in tarefa if t["id"] == tarefa_id)
        assert len(tarefa_com_label["labels"]) == 1
        assert tarefa_com_label["labels"][0]["nome"] == "Urgente"

        # Remover
        res = client.delete(f"/tarefas/{tarefa_id}/labels/{label_id}", headers=auth_headers)
        assert res.status_code == 200


class TestSubtarefas:
    """Testes do CRUD de subtarefas (Sprint 1)."""

    def test_criar_subtarefa(self, client, auth_headers):
        t = client.post("/tarefas", json={"titulo": "Tarefa pai"}, headers=auth_headers)
        tarefa_id = t.json()["tarefa"]["id"]

        res = client.post(f"/tarefas/{tarefa_id}/subtarefas", json={"titulo": "Passo 1"}, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["titulo"] == "Passo 1"
        assert data["concluida"] is False

    def test_atualizar_subtarefa(self, client, auth_headers):
        t = client.post("/tarefas", json={"titulo": "Tarefa pai"}, headers=auth_headers)
        tarefa_id = t.json()["tarefa"]["id"]
        s = client.post(f"/tarefas/{tarefa_id}/subtarefas", json={"titulo": "Passo 1"}, headers=auth_headers)
        sub_id = s.json()["id"]

        res = client.patch(f"/subtarefas/{sub_id}", json={"concluida": True}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["concluida"] is True

    def test_deletar_subtarefa(self, client, auth_headers):
        t = client.post("/tarefas", json={"titulo": "Tarefa pai"}, headers=auth_headers)
        tarefa_id = t.json()["tarefa"]["id"]
        s = client.post(f"/tarefas/{tarefa_id}/subtarefas", json={"titulo": "Para deletar"}, headers=auth_headers)
        sub_id = s.json()["id"]

        res = client.delete(f"/subtarefas/{sub_id}", headers=auth_headers)
        assert res.status_code == 200

    def test_subtarefas_em_tarefa_response(self, client, auth_headers):
        """Verifica que GET /tarefas retorna subtarefas aninhadas."""
        t = client.post("/tarefas", json={"titulo": "Tarefa completa"}, headers=auth_headers)
        tarefa_id = t.json()["tarefa"]["id"]
        client.post(f"/tarefas/{tarefa_id}/subtarefas", json={"titulo": "Sub 1"}, headers=auth_headers)
        client.post(f"/tarefas/{tarefa_id}/subtarefas", json={"titulo": "Sub 2"}, headers=auth_headers)

        res = client.get("/tarefas", headers=auth_headers)
        tarefa = next(t for t in res.json()["tarefas"] if t["id"] == tarefa_id)
        assert len(tarefa["subtarefas"]) == 2

    def test_cascade_delete_subtarefas(self, client, auth_headers):
        """Ao deletar tarefa pai, subtarefas também são deletadas."""
        t = client.post("/tarefas", json={"titulo": "Pai"}, headers=auth_headers)
        tarefa_id = t.json()["tarefa"]["id"]
        client.post(f"/tarefas/{tarefa_id}/subtarefas", json={"titulo": "Filho"}, headers=auth_headers)
        
        client.delete(f"/tarefas/{tarefa_id}", headers=auth_headers)
        # Tarefa e subtarefas devem ter sido deletadas
        res = client.get("/tarefas", headers=auth_headers)
        assert res.json()["total"] == 0
