# lógica de insights e correlação humor vs hábitos — sem api externa, tudo python puro


def gerar_insight (
    humor: float,
    regs: int,
    concluidas: int,
    criadas: int,
    habitos_pct: float,
    foco: int,
    despesas: float,
) -> str:
    """constrói o texto de insight semanal com base nas métricas — tipo um "coach" simples de regras"""
    partes = []

    # avalia o humor da semana
    if regs == 0:
        partes.append("Você ainda não registrou seu humor esta semana. Tente registrar pelo menos 3 dias para eu entender melhor seus padrões.")
    elif humor >= 4:
        partes.append(f"Seu humor médio foi {humor}/5 — excelente! Continue mantendo suas rotinas.")
    elif humor >= 3:
        partes.append(f"Humor médio de {humor}/5 — estável. Pequenos ajustes nos hábitos podem elevar ainda mais.")
    else:
        partes.append(f"Humor médio de {humor}/5. Semana mais pesada. Não se cobre — revise seus hábitos de sono e hidratação.")

    # avalia produtividade
    if criadas > 0:
        taxa = round(concluidas / criadas * 100)
        if taxa >= 70:
            partes.append(f"Produtividade alta: {concluidas}/{criadas} tarefas concluídas ({taxa}%).")
        elif taxa >= 40:
            partes.append(f"Taxa de conclusão de {taxa}%. Tente quebrar tarefas grandes em subtarefas menores.")
        else:
            partes.append(f"Apenas {taxa}% das tarefas concluídas. Priorize menos tarefas com mais foco.")

    # avalia hábitos
    if habitos_pct >= 80:
        partes.append(f"Hábitos em {habitos_pct}% — consistência impressionante!")
    elif habitos_pct >= 50:
        partes.append(f"Hábitos em {habitos_pct}%. Bom ritmo, mas tem espaço para melhorar.")
    elif habitos_pct > 0:
        partes.append(f"Hábitos em {habitos_pct}%. Foque em completar ao menos 1 hábito por dia.")

    # avalia foco
    if foco >= 120:
        partes.append(f"Total de foco: {foco} minutos. Ótimo investimento em trabalho profundo!")
    elif foco > 0:
        partes.append(f"Total de foco: {foco} minutos. Tente adicionar mais sessões curtas de 25min.")

    # avalia finanças
    if despesas > 0:
        partes.append(f"Gastos da semana: R$ {despesas / 100:.2f}.")

    return " ".join(partes) if partes else "Comece a registrar seu humor e hábitos para receber insights personalizados."


def calcular_correlacao (
    humor_por_dia: dict,
    historicos: list,
    sessoes_foco: list,
) -> dict:
    """
    cruza humor com hábitos concluídos e sessões de foco.
    retorna dicionário com 'insights' (textos) e 'dados' (números brutos).

    - humor_por_dia: {date: int}
    - historicos: lista de tuplas (data, nome_habito) dos hábitos concluídos
    - sessoes_foco: lista de objetos com .dia (date) e .total (int minutos)
    """
    if len(humor_por_dia) < 3:
        return {
            "insights": ["Registre seu humor por pelo menos 3 dias para eu encontrar padrões."],
            "dados": [],
        }

    humor_medio_geral = sum(humor_por_dia.values()) / len(humor_por_dia)

    # agrupa humores por hábito concluído
    habito_humores: dict[str, list[int]] = {}
    for data_h, nome in historicos:
        if data_h in humor_por_dia:
            habito_humores.setdefault(nome, []).append(humor_por_dia[data_h])

    insights = []
    dados = []

    for nome, lista_humor in habito_humores.items():
        if len(lista_humor) < 2:
            continue
        media_com = sum(lista_humor) / len(lista_humor)
        diff_pct = round((media_com - humor_medio_geral) / humor_medio_geral * 100, 1) if humor_medio_geral > 0 else 0
        dados.append({
            "habito": nome,
            "humor_medio_com": round(media_com, 1),
            "humor_medio_geral": round(humor_medio_geral, 1),
            "diff_pct": diff_pct,
            "amostras": len(lista_humor),
        })
        if diff_pct > 5:
            insights.append(f"Nos dias que você completou \"{nome}\", seu humor foi {diff_pct}% melhor.")
        elif diff_pct < -5:
            insights.append(f"Curioso: nos dias com \"{nome}\" concluído, seu humor foi {abs(diff_pct)}% menor. Vale investigar.")

    # correlação com sessões de foco
    humor_com_foco = [
        humor_por_dia[s.dia]
        for s in sessoes_foco
        if s.dia in humor_por_dia and s.total >= 25
    ]
    if len(humor_com_foco) >= 2:
        media_foco = sum(humor_com_foco) / len(humor_com_foco)
        diff_foco = round((media_foco - humor_medio_geral) / humor_medio_geral * 100, 1) if humor_medio_geral > 0 else 0
        if diff_foco > 5:
            insights.append(f"Nos dias com sessões de foco (25min+), seu humor foi {diff_foco}% maior.")

    if not insights:
        insights.append("Continue registrando — preciso de mais dados para encontrar correlações significativas.")

    return {"insights": insights, "dados": dados}
