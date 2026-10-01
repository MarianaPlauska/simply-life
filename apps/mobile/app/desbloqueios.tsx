import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  UNLOCKS,
  UNLOCK_KIND_LABEL,
  isUnlocked,
  unlocksAtLevel,
  type UnlockItem,
  type UnlockKind,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, PillTabs, Icon, type IconName } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { BackdropSwatch } from '../src/components/kanban/KanbanBackdrop'
import { ProfileAvatarBadge } from '../src/components/social/ProfileAvatarBadge'
import { CoinBalance, CoinIcon } from '../src/components/rewards/Coin'
import { useTheme } from '../src/theme/ThemeProvider'
import { usePrefsStore } from '../src/store/prefsStore'
import { gamificationLevel, useGamificationStore } from '../src/store/gamificationStore'
import { useConfirmStore } from '../src/store/confirmStore'

const TABS: { id: UnlockKind; label: string }[] = [
  { id: 'avatar', label: 'Avatar' },
  { id: 'fundo', label: 'Fundo do quadro' },
  { id: 'colecao', label: 'Coleções' },
  { id: 'moldura', label: 'Anel' },
]

/** Prévia do item: avatar, fundo, coleção ou anel. */
function Preview({ item }: { item: UnlockItem })
{
  const { colors } = useTheme()
  if (item.kind === 'fundo') return <BackdropSwatch value={item.value} />
  if (item.kind === 'avatar') return <ProfileAvatarBadge size={56} icon={item.value} />
  if (item.kind === 'moldura') return <ProfileAvatarBadge size={56} frame={item.value} />
  return (
    <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="albums-outline" size={28} color={colors.brand} />
    </View>
  )
}

