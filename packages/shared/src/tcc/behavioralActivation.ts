/** Ativação comportamental (TCC) — uma micro-ação agendável. */

export type BehavioralActivationDraft = {
  barrier: string
  action: string
  durationMin: 5 | 10 | 15
}

export type BehavioralActivationEntry = BehavioralActivationDraft & {
  id: string
  createdAt: string
}

export const BEHAVIORAL_DURATION_OPTIONS: { id: 5 | 10 | 15; label: string }[] = [
  { id: 5, label: '5 min' },
  { id: 10, label: '10 min' },
  { id: 15, label: '15 min' },
]

/** Sugestões de menor esforço — usuário pode editar ou escrever a própria. */
export const BEHAVIORAL_ACTION_SUGGESTIONS: string[] = [
  'Beber um copo de água',
  'Abrir a janela ou tomar luz natural por 2 minutos',
  'Enviar uma mensagem curta para alguém de confiança',
  'Arrumar a cama ou uma superfície',
  'Tomar banho rápido',
  'Caminhar 5 minutos (mesmo dentro de casa)',
  'Separar a roupa de amanhã',
  'Lavar um prato ou uma panela',
  'Anotar três pendências pequenas no papel',
  'Ouvir uma música que você gosta',
]

export function emptyBehavioralActivationDraft(): BehavioralActivationDraft
{
  return {
    barrier: '',
    action: '',
    durationMin: 10,
  }
}

export function behavioralActivationToMarkdown(entry: BehavioralActivationEntry): string
{
  return [
    '# Ativação comportamental (TCC)',
    '',
    `**Data:** ${new Date(entry.createdAt).toLocaleString('pt-BR')}`,
    '',
    '## O que estava pesado',
    entry.barrier.trim() || '—',
    '',
    '## Micro-ação escolhida',
    entry.action.trim() || '—',
    '',
    `**Tempo previsto:** ${entry.durationMin} minutos`,
    '',
    '_Uma ação foi adicionada às tarefas de hoje. Exercício de organização pessoal — não substitui psicoterapia._',
  ].join('\n')
}

export function behavioralActivationDiaryTitle(entry: BehavioralActivationEntry): string
{
  const snippet = entry.action.trim().slice(0, 48)
  return snippet
    ? `TCC ativação: ${snippet}${entry.action.length > 48 ? '…' : ''}`
    : 'Ativação comportamental'
}

export function behavioralActivationTaskNotes(entry: BehavioralActivationDraft): string
{
  const lines = ['[TCC · Ativação comportamental]']
  if (entry.barrier.trim())
  {
    lines.push(`Contexto: ${entry.barrier.trim()}`)
  }
  lines.push(`Tempo previsto: ${entry.durationMin} min`)
  return lines.join('\n')
}
