import { useEffect, useMemo, useState } from 'react'
import { Platform, View } from 'react-native'
import {
  addDaysToIso,
  expandBlocos,
  formatDayPt,
  minutesToLabel,
  resumoDia,
  mondayOfIso,
  todayIso,
  type Bloco,
  type BlocoOcorrencia,
} from '@simply-life/shared'
import { Icon, PillTabs, PressableScale, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useMeuMundoStore } from '../../store/meuMundoStore'
import { MundoWeekGrid } from './MundoWeekGrid'
import { MundoDayTimeline } from './MundoDayTimeline'
import { MundoBlocoSheet } from './MundoBlocoSheet'
import { useMundoEvents } from './useMundoEvents'

type View_ = 'semana' | 'dia'

function shortDay(iso: string): string
{
  return `${Number(iso.slice(8))}/${iso.slice(5, 7)}`
}

/** Meu Mundo: a semana em grade (planilha) e o dia em linha do tempo, sobre os mesmos blocos. */
export function MeuMundoPane({ initialDia }: { initialDia?: string })
{
  const { colors, space } = useTheme()
  const blocos = useMeuMundoStore((s) => s.blocos)
  const marcas = useMeuMundoStore((s) => s.marcas)
  const loaded = useMeuMundoStore((s) => s.loaded)
  const hydrate = useMeuMundoStore((s) => s.hydrate)
  const error = useMeuMundoStore((s) => s.error)
  const clearError = useMeuMundoStore((s) => s.clearError)
  const save = useMeuMundoStore((s) => s.save)
  const mark = useMeuMundoStore((s) => s.mark)
  const fitDia = useMeuMundoStore((s) => s.fitDia)
  const phoneLinked = useMeuMundoStore((s) => s.phoneLinked)
  const loadPhoneEvents = useMeuMundoStore((s) => s.loadPhoneEvents)
  const events = useMundoEvents()
  const [notice, setNotice] = useState('')
  const [view, setView] = useState<View_>(initialDia ? 'dia' : 'semana')
  const [dia, setDia] = useState(initialDia ?? todayIso())
  const [sheet, setSheet] = useState<{ editing: Bloco | null; dia: string; hora: number | null } | null>(null)

  useEffect(() =>
  {
    if (!loaded) void hydrate()
  }, [loaded, hydrate])

  useEffect(() =>
  {
    if (initialDia)
    {
      setDia(initialDia)
      setView('dia')
    }
  }, [initialDia])

  const monday = mondayOfIso(dia)
  const from = view === 'semana' ? monday : dia
  const to = view === 'semana' ? addDaysToIso(monday, 6) : dia
  const ocorrencias = useMemo(() => expandBlocos(blocos, marcas, from, to), [blocos, marcas, from, to])

  const step = view === 'semana' ? 7 : 1
  const label = view === 'semana' ? `${shortDay(monday)} a ${shortDay(addDaysToIso(monday, 6))}` : formatDayPt(dia)
  const openBloco = (o: BlocoOcorrencia) => setSheet({ editing: o.bloco, dia: o.dia, hora: o.inicio })

  // repetido: mexer na grade muda só aquele dia; avulso: muda o próprio bloco
  const onMove = (o: BlocoOcorrencia, novoDia: string, hora: number) =>
  {
    if (o.bloco.repete === 'nao')
    {
      void save({ ...o.bloco, dataInicio: novoDia, horaMinutos: hora })
      return
    }
    void mark(o.bloco.id, o.dia, { horaMinutos: hora })
    setNotice(novoDia !== o.dia
      ? 'Bloco que se repete muda de hora só naquele dia. Para trocar o dia, toque nele e edite.'
      : `${o.bloco.titulo} foi para ${minutesToLabel(hora)} só neste dia.`)
  }

  const resumoAlvo = view === 'dia' ? dia : todayIso()
  const resumo = useMemo(
    () => resumoDia(resumoAlvo, expandBlocos(blocos, marcas, resumoAlvo, resumoAlvo), events),
    [resumoAlvo, blocos, marcas, events],
  )
  const temFlex = blocos.some((b) => b.tipo === 'flexivel')
  const ajeitar = async () =>
  {
    const n = await fitDia(resumoAlvo, events)
    setNotice(n
      ? `Encaixei ${n} ${n === 1 ? 'bloco flexível' : 'blocos flexíveis'} nos horários livres.`
      : 'Os flexíveis já estão em horários livres.')
  }
  const resumoTexto = [
    `${resumo.total} ${resumo.total === 1 ? 'coisa' : 'coisas'}`,
    resumo.conflitos ? `${resumo.conflitos} ${resumo.conflitos === 1 ? 'conflito' : 'conflitos'}` : null,
    resumo.livre ? `livre das ${minutesToLabel(resumo.livre.inicio)} às ${minutesToLabel(resumo.livre.fim)}` : 'sem horário livre',
  ].filter(Boolean).join(', ')

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <PillTabs
            tabs={[
              { id: 'semana', label: 'Semana' },
              { id: 'dia', label: 'Dia' },
            ]}
            value={view}
            onChange={setView}
          />
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Novo bloco"
          onPress={() => setSheet({ editing: null, dia, hora: null })}
          style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.axel }}
        >
          <Icon name="add" size={24} color={colors.canvas} />
        </PressableScale>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <PressableScale accessibilityLabel="Anterior" hitSlop={10} onPress={() => setDia(addDaysToIso(dia, -step))}>
          <Icon name="chevron-back" size={22} color={colors.inkMuted} />
        </PressableScale>
        <Text variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{label}</Text>
        <PressableScale accessibilityLabel="Próximo" hitSlop={10} onPress={() => setDia(addDaysToIso(dia, step))}>
          <Icon name="chevron-forward" size={22} color={colors.inkMuted} />
        </PressableScale>
      </View>
      {dia !== todayIso() ? (
        <PrimaryButton label="Voltar para hoje" variant="link" size="sm" onPress={() => setDia(todayIso())} />
      ) : null}

      {error ? <PrimaryButton label={error} variant="link" size="sm" onPress={clearError} /> : null}

      {resumo.total ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon
            name={resumo.conflitos ? 'alert-circle-outline' : 'sunny-outline'}
            size={18}
            color={resumo.conflitos ? colors.danger : colors.inkMuted}
          />
          <Text variant="caption" muted style={{ flex: 1 }}>
            {resumoAlvo === todayIso() ? 'Hoje' : formatDayPt(resumoAlvo)}: {resumoTexto}
          </Text>
          {temFlex ? <PrimaryButton label="Ajeitar" size="sm" variant="secondary" onPress={() => void ajeitar()} /> : null}
        </View>
      ) : null}
      {notice ? <PrimaryButton label={notice} variant="link" size="sm" onPress={() => setNotice('')} /> : null}
      {Platform.OS !== 'web' && !phoneLinked ? (
        <PrimaryButton
          label="Mostrar a agenda do celular aqui"
          variant="link"
          size="sm"
          icon="calendar-outline"
          onPress={() => void loadPhoneEvents(true)}
        />
      ) : null}

      {view === 'semana' ? (
        <MundoWeekGrid
          monday={monday}
          ocorrencias={ocorrencias}
          events={events}
          onMove={onMove}
          onResize={(o, duracao) => void save({ ...o.bloco, duracaoMinutos: duracao })}
          onPressSlot={(d, h) => setSheet({ editing: null, dia: d, hora: h })}
          onPressBloco={openBloco}
          onPressDay={(d) =>
          {
            setDia(d)
            setView('dia')
          }}
        />
      ) : (
        <MundoDayTimeline dia={dia} ocorrencias={ocorrencias} events={events} onPressBloco={openBloco} />
      )}

      <MundoBlocoSheet
        visible={sheet != null}
        editing={sheet?.editing ?? null}
        dia={sheet?.dia ?? dia}
        hora={sheet?.hora ?? null}
        onClose={() => setSheet(null)}
      />
    </View>
  )
}
