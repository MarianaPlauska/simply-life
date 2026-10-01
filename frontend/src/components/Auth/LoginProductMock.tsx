/**
 * Palco do login: notebook e celular desenhados em código, com telas de
 * verdade do app (Hoje, tarefas, água, ritmo). Cores da identidade
 * (Petróleo e Coral, tokens do app mobile) via variáveis .sl-login.
 * Sem imagem: fica nítido em qualquer tela e o texto nunca embaralha.
 */
import type { ReactNode } from 'react'

function Check({ done }: { done?: boolean })
{
  return (
    <span
      className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border"
      style={{
        borderColor: done ? 'var(--lg-brand)' : 'var(--lg-muted)',
        background: done ? 'var(--lg-brand)' : 'transparent',
      }}
    >
      {done ? (
        <svg viewBox="0 0 12 12" className="h-[8px] w-[8px]" aria-hidden>
          <path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="var(--lg-surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}

function TaskLine({ title, meta, done, tint }: { title: string; meta: string; done?: boolean; tint: string })
{
  return (
    <div
      className="flex items-center gap-2 rounded-[10px] border px-2.5 py-2"
      style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}
    >
      <span className="h-6 w-[3px] shrink-0 rounded-full" style={{ background: tint }} />
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[11px] font-semibold leading-tight"
          style={{ color: 'var(--lg-ink)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}
        >
          {title}
        </p>
        <p className="truncate text-[9px] leading-tight" style={{ color: 'var(--lg-muted)' }}>
          {meta}
        </p>
      </div>
      <Check done={done} />
    </div>
  )
}

function Flame({ className = '' }: { className?: string })
{
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5c-.6 2.9-2.6 4.6-4.3 6.5C6.1 10.8 5 12.6 5 15a7 7 0 0 0 14 0c0-2.3-1-4.4-2.6-6.1-.3 1.4-1 2.5-2.1 3.1.2-3.4-.7-6.9-2.3-9.5Z"
        fill="var(--lg-coral)"
      />
    </svg>
  )
}

/** Notebook: barra de abas do app e o quadro do dia. */
function Laptop()
{
  const bars = [38, 62, 48, 80, 56, 92, 70]
  return (
    <div className="absolute left-0 top-[6%] w-[80%]">
      <div
        className="rounded-t-[16px] border-[6px] border-b-[10px] shadow-[0_24px_60px_-28px_rgba(31,58,61,0.45)]"
        style={{ borderColor: 'var(--lg-bezel)', background: 'var(--lg-screen)' }}
      >
        <div className="aspect-[16/10] overflow-hidden rounded-[8px] p-3 xl:p-4">
          {/* topo do app */}
          <div className="mb-3 flex items-center gap-3">
            <span className="h-5 w-5 rounded-[6px]" style={{ background: 'var(--lg-brand)' }} />
            {['Hoje', 'Tarefas', 'Saúde', 'Finanças'].map((t, i) => (
              <span
                key={t}
                className="text-[10px] font-semibold"
                style={{
                  color: i === 0 ? 'var(--lg-ink)' : 'var(--lg-muted)',
                  borderBottom: i === 0 ? '2px solid var(--lg-coral)' : '2px solid transparent',
                  paddingBottom: 2,
                }}
              >
                {t}
              </span>
            ))}
            <span className="ml-auto h-5 w-5 rounded-full" style={{ background: 'var(--lg-menta)' }} />
          </div>

          <p className="font-display text-[15px] leading-tight xl:text-[17px]" style={{ color: 'var(--lg-ink)' }}>
            Bom dia, Ana
          </p>
          <p className="mb-3 text-[9px]" style={{ color: 'var(--lg-muted)' }}>
            Três coisas para hoje, no seu ritmo.
          </p>

          <div className="grid grid-cols-[1.25fr_1fr] gap-2.5">
            <div className="space-y-1.5">
              <TaskLine title="Revisar contrato do apê" meta="10:00 · 30 min" tint="var(--lg-coral)" />
              <TaskLine title="Planilha da viagem" meta="Esperando Bia · 2 d" tint="var(--lg-amber)" />
              <TaskLine title="Pagar a conta de luz" meta="Feito às 8:40" tint="var(--lg-brand)" done />
            </div>
            <div className="space-y-2">
              <div className="rounded-[10px] border p-2.5" style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}>
                <p className="text-[9px]" style={{ color: 'var(--lg-muted)' }}>Água hoje</p>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--lg-ink)' }}>1,5 de 2 L</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--lg-line)' }}>
                  <div className="h-full w-3/4 rounded-full" style={{ background: 'var(--lg-water)' }} />
                </div>
              </div>
              <div className="rounded-[10px] border p-2.5" style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}>
                <p className="text-[9px]" style={{ color: 'var(--lg-muted)' }}>Foco na semana</p>
                <div className="mt-1 flex h-9 items-end gap-[3px]">
                  {bars.map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-[2px]"
                      style={{ height: `${h}%`, background: i === bars.length - 2 ? 'var(--lg-coral)' : 'var(--lg-brand)', opacity: i === bars.length - 2 ? 1 : 0.75 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* base do notebook */}
      <div
        className="mx-[-4%] h-3 rounded-b-[14px]"
        style={{ background: 'linear-gradient(180deg, var(--lg-bezel) 0%, var(--lg-base) 100%)' }}
      />
      <div className="mx-auto h-1 w-1/5 rounded-b-md" style={{ background: 'var(--lg-base)' }} />
    </div>
  )
}

/** Celular: saudação, ritmo, a tarefa que espera alguém e a barra de abas. */
function Phone()
{
  return (
    <div className="absolute bottom-[2%] right-[2%] w-[27%] min-w-[150px] max-w-[210px]">
      <div
        className="rounded-[28px] border-[6px] shadow-[0_28px_60px_-24px_rgba(31,58,61,0.55)]"
        style={{ borderColor: 'var(--lg-bezel)', background: 'var(--lg-screen)' }}
      >
        <div className="relative aspect-[9/19] overflow-hidden rounded-[22px] px-2.5 pb-2 pt-5">
          <span className="absolute left-1/2 top-1.5 h-2.5 w-12 -translate-x-1/2 rounded-full" style={{ background: 'var(--lg-bezel)' }} />
          <p className="text-[8px]" style={{ color: 'var(--lg-muted)' }}>Quinta, 1 de out</p>
          <p className="mb-2 font-display text-[13px] leading-tight" style={{ color: 'var(--lg-ink)' }}>
            Oi, Ana
          </p>

          <div className="mb-1.5 flex items-center gap-1.5 rounded-[10px] border px-2 py-1.5" style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}>
            <Flame className="h-4 w-4" />
            <div>
              <p className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--lg-ink)' }}>Elo de 5 dias</p>
              <p className="text-[8px] leading-tight" style={{ color: 'var(--lg-muted)' }}>3 de 4 dias nesta semana</p>
            </div>
          </div>

          <div className="mb-1.5 rounded-[10px] border px-2 py-1.5" style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}>
            <p className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--lg-ink)' }}>Planilha da viagem</p>
            <span
              className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[8px] font-semibold"
              style={{ background: 'var(--lg-amber-muted)', color: 'var(--lg-amber-text)' }}
            >
              Esperando Bia · 2 d
            </span>
          </div>

          <div className="mb-1.5 rounded-[10px] border px-2 py-1.5" style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}>
            <p className="text-[8px]" style={{ color: 'var(--lg-muted)' }}>Liga da casa</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="relative block h-5 w-5 overflow-hidden rounded-[6px] border" style={{ borderColor: 'var(--lg-line)' }}>
                <span className="absolute bottom-0 left-0 right-0 h-3/4" style={{ background: 'var(--lg-brand)' }} />
              </span>
              <p className="text-[9px] font-semibold" style={{ color: 'var(--lg-ink)' }}>Quase cheio, juntos</p>
            </div>
          </div>

          <div
            className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-around rounded-full border py-1.5"
            style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)' }}
          >
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i === 0 ? 'var(--lg-coral)' : 'var(--lg-muted)', opacity: i === 0 ? 1 : 0.5 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FloatingChip({ className, children }: { className: string; children: ReactNode })
{
  return (
    <div
      className={`absolute flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-[0_12px_30px_-18px_rgba(31,58,61,0.5)] ${className}`}
      style={{ background: 'var(--lg-card)', borderColor: 'var(--lg-line)', color: 'var(--lg-ink)' }}
    >
      {children}
    </div>
  )
}

export function LoginProductMock()
{
  return (
    <div className="relative h-full min-h-[420px] w-full select-none" aria-hidden>
      <Laptop />
      <Phone />
      <FloatingChip className="left-[4%] bottom-[10%]">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--lg-coral)' }}>
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5"><path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        Tarefa concluída · +12 XP
      </FloatingChip>
      <FloatingChip className="right-[24%] top-[0%] hidden xl:flex">
        <Flame className="h-3.5 w-3.5" />
        Semana fechada
      </FloatingChip>
    </div>
  )
}
