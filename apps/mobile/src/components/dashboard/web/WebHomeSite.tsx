import { useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { localTodayIso, moodColor, moodLabel, type MobileTask } from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { BrandMark, SunFyWordmark } from '../../BrandMark'
import { useTheme } from '../../../theme/ThemeProvider'
import { webBandColor } from '../../../theme/webPalette'
import { useDataStore } from '../../../store/dataStore'
import { useCaptureStore, captureForTab } from '../../../store/captureStore'
import { useSectionNavStore } from '../../../store/sectionNavStore'
import { useSidebarTree, applySidebarChild } from '../../layout/sidebarTree'
import { WebDateNav } from '../../kanban/web/WebDateNav'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_DISPLAY_FONT } from './webTypography'
import type { WebStatItem } from './WebStatRow'

/*
 * Início da web montado como página de site, de cima para baixo:
 * herói, números do dia, áreas, ritmo, o que você escreveu, Axel, chamada final e rodapé.
 * Cada parte leva para a página de verdade (a mesma do menu do topo).
 */

/** Seção com título centralizado e um traço curto embaixo, como no wireframe. */
export function SiteSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode })
{
  const { colors } = useTheme()
  return (
    <View style={{ gap: 24, paddingTop: 40 }}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 30, lineHeight: 38, color: colors.ink, textAlign: 'center' }}>
          {title}
        </Text>
        <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: colors.axelFill }} />
        {subtitle ? (
          <Text variant="body" muted style={{ textAlign: 'center', maxWidth: 560 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function pillButton(
  { label, icon, onPress, tone }: { label: string; icon?: keyof typeof Icon.glyphMap; onPress: () => void; tone: 'coral' | 'outline' | 'white' },
  colors: ReturnType<typeof useTheme>['colors'],
)
{
  const bg = tone === 'coral' ? colors.axelFill : tone === 'white' ? colors.elevated : 'transparent'
  const ink = tone === 'coral' ? colors.axelOnFill : tone === 'white' ? colors.ink : colors.onBrand
  return (
    <WebHoverable
      key={label}
      onPress={onPress}
      accessibilityLabel={label}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 44,
        paddingHorizontal: 20,
        borderRadius: 999,
        backgroundColor: tone === 'coral' && hovered ? colors.axelHover : bg,
        borderWidth: tone === 'outline' ? 1 : 0,
        borderColor: `${colors.onBrand}59`,
        opacity: hovered && tone !== 'coral' ? 0.9 : 1,
        cursor: 'pointer',
      })}
    >
      {icon ? <Icon name={icon} size={16} color={ink} /> : null}
      <Text style={{ fontSize: 15, fontFamily: 'Lexend_600SemiBold', color: ink }}>{label}</Text>
    </WebHoverable>
  )
}

function hhmm(mins: number | null): string
{
  if (mins == null) return 'Sem hora'
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

/**
 * Herói na faixa petróleo: selo com a data, título grande, uma frase e os botões;
 * à direita o calendário do mês em alto contraste com as próximas tarefas de hoje.
 */
export function SiteHero({
  greet,
  name,
  dateLabel,
  pending,
  overdue,
  todayTasks,
  allTasks,
  onMore,
  padH,
  padTop,
  wide = true,
}: {
  greet: string
  name: string
  dateLabel: string
  pending: number
  overdue: number
  todayTasks: MobileTask[]
  allTasks: MobileTask[]
  onMore: () => void
  padH: number
  padTop: number
  /** tela larga: texto e calendário lado a lado; senão, um embaixo do outro */
  wide?: boolean
})
{
  const { colors, mode } = useTheme()
  const router = useRouter()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const cream = colors.onBrand
  const creamSoft = `${colors.onBrand}C7`
  const today = localTodayIso()
  const marked = useMemo(
    () => new Set(allTasks.filter((t) => t.status !== 'done' && t.dataVencimento).map((t) => (t.dataVencimento as string).slice(0, 10))),
    [allTasks],
  )
  const capture = captureForTab('/')

  const line = pending === 0
    ? 'Nada em aberto. Aproveite o respiro.'
    : `${pending} ${pending === 1 ? 'tarefa em aberto' : 'tarefas em aberto'}${overdue > 0 ? `, ${overdue} ${overdue === 1 ? 'atrasada' : 'atrasadas'}` : ''}. Uma coisa de cada vez.`

  return (
    <View
      style={webStyle({
        marginLeft: -padH,
        marginRight: -padH,
        marginTop: -padTop,
        paddingLeft: padH,
        paddingRight: padH,
        paddingTop: 40,
        paddingBottom: 48,
        backgroundColor: webBandColor(mode),
        display: 'grid',
        gridTemplateColumns: wide ? 'minmax(0, 1.15fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
        gap: 40,
        alignItems: 'center',
      })}
    >
      <View style={{ gap: 20, minWidth: 0 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: `${colors.onBrand}1A`,
          }}
        >
          <Icon name="calendar-outline" size={14} color={creamSoft} />
          <Text style={{ fontSize: 13, fontFamily: 'Lexend_500Medium', color: cream }}>{dateLabel}</Text>
        </View>
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 48, lineHeight: 56, color: cream }}>
          {greet}, {name}
        </Text>
        <Text style={{ fontSize: 17, lineHeight: 26, fontFamily: 'Lexend_400Regular', color: creamSoft, maxWidth: 520 }}>
          {line}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
          {pillButton({ label: 'Capturar', icon: 'add', tone: 'coral', onPress: () => openCapture(capture.kind, null, { studio: capture.studio }) }, colors)}
          {pillButton({ label: 'Ver tarefas', tone: 'outline', onPress: () => router.push('/(tabs)/kanban') }, colors)}
          {pillButton({ label: 'Mais', icon: 'options-outline', tone: 'outline', onPress: onMore }, colors)}
        </View>
      </View>

      {/* calendário e o que vem hoje, num cartão branco por cima da faixa */}
      <View
        style={webStyle({
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
          gap: 20,
          padding: 20,
          borderRadius: 20,
          backgroundColor: colors.elevated,
          boxShadow: '0 16px 40px rgba(21, 32, 34, 0.18)',
        })}
      >
        <WebDateNav
          selectedIso={today}
          marked={marked}
          onSelect={() =>
          {
            useSectionNavStore.getState().setActive('kanban', 'calendario')
            router.push('/(tabs)/kanban')
          }}
        />
        <View style={{ gap: 12, minWidth: 0 }}>
          <Text variant="caption" muted style={{ fontWeight: '700' }}>HOJE</Text>
          {todayTasks.length === 0 ? (
            <Text variant="caption" muted>Nada com horário hoje.</Text>
          ) : (
            todayTasks.slice(0, 4).map((t) => (
              <WebHoverable
                key={t.id}
                onPress={() => router.push(`/task/${t.id}`)}
                accessibilityLabel={t.titulo}
                style={(hovered) => webStyle({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: hovered ? colors.surface : `${colors.brand}0F`,
                  cursor: 'pointer',
                })}
              >
                <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: t.prioridade === 1 ? colors.axelFill : colors.brand }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{t.titulo}</Text>
                  <Text variant="caption" muted>{hhmm(t.horaMinutos)}</Text>
                </View>
              </WebHoverable>
            ))
          )}
        </View>
      </View>
    </View>
  )
}

