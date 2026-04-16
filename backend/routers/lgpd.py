"""
routers/lgpd.py — Endpoints de compliance LGPD (Lei 13.709/2018)
Art. 18: Direitos do titular — portabilidade, exclusão, acesso
"""
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user, registrar_auditoria, verificar_senha

logger = logging.getLogger("simply-life")
router = APIRouter(prefix="/lgpd", tags=["LGPD / Privacidade"])


@router.get("/meus-dados")
def exportar_meus_dados(
    request: Request,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    LGPD Art. 18, V — Portabilidade: exporta TODOS os dados do usuário em JSON.
    Prazo legal: 15 dias (Brasil). Aqui é instantâneo.
    """
    uid = current_user.id

    # Perfil
    perfil = {
        "id": current_user.id,
        "email": current_user.email,
        "nome_completo": current_user.nome_completo,
        "provedor_auth": current_user.provedor_auth,
        "criado_em": current_user.criado_em,
        "ultimo_login": current_user.ultimo_login,
        "xp": current_user.xp,
        "streak_days": current_user.streak_days,
    }

    # Tarefas (incluindo soft-deleted)
    tarefas = db.query(models.TarefaUnificada).filter(
        models.TarefaUnificada.usuario_id == uid
    ).all()
    tarefas_data = [
        {
            "id": t.id, "titulo": t.titulo, "descricao": t.descricao,
            "status": t.status, "prioridade": t.prioridade, "origem": t.origem,
            "data_vencimento": str(t.data_vencimento) if t.data_vencimento else None,
            "notas_locais": t.notas_locais, "created_at": str(t.created_at),
            "deletado_em": str(t.deletado_em) if t.deletado_em else None,
        }
        for t in tarefas
    ]

    # Anotações
    anotacoes = db.query(models.Anotacao).filter(models.Anotacao.usuario_id == uid).all()
    anotacoes_data = [
        {"id": a.id, "titulo": a.titulo, "conteudo": a.conteudo, "categoria": a.categoria}
        for a in anotacoes
    ]

    # Finanças
    despesas = db.query(models.Despesa).filter(models.Despesa.usuario_id == uid).all()
    despesas_data = [
        {"id": d.id, "descricao": d.descricao, "categoria": d.categoria,
         "valor": d.valor, "data_gasto": d.data_gasto}
        for d in despesas
    ]

    # Saúde
    medicamentos = db.query(models.Medicamento).filter(models.Medicamento.usuario_id == uid).all()
    medicamentos_data = [
        {"id": m.id, "nome": m.nome, "horario": m.horario}
        for m in medicamentos
    ]

    # Hábitos
    habitos = db.query(models.HabitoDiario).filter(models.HabitoDiario.usuario_id == uid).all()
    habitos_data = [
        {"id": h.id, "tipo": h.tipo, "nome_exibicao": h.nome_exibicao,
         "meta_diaria": h.meta_diaria, "unidade": h.unidade}
        for h in habitos
    ]

    # Humor / Diário
    humores = db.query(models.DiarioHumor).filter(models.DiarioHumor.usuario_id == uid).all()
    humores_data = [
        {"data": str(h.data), "humor": h.humor, "emoji": h.emoji, "nota": h.nota}
        for h in humores
    ]

    entradas = db.query(models.EntradaDiario).filter(models.EntradaDiario.usuario_id == uid).all()
    entradas_data = [
        {"data": str(e.data), "conteudo": e.conteudo, "prompt_usado": e.prompt_usado}
        for e in entradas
    ]

    # Sessões de foco
    sessoes = db.query(models.SessaoFoco).filter(models.SessaoFoco.user_id == uid).all()
    sessoes_data = [
        {"id": s.id, "duracao_minutos": s.duracao_minutos, "xp_ganho": s.xp_ganho,
         "created_at": str(s.created_at)}
        for s in sessoes
    ]

    # Preferências
    prefs = db.query(models.PreferenciasUsuario).filter(
        models.PreferenciasUsuario.usuario_id == uid
    ).first()
    prefs_data = {
        "palavras_chave_email": prefs.palavras_chave_email if prefs else "",
        "modulos_fixados": prefs.modulos_fixados if prefs else "",
    }

    registrar_auditoria(db, "dados_exportados", request, usuario_id=uid)

    return {
        "exportado_em": datetime.now(timezone.utc).isoformat(),
        "formato": "LGPD Art. 18 — Portabilidade de dados",
        "perfil": perfil,
        "tarefas": tarefas_data,
        "anotacoes": anotacoes_data,
        "despesas": despesas_data,
        "medicamentos": medicamentos_data,
        "habitos": habitos_data,
        "humores": humores_data,
        "entradas_diario": entradas_data,
        "sessoes_foco": sessoes_data,
        "preferencias": prefs_data,
    }


@router.delete("/minha-conta")
def excluir_minha_conta(
    request: Request,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    LGPD Art. 18, VI — Direito à eliminação.
    Exclui TODOS os dados do usuário permanentemente.
    Requer confirmação via header X-Confirm-Delete: EXCLUIR-MINHA-CONTA
    """
    confirmacao = request.headers.get("X-Confirm-Delete", "")
    if confirmacao != "EXCLUIR-MINHA-CONTA":
        raise HTTPException(
            status_code=400,
            detail="Envie o header X-Confirm-Delete: EXCLUIR-MINHA-CONTA para confirmar.",
        )

    uid = current_user.id
    logger.warning("LGPD: exclusão de conta solicitada para usuario_id=%s", uid)

    # Registrar auditoria ANTES de excluir (o log fica como evidência)
    registrar_auditoria(
        db, "conta_excluida", request, usuario_id=uid,
        detalhes={"email": current_user.email},
    )

    # Ordem de exclusão respeitando FKs (do mais dependente para o menos)
    # Subtarefas e labels de tarefas
    tarefa_ids = [t.id for t in db.query(models.TarefaUnificada.id).filter(
        models.TarefaUnificada.usuario_id == uid
    ).all()]

    if tarefa_ids:
        db.query(models.Subtarefa).filter(models.Subtarefa.tarefa_id.in_(tarefa_ids)).delete(synchronize_session=False)
        db.query(models.TarefaLabel).filter(models.TarefaLabel.tarefa_id.in_(tarefa_ids)).delete(synchronize_session=False)
        db.query(models.AtividadeTarefa).filter(models.AtividadeTarefa.tarefa_id.in_(tarefa_ids)).delete(synchronize_session=False)
        db.query(models.TarefaRecorrencia).filter(models.TarefaRecorrencia.tarefa_id.in_(tarefa_ids)).delete(synchronize_session=False)
        db.query(models.TarefaDependencia).filter(models.TarefaDependencia.tarefa_id.in_(tarefa_ids)).delete(synchronize_session=False)
        db.query(models.SessaoFoco).filter(models.SessaoFoco.tarefa_id.in_(tarefa_ids)).delete(synchronize_session=False)

    # Hábitos e histórico
    habito_ids = [h.id for h in db.query(models.HabitoDiario.id).filter(
        models.HabitoDiario.usuario_id == uid
    ).all()]
    if habito_ids:
        db.query(models.HistoricoHabito).filter(models.HistoricoHabito.habito_id.in_(habito_ids)).delete(synchronize_session=False)

    # Tabelas diretas do usuário
    db.query(models.TarefaUnificada).filter(models.TarefaUnificada.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.HabitoDiario).filter(models.HabitoDiario.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.Anotacao).filter(models.Anotacao.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.Despesa).filter(models.Despesa.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.Medicamento).filter(models.Medicamento.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.DiarioHumor).filter(models.DiarioHumor.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.EntradaDiario).filter(models.EntradaDiario.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.SessaoFoco).filter(models.SessaoFoco.user_id == uid).delete(synchronize_session=False)
    db.query(models.Notificacao).filter(models.Notificacao.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.Label).filter(models.Label.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.PalavraChave).filter(models.PalavraChave.user_id == uid).delete(synchronize_session=False)
    db.query(models.PreferenciasUsuario).filter(models.PreferenciasUsuario.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.Integracao).filter(models.Integracao.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.TarefaTemplate).filter(models.TarefaTemplate.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.WebhookSecret).filter(models.WebhookSecret.usuario_id == uid).delete(synchronize_session=False)
    db.query(models.TokenBlacklist).filter(models.TokenBlacklist.usuario_id == uid).delete(synchronize_session=False)

    # Desativar conta (manter registro mínimo para audit trail — LGPD Art. 16)
    current_user.ativo = 0
    current_user.email = f"excluido_{uid}@removed.local"
    current_user.nome_completo = "Conta Excluída"
    current_user.senha_hash = None

    db.commit()
    logger.warning("LGPD: conta usuario_id=%s excluída com sucesso", uid)

    return {
        "status": "conta_excluida",
        "mensagem": "Todos os seus dados foram permanentemente excluídos conforme LGPD Art. 18.",
    }
