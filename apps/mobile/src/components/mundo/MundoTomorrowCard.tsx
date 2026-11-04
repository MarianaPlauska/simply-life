import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { addDaysToIso, expandBlocos, minutesToLabel, resumoDia, todayIso } from '@simply-life/shared'
import { Card, Icon, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useMeuMundoStore } from '../../store/meuMundoStore'
import { useMundoEvents } from './useMundoEvents'

/** Ritual da noite: "Amanhã: 6 coisas, 2 conflitos, livre das 15h às 17h", com botão para ajeitar. */
export function MundoTomorrowCard()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const blocos = useMeuMundoStore((s) => s.blocos)
  const marcas = useMeuMundoStore((s) => s.marcas)
  const fitDia = useMeuMundoStore((s) => s.fitDia)
  const events = useMundoEvents()
  const [msg, setMsg] = useState('')
  const amanha = addDaysToIso(todayIso(), 1)
  const occ = useMemo(() => expandBlocos(blocos, marcas, amanha, amanha), [blocos, marcas, amanha])
  const r = useMemo(() => resumoDia(amanha, occ, events), [amanha, occ, events])
  if (!r.total) return null

  const primeiro = occ.find((o) => o.inicio != null)
  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="globe-outline" size={20} color={colors.axel} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>Seu mundo amanhã</Text>
      </View>
      <Text variant="body">
        {r.total} {r.total === 1 ? 'coisa marcada' : 'coisas marcadas'}
        {r.conflitos ? `, ${r.conflitos} ${r.conflitos === 1 ? 'conflito' : 'conflitos'}` : ''}
        {r.livre ? `, livre das ${minutesToLabel(r.livre.inicio)} às ${minutesToLabel(r.livre.fim)}` : ''}.
      </Text>
      {primeiro ? (
        <Text variant="caption" muted>Começa com {primeiro.bloco.titulo} às {minutesToLabel(primeiro.inicio!)}.</Text>
      ) : null}
      {msg ? <Text variant="caption" muted>{msg}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {r.conflitos || occ.some((o) => o.bloco.tipo === 'flexivel') ? (
          <PrimaryButton
            size="sm"
            label="Ajeitar"
            onPress={async () =>
            {
              const n = await fitDia(amanha, events)
              setMsg(n
                ? `Encaixei ${n} ${n === 1 ? 'flexível' : 'flexíveis'} nos horários livres.`
                : r.conflitos ? 'Os conflitos são entre horários fixos. Abra o Meu Mundo para escolher.' : 'Já está tudo encaixado.')
            }}
          />
        ) : null}
        <PrimaryButton size="sm" variant="secondary" label="Ver no Meu Mundo" onPress={() => router.push(`/kanban?hub=mundo&dia=${amanha}`)} />
      </View>
    </Card>
  )
}
