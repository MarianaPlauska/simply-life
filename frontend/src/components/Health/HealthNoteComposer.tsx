import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { DiarioContexto } from '../../store/slices/bemEstarSlice'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_FIELD_INPUT,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const CONTEXTOS: { id: DiarioContexto; label: string; hint: string }[] = [
  { id: 'geral', label: 'Geral', hint: 'Reflexão do dia' },
  { id: 'gasto', label: 'Gasto', hint: 'AXEL pode sugerir lançamento' },
  { id: 'tarefa', label: 'Tarefa', hint: 'AXEL pode ir ao Kanban' },
  { id: 'saude', label: 'Saúde', hint: 'Sintoma, energia, cuidado' },
]

export function HealthNoteComposer()
{
  const criarEntradaDiario = useTaskStore((s) => s.criarEntradaDiario)
  const [conteudo, setConteudo] = useState('')
  const [contexto, setContexto] = useState<DiarioContexto>('geral')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async () =>
  {
    if (!conteudo.trim()) return
    setSalvando(true)
    await criarEntradaDiario(conteudo.trim(), 'Nota do diário', contexto)
    toast.success('Nota salva no diário')
    setConteudo('')
    setSalvando(false)
  }

  return (
    <section className="sl-panel p-4 sm:p-5 space-y-3">
      <div>
        <h2 className={`font-display text-base ${AXEL_TEXT_PRIMARY}`}>Nova anotação</h2>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          Marque o contexto — o AXEL prioriza gastos e tarefas quando fizer sentido.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONTEXTOS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setContexto(id)}
            className={contexto === id ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
          >
            {label}
          </button>
        ))}
      </div>

      <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
        {CONTEXTOS.find((c) => c.id === contexto)?.hint}
      </p>

      <textarea
        placeholder="O que aconteceu? Como você se sente?"
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={4}
        className={`w-full resize-none min-h-[88px] ${AXEL_FIELD_INPUT}`}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={salvando || !conteudo.trim()}
          className={`inline-flex items-center gap-1.5 px-4 py-2 disabled:opacity-40 ${AXEL_BTN_PRIMARY_COMPACT}`}
        >
          <Send className="w-3.5 h-3.5" />
          {salvando ? 'Salvando…' : 'Salvar nota'}
        </button>
      </div>
    </section>
  )
}
