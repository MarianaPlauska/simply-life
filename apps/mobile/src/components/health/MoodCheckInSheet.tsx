import { useEffect, useState } from 'react'
import { Modal, Pressable, TextInput, View } from 'react-native'
import { moodLabel, humorDoDia, localTodayIso } from '@simply-life/shared'
import { Card, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { MoodFaceRow } from '../MoodFace'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useNotesStore } from '../../store/notesStore'
import { loadMoodPromptSkipIso, saveMoodPromptSkipIso } from '../../lib/moodPromptSkip'

/** Check-in do PWA: primeira entrada do dia pergunta o humor e aceita uma nota. */
export function MoodCheckInSheet()
{
  const { colors, space, radius } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const humor = useDataStore((s) => s.humor)
  const source = useDataStore((s) => s.source)
  const addHumor = useDataStore((s) => s.addHumor)
  const createNote = useNotesStore((s) => s.create)
  const updateNote = useNotesStore((s) => s.update)

  const [skipIso, setSkipIso] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const dia = localTodayIso()
  const temHoje = Boolean(humorDoDia(humor, dia))

  useEffect(() =>
  {
    void loadMoodPromptSkipIso().then((iso) =>
    {
      setSkipIso(iso)
      setReady(true)
    })
  }, [])

  const visible = ready && source !== 'idle' && !temHoje && skipIso !== dia

  const onSkip = () =>
  {
    void saveMoodPromptSkipIso(dia)
    setSkipIso(dia)
  }

  const onSave = async () =>
  {
    if (mood == null) return
    setSaving(true)
    try
    {
      const texto = nota.trim()
      await addHumor(mood, texto || undefined, isGuest)
      if (texto && !isGuest)
      {
        try
        {
          const row = await createNote('diario')
          if (row)
          {
            await updateNote(row.id, {
              titulo: `Humor: ${moodLabel(mood)}`,
              conteudo: texto,
            })
          }
        }
        catch
        {
          /* humor já persistiu; nota extra é complementar */
        }
      }
      await saveMoodPromptSkipIso(dia)
      setSkipIso(dia)
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onSkip} accessibilityLabel="Adiar check-in" />
        <Card
          tone="elevated"
          style={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            gap: space.md,
            paddingBottom: space.xl,
          }}
        >
          <Text variant="section">Como está o seu humor hoje?</Text>
          <Text variant="caption" muted>
            Um toque já conta. Se quiser, escreva também — dá para complementar depois em Saúde ou Anotações.
          </Text>
          <MoodFaceRow value={mood} onChange={setMood} />
          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Opcional: o que está passando na cabeça…"
            placeholderTextColor={colors.inkFaint}
            multiline
            style={{
              minHeight: 88,
              textAlignVertical: 'top',
              borderRadius: radius.control,
              padding: 12,
              fontSize: 16,
              color: colors.ink,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          />
          <PrimaryButton
            label="Registrar"
            disabled={mood == null || saving}
            loading={saving}
            onPress={() => void onSave()}
          />
          <PrimaryButton label="Agora não" variant="ghost" onPress={onSkip} />
        </Card>
      </View>
    </Modal>
  )
}
