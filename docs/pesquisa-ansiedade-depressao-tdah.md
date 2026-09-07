# Pesquisa: ansiedade, depressão e TDAH no Simply Life

Documento de referência para produto, UX e engenharia. **Não é parecer clínico.** O Simply Life organiza rotina; não diagnostica nem substitui psicoterapia, psiquiatria ou emergência.

**Atualizado:** setembro de 2025  
**Escopo:** apps de saúde mental e neurodivergência, lacunas do Simply Life, roadmap de features e módulos de TCC.

---

## 1. Por que este documento existe

Pessoas com ansiedade, depressão ou TDAH frequentemente:

- **Não conseguem iniciar** tarefas grandes (paralisia, “tudo ou nada”).
- **Perdem o dia** sem estrutura visual do tempo (cegueira temporal).
- **Sentem solidão** quando o humor está baixo, mesmo com ferramentas de produtividade.
- **Abandonam apps** que punem (streak agressivo, notificações em excesso, tom de cobrança).

O Simply Life deve ser **institucional, acolhedor sem infantilizar**, com opt-in claro e **um passo por vez** nos dias difíceis.

---

## 2. Síntese por condição (evidência + produto)

### 2.1 Ansiedade

| Aspecto | O que a literatura e apps maduros sugerem | Implicação no Simply Life |
|--------|-------------------------------------------|---------------------------|
| Hipervigilância | Alertas frequentes aumentam tensão (Fitz et al., 2019 — batch vs. contínuo) | Cadência `off` / `once` / `batch3` (9h, 15h, 21h); silêncio 22h–8h |
| Incerteza | Ferramentas de grounding e respiração reduzem pico agudo (Rootd, Wysa) | Botão de crise CVV 188; futuro: exercício de respiração curto |
| Evitação | Tarefas grandes disparam evitação | Quebra em passos (Goblin-like) no capturar e no Task Evolve |
| Catastrofização | TCC ajuda a nomear pensamento → evidência → alternativa | Módulos TCC opt-in (ver §7) |

### 2.2 Depressão

| Aspecto | Evidência / mercado | Implicação |
|--------|---------------------|------------|
| Baixa energia | Micro-tarefas e “menor passo possível” (Goblin Tools, Routinery) | Checklist com 3–7 passos; primeiro passo ≤ 2 min |
| Anedonia | Gamificação leve pode ajudar **sem** culpa por falhar streak | Modo RPG opt-in; sem punição por dia sem abrir |
| Isolamento | Mensagens de validação pós-humor + conexão social (Finch, Woebot — com ressalvas) | Mensagem institucional após check-in; parceiro/círculo |
| Risco | Apps não substituem CVV / SAMU / profissional | Card fixo CVV 188 em Saúde; disclaimer no onboarding |

### 2.3 TDAH

| Aspecto | Evidência / mercado | Implicação |
|--------|---------------------|------------|
| Cegueira temporal | Timeline visual do dia (Tiimo, Routinery) | `HomeDayTimeline` + Kanban dia + Gantt |
| Working memory | Externalizar passos fora da cabeça | Subdivisão Goblin + checklist persistente |
| Dopamina / motivação | Recompensas imediatas e visuais (modo RPG) | Opt-in no onboarding: `gamification_mode: rpg` |
| Hiperfoco vs. dispersão | Um foco por vez na Home | `priorityTodayTasks` + dashboard “um passo” |
| Autodiagnóstico | App não diagnostica | Pergunta “apoio para TDAH?” = preferência, não laudo |

---

## 3. Benchmark de aplicativos (visitados / documentados)

### 3.1 Saúde mental e TCC

| App | Mecânica principal | Lição para Simply Life |
|-----|-------------------|------------------------|
| **Wysa** | Chat + exercícios CBT; tom empático | Jornadas curtas opt-in; linguagem institucional |
| **Woebot** | Diálogo estruturado CBT | Micro-sessões (5–10 min); não competir com terapeuta |
| **Rootd** | Ataque de pânico: grounding + estatísticas | Botão de crise acessível; sem gamificar crise |
| **Headspace** | Mindfulness + sono | Sono já no módulo Saúde; meditação = roadmap |
| **Sanvello** | Trilhas por condição (ansiedade, humor) | Inspira arquitetura modular TCC (§7) |

