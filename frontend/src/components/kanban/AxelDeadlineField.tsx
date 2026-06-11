import { CalendarClock } from 'lucide-react'

// Prazo fatal — DatePicker compacto

interface AxelDeadlineFieldProps
{
  value: string | null
  onChange: (iso: string | null) => void
  compact?: boolean
}

function toInputValue(iso: string | null): string
{
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AxelDeadlineField({ value, onChange, compact = false }: AxelDeadlineFieldProps)
{
  if (compact)
  {
    return (
      <div className="min-w-0 space-y-1">
        <input
          type="datetime-local"
          value={toInputValue(value)}
          onChange={(e) =>
          {
            const v = e.target.value
            if (!v)
            {
              onChange(null)
              return
            }
            onChange(new Date(v).toISOString())
          }}
          className="w-full max-w-full text-xs font-mono tabular-nums bg-zinc-900/50 border border-white/[0.04] rounded px-2 py-1 text-zinc-200 outline-none focus:border-indigo-500/50 focus:ring-0 box-border"
        />
        {value && (
          <p className="text-[10px] font-mono text-zinc-400 tabular-nums break-all">
            {new Date(value).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    )
  }

  return (
    <section className="min-w-0">
      <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
        <CalendarClock size={16} strokeWidth={1.5} className="text-zinc-400" />
        Prazo fatal
      </label>
      <input
        type="datetime-local"
        value={toInputValue(value)}
        onChange={(e) =>
        {
          const v = e.target.value
          if (!v)
          {
            onChange(null)
            return
          }
          onChange(new Date(v).toISOString())
        }}
        className="w-full max-w-full text-[13px] font-mono tabular-nums bg-[#13141F] border border-white/[0.04] rounded-md px-2.5 py-1.5 text-zinc-300 outline-none box-border focus:border-indigo-500/40 focus:ring-0"
      />
      {value && (
        <p className="mt-1 text-[11px] font-mono text-zinc-400 tabular-nums break-all">
          {new Date(value).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </section>
  )
}
