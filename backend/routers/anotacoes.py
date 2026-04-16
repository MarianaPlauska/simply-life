"""
routers/anotacoes.py — Anotações e Notificações do usuário.

Separado de tarefas.py para manter routers focados e abaixo de ~300 linhas.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from schemas import AnotacaoCreate, NotificacaoCreate  # noqa: F401

router = APIRouter(tags=["Anotações & Notificações"])


# ── Anotações ─────────────────────────────────────────────────

@router.get("/anotacoes")
def listar_anotacoes(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    anotacoes = (
        db.query(models.Anotacao)
        .filter(models.Anotacao.usuario_id == current_user.id)
        .order_by(models.Anotacao.fixado.desc(), models.Anotacao.id.desc())
        .all()
    )
    return {"anotacoes": [
        {
            "id": a.id,
            "titulo": a.titulo,
            "conteudo": a.conteudo,
            "fixado": a.fixado,
            "categoria": a.categoria or "pessoal",
        }
        for a in anotacoes
    ]}


@router.post("/anotacoes")
def criar_anotacao(
    dados: AnotacaoCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    nova = models.Anotacao(
        usuario_id=current_user.id,
        titulo=dados.titulo,
        conteudo=dados.conteudo,
        categoria=dados.categoria,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return {"anotacao": {
        "id": nova.id,
        "titulo": nova.titulo,
        "conteudo": nova.conteudo,
        "fixado": nova.fixado,
        "categoria": nova.categoria,
    }}


# ── Notificações ──────────────────────────────────────────────

@router.get("/notificacoes")
def listar_notificacoes(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    rows = (
        db.query(models.Notificacao)
        .filter(models.Notificacao.usuario_id == current_user.id)
        .order_by(models.Notificacao.id.desc())
        .limit(30)
        .all()
    )
    return [{
        "id": n.id,
        "tipo": n.tipo,
        "titulo": n.titulo,
        "mensagem": n.mensagem,
        "lida": bool(n.lida),
        "urgencia": n.urgencia,
        "score_urgencia": n.score_urgencia,
        "criado_em": n.criado_em,
    } for n in rows]


@router.patch("/notificacoes/{notif_id}/lida")
def marcar_notificacao_lida(
    notif_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    n = (
        db.query(models.Notificacao)
        .filter(
            models.Notificacao.id == notif_id,
            models.Notificacao.usuario_id == current_user.id,
        )
        .first()
    )
    if not n:
        return JSONResponse(status_code=404, content={"erro": "Notificação não encontrada"})
    n.lida = 1
    db.commit()
    return {"status": "sucesso"}


@router.patch("/notificacoes/marcar-todas-lidas")
def marcar_todas_lidas(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    db.query(models.Notificacao).filter(
        models.Notificacao.usuario_id == current_user.id,
        models.Notificacao.lida == 0,
    ).update({"lida": 1})
    db.commit()
    return {"status": "sucesso"}
