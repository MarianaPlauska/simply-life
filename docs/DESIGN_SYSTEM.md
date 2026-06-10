# Design System — Simply-Life OS · Instrumento

## Filosofia

O Simply-Life **não imita landing pages de SaaS com IA** (navy + roxo + glassmorphism + cards pill). A direção visual é **editorial/instrumental**: tipografia com personalidade, superfícies sólidas, um único acento cobre e cantos quase retos — como um painel de controle sério, não um template de vibe-coding.

**Princípios:**

1. **Um acento só** — cobre (`accent`). Urgência, atenção e sucesso usam tokens semânticos, não arco-íris de neon.
2. **Sem glassmorphism** — nada de `backdrop-blur`, glow no hover ou gradientes decorativos em texto.
3. **Tipografia em três vozes** — Newsreader (títulos), IBM Plex Sans (UI), IBM Plex Mono (rótulos e números).
4. **Cantos retos** — `rounded-sl` (2px). Evitar `rounded-2xl` em containers principais.
5. **Tokens primeiro** — usar `orionSurfaces.ts` e classes Tailwind semânticas (`bg-fundo`, `text-ink`), não `zinc-*` / `indigo-*` soltos.

---

## Tokens CSS (`index.css`)

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `--sl-canvas` | `#F4F1EA` | `#141312` | Fundo da página |
| `--sl-chrome` | `#EDE9E0` | `#1C1B19` | Sidebar, header, footer |
| `--sl-surface` | `#FFFFFF` | `#232220` | Cards e painéis |
| `--sl-elevated` | `#FAF8F4` | `#2A2926` | Hover, inputs |
| `--sl-text` | `#1A1814` | `#E8E6E1` | Texto primário |
| `--sl-text-muted` | `#6B6560` | `#9C9890` | Texto secundário |
| `--sl-border` | `#D8D3C8` | `#2E2C28` | Bordas |
| `--sl-accent` | `#9A5B1A` | `#C17F3A` | Acento único |
| `--sl-urgent` | `#B83A3A` | `#C44D4D` | Crítico |
| `--sl-attention` | `#A67C00` | `#C9A227` | Alerta |
| `--sl-success` | `#3D6B4F` | `#4A7C59` | Concluído / OK |

---

## Tailwind semântico (`tailwind.config.js`)

```
fundo · chrome · card · elevated · ink · ink-muted · line
accent · accent-hover · accent-muted
urgente · atencao · concluido
font-sans · font-display · font-mono
rounded-sl
```

---

## Constantes TS (`frontend/src/constants/orionSurfaces.ts`)

Importar deste arquivo em componentes — **não duplicar strings de classe**.

| Constante | Uso |
|-----------|-----|
| `ORION_CANVAS` | Fundo do main |
| `ORION_CHROME_PLANE` | Sidebar, header |
| `ORION_BORDERLESS_PANEL` / `ORION_ANALYTICS_CARD` | Painel com borda |
| `ORION_SECTION_TITLE` | Rótulo de seção (mono, uppercase) |
| `ORION_TEXT_PRIMARY` / `ORION_TEXT_SECONDARY` | Texto |
| `ORION_FILTER_PILL_*` | Filtros temporais |
| `ORION_PROGRESS` | Barra de progresso (sólida, sem gradiente) |
| `ORION_BTN_PRIMARY` | Botão primário |
| `ORION_NAV_ACTIVE` / `ORION_NAV_IDLE` | Itens de navegação |
| `ORION_LINK` | Links discretos |
| `ORION_ROW_HOVER` | Linhas clicáveis |
| `ORION_DROPDOWN` | Menus suspensos |

### Classes utilitárias (`index.css`)

| Classe | Uso |
|--------|-----|
| `.sl-eyebrow` | Rótulo accent, mono, uppercase |
| `.sl-panel` | Painel padrão (surface + border + 2px) |
| `.sl-ruled-bg` | Grade de fundo sutil (login) |

---

## Tipografia

| Papel | Fonte | Exemplo |
|-------|-------|---------|
| Display | Newsreader | Títulos de página, saudação |
| UI | IBM Plex Sans | Corpo, botões |
| Mono | IBM Plex Mono | Rótulos, KPIs, status |

**Hierarquia no dashboard:**

- Eyebrow: `.sl-eyebrow` ou `ORION_SECTION_TITLE`
- Título de página: `text-3xl md:text-4xl font-display`
- Título de seção: `text-xl font-display`
- Título de card: `text-[13px] font-semibold`
- Corpo: `text-[13px]` + `ORION_TEXT_PRIMARY`
- Meta: `text-[11px]` + `ORION_TEXT_SECONDARY` ou `font-mono`

**Evitar:** `font-black`, gradiente em texto, `tracking-widest` em excesso, emojis como decoração.

---

## Superfícies e cards

**Padrão (substitui GlassCard antigo):**

```tsx
<article className={ORION_ANALYTICS_CARD}>
  {/* conteúdo */}
</article>
```

Ou diretamente: `className="sl-panel p-6"`.

**Proibido em containers principais:**

- `bg-zinc-900/30 backdrop-blur-*`
- `rounded-[2rem]` / `rounded-3xl`
- `shadow-2xl` com glow colorido
- Gradientes radiais de fundo (orbs roxos)

**Hover:** `hover:border-ink-muted/50` ou `ORION_ROW_HOVER` — sem `scale` exagerado.

---

## Cores de estado

