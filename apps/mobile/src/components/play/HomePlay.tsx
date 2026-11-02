import { useEffect, useState } from 'react'
import { Modal, Pressable, Share, View } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { weekStoryShareText, localTodayIso, type ChestPrize } from '@simply-life/shared'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton, Text, Icon, PressableScale, GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { hapticRestDone } from '../../lib/haptics'
import { useHomePlay } from '../../hooks/useHomePlay'
import { usePlayStore } from '../../store/playStore'
import { AxelFaceSun } from './AxelFaceSun'

/** Ícone no topo da Home: abre a gaveta com carta, coleção, missões, baú e semana. */
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const insets = useSafeAreaInsets()

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
  const missionsLeft = play.missions.filter((m) => !m.done).length
  const pending = !play.revealed || play.chestReady || play.showWeek

  return (
    <View>
      <PressableScale
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={pending ? 'Hoje no SunFy, tem novidade' : 'Hoje no SunFy'}
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.elevated,
        }}
      >
        <Icon name="gift-outline" size={20} color={colors.ink} />
        {pending ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 9,
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: colors.axelFill,
              borderWidth: 1.5,
              borderColor: colors.elevated,
            }}
          />
        ) : null}
      </PressableScale>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable
          accessibilityLabel="Fechar"
          onPress={() => setSheetOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay }}
        />
        <View
          style={{
            backgroundColor: colors.canvas,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: space.lg,
            paddingBottom: space.lg + insets.bottom,
            gap: space.md,
          }}
        >
          <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairlineStrong }} />
          <Text variant="section">Hoje no SunFy</Text>

          <GroupedList>
            <GroupedRow
              leading={<RowGlyph name="sparkles" color={colors.axel} />}
              title="Carta de hoje"
              subtitle={play.revealed ? 'Ler de novo' : 'Uma descoberta sobre você'}
              onPress={() =>
              {
                setSheetOpen(false)
                setFaceUp(play.revealed)
                setCardOpen(true)
              }}
            />
            <GroupedRow
              leading={<RowGlyph name="albums" color={colors.tasks} />}
              title="Coleção de cartas"
              onPress={() =>
              {
                setSheetOpen(false)
                router.push('/cartas' as never)
              }}
            />
            {play.showWeek ? (
              <GroupedRow
                leading={<RowGlyph name="calendar" color={colors.health} />}
                title="Sua semana"
                subtitle="O resumo dos últimos 7 dias"
                onPress={() =>
                {
                  setSheetOpen(false)
                  setStep(0)
                  setStories(true)
                }}
              />
            ) : null}
          </GroupedList>

          {play.missions.length ? (
            <View style={{ gap: space.sm }}>
              <Text variant="label" muted>
                {missionsLeft ? `Missões de hoje: faltam ${missionsLeft}` : 'Missões de hoje: todas feitas'}
              </Text>
              <GroupedList>
                {play.missions.map((m) => (
                  <GroupedRow
                    key={m.id}
                    leading={<Icon name={m.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={m.done ? colors.health : colors.inkFaint} />}
                    title={m.title}
                    muted={m.done}
                  />
                ))}
              </GroupedList>
              {play.chestReady ? (
                <PrimaryButton label="Abrir o baú" onPress={() => setPrize(play.openChest())} />
              ) : null}
              {prize ? (
                <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
                  {prize.kind === 'gold' ? `+${prize.amount} moedas, para você` : `Ficou com você: ${prize.label}`}
                </Text>
              ) : play.chestOpened ? (
                <Text variant="caption" muted style={{ textAlign: 'center' }}>O baú de hoje já abriu. O de amanhã espera.</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>

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
