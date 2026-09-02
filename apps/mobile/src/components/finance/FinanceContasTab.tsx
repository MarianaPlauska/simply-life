import { View } from 'react-native'
import {
  computeSaldoDisponivel,
  formatBRL,
  formatSaldo,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, ListRow, EmptyState, SubNavTabs } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { CONTAS_SUB_TABS, type ContasSubTab } from './financeNav'
import { FinanceCardsHub } from './FinanceCardsHub'

type Props = {
  subTab: ContasSubTab
  onSubTabChange: (tab: ContasSubTab) => void
  onGoMovimentos?: () => void
}

export function FinanceContasTab({ subTab, onSubTabChange, onGoMovimentos }: Props)
{
  const { colors, space } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const cash = useDataStore((s) => s.cashAccount)
  const cards = useDataStore((s) => s.financeCards)
  const fixas = useDataStore((s) => s.contasFixas)
  const bills = useDataStore((s) => s.contasAPagar)
  const pos = computeSaldoDisponivel(cash, txs, fixas)

  return (
    <View style={{ gap: space.lg }}>
      <SubNavTabs
        tabs={CONTAS_SUB_TABS.map((t) => ({
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
      )}

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
            bills.map((bill, i) => (
              <ListRow
                key={bill.id}
                title={bill.titulo}
                subtitle={`Vence ${bill.vencimento}`}
                right={formatBRL(bill.valor)}
                showSeparator={i < bills.length - 1}
              />
            ))
          )}
        </Card>
      )}

      {subTab === 'contas-fixas' && (
        <Card tone="elevated" style={{ paddingVertical: space.sm }}>
          {fixas.length === 0 ? (
            <EmptyState title="Sem contas fixas" body="Aluguel, internet e assinaturas ficam aqui." />
          ) : (
            fixas.map((conta, i) => (
              <ListRow
                key={conta.id}
                title={conta.nome}
                subtitle={`Dia ${conta.diaVencimento} · ${conta.categoria}`}
                right={formatBRL(conta.valor)}
                showSeparator={i < fixas.length - 1}
              />
            ))
          )}
        </Card>
      )}
    </View>
  )
}
