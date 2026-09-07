/** Registro de pensamento (TCC) — estrutura e formatação. */

export type ThoughtRecordDraft = {
  situation: string
  automaticThought: string
  evidenceFor: string
  evidenceAgainst: string
  alternativeThought: string
}

export type ThoughtRecordEntry = ThoughtRecordDraft & {
  id: string
  createdAt: string
}

export const THOUGHT_RECORD_STEPS: {
  id: keyof ThoughtRecordDraft
  title: string
  hint: string
  placeholder: string
}[] = [
  {
    id: 'situation',
    title: 'Situação',
    hint: 'O que aconteceu, onde e com quem. Só os fatos, sem julgamento.',
    placeholder: 'Ex.: Reunião com a equipe, apresentei o relatório…',
  },
  {
    id: 'automaticThought',
    title: 'Pensamento automático',
    hint: 'O que passou pela sua cabeça na hora — a frase exata, se lembrar.',
    placeholder: 'Ex.: “Falei tudo errado, vão me demitir.”',
  },
  {
    id: 'evidenceFor',
    title: 'Evidências a favor',
    hint: 'O que sustenta esse pensamento? Só fatos observáveis.',
    placeholder: 'Ex.: Gaguejei em um slide.',
  },
  {
    id: 'evidenceAgainst',
    title: 'Evidências contra',
    hint: 'O que contradiz ou enfraquece o pensamento? Inclua o que você ignorou.',
    placeholder: 'Ex.: Colega elogiou o conteúdo depois; já apresentei bem antes.',
  },
  {
    id: 'alternativeThought',
    title: 'Pensamento alternativo',
    hint: 'Uma leitura mais equilibrada, ainda honesta — não precisa ser positiva à força.',
    placeholder: 'Ex.: “Fiquei nervoso, mas entreguei o essencial. Posso revisar o próximo slide.”',
  },
]

export function emptyThoughtRecordDraft(): ThoughtRecordDraft
{
  return {
    situation: '',
    automaticThought: '',
    evidenceFor: '',
    evidenceAgainst: '',
    alternativeThought: '',
  }
}

export function thoughtRecordToMarkdown(entry: ThoughtRecordEntry): string
{
  return [
    '# Registro de pensamento (TCC)',
    '',
    `**Data:** ${new Date(entry.createdAt).toLocaleString('pt-BR')}`,
    '',
    '## Situação',
    entry.situation.trim() || '—',
    '',
    '## Pensamento automático',
    entry.automaticThought.trim() || '—',
    '',
    '## Evidências a favor',
    entry.evidenceFor.trim() || '—',
    '',
    '## Evidências contra',
    entry.evidenceAgainst.trim() || '—',
    '',
    '## Pensamento alternativo',
    entry.alternativeThought.trim() || '—',
    '',
    '_Exercício de organização pessoal. Não substitui psicoterapia._',
  ].join('\n')
}

export function thoughtRecordDiaryTitle(entry: ThoughtRecordEntry): string
{
  const snippet = entry.automaticThought.trim().slice(0, 48)
  return snippet ? `TCC: ${snippet}${entry.automaticThought.length > 48 ? '…' : ''}` : 'Registro de pensamento'
}
