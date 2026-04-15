"""
services/gmail_sync.py — busca e-mails não lidos via api do gmail.

recebe credenciais já decriptografadas (dict) e retorna lista de
dicts com id, remetente, assunto e snippet de cada mensagem unread.
"""
import base64
import re

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _build_service (creds_data: dict):
    """monta o service do gmail a partir do dict de credenciais"""
    credentials = Credentials(
        token=creds_data.get("token") or creds_data.get("access_token"),
        refresh_token=creds_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=creds_data.get("client_id", ""),
        client_secret=creds_data.get("client_secret", ""),
        scopes=creds_data.get("scopes"),
    )
    return build("gmail", "v1", credentials=credentials)


def _extrair_remetente (headers: list[dict]) -> str:
    """pega o campo 'From' dos headers do gmail"""
    for h in headers:
        if h.get("name", "").lower() == "from":
            valor = h.get("value", "")
            # tenta extrair só o nome se vier no formato "Nome <email>"
            match = re.match(r'^"?([^"<]+)"?\s*<', valor)
            return match.group(1).strip() if match else valor
    return "desconhecido"


def _extrair_assunto (headers: list[dict]) -> str:
    """pega o campo 'Subject' dos headers"""
    for h in headers:
        if h.get("name", "").lower() == "subject":
            return h.get("value", "(sem assunto)")
    return "(sem assunto)"


def buscar_emails_nao_lidos (creds_data: dict, max_results: int = 20) -> list[dict]:
    """
    busca até max_results e-mails não lidos da caixa de entrada.
    retorna lista de dicts: { id, remetente, assunto, snippet }
    """
    service = _build_service(creds_data)

    # lista ids dos e-mails não lidos
    resultado = (
        service.users()
        .messages()
        .list(userId="me", q="is:unread", maxResults=max_results)
        .execute()
    )

    mensagens_raw = resultado.get("messages", [])
    if not mensagens_raw:
        return []

    emails = []
    for msg_ref in mensagens_raw:
        msg = (
            service.users()
            .messages()
            .get(userId="me", id=msg_ref["id"], format="metadata", metadataHeaders=["From", "Subject"])
            .execute()
        )
        headers = msg.get("payload", {}).get("headers", [])
        emails.append({
            "id": msg["id"],
            "remetente": _extrair_remetente(headers),
            "assunto": _extrair_assunto(headers),
            "snippet": msg.get("snippet", ""),
        })

    return emails


def marcar_como_lido (creds_data: dict, message_id: str) -> None:
    """remove a label UNREAD de um e-mail — evita reprocessamento"""
    service = _build_service(creds_data)
    service.users().messages().modify(
        userId="me",
        id=message_id,
        body={"removeLabelIds": ["UNREAD"]},
    ).execute()
