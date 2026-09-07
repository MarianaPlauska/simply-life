import { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  cardFaturaAbertaDisplay,
  formatBRL,
  currentMonthLabel,
  computeSaldoDisponivel,
  rankCategoriesBySpend,
} from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  ListRow,
  PressableScale,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { usePrefsStore } from '../../store/prefsStore'
import { resolveAxelName } from '../../lib/axelName'
import { colorMapFromMeta } from '../../lib/categoryMeta'
import { tabBarScreenPadding } from '../../ui/chrome'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { financeTxSubtitle } from '../../lib/financeTxLabel'
import { CardCarousel } from './CardCarousel'
import { FinanceCardDetailSheet } from './FinanceCardDetailSheet'
import { CardInvoiceSpendSheet } from './CardInvoiceSpendSheet'
import { FinanceCardEditSheet } from './FinanceCardEditSheet'
import { FinanceCardLedgerSheet } from './FinanceCardLedgerSheet'
import { saldoToneForMonth } from './saldoTone'

type Props = {
  onGoMovimentos: () => void
  onGoCartoes?: () => void
  onGoAnalise?: () => void
  cardsFocus: boolean
  onCardsFocusChange: (focus: boolean) => void
}

/**
 * Início = layout valores (ref. 3) + destaques (ref. 2).
 * Cartões = só ao tocar em “Cartões” (ref. 1 no detalhe).
 */
