import type { MobileTask } from './tasks'
import { taskListId } from './lifeCategories'

export type TaskOutcome = 'completed' | 'left_for_later'
export type TaskTopicStats = { completed: number; leftForLater: number }

const TOPICS: { key: string; pattern: RegExp }[] = [
  { key: 'health', pattern: /sa[uú]de|agua|água|treino|academia|m[eé]dic|sono|humor|prote[ií]na|caminh|yoga|consulta/i },
  { key: 'learning', pattern: /estud|curso|ler|leitura|aprend|idioma|h[aá]bito|crescimento|meta|livro/i },
  { key: 'work', pattern: /trabalho|reuni[aã]o|relat[oó]rio|cliente|carreira|projeto|e-?mail|standup|sprint|entrega/i },
  { key: 'money', pattern: /pagar|conta|boleto|banco|dinheiro|imposto|fatura|or[cç]amento|compra/i },
  { key: 'home', pattern: /casa|limpar|lavar|roupa|cozinha|mercado|lou[cç]a|organizar|arrumar/i },
]

/** Agrupa por pasta da pessoa; sem pasta, infere o assunto pelo texto, nunca pela prioridade. */
export function taskHabitTopic(task: MobileTask): string
{
  const list = taskListId(task)
  if (list) return `list:${list}`
  const text = `${task.titulo} ${task.anotacao}`
  return TOPICS.find((topic) => topic.pattern.test(text))?.key ?? 'routine'
}

/** Modificador pequeno e limitado: o histórico só desempata tarefas do mesmo dia. */
export function taskHabitKeepAdjustment(topic: string, stats?: Record<string, TaskTopicStats>): number
{
  const sample = stats?.[topic]
  if (!sample) return 0
  const total = sample.completed + sample.leftForLater
  if (total < 3) return 0
  return Math.max(-12, Math.min(12, Math.round(((sample.completed - sample.leftForLater) / total) * 12)))
}
