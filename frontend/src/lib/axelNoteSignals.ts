// Anotações como sinais - regras explicáveis para o AXEL

import { buildUnifiedNoteSnippet } from './axelUnifiedNotes'

export type NoteSignalKind =
  | 'compra_pendente'
  | 'ansiedade_financeira'
  | 'presente'
  | 'trabalho_extra'
  | 'autocuidado'

export interface NoteSignal
{
  kind: NoteSignalKind
  snippet: string
  weight: number
}

export interface NoteSignalNudge
{
  title: string
  body: string
  action?: 'kanban' | 'finance' | 'wellbeing' | 'defer_purchase'
  rules: string[]
}

const RULES: Record<NoteSignalKind, { re: RegExp; label: string }> = {
  compra_pendente: { re: /comprar|presente|pedir|encomendar/i, label: 'intenção de compra na nota' },
  ansiedade_financeira: { re: /ansios|preocup|apertad|sem dinheiro|conta|boleto|dívida/i, label: 'ansiedade financeira no texto' },
  presente: { re: /presente|mãe|pai|aniversário|natal/i, label: 'presente mencionado' },
  trabalho_extra: { re: /projeto|freelance|cliente|proposta|demanda extra/i, label: 'trabalho extra na nota' },
  autocuidado: { re: /cansad|exaust|burnout|descans|sono ruim/i, label: 'pedido de autocuidado' },
}

export function extractNoteSignals(text: string): NoteSignal[]
{
  const t = text.trim()
  if (!t) return []

  const out: NoteSignal[] = []
  for (const [kind, { re }] of Object.entries(RULES) as [NoteSignalKind, { re: RegExp; label: string }][])
  {
    if (re.test(t))
    {
      out.push({
        kind,
        snippet: t.slice(0, 120),
        weight: kind === 'ansiedade_financeira' ? 3 : 2,
      })
    }
  }
  return out
}

export function buildNoteSignalNudge(
  signals: NoteSignal[],
  ctx: {
    impulseRisk?: boolean
    kanbanLoadPct?: number
    lazerBudgetPct?: number
  },
): NoteSignalNudge | null
{
  if (!signals.length) return null

  const rules: string[] = []
  const kinds = new Set(signals.map((s) => s.kind))

  if (kinds.has('ansiedade_financeira') || (kinds.has('compra_pendente') && ctx.impulseRisk))
  {
    rules.push(RULES.ansiedade_financeira.label, 'humor + folga financeira')
    return {
      title: 'Respire antes de gastar',
      body: 'Sua nota e o humor de hoje pedem cautela. Que tal adiar compras não essenciais?',
      action: 'defer_purchase',
      rules,
    }
  }

  if (kinds.has('presente') || kinds.has('compra_pendente'))
  {
    rules.push(RULES.compra_pendente.label, 'orçamento lazer/presentes')
    return {
      title: 'Presente virou missão?',
      body: 'Posso sugerir uma main quest leve no Kanban - sem pressão de comprar hoje.',
      action: 'kanban',
      rules,
    }
  }

  if (kinds.has('trabalho_extra') && (ctx.kanbanLoadPct ?? 0) >= 70)
  {
    rules.push(RULES.trabalho_extra.label, 'cap Kanban alto')
    return {
      title: 'Projeto extra na fila',
      body: 'Sua nota fala em demanda - o Kanban já está cheio. Negocie prazo antes de aceitar.',
      action: 'kanban',
      rules,
    }
  }

  if (kinds.has('autocuidado'))
  {
    rules.push(RULES.autocuidado.label, 'modo recuperação')
    return {
      title: 'Dia de menos é válido',
      body: 'Registrei seu cansaço. Priorize ritual e humor - tarefas pesadas podem esperar.',
      action: 'wellbeing',
      rules,
    }
  }

  return null
}

export function mergeRecentNoteText(
  anotacoes: { conteudo?: string | null; titulo?: string | null; updated_at?: string }[],
  entradas: { conteudo?: string | null; data?: string | null; created_at?: string | null }[],
  limit = 3,
): string
{
  return buildUnifiedNoteSnippet(anotacoes, entradas, limit + 1, 280)
}
