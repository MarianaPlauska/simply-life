import { useEffect, useState } from 'react'
import { Modal, Pressable, Share, View } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { weekStoryShareText, localTodayIso, type ChestPrize } from '@simply-life/shared'
import { PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { hapticRestDone } from '../../lib/haptics'
import { useHomePlay } from '../../hooks/useHomePlay'
import { usePlayStore } from '../../store/playStore'
import { AxelFaceSun } from './AxelFaceSun'

/** Carta virada, missões do dia, baú e o convite do domingo. */
export function HomePlay()
{
  const play = useHomePlay()
  const closeCard = usePlayStore((s) => s.closeCard)
  const cardClosedOn = usePlayStore((s) => s.cardClosedOn)
  const playReady = usePlayStore((s) => s.ready)
  const revealCard = usePlayStore((s) => s.reveal)
  const { colors, space } = useTheme()
  const router = useRouter()
  const carta = useGlobalSearchParams<{ carta?: string | string[] }>().carta
  const openCard = Array.isArray(carta) ? carta[0] : carta
  const today = localTodayIso()
  const [cardOpen, setCardOpen] = useState(false)
  const [faceUp, setFaceUp] = useState(false)
  const [stories, setStories] = useState(false)
  const [prize, setPrize] = useState<ChestPrize | null>(null)
  const [step, setStep] = useState(0)

  useEffect(() =>
  {
    if (!play.party) return
    hapticRestDone()
  }, [play.party])

  useEffect(() =>
  {
    if (!playReady || play.loading) return
    if (openCard === '1')
    {
      revealCard(play.card)
      setFaceUp(true)
      setCardOpen(true)
      return
    }
    if (cardClosedOn === today) return
    setCardOpen(true)
  }, [playReady, play.loading, openCard, cardClosedOn, today, revealCard, play.card])

  function leaveCard()
  {
    closeCard(today)
    setCardOpen(false)
  }

  function flipCard()
  {
    if (!faceUp)
    {
      play.reveal()
      setFaceUp(true)
      return
    }
  }

  const slide = play.slides[Math.min(step, play.slides.length - 1)]

  return (
    <View style={{ gap: space.md }}>
      <Pressable
        onPress={() =>
        {
          setFaceUp(play.revealed)
          setCardOpen(true)
        }}
        accessibilityRole="button"
        accessibilityLabel="Abrir a carta de hoje"
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text variant="caption" color={colors.axel}>Carta de hoje</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/cartas' as never)} accessibilityRole="button">
        <Text variant="caption" color={colors.axel}>Ver coleção</Text>
      </Pressable>

      {play.missions.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="section">Se couber hoje</Text>
          {play.missions.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
              <Text variant="body">{m.done ? '●' : '○'}</Text>
              <Text variant="body" style={{ flex: 1 }}>{m.title}</Text>
            </View>
          ))}
          {play.chestReady ? (
            <PrimaryButton
              label="Abrir o baú"
              onPress={() => setPrize(play.openChest())}
            />
          ) : null}
          {play.chestOpened ? (
            <Text variant="caption" muted>O baú de hoje já abriu. O de amanhã espera.</Text>
          ) : null}
          {prize ? (
            <Text variant="bodyStrong">
              {prize.kind === 'gold' ? `+${prize.amount} moedas, para você` : `Ficou com você: ${prize.label}`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {play.showWeek ? (
        <View style={{ gap: 8 }}>
          <Text variant="bodyStrong">Se quiser ver a sua semana</Text>
          <View style={{ gap: 8 }}>
            <PrimaryButton label="Ver" onPress={() =>
            {
              setStep(0)
              setStories(true)
            }} />
            <PrimaryButton label="Agora não" variant="ghost" onPress={play.dismissWeek} />
          </View>
        </View>
      ) : null}

      <Modal
        visible={cardOpen && !play.party}
        transparent
        animationType="fade"
        onRequestClose={leaveCard}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Pressable
            accessibilityLabel="Fechar a carta"
            onPress={leaveCard}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(16, 40, 42, 0.82)' }}
          />
          <Pressable
            onPress={flipCard}
            accessibilityRole="button"
            accessibilityLabel={faceUp ? 'Carta do dia' : 'Virar a carta do dia'}
            style={{
              width: '100%',
              maxWidth: 420,
              minHeight: 220,
              borderRadius: 16,
              padding: 24,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.cardRim,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {faceUp ? (
              <Text variant="body" style={{ textAlign: 'center' }}>{play.card.text}</Text>
            ) : (
              <>
                <AxelFaceSun size={56} />
                <Text variant="bodyStrong">Uma carta para você</Text>
                <Text variant="caption" muted style={{ textAlign: 'center' }}>
                  Se quiser, toque para ler. Pode fechar sem ler.
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={leaveCard}
            accessibilityRole="button"
            accessibilityLabel={faceUp ? 'Fechar' : 'Agora não'}
            style={{ minHeight: 44, marginTop: 16, paddingHorizontal: 16, justifyContent: 'center' }}
          >
            <Text variant="body" style={{ color: '#EEF2F0' }}>{faceUp ? 'Fechar' : 'Agora não'}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={Boolean(play.party)} transparent animationType="fade" onRequestClose={play.dismissParty}>
        <View style={{ flex: 1, backgroundColor: 'rgba(16, 40, 42, 0.82)', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <Confetti />
          <AxelFaceSun size={96} />
          <Text variant="hero" style={{ color: '#EEF2F0', textAlign: 'center' }}>{play.party?.text}</Text>
          <PrimaryButton label="Pode fechar" onPress={play.dismissParty} />
        </View>
      </Modal>

      <Modal visible={stories} transparent animationType="fade" onRequestClose={() => setStories(false)}>
        <View style={{ flex: 1, backgroundColor: colors.canvas, padding: 24, justifyContent: 'center', gap: 16 }}>
          {slide ? (
            <>
              <Text variant="caption" muted>{slide.kicker}</Text>
              <Text variant="hero">{slide.title}</Text>
              <Text variant="body">{slide.body}</Text>
            </>
          ) : null}
          <PrimaryButton
            label={step < play.slides.length - 1 ? 'Próxima' : 'Compartilhar'}
            onPress={() =>
            {
              if (step < play.slides.length - 1) setStep((n) => n + 1)
              else void Share.share({ message: weekStoryShareText(play.slides) })
            }}
          />
          <PrimaryButton
            label="Fechar"
            variant="ghost"
            onPress={() =>
            {
              setStories(false)
              play.dismissWeek()
            }}
          />
        </View>
      </Modal>
    </View>
  )
}

const DOTS: { top: `${number}%`; left: `${number}%`; color: string }[] = [
  { top: '18%', left: '12%', color: '#E8734A' },
  { top: '22%', left: '78%', color: '#B9CFCA' },
  { top: '70%', left: '16%', color: '#EEF2F0' },
  { top: '64%', left: '82%', color: '#E8734A' },
  { top: '40%', left: '8%', color: '#B9CFCA' },
  { top: '46%', left: '88%', color: '#EEF2F0' },
]

function Confetti()
{
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
      {DOTS.map((dot) => (
        <View
          key={`${dot.top}-${dot.left}`}
          style={{
            position: 'absolute',
            top: dot.top,
            left: dot.left,
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: dot.color,
          }}
        />
      ))}
    </View>
  )
}
