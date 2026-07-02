// Trilha AXEL — níveis, XP e desbloqueios (Finch + Duolingo + LifeForge)

import type { UserWorkspacePrefs } from './userWorkspacePrefs'
import type { DashboardWidgetId } from './dashboardWidgets'
import { XP_PER_LEVEL } from './gamificationProfile'

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
    xp: '= score de urgência',
    hint: 'Tarefa crítica vale mais. Main Quest dá bônus.',
  },
  {
    id: 'focus',
    module: 'foco',
    emoji: '🎯',
    action: 'Sessão de foco / Pomodoro',
    xp: '+10 a +30',
    hint: 'Minutos registrados somam ao módulo Foco.',
  },
  {
    id: 'streak',
    module: 'foco',
    emoji: '🔥',
    action: 'Salvar a ofensiva do dia',
    xp: '+15',
    hint: '1 tarefa + humor/ritual = dia válido.',
  },
  {
    id: 'water',
    module: 'vitalidade',
    emoji: '💧',
    action: 'Registrar água, medicamento ou treino',
    xp: '+10 a +20',
    hint: 'Pequenas vitórias contam — estilo Finch.',
  },
  {
    id: 'mood',
    module: 'vitalidade',
    emoji: '💛',
    action: 'Check-in de humor',
    xp: '+10',
    hint: 'Calibrar o AXEL para o seu dia.',
  },
  {
    id: 'finance',
    module: 'estabilidade',
    emoji: '💰',
    action: 'Lançar movimento financeiro',
    xp: '+8 a +50',
    hint: 'Reconciliar e fechar mês valem mais.',
  },
  {
    id: 'quest',
    module: 'foco',
    emoji: '📜',
    action: 'Completar missão diária',
    xp: '+25 a +40',
    hint: 'Aparece no dashboard e no Kanban.',
  },
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
    reward: 'Cores Céu e Floresta',
    funCopy: 'Personalize o AXEL — corpo e mente começam a conversar.',
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
    level: 10,
    title: 'Veterano',
    reward: 'Badge 🛡️ + moldura episódio',
    funCopy: 'Endgame começa: coleção e história importam mais que pontos.',
    cosmeticIds: ['badge_veteran', 'ai_tone_coach_plus'],
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

  if (level >= 4 && !prefs.privacy.show_episode)
  {
    patch.privacy = { ...prefs.privacy, show_episode: true }
    changed = true
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
