import { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import {
  TASK_WAIT_REASONS,
  recentWaitPeople,
  waitReasonPhrase,
  type PlannedHelper,
  type TaskWaitReason,
} from '@simply-life/shared'
import { Chip, Field, Icon, PrimaryButton, PressableScale, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCircleStore } from '../../store/circleStore'
import { useTaskWaitStore } from '../../store/taskWaitStore'

/** Quando a pessoa entra: antes de você começar (relógio já nasce pausado) ou numa etapa do meio. */
export type HelperWhen = 'antes' | 'meio'

export type DraftHelper = PlannedHelper & { quando: HelperWhen }

const WHEN: { id: HelperWhen; label: string; hint: string }[] = [
  { id: 'antes', label: 'Antes de eu começar', hint: 'O relógio só conta para você quando ela concluir.' },
  { id: 'meio', label: 'No meio do caminho', hint: 'Fica planejado. Na hora, um toque pausa o relógio.' },
]

export function helperLine(h: DraftHelper | PlannedHelper): string
{
  const when = 'quando' in h ? (h.quando === 'antes' ? ' · antes de você' : ' · no meio') : ''
  return `${h.pessoa} vai ${waitReasonPhrase(h.motivo)}${when}`
}

/** Pessoas que participam da tarefa: quem, o que vai fazer e quando entra. */
export function TaskPeopleEditor({
  value,
  onChange,
  allowWhen = true,
}: {
  value: DraftHelper[]
  onChange: (next: DraftHelper[]) => void
  /** na ficha de uma tarefa já começada só existe "no meio" */
  allowWhen?: boolean
})
{
  const { colors, space, radius } = useTheme()
  const friends = useCircleStore((s) => s.friends)
  const loadFriends = useCircleStore((s) => s.load)
  const waits = useTaskWaitStore((s) => s.waits)
  const hydrateWaits = useTaskWaitStore((s) => s.hydrate)
  const [open, setOpen] = useState(false)
  const [pessoa, setPessoa] = useState('')
  const [amigoId, setAmigoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState<TaskWaitReason>('fazer')
  const [quando, setQuando] = useState<HelperWhen>(allowWhen ? 'antes' : 'meio')

  useEffect(() =>
  {
    void loadFriends()
    void hydrateWaits()
  }, [loadFriends, hydrateWaits])

  const others = useMemo(() =>
  {
    const names = new Set(friends.map((f) => f.displayName.trim().toLowerCase()))
    return recentWaitPeople(waits).filter((p) => !names.has(p.trim().toLowerCase()))
  }, [waits, friends])

  const add = () =>
  {
    const name = pessoa.trim()
    if (!name) return
    // só uma pessoa "antes": é ela quem destrava o começo
    const base = quando === 'antes' ? value.filter((h) => h.quando !== 'antes') : value
    onChange([...base, { pessoa: name, amigoId, motivo, quando }])
    setPessoa('')
    setAmigoId(null)
    setMotivo('fazer')
    setOpen(false)
  }

  return (
    <View style={{ gap: 12 }}>
      {value.map((h, i) => (
        <View
          key={`${h.pessoa}-${i}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.control,
            backgroundColor: colors.attentionMuted,
          }}
        >
          <Icon name="person-outline" size={16} color={colors.attention} />
          <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>
            {helperLine(h)}
          </Text>
          <PressableScale
            accessibilityLabel={`Tirar ${h.pessoa}`}
            onPress={() => onChange(value.filter((_, j) => j !== i))}
            style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="close" size={18} color={colors.inkMuted} />
          </PressableScale>
        </View>
      ))}

      {open ? (
        <View style={{ gap: space.md }}>
          <Field
            label="Quem"
            value={pessoa}
            onChangeText={(v) =>
            {
              setPessoa(v)
              setAmigoId(null)
            }}
            placeholder="Nome da pessoa"
            autoCapitalize="words"
          />
          {friends.length + others.length > 0 ? (
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {friends.map((f) => (
                  <Chip
                    key={f.userId}
                    label={f.displayName}
                    dotColor={f.accent}
                    active={amigoId === f.userId}
                    onPress={() =>
                    {
                      setPessoa(f.displayName)
                      setAmigoId(f.userId)
                    }}
                  />
                ))}
                {others.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={!amigoId && pessoa.trim() === p}
                    onPress={() =>
                    {
                      setPessoa(p)
                      setAmigoId(null)
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}

          <View style={{ gap: 12 }}>
            <Text variant="caption" muted>
              O que ela vai fazer
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {TASK_WAIT_REASONS.map((r) => (
                <Chip key={r.id} label={r.label} active={motivo === r.id} onPress={() => setMotivo(r.id)} />
              ))}
            </View>
          </View>

          {allowWhen ? (
            <View style={{ gap: 12 }}>
              <Text variant="caption" muted>
                Quando ela entra
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {WHEN.map((w) => (
                  <Chip key={w.id} label={w.label} active={quando === w.id} onPress={() => setQuando(w.id)} />
                ))}
              </View>
              <Text variant="caption" muted>
                {WHEN.find((w) => w.id === quando)?.hint}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Cancelar" variant="ghost" size="sm" onPress={() => setOpen(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Adicionar" size="sm" disabled={!pessoa.trim()} onPress={add} />
            </View>
          </View>
        </View>
      ) : (
        <PrimaryButton
          label={value.length ? 'Mais uma pessoa' : 'Adicionar pessoa'}
          variant="secondary"
          size="sm"
          icon="person-add-outline"
          onPress={() => setOpen(true)}
        />
      )}
    </View>
  )
}
