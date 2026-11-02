import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { tasksForPlace, withTaskPlace } from '@simply-life/shared'
import { Screen, Text, Field, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useCareExtrasStore } from '../src/store/careExtrasStore'
import { useDataStore } from '../src/store/dataStore'
import { useAuthStore } from '../src/store/authStore'

/** Lugares nomeados pela pessoa. Chegar é um toque, sem rastrear o dia inteiro. */
export default function LugaresScreen()
{
  const { colors, space } = useTheme()
  const hydrate = useCareExtrasStore((s) => s.hydrate)
  const places = useCareExtrasStore((s) => s.places)
  const hereSlug = useCareExtrasStore((s) => s.hereSlug)
  const addPlace = useCareExtrasStore((s) => s.addPlace)
  const removePlace = useCareExtrasStore((s) => s.removePlace)
  const setHere = useCareExtrasStore((s) => s.setHere)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const patchTask = useDataStore((s) => s.patchTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [nome, setNome] = useState('')

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const here = places.find((place) => place.slug === hereSlug) ?? null
  const openHere = here ? tasksForPlace(tasks, here.slug) : []
  const unmarked = tasks.filter((task) => task.status !== 'done' && !tasksForPlace([task], here?.slug ?? '---').length).slice(0, 8)

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader
        title="Lugares"
        subtitle="Quando você chega, o app mostra o que ficou para aquele lugar. O celular não fica rastreando."
      />
      <View style={{ gap: space.lg }}>
        <Field label="Novo lugar" value={nome} onChangeText={setNome} placeholder="Mercado, casa, farmácia" />
        <PrimaryButton
          label="Guardar lugar"
          onPress={() =>
          {
            if (!nome.trim()) return
            addPlace(nome)
            setNome('')
          }}
        />
        {places.map((place) =>
        {
          const marked = place.slug === hereSlug
          const count = tasksForPlace(tasks, place.slug).length
          return (
            <View key={place.id} style={{ gap: space.sm, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: space.sm }}>
              <Text variant="bodyStrong">{place.nome}</Text>
              <Text variant="caption" muted>{count} em aberto neste lugar</Text>
              <PrimaryButton
                label={marked ? 'Estou aqui' : 'Cheguei'}
                variant={marked ? 'secondary' : 'primary'}
                onPress={() => setHere(marked ? null : place.slug)}
              />
              <PrimaryButton label="Apagar lugar" variant="ghost" onPress={() => removePlace(place.id)} />
            </View>
          )
        })}
        {here ? (
          <View style={{ gap: space.sm }}>
            <Text variant="section">Neste lugar</Text>
            {openHere.length === 0 ? <Text variant="body" muted>Nada marcado ainda.</Text> : null}
            {openHere.map((task) => (
              <Text key={task.id} variant="body">{task.titulo}</Text>
            ))}
            <Text variant="caption" muted>Marcar uma tarefa aberta neste lugar</Text>
            {unmarked.filter((task) => task.status !== 'done').map((task) => (
              <PrimaryButton
                key={task.id}
                label={task.titulo}
                variant="ghost"
                onPress={() => void patchTask(task.id, { anotacao: withTaskPlace(task.anotacao, here.slug) }, isGuest)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  )
}
