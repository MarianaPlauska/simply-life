import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  deadlinesAtRisk,
  localTodayIso,
  minutesLabel,
  weeklyReview,
  weeklyReviewToHtml,
  weeklyReviewToText,
  type MobileTask,
} from '@simply-life/shared'
import { Chip, PaneTitle, PrimaryButton, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAccents } from '../../../theme/useAccents'
import { usePlanLogStore } from '../../../store/planLogStore'
import { useCalendarStore } from '../../../store/calendarStore'
import { usePrefsStore } from '../../../store/prefsStore'
import { shareReportPdf, shareReportText } from '../../../lib/shareReport'
import { ReportCard, ReportRow, ReportStat, shortDate } from './ReportBits'
import { useWebDesk } from '../../dashboard/web/webBox'
import { webStyle } from '../../dashboard/web/webStyle'
import { WebSegmented } from '../web/WebListParts'

/** 1 e 9. Revisão da semana: planejado × feito, destaques, o que escorregou, o que vem. */
export function WeeklyReviewPane({ tasks }: { tasks: MobileTask[] })
{
  const { colors, space } = useTheme()
  const accents = useAccents()
  const plans = usePlanLogStore((s) => s.plans)
  const completions = usePlanLogStore((s) => s.completions)
  const hydrateLog = usePlanLogStore((s) => s.hydrate)
  const events = useCalendarStore((s) => s.events)
  const name = usePrefsStore((s) => s.prefs.axel_calls_you || s.prefs.display_name)
  const [offset, setOffset] = useState<0 | -1>(0)
  // computador: cartões lado a lado em vez de uma pilha comprida
  const desk = useWebDesk()
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    void hydrateLog()
  }, [hydrateLog])

  const today = localTodayIso()
  const review = useMemo(
    () => weeklyReview({ tasks, completions, plans, offset, today }),
    [tasks, completions, plans, offset, today],
  )
  const risks = useMemo(() => deadlinesAtRisk({ tasks, events, today }), [tasks, events, today])
  const shareOpts = { risks: offset === 0 ? risks : [], name: name || undefined }

  return (
    <View style={{ gap: space.md }}>
      <PaneTitle
        title="Revisão da semana"
        subtitle={`${shortDate(review.start)} a ${shortDate(review.end)}. O que foi feito, o que escorregou e o que vem.`}
      />
      {desk ? (
        <WebSegmented
          options={[
            { id: 'now', label: 'Esta semana' },
            { id: 'prev', label: 'Semana passada' },
          ]}
          value={offset === 0 ? 'now' : 'prev'}
          onChange={(id) => setOffset(id === 'now' ? 0 : -1)}
        />
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="Esta semana" active={offset === 0} onPress={() => setOffset(0)} />
          <Chip label="Semana passada" active={offset === -1} onPress={() => setOffset(-1)} />
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <ReportStat value={String(review.done.length)} label="Concluídas" />
        <ReportStat value={review.doneMinutes ? minutesLabel(review.doneMinutes) : '0'} label="Tempo" hint="Pela estimativa." />
        <ReportStat
          value={review.plannedCount ? `${review.plannedDone}/${review.plannedCount}` : '0'}
          label="Do plano"
          hint={review.plannedCount ? undefined : 'Sem plano da noite.'}
        />
      </View>

      {/* cartões vazios não aparecem: sem frase de consolo ocupando espaço */}
      <View
        style={desk
          ? webStyle({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' })
          : { gap: space.md }}
      >
      {review.highlights.length ? (
        <ReportCard title="Destaques" hint="As mais importantes que você concluiu.">
          {review.highlights.map((t, i, arr) => (
            <ReportRow key={t.id} icon="checkmark-circle" tint={accents.data} title={t.titulo} last={i === arr.length - 1} />
          ))}
        </ReportCard>
      ) : null}

      {review.slipped.length ? (
      <ReportCard title="Ficou para a próxima" hint="Para cada uma: fazer, remarcar ou tirar da lista.">
        {review.slipped.slice(0, 6).map((t, i, arr) => (
            <ReportRow
              key={t.id}
              icon="return-down-forward"
              tint={colors.attention}
              title={t.titulo}
              right={t.dataVencimento ? shortDate(t.dataVencimento.slice(0, 10)) : undefined}
              last={i === arr.length - 1}
            />
        ))}
      </ReportCard>
      ) : null}

      {offset === 0 && review.next.length ? (
        <ReportCard title="Próximos 7 dias" hint={`${review.next.length} com prazo.`}>
          {review.next.slice(0, 6).map((t, i, arr) => (
              <ReportRow
                key={t.id}
                icon={risks.some((r) => r.task.id === t.id) ? 'alert-circle-outline' : 'calendar-outline'}
                tint={risks.some((r) => r.task.id === t.id) ? colors.attention : accents.data2}
                title={t.titulo}
                right={shortDate((t.dataVencimento as string).slice(0, 10))}
                last={i === arr.length - 1}
              />
          ))}
        </ReportCard>
      ) : null}

      <ReportCard title="Guardar a semana" hint="O resumo desta semana em texto ou PDF, para você reler quando quiser.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <PrimaryButton
            label="Compartilhar texto"
            variant="secondary"
            size="sm"
            icon="share-outline"
            onPress={() => void shareReportText(weeklyReviewToText(review, shareOpts), 'Revisão da semana').then(setMsg)}
          />
          <PrimaryButton
            label="Salvar em PDF"
            variant="secondary"
            size="sm"
            icon="document-text-outline"
            onPress={() => void shareReportPdf(weeklyReviewToHtml(review, shareOpts)).then(setMsg)}
          />
        </View>
        {msg ? <Text variant="caption" muted>{msg}</Text> : null}
      </ReportCard>
      </View>
    </View>
  )
}
