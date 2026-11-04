import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  addDaysToIso,
  blocoConflicts,
  expandBlocos,
  formatDayPt,
  isoMonthsFrom,
  minutesToLabel,
  nextFreeSlot,
  parseBlocoFala,
  todayIso,
  type Bloco,
  type BlocoConflito,
  type BlocoRepete,
} from '@simply-life/shared'
import { Modal } from '../../ui/Modal'
import { Chip, Field, Icon, PressableScale, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useMeuMundoStore, newBlocoId } from '../../store/meuMundoStore'
import { useMundoEvents } from './useMundoEvents'
import { MUNDO_CORES } from './mundoColors'

type Props = {
  visible: boolean
  editing: Bloco | null
  dia: string
  hora: number | null
  onClose: () => void
}

const DURACOES = [15, 30, 45, 60, 90, 120]
const AVISOS: (number | null)[] = [null, 0, 5, 10, 15, 30, 60]
// Seg..Dom na tela; 0 = domingo no dado
const SEMANA = [
  { label: 'Seg', dow: 1 },
  { label: 'Ter', dow: 2 },
  { label: 'Qua', dow: 3 },
  { label: 'Qui', dow: 4 },
  { label: 'Sex', dow: 5 },
  { label: 'Sáb', dow: 6 },
  { label: 'Dom', dow: 0 },
]

function parseHora(text: string): number | null
{
  const m = text.trim().match(/^(\d{1,2})(?:[:h](\d{2})?)?$/i)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2] || 0)
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function avisoLabel(a: number | null): string
{
  if (a == null) return 'Nenhum'
  if (a === 0) return 'Na hora'
  return a >= 60 ? '1 h antes' : `${a} min`
}