/** O que o XP libera: tudo visível antes, com o nível de cada item. */
export default function DesbloqueiosScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const gold = useGamificationStore((s) => s.gold)
  const owned = useGamificationStore((s) => s.owned)
  const buyItem = useGamificationStore((s) => s.buyItem)
  const hydrate = useGamificationStore((s) => s.hydrate)
  const [tab, setTab] = useState<UnlockKind>('avatar')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const lvl = gamificationLevel(totalXp)
  const nextItems = useMemo(() => unlocksAtLevel(lvl.level + 1), [lvl.level])
  const items = UNLOCKS.filter((u) => u.kind === tab).sort((a, b) => a.level - b.level)

  const equipped = (item: UnlockItem): boolean =>
  {
    if (item.kind === 'avatar') return (prefs.profile_avatar_icon ?? 'initials') === item.value
    if (item.kind === 'fundo') return (prefs.kanban_fundo ?? 'nenhum') === item.value
    if (item.kind === 'moldura') return (prefs.profile_avatar_frame ?? 'lisa') === item.value
    return prefs.chama_colecao?.tema === item.value
  }

  const equip = (item: UnlockItem) =>
  {
    if (item.kind === 'avatar') void patch({ profile_avatar_icon: item.value })
    if (item.kind === 'fundo') void patch({ kanban_fundo: item.value })
    if (item.kind === 'moldura') void patch({ profile_avatar_frame: item.value })
    if (item.kind === 'colecao') router.push('/colecao' as never)
  }

  const buy = (item: UnlockItem) =>
  {
    if (item.coins == null) return
    useConfirmStore.getState().ask({
      title: 'Comprar antes do nível',
      message: `${item.label} custa ${item.coins} moedas. Você tem ${gold}. No nível ${item.level} ele sai de graça.`,
      confirmLabel: 'Comprar',
      tone: 'neutral',
      icon: 'cash-outline',
      onConfirm: () =>
      {
        const r = buyItem(item.id, item.coins!)
        setMsg(r.ok ? `${item.label} liberado.` : r.message)
      },
    })
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Desbloqueios" subtitle="O que o seu XP libera, nível por nível" />

      <View style={{ gap: space.md }}>
        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="trophy-outline" size={22} color={colors.axel} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              Nível {lvl.level}
            </Text>
            <CoinBalance value={gold} />
          </View>
          <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
            <View style={{ width: `${lvl.pct}%`, height: '100%', borderRadius: 999, backgroundColor: colors.axelFill }} />
          </View>
          <Text variant="caption" muted>
            {lvl.xpInLevel} de {lvl.xpToNext} XP para o nível {lvl.level + 1}
            {nextItems.length ? `, que libera: ${nextItems.map((i) => i.label).join(', ')}.` : '.'}
          </Text>
          <Text variant="caption" muted>
            XP vem de concluir tarefas, focar e registrar o dia. A cada 4 XP entra 1 moeda, e as moedas compram itens antes do nível.
          </Text>
        </Card>

        <PillTabs tabs={TABS} value={tab} onChange={setTab} />

        {msg ? (
          <Text variant="caption" style={{ color: colors.brand }}>
            {msg}
          </Text>
        ) : null}

        {tab === 'avatar' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {items.map((item) =>
            {
              const open = isUnlocked(item, lvl.level, owned)
              const on = equipped(item)
              return (
                <Pressable
                  key={item.id}
                  onPress={() => (open ? equip(item) : buy(item))}
                  disabled={!open && (item.coins == null || gold < item.coins)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}, ${open ? (on ? 'em uso' : 'usar') : `nível ${item.level}${item.coins != null ? ` ou ${item.coins} moedas` : ''}`}`}
                  style={{
                    width: 96,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: on ? colors.axelMuted : colors.surface,
                    borderWidth: 1,
                    borderColor: on ? colors.axel : colors.hairline,
                    opacity: open ? 1 : 0.6,
                  }}
                >
                  <ProfileAvatarBadge size={52} icon={item.value} />
                  <Text variant="micro" numberOfLines={1} style={{ textAlign: 'center', paddingHorizontal: 4 }}>
                    {item.label}
                  </Text>
                  {open ? (
                    <Text variant="micro" muted>
                      {on ? 'Em uso' : 'Usar'}
                    </Text>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text variant="micro" muted>
                        Nv {item.level}
                      </Text>
                      {item.coins != null ? (
                        <>
                          <CoinIcon size={11} />
                          <Text variant="micro" muted>
                            {item.coins}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        ) : null}

        {tab !== 'avatar' && items.map((item) =>
        {
          const open = isUnlocked(item, lvl.level, owned)
          const on = equipped(item)
          return (
            <Card key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: open ? 1 : 0.85 }}>
              <Preview item={item} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{item.label}</Text>
                <Text variant="caption" muted>
                  {UNLOCK_KIND_LABEL[item.kind]}
                  {open ? '' : ` · libera no nível ${item.level}`}
                  {!open && item.coins != null ? ` ou ${item.coins} moedas` : ''}
                </Text>
              </View>
              {open ? (
                on ? (
                  <Text variant="caption" style={{ color: colors.axel, fontWeight: '600' }}>
                    Em uso
                  </Text>
                ) : (
                  <PrimaryButton
                    label={item.kind === 'colecao' ? 'Escolher' : 'Usar'}
                    variant="secondary"
                    size="sm"
                    onPress={() => equip(item)}
                  />
                )
              ) : item.coins != null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Comprar por ${item.coins} moedas`}
                  disabled={gold < item.coins}
                  onPress={() => buy(item)}
                  style={{
                    minHeight: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.hairlineStrong,
                    opacity: gold < item.coins ? 0.5 : 1,
                  }}
                >
                  <CoinIcon size={16} />
                  <Text variant="bodyStrong">{item.coins}</Text>
                </Pressable>
              ) : (
                <Icon name={'lock-closed-outline' as IconName} size={18} color={colors.inkMuted} />
              )}
            </Card>
          )
        })}
      </View>
    </Screen>
  )
}
