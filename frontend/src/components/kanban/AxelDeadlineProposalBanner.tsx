import { CalendarClock, Check, X } from 'lucide-react'
import type { DeadlineProposal } from '../../lib/deadlineProposal'

interface AxelDeadlineProposalBannerProps
{
  proposal: DeadlineProposal
  onAccept: () => void
  onReject: () => void
  loading?: boolean
}

function formatDue(iso: string): string
{
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AxelDeadlineProposalBanner({
  proposal,
  onAccept,
  onReject,
  loading = false,
}: AxelDeadlineProposalBannerProps)
{
  return (
    <section
      className="rounded-sl border border-atencao/35 bg-atencao/10 p-3 min-w-0"
      aria-label="Proposta de prazo do AXEL"
    >
      <div className="flex items-start gap-2">
        <CalendarClock size={16} className="text-atencao shrink-0 mt-0.5" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wide text-atencao mb-1">
            AXEL sugere novo prazo
          </p>
          <p className="text-[12px] text-ink leading-snug">
            {proposal.currentDue
              ? <>De <strong>{formatDue(proposal.currentDue)}</strong> para <strong>{formatDue(proposal.proposedDue)}</strong></>
              : <>Definir prazo em <strong>{formatDue(proposal.proposedDue)}</strong></>}
          </p>
          <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
            {proposal.reason}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          disabled={loading}
          onClick={onAccept}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-sl border border-accent/40 bg-accent-muted/30 text-accent hover:bg-accent-muted/50 transition-colors disabled:opacity-40"
        >
          <Check size={12} strokeWidth={2} />
          Aceitar prazo
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onReject}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-sl border border-line text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
        >
          <X size={12} strokeWidth={2} />
          Manter atual
        </button>
      </div>
    </section>
  )
}
