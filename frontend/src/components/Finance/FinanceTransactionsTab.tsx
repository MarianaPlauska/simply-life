import { useMemo, useState } from 'react'
import {
  Trash2, CheckCircle2, AlertCircle, CalendarClock,
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart,
  Zap, Briefcase, Shield, Target, Wallet, DollarSign, Search, ArrowUpDown,
} from 'lucide-react'
import { FinancePeriodToolbar } from './FinancePeriodToolbar'
import { FinanceGroupedRollupTable } from './FinanceGroupedRollupTable'
import { CATEGORY_GRUPO_LABELS } from '../../lib/financeDefaultCategories'
import { filterTransactionsByGrupo, GRUPO_ORDER } from '../../lib/financeGroupRollup'
import { resolveFinancePeriod, type FinancePeriodConfig } from '../../lib/financePeriodFilter'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { paymentMethodLabel } from '../../lib/financePaymentMethod'
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
  const [showGrupos, setShowGrupos] = useState(false)

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

  const totalReceita = filteredTx.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesa = filteredTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = totalReceita - totalDespesa

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
        showGrupos={showGrupos}
        setShowGrupos={setShowGrupos}
      />

      {showGrupos && (
        <FinanceGroupedRollupTable
          transactions={filteredTx}
          activeCategories={activeCategories}
          periodLabel={periodLabel}
        />
      )}

      {/* Lista mobile */}
      <ul className="md:hidden border border-line rounded-sl divide-y divide-line">
        {rows.length === 0 && (
          <li className="py-12 text-center text-[12px] text-zinc-600 px-4">
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
          const acc = accumulated.get(t.id) ?? 0

          return (
            <li key={t.id} className={`px-3 py-3 space-y-2 ${AXEL_ROW_HOVER}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-zinc-200 break-words">{t.descricao}</p>
                  <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                    {fmtDate(t.data)}
                    {' · '}
                    {paymentMethodLabel(t)}
                    {' · '}
                    {isRec ? 'Receita' : (cat?.nome || '-')}
                  </p>
                </div>
                <span className={`font-mono tabular-nums font-semibold shrink-0 text-[13px] ${
                  isRec ? 'text-emerald-400' : 'text-zinc-200'
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
                  <span className={`font-mono tabular-nums text-[10px] ${acc >= 0 ? 'text-zinc-400' : 'text-rose-400'}`}>
                    Saldo {fmt(acc)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTransaction(t.id)}
                    className="p-2 text-zinc-600 hover:text-rose-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
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
              <Th width="w-[110px]" align="right">Saldo</Th>
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
              const acc = accumulated.get(t.id) ?? 0

              return (
                <tr
                  key={t.id}
                  className={`group border-b border-line ${AXEL_ROW_HOVER} ${
                    i % 2 === 0 ? '' : 'bg-chrome/30'
                  }`}
                >
                  <Td className="text-zinc-500 tabular-nums font-mono text-[11px]">{fmtDate(t.data)}</Td>
                  <Td>
                    <div
                      className="w-5 h-5 flex items-center justify-center"
                      style={{ color: isRec ? '#34d399' : (cat?.cor || '#71717a') }}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>
                  </Td>
                  <Td className="text-zinc-200 truncate">{t.descricao}</Td>
                  <Td className="text-zinc-500">{isRec ? 'Receita' : (cat?.nome || '-')}</Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </Td>
                  <Td align="right" className={`font-mono tabular-nums font-semibold ${isRec ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {isRec ? '+' : '−'}{fmt(t.valor)}
                  </Td>
                  <Td align="right" className={`font-mono tabular-nums text-[11px] ${acc >= 0 ? 'text-zinc-400' : 'text-rose-400'}`}>
                    {fmt(acc)}
                  </Td>
                  <Td>
                    <button
                      onClick={() => removeTransaction(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-600 hover:text-rose-400"
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
                <td colSpan={8} className="py-16 text-center text-[12px] text-zinc-600">
                  Nenhum lançamento para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RODAPE — totalizadores estilo Bloomberg */}
      <footer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] pt-1">
        <span className="text-zinc-500 font-mono tabular-nums">
          {rows.length} de {filteredTx.length} lançamentos
        </span>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono tabular-nums">
          <Total label="Entradas" value={`+${fmt(totalReceita)}`} color="text-emerald-400" />
          <Total label="Saídas"   value={`−${fmt(totalDespesa)}`} color="text-rose-400" />
          <Total label="Saldo"    value={fmt(saldo)} color={saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'} highlight />
        </div>
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
      className={`${width || ''} text-[9.5px] font-bold uppercase tracking-[0.18em] text-zinc-600 py-2 px-2 ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${onClick ? 'cursor-pointer hover:text-zinc-300 select-none' : ''}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {onClick && (
          <ArrowUpDown className={`w-2.5 h-2.5 ${active ? (dir === 'asc' ? 'text-violet-400' : 'text-violet-400 rotate-180') : 'opacity-30'}`} />
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

interface TotalProps
{
  label: string
  value: string
  color: string
  highlight?: boolean
}

function Total({ label, value, color, highlight }: TotalProps)
{
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[9.5px] uppercase tracking-wider text-zinc-600">{label}</span>
      <span className={`${color} ${highlight ? 'text-[13px]' : 'text-[11.5px]'} font-bold`}>{value}</span>
    </span>
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
  showGrupos: boolean
  setShowGrupos: (v: boolean) => void
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
  showGrupos,
  setShowGrupos,
}: ToolbarProps)
{
  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-card border border-line rounded-sl px-2 py-1.5 w-full sm:max-w-xs min-h-[44px]">
          <Search className={`w-3 h-3 ${AXEL_TEXT_SECONDARY}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lançamento..."
            className={`bg-transparent text-[12px] placeholder:text-ink-muted outline-none w-full ${AXEL_TEXT_PRIMARY}`}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowGrupos(!showGrupos)}
          className={showGrupos ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
        >
          Resumo por grupo
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <FilterChip active={filterGrupo === 'all'} onClick={() => setFilterGrupo('all')}>
          Todos grupos
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
      </div>

      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
        {/* categoria */}
        <div className="flex gap-1 shrink-0">
          <FilterChip active={filterCat === 'all'} onClick={() => setFilterCat('all')}>
            Tudo
          </FilterChip>
          <FilterChip active={filterCat === 'receita'} onClick={() => setFilterCat('receita')} color="emerald">
            Receitas
          </FilterChip>
          {activeCategories.slice(0, 6).map((cat) => (
            <FilterChip
              key={cat.id}
              active={filterCat === String(cat.id)}
              onClick={() => setFilterCat(String(cat.id))}
            >
              {cat.nome}
            </FilterChip>
          ))}
        </div>

        <div className="h-4 w-px bg-line" />

        {/* status */}
        <div className="flex gap-1 shrink-0">
          {(['all', 'pago', 'pendente', 'agendado'] as const).map((st) => (
            <FilterChip
              key={st}
              active={filterStatus === st}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'all' ? 'Status' : STATUS_CONFIG[st].label}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  )
}

interface FilterChipProps
{
  active: boolean
  onClick: () => void
  children: React.ReactNode
  color?: 'emerald' | 'violet'
}

function FilterChip({ active, onClick, children }: FilterChipProps)
{
  if (active)
  {
    return (
      <button type="button" onClick={onClick} className={AXEL_FILTER_PILL_ACTIVE}>
        {children}
      </button>
    )
  }

  return (
    <button type="button" onClick={onClick} className={AXEL_FILTER_PILL_IDLE}>
      {children}
    </button>
  )
}
