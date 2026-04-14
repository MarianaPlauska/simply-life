from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
import database

# 1. Usuários
class Usuario(database.Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    nome_completo = Column(String, nullable=True)
    senha_hash = Column(String, nullable=True)
    provedor_auth = Column(String, default="local")
    ativo = Column(Integer, default=1)
    criado_em = Column(String, nullable=True)
    ultimo_login = Column(String, nullable=True)
    tarefas = relationship("TarefaUnificada", back_populates="dono")

# 2. Tarefas Unificadas
class TarefaUnificada(database.Base):
    __tablename__ = "tarefas_unificadas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    titulo = Column(String)
    snippet_100_char = Column(String(100)) 
    score_urgencia = Column(Integer, default=0)
    status = Column(String, default="pendente")
    notas_locais = Column(Text, nullable=True)
    hash_seguranca = Column(String, nullable=True)
    dono = relationship("Usuario", back_populates="tarefas")

# 3. Integrações (Cofre de Tokens)
class Integracao(database.Base):
    __tablename__ = "integracoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    plataforma = Column(String)
    token_criptografado = Column(String)
    status = Column(String, default="ativa")
    hash_seguranca = Column(String, nullable=True)
    dono = relationship("Usuario")

# 4. Anotações (Brain Dump / Segundo Cérebro)
class Anotacao(database.Base):
    __tablename__ = "anotacoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    titulo = Column(String, nullable=True)
    conteudo = Column(Text)
    fixado = Column(Integer, default=0)
    categoria = Column(String, default="pessoal")
    dono = relationship("Usuario")

# 5. Preferências da IA (As Keywords do Usuário)
class PreferenciasUsuario(database.Base):
    __tablename__ = "preferencias_usuario"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    palavras_chave_email = Column(String, default="")
    modulos_fixados = Column(String, default="dashboard,kanban") 

# 6. Planejador Financeiro
class Despesa(database.Base):
    __tablename__ = "despesas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    descricao = Column(String)
    categoria = Column(String)
    valor = Column(Integer) 
    data_gasto = Column(String)
    status_pagamento = Column(String, default="pendente")
    hash_seguranca = Column(String, nullable=True)

# 7. Saúde e Hábitos
class Medicamento(database.Base):
    __tablename__ = "medicamentos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    nome = Column(String)
    horario = Column(String)
    tomado_hoje = Column(Integer, default=0)

# 8. Notificações do Sistema
class Notificacao(database.Base):
    __tablename__ = "notificacoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo = Column(String, default="sistema")  # saude, sistema, tarefa, financeiro
    titulo = Column(String)
    mensagem = Column(Text, nullable=True)
    lida = Column(Integer, default=0)
    urgencia = Column(String, default="normal")  # normal, alta, critica
    score_urgencia = Column(Integer, default=0)
    criado_em = Column(String, nullable=True)

# 9. Hábitos Dinâmicos e Bem-Estar
class HabitoDiario(database.Base):
    __tablename__ = "habitos_diarios"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    tipo = Column(String) # Ex: "agua", "sono", "leitura", "customizado"
    nome_exibicao = Column(String) # Ex: "Copos de Água", "Horas de Sono"
    meta_diaria = Column(Integer) # Ex: 8 (copos), 8 (horas)
    progresso_atual = Column(Integer, default=0)
    unidade = Column(String) # Ex: "ml", "horas", "páginas"