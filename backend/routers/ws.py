"""
routers/ws.py — E3: WebSocket para sync em tempo real
broadcast de eventos de tarefas para todos os clientes conectados do mesmo usuário.
"""
import logging
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from auth import verificar_token, ACCESS_COOKIE

logger = logging.getLogger("simply-life")
router = APIRouter(tags=["WebSocket"])

# mapa: usuario_id → set de conexões ativas
_connections: dict[int, set[WebSocket]] = defaultdict(set)


def _authenticate_ws(ws: WebSocket, token_param: str | None) -> int | None:
    """extrai usuario_id do cookie ou query param. retorna None se inválido."""
    token = token_param or ws.cookies.get(ACCESS_COOKIE)
    if not token:
        return None
    try:
        payload = verificar_token(token, expected_type="access")
        uid = payload.get("sub")
        return int(uid) if uid else None
    except (JWTError, Exception):
        return None


async def broadcast(usuario_id: int, event: dict) -> None:
    """envia evento para todas as conexões ativas do usuário."""
    conns = _connections.get(usuario_id)
    if not conns:
        return
    dead: list[WebSocket] = []
    for ws in conns:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        conns.discard(ws)


@router.websocket("/ws")
async def websocket_endpoint(
    ws: WebSocket,
    token: str | None = Query(default=None),
):
    uid = _authenticate_ws(ws, token)
    if uid is None:
        await ws.close(code=4001, reason="Não autenticado")
        return

    await ws.accept()
    _connections[uid].add(ws)
    logger.info("WS conectado: usuario_id=%s (total=%d)", uid, len(_connections[uid]))

    try:
        while True:
            # mantém conexão aberta — cliente pode enviar pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        _connections[uid].discard(ws)
        if not _connections[uid]:
            del _connections[uid]
        logger.info("WS desconectado: usuario_id=%s", uid)
