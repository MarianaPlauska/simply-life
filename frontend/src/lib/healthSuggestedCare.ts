import type { CuidadosTab } from './healthRoute'
import type { HealthRitualSnapshot } from './healthRitual'
import type { DoseHoje } from './medicamentosSchedule'
import { isAguaRitualComplete } from './healthRitual'

export type SuggestedCareKind =
  | 'humor'
  | 'agua'
  | 'medicamento'
  | 'alimentacao'
  | 'treino'
  | 'complete'

export interface SuggestedCare
{
  kind: SuggestedCareKind
  tab: CuidadosTab
  title: string
  detail: string
  cta: string
}

export interface CareChipContext
{
  aguaHabit: boolean
  medicamentosCount: number
  proteinaHabit: boolean
  treinoHabit: boolean
}

/** Chips visíveis — sempre mostrar os quatro; cadastro acontece ao abrir */
export function visibleCareChips(_ctx: CareChipContext): CuidadosTab[]
{
  return ['hidratacao', 'alimentacao', 'medicamentos', 'academia']
}

export function pickSuggestedCare(opts: {
  snapshot: HealthRitualSnapshot
  aguaCopos: number
  aguaMeta: number
  proximaDose: DoseHoje | null
  proteinaDone: boolean
  proteinaActive: boolean
  treinoPending: boolean
  treinoActive: boolean
}): SuggestedCare
{
  const {
    snapshot,
    aguaCopos,
    aguaMeta,
    proximaDose,
    proteinaDone,
    proteinaActive,
    treinoPending,
    treinoActive,
  } = opts

  if (snapshot.allCoreDone && (!treinoActive || !treinoPending))
  {
    return {
      kind: 'complete',
      tab: 'hidratacao',
      title: 'Tudo em dia por agora',
      detail: 'Seu ritual de hoje está guardado. O AXEL segue por perto.',
      cta: 'Ver diário',
    }
  }

  if (!snapshot.moodLoggedToday)
  {
    return {
      kind: 'humor',
      tab: 'hidratacao',
      title: 'Como você está agora?',
      detail: 'Um toque no humor ajuda o AXEL a te acolher melhor hoje.',
      cta: 'Registrar humor',
    }
  }

  if (!isAguaRitualComplete(aguaCopos, aguaMeta))
  {
    return {
      kind: 'agua',
      tab: 'hidratacao',
      title: 'Hidratação',
      detail: aguaMeta > 0
        ? `${aguaCopos} de ${aguaMeta} copos — mais um copo já conta.`
        : 'Um copo de água é um gesto simples de cuidado.',
      cta: '+1 copo',
    }
  }

  if (proximaDose && proximaDose.status !== 'tomado')
  {
    return {
      kind: 'medicamento',
      tab: 'medicamentos',
      title: proximaDose.nome,
      detail: `Horário ${proximaDose.horario} — quando tomar, é só confirmar.`,
      cta: 'Já tomei',
    }
  }

  if (proteinaActive && !proteinaDone)
  {
    return {
      kind: 'alimentacao',
      tab: 'alimentacao',
      title: 'Alimentação',
      detail: 'Registre uma refeição rápida — sem formulário longo.',
      cta: 'Abrir comida',
    }
  }

  if (treinoActive && treinoPending)
  {
    return {
      kind: 'treino',
      tab: 'academia',
      title: 'Movimento de hoje',
      detail: 'Um bloco curto já vale — comece quando puder.',
      cta: 'Iniciar treino',
    }
  }

  return {
    kind: 'complete',
    tab: 'hidratacao',
    title: 'Tudo em dia por agora',
    detail: 'Seu ritual de hoje está guardado. O AXEL segue por perto.',
    cta: 'Ver diário',
  }
}
