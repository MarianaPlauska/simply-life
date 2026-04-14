"""
routers/financas.py — Despesas (com integridade SHA-256)
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
"""
import hashlib
import json

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from schemas import DespesaCreate

router = APIRouter(tags=["Finanças"])

# ── Integridade financeira ────────────────────────────────────
INTEGRITY_SALT = "simply-life-integrity-v1"


def gerar_hash_integridade(dados: dict) -> str:
    payload = json.dumps(dados, sort_keys=True, default=str) + INTEGRITY_SALT
    return hashlib.sha256(payload.encode()).hexdigest()


def selar_despesa(despesa: models.Despesa, db: Session):
    campos = {
        "id": despesa.id, "valor": despesa.valor,
        "descricao": despesa.descricao, "categoria": despesa.categoria,
    }
    despesa.hash_seguranca = gerar_hash_integridade(campos)
    db.commit()


def verificar_integridade_despesa(despesa: models.Despesa) -> bool:
    if not despesa.hash_seguranca:
        return True
    campos = {
        "id": despesa.id, "valor": despesa.valor,
        "descricao": despesa.descricao, "categoria": despesa.categoria,
    }
    return despesa.hash_seguranca == gerar_hash_integridade(campos)


# ── Despesas ──────────────────────────────────────────────────

@router.get("/despesas")
def listar_despesas(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    despesas = (
        db.query(models.Despesa)
        .filter(models.Despesa.usuario_id == current_user.id)
        .order_by(models.Despesa.id.desc())
        .all()
    )
    resultado = []
    for d in despesas:
        integro = verificar_integridade_despesa(d)
        resultado.append({
            "id": d.id, "descricao": d.descricao, "categoria": d.categoria,
            "valor": d.valor, "data": d.data_gasto, "tipo": "despesa",
            "status_pagamento": d.status_pagamento or "pendente",
            "integridade_ok": integro,
        })
    return {"despesas": resultado}


@router.post("/despesas")
def criar_despesa(
    dados: DespesaCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    nova = models.Despesa(
        usuario_id=current_user.id,
        descricao=dados.descricao,
        categoria=dados.categoria,
        valor=dados.valor,
        data_gasto=dados.data_gasto,
        status_pagamento=dados.status_pagamento,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    selar_despesa(nova, db)
    return {"despesa": {
        "id": nova.id, "descricao": nova.descricao, "categoria": nova.categoria,
        "valor": nova.valor, "data": nova.data_gasto, "tipo": "despesa",
        "status_pagamento": nova.status_pagamento,
    }}


@router.patch("/despesas/{despesa_id}/status")
def atualizar_status_despesa(
    despesa_id: int,
    status: str,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    despesa = (
        db.query(models.Despesa)
        .filter(models.Despesa.id == despesa_id, models.Despesa.usuario_id == current_user.id)
        .first()
    )
    if not despesa:
        return JSONResponse(status_code=404, content={"erro": "Despesa não encontrada"})
    despesa.status_pagamento = status
    db.commit()
    return {"status": "sucesso"}
