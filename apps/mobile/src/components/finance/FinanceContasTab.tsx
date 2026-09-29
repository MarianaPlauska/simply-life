import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  computeSaldoDisponivel,
  formatBRL,
  todayIso,
  formatSaldo,
  seriesColor,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, ListRow, EmptyState, SubNavTabs, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useFixaMetaStore } from '../../store/fixaMetaStore'
import { FIXA_URGENCIA_LABELS } from '../../lib/fixaMeta'
import { FinanceIcon } from '../../lib/financeIcons'
import { visibleContasTabs, type ContasSubTab } from './financeNav'
import { useModules } from '../../hooks/useModules'
import { FinanceCardsHub } from './FinanceCardsHub'
import { InvitePartnerCard } from './InvitePartnerCard'
import { FinanceCategoriesSheet } from './FinanceCategoriesSheet'
import { FinanceFixasSheet } from './FinanceFixasSheet'
import { FinanceSalaryPane } from './FinanceSalaryPane'

type Props = {
  subTab: ContasSubTab
  onSubTabChange: (tab: ContasSubTab) => void
  onGoMovimentos?: () => void
}

/** Vencimento em texto: paga, venceu (em aberto e atrasada) ou vence. */
function billSubtitle(status: 'aberta' | 'paga', iso: string): string
{
  const day = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  if (status === 'paga') return `Paga, vencia ${day}`
  return iso < todayIso() ? `Venceu ${day}` : `Vence ${day}`
}

export function FinanceContasTab({ subTab, onSubTabChange, onGoMovimentos }: Props)
{
  const { colors, space, chart } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const cash = useDataStore((s) => s.cashAccount)
  const cards = useDataStore((s) => s.financeCards)
  const fixas = useDataStore((s) => s.contasFixas)
  const bills = useDataStore((s) => s.contasAPagar)
  const pos = computeSaldoDisponivel(cash, txs, fixas)
  const [catsOpen, setCatsOpen] = useState(false)
  const [fixasOpen, setFixasOpen] = useState(false)
  const hydrateFixas = useFixaMetaStore((s) => s.hydrate)
  const resolveFixa = useFixaMetaStore((s) => s.resolve)
  const fixaMap = useFixaMetaStore((s) => s.map)
  const subTabs = visibleContasTabs(useModules().on)
  const shown = subTabs.some((t) => t.id === subTab) ? subTab : (subTabs[0]?.id ?? subTab)
  useEffect(() =>
  {
    if (shown !== subTab) onSubTabChange(shown)
  }, [shown, subTab, onSubTabChange])

  useEffect(() =>
  {
    void hydrateFixas()
  }, [hydrateFixas])

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={subTabs.map((t) => ({
          ...t,
          count:
            t.id === 'cartoes'
              ? cards.length
              : t.id === 'faturas'
                ? bills.filter((b) => b.status === 'aberta').length
                : t.id === 'contas-fixas'
                  ? fixas.filter((c) => c.ativa).length
                  : undefined,
        }))}
        value={subTab}
        onChange={onSubTabChange}
        accent="finance"
      />

      {subTab === 'conta' && (
        <>
          <Card tone="elevated" style={{ gap: space.md }}>
            <SectionHeader title="Conta corrente" subtitle="Saldo disponível hoje" />
            <Text variant="hero" color={colors.finance}>
              {formatSaldo(pos.disponivel)}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" muted>
                  Receitas
                </Text>
                <Text variant="bodyStrong" color={colors.health}>
                  {formatBRL(pos.receitas)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" muted>
                  Despesas
                </Text>
                <Text variant="bodyStrong" color={colors.finance}>
                  {formatBRL(pos.despesas)}
                </Text>
              </View>
            </View>
            <Text variant="caption" muted>
              Fixas do mês ({formatBRL(pos.fixasMes)}) entram no projetado.
            </Text>
          </Card>
          <InvitePartnerCard />
          <Card tone="elevated" style={{ gap: space.sm }}>
            <SectionHeader
              title="Categorias"
              subtitle="Nome, ícone e cor de cada gasto"
              action={
                <PrimaryButton
                  label="Editar"
                  variant="link"
                  size="sm"
                  onPress={() => setCatsOpen(true)}
                />
              }
            />
          </Card>
          <FinanceCategoriesSheet visible={catsOpen} onClose={() => setCatsOpen(false)} />
        </>
      )}

      {subTab === 'salario' && <FinanceSalaryPane />}

      {subTab === 'cartoes' && (
        <FinanceCardsHub
          cards={cards}
          onExtrato={() => onGoMovimentos?.()}
          onFaturas={() => onSubTabChange('faturas')}
        />
      )}

      {subTab === 'faturas' && (
        <Card tone="elevated" style={{ paddingVertical: space.sm }}>
          {bills.length === 0 ? (
            <EmptyState title="Nada a pagar" body="Contas e faturas aparecem aqui." />
          ) : (
            // em aberto primeiro, por vencimento; pagas no fim, marcadas como pagas
            [...bills]
              .sort((a, b) =>
                (a.status === b.status ? 0 : a.status === 'aberta' ? -1 : 1)
                || a.vencimento.localeCompare(b.vencimento))
              .map((bill, i, arr) => (
                <ListRow
                  key={bill.id}
                  title={bill.titulo}
                  subtitle={billSubtitle(bill.status, bill.vencimento.slice(0, 10))}
                  right={formatBRL(bill.valor)}
                  showSeparator={i < arr.length - 1}
                />
              ))
          )}
        </Card>
      )}

      {subTab === 'contas-fixas' && (
        <>
          <Card tone="elevated" style={{ paddingVertical: space.sm }}>
            <SectionHeader
              title="Contas fixas"
              subtitle="Vencimento, ícone, cor e urgência"
              action={
                <PrimaryButton
                  label="Editar"
                  variant="link"
                  size="sm"
                  onPress={() => setFixasOpen(true)}
                />
              }
            />
            {fixas.length === 0 ? (
              <EmptyState title="Sem contas fixas" body="Aluguel, internet e assinaturas ficam aqui." />
            ) : (
              fixas.map((conta, i) =>
              {
                const meta = resolveFixa(conta.id, conta.categoria)
                void fixaMap
                return (
                  <View
                    key={conta.id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8 }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${seriesColor(meta.color, chart)}33`,
                      }}
                    >
                      <FinanceIcon name={meta.icon} size={18} color={seriesColor(meta.color, chart)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ListRow
                        title={conta.nome}
                        subtitle={`Dia ${conta.diaVencimento} · ${FIXA_URGENCIA_LABELS[meta.urgencia]}`}
                        right={formatBRL(conta.valor)}
                        showSeparator={i < fixas.length - 1}
                        onPress={() => setFixasOpen(true)}
                      />
                    </View>
                  </View>
                )
              })
            )}
          </Card>
          <FinanceFixasSheet visible={fixasOpen} onClose={() => setFixasOpen(false)} />
        </>
      )}
    </View>
  )
}
