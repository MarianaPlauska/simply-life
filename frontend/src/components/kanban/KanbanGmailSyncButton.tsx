import { Mail, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchGmailImapStatus, syncGmailImap } from '../../lib/gmailImapApi'
import { useTaskStore } from '../../store/useTaskStore'

export function KanbanGmailSyncButton()
{
  const navigate = useNavigate()
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () =>
  {
    setSyncing(true)
    try
    {
      const status = await fetchGmailImapStatus()
      if (!status.configured)
      {
        toast.info('Configure o Gmail primeiro', {
          description: 'Configurações → Integrações → Gmail (grátis)',
          action: {
            label: 'Abrir',
            onClick: () => navigate('/configuracoes'),
          },
        })
        return
      }

      const result = await syncGmailImap()
      await fetchTarefas()
      toast.success(`${result.tarefas_geradas} tarefa(s) de ${result.emails_lidos} e-mail(s)`)
    }
    catch (err)
    {
      const msg = err instanceof Error ? err.message : 'Erro no sync'
      toast.error(msg, {
        action: msg.includes('configurado')
          ? { label: 'Configurar', onClick: () => navigate('/configuracoes') }
          : undefined,
      })
    }
    finally
    {
      setSyncing(false)
    }
  }

  return (
    <button
      type="button"
      disabled={syncing}
      onClick={() => void handleSync()}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors disabled:opacity-40"
      title="Buscar e-mails não lidos no Gmail (grátis)"
    >
      {syncing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Mail size={14} strokeWidth={1.75} />
      )}
      Sync Gmail
    </button>
  )
}
