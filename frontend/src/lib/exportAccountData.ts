import { useTaskStore } from '../store/useTaskStore'

/** Pacote LGPD - o que o app guarda desta conta, para download */
export function buildAccountExportPayload()
{
  const s = useTaskStore.getState()
  return {
    exported_at: new Date().toISOString(),
    product: 'Simply-Life',
    profile: s.userProfile,
    tarefas: s.tarefas,
    transactions: s.transactions,
    habitos: s.habitos,
    medicamentos: s.medicamentos,
    anotacoes: s.anotacoes,
  }
}

export function downloadAccountExport(): void
{
  const payload = buildAccountExportPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `simply-life-dados-${payload.exported_at.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
