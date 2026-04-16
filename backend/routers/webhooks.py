"""
routers/webhooks.py — Webhooks M2M autenticados via HMAC-SHA256.

Separado de tarefas.py para manter o router principal focado em CRUD.
"""
import hashlib
import hmac
import json
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user, registrar_auditoria
from routers.tarefas_helpers import motor_de_score_worker
from schemas import WebhookPayload

router = APIRouter(tags=["Webhook"])


def _verify_hmac_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    """Verifica HMAC-SHA256 do payload contra a assinatura fornecida."""
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/webhook/secret")
def gerar_webhook_secret(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Gera ou regenera o secret HMAC para webhooks M2M do usuário."""
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

    raw_secret = secrets.token_urlsafe(32)

    existing = (
        db.query(models.WebhookSecret)
        .filter(models.WebhookSecret.usuario_id == current_user.id)
        .first()
    )

    if existing:
        existing.secret_hash = pwd_ctx.hash(raw_secret)
        existing.ativo = True
    else:
        db.add(models.WebhookSecret(
            usuario_id=current_user.id,
            secret_hash=pwd_ctx.hash(raw_secret),
        ))
    db.commit()

    return {
        "secret": raw_secret,
        "aviso": "Guarde este secret — ele não será exibido novamente.",
        "uso": "Envie o header X-Webhook-Signature: sha256=HMAC_HEX no POST /webhook/m2m/{usuario_id}",
    }


@router.post("/webhook/m2m/{usuario_id}")
async def receber_webhook_m2m(
    usuario_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    """Webhook M2M autenticado via HMAC-SHA256 (não requer JWT)."""
    signature = request.headers.get("X-Webhook-Signature", "")
    if not signature:
        raise HTTPException(status_code=401, detail="Header X-Webhook-Signature ausente.")

    ws = (
        db.query(models.WebhookSecret)
        .filter(
            models.WebhookSecret.usuario_id == usuario_id,
            models.WebhookSecret.ativo == True,
        )
        .first()
    )
    if not ws:
        raise HTTPException(status_code=401, detail="Webhook secret não configurado para este usuário.")

    body = await request.body()

    # Verificar HMAC usando comparação constante (usa o hash como chave — ambos os lados conhecem)
    expected = hmac.new(ws.secret_hash.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(f"sha256={expected}", signature):
        registrar_auditoria(db, "webhook_hmac_falhou", request, usuario_id=usuario_id)
        raise HTTPException(status_code=401, detail="Assinatura HMAC inválida.")

    try:
        payload = json.loads(body)
        dados = WebhookPayload(**payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Payload inválido.")

    background_tasks.add_task(motor_de_score_worker, usuario_id, dados, db)
    registrar_auditoria(
        db, "webhook_m2m_recebido", request,
        usuario_id=usuario_id, detalhes={"titulo": dados.titulo},
    )
    return {"status": "Recebido via HMAC. Triagem iniciada."}
