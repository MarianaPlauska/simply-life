import type { TarefaUnificada } from '../types'

// Metadados corporativos do drawer AXEL (assignee, relator, origem)

export function initialsFromName(name: string): string
{
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function formatReporterLabel(origem: string): string
{
  const o = (origem || 'manual').toLowerCase()
  if (o.includes('webhook') || o.includes('jarvis')) return 'Ingestão Automática / Webhook'
  if (o.includes('gmail') || o.includes('email')) return 'Ingestão E-mail'
  if (o.includes('api')) return 'API Externa'
  if (o === 'manual') return 'Criação Manual'
  return origem || 'Criação Manual'
}

export function formatDrawerDate(iso: string | null | undefined): string
{
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMinutesMono(totalSeconds: number): string
{
  const mins = Math.max(0, Math.round(totalSeconds / 60))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function resolveAssigneeName(
  profileName: string | undefined,
  tarefa: TarefaUnificada,
): string
{
  if (profileName?.trim()) return profileName.trim()
  if (tarefa.user_id && tarefa.user_id.length > 8)
  {
    return `Dev · ${tarefa.user_id.slice(0, 8)}`
  }
  return 'Desenvolvedor AXEL'
}
