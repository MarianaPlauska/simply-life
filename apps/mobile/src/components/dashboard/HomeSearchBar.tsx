import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass'
import { searchHomeItems, type FinanceTx, type MobileTask } from '@simply-life/shared'
import { Text } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useInPanel } from '../../ui/Panel'
import { useTheme } from '../../theme/ThemeProvider'
import { useWebBox } from './web/webBox'

type Props = {
  tasks: MobileTask[]
  finance: FinanceTx[]
  /** Avisa o pai para esconder o resto enquanto a pessoa está buscando. */
  onSearching?: (searching: boolean) => void
  autoFocus?: boolean
}

/** Busca da Home. Fica logo abaixo da saudação, antes dos atalhos. */
export function HomeSearchBar({ tasks, finance, onSearching, autoFocus }: Props)
{
  const { colors } = useTheme()
  const inPanel = useInPanel()
  const webBox = useWebBox()
  const box = inPanel ? { borderRadius: 0, padding: 0, backgroundColor: 'transparent' } : webBox
  const router = useRouter()
  const [query, setQuery] = useState('')
  const hits = useMemo(
    () => searchHomeItems(query, tasks, finance, 16),
    [query, tasks, finance],
  )
  const searching = query.trim().length > 0

  useEffect(() =>
  {
    onSearching?.(searching)
  }, [onSearching, searching])

  const openHit = (hit: ReturnType<typeof searchHomeItems>[number]) =>
  {
    if (hit.kind === 'task')
    {
      router.push(`/task/${hit.id}`)
      return
    }
    router.push('/(tabs)/financeiro')
  }

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 44,
          borderRadius: 12,
          paddingHorizontal: 12,
          gap: 8,
          backgroundColor: colors.fill,
          ...(inPanel
            ? { borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, minHeight: 40 }
            : box ? { ...box, paddingVertical: 0, minHeight: 44 } : null),
        }}
      >
        <MagnifyingGlassIcon size={18} color={colors.inkMuted} />
        <TextInput
          placeholder="Buscar tarefas, gastos…"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          autoFocus={autoFocus}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.ink,
            paddingVertical: 10,
          }}
        />
        {searching ? (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityLabel="Cancelar busca"
            hitSlop={8}
          >
            <Icon name="close" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <View
          style={{
            borderRadius: 20,
            padding: 20,
            gap: 16,
            backgroundColor: colors.featureBg,
            minHeight: 200,
            ...box,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" style={{ color: colors.featureMuted }}>
              {hits.length > 0 ? `${hits.length} resultado(s)` : 'Busca'}
            </Text>
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Fechar busca" hitSlop={8}>
              <Icon name="close-circle" size={22} color={colors.featureMuted} />
            </Pressable>
          </View>

          {hits.length === 0 ? (
            <Text variant="title" style={{ color: colors.featureInk, fontSize: 19 }}>
              {`Nenhum resultado para “${query.trim()}”`}
            </Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
              {hits.map((hit) => (
                <Pressable
                  key={`${hit.kind}-${hit.id}`}
                  onPress={() => openHit(hit)}
                  style={{
                    minHeight: 52,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.hairline,
                    gap: 6,
                  }}
                >
                  <Text variant="bodyStrong" style={{ color: colors.featureInk }} numberOfLines={1}>
                    {hit.title}
                  </Text>
                  <Text variant="caption" style={{ color: colors.featureMuted }} numberOfLines={1}>
                    {hit.subtitle}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  )
}
