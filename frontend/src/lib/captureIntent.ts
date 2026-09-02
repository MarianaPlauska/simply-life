/** O + do chrome muda conforme a tela — não é sempre o dump. */

export type CaptureIntent = 'dump' | 'finance' | 'task' | 'note'

export function captureIntentFromPath(pathname: string): CaptureIntent
{
  if (pathname.startsWith('/financeiro'))
  {
    return 'finance'
  }
  if (pathname.startsWith('/kanban'))
  {
    return 'task'
  }
  if (pathname.startsWith('/anotacoes'))
  {
    return 'note'
  }
  return 'dump'
}

export function captureIntentLabel(intent: CaptureIntent, open: boolean): string
{
  if (open)
  {
    return 'Fechar captura'
  }
  if (intent === 'finance')
  {
    return 'Lançar gasto ou ganho'
  }
  if (intent === 'task')
  {
    return 'Nova tarefa'
  }
  if (intent === 'note')
  {
    return 'Nota rápida'
  }
  return 'Despejar a cabeça'
}
