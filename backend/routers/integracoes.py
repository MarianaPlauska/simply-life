"""
routers/integracoes.py — Integração OAuth2 Google Calendar
RF-5.01: Fluxo OAuth2 (url → callback → salvar credenciais)
RF-5.02: Buscar eventos do dia via Calendar API
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
"""
import json
import os
import traceback
from datetime import datetime, timezone

import requests as http_requests
from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends, HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from pydantic import BaseModel
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user

router = APIRouter(prefix="/integracoes", tags=["Integrações Google"])

# ── Criptografia (chave persistente via .env) ─────────────────
_fernet_key = os.getenv("FERNET_KEY", "")
if not _fernet_key:
    print("[WARN] FERNET_KEY não encontrada no .env — gerando chave efêmera (tokens não sobrevivem a restart)")
    _fernet_key = Fernet.generate_key().decode()
cofre = Fernet(_fernet_key.encode() if isinstance(_fernet_key, str) else _fernet_key)

# ── Google OAuth2 Config ──────────────────────────────────────
SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.readonly",
]


def _get_google_config() -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/google-callback")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500,
            detail="Credenciais Google não configuradas. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env",
        )

    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }


# ── Schemas ───────────────────────────────────────────────────
class GoogleCallbackPayload(BaseModel):
    code: str


class EventoCalendario(BaseModel):
    titulo: str
    inicio: str
    fim: str
    local: str | None = None
    descricao: str | None = None


# ── GET /integracoes/google/url ───────────────────────────────
@router.get("/google/url")
def obter_url_autorizacao(
    current_user: models.Usuario = Depends(get_current_user),
):
    """Retorna a URL do Google para o usuário autorizar o acesso."""
    from urllib.parse import urlencode

    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/google-callback")
    print(f"[DEBUG] GOOGLE_CLIENT_ID carregado: {client_id[:12]}...{client_id[-6:]}" if len(client_id) > 18 else f"[DEBUG] GOOGLE_CLIENT_ID vazio ou placeholder: '{client_id}'")

    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID não configurado")

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
    return {"url": auth_url}


