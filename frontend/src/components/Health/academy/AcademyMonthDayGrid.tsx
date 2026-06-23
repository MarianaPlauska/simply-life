import { useMemo } from 'react'
import { localTodayIso } from '../../../lib/healthDayBoundary'
import type { AcademyTreinoConfig } from '../../../lib/academyWorkouts'

interface AcademyMonthDayGridProps
{
  mes: Date
  diaSelecionado: string
  config?: AcademyTreinoConfig
  onSelect: (iso: string) => void
}

function diasDoMes(mes: Date): { iso: string; dia: number; hoje: boolean }[]
{
  const y = mes.getFullYear()
  const m = mes.getMonth()
  const ultimo = new Date(y, m + 1, 0).getDate()
  const hoje = localTodayIso()
  const out: { iso: string; dia: number; hoje: boolean }[] = []

  for (let d = 1; d <= ultimo; d++)
  {
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    out.push({ iso, dia: d, hoje: iso === hoje })
  }
  return out
}

export function AcademyMonthDayGrid({
  mes,
  diaSelecionado,
  config,
  onSelect,
}: AcademyMonthDayGridProps)
{
  const dias = useMemo(() => diasDoMes(mes), [mes])
  const offset = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay()

  const temPlano = (iso: string): boolean =>
  {
    const p = config?.plano_por_data?.[iso]
    const ex = config?.exercicios_por_data?.[iso]
    return Boolean(
      (p && (p.titulo.trim() || p.meta_minutos > 0))
      || (ex && ex.length > 0),
    )
  }

  const mesLabel = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <section className="rounded-sl border border-line bg-card p-3 space-y-2">
      <p className="text-[11px] font-mono uppercase text-ink-muted text-center capitalize">
        {mesLabel}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono text-ink-muted">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => (
          <span key={`${l}-${i}`}>{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {dias.map(({ iso, dia, hoje }) =>
        {
          const ativo = iso === diaSelecionado
          const marcado = temPlano(iso)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={`relative min-h-[36px] rounded-sl text-[12px] font-mono tabular-nums transition-colors ${
                ativo
                  ? 'bg-accent/20 border border-accent/40 text-ink'
                  : hoje
                    ? 'bg-accent-muted/30 border border-accent/20 text-ink'
                    : 'border border-transparent text-ink-muted hover:bg-chrome'
              }`}
            >
              {dia}
              {marcado && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
