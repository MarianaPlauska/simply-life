# Gamificação, ofensiva e retenção diária — análise de mercado (2026)

Pesquisa para o Simply-Life / AXEL: como prender atenção sem virar “planilha com pontinhos”.

**Fontes:** [Duolingo — Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth), [Finch widgets](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl), [LevelUp AI](https://levelupaiapp.com/), [LifeForge](https://lifeforge.app/), [StriveCloud 2026](https://www.strivecloud.io/blog/increase-mobile-app-engagement-optimized), [Yu-kai Chou — Octalysis](https://yukaichou.com/gamification-examples/what-is-gamification/), [MainQuest — profundidade vs pointsification](https://www.mainquest.net/gamified-habit-trackers-effectiveness-research-2026).

---

## O que o mercado prova

| Mecânica | Quem faz bem | Efeito psicológico | Risco |
|----------|--------------|-------------------|--------|
| **Ofensiva (streak)** | Duolingo, LevelUp | Perda evitada — quanto maior a sequência, mais dói quebrar | Ansiedade se tom agressivo |
| **XP + nível** | Habitica, LevelUp, LifeForge | Progresso contínuo mesmo em dias ruins | “Pointsification” superficial |
| **Missão do dia** | Finch, Duolingo quests | Motivo claro para abrir hoje | Lista longa demais |
| **Feedback imediato** | Waterllama, Finch | Ação → animação → dopamina | Só visual sem significado |
| **Widget / presença** | Finch | App “vive” na tela sem notificação | Só mobile nativo |
| **Main Quest** | LifeForge | Uma coisa óbvia para fazer primeiro | Recomendação errada mata confiança |

**Conclusão:** retenção sustentável = **meta diária clara** + **recompensa imediata** + **progresso de longo prazo** + **tom encorajador** (Finch), não punitivo (Duolingo agressivo).

Benchmarks citados em 2025–2026: gamificação bem feita pode elevar retenção D30 em ~40%; streaks sozinhas ~+22% engajamento diário — desde que exista **conteúdo de endgame** (quests, coleções, história).

---

## O que o Simply-Life já tem (base)

| Sistema | Onde está | Papel |
|---------|-----------|--------|
| **Ofensiva** | `axelStreakSlice`, `AxelStreakBadge` | 1 tarefa/dia mantém sequência |
| **XP por módulo** | `gamificacaoSlice` (foco, vitalidade, estabilidade) | RPG leve |
| **Quests diárias** | `userQuests`, `ActiveQuestsList` | Missões com recompensa XP |
| **Hidratação viva** | `WaterWaveCard` | Loop saúde + feedback visual |
| **Loop diário no dashboard** | `DailyEngagementCard` | Streak + missão + nível |

---

## Roadmap recomendado (ofensiva + gamificação)

### Fase 1 — Já em curso (retenção “D1–D7”)
- [x] Card de água hero com ondas + copo em 1 toque
- [x] `DailyEngagementCard` (ofensiva + missão + XP)
- [ ] Toast/celebração ao completar missão diária (confetti leve)
- [ ] Morning brief no dashboard (1 frase AXEL + link para Kanban)

### Fase 2 — Hábito diário (“D7–D30”)
- [ ] **Meta diária de XP** configurável (ex.: 50 XP = dia válido para ofensiva)
- [ ] **Escudo de ofensiva** (já existe `streakFreezes` — expor na UI com custo em XP)
- [ ] **Main Quest AXEL**: uma tarefa destacada com +50% XP (estilo LifeForge)
- [ ] Hidratação conta para “vitalidade” + micro-animação splash (já parcial)

### Fase 3 — Endgame (“D30+”)
- [ ] Coleção de “relíquias” / conquistas visuais (não só badge texto)
- [ ] Heatmap de foco (GitHub-style) no perfil
- [ ] Relatório semanal “seu episódio” (Finch / Waterllama share card)
- [ ] PWA widget hidratação (quando app mobile)

---

## A melhor dica para prender o usuário no dia a dia

**Não tente ser “mais um app de tarefas”. Seja o ritual de abertura do dia.**

Modelo em 3 passos (copiável amanhã):

1. **Gancho de abertura (10 segundos)**  
   Ao abrir: dashboard mostra **água em movimento** + **ofensiva** + **1 missão**. O usuário sempre sabe o que fazer primeiro sem pensar.

2. **Vitória rápida (2 minutos)**  
   Uma ação mínima com feedback forte: registrar 1 copo, marcar 1 subtarefa, ou concluir a “missão do dia”. Cada ação dispara animação + XP visível.

3. **Gancho de amanhã (lock-in)**  
   Ao fechar o dia (ou 20h): “Ofensiva de X dias — falta só Y para o escudo”. Push opcional só se streak em risco (tom Finch, não culpa).

**Regra de ouro:** uma métrica norte = **“usuário fez pelo menos 1 ação significativa hoje?”** (tarefa, água, ou missão). Tudo no produto deve empurrar para isso.

---

## Tom para o AXEL (Simply-Life)

- **Encorajador** (Finch): “Você está a 2 copos da meta” — não “Você falhou”.
- **Competente** (Linear): dados densos, zero infantilização excessiva.
- **Significativo**: XP vem de tarefas reais com score de urgência — não check-in vazio.

---

## Como funciona HOJE no Simply-Life (para o usuário)

### Loop diário (o que prende)

| Momento | O que o usuário vê | O que ganha |
|---------|-------------------|-------------|
| Abrir o app | Dashboard: água em movimento, **ofensiva** (🔥), missão do dia | Clareza do que fazer |
| Executar 1 tarefa | Kanban → concluir com score alto + tempo de foco | **XP Foco** (= score de urgência) + chance de **ofensiva +1** |
| Saúde | Registrar copo, medicamento, treino | **XP Vitalidade** + progresso de quests |
| Finanças | Lançar movimento | **XP Estabilidade** + quests financeiras |

### Ofensiva (streak)

Regras em `proofOfWork.ts` + `axelStreakSlice.ts`:

1. **Qualifica** se a tarefa tiver score **> 70** e foco **≥ 15 min** na tarefa (ou tempo estimado cumprido).
2. **Primeira tarefa qualificada do dia** incrementa a ofensiva; repetir no mesmo dia não soma de novo.
3. **Perde** se passar mais de 1 dia útil sem qualificar (fins de semana têm regra especial em `weekendStreak.ts`).
4. **Escudo** — gasta **500 XP** total para comprar 1 freeze (`purchaseStreakFreeze`) que absorve 1 dia perdido.

**O que prende:** número visível no header + `DailyEngagementCard` + medo de perder sequência longa (mesma psicologia Duolingo). Falta ainda: push 20h, widget, celebração em marcos 7/30/100 dias.

### XP e recompensas

| Tipo | Como ganha | Para quê |
|------|------------|----------|
| **XP Foco** | Concluir tarefa (1:1 com score de urgência) | Nível RPG · escudo de ofensiva |
| **XP Vitalidade** | Quests de água, medicamento, proteína, treino | Barra “Vitalidade” no perfil RPG |
| **XP Estabilidade** | Quests financeiras (ex. 50/30/20) | Barra “Estabilidade” |
| **Quests diárias** | Geradas por `generateQuestsForToday` (+10 a +20 XP cada) | Missão explícita no dashboard |
| **Quest semanal** | Meta 50/30/20 | +100 XP |
| **Conquistas** | `checkAndUnlockAchievements` (badges no Supabase) | Coleção / status |
| **Gasto de XP** | Escudo de ofensiva (500 XP) | Proteger streak |

**Implementado (jun/2026):**
- [x] Confetti + som leve ao concluir tarefa (`axelCelebration.ts` + canvas-confetti)
- [x] Tela de marco 7 / 30 / 100 dias (`CelebrationOverlay`)
- [x] Main Quest +50% XP (`mainQuest.ts` + `DashboardAxelFocus`)
- [x] Lembrete noturno ofensiva ≥18h (`StreakEveningBanner`)
- [x] Loja AXEL — escudo de ofensiva (`AxelRewardShop`)
- [x] Check-in saúde mental ao entrar (`MentalHealthCheckIn`)

**Ainda falta:** widget iOS/PWA, push 20h, temas/relíquias na loja.

### Por que voltar amanhã (em uma frase)

> “Se eu não abrir, perco a ofensiva / deixo a missão / a água não enche — e amanhã o AXEL já sabe o que é urgente.”

---

## Próximo passo de produto sugerido

Implementar **Main Quest** no `DashboardAxelFocus`: tarefa #1 com +50% XP e animação ao concluir. Adicionar marcos de ofensiva (7, 30 dias) com tela de celebração.

Ver também: `docs/LAYOUT_PROXIMO_PASSO.md` (layout) · `docs/KANBAN_REDESIGN.md` (execução vs prazo).
