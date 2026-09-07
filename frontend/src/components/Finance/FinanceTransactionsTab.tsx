import { useEffect, useMemo, useState } from 'react'
import {
  Trash2, CheckCircle2, AlertCircle, CalendarClock,
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart,
  Zap, Briefcase, Shield, Target, Wallet, DollarSign, Search, ArrowUpDown,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { FinancePeriodToolbar } from './FinancePeriodToolbar'
import { FinanceGroupedRollupTable } from './FinanceGroupedRollupTable'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { CATEGORY_GRUPO_LABELS } from '../../lib/financeDefaultCategories'
import { filterTransactionsByGrupo, GRUPO_ORDER } from '../../lib/financeGroupRollup'
import { resolveFinancePeriod, type FinancePeriodConfig } from '../../lib/financePeriodFilter'
import {
  AXEL_FIELD_INPUT,
  AXEL_LIST_FILTER_ACTIVE,
  AXEL_LIST_FILTER_IDLE,
  AXEL_METRIC_HAIRLINE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { paymentMethodLabel } from '../../lib/financePaymentMethod'
import { dedupeTransactionsForLedger } from '../../lib/financeTransactionDedup'
import { AxelListRow } from '../ui/AxelListRow'
import type { Category, CategoryGrupo, Transaction } from '../../store/storeTypes'
import type { LucideIcon } from 'lucide-react'

// FinanceTransactionsTab - tabela densa estilo Excel/Bloomberg
// Sem caixas, sem rounded-lg pesado, sem hover que cresce
// Zebra stripe sutil + sticky header + fonte mono para numeros

const ICON_MAP: Record<string, LucideIcon> =
{
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Wallet, Shield, Target, Briefcase,
}

const STATUS_CONFIG = {
  pago:      { label: 'Pago',      icon: CheckCircle2,  text: 'text-emerald-400' },
  pendente:  { label: 'Pendente',  icon: AlertCircle,   text: 'text-amber-400'   },
  agendado:  { label: 'Agendado',  icon: CalendarClock, text: 'text-sky-400'     },
} as const

function fmt(value: number)
{
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string)
{
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function balancePair(t: Transaction, accumulated: Map<number, number>)
{
  const delta = t.tipo === 'receita' ? t.valor : -t.valor
  const after = accumulated.get(t.id) ?? 0
  const before = after - delta
  return { before, after }
}

type SortKey = 'data' | 'descricao' | 'categoria' | 'valor' | 'status'
type SortDir = 'asc' | 'desc'

interface FinanceTransactionsTabProps
{
  periodLabel: string
  periodConfig: FinancePeriodConfig
  onPeriodChange: (config: FinancePeriodConfig) => void
  onPeriodShift: (direction: -1 | 1) => void
  filterCat: string
  setFilterCat: (cat: string) => void
  activeCategories: Category[]
  filterStatus: string
  setFilterStatus: (status: string) => void
  periodTransactions: Transaction[]
  removeTransaction: (id: number) => void
}

export function FinanceTransactionsTab({
  periodLabel,
  periodConfig,
  onPeriodChange,
  onPeriodShift,
  filterCat,
  setFilterCat,
  activeCategories,
  filterStatus,
  setFilterStatus,
  periodTransactions,
  removeTransaction,
}: FinanceTransactionsTabProps)
{
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('data')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterGrupo, setFilterGrupo] = useState<CategoryGrupo | 'all'>('all')
  const [mobileOpen, setMobileOpen] = useState(true)
  const [mobilePage, setMobilePage] = useState(0)

  const MOBILE_PAGE_SIZE = 5

  const resolvedPeriod = useMemo(
    () => resolveFinancePeriod(periodConfig),
    [periodConfig],
  )

  const filteredTx = useMemo(() =>
  {
    let result = filterTransactionsByGrupo(periodTransactions, activeCategories, filterGrupo)

    if (filterCat !== 'all')
    {
      if (filterCat === 'receita') result = result.filter((t) => t.tipo === 'receita')
      else result = result.filter((t) => t.categoria_id === parseInt(filterCat) || t.categoria === filterCat)
    }

    if (filterStatus !== 'all')
    {
      result = result.filter((t) =>
      {
        const sp = t.status_pagamento
        return sp === filterStatus || (!sp && filterStatus === 'pendente')
      })
    }

    return result
  }, [periodTransactions, activeCategories, filterGrupo, filterCat, filterStatus])

  const sorted = useMemo(
    () => dedupeTransactionsForLedger([...filteredTx]).sort((a, b) => b.data.localeCompare(a.data)),
    [filteredTx],
  )

  // aplica busca textual + ordenacao definida pelo usuario sobre o ja-filtrado
  const rows = useMemo(() =>
  {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? sorted.filter((t) =>
          (t.descricao || '').toLowerCase().includes(q)
          || (t.categoria || '').toLowerCase().includes(q))
      : sorted

    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) =>
    {
      if (sortKey === 'data') return dir * a.data.localeCompare(b.data)
      if (sortKey === 'descricao') return dir * (a.descricao || '').localeCompare(b.descricao || '')
      if (sortKey === 'categoria') return dir * (a.categoria || '').localeCompare(b.categoria || '')
      if (sortKey === 'valor') return dir * (a.valor - b.valor)
      if (sortKey === 'status') return dir * ((a.status_pagamento || '').localeCompare(b.status_pagamento || ''))
      return 0
    })
  }, [sorted, search, sortKey, sortDir])

  // saldo acumulado linha-a-linha (estilo extrato bancario)
  const accumulated = useMemo(() =>
  {
    let acc = 0
    const map = new Map<number, number>()
    for (let i = rows.length - 1; i >= 0; i--)
    {
      const t = rows[i]
      acc += t.tipo === 'receita' ? t.valor : -t.valor
      map.set(t.id, acc)
    }
    return map
  }, [rows])

  const mobilePageCount = Math.max(1, Math.ceil(rows.length / MOBILE_PAGE_SIZE))
  const mobilePageSafe = Math.min(mobilePage, mobilePageCount - 1)
  const mobileRows = rows.slice(
    mobilePageSafe * MOBILE_PAGE_SIZE,
    mobilePageSafe * MOBILE_PAGE_SIZE + MOBILE_PAGE_SIZE,
  )

  useEffect(() =>
  {
    setMobilePage(0)
  }, [search, filterCat, filterStatus, filterGrupo, periodTransactions.length])

  const toggleSort = (k: SortKey) =>
  {
    if (sortKey === k)
    {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    }
    else
    {
      setSortKey(k)
      setSortDir(k === 'data' || k === 'valor' ? 'desc' : 'asc')
    }
  }

  return (
    <div className="space-y-3">
      <FinancePeriodToolbar
        config={periodConfig}
        resolved={resolvedPeriod}
        onChange={onPeriodChange}
        onShift={onPeriodShift}
      />

      <Toolbar
        search={search}
        setSearch={setSearch}
        filterCat={filterCat}
        setFilterCat={setFilterCat}
        activeCategories={activeCategories}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterGrupo={filterGrupo}
        setFilterGrupo={setFilterGrupo}
      />

      <DashboardCollapsible
        title="Resumo por grupo"
        subtitle={periodLabel}
        defaultOpen={false}
        borderless
        bodyClassName="pt-0"
      >
        <FinanceGroupedRollupTable
          embedded
          transactions={filteredTx}
          activeCategories={activeCategories}
          periodLabel={periodLabel}
        />
      </DashboardCollapsible>

      {/* Lista mobile */}
      <div className="md:hidden border border-line rounded-sl overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border-b border-line bg-chrome/40 text-left min-h-[44px]"
        >
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Extrato · {rows.length} lançamento{rows.length !== 1 ? 's' : ''}
          </span>
          {mobileOpen ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
        </button>

        {mobileOpen && (
          <>
            <ul className="max-h-[min(55vh,480px)] overflow-y-auto custom-scrollbar">
              {rows.length === 0 && (
                <li className={`py-3 text-center text-[13px] px-3 ${AXEL_TEXT_SECONDARY}`}>
                  Nenhum lançamento para os filtros atuais.
                </li>
              )}
              {mobileRows.map((t) =>
              {
                const isRec = t.tipo === 'receita'
                const cat = activeCategories.find((c) => c.id === t.categoria_id || c.nome === t.categoria)
                const CatIcon = cat ? (ICON_MAP[cat.icone] || Wallet) : DollarSign
                const statusKey = (t.status_pagamento || 'pendente') as keyof typeof STATUS_CONFIG
                const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendente

                return (
                  <AxelListRow
                    key={t.id}
                    icon={CatIcon}
                    title={t.descricao}
                    subtitle={[
                      fmtDate(t.data),
                      paymentMethodLabel(t),
                      status.label,
                      t.compartilhada ? 'Casal' : null,
                      t.pago_conta_casal && !t.compartilhada
                        ? `${fmt(t.valor)} na conta do casal`
                        : null,
                    ].filter(Boolean).join(' · ')}
                    trailing={(
                      <span className="inline-flex items-center gap-1">
                        {isRec ? '+' : '−'}{fmt(t.valor)}
                        <button
                          type="button"
                          onClick={() => removeTransaction(t.id)}
                          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-ink-muted hover:text-ink"
                          aria-label="Remover lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                  />
                )
              })}
            </ul>

            {rows.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-line bg-chrome/30">
                <button
                  type="button"
                  disabled={mobilePageSafe <= 0}
                  onClick={() => setMobilePage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted disabled:opacity-40 min-h-[40px] px-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <span className={`font-mono text-[9px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                  {mobilePageSafe + 1} / {mobilePageCount}
                </span>
                <button
                  type="button"
                  disabled={mobilePageSafe >= mobilePageCount - 1}
                  onClick={() => setMobilePage((p) => Math.min(mobilePageCount - 1, p + 1))}
                  className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted disabled:opacity-40 min-h-[40px] px-2"
                >
                  Próxima
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="hidden md:block border border-line rounded-sl overflow-x-auto">
        <table className="w-full min-w-[720px] text-[12px] border-collapse">
          <thead className="bg-chrome sticky top-0 z-10">
            <tr className="border-b border-line">
              <Th onClick={() => toggleSort('data')} active={sortKey === 'data'} dir={sortDir} width="w-[68px]">Data</Th>
              <Th width="w-[36px]"></Th>
              <Th onClick={() => toggleSort('descricao')} active={sortKey === 'descricao'} dir={sortDir}>Descrição</Th>
              <Th onClick={() => toggleSort('categoria')} active={sortKey === 'categoria'} dir={sortDir} width="w-[140px]">Categoria</Th>
              <Th onClick={() => toggleSort('status')} active={sortKey === 'status'} dir={sortDir} width="w-[88px]">Status</Th>
              <Th onClick={() => toggleSort('valor')} active={sortKey === 'valor'} dir={sortDir} width="w-[110px]" align="right">Valor</Th>
              <Th width="w-[130px]" align="right">Extrato</Th>
              <Th width="w-[28px]"></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) =>
            {
              const isRec = t.tipo === 'receita'
              const cat = activeCategories.find((c) => c.id === t.categoria_id || c.nome === t.categoria)
              const CatIcon = cat ? (ICON_MAP[cat.icone] || Wallet) : DollarSign
              const statusKey = (t.status_pagamento || 'pendente') as keyof typeof STATUS_CONFIG
              const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendente
              const StatusIcon = status.icon
              const { before, after } = balancePair(t, accumulated)

              return (
                <tr
                  key={t.id}
                  className={`group border-b border-line ${AXEL_ROW_HOVER} ${
                    i % 2 === 0 ? '' : 'bg-chrome/30'
                  }`}
                >
                  <Td className={`tabular-nums font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>{fmtDate(t.data)}</Td>
                  <Td>
                    <div
                      className="w-5 h-5 flex items-center justify-center"
                      style={{ color: isRec ? 'var(--sl-concluido, #10b981)' : (cat?.cor || undefined) }}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>
                  </Td>
                  <Td className={`truncate ${AXEL_TEXT_PRIMARY}`}>{t.descricao}</Td>
                  <Td className={AXEL_TEXT_SECONDARY}>{isRec ? 'Receita' : (cat?.nome || '-')}</Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </Td>
                  <Td align="right" className={`font-mono tabular-nums font-semibold ${isRec ? 'text-concluido' : AXEL_TEXT_PRIMARY}`}>
                    {isRec ? '+' : '−'}{fmt(t.valor)}
                  </Td>
                  <Td align="right" className={`font-mono tabular-nums text-[10.5px] ${AXEL_TEXT_SECONDARY}`}>
                    <span>{fmt(before)}</span>
                    <span className="mx-0.5 opacity-50">→</span>
                    <span className={after >= 0 ? AXEL_TEXT_PRIMARY : 'text-urgente'}>{fmt(after)}</span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => removeTransaction(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-ink-muted hover:text-urgente"
                      aria-label="Remover lançamento"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={`py-3 text-center text-[13px] ${AXEL_TEXT_SECONDARY}`}>
                  Nenhum lançamento para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="text-[11px] pt-1">
        <span className={`font-mono tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {rows.length} de {filteredTx.length} lançamentos
        </span>
      </footer>
    </div>
  )
}

// ─── subcomponentes da tabela ─────────────────────────────

interface ThProps
{
  children?: React.ReactNode
  width?: string
  align?: 'left' | 'right'
  onClick?: () => void
  active?: boolean
  dir?: SortDir
}

function Th({ children, width, align = 'left', onClick, active, dir }: ThProps)
{
  return (
    <th
      onClick={onClick}
      className={`${width || ''} text-[9.5px] font-bold uppercase tracking-[0.18em] py-2 px-2 ${AXEL_TEXT_SECONDARY} ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${onClick ? 'cursor-pointer hover:text-ink select-none' : ''}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {onClick && (
          <ArrowUpDown className={`w-2.5 h-2.5 ${active ? (dir === 'asc' ? 'text-accent' : 'text-accent rotate-180') : 'opacity-30'}`} />
        )}
      </span>
    </th>
  )
}

interface TdProps
{
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}

function Td({ children, className, align = 'left' }: TdProps)
{
  return (
    <td className={`py-2 px-2 ${align === 'right' ? 'text-right' : ''} ${className || ''}`}>
      {children}
    </td>
  )
}

// ─── toolbar de filtros + busca ────────────────────────────

interface ToolbarProps
{
  search: string
  setSearch: (s: string) => void
  filterCat: string
  setFilterCat: (cat: string) => void
  activeCategories: Category[]
  filterStatus: string
  setFilterStatus: (status: string) => void
  filterGrupo: CategoryGrupo | 'all'
  setFilterGrupo: (g: CategoryGrupo | 'all') => void
}

function Toolbar({
  search,
  setSearch,
  filterCat,
  setFilterCat,
  activeCategories,
  filterStatus,
  setFilterStatus,
  filterGrupo,
  setFilterGrupo,
}: ToolbarProps)
{
  const [filtersOpen, setFiltersOpen] = useState(false)
  const advancedOn = filterGrupo !== 'all' || filterCat !== 'all' || filterStatus !== 'all'

  return (
    <section className={`${AXEL_METRIC_HAIRLINE} space-y-3 py-3`}>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 min-h-[44px] flex-1 ${AXEL_FIELD_INPUT} py-1.5`}>
          <Search className={`w-3.5 h-3.5 shrink-0 ${AXEL_TEXT_SECONDARY}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lançamento..."
            className={`bg-transparent text-[12px] placeholder:text-ink-muted outline-none w-full ${AXEL_TEXT_PRIMARY}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="shrink-0 inline-flex items-center min-h-[44px] px-3 text-[13px] font-medium text-ink-muted hover:text-ink"
          aria-expanded={filtersOpen}
        >
          Filtrar
          {advancedOn && <span className="ml-1 tabular-nums text-ink">·</span>}
        </button>
      </div>

      {filtersOpen && (
        <div className="space-y-3">
          <FilterRow label="Grupo">
            <FilterChip active={filterGrupo === 'all'} onClick={() => setFilterGrupo('all')}>
              Todos
            </FilterChip>
            {GRUPO_ORDER.map((g) => (
              <FilterChip
                key={g}
                active={filterGrupo === g}
                onClick={() => setFilterGrupo(g)}
              >
                {CATEGORY_GRUPO_LABELS[g]}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Categoria">
            <FilterChip active={filterCat === 'all'} onClick={() => setFilterCat('all')}>
              Todas
            </FilterChip>
            <FilterChip active={filterCat === 'receita'} onClick={() => setFilterCat('receita')}>
              Receitas
            </FilterChip>
            {activeCategories.slice(0, 8).map((cat) => (
              <FilterChip
                key={cat.id}
                active={filterCat === String(cat.id)}
                onClick={() => setFilterCat(String(cat.id))}
              >
                {cat.nome}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Status">
            {(['all', 'pago', 'pendente', 'agendado'] as const).map((st) => (
              <FilterChip
                key={st}
                active={filterStatus === st}
                onClick={() => setFilterStatus(st)}
              >
                {st === 'all' ? 'Todos' : STATUS_CONFIG[st].label}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      )}
    </section>
  )
}

interface FilterRowProps
{
  label: string
  children: React.ReactNode
}

function FilterRow({ label, children }: FilterRowProps)
{
  return (
    <div className="space-y-1.5">
      <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
        {label}
      </p>
      <div className="flex flex-wrap gap-x-2 gap-y-1 overflow-x-auto scrollbar-none -mx-0.5">
        {children}
      </div>
    </div>
  )
}

interface FilterChipProps
{
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterChip({ active, onClick, children }: FilterChipProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? AXEL_LIST_FILTER_ACTIVE : AXEL_LIST_FILTER_IDLE}
    >
      {children}
    </button>
  )
}
