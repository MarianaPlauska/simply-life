// Trilha AXEL — níveis, XP e desbloqueios (Finch + Duolingo + LifeForge)

import type { UserWorkspacePrefs } from './userWorkspacePrefs'
import type { DashboardWidgetId } from './dashboardWidgets'
import { XP_PER_LEVEL, DAILY_XP_CAP } from './xpEconomy'

export type XpModule = 'foco' | 'vitalidade' | 'estabilidade'

export interface XpSourceRule
{
  id: string
  module: XpModule
  emoji: string
  action: string
  xp: string
  hint: string
}

export interface TrailMilestone
{
  level: number
  title: string
  reward: string
  funCopy: string
  cosmeticIds?: string[]
  /** Recurso de produto liberado neste nível */
  featureUnlock?: string
}

/** Como ganhar XP — visível na trilha (pesquisa: feedback claro = retenção) */
export const XP_SOURCE_RULES: XpSourceRule[] = [
  {
    id: 'task',
    module: 'foco',
    emoji: '⚡',
    action: 'Concluir tarefa no Kanban',
    xp: '+8 a +28',
    hint: 'Score de urgência com teto — não pula níveis de uma vez.',
  },
  {
    id: 'focus',
    module: 'foco',
    emoji: '🎯',
    action: 'Sessão de foco / Pomodoro',
    xp: '+12',
    hint: 'Minutos registrados somam ao módulo Foco.',
  },
  {
    id: 'streak',
    module: 'foco',
    emoji: '🔥',
    action: 'Salvar a ofensiva do dia',
    xp: 'ofensiva',
    hint: '1 tarefa + humor/ritual = dia válido (sem XP extra automático).',
  },
  {
    id: 'water',
    module: 'vitalidade',
    emoji: '💧',
    action: 'Registrar água, medicamento ou treino',
    xp: '+5 a +12',
    hint: 'Pequenas vitórias contam — estilo Finch.',
  },
  {
    id: 'mood',
    module: 'vitalidade',
    emoji: '💛',
    action: 'Check-in de humor',
    xp: '+5',
    hint: 'Calibrar o AXEL para o seu dia.',
  },
  {
    id: 'finance',
    module: 'estabilidade',
    emoji: '💰',
    action: 'Lançar movimento financeiro',
    xp: '+5 a +15',
    hint: 'Reconciliar e fechar mês valem um pouco mais.',
  },
  {
    id: 'quest',
    module: 'foco',
    emoji: '📜',
    action: 'Completar missão diária',
    xp: '+5 a +8',
    hint: 'Aparece no dashboard e no Kanban.',
  },
  {
    id: 'daily_cap',
    module: 'foco',
    emoji: '⏳',
    action: 'Teto diário de XP',
    xp: `${DAILY_XP_CAP}/dia`,
    hint: `${XP_PER_LEVEL} XP por nível — ~6 dias ativos para subir.`,
  },
]

export interface TrailSkillNode
{
  level: number
  module: XpModule
  skill: string
  unlock: string
  emoji: string
}

/** Trilha estilo Duolingo — nós de habilidade por nível */
export const TRAIL_SKILL_PATH: TrailSkillNode[] = [
  { level: 1, module: 'foco', skill: 'Ofensiva', unlock: 'Dashboard + streak', emoji: '🔥' },
  { level: 2, module: 'vitalidade', skill: 'Hidratação', unlock: 'Widget água', emoji: '💧' },
  { level: 3, module: 'foco', skill: 'Consulta AXEL', unlock: 'Posso fazer hoje?', emoji: '💬' },
  { level: 3, module: 'vitalidade', skill: 'Capacidade', unlock: 'Termômetro do dia', emoji: '🌡️' },
  { level: 4, module: 'foco', skill: 'Episódio', unlock: 'Narrativa semanal', emoji: '📖' },
  { level: 5, module: 'estabilidade', skill: 'Círculo', unlock: 'Convidar amigos', emoji: '👥' },
  { level: 5, module: 'estabilidade', skill: 'Posso comprar?', unlock: 'E11 no lançamento', emoji: '🛒' },
  { level: 7, module: 'foco', skill: 'Coach IA', unlock: 'Tom direto + layout', emoji: '🎯' },
  { level: 8, module: 'vitalidade', skill: 'Sinais', unlock: 'Notas → nudges', emoji: '📝' },
  { level: 9, module: 'estabilidade', skill: 'Previsão', unlock: 'Mini forecast 7 dias', emoji: '📅' },
  { level: 10, module: 'foco', skill: 'Veterano', unlock: 'Molduras + badge', emoji: '🛡️' },
  { level: 11, module: 'vitalidade', skill: 'Recuperação', unlock: 'Modo automático Finch', emoji: '🌿' },
  { level: 15, module: 'vitalidade', skill: 'Aura', unlock: 'Recap com estilo', emoji: '✨' },
  { level: 20, module: 'foco', skill: 'Mestre', unlock: 'Endgame cosmético', emoji: '👑' },
]

