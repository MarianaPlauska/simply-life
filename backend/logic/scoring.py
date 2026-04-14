"""
logic/scoring.py — Motor de Priorização Inteligente (RF-2.01 / RF-2.02)

Calcula score_urgencia (0–150) com pesos parametrizáveis.
Recebe título/conteúdo e as palavras-chave do dicionário do usuário.
"""

# ── Pesos parametrizáveis ─────────────────────────────────────
PESOS_PLATAFORMA: dict[str, int] = {
    "github": 80,
    "gmail": 40,
    "linkedin": 60,
    "outlook": 45,
    "teams": 35,
    "slack": 30,
}

PALAVRAS_URGENCIA: dict[str, int] = {
    "urgente": 30,
    "bug": 30,
    "critical": 30,
    "blocker": 30,
    "hotfix": 30,
    "deadline": 20,
    "prazo": 20,
}

BONUS_KEYWORD_USUARIO: int = 70  # RF-2.02: bônus por correspondência
SCORE_MAX: int = 150
SCORE_NOTIFICACAO_CRITICA: int = 120  # threshold pró-ativo


def calcular_prioridade(
    titulo: str,
    conteudo: str = "",
    keywords_usuario: str = "",
    plataforma: str = "outro",
) -> int:
    """
    RF-2.01 — Retorna score inteiro entre 0 e 150.

    Composição:
      • Base por plataforma de origem: 0–80
      • Bônus por palavras de urgência no título: +30
      • Bônus por keyword do dicionário do usuário (RF-2.02): +70
    """
    score = 0

    # 1. Peso da plataforma de origem
    score += PESOS_PLATAFORMA.get(plataforma.lower().strip(), 10)

    # 2. Palavras de urgência no título (case-insensitive)
    titulo_lower = titulo.lower()
    for palavra, peso in PALAVRAS_URGENCIA.items():
        if palavra in titulo_lower:
            score += peso
            break  # aplica apenas o primeiro match

    # 3. Filtro de keywords do usuário (RF-2.02)
    if keywords_usuario:
        texto = (titulo + " " + conteudo).lower()
        lista_kw = [k.strip().lower() for k in keywords_usuario.split(",") if k.strip()]
        for kw in lista_kw:
            if kw in texto:
                score += BONUS_KEYWORD_USUARIO
                break

    return min(score, SCORE_MAX)


# Alias para compatibilidade com código legado
def calcular_score(
    plataforma: str,
    titulo: str,
    conteudo: str = "",
    palavras_chave_usuario: str = "",
) -> int:
    return calcular_prioridade(titulo, conteudo, palavras_chave_usuario, plataforma)