/** Faixa de números logo abaixo do herói (no lugar dos logos de parceiros do wireframe). */
export function SiteNumbers({ items }: { items: WebStatItem[] })
{
  const { colors } = useTheme()
  return (
    <View style={{ gap: 16, paddingTop: 8 }}>
      <Text variant="caption" muted style={{ textAlign: 'center' }}>Seu dia em números</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 16, columnGap: 32 }}>
        {items.map((item) => (
          <WebHoverable
            key={item.id}
            onPress={item.onPress}
            accessibilityLabel={`${item.label}: ${item.value}`}
            style={webStyle({ alignItems: 'center', gap: 2, cursor: item.onPress ? 'pointer' : 'default' })}
          >
            {(hovered: boolean) => (
              <>
                <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 30, lineHeight: 38, color: hovered && item.onPress ? item.color : colors.ink }}>
                  {item.value}
                </Text>
                <Text variant="caption" muted>
                  {item.label}{item.hint ? ` · ${item.hint}` : ''}
                </Text>
              </>
            )}
          </WebHoverable>
        ))}
      </View>
    </View>
  )
}

/** Notas do diário como cartões de depoimento: humor no lugar das estrelas. */
export function SiteNotes({ wide = true }: { wide?: boolean })
{
  const { colors } = useTheme()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor) ?? []
  const notes = useMemo(
    () => humor
      .filter((h) => (h.nota ?? '').trim().length > 0)
      .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
      .slice(0, 4),
    [humor],
  )

  if (notes.length === 0)
  {
    return (
      <Text variant="body" muted style={{ textAlign: 'center' }}>
        As notas que você escrever no check-in de humor aparecem aqui.
      </Text>
    )
  }

  const openDiary = () =>
  {
    useSectionNavStore.getState().setActive('saude', 'diario')
    router.push('/(tabs)/saude')
  }

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: wide ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: 16 })}>
      {notes.map((h, i) =>
      {
        const when = new Date(`${(h.data ?? '').slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
        return (
          <WebHoverable
            key={`${h.data}-${i}`}
            onPress={openDiary}
            accessibilityLabel={`Nota de ${when}`}
            style={(hovered) => webStyle({
              gap: 12,
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: hovered ? colors.hairline : colors.cardRim,
              backgroundColor: colors.elevated,
              cursor: 'pointer',
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: moodColor(h.humor) }} />
              <Text variant="caption" style={{ fontWeight: '700' }}>{moodLabel(h.humor)}</Text>
            </View>
            <Text variant="body" numberOfLines={4} style={{ fontSize: 15, lineHeight: 22 }}>
              “{h.nota}”
            </Text>
            <Text variant="caption" muted>{when}</Text>
          </WebHoverable>
        )
      })}
    </View>
  )
}

/** Chamada final, como o "CTA" do wireframe: uma ação só, grande. */
export function SiteCta()
{
  const { colors, mode } = useTheme()
  const router = useRouter()
  return (
    <View
      style={{
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
        paddingHorizontal: 40,
        paddingVertical: 36,
        borderRadius: 24,
        backgroundColor: webBandColor(mode),
      }}
    >
      <View style={{ gap: 8, flexShrink: 1 }}>
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 30, lineHeight: 38, color: colors.onBrand }}>
          Amanhã começa hoje à noite
        </Text>
        <Text style={{ fontSize: 16, lineHeight: 24, fontFamily: 'Lexend_400Regular', color: `${colors.onBrand}C7` }}>
          Escolha as três coisas de amanhã em dois minutos e durma mais leve.
        </Text>
      </View>
      {pillButton({ label: 'Planejar amanhã', icon: 'moon-outline', tone: 'white', onPress: () => router.push('/planejar-amanha') }, colors)}
    </View>
  )
}

/** Rodapé com todos os caminhos: as áreas com seus subitens e a conta. */
export function SiteFooter()
{
  const { colors } = useTheme()
  const router = useRouter()
  const tree = useSidebarTree()
  const columns: { title: string; href: string; links: { label: string; onPress: () => void }[] }[] = [
    { title: 'Tarefas', href: '/(tabs)/kanban', links: (tree.kanban ?? []).map((c) => ({ label: c.label, onPress: () => { applySidebarChild(c); router.push('/(tabs)/kanban') } })) },
    { title: 'Saúde', href: '/(tabs)/saude', links: (tree.saude ?? []).map((c) => ({ label: c.label, onPress: () => { applySidebarChild(c); router.push('/(tabs)/saude') } })) },
    { title: 'Finanças', href: '/(tabs)/financeiro', links: (tree.financeiro ?? []).map((c) => ({ label: c.label, onPress: () => { applySidebarChild(c); router.push('/(tabs)/financeiro') } })) },
    {
      title: 'Conta',
      href: '/perfil',
      links: [
        ['Perfil', '/perfil'],
        ['Configurações', '/configuracoes'],
        ['Preferências', '/preferencias'],
        ['Relatórios', '/relatorios'],
        ['Anotações', '/anotacoes'],
        ['Modo foco', '/foco'],
      ].map(([label, href]) => ({ label, onPress: () => router.push(href as never) })),
    },
  ].filter((c) => c.links.length > 0)

  return (
    <View
      style={webStyle({
        marginTop: 48,
        paddingTop: 32,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        display: 'grid',
        gridTemplateColumns: `minmax(0, 1.4fr) repeat(${columns.length}, minmax(0, 1fr))`,
        gap: 32,
      })}
    >
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <BrandMark size={28} />
          <SunFyWordmark color={colors.ink} style={{ fontFamily: 'Fraunces_500Medium', fontSize: 20, lineHeight: 26 }} />
        </View>
        <Text variant="caption" muted style={{ maxWidth: 260 }}>
          Tarefas, saúde e dinheiro num lugar só, no seu ritmo.
        </Text>
      </View>
      {columns.map((col) => (
        <View key={col.title} style={{ gap: 10 }}>
          <Text variant="bodyStrong" style={{ fontSize: 14 }}>{col.title}</Text>
          {col.links.map((l) => (
            <WebHoverable key={l.label} onPress={l.onPress} accessibilityLabel={`${col.title}: ${l.label}`} style={webStyle({ cursor: 'pointer' })}>
              {(hovered: boolean) => (
                <Text variant="caption" style={{ color: hovered ? colors.axel : colors.inkMuted }}>{l.label}</Text>
              )}
            </WebHoverable>
          ))}
        </View>
      ))}
    </View>
  )
}
