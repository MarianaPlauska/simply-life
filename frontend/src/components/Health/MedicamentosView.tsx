import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, List, Pill } from 'lucide-react'
import { MedicamentosTodayTab } from './medicamentos/MedicamentosTodayTab'
import { MedicamentosCadastroTab } from './medicamentos/MedicamentosCadastroTab'
import { MedicamentosGerenciarTab } from './medicamentos/MedicamentosGerenciarTab'
import { MedicamentosSubNav } from './medicamentos/MedicamentosSubNav'
import type { MedicamentosSubTab } from './medicamentos/MedicamentosSubNav'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const SUB_TABS: { id: MedicamentosSubTab; label: string; short: string; Icon: typeof Pill }[] = [
  { id: 'hoje', label: 'Hoje', short: 'Hoje', Icon: CalendarDays },
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

  const selectSub = useCallback((id: MedicamentosSubTab) =>
  {
    navigate(`/saude#${medicamentosHash(id)}`, { replace: true })
  }, [navigate])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[13px] font-semibold text-ink flex items-center gap-2">
          <Pill className="w-4 h-4 text-teal-400 shrink-0" />
          Medicamentos
        </h2>
        <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          Uma aba por vez — agenda, cadastro ou lista.
        </p>
      </div>

      <MedicamentosSubNav active={sub} onSelect={selectSub} tabs={SUB_TABS} />

      {sub === 'hoje' && <MedicamentosTodayTab onGoCadastrar={() => selectSub('cadastrar')} />}
      {sub === 'cadastrar' && <MedicamentosCadastroTab />}
      {sub === 'gerenciar' && <MedicamentosGerenciarTab onGoCadastrar={() => selectSub('cadastrar')} />}
    </div>
  )
}
