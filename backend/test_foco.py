#!/usr/bin/env python3
"""
test_foco.py — Script de teste de integridade do Modo Foco.

Uso:
    python test_foco.py <EMAIL> <SENHA>
    python test_foco.py user@example.com MinhaS3nha

O script:
  1. Faz login e obtém o JWT
  2. Chama POST /gamificacao/finalizar-sessao com 25 minutos
  3. Verifica xp_total, streak_atual e ultima_sessao_data
  4. Consulta o banco via GET /gamificacao/perfil e confirma persistência
"""
import sys
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def post(path: str, body: dict, token: str = "") -> dict:
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  ❌ HTTP {e.code}: {e.read().decode()}")
        sys.exit(1)


def get(path: str, token: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def main():
    if len(sys.argv) < 3:
        print("Uso: python test_foco.py <EMAIL> <SENHA>")
        sys.exit(1)

    email, senha = sys.argv[1], sys.argv[2]

    # ── 1. Login ────────────────────────────────────────────────
    print(f"\n🔑 Fazendo login como {email}...")
    auth = post("/auth/login", {"email": email, "senha": senha})
    token = auth.get("access_token")
    if not token:
        print(f"  ❌ Login falhou: {auth}")
        sys.exit(1)
    print(f"  ✅ Token obtido: {token[:30]}...")

    # ── 2. Finalizar sessão de 25 minutos ───────────────────────
    print("\n⏱  Enviando sessão de foco (25 min)...")
    sessao = post("/gamificacao/finalizar-sessao", {"minutos": 25, "tarefa_id": None}, token)
    print(f"  ✅ Resposta: {json.dumps(sessao, indent=4, ensure_ascii=False)}")

    xp_ganho = sessao.get("xp_ganho", 0)
    xp_esperado_base = 25 * 10  # 250
    assert xp_ganho >= xp_esperado_base, f"XP esperado >= {xp_esperado_base}, recebido {xp_ganho}"
    print(f"  ✅ XP ganho: {xp_ganho} (>= {xp_esperado_base} base) — cálculo correto!")

    # ── 3. Verificar perfil (persistência no banco) ──────────────
    print("\n📊 Verificando perfil atualizado no banco...")
    perfil = get("/gamificacao/perfil", token)
    print(f"  ✅ Perfil: {json.dumps(perfil, indent=4, ensure_ascii=False)}")

    assert perfil["xp_total"] >= xp_ganho, "xp_total não foi atualizado no banco!"
    assert perfil["streak_atual"] >= 1, "streak_atual deve ser >= 1!"
    assert perfil["ultima_sessao_data"] is not None, "ultima_sessao_data deve estar preenchida!"

    print("\n✅ ===== TODOS OS TESTES PASSARAM =====")
    print(f"   xp_total   : {perfil['xp_total']}")
    print(f"   streak_atual: {perfil['streak_atual']}")
    print(f"   nivel       : {perfil['nivel']}")
    print(f"   última sessão: {perfil['ultima_sessao_data']}")
    print("=" * 40)


if __name__ == "__main__":
    main()
