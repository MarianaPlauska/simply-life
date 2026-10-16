import { type ReactNode, useEffect, useState } from 'react'
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
import { Panel } from '../../ui/Panel'
import { useWebDesk } from '../dashboard/web/webBox'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'
import { useFinanceDeskGrid } from './desk/deskLayout'
import { DeskPanelHeader } from './desk/DeskPanelHeader'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { resolveCategoryMeta, visibleCategoryIds } from '../../lib/categoryMeta'

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
  const desk = useWebDesk()
  const deskGrid = useFinanceDeskGrid()
  const catMap = useCategoryMetaStore((s) => s.map)
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

      {subTab === 'conta' && desk && (
        // computador: saldo, categorias e convite lado a lado na grade
        <View style={deskGrid.grid}>
          <Panel style={deskGrid.span2}>
            <View style={{ gap: 16 }}>
              <DeskPanelHeader title="Conta corrente" subtitle="Saldo disponível hoje" />
              <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 36, lineHeight: 44, color: colors.ink }}>
                {formatSaldo(pos.disponivel)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 48, flexWrap: 'wrap' }}>
                <View style={{ gap: 2 }}>
                  <Text variant="caption" muted>Receitas</Text>
                  <Text variant="body" color={colors.health} style={{ fontFamily: 'Lexend_500Medium' }}>{formatBRL(pos.receitas)}</Text>
                </View>
                <View style={{ gap: 2 }}>
                  <Text variant="caption" muted>Despesas</Text>
                  <Text variant="body" style={{ fontFamily: 'Lexend_500Medium' }}>{formatBRL(pos.despesas)}</Text>
                </View>
                <View style={{ gap: 2 }}>
                  <Text variant="caption" muted>Fixas do mês</Text>
                  <Text variant="body" style={{ fontFamily: 'Lexend_500Medium' }}>{formatBRL(pos.fixasMes)}</Text>
                </View>
              </View>
              <Text variant="caption" muted>As fixas do mês entram no saldo projetado.</Text>
            </View>
          </Panel>
          <Panel>
            <View style={{ gap: 12 }}>
              <DeskPanelHeader
                title="Categorias"
                subtitle="Nome, ícone e cor de cada gasto"
                actionLabel="Editar"
                onAction={() => setCatsOpen(true)}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {visibleCategoryIds(catMap).map((id) =>
                {
                  const meta = resolveCategoryMeta(id, catMap)
                  const tint = seriesColor(meta.color, chart)
                  return (
                    <View
                      key={id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: colors.hairline,
                      }}
                    >
                      <FinanceIcon name={String(meta.icon)} size={16} color={tint} />
                      <Text variant="caption">{meta.label}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
            <InvitePartnerCard />
          </Panel>
          <FinanceCategoriesSheet visible={catsOpen} onClose={() => setCatsOpen(false)} />
        </View>
      )}

      {subTab === 'conta' && !desk && (
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

      {subTab === 'salario' && (
        // computador: formulário com largura de leitura, não esticado na tela toda
        <View style={desk ? { maxWidth: 760 } : undefined}>
          <FinanceSalaryPane />
        </View>
      )}

      {subTab === 'cartoes' && (
        <FinanceCardsHub
          cards={cards}
          onExtrato={() => onGoMovimentos?.()}
          onFaturas={() => onSubTabChange('faturas')}
        />
      )}

      {subTab === 'faturas' && desk && (
        <Panel>
          <View>
            <DeskPanelHeader title="A pagar" subtitle="Em aberto primeiro, por vencimento" />
            {bills.length === 0 ? (
              <EmptyState title="Nada a pagar" body="Contas e faturas aparecem aqui." />
            ) : (
              <DeskTable
                cols="minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) 140px"
                head={['Conta', 'Vencimento', 'Situação', 'Valor']}
                rows={[...bills]
                  .sort((a, b) =>
                    (a.status === b.status ? 0 : a.status === 'aberta' ? -1 : 1)
                    || a.vencimento.localeCompare(b.vencimento))
                  .map((bill) =>
                  {
                    const iso = bill.vencimento.slice(0, 10)
                    const late = bill.status === 'aberta' && iso < todayIso()
                    return {
                      key: String(bill.id),
                      cells: [
                        <Text key="t" variant="body" numberOfLines={1} style={{ fontSize: 15, lineHeight: 22 }}>{bill.titulo}</Text>,
                        <Text key="v" variant="caption" muted>
                          {new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </Text>,
                        <Text key="s" variant="caption" color={late ? colors.danger : bill.status === 'paga' ? colors.health : colors.inkMuted}>
                          {bill.status === 'paga' ? 'Paga' : late ? 'Venceu' : 'Em aberto'}
                        </Text>,
                        <Text key="r" variant="body" style={{ fontSize: 15, lineHeight: 22, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                          {formatBRL(bill.valor)}
                        </Text>,
                      ],
                    }
                  })}
              />
            )}
          </View>
        </Panel>
      )}

      {subTab === 'faturas' && !desk && (
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

      {subTab === 'contas-fixas' && desk && (
        <Panel>
          <View>
            <DeskPanelHeader
              title="Contas fixas"
              subtitle={`${formatBRL(fixas.filter((c) => c.ativa).reduce((a, c) => a + c.valor, 0))} por mês`}
              actionLabel="Editar"
              onAction={() => setFixasOpen(true)}
            />
            {fixas.length === 0 ? (
              <EmptyState title="Sem contas fixas" body="Aluguel, internet e assinaturas ficam aqui." />
            ) : (
              <DeskTable
                cols="minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) 140px"
                head={['Conta', 'Vencimento', 'Urgência', 'Valor']}
                onRowPress={() => setFixasOpen(true)}
                rows={fixas.map((conta) =>
                {
                  const meta = resolveFixa(conta.id, conta.categoria)
                  const tint = seriesColor(meta.color, chart)
                  return {
                    key: String(conta.id),
                    cells: [
                      <View key="n" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: `${tint}22` }}>
                          <FinanceIcon name={meta.icon} size={16} color={tint} />
                        </View>
                        <Text variant="body" numberOfLines={1} style={{ fontSize: 15, lineHeight: 22, flexShrink: 1 }}>{conta.nome}</Text>
                      </View>,
                      <Text key="d" variant="caption" muted>Dia {conta.diaVencimento}</Text>,
                      <Text key="u" variant="caption" muted>{FIXA_URGENCIA_LABELS[meta.urgencia]}</Text>,
                      <Text key="v" variant="body" style={{ fontSize: 15, lineHeight: 22, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                        {formatBRL(conta.valor)}
                      </Text>,
                    ],
                  }
                })}
              />
            )}
          </View>
          <FinanceFixasSheet visible={fixasOpen} onClose={() => setFixasOpen(false)} />
        </Panel>
      )}

      {subTab === 'contas-fixas' && !desk && (
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

/** Tabela simples do computador: cabeçalho fino e linhas alinhadas na mesma grade. */
function DeskTable({
  cols,
  head,
  rows,
  onRowPress,
}: {
  cols: string
  head: string[]
  rows: { key: string; cells: ReactNode[] }[]
  onRowPress?: (key: string) => void
})
{
  const { colors } = useTheme()
  const grid = { display: 'grid', gridTemplateColumns: cols, columnGap: 16, alignItems: 'center', paddingHorizontal: 20 }
  return (
    <View style={{ marginHorizontal: -20, marginBottom: -16 }}>
      <View style={webStyle({ ...grid, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.hairline })}>
        {head.map((h, i) => (
          <Text key={h} variant="label" muted style={i === head.length - 1 ? { textAlign: 'right' } : undefined}>{h}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <WebHoverable
          key={r.key}
          onPress={onRowPress ? () => onRowPress(r.key) : undefined}
          style={(hovered) => webStyle({
            ...grid,
            minHeight: 52,
            paddingVertical: 10,
            borderBottomWidth: i < rows.length - 1 ? 1 : 0,
            borderBottomColor: colors.hairline,
            backgroundColor: hovered && onRowPress ? colors.surface : 'transparent',
            cursor: onRowPress ? 'pointer' : 'default',
          })}
        >
          {r.cells}
        </WebHoverable>
      ))}
    </View>
  )
}
