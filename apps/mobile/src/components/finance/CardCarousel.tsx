import { useEffect, useRef, useState } from 'react'
import {
  View,
  ScrollView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { FinanceCard } from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CreditCardVisual } from './CreditCardVisual'

type Props = {
  cards: FinanceCard[]
  selectedId: string | null
  onSelect: (id: string) => void
  onVisibleChange?: (id: string) => void
}

/**
 * Um cartão por página + setas (no web o mouse quase não “desliza”).
 */
export function CardCarousel({ cards, selectedId, onSelect, onVisibleChange }: Props)
{
  const { colors, space } = useTheme()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [trackW, setTrackW] = useState(Math.max(240, width - 32))
  const cardW = Math.min(trackW - 24, 360)
  const [page, setPage] = useState(0)

  const goTo = (i: number) =>
  {
    const next = Math.max(0, Math.min(cards.length - 1, i))
    setPage(next)
    scrollRef.current?.scrollTo({ x: next * trackW, animated: true })
    const card = cards[next]
    if (card) onVisibleChange?.(card.id)
  }

  useEffect(() =>
  {
    if (!selectedId) return
    const i = cards.findIndex((c) => c.id === selectedId)
    if (i < 0) return
    setPage((prev) =>
    {
      if (prev === i) return prev
      scrollRef.current?.scrollTo({ x: i * trackW, animated: true })
      return i
    })
  }, [selectedId, cards, trackW])

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
  {
    const x = e.nativeEvent.contentOffset.x
    const i = Math.max(0, Math.min(cards.length - 1, Math.round(x / Math.max(trackW, 1))))
    setPage(i)
    const card = cards[i]
    if (card) onVisibleChange?.(card.id)
  }

  if (cards.length === 0) return null

  return (
    <View
      onLayout={(ev) =>
      {
        const w = ev.nativeEvent.layout.width
        if (w > 0 && Math.abs(w - trackW) > 1) setTrackW(w)
      }}
      style={{ width: '100%', overflow: 'hidden' }}
    >
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
          contentContainerStyle={{ alignItems: 'stretch' }}
        >
          {cards.map((card) => (
            <View
              key={card.id}
              style={{
                width: trackW,
                alignItems: 'center',
                paddingVertical: 4,
              }}
            >
              <CreditCardVisual
                card={card}
                width={cardW}
                selected={card.id === selectedId || (selectedId == null && card.id === cards[page]?.id)}
                onPress={() => onSelect(card.id)}
              />
            </View>
          ))}
        </ScrollView>

        {cards.length > 1 ? (
          <>
            <PressableScale
              accessibilityLabel="Cartão anterior"
              onPress={() => goTo(page - 1)}
              disabled={page <= 0}
              style={{
                position: 'absolute',
                left: 0,
                top: '42%',
                width: 44,
                height: 44,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.hairline,
                zIndex: 2,
              }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </PressableScale>
            <PressableScale
              accessibilityLabel="Próximo cartão"
              onPress={() => goTo(page + 1)}
              disabled={page >= cards.length - 1}
              style={{
                position: 'absolute',
                right: 0,
                top: '42%',
                width: 44,
                height: 44,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.hairline,
                zIndex: 2,
              }}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.ink} />
            </PressableScale>
          </>
        ) : null}
      </View>

      {cards.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: space.sm,
          }}
        >
          {cards.map((card, i) => (
            <PressableScale
              key={`dot-${card.id}`}
              accessibilityLabel={`Ir ao cartão ${i + 1}`}
              onPress={() => goTo(i)}
              style={{
                width: i === page ? 16 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: i === page ? colors.ink : colors.hairlineStrong,
              }}
            />
          ))}
        </View>
      ) : null}

      {cards.length > 1 ? (
        <Text variant="caption" muted style={{ textAlign: 'center', marginTop: 4 }}>
          Setas, bolinhas ou deslize · {page + 1} de {cards.length}
        </Text>
      ) : null}
    </View>
  )
}
