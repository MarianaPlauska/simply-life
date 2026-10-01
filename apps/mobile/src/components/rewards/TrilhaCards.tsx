import { useEffect, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  CHAMA_WEEK_GOAL_DAYS,
  buildPersonalDivision,
  chamaWeeks,
  collectionProgress,
  divisionName,
  lastWeekLine,
  localIsoDaysAgo,
  midWeekLine,
} from '@simply-life/shared'
import { Card, Icon, Text, type IconName } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore } from '../../store/gamificationStore'
import { usePrefsStore } from '../../store/prefsStore'
import { actionIsos, useActivityStore } from '../../store/activityStore'
import { gamificationLevel } from '../../store/gamificationStore'
import { CoinBalance } from './Coin'

function shortWeek(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

/**
 * Divisão contra você mesmo: degrau atual, alvo desta semana (da sua média)
 * e uma frase calma. Semana que não sobe nunca aparece em vermelho.
 */
export function PersonalDivisionCard()
{
  const { colors, space } = useTheme()
  const weekXp = useGamificationStore((s) => s.weekXp)
  const hydrate = useGamificationStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const d = useMemo(() => buildPersonalDivision(weekXp), [weekXp])
  const last = lastWeekLine(d.lastWeek)
  const recent = d.history.slice(0, 6).reverse()

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="leaf-outline" size={22} color={colors.brand} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">Sua divisão: {d.name}</Text>
          <Text variant="caption" muted>
            Só você contra você. Bateu o alvo da semana, sobe um degrau. Não bateu, fica onde está.
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" muted>
            Esta semana
          </Text>
          <Text variant="caption" muted>
            {d.current.xp} de {d.current.target} XP
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.round(d.current.pct * 100)}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: colors.brand,
            }}
          />
        </View>
        <Text variant="caption" muted>
          {midWeekLine(d.current.xp, d.current.target)}
          {d.current.hit ? '' : ` Bater leva você para ${divisionName(d.step + 1)}.`}
        </Text>
      </View>

      {last ? (
        <View
          style={{
            padding: space.md,
            borderRadius: 14,
            backgroundColor: d.lastWeek?.hit ? colors.axelMuted : colors.brandMuted,
          }}
        >
          <Text variant="body">{last}</Text>
        </View>
      ) : null}

      {recent.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text variant="caption" muted>
            Últimas semanas
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {recent.map((w) => (
              <View
                key={w.start}
                accessibilityLabel={`Semana de ${shortWeek(w.start)}: ${w.hit ? 'subiu' : 'ficou'}`}
                style={{ alignItems: 'center', gap: 4, minWidth: 44 }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: w.hit ? colors.brand : 'transparent',
                    borderWidth: 2,
                    borderColor: colors.brand,
                  }}
                />
                <Text variant="micro" muted>
                  {shortWeek(w.start)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  )
}

/** Álbum no perfil: a coleção atual, as semanas fechadas e os prêmios resgatados. */
export function ChamaAlbumCard()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const prefs = usePrefsStore((s) => s.prefs)
  const days = useActivityStore((s) => s.days)
  const hydrate = useActivityStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const active = useMemo(() => actionIsos(days), [days])
  const colecao = prefs.chama_colecao ?? null
  const progress = colecao ? collectionProgress(colecao, active) : null
  const weeks = useMemo(() => chamaWeeks(active, localIsoDaysAgo(7 * 7)).reverse(), [active])
  const redeemed = (prefs.chama_premios ?? []).filter((p) => p.resgatadoEm)

  return (
    <Card style={{ gap: space.md }}>
      <Pressable
        onPress={() => router.push('/colecao' as never)}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Icon name="albums-outline" size={22} color={colors.axel} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">Seu álbum</Text>
          <Text variant="caption" muted>
            {progress
              ? `${progress.theme.label}: ${progress.earned} de ${progress.total} figurinhas`
              : 'Escolha um tema e cada semana fechada cola uma figurinha'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={colors.inkMuted} />
      </Pressable>

      {progress ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {progress.theme.pieces.map((piece, i) => (
            <View
              key={piece.name}
              accessibilityLabel={i < progress.earned ? piece.name : 'Figurinha ainda não colada'}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.control,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: i < progress.earned ? colors.axelMuted : colors.surface,
                borderWidth: 1,
                borderColor: i === progress.earned ? colors.axel : colors.hairline,
                borderStyle: i === progress.earned ? 'dashed' : 'solid',
              }}
            >
              <Icon
                name={piece.icon as IconName}
                size={18}
                color={i < progress.earned ? colors.axel : colors.inkFaint}
              />
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Histórico das semanas ({CHAMA_WEEK_GOAL_DAYS} dias fecham a semana)
        </Text>
        {weeks.slice(0, 8).map((w) => (
          <View key={w.start} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon
              name={w.closed ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={w.closed ? colors.axel : colors.inkMuted}
            />
            <Text variant="body" style={{ flex: 1 }}>
              Semana de {shortWeek(w.start)}
            </Text>
            <Text variant="caption" muted>
              {w.days} dia{w.days === 1 ? '' : 's'}
              {w.closed ? ' · fechada' : ''}
            </Text>
          </View>
        ))}
      </View>

      {redeemed.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text variant="caption" muted>
            Prêmios que você já ganhou
          </Text>
          {redeemed.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="gift" size={16} color={colors.axel} />
              <Text variant="body" style={{ flex: 1 }}>
                {p.titulo}
              </Text>
              <Text variant="caption" muted>
                {new Date(p.resgatadoEm!).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push('/desbloqueios' as never)}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
      >
        <Icon name="trophy-outline" size={18} color={colors.brand} />
        <Text variant="body" style={{ flex: 1 }}>
          Desbloqueios: avatar, fundo do quadro e coleções
        </Text>
        <Icon name="chevron-forward" size={16} color={colors.inkMuted} />
      </Pressable>
    </Card>
  )
}

/** Carteira no perfil: nível, moedas e o caminho para gastar. */
export function WalletRow()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const totalXp = useGamificationStore((s) => s.totalXp)
  const gold = useGamificationStore((s) => s.gold)
  const lvl = gamificationLevel(totalXp)
  return (
    <Pressable
      onPress={() => router.push('/desbloqueios' as never)}
      accessibilityRole="button"
      accessibilityLabel={`Nível ${lvl.level}, ${gold} moedas. Ver desbloqueios`}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="bodyStrong">Nível {lvl.level}</Text>
          <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
            <View style={{ width: `${lvl.pct}%`, height: '100%', borderRadius: 999, backgroundColor: colors.axelFill }} />
          </View>
          <Text variant="caption" muted>
            {lvl.xpInLevel} de {lvl.xpToNext} XP · toque para ver o que liberar
          </Text>
        </View>
        <CoinBalance value={gold} />
      </Card>
    </Pressable>
  )
}