# ── POST /integracoes/google/callback ─────────────────────────
@router.post("/google/callback")
def processar_callback_google(
    payload: GoogleCallbackPayload,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Troca o authorization code por credenciais e salva no cofre."""
    try:
        print(f"[callback] Iniciando para usuario {current_user.id}, code={payload.code[:20]}...")

        client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/google-callback")

        if not client_id or not client_secret:
            raise HTTPException(status_code=500, detail="Credenciais Google não configuradas no .env")

        # Troca stateless do code por tokens (sem PKCE / sem Flow)
        token_response = http_requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": payload.code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            timeout=15,
        )
        token_data = token_response.json()
        print(f"[callback] Resposta do Google token endpoint: status={token_response.status_code}")

        if "error" in token_data:
            err_detail = token_data.get("error_description", token_data.get("error"))
            print(f"[callback] ERRO do Google: {err_detail}")
            raise HTTPException(status_code=400, detail=f"Erro do Google: {err_detail}")

        # Monta estrutura compatível com google.oauth2.credentials
        creds_data = {
            "token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": client_id,
            "client_secret": client_secret,
            "scopes": token_data.get("scope", "").split(),
        }

        token_blindado = cofre.encrypt(json.dumps(creds_data).encode()).decode()
        print(f"[callback] Credenciais criptografadas ({len(token_blindado)} chars)")

        # Upsert: atualiza se já existe integração google_calendar para o usuário
        integracao = (
            db.query(models.Integracao)
            .filter(
                models.Integracao.usuario_id == current_user.id,
                models.Integracao.plataforma == "google_calendar",
            )
            .first()
        )

        if integracao:
            integracao.token_criptografado = token_blindado
            integracao.status = "ativa"
        else:
            integracao = models.Integracao(
                usuario_id=current_user.id,
                plataforma="google_calendar",
                token_criptografado=token_blindado,
                status="ativa",
            )
            db.add(integracao)

        db.commit()
        print(f"[callback] Integracao salva no banco para usuario {current_user.id}")
        return {"status": "sucesso", "mensagem": "Google Calendar conectado com sucesso."}

    except HTTPException:
        raise
    except Exception as e:
        print(f"!!! ERRO CRÍTICO NO CALLBACK !!! : {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro no callback OAuth: {str(e)}")


# ── GET /integracoes/google/status ────────────────────────────
@router.get("/google/status")
def status_google(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Verifica se o usuario tem Google Calendar conectado."""
    integracao = (
        db.query(models.Integracao)
        .filter(
            models.Integracao.usuario_id == current_user.id,
            models.Integracao.plataforma == "google_calendar",
            models.Integracao.status == "ativa",
        )
        .first()
    )
    return {"connected": integracao is not None}


# ── DELETE /integracoes/google/desconectar ────────────────────
@router.delete("/google/desconectar")
def desconectar_google(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Remove a integracao Google Calendar do usuario."""
    integracao = (
        db.query(models.Integracao)
        .filter(
            models.Integracao.usuario_id == current_user.id,
            models.Integracao.plataforma == "google_calendar",
        )
        .first()
    )
    if integracao:
        db.delete(integracao)
        db.commit()
    return {"status": "sucesso", "mensagem": "Google Calendar desconectado."}


# ── GET /integracoes/calendario/hoje ──────────────────────────
@router.get("/calendario/hoje", response_model=list[EventoCalendario])
def eventos_de_hoje(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Retorna os eventos do Google Calendar para hoje."""
    try:
        integracao = (
            db.query(models.Integracao)
            .filter(
                models.Integracao.usuario_id == current_user.id,
                models.Integracao.plataforma == "google_calendar",
            )
            .first()
        )

        if not integracao or integracao.status != "ativa":
            return []

        # Descriptografa e reconstroi credenciais
        try:
            creds_data = json.loads(cofre.decrypt(integracao.token_criptografado.encode()))
        except Exception as dec_err:
            print(f"[calendario] Erro ao descriptografar: {dec_err}")
            raise HTTPException(status_code=500, detail="Erro ao descriptografar credenciais.")

        print(f"[calendario] Keys no creds_data: {list(creds_data.keys())}")

        # O callback salva como "token" (access_token do Google)
        access_token = creds_data.get("token") or creds_data.get("access_token")
        if not access_token:
            print(f"[calendario] Nenhum access_token encontrado no creds_data")
            raise HTTPException(status_code=500, detail="Access token ausente nas credenciais salvas.")

        credentials = Credentials(
            token=access_token,
            refresh_token=creds_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID", creds_data.get("client_id", "")),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET", creds_data.get("client_secret", "")),
            scopes=creds_data.get("scopes"),
        )

        service = build("calendar", "v3", credentials=credentials)

        agora = datetime.now(timezone.utc)
        inicio_dia = agora.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        fim_dia = agora.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()

        resultado = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=inicio_dia,
                timeMax=fim_dia,
                singleEvents=True,
                orderBy="startTime",
                maxResults=20,
            )
            .execute()
        )

        eventos = []
        for ev in resultado.get("items", []):
            start = ev.get("start", {})
            end = ev.get("end", {})
            eventos.append(
                EventoCalendario(
                    titulo=ev.get("summary", "Sem título"),
                    inicio=start.get("dateTime", start.get("date", "")),
                    fim=end.get("dateTime", end.get("date", "")),
                    local=ev.get("location"),
                    descricao=ev.get("description"),
                )
            )

        print(f"[calendario] {len(eventos)} eventos encontrados para hoje")
        return eventos

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO CALENDARIO: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        # Google HttpError 403 → repassar como 403 para o frontend
        err_str = str(e).lower()
        if "403" in err_str or "insufficient" in err_str or "permission" in err_str:
            raise HTTPException(
                status_code=403,
                detail="Permissão negada pelo Google. Reconecte nas Configurações e marque a caixa de acesso à agenda.",
            )
        raise HTTPException(status_code=500, detail=f"Erro ao buscar calendario: {str(e)}")
