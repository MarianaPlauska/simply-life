import { MODULE_SCREEN_HERO, MODULE_WASH, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface DashboardContextHeroProps
{
  overdueCount: number
  saldoDisponivel: number
}

export function DashboardContextHero({ overdueCount, saldoDisponivel }: DashboardContextHeroProps)
{
  const urgent = overdueCount > 0

  return (
    <section aria-label={urgent ? 'Itens vencidos' : 'Saldo disponível'} className="mt-2">
      {urgent ? (
        <>
          <div className={MODULE_WASH.tasks}>
            <p className={MODULE_SCREEN_HERO.urgent}>
              {overdueCount}
            </p>
          </div>
          <p className={`sl-body-muted mt-1.5 ${AXEL_TEXT_SECONDARY}`}>
            {overdueCount === 1 ? 'item passou da data' : 'itens passaram da data'}
          </p>
        </>
      ) : (
        <>
          <div className={MODULE_WASH.finance}>
            <p className={MODULE_SCREEN_HERO.finance}>
              {fmt(saldoDisponivel)}
            </p>
          </div>
          <p className={`sl-body-muted mt-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Disponível agora
          </p>
        </>
      )}
    </section>
  )
}
