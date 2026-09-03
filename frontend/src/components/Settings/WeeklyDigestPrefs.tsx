import { useEffect, useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

/** Prefs + disparo manual do resumo semanal (cron diário 09:00 UTC). */
export function WeeklyDigestPrefs()
{
  const [enabled, setEnabled] = useState(true)
  const [weekday, setWeekday] = useState(1)
  const [channel, setChannel] = useState<'push' | 'email' | 'both'>('both')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() =>
  {
    void (async () =>
    {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user)
      {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('user_weekly_digest_prefs')
        .select('enabled, weekday, channel')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data)
      {
        setEnabled(data.enabled !== false)
        setWeekday(data.weekday ?? 1)
        setChannel((data.channel as 'push' | 'email' | 'both') || 'both')
      }
      setLoading(false)
    })()
  }, [])

  const persist = async (patch: {
    enabled?: boolean
    weekday?: number
    channel?: 'push' | 'email' | 'both'
  }) =>
  {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    try
    {
      const next = {
        user_id: user.id,
        enabled: patch.enabled ?? enabled,
        weekday: patch.weekday ?? weekday,
        channel: patch.channel ?? channel,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('user_weekly_digest_prefs').upsert(next)
      if (error) throw error
    }
    catch (err)
    {
      toast.error(err instanceof Error ? err.message : 'Não salvou o resumo')
    }
    finally
    {
      setSaving(false)
    }
  }

  const handleTest = async () =>
  {
    setTesting(true)
    try
    {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Não autenticado')
      const res = await fetch('/api/weekly-digest-test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha no disparo')
      toast.success('Resumo enviado - veja o e-mail e/ou a notificação')
    }
    catch (err)
    {
      toast.error(err instanceof Error ? err.message : 'Falha no teste')
    }
    finally
    {
      setTesting(false)
    }
  }

  if (loading)
  {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando resumo semanal…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 min-h-11">
        <span className="text-[13px] text-ink">Ativar resumo semanal</span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-accent"
          checked={enabled}
          disabled={saving}
          onChange={(e) =>
          {
            const next = e.target.checked
            setEnabled(next)
            void persist({ enabled: next })
          }}
        />
      </label>
      <label className="block">
        <span className="text-[11px] uppercase tracking-wide text-ink-muted">Dia (horário de Brasília)</span>
        <select
          value={weekday}
          disabled={saving || !enabled}
          onChange={(e) =>
          {
            const next = Number(e.target.value)
            setWeekday(next)
            void persist({ weekday: next })
          }}
          className="mt-1 w-full min-h-11 rounded-lg bg-zinc-800/50 border border-zinc-700/40 px-3 text-[13px] text-white"
        >
          {WEEKDAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] uppercase tracking-wide text-ink-muted">Canal</span>
        <select
          value={channel}
          disabled={saving || !enabled}
          onChange={(e) =>
          {
            const next = e.target.value as 'push' | 'email' | 'both'
            setChannel(next)
            void persist({ channel: next })
          }}
          className="mt-1 w-full min-h-11 rounded-lg bg-zinc-800/50 border border-zinc-700/40 px-3 text-[13px] text-white"
        >
          <option value="both">E-mail (IMAP) e push</option>
          <option value="email">Só e-mail</option>
          <option value="push">Só push</option>
        </select>
      </label>
      <p className="text-[12px] text-ink-muted leading-relaxed">
        O cron Hobby dispara 1× ao dia (09:00 UTC). Sem Gmail conectado, só push. Sem VAPID, só e-mail.
      </p>
      <button
        type="button"
        disabled={testing}
        onClick={() => void handleTest()}
        className="min-h-11 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-semibold disabled:opacity-50"
      >
        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Enviar resumo de teste
      </button>
    </div>
  )
}
