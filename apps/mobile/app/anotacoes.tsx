import { useEffect, useState } from 'react'
import { View, TextInput } from 'react-native'
import { Redirect } from 'expo-router'
import { Screen, Text, Card, PrimaryButton, EmptyState, ListRow } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useNotesStore } from '../src/store/notesStore'

export default function AnotacoesScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const { colors, space, radius } = useTheme()
  const items = useNotesStore((s) => s.items)
  const loading = useNotesStore((s) => s.loading)
  const refresh = useNotesStore((s) => s.refresh)
  const create = useNotesStore((s) => s.create)
  const update = useNotesStore((s) => s.update)
  const remove = useNotesStore((s) => s.remove)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = items.find((n) => n.id === selectedId) ?? null

  useEffect(() =>
  {
    if (!isGuest) void refresh()
  }, [refresh, isGuest])

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false} refreshing={loading} onRefresh={() => void refresh()}>
      <StackHeader title="Anotações" subtitle="Diário, lembretes e listas" />
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="+ Diário" size="sm" onPress={() => void create('diario').then((n) => n && setSelectedId(n.id))} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="+ Lista" variant="secondary" size="sm" onPress={() => void create('lista').then((n) => n && setSelectedId(n.id))} />
          </View>
        </View>

        {isGuest ? (
          <Card tone="elevated">
            <EmptyState title="Entre na conta" body="Anotações sincronizam com o mesmo banco do PWA." />
          </Card>
        ) : items.length === 0 ? (
          <Card tone="elevated">
            <EmptyState title="Nenhuma nota" body="Crie um diário ou uma lista para começar." />
          </Card>
        ) : (
          <Card tone="elevated" style={{ paddingVertical: space.sm }}>
            {items.map((n, i) => (
              <ListRow
                key={n.id}
                title={n.titulo || 'Sem título'}
                subtitle={(n.conteudo || '').slice(0, 80) || n.categoria}
                right={n.fixado ? 'Pin' : undefined}
                showSeparator={i < items.length - 1}
                onPress={() => setSelectedId(n.id)}
              />
            ))}
          </Card>
        )}

        {selected ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <TextInput
              value={selected.titulo ?? ''}
              onChangeText={(t) => void update(selected.id, { titulo: t })}
              placeholder="Título"
              placeholderTextColor={colors.inkFaint}
              style={{
                minHeight: 44,
                color: colors.ink,
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 18,
              }}
            />
            <TextInput
              value={selected.conteudo}
              onChangeText={(t) => void update(selected.id, { conteudo: t })}
              placeholder="Escreva…"
              placeholderTextColor={colors.inkFaint}
              multiline
              style={{
                minHeight: 160,
                textAlignVertical: 'top',
                color: colors.ink,
                fontFamily: 'Manrope_400Regular',
                fontSize: 16,
                borderRadius: radius.control,
                backgroundColor: colors.surface,
                padding: 12,
              }}
            />
            <PrimaryButton
              label="Excluir"
              variant="ghost"
              onPress={() =>
              {
                void remove(selected.id)
                setSelectedId(null)
              }}
            />
          </Card>
        ) : null}
      </View>
    </Screen>
  )
}