/** Criar ou editar um bloco do Meu Mundo. Avisa quando bate com outro horário. */
export function MundoBlocoSheet({ visible, editing, dia, hora, onClose }: Props)
{
  const { colors, chart, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const blocos = useMeuMundoStore((s) => s.blocos)
  const marcas = useMeuMundoStore((s) => s.marcas)
  const save = useMeuMundoStore((s) => s.save)
  const remove = useMeuMundoStore((s) => s.remove)
  const events = useMundoEvents()

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<Bloco['tipo']>('fixo')
  const [dataInicio, setDataInicio] = useState(dia)
  const [horaText, setHoraText] = useState('')
  const [duracao, setDuracao] = useState(60)
  const [repete, setRepete] = useState<BlocoRepete>('nao')
  const [dias, setDias] = useState<number[]>([])
  const [intervalo, setIntervalo] = useState(1)
  const [ate, setAte] = useState<string | null>(null)
  const [aviso, setAviso] = useState<number | null>(10)
  const [avisoFim, setAvisoFim] = useState(false)
  const [cor, setCor] = useState(MUNDO_CORES[0])
  const [conflitos, setConflitos] = useState<BlocoConflito[]>([])
  const [fala, setFala] = useState('')
  const [falaMsg, setFalaMsg] = useState('')

  const preencher = () =>
  {
    const r = parseBlocoFala(fala)
    if (!r)
    {
      setFalaMsg('Não achei a repetição. Tente "academia seg qua sex 7h".')
      return
    }
    setTitulo(r.titulo)
    if (r.horaMinutos != null) setHoraText(minutesToLabel(r.horaMinutos))
    setDuracao(r.duracaoMinutos)
    setRepete(r.repete)
    setDias(r.diasSemana)
    setIntervalo(r.intervaloSemanas)
    setConflitos([])
    setFala('')
    setFalaMsg('Pronto, confira abaixo e salve.')
  }

  useEffect(() =>
  {
    if (!visible) return
    const b = editing
    setTitulo(b?.titulo ?? '')
    setTipo(b?.tipo ?? 'fixo')
    setDataInicio(b?.dataInicio ?? dia)
    const h = b ? b.horaMinutos : hora
    setHoraText(h == null ? '' : minutesToLabel(h))
    setDuracao(b?.duracaoMinutos ?? 60)
    setRepete(b?.repete ?? 'nao')
    setDias(b?.diasSemana ?? [])
    setIntervalo(b?.intervaloSemanas ?? 1)
    setAte(b?.repeteAte ?? null)
    setAviso(b ? b.avisoMinutos : 10)
    setAvisoFim(b?.avisoFim ?? false)
    setCor(b?.cor ?? MUNDO_CORES[0])
    setConflitos([])
    setFala('')
    setFalaMsg('')
  }, [visible, editing, dia, hora])

  const horaMin = parseHora(horaText)
  const horaInvalida = horaText.trim() !== '' && horaMin == null

  const draft = (h = horaMin): Bloco => ({
    id: editing?.id ?? newBlocoId(),
    titulo: titulo.trim(),
    tipo,
    dataInicio,
    horaMinutos: h,
    duracaoMinutos: duracao,
    repete,
    diasSemana: repete === 'semanal' ? (dias.length ? dias : [new Date(`${dataInicio}T12:00:00`).getDay()]) : [],
    intervaloSemanas: repete === 'semanal' ? intervalo : 1,
    repeteAte: repete === 'nao' ? null : ate,
    avisoMinutos: h == null ? null : aviso,
    avisoFim: h == null ? false : avisoFim,
    cor,
    categoria: editing?.categoria ?? null,
  })

  const others = useMemo(() =>
  {
    const from = todayIso() < dataInicio ? todayIso() : dataInicio
    return expandBlocos(blocos.filter((b) => b.id !== editing?.id), marcas, from, addDaysToIso(from, 20))
  }, [blocos, marcas, editing, dataInicio])

  const firstConflict = conflitos[0]
  const sugestao = firstConflict
    ? nextFreeSlot(firstConflict.dia, duracao, others, events, { from: horaMin ?? undefined, skipId: editing?.id })
    : null

  const finish = (b: Bloco) =>
  {
    void save(b)
    onClose()
  }

  const onSave = () =>
  {
    const b = draft()
    const from = dataInicio > todayIso() ? dataInicio : todayIso()
    const found = blocoConflicts(b, others, events, from)
    if (found.length && !conflitos.length)
    {
      setConflitos(found)
      return
    }
    finish(b)
  }

  const toggleDia = (dow: number) =>
    setDias((cur) => (cur.includes(dow) ? cur.filter((d) => d !== dow) : [...cur, dow]))

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar" />
        <View
          style={{
            maxHeight: '92%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.lg),
          }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.hairlineStrong }} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.lg, gap: space.md }}>
            <Text variant="section">{editing ? 'Editar bloco' : 'Novo bloco'}</Text>
            {!editing ? (
              <View style={{ gap: 8 }}>
                <Field
                  label="Escreva do seu jeito"
                  value={fala}
                  onChangeText={(t) =>
                  {
                    setFala(t)
                    setFalaMsg('')
                  }}
                  onSubmitEditing={preencher}
                  returnKeyType="done"
                  placeholder="academia seg qua sex 7h"
                />
                {fala.trim() ? <PrimaryButton label="Preencher" size="sm" variant="secondary" icon="sparkles-outline" onPress={preencher} /> : null}
                {falaMsg ? <Text variant="caption" muted>{falaMsg}</Text> : null}
              </View>
            ) : null}
            <Field label="O que é" value={titulo} onChangeText={setTitulo} placeholder="Academia, aula, estudar..." />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Horário fixo" active={tipo === 'fixo'} onPress={() => setTipo('fixo')} />
              <Chip label="Flexível" active={tipo === 'flexivel'} onPress={() => setTipo('flexivel')} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <PressableScale accessibilityLabel="Dia anterior" onPress={() => setDataInicio(addDaysToIso(dataInicio, -1))} hitSlop={8}>
                <Icon name="chevron-back" size={20} color={colors.inkMuted} />
              </PressableScale>
              <Text variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{formatDayPt(dataInicio)}</Text>
              <PressableScale accessibilityLabel="Próximo dia" onPress={() => setDataInicio(addDaysToIso(dataInicio, 1))} hitSlop={8}>
                <Icon name="chevron-forward" size={20} color={colors.inkMuted} />
              </PressableScale>
            </View>

            <Field
              label="Hora (vazio = sem hora)"
              value={horaText}
              onChangeText={(t) =>
              {
                setHoraText(t)
                setConflitos([])
              }}
              placeholder="07:00"
              keyboardType="numbers-and-punctuation"
              error={horaInvalida ? 'Use o formato 07:30' : undefined}
            />

            <Text variant="caption" muted>Duração</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DURACOES.map((d) => (
                <Chip
                  key={d}
                  label={d < 60 ? `${d} min` : d % 60 ? `${Math.floor(d / 60)}h${d % 60}` : `${d / 60} h`}
                  active={duracao === d}
                  onPress={() =>
                  {
                    setDuracao(d)
                    setConflitos([])
                  }}
                />
              ))}
            </View>

            <Text variant="caption" muted>Repetir</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Não" active={repete === 'nao'} onPress={() => setRepete('nao')} />
              <Chip label="Todo dia" active={repete === 'diario'} onPress={() => setRepete('diario')} />
              <Chip label="Dias da semana" active={repete === 'semanal'} onPress={() => setRepete('semanal')} />
            </View>
            {repete === 'semanal' ? (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SEMANA.map((d) => (
                    <Chip key={d.dow} label={d.label} active={dias.includes(d.dow)} onPress={() => toggleDia(d.dow)} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <Chip key={n} label={n === 1 ? 'Toda semana' : `A cada ${n}`} active={intervalo === n} onPress={() => setIntervalo(n)} />
                  ))}
                </View>
              </>
            ) : null}
            {repete !== 'nao' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label="Sem fim" active={ate == null} onPress={() => setAte(null)} />
                {[1, 3, 6].map((m) =>
                {
                  const iso = isoMonthsFrom(dataInicio, m)
                  return <Chip key={m} label={`Por ${m} ${m === 1 ? 'mês' : 'meses'}`} active={ate === iso} onPress={() => setAte(iso)} />
                })}
              </View>
            ) : null}

            {horaMin != null ? (
              <>
                <Text variant="caption" muted>Avisar</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {AVISOS.map((a) => (
                    <Chip key={String(a)} label={avisoLabel(a)} active={aviso === a} onPress={() => setAviso(a)} />
                  ))}
                </View>
                <Chip label="Perguntar no fim se deu" icon="help-circle-outline" active={avisoFim} onPress={() => setAvisoFim(!avisoFim)} />
              </>
            ) : null}

            <Text variant="caption" muted>Cor</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {MUNDO_CORES.map((c) => (
                <PressableScale
                  key={c}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: cor === c }}
                  accessibilityLabel={`Cor ${c}`}
                  onPress={() => setCor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: chart[Number(c)],
                    borderWidth: cor === c ? 3 : 0,
                    borderColor: colors.ink,
                  }}
                />
              ))}
            </View>

            {firstConflict ? (
              <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.control, backgroundColor: colors.fill }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icon name="alert-circle-outline" size={20} color={colors.danger} />
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    Isso bate com {firstConflict.titulo} às {minutesToLabel(firstConflict.inicio)}
                    {firstConflict.dia !== dataInicio || repete !== 'nao' ? ` (${formatDayPt(firstConflict.dia)})` : ''}
                  </Text>
                </View>
                {conflitos.length > 1 ? (
                  <Text variant="caption" muted>E mais {conflitos.length - 1} vez(es) nas próximas 2 semanas.</Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {sugestao != null ? (
                    <PrimaryButton size="sm" label={`Mover para ${minutesToLabel(sugestao)}`} onPress={() => finish(draft(sugestao))} />
                  ) : null}
                  <PrimaryButton size="sm" variant="secondary" label="Manter as duas" onPress={() => finish(draft())} />
                </View>
              </View>
            ) : (
              <PrimaryButton label="Salvar" disabled={!titulo.trim() || horaInvalida} onPress={onSave} />
            )}
            {editing ? (
              <PrimaryButton
                label="Apagar bloco"
                variant="link"
                onPress={() =>
                {
                  void remove(editing.id)
                  onClose()
                }}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
