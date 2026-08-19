import { useState } from 'react'
import {
  Bell,
  CalendarDays,
  HeartPulse,
  ListTodo,
  PenLine,
  Send,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { DiarioContexto } from '../../store/slices/bemEstarSlice'
import { extractDatesFromText } from '../../lib/noteDateExtraction'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_FIELD_INPUT,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

type ContextoMeta =
{
  id: DiarioContexto
  label: string
  Icon: typeof PenLine
  grupo: 'reflexao' | 'prazo' | 'gasto'
  ativo: string
  inativo: string
}

const CONTEXTOS: ContextoMeta[] = [
  {
    id: 'geral',
    label: 'Geral',
    Icon: PenLine,
    grupo: 'reflexao',
    ativo: 'border-accent/40 bg-accent-muted/60 text-accent ring-1 ring-accent/25',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-accent/25 hover:text-ink',
  },
  {
    id: 'saude',
    label: 'Saúde',
    Icon: HeartPulse,
    grupo: 'reflexao',
    ativo: 'border-rose-400/40 bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-rose-400/30 hover:text-ink',
  },
  {
    id: 'tarefa',
    label: 'Tarefa',
    Icon: ListTodo,
    grupo: 'prazo',
    ativo: 'border-accent/40 bg-accent-muted/60 text-accent ring-1 ring-accent/25',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-accent/25 hover:text-ink',
  },
  {
    id: 'lembrete',
    label: 'Lembrete',
    Icon: Bell,
    grupo: 'prazo',
    ativo: 'border-amber-400/40 bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-amber-400/30 hover:text-ink',
  },
  {
    id: 'gasto',
    label: 'Gasto',
    Icon: Wallet,
    grupo: 'gasto',
    ativo: 'border-atencao/40 bg-atencao/10 text-atencao ring-1 ring-atencao/20',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-atencao/30 hover:text-ink',
  },
]

const PLACEHOLDERS: Partial<Record<DiarioContexto, string>> = {
  lembrete: 'Ex.: Renovar receita até 15/08',
  tarefa: 'O que fazer e até quando',
  gasto: 'Valor, lugar ou categoria',
  saude: 'Sintoma, energia ou cuidado',
}

function ContextoCard({
  meta,
  selected,
  onSelect,
}: {
  meta: ContextoMeta
  selected: boolean
  onSelect: () => void
})
{
  const { Icon, label, ativo, inativo } = meta
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'flex flex-col items-center justify-center gap-1.5 min-h-[52px] px-2 py-2.5 rounded-sl border transition-all',
        selected ? ativo : inativo,
      ].join(' ')}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="text-[12px] font-medium leading-none">{label}</span>
    </button>
  )
}

export function HealthNoteComposer()
{
  const criarEntradaDiario = useTaskStore((s) => s.criarEntradaDiario)
  const [conteudo, setConteudo] = useState('')
  const [contexto, setContexto] = useState<DiarioContexto>('geral')
  const [dataPrazo, setDataPrazo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const reflexao = CONTEXTOS.filter((c) => c.grupo === 'reflexao')
  const prazo = CONTEXTOS.filter((c) => c.grupo === 'prazo')
  const gasto = CONTEXTOS.find((c) => c.grupo === 'gasto')!

  const previewDatas = extractDatesFromText(
    dataPrazo ? `${conteudo}\n${dataPrazo.split('-').reverse().join('/')}` : conteudo,
  )

  const handleSubmit = async () =>
  {
    if (!conteudo.trim()) return
    setSalvando(true)
    const texto = dataPrazo
      ? `${conteudo.trim()}\nPrazo: ${dataPrazo.split('-').reverse().join('/')}`
      : conteudo.trim()
    await criarEntradaDiario(texto, 'Nota do diário', contexto)
    toast.success(contexto === 'lembrete' || contexto === 'tarefa' ? 'Salvo no diário e Kanban' : 'Salvo')
    setConteudo('')
    setDataPrazo('')
    setSalvando(false)
  }

  const mostraPrazo = contexto === 'lembrete' || contexto === 'tarefa'

  return (
    <section className="sl-panel p-4 sm:p-5 space-y-4 border border-accent/10">
      <h2 className={`font-display text-base ${AXEL_TEXT_PRIMARY}`}>Nova anotação</h2>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Reflexão
          </p>
          <div className="grid grid-cols-2 gap-2">
            {reflexao.map((meta) => (
              <ContextoCard
                key={meta.id}
                meta={meta}
                selected={contexto === meta.id}
                onSelect={() => setContexto(meta.id)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Com prazo
          </p>
          <div className="grid grid-cols-2 gap-2">
            {prazo.map((meta) => (
              <ContextoCard
                key={meta.id}
                meta={meta}
                selected={contexto === meta.id}
                onSelect={() => setContexto(meta.id)}
              />
            ))}
          </div>
        </div>

        <ContextoCard
          meta={gasto}
          selected={contexto === 'gasto'}
          onSelect={() => setContexto('gasto')}
        />
      </div>

      <textarea
        placeholder={PLACEHOLDERS[contexto] ?? 'Como foi o dia?'}
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={4}
        className={`w-full resize-none min-h-[88px] ${AXEL_FIELD_INPUT}`}
      />

      {mostraPrazo && (
        <label className="block space-y-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Prazo
          </span>
          <div className="flex items-center gap-2 rounded-sl border border-line/80 bg-card/30 px-2">
            <CalendarDays className="w-4 h-4 text-accent shrink-0" aria-hidden />
            <input
              type="date"
              value={dataPrazo}
              onChange={(e) => setDataPrazo(e.target.value)}
              className={`flex-1 min-h-[44px] bg-transparent border-0 outline-none text-sm text-ink`}
            />
          </div>
        </label>
      )}

      {previewDatas.length > 0 && (
        <p className="text-[10px] font-mono text-accent/80">
          {previewDatas.map((d) => d.split('-').reverse().join('/')).join(' · ')} no Kanban
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={salvando || !conteudo.trim()}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] disabled:opacity-40 ${AXEL_BTN_PRIMARY_COMPACT}`}
        >
          <Send className="w-3.5 h-3.5" />
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </section>
  )
}