export function FinanceHomeTab({
  onGoMovimentos,
  onGoCartoes,
  onGoAnalise,
  cardsFocus,
  onCardsFocusChange,
}: Props)
{
  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
  const insets = useSafeAreaInsets()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [visibleCardId, setVisibleCardId] = useState<string | null>(null)
  const [sheetMode, setSheetMode] = useState<'invoice' | 'spend' | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const isGuest = useAuthStore((s) => s.isGuest)
  const callsYou = usePrefsStore((s) => s.prefs.axel_calls_you)
  const displayNamePref = usePrefsStore((s) => s.prefs.display_name)
  const txs = useDataStore((s) => s.finance)
  const cash = useDataStore((s) => s.cashAccount)
  const cards = useDataStore((s) => s.financeCards)
  const fixas = useDataStore((s) => s.contasFixas)
  const catMap = useCategoryMetaStore((s) => s.map)
  const hydrateCats = useCategoryMetaStore((s) => s.hydrate)
  const pos = computeSaldoDisponivel(cash, txs, fixas)
  const saldoCaixa = pos.receitas - pos.despesas
  const tone = saldoToneForMonth(saldoCaixa)
  const fabClearance = showRail ? space.md : tabBarScreenPadding(insets.bottom) + space.md
  const primaryCard = cards.find((c) => c.id === visibleCardId) ?? cards[0]
  const detailCard = cards.find((c) => c.id === detailId) ?? null
  const displayName = resolveAxelName({
    isGuest,
    callsYou,
    displayName: displayNamePref,
    email,
  })

  const recent = useMemo(
    () => [...txs].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6),
    [txs],
  )
  const ranking = useMemo(
    () => rankCategoriesBySpend(txs, colorMapFromMeta(catMap)).slice(0, 4),
    [txs, catMap],
  )
  const budgets = ranking.slice(0, 2)

  useEffect(() =>
  {
    void hydrateCats()
  }, [hydrateCats])

  const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    alimentacao: 'restaurant-outline',
    transporte: 'car-outline',
    habitacao: 'home-outline',
    compras: 'cart-outline',
    lazer: 'game-controller-outline',
    saude: 'medkit-outline',
    educacao: 'school-outline',
    outros: 'ellipse-outline',
  }

  const last4 = (primaryCard?.numeroMascarado || '').replace(/\D/g, '').slice(-4) || '0000'
  const expLabel =
    primaryCard?.validadeMesAno
    || (primaryCard
      ? `${String(primaryCard.diaVencimento).padStart(2, '0')}/${String(new Date().getFullYear() + 3).slice(-2)}`
      : '--/--')
  const deltaPct =
    pos.receitas > 0 ? Math.round((saldoCaixa / pos.receitas) * 1000) / 10 : 0
  const deltaPositive = saldoCaixa >= 0

  const quickIcons: {
    id: string
    label: string
    icon: keyof typeof Ionicons.glyphMap
    onPress: () => void
  }[] = [
    { id: 'send', label: 'Gasto', icon: 'swap-vertical-outline', onPress: () => openCapture('expense', null, { studio: true }) },
    {
      id: 'recv',
      label: 'Receita',
      icon: 'download-outline',
      onPress: () => openCapture('expense', null, { studio: true, lancamento: 'receita' }),
    },
    { id: 'cards', label: 'Cartões', icon: 'wallet-outline', onPress: () => onCardsFocusChange(true) },
    {
      id: 'more',
      label: 'Mais',
      icon: 'grid-outline',
      onPress: () => (onGoAnalise ? onGoAnalise() : onGoMovimentos()),
    },
  ]

  const openEditPrimary = () =>
  {
    if (!primaryCard)
    {
      setCreateOpen(true)
      return
    }
    setVisibleCardId(primaryCard.id)
    setEditOpen(true)
  }

  const sheets = (
    <>
      <FinanceCardDetailSheet
        card={detailCard}
        visible={detailId != null}
        onClose={() => setDetailId(null)}
        onEdit={() =>
        {
          setDetailId(null)
          setEditOpen(true)
        }}
        onSpend={() =>
        {
          setDetailId(null)
          setSheetMode('spend')
        }}
        onLedger={() =>
        {
          setDetailId(null)
          setLedgerOpen(true)
        }}
      />
      <CardInvoiceSpendSheet
        card={primaryCard ?? null}
        mode={sheetMode}
        onClose={() => setSheetMode(null)}
      />
      <FinanceCardEditSheet
        card={primaryCard ?? null}
        mode="edit"
        visible={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <FinanceCardEditSheet
        card={null}
        mode="create"
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) =>
        {
          setVisibleCardId(id)
          setDetailId(id)
        }}
      />
      <FinanceCardLedgerSheet
        card={primaryCard ?? null}
        visible={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        onSpend={() => setSheetMode('spend')}
      />
    </>
  )

  // ── Só aparece ao tocar em “Cartões” ─────────────────────
  if (cardsFocus)
  {
    return (
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PrimaryButton
            label="Voltar"
            variant="ghost"
            size="sm"
            icon="chevron-back"
            onPress={() => onCardsFocusChange(false)}
          />
          <Text variant="section">Cartões</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <PressableScale
              accessibilityLabel="Personalizar cartão"
              onPress={openEditPrimary}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.elevated,
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.ink} />
            </PressableScale>
            <PressableScale
              accessibilityLabel="Novo cartão"
              onPress={() => setCreateOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.elevated,
              }}
            >
              <Ionicons name="add" size={22} color={colors.ink} />
            </PressableScale>
          </View>
        </View>

        {cards.length === 0 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <EmptyState title="Nenhum cartão" body="Crie um cartão e personalize o visual." />
            <PrimaryButton label="Novo cartão" icon="card-outline" onPress={() => setCreateOpen(true)} />
          </Card>
        ) : (
          <>
            <CardCarousel
              cards={cards}
              selectedId={visibleCardId}
              onSelect={(id) =>
              {
                setVisibleCardId(id)
                setDetailId(id)
              }}
              onVisibleChange={setVisibleCardId}
            />
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              Toque no cartão para ver os detalhes
            </Text>
            {onGoCartoes ? (
              <PrimaryButton
                label="Gerenciar em Contas"
                variant="link"
                size="sm"
                onPress={() =>
                {
                  onCardsFocusChange(false)
                  onGoCartoes()
                }}
              />
            ) : null}
          </>
        )}
        {sheets}
        <View style={{ marginBottom: fabClearance }} />
      </View>
    )
  }

  // ── Início: card sólido na cor da faixa + ações abaixo (ref. wallet) ───
  const deltaColor =
    tone.bg === '#E0A800'
      ? (deltaPositive ? '#145A32' : '#8B1E1E')
      : (deltaPositive ? '#7CFFB2' : '#FFB4B4')

  return (
    <View style={{ gap: space.sm + 2 }}>
      <View style={{ gap: 1 }}>
        <Text variant="section" style={{ fontSize: 16 }}>
          Olá, {displayName}
        </Text>
        <Text variant="caption" muted style={{ fontSize: 12 }}>
          {currentMonthLabel()}
        </Text>
      </View>

      {/* Card de saldo — compacto */}
      <Card
        tone="elevated"
        style={{
          backgroundColor: tone.bg,
          borderRadius: 16,
          padding: 14,
          gap: 10,
          minHeight: 132,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ gap: 4 }}>
          <Text
            variant="hero"
            style={{ color: tone.fg, fontSize: 28, letterSpacing: -0.8, lineHeight: 32 }}
          >
            {formatBRL(pos.disponivel)}
          </Text>
          <Text variant="caption" style={{ color: deltaColor, fontWeight: '700', fontSize: 12 }}>
            {deltaPositive ? '+' : ''}
            {deltaPct}% no mês · {tone.label}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ gap: 1 }}>
              <Text variant="micro" style={{ color: tone.muted, fontSize: 10 }}>
                Número
              </Text>
              <Text variant="bodyStrong" style={{ color: tone.fg, fontSize: 13, letterSpacing: 0.4 }}>
                **** {last4}
              </Text>
            </View>
            <View style={{ gap: 1 }}>
              <Text variant="micro" style={{ color: tone.muted, fontSize: 10 }}>
                Exp
              </Text>
              <Text variant="bodyStrong" style={{ color: tone.fg, fontSize: 13 }}>
                {expLabel}
              </Text>
            </View>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Registrar gasto"
            onPress={() => openCapture('expense')}
            style={{
              backgroundColor: tone.fg,
              borderRadius: 999,
              minHeight: 34,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="label" style={{ color: tone.bg, fontWeight: '700', fontSize: 12 }}>
              + Gasto
            </Text>
          </PressableScale>
        </View>
      </Card>

      {/* Ações leves */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {quickIcons.map((a) => (
          <PressableScale
            key={a.id}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.elevated,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={a.icon} size={16} color={colors.ink} />
            </View>
            <Text variant="micro" muted style={{ fontWeight: '600', fontSize: 10 }}>
              {a.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Card tone="elevated" style={{ flex: 1, padding: 10, gap: 2, borderRadius: 16 }}>
          <Text variant="micro" muted>
            Receita
          </Text>
          <Text variant="bodyStrong" color={colors.health} style={{ fontSize: 13 }}>
            {formatBRL(pos.receitas)}
          </Text>
        </Card>
        <Card tone="elevated" style={{ flex: 1, padding: 10, gap: 2, borderRadius: 16 }}>
          <Text variant="micro" muted>
            Saiu da conta
          </Text>
          <Text variant="bodyStrong" color={colors.finance} style={{ fontSize: 13 }}>
            {formatBRL(pos.despesas)}
          </Text>
        </Card>
        <Card tone="elevated" style={{ flex: 1, padding: 10, gap: 2, borderRadius: 16 }}>
          <Text variant="micro" muted>
            No cartão
          </Text>
          <Text variant="bodyStrong" style={{ fontSize: 13 }}>
            {formatBRL(cards.reduce((a, c) => a + cardFaturaAbertaDisplay(c, txs), 0))}
          </Text>
        </Card>
      </View>

      {/* Categorias — tiles leves (ref. imagem) */}
      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Categorias"
          action={
            <PrimaryButton
              label="Ver mais"
              variant="link"
              size="sm"
              onPress={() => (onGoAnalise ? onGoAnalise() : onGoMovimentos())}
            />
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(ranking.length
            ? ranking
            : [
                { categoria: 'alimentacao', label: 'Alimentação', total: 0, pct: 0, color: colors.axel },
                { categoria: 'transporte', label: 'Transporte', total: 0, pct: 0, color: colors.tasks },
                { categoria: 'saude', label: 'Saúde', total: 0, pct: 0, color: colors.health },
                { categoria: 'outros', label: 'Outros', total: 0, pct: 0, color: colors.finance },
              ]
          ).map((row) => (
            <PressableScale
              key={row.categoria}
              onPress={() => (onGoAnalise ? onGoAnalise() : onGoMovimentos())}
              style={{
                width: '48%' as `${number}%`,
                flexGrow: 1,
                flexBasis: '46%',
                minHeight: 68,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.hairline,
                padding: 10,
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: `${row.color}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={CAT_ICONS[row.categoria] ?? 'ellipse-outline'}
                  size={13}
                  color={row.color}
                />
              </View>
              <Text variant="caption" muted style={{ fontSize: 10 }} numberOfLines={1}>
                {row.label}
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 12 }}>
                {formatBRL(row.total)}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      {/* Orçamentos slim */}
      {budgets.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Orçamentos"
            action={
              <PrimaryButton
                label="Ver tudo"
                variant="link"
                size="sm"
                onPress={() => (onGoAnalise ? onGoAnalise() : onGoMovimentos())}
              />
            }
          />
          <View style={{ gap: 8 }}>
            {budgets.map((b) =>
            {
              const meta = Math.max(b.total * 1.25, 1)
              const pct = Math.min(100, Math.round((b.total / meta) * 100))
              return (
                <Card
                  key={b.categoria}
                  tone="elevated"
                  style={{
                    padding: 10,
                    borderRadius: 16,
                    gap: 6,
                    backgroundColor: `${b.color}14`,
                    borderWidth: 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={CAT_ICONS[b.categoria] ?? 'ellipse-outline'}
                        size={14}
                        color={b.color}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 12 }}>
                        {b.label}
                      </Text>
                      <Text variant="micro" muted style={{ fontSize: 10 }}>
                        {formatBRL(b.total)} / {formatBRL(meta)}
                      </Text>
                    </View>
                    <Text variant="caption" muted style={{ fontWeight: '700', fontSize: 11 }}>
                      {pct}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 3,
                      borderRadius: 999,
                      backgroundColor: colors.hairline,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: b.color,
                        borderRadius: 999,
                      }}
                    />
                  </View>
                </Card>
              )
            })}
          </View>
        </View>
      ) : null}

      {/* Transações compactas */}
      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Transações"
          action={
            <PrimaryButton label="Ver tudo" variant="link" size="sm" onPress={onGoMovimentos} />
          }
        />
        <Card tone="elevated" style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
          {recent.length === 0 ? (
            <EmptyState title="Nada por aqui" body="Seu próximo gasto aparece nesta lista." />
          ) : (
            recent.map((t, i) => (
              <ListRow
                key={t.id}
                title={t.titulo}
                subtitle={financeTxSubtitle(t)}
                right={`${t.tipo === 'despesa' ? '−' : '+'}${formatBRL(t.valor)}`}
                showSeparator={i < recent.length - 1}
              />
            ))
          )}
        </Card>
      </View>

      {sheets}
      <View style={{ marginBottom: fabClearance }} />
    </View>
  )
}