### 3.2 Neurodivergência e rotina

| App | Mecânica | Lição |
|-----|----------|-------|
| **Tiimo** | Timeline colorida do dia; ícones; sem lista infinita | Timeline na Home; blocos por hora |
| **Goblin Tools** | Magic ToDo: quebra tarefa em passos | `suggestTaskSteps` heurístico + edição manual |
| **Routinery** | Rotina visual + timer entre passos | Integrar com rotina Kanban existente |
| **Bearable** | Correlação humor × hábitos | Humor + hábitos já no Simply Life; relatórios |

### 3.3 O que evitar (lições negativas)

- **Streak punitivo** em humor ou hábitos (Daylio/Fitness apps) — aumenta culpa na depressão.
- **Notificações “você esqueceu”** — Fitz 2019: batch é menos invasivo.
- **Tom de “melhor amigo”** em contexto clínico — usuário pediu tom institucional.
- **Diagnóstico por quiz** — risco ético e regulatório.

---

## 4. Lacunas Simply Life → status de implementação

| Feature | Referência | Status | Onde |
|---------|------------|--------|------|
| Quebra de tarefa (Goblin) | Goblin Magic ToDo | ✅ | `taskBreakdown.ts`, Capturar, Task Evolve |
| Timeline visual (Tiimo) | Tiimo day view | ✅ | `HomeDayTimeline.tsx` na Home |
| Companhia / solidão | Woebot + parceiro | ✅ | `HomeMoodCareMessage`, `HomeCompanionStrip` |
| Botão crise CVV 188 | Rootd / diretrizes BR | ✅ | `CrisisSupportCard` em Saúde |
| Onboarding TDAH + RPG | Tiimo + gamificação | ✅ | Passo 4 do setup, prefs `adhd_support`, `gamification_mode` |
| Módulos TCC | Sanvello / Woebot | 📋 Roadmap | §7 abaixo |
| Respiração guiada | Rootd | 📋 Futuro | Saúde → Cuidados |
| Correlação humor × hábitos | Bearable | Parcial | Relatórios existentes |

---

## 5. Princípios de design (ansiedade / depressão / TDAH)

1. **Um passo visível** — Home mostra prioridade + timeline, não lista infinita.
2. **Opt-in sempre** — humor, alertas, RPG, TCC: usuário escolhe.
3. **Sem diagnóstico** — escalas são registro pessoal (1–5), não PHQ-9/GAD-7 clínico.
4. **Crise fora do fluxo gamificado** — CVV 188 sempre visível em Saúde.
5. **Quebra antes de cobrar** — subdividir tarefa antes de pedir prazo ou prioridade alta.
6. **Tom institucional** — AXEL apoia; não julga, não usa gíria, não faz piada com sofrimento.
7. **Paridade mobile** — funcionalidades web preservadas (regra `no-feature-removal`).

---

## 6. Política de notificações (Fitz et al., 2019)

- **Problema:** push contínuo de bem-estar correlaciona com mais ansiedade em alguns perfis.
- **Solução Simply Life:** `notify_cadence`: `off` (padrão no setup), `once` (~11h), `batch3` (9h, 15h, 21h).
- **Quiet hours:** 22h–8h sem push de bem-estar/finanças.
- **Medicamentos:** lembrete por horário cadastrado (necessidade clínica separada).

Implementação: `packages/shared/src/notifyPolicy.ts`, `api/_lib/notifyCadence.js`.

---

## 7. Como integrar módulos de TCC (Terapia Cognitivo-Comportamental)

### 7.1 O que é (em produto, não em clínica)

TCC trabalha **pensamento → emoção → comportamento**. Em apps, isso vira **jornadas curtas** com exercícios guiados, não substituindo sessão com psicólogo.

### 7.2 Arquitetura recomendada