| Estado | Classe |
|--------|--------|
| Urgência alta (>90) | `text-urgente` |
| Urgência média (>70) | `text-atencao` |
| Neutro | `text-ink-muted` |
| Sucesso | `text-concluido` |
| Acento / link | `text-accent` |

Gráficos: paleta em `useOrionChartTheme.ts` — linhas e áreas usam cobre, não roxo.

---

## Dashboard — layout enterprise

O dashboard segue uma **narrativa vertical** ao rolar (centro de comando → escopo → operação → indicadores → finanças/IA → analytics):

| Bloco | Componente | Função |
|-------|------------|--------|
| Faixa superior | `DashboardCommandBar` | KPIs densos + selos de confiança (sessão, sync, TLS) |
| Registro | `DashboardModulesRegistry` | 6 pilares clicáveis — mostra que o OS é completo |
| 01 Execução | `DashboardCriticalTasksPreview` + `SystemStatePanel` + `UserStatus` | Fila crítica, carga operacional, operador |
| 02 Indicadores | `QuickStatsBar` | Saúde e finanças em mini-cards |
| 03 Operacional | `FinancasTabelaDensa` + `InboxIACard` + `AtividadeRecenteCard` | Tabela, IA, auditoria |
| 04 Analytics | `HolisticAnalyticsSection` | Gráficos holísticos |

**Densidade:** `max-w-[1600px]`, `gap-3` entre painéis, bordas `border-line` contínuas — sem áreas vazias largas.

**Cabeçalho de painel:** usar `DashboardPanel` com `section="01"` etc. para numeração editorial.

---

## Kanban (Task Board)

O Kanban é o **centro de execução** — mesma densidade editorial do dashboard, inspirado no redesign do Linear (hierarquia em camadas, superfícies neutras, acento contido).

### Camadas (de cima para baixo)

| Camada | Componente | Função |
|--------|------------|--------|
| Título + ações | `KanbanView` header | Centro de Execução — não “Task Board” genérico |
| Comando | `KanbanCommandBar` | KPIs em células (`Pipeline`, `Hoje`, carga, críticos) |
| Hoje | `KanbanTodayPanel` | Fila ordenada + detalhe compacto + drop zone (sem coluna duplicada) |
| Planejamento | `ORION_KANBAN_PLAN_SHELL` | Semana + Backlog à direita, assimétrico |
| Conquistas | `OrionAchievementTrail` | Faixa inferior monocromática |

### Princípios (benchmark: Linear, enterprise PM)

| Padrão | Implementação |
|--------|----------------|
| Prioridade discreta | Barra lateral 3px + dot 6px — não card inteiro colorido |
| Board unificado | Uma borda externa; colunas separadas por linha vertical |
| Referência editorial | `SL-0001` mono + tag + título `font-display` |
| Ações no hover | Barra inferior do card (Iniciar / Abrir) — não botão sempre visível |
| Coluna numerada | `01 · Hoje` + subtítulo + Σ pts no rodapé |
| Drop zone vazia | Borda tracejada + copy de arrastar |

### Arquivos-chave

| Peça | Arquivo |
|------|---------|
| Tokens | `constants/orionKanbanTheme.ts` |
| Utilitários | `lib/kanbanVisual.ts` |
| Comando KPI | `KanbanCommandBar.tsx` |
| Card / Coluna | `OrionKanbanCard.tsx`, `OrionKanbanColumn.tsx` |
| Orquestrador | `KanbanView.tsx` |

---

## Migração por área

Ordem sugerida (do mais visível ao menos):

1. **Dashboard** — `DashboardView`, `HolisticAnalyticsSection`, `UserStatus`, `DashboardCriticalTasksPreview`
2. **Chrome** — Sidebar, header, footer, mobile nav *(já migrado)*
3. **Auth** — Login, reset *(já migrado)*
4. **Kanban** — cards, colunas, toolbar *(fase 1 migrado)* · drawer/foco *(fase 2)*
5. **Finanças · Saúde · Configurações**

**Checklist por componente:**

- [ ] Trocar `zinc-*` / `indigo-*` / `violet-*` por tokens semânticos
- [ ] Trocar `rounded-xl`/`rounded-2xl` por `rounded-sl`
- [ ] Remover gradientes decorativos
- [ ] Títulos com `font-display`; rótulos com `font-mono`
- [ ] Importar tokens de `orionSurfaces.ts`

---

## Componente painel (referência)

```tsx
import { ORION_ANALYTICS_CARD, ORION_SECTION_TITLE, ORION_TEXT_PRIMARY } from '@/constants/orionSurfaces'

export function ExemploCard() {
  return (
    <section className={ORION_ANALYTICS_CARD}>
      <p className={ORION_SECTION_TITLE}>Seção</p>
      <h3 className={`text-[13px] font-semibold mt-1 ${ORION_TEXT_PRIMARY}`}>Título</h3>
    </section>
  )
}
```

---

## O que foi descontinuado

| Antigo | Substituir por |
|--------|----------------|
| Glassmorphism UI01 | `sl-panel` / `ORION_BORDERLESS_PANEL` |
| `rounded-[2rem]` UI02 | `rounded-sl` |
| Ambient orbs violet UI04 | Fundo `bg-fundo` plano |
| `GlassCard` com glow | `GlassCard` sem glow (wrapper `sl-panel`) |
| Paleta violet/indigo | `accent`, `urgente`, `atencao`, `concluido` |
