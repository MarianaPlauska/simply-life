import { useMemo, useState } from 'react'
import {
  Trash2, CheckCircle2, AlertCircle, CalendarClock,
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart,
  Zap, Briefcase, Shield, Target, Wallet, DollarSign, Search, ArrowUpDown,
} from 'lucide-react'
import { FinancePeriodToolbar } from './FinancePeriodToolbar'
import { FinanceGroupedRollupTable } from './FinanceGroupedRollupTable'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { CATEGORY_GRUPO_LABELS } from '../../lib/financeDefaultCategories'
import { filterTransactionsByGrupo, GRUPO_ORDER } from '../../lib/financeGroupRollup'
import { resolveFinancePeriod, type FinancePeriodConfig } from '../../lib/financePeriodFilter'
import {
  AXEL_BENTO_PANEL,
  AXEL_FIELD_INPUT,
  AXEL_LIST_FILTER_ACTIVE,
  AXEL_LIST_FILTER_IDLE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { paymentMethodLabel } from '../../lib/financePaymentMethod'
import { FinanceTxLabel } from './overview/FinanceTxLabel'
import type { Category, CategoryGrupo, Transaction } from '../../store/storeTypes'

// FinanceTransactionsTab — tabela densa estilo Excel/Bloomberg
// Sem caixas, sem rounded-lg pesado, sem hover que cresce
// Zebra stripe sutil + sticky header + fonte mono para numeros

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> =
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
    () => [...filteredTx].sort((a, b) => b.data.localeCompare(a.data)),
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
        className={AXEL_BENTO_PANEL}
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
      <ul className="md:hidden border border-line rounded-sl divide-y divide-line">
        {rows.length === 0 && (
          <li className={`py-12 text-center text-[12px] px-4 ${AXEL_TEXT_SECONDARY}`}>
            Nenhum lançamento para os filtros atuais.
          </li>
        )}
        {rows.map((t) =>
        {
          const isRec = t.tipo === 'receita'
          const cat = activeCategories.find((c) => c.id === t.categoria_id || c.nome === t.categoria)
          const statusKey = (t.status_pagamento || 'pendente') as keyof typeof STATUS_CONFIG
          const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendente
          const StatusIcon = status.icon
          const { before, after } = balancePair(t, accumulated)

          return (
            <li key={t.id} className={`px-3 py-3 space-y-2 ${AXEL_ROW_HOVER}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <FinanceTxLabel label={t.descricao} observacao={t.observacao} className="text-[13px]" />
                  <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                    {fmtDate(t.data)}
                    {' · '}
                    {paymentMethodLabel(t)}
                    {' · '}
                    {isRec ? 'Receita' : (cat?.nome || '-')}
                  </p>
                </div>
                <span className={`font-mono tabular-nums font-semibold shrink-0 text-[13px] ${
                  isRec ? 'text-concluido' : AXEL_TEXT_PRIMARY
                }`}>
                  {isRec ? '+' : '−'}{fmt(t.valor)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${status.text}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`font-mono tabular-nums text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    {fmt(before)}
                    <span className="mx-1 opacity-60">→</span>
                    <span className={after >= 0 ? AXEL_TEXT_PRIMARY : 'text-urgente'}>
                      {fmt(after)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTransaction(t.id)}
                    className="p-2 text-ink-muted hover:text-urgente min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Remover lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            </li>
          )
        })}
      </ul>

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
                <td colSpan={8} className={`py-16 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
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
  return (
    <section className={`${AXEL_BENTO_PANEL} p-3 space-y-3`}>
      <div className={`flex items-center gap-2 min-h-[44px] ${AXEL_FIELD_INPUT} py-1.5`}>
        <Search className={`w-3.5 h-3.5 shrink-0 ${AXEL_TEXT_SECONDARY}`} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar lançamento..."
          className={`bg-transparent text-[12px] placeholder:text-ink-muted outline-none w-full ${AXEL_TEXT_PRIMARY}`}
        />
      </div>

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
