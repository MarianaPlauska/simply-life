import type { DumpCard } from '../../lib/lifeDumpParse'
import { conflictHint } from '../../lib/lifeDumpConflict'
import { AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

const KIND_LABEL: Record<DumpCard['kind'], string> = {
  compromisso: 'Compromisso',
  tarefa: 'Tarefa',
  intencao: 'Intenção',
  gasto: 'Gasto',
}

interface DumpConfirmListProps
{
  cards: DumpCard[]
  onToggle: (id: string) => void
}

export function DumpConfirmList({ cards, onToggle }: DumpConfirmListProps)
{
  return (
    <ul className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
      {cards.map((card) =>
      {
        const hint = conflictHint(card)
        const when = card.hora
          ? `${card.dateIso ?? ''} ${card.hora}`
          : card.dateIso
            ? card.dateIso
            : card.kind === 'intencao'
              ? 'sem hora'
              : card.gasto
                ? `R$ ${card.gasto.valor}`
                : ''
        return (
          <li key={card.id}>
            <button
              type="button"
              onClick={() => onToggle(card.id)}
              className={`w-full text-left rounded-sl border px-3 py-2.5 min-h-11 ${AXEL_TOUCH_PRESS} ${
                card.kept
                  ? 'border-line bg-chrome/50'
                  : 'border-line/50 bg-transparent opacity-50'
              }`}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
                {KIND_LABEL[card.kind]}
                {card.kept ? '' : ' · fora'}
              </p>
              <p className="text-[14px] text-ink mt-0.5">{card.titulo}</p>
              {when && (
                <p className="text-[11px] text-ink-muted mt-0.5">{when}</p>
              )}
              {hint && (
                <p className="text-[11px] text-atencao mt-0.5">{hint}</p>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
