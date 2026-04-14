"""
routers/triagem.py — Motor de Triagem com Palavras-Chave.

• CRUD de PalavrasChave (GET / POST / DELETE) protegido por JWT
• POST /triagem/processar-mensagem: Motor regex/NLP que detecta
  palavras-chave do usuário no conteúdo e cria tarefas automáticas
  com prioridade 'critica' e origem da fonte (gmail, webhook, etc.)
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from schemas import (
    PalavraChaveCreate,
    PalavraChaveResponse,
    ProcessarMensagemRequest,
    ProcessarMensagemResponse,
    TarefaResponse,
)

router = APIRouter(prefix="/triagem", tags=["Motor de Triagem"])


# ── helpers ───────────────────────────────────────────────────

def _match_keywords(conteudo: str, palavras: list[models.PalavraChave]) -> models.PalavraChave | None:
    """
    Varre o conteúdo (lower-case) e retorna a primeira PalavraChave
    cujo termo ocorra como palavra completa. Ordena por peso desc
    para priorizar termos mais relevantes.
    """
    import re
    texto = conteudo.lower()
    for pk in sorted(palavras, key=lambda p: p.peso, reverse=True):
        # boundary match: garante que seja palavra inteira, não substring
        pattern = r'\b' + re.escape(pk.termo.lower()) + r'\b'
        if re.search(pattern, texto):
            return pk
    return None


# ── CRUD Palavras-Chave ───────────────────────────────────────

@router.get("/palavras-chave", response_model=list[PalavraChaveResponse])
def listar_palavras_chave(
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    return (
        db.query(models.PalavraChave)
        .filter(models.PalavraChave.user_id == usuario.id)
        .order_by(models.PalavraChave.peso.desc(), models.PalavraChave.id.asc())
        .all()
    )


@router.post("/palavras-chave", response_model=PalavraChaveResponse, status_code=201)
def criar_palavra_chave(
    dados: PalavraChaveCreate,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    termo = dados.termo.strip().lower()
    if not termo:
        raise HTTPException(status_code=422, detail="Termo não pode ser vazio.")

    # Unicidade por user
    existe = (
        db.query(models.PalavraChave)
        .filter(models.PalavraChave.user_id == usuario.id, models.PalavraChave.termo == termo)
        .first()
    )
    if existe:
        raise HTTPException(status_code=409, detail=f"Palavra-chave '{termo}' já existe.")

    nova = models.PalavraChave(
        user_id=usuario.id,
        termo=termo,
        peso=max(1, min(10, dados.peso)),
        created_at=datetime.now(timezone.utc),
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova


@router.delete("/palavras-chave/{pk_id}", status_code=200)
def deletar_palavra_chave(
    pk_id: int,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    pk = (
        db.query(models.PalavraChave)
        .filter(models.PalavraChave.id == pk_id, models.PalavraChave.user_id == usuario.id)
        .first()
    )
    if not pk:
        raise HTTPException(status_code=404, detail="Palavra-chave não encontrada.")
    db.delete(pk)
    db.commit()
    return {"status": "removida", "id": pk_id}


# ── Motor: Processar Mensagem ─────────────────────────────────

@router.post("/processar-mensagem", response_model=ProcessarMensagemResponse)
def processar_mensagem(
    dados: ProcessarMensagemRequest,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Analisa o conteúdo com regex boundary-match contra as palavras-chave
    do usuário. Se houver match:
      • Cria TarefaUnificada com prioridade='critica', origem=dados.origem
      • Título: 'Urgente: [remetente]' (ou trecho do conteúdo se sem remetente)
      • Liga palavra_chave_id para rastreabilidade
    Retorna { status: 'match', tarefa } ou { status: 'ignorado' }.
    """
    palavras = (
        db.query(models.PalavraChave)
        .filter(models.PalavraChave.user_id == usuario.id)
        .all()
    )

    if not palavras:
        return ProcessarMensagemResponse(status="ignorado")

    match = _match_keywords(dados.conteudo, palavras)

    if not match:
        return ProcessarMensagemResponse(status="ignorado")

    # Gera título a partir do remetente
    remetente = (dados.remetente or "").strip()
    if remetente:
        titulo = f"Urgente: {remetente}"
    else:
        snippet = dados.conteudo[:60].strip()
        titulo = f"Urgente: {snippet}{'...' if len(dados.conteudo) > 60 else ''}"

    nova_tarefa = models.TarefaUnificada(
        usuario_id=usuario.id,
        titulo=titulo,
        descricao=dados.conteudo[:500],
        snippet_100_char=dados.conteudo[:100],
        status="pendente",
        prioridade="critica",
        origem=dados.origem or "triagem",
        score_urgencia=100 + (match.peso * 10),
        palavra_chave_id=match.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(nova_tarefa)
    db.commit()
    db.refresh(nova_tarefa)

    return ProcessarMensagemResponse(
        status="match",
        termo_detectado=match.termo,
        tarefa=TarefaResponse.model_validate(nova_tarefa),
    )