```
packages/shared/src/tcc/
  journeys.ts      # trilhas: ansiedade | humor-baixo | procrastinação
  exercises.ts     # passos: registro, reestruturação, comportamento
  copy.ts          # textos institucionais PT-BR

apps/mobile/app/tcc/
  [journeyId].tsx  # uma tela por jornada

apps/mobile/src/components/tcc/
  ThoughtRecordSheet.tsx   # 3 colunas: situação | pensamento | alternativa
  BehaviorActivationCard.tsx  # 1 micro-ação agendável → vira tarefa
  TccModuleList.tsx        # catálogo opt-in
```

**Persistência:** tabela `tcc_journal_entries` (user_id, journey_id, step_id, payload JSON, created_at) — separada de humor diário.

**Regras:**

- Opt-in explícito no onboarding ou Saúde → “Exercícios de TCC”.
- Cada jornada: 5–12 min, 3–7 telas, salva rascunho.
- **Nunca** dar diagnóstico (“você tem TAG”).
- Link para CVV 188 se usuário indicar risco na jornada.
- Conteúdo revisado por profissional de saúde mental antes de produção.

### 7.3 Trilhas sugeridas (MVP)

| Trilha | Passos | Ligação Simply Life |
|--------|--------|---------------------|
| **Registro de pensamento** | Situação → pensamento automático → evidências a favor/contra → pensamento alternativo | Salva no diário; opcional export PDF |
| **Ativação comportamental** | Escolher 1 ação de 5–15 min → agendar hoje | Cria tarefa com checklist de 1 item |
| **Exposição gradual** (ansiedade leve) | Hierarquia de evitação → próximo passo menor | Lista Kanban “evitar” com passos |
| **Defusão** | “Estou tendo o pensamento de que…” | Texto + respiração 4-7-8 (futuro) |

### 7.4 Inspiração por app

- **Woebot:** diálogo ramificado com validação emocional antes da técnica.
- **Sanvello:** módulos por “momento” (agora vs. plano semanal).
- **Rootd:** botão de crise sempre acessível **fora** da trilha TCC.

### 7.5 Roadmap de entrega

| Fase | Entrega | Esforço |
|------|---------|---------|
| **P0** | Card “TCC em breve” + link para diário e CVV | 1 sprint |
| **P1** | `ThoughtRecordSheet` + 1 jornada “Pensamento difícil” | 2 sprints |
| **P2** | Ativação comportamental → tarefa | 1 sprint |
| **P3** | Trilhas ansiedade / humor com analytics anônimos | 2+ sprints |
| **P4** | Revisão clínica + A/B de copy institucional | contínuo |

### 7.6 Métricas de sucesso (não clínicas)

- Taxa de conclusão de jornada (sem punir abandono).
- Tarefas criadas a partir de ativação comportamental.
- NPS em Saúde; **não** usar humor médio como KPI de “sucesso terapêutico”.

---

## 8. Referências

- Fitzpatrick, K. K., et al. (2019). Delivering Cognitive Behavior Therapy to Young Adults With Symptoms of Depression and Anxiety Using a Fully Automated Conversational Agent (Woebot). *JMIR Mental Health*.
- CVV — Centro de Valorização da Vida: **188** (24h, Brasil).
- Goblin Tools — Magic ToDo (quebra de tarefas): https://goblin.tools
- Tiimo — planejamento visual para neurodivergência: https://www.tiimoapp.com
- Política interna Simply Life: `notifyPolicy.ts`, `axelVoice.ts`, regras `.cursor/rules/`

---

## 9. Checklist de aceite (produto)

- [ ] Usuário consegue subdividir tarefa no capturar sem sair do fluxo.
- [ ] Timeline do dia visível na Home sem abrir Kanban.
- [ ] Após humor ≤ 2, mensagem institucional + opção de conectar parceiro.
- [ ] CVV 188 em Saúde com um toque (ligar / copiar número).
- [ ] Onboarding pergunta apoio TDAH e modo RPG sem exigir diagnóstico.
- [ ] Documento TCC lido pela equipe antes de implementar P1.

---

*Este documento deve ser atualizado quando novas trilhas TCC ou integrações clínicas forem aprovadas.*