export const TRAIL_MILESTONES: TrailMilestone[] = [
  {
    level: 1,
    title: 'Recruta',
    reward: 'Dashboard + ofensiva',
    funCopy: 'Você entrou na série. Um check-in por dia já conta.',
  },
  {
    level: 2,
    title: 'Primeiro brilho',
    reward: 'Tom Cobre + widget Água',
    funCopy: 'Hidratação vira ritual — igual Waterllama, mas no seu Life OS.',
    cosmeticIds: ['accent_copper'],
    featureUnlock: 'widget_água',
  },
  {
    level: 3,
    title: 'Operador em formação',
    reward: 'Cores Céu e Floresta + Consulta AXEL',
    funCopy: 'Pergunte “posso fazer isso hoje?” — compras, compromissos, projetos.',
    cosmeticIds: ['accent_sky', 'accent_forest'],
    featureUnlock: 'capacidade_do_dia',
  },
  {
    level: 4,
    title: 'Narrador da própria vida',
    reward: 'Episódio semanal no dashboard',
    funCopy: 'Sua semana vira capítulo — não só números.',
    featureUnlock: 'episodio_dashboard',
  },
  {
    level: 5,
    title: 'Operador',
    reward: 'Badge ⚡ + convidar amigos',
    funCopy: 'Você provou consistência. Hora de trazer o círculo.',
    cosmeticIds: ['badge_operator'],
    featureUnlock: 'convites',
  },
  {
    level: 6,
    title: 'Equilíbrio fino',
    reward: 'Cor Violeta',
    funCopy: 'Finanças, tarefas e humor em um só lugar.',
    cosmeticIds: ['accent_violet'],
  },
  {
    level: 7,
    title: 'Coach direto',
    reward: 'Tom IA direto + reordenar dashboard',
    funCopy: 'O AXEL fala menos rodeio — você manda no layout.',
    cosmeticIds: ['ai_tone_direct'],
    featureUnlock: 'dashboard_custom',
  },
  {
    level: 8,
    title: 'Leitor de sinais',
    reward: 'Notas viram pistas do AXEL',
    funCopy: 'Diário e anotações alimentam nudges explicáveis — 1 por dia, tom Finch.',
    featureUnlock: 'sinais_notas',
  },
  {
    level: 9,
    title: 'Cartógrafo da semana',
    reward: 'Previsão 7 dias no dashboard',
    funCopy: 'Contas, ritmo de gasto e humor — mini forecast sem planilha.',
    featureUnlock: 'forecast_7d',
  },
  {
    level: 10,
    title: 'Veterano',
    reward: 'Badge 🛡️ + moldura episódio',
    funCopy: 'Endgame começa: coleção e história importam mais que pontos.',
    cosmeticIds: ['badge_veteran', 'ai_tone_coach_plus'],
  },
  {
    level: 11,
    title: 'Guardião gentil',
    reward: 'Modo recuperação automático',
    funCopy: 'Humor baixo + carga alta? O AXEL reduz o dia sozinho — estilo Finch.',
    featureUnlock: 'recuperacao_auto',
  },
  {
    level: 15,
    title: 'Moldura veterana',
    reward: 'Aura no recap semanal',
    funCopy: 'Sua ofensiva aparece no episódio com estilo.',
    cosmeticIds: ['frame_level_15'],
  },
  {
    level: 20,
    title: 'Mestre',
    reward: 'Badge 👑',
    funCopy: 'Você não usa o app — você vive a série.',
    cosmeticIds: ['badge_master'],
  },
]

const MODULE_LABELS: Record<XpModule, string> = {
  foco: 'Foco',
  vitalidade: 'Vitalidade',
  estabilidade: 'Estabilidade',
}

export function moduleLabel(m: XpModule): string
{
  return MODULE_LABELS[m]
}

export function getMilestone(level: number): TrailMilestone | undefined
{
  return TRAIL_MILESTONES.find((m) => m.level === level)
}

export function getNextMilestone(level: number): TrailMilestone | null
{
  const next = TRAIL_MILESTONES.find((m) => m.level > level)
  return next ?? null
}

export function describeLevelUp(level: number): string
{
  const m = getMilestone(level)
  if (!m) return `Nível ${level} — continue explorando a trilha.`
  const parts = [m.reward]
  if (m.featureUnlock)
  {
    parts.push(m.featureUnlock.replace(/_/g, ' '))
  }
  return `${m.title}: ${parts.join(' · ')}`
}

function ensureWidget(widgets: DashboardWidgetId[] | undefined, id: DashboardWidgetId): DashboardWidgetId[]
{
  const base = widgets ?? []
  if (base.includes(id)) return base
  const next = [...base, id]
  if (next.length <= 3) return next
  return [id, ...base.filter((w) => w !== id)].slice(0, 3)
}

/** Desbloqueios automáticos de produto ao subir de nível (retenção D1–D14) */
export function buildLevelUnlockPatch(
  level: number,
  prefs: UserWorkspacePrefs,
): Partial<UserWorkspacePrefs> | null
{
  const patch: Partial<UserWorkspacePrefs> = {}
  let changed = false

  if (level >= 2)
  {
    const widgets = ensureWidget(prefs.dashboard_quick_widgets, 'water')
    if (JSON.stringify(widgets) !== JSON.stringify(prefs.dashboard_quick_widgets))
    {
      patch.dashboard_quick_widgets = widgets
      changed = true
    }
  }

  if (level >= 7 && prefs.ai_coach_enabled === false)
  {
    patch.ai_coach_enabled = true
    changed = true
  }

  return changed ? patch : null
}

export function arquetipoLabel(level: number): string
{
  if (level >= 20) return 'Mestre'
  if (level >= 10) return 'Veterano'
  if (level >= 5) return 'Operador'
  if (level >= 3) return 'Aprendiz'
  return 'Recruta'
}

export { XP_PER_LEVEL }
