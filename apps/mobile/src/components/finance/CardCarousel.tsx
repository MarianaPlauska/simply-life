import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  View,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import type { FinanceCard } from '@simply-life/shared'
import { Icon, PressableScale, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CARD_ASPECT, CreditCardVisual } from './CreditCardVisual'

type Props = {
  cards: FinanceCard[]
  selectedId: string | null
  onSelect: (id: string) => void
  onVisibleChange?: (id: string) => void
  /** Página antes dos cartões (ex.: saldo da conta) */
  leading?: ReactNode
  /** Mostra uma página "Adicionar cartão" no fim */
  onAdd?: () => void
  /** largura máxima do cartão (padrão 380) */
  maxCardWidth?: number
}

type Page = { kind: 'leading' } | { kind: 'card'; card: FinanceCard } | { kind: 'add' }

/** Carteira: um cartão por página, com bolinhas e setas (no web o mouse quase não desliza). */
export function CardCarousel({ cards, selectedId, onSelect, onVisibleChange, leading, onAdd, maxCardWidth = 380 }: Props)
{
  const { colors, space } = useTheme()
  const scrollRef = useRef<ScrollView>(null)
  const [trackW, setTrackW] = useState(0)
  const cardW = Math.min(Math.max(0, trackW - 8), maxCardWidth)
  const [page, setPage] = useState(0)

  const pages: Page[] = [
    ...(leading ? [{ kind: 'leading' } as const] : []),
    ...cards.map((card) => ({ kind: 'card', card }) as const),
    ...(onAdd ? [{ kind: 'add' } as const] : []),
  ]

  const announce = (i: number) =>
  {
    const p = pages[i]
    if (p?.kind === 'card') onVisibleChange?.(p.card.id)
  }

  const goTo = (i: number) =>
  {
    const next = Math.max(0, Math.min(pages.length - 1, i))
    setPage(next)
    scrollRef.current?.scrollTo({ x: next * trackW, animated: true })
    announce(next)
  }

  useEffect(() =>
  {
    if (!selectedId || trackW <= 0) return
    const i = pages.findIndex((p) => p.kind === 'card' && p.card.id === selectedId)
    if (i < 0 || i === page) return
    setPage(i)
    scrollRef.current?.scrollTo({ x: i * trackW, animated: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, trackW])

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
  {
    const x = e.nativeEvent.contentOffset.x
    const i = Math.max(0, Math.min(pages.length - 1, Math.round(x / Math.max(trackW, 1))))
    setPage(i)
    announce(i)
  }

  if (pages.length === 0) return null

  const arrow = (dir: -1 | 1) => (
    <PressableScale
      accessibilityLabel={dir < 0 ? 'Cartão anterior' : 'Próximo cartão'}
      onPress={() => goTo(page + dir)}
      disabled={dir < 0 ? page <= 0 : page >= pages.length - 1}
      style={{
        position: 'absolute',
        [dir < 0 ? 'left' : 'right']: -4,
        top: '40%',
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.elevated,
        borderWidth: 1,
        borderColor: colors.hairline,
        opacity: (dir < 0 ? page <= 0 : page >= pages.length - 1) ? 0 : 1,
        zIndex: 2,
      }}
    >
      <Icon name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.ink} />
    </PressableScale>
  )

  return (
    <View
      onLayout={(ev) =>
      {
        const w = Math.round(ev.nativeEvent.layout.width)
        if (w > 0 && Math.abs(w - trackW) > 1) setTrackW(w)
      }}
      style={{ width: '100%' }}
    >
      {trackW > 0 ? (
        <View style={{ position: 'relative' }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            style={{ width: trackW }}
          >
            {pages.map((p, i) => (
              <View key={p.kind === 'card' ? p.card.id : p.kind} style={{ width: trackW, alignItems: 'center', paddingVertical: 4 }}>
                <View style={{ width: cardW }}>
                  {p.kind === 'leading' ? leading : null}
                  {p.kind === 'card' ? (
                    <CreditCardVisual
                      card={p.card}
                      width={cardW}
                      selected={p.card.id === selectedId && i === page}
                      onPress={() => onSelect(p.card.id)}
                    />
                  ) : null}
                  {p.kind === 'add' && onAdd ? (
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel="Adicionar cartão"
                      onPress={onAdd}
                      style={{
                        width: cardW,
                        aspectRatio: CARD_ASPECT,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderStyle: 'dashed',
                        borderColor: colors.hairlineStrong,
                        backgroundColor: colors.brandMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 999,
                          backgroundColor: colors.axelFill,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="add" size={24} color={colors.axelOnFill} />
                      </View>
                      <Text variant="bodyStrong">Adicionar cartão</Text>
                      <Text variant="caption" muted>Cor, nome, limite e vencimento</Text>
                    </PressableScale>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
          {pages.length > 1 ? (
            <>
              {arrow(-1)}
              {arrow(1)}
            </>
          ) : null}
        </View>
      ) : null}

      {pages.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: space.sm }}>
          {pages.map((p, i) => (
            <PressableScale
              key={`dot-${i}`}
              accessibilityLabel={`Ir para o item ${i + 1} de ${pages.length}`}
              onPress={() => goTo(i)}
              hitSlop={8}
              style={{
                width: i === page ? 18 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: i === page ? colors.axelFill : colors.hairlineStrong,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
