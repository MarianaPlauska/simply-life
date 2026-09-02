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
  ativo: string
  inativo: string
}

const CONTEXTOS: ContextoMeta[] = [
  {
    id: 'geral',
    label: 'Geral',
    Icon: PenLine,
    ativo: 'border-accent/40 bg-accent-muted/60 text-accent',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-accent/25 hover:text-ink',
  },
  {
    id: 'saude',
    label: 'Saúde',
    Icon: HeartPulse,
    ativo: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-rose-400/30 hover:text-ink',
  },
  {
    id: 'tarefa',
    label: 'Tarefa',
    Icon: ListTodo,
    ativo: 'border-accent/40 bg-accent-muted/60 text-accent',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-accent/25 hover:text-ink',
  },
  {
    id: 'lembrete',
    label: 'Lembrete',
    Icon: Bell,
    ativo: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-amber-400/30 hover:text-ink',
  },
  {
    id: 'gasto',
    label: 'Gasto',
    Icon: Wallet,
    ativo: 'border-atencao/40 bg-atencao/10 text-atencao',
    inativo: 'border-line/80 bg-card/40 text-ink-muted hover:border-atencao/30 hover:text-ink',
  },
]

const PLACEHOLDERS: Partial<Record<DiarioContexto, string>> = {
  lembrete: 'Ex.: Renovar receita até 15/08',
  tarefa: 'O que fazer e até quando',
  gasto: 'Valor, lugar ou categoria',
  saude: 'Sintoma, energia ou cuidado',
}

function ContextoChip({
  meta,
  selected,
  onSelect,
  dense,
}: {
  meta: ContextoMeta
  selected: boolean
  onSelect: () => void
  dense?: boolean
})
{
  const { Icon, label, ativo, inativo } = meta
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'shrink-0 inline-flex items-center gap-1.5 rounded-pill border font-medium transition-colors',
        dense ? 'min-h-[32px] px-2.5 text-[11px]' : 'min-h-[40px] px-3 text-[12px]',
        selected ? ativo : inativo,
      ].join(' ')}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  )
}

interface HealthNoteComposerProps
{
  dense?: boolean
}

export function HealthNoteComposer({ dense = false }: HealthNoteComposerProps)
{
  const criarEntradaDiario = useTaskStore((s) => s.criarEntradaDiario)
  const [conteudo, setConteudo] = useState('')
  const [contexto, setContexto] = useState<DiarioContexto>('geral')
  const [dataPrazo, setDataPrazo] = useState('')
  const [salvando, setSalvando] = useState(false)

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
    <section className={`sl-panel border border-line/80 space-y-3 ${dense ? 'p-3 sm:p-4' : 'p-4 sm:p-5 space-y-4 border-accent/10'}`}>
      <h2 className={`font-sans font-semibold ${dense ? 'text-[15px]' : 'font-display text-base'} ${AXEL_TEXT_PRIMARY}`}>
        Nova anotação
      </h2>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-0.5 px-0.5">
        {CONTEXTOS.map((meta) => (
          <ContextoChip
            key={meta.id}
            meta={meta}
            selected={contexto === meta.id}
            onSelect={() => setContexto(meta.id)}
            dense={dense}
          />
        ))}
      </div>

      <textarea
        placeholder={PLACEHOLDERS[contexto] ?? 'Como foi o dia?'}
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={dense ? 3 : 4}
        className={`w-full resize-none ${dense ? 'min-h-[72px]' : 'min-h-[88px]'} ${AXEL_FIELD_INPUT}`}
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
              className="flex-1 min-h-[40px] bg-transparent border-0 outline-none text-sm text-ink"
            />
          </div>
        </label>
      )}

      {previewDatas.length > 0 && (
        <p className="text-[10px] font-mono text-accent/80">
          {previewDatas.map((d) => d.split('-').reverse().join('/')).join(' · ')} no Kanban
        </p>
      )}

      <div className="flex justify-end pt-0.5">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={salvando || !conteudo.trim()}
          className={`inline-flex items-center gap-1.5 px-4 py-2 disabled:opacity-40 ${dense ? 'min-h-[40px] text-[12px]' : 'min-h-[44px]'} ${AXEL_BTN_PRIMARY_COMPACT}`}
        >
          <Send className="w-3.5 h-3.5" />
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </section>
  )
}
