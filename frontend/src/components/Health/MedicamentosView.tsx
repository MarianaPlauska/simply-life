import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { List, Pill } from 'lucide-react'
import { MedicamentosTodayTab } from './medicamentos/MedicamentosTodayTab'
import { MedicamentosCadastroTab } from './medicamentos/MedicamentosCadastroTab'
import { MedicamentosGerenciarTab } from './medicamentos/MedicamentosGerenciarTab'
import { MedicamentosSubNav } from './medicamentos/MedicamentosSubNav'
import type { MedicamentosSubTab } from './medicamentos/MedicamentosSubNav'
import { AXEL_BTN_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'

const ADMIN_TABS: { id: MedicamentosSubTab; label: string; short: string; Icon: typeof Pill }[] = [
  { id: 'cadastrar', label: 'Cadastrar', short: 'Novo', Icon: Pill },
  { id: 'gerenciar', label: 'Gerenciar', short: 'Lista', Icon: List },
]

export type { MedicamentosSubTab } from './medicamentos/MedicamentosSubNav'

export function parseMedicamentosSubTab(hash: string): MedicamentosSubTab
{
  const raw = hash.replace('#', '')
  if (raw === 'medicamentos-cadastrar')
  {
    return 'cadastrar'
  }
  if (raw === 'medicamentos-gerenciar')
  {
    return 'gerenciar'
  }
  return 'hoje'
}

function medicamentosHash(sub: MedicamentosSubTab): string
{
  if (sub === 'cadastrar')
  {
    return 'medicamentos-cadastrar'
  }
  if (sub === 'gerenciar')
  {
    return 'medicamentos-gerenciar'
  }
  return 'medicamentos'
}

export function MedicamentosView()
{
  const location = useLocation()
  const navigate = useNavigate()
  const sub = useMemo(() => parseMedicamentosSubTab(location.hash), [location.hash])
  const adminOpen = sub === 'cadastrar' || sub === 'gerenciar'

  const selectSub = useCallback((id: MedicamentosSubTab) =>
  {
    navigate(`/saude#${medicamentosHash(id)}`, { replace: true })
  }, [navigate])

  return (
    <div className="space-y-4">
      <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        Lembretes gentis, no seu ritmo — foco na próxima dose.
      </p>

      <MedicamentosTodayTab onGoCadastrar={() => selectSub('cadastrar')} />

      <DashboardCollapsible
        title="Cadastrar e gerenciar"
        subtitle="Lista, horários e edição"
        defaultOpen={adminOpen}
      >
        {(sub === 'cadastrar' || sub === 'gerenciar') && (
          <MedicamentosSubNav active={sub} onSelect={selectSub} tabs={ADMIN_TABS} />
        )}

        {sub === 'hoje' && (
          <div className="flex flex-wrap gap-2 py-1">
            <button
              type="button"
              onClick={() => selectSub('cadastrar')}
              className={`min-h-11 px-4 text-[12px] ${AXEL_BTN_PRIMARY}`}
            >
              Cadastrar novo
            </button>
            <button
              type="button"
              onClick={() => selectSub('gerenciar')}
              className="min-h-11 px-4 text-[12px] rounded-sl border border-line bg-chrome/30 text-ink font-mono uppercase tracking-wide hover:bg-chrome/60 transition-colors"
            >
              Ver lista
            </button>
          </div>
        )}

        {sub === 'cadastrar' && <MedicamentosCadastroTab />}
        {sub === 'gerenciar' && (
          <MedicamentosGerenciarTab onGoCadastrar={() => selectSub('cadastrar')} />
        )}
      </DashboardCollapsible>
    </div>
  )
}
