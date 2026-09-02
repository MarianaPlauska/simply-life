import { useState } from 'react'
import { View, ScrollView, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import type { FinanceCard } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CreditCardVisual } from './CreditCardVisual'

type Props = {
  cards: FinanceCard[]
  selectedId: string | null
  onSelect: (id: string) => void
  onVisibleChange?: (id: string) => void
}

/**
 * Um cartão por página — paging pela largura do trilho, não pela soma dos filhos.
 * No RN Web um ScrollView horizontal sem largura explícita cresce e empilha os cartões.
 */
export function CardCarousel({ cards, selectedId, onSelect, onVisibleChange }: Props)
{
  const { colors, space } = useTheme()
  const { width } = useWindowDimensions()
  const [trackW, setTrackW] = useState(Math.max(240, width - 32))
  const cardW = Math.min(trackW - 8, 360)
  const [page, setPage] = useState(0)

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
      <ScrollView
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
            <View
              key={`dot-${card.id}`}
              style={{
                width: i === page ? 16 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === page ? colors.ink : colors.hairlineStrong,
              }}
            />
          ))}
        </View>
      ) : null}

      {cards.length > 1 ? (
        <Text variant="caption" muted style={{ textAlign: 'center', marginTop: 4 }}>
          Deslize para o lado · {page + 1} de {cards.length}
        </Text>
      ) : null}
    </View>
  )
}
