"""Testes CRUD completo de tarefas: criar, listar, atualizar, deletar, buscar."""


def test_criar_tarefa(client, auth_headers):
    resp = client.post("/tarefas", headers=auth_headers, json={
        "titulo": "Minha primeira tarefa",
        "notas_locais": "Notas de teste",
    })
    assert resp.status_code == 201
    data = resp.json()["tarefa"]
    assert data["titulo"] == "Minha primeira tarefa"
    assert data["status"] == "pendente"
    assert data["notas_locais"] == "Notas de teste"


def test_listar_tarefas(client, auth_headers):
    client.post("/tarefas", headers=auth_headers, json={"titulo": "Tarefa A"})
    client.post("/tarefas", headers=auth_headers, json={"titulo": "Tarefa B"})

    resp = client.get("/tarefas", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


def test_atualizar_tarefa(client, auth_headers):
    resp = client.post("/tarefas", headers=auth_headers, json={"titulo": "Original"})
    tarefa_id = resp.json()["tarefa"]["id"]

    resp = client.patch(f"/tarefas/{tarefa_id}", headers=auth_headers, json={
        "titulo": "Atualizado",
        "status": "hoje",
    })
    assert resp.status_code == 200
    data = resp.json()["tarefa"]
    assert data["titulo"] == "Atualizado"
    assert data["status"] == "hoje"


def test_deletar_tarefa(client, auth_headers):
    resp = client.post("/tarefas", headers=auth_headers, json={"titulo": "Para deletar"})
    tarefa_id = resp.json()["tarefa"]["id"]

    resp = client.delete(f"/tarefas/{tarefa_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "sucesso"

    # Verificar que sumiu
    resp = client.get("/tarefas", headers=auth_headers)
    assert resp.json()["total"] == 0


def test_buscar_tarefas(client, auth_headers):
    client.post("/tarefas", headers=auth_headers, json={"titulo": "Reunião com cliente"})
    client.post("/tarefas", headers=auth_headers, json={"titulo": "Comprar leite"})

    resp = client.get("/tarefas/busca?q=reunião", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert "Reunião" in resp.json()["tarefas"][0]["titulo"]


def test_buscar_por_status(client, auth_headers):
    client.post("/tarefas", headers=auth_headers, json={"titulo": "A", "status": "pendente"})
    client.post("/tarefas", headers=auth_headers, json={"titulo": "B", "status": "hoje"})

    resp = client.get("/tarefas/busca?status_filter=hoje", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_atualizar_tarefa_inexistente(client, auth_headers):
    resp = client.patch("/tarefas/9999", headers=auth_headers, json={"titulo": "X"})
    assert resp.status_code == 404


def test_deletar_tarefa_inexistente(client, auth_headers):
    resp = client.delete("/tarefas/9999", headers=auth_headers)
    assert resp.status_code == 404
