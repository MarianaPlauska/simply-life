import { useEffect, useState } from 'react'
import { Check, ExternalLink, Loader2, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchGmailImapStatus,
  saveGmailImapSettings,
  syncGmailImap,
} from '../../lib/gmailImapApi'
import { useTaskStore } from '../../store/useTaskStore'

export function GmailImapSection()
{
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const completeOnboardingStep = useTaskStore((s) => s.completeOnboardingStep)

  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [configured, setConfigured] = useState(false)
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() =>
  {
    void fetchGmailImapStatus().then((s) =>
    {
      setConfigured(s.configured)
      setSavedEmail(s.email)
      setLastSync(s.last_sync_at)
      if (s.email) setEmail(s.email)
      setLoading(false)
    })
  }, [])

  const handleSave = async () =>
  {
    if (!email.trim() || !appPassword.trim())
    {
      toast.error('Informe e-mail e senha de app')
      return
    }

    setSaving(true)
    try
    {
      await saveGmailImapSettings(email.trim(), appPassword.trim())
      setConfigured(true)
      setSavedEmail(email.trim().toLowerCase())
      setAppPassword('')
      completeOnboardingStep('connect_email')
      toast.success('Gmail configurado — gratuito, sem Google Cloud')
    }
    catch (err)
    {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    finally
    {
      setSaving(false)
    }
  }

  const handleSync = async () =>
  {
    setSyncing(true)
    try
    {
      const result = await syncGmailImap()
      await fetchTarefas()
      setLastSync(new Date().toISOString())
      toast.success(`${result.tarefas_geradas} tarefa(s) de ${result.emails_lidos} e-mail(s)`)
      completeOnboardingStep('connect_email')
    }
    catch (err)
    {
      toast.error(err instanceof Error ? err.message : 'Erro no sync')
    }
    finally
    {
      setSyncing(false)
    }
  }

  if (loading)
  {
    return (
      <div className="border border-zinc-800 rounded-2xl p-5 flex items-center gap-2 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando Gmail…
      </div>
    )
  }

  return (
    <section className="border border-violet-500/20 rounded-2xl overflow-hidden bg-gradient-to-r from-violet-500/[0.05] to-transparent">
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl bg-violet-500/10">
            <Mail className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-white">Gmail — plano gratuito</h3>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Sem Google Cloud e sem cartão. Use uma senha de app do Gmail; o AXEL tria com Groq e
              cria tarefas urgentes no Kanban.
            </p>
          </div>
          {configured && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full shrink-0">
              <Check className="w-3 h-3" />
              Ativo
            </span>
          )}
        </div>

        <ol className="text-[11px] text-zinc-500 space-y-1 mb-4 list-decimal list-inside leading-relaxed">
          <li>Ative verificação em 2 etapas na conta Google</li>
          <li>
            Crie uma senha de app em{' '}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="text-violet-400 hover:underline inline-flex items-center gap-0.5"
            >
              Senhas de app
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>Cole abaixo e salve — depois use Sync Gmail</li>
        </ol>

        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">E-mail Gmail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@gmail.com"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Senha de app (16 caracteres)</span>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder={configured ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="px-4 py-2 text-[13px] font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
          >
            {saving ? 'Salvando…' : configured ? 'Atualizar credenciais' : 'Salvar Gmail'}
          </button>
          {configured && (
            <button
              type="button"
              disabled={syncing}
              onClick={() => void handleSync()}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-xl border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 disabled:opacity-40"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync Gmail agora
            </button>
          )}
        </div>

        {savedEmail && lastSync && (
          <p className="mt-3 text-[11px] text-zinc-500 font-mono">
            {savedEmail} · último sync {new Date(lastSync).toLocaleString('pt-BR')}
          </p>
        )}
      </div>
    </section>
  )
}
