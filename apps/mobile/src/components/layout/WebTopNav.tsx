import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useModules } from '../../hooks/useModules'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { BrandMark, SunFyWordmark } from '../BrandMark'
import { useTheme } from '../../theme/ThemeProvider'
import { webBandColor } from '../../theme/webPalette'
import { useCaptureStore, captureForTab, captureFabLabel } from '../../store/captureStore'
import { useAuthStore } from '../../store/authStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useSectionNavStore, type SectionArea } from '../../store/sectionNavStore'
import { resolveAxelName } from '../../lib/axelName'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { DESKTOP_PAD_H } from '../dashboard/TabShell'
import { useSidebarTree, applySidebarChild, type SidebarChild } from './sidebarTree'

/** Altura da faixa do menu; a Home continua a faixa por baixo com a saudação. */
export const TOP_NAV_HEIGHT = 64

const NAV: { href: string; match: string; exact?: boolean; label: string; icon: keyof typeof Icon.glyphMap; area?: SectionArea }[] = [
  { href: '/(tabs)', match: '/(tabs)', exact: true, label: 'Início', icon: 'home-outline' },
  { href: '/(tabs)/kanban', match: 'kanban', label: 'Tarefas', icon: 'list-outline', area: 'kanban' },
  { href: '/(tabs)/saude', match: 'saude', label: 'Saúde', icon: 'heart-outline', area: 'saude' },
  { href: '/(tabs)/financeiro', match: 'financeiro', label: 'Finanças', icon: 'wallet-outline', area: 'financeiro' },
]

/**
 * Menu da web no computador: faixa petróleo no topo (no lugar da barra lateral),
 * com os submenus de cada área suspensos ao passar o mouse ou clicar na seta.
 */
export function WebTopNav()
{
  const { colors, mode } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const modules = useModules()
  const tree = useSidebarTree()
  const sectionActive = useSectionNavStore((s) => s.active)
  const sectionTabs = useSectionNavStore((s) => s.tabs)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isGuest = useAuthStore((s) => s.isGuest)
  const prefs = usePrefsStore((s) => s.prefs)
  const name = resolveAxelName({ isGuest, callsYou: prefs.axel_calls_you, displayName: prefs.display_name, email })
  const [open, setOpen] = useState<string | null>(null)

  const cream = colors.onBrand
  const creamSoft = `${colors.onBrand}C7`
  const navVisible = (match: string) =>
    match === 'kanban' ? modules.group('tarefas')
      : match === 'saude' ? modules.group('saude')
        : match === 'financeiro' ? modules.group('carteira')
          : true
  const isActive = (item: (typeof NAV)[0]) =>
    item.exact
      ? pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index')
      : pathname.includes(item.match)

  // trocou de tela: fecha o suspenso
  useEffect(() => setOpen(null), [pathname])

  const capture = captureForTab(pathname)

  return (
    <View
      style={{
        height: TOP_NAV_HEIGHT,
        backgroundColor: webBandColor(mode),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        paddingHorizontal: DESKTOP_PAD_H,
        // o suspenso passa por cima do conteúdo da página
        zIndex: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <BrandMark size={28} />
        <SunFyWordmark color={cream} style={{ fontFamily: 'Fraunces_500Medium', fontSize: 20, lineHeight: 26, letterSpacing: -0.2 }} />
      </View>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
        {NAV.filter((item) => navVisible(item.match)).map((item) =>
        {
          const active = isActive(item)
          const children = item.area ? (tree[item.area] ?? []) : []
          return (
            <NavItem
              key={item.href}
              label={item.label}
              icon={active ? (item.icon.replace('-outline', '') as keyof typeof Icon.glyphMap) : item.icon}
              active={active}
              cream={cream}
              creamSoft={creamSoft}
              items={children}
              isOpen={open === item.href}
              onOpenChange={(v) => setOpen(v ? item.href : (o) => (o === item.href ? null : o))}
              isChildOn={(c) => active && c.isOn(sectionActive)}
              countOf={(c) => (c.countOf ? sectionTabs[c.countOf.area]?.find((t) => t.id === c.countOf?.id)?.count : undefined)}
              onPress={() => router.push(item.href as never)}
              onPick={(c) =>
              {
                applySidebarChild(c)
                setOpen(null)
                if (!active) router.push(item.href as never)
              }}
            />
          )
        })}
      </View>

      <WebHoverable
        onPress={() => openCapture(capture.kind, null, { studio: capture.studio })}
        accessibilityLabel={captureFabLabel(capture.kind)}
        style={(hovered) => webStyle({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 40,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: hovered ? colors.axelHover : colors.axelFill,
          cursor: 'pointer',
        })}
      >
        <Icon name="add" size={16} color={colors.axelOnFill} />
        <Text style={{ fontSize: 14, fontFamily: 'Lexend_600SemiBold', color: colors.axelOnFill }}>Capturar</Text>
      </WebHoverable>

      <WebHoverable
        onPress={() => router.push('/perfil')}
        accessibilityLabel="Abrir perfil"
        style={webStyle({ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: `${colors.onBrand}24`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Lexend_700Bold', color: cream, fontSize: 14 }}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ maxWidth: 140 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, lineHeight: 20, fontFamily: 'Lexend_600SemiBold', color: cream }}>
            {name}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 12, lineHeight: 16, fontFamily: 'Lexend_500Medium', color: creamSoft }}>
            {isAdmin ? 'Admin' : 'Perfil'}
          </Text>
        </View>
      </WebHoverable>
    </View>
  )
}

type NavItemProps = {
  label: string
  icon: keyof typeof Icon.glyphMap
  active: boolean
  cream: string
  creamSoft: string
  items: SidebarChild[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isChildOn: (c: SidebarChild) => boolean
  countOf: (c: SidebarChild) => number | undefined
  onPress: () => void
  onPick: (c: SidebarChild) => void
}

/** Item do topo em pílula; com subitens, abre um suspenso ao passar o mouse (ou na seta, pelo teclado). */
function NavItem({ label, icon, active, cream, creamSoft, items, isOpen, onOpenChange, isChildOn, countOf, onPress, onPick }: NavItemProps)
{
  const { colors } = useTheme()
  const wrap = useRef<View>(null)
  const hasMenu = items.length > 0
  // o callback muda a cada render; a ref evita religar os eventos (e perder o atraso do fechar)
  const openChange = useRef(onOpenChange)
  openChange.current = onOpenChange

  // passar o mouse abre; sair (do item e do suspenso, que é filho dele) fecha com uma folga curta
  useEffect(() =>
  {
    const el = wrap.current as unknown as HTMLElement | null
    if (!el || !hasMenu || typeof el.addEventListener !== 'function') return
    let timer: ReturnType<typeof setTimeout> | undefined
    const enter = () =>
    {
      if (timer) clearTimeout(timer)
      openChange.current(true)
    }
    const leave = () =>
    {
      timer = setTimeout(() => openChange.current(false), 120)
    }
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () =>
    {
      if (timer) clearTimeout(timer)
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [hasMenu])

  return (
    <View ref={wrap} style={{ position: 'relative' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 999,
          backgroundColor: active ? `${colors.onBrand}1F` : isOpen ? `${colors.onBrand}12` : 'transparent',
        }}
      >
        <WebHoverable
          onPress={onPress}
          accessibilityLabel={label}
          style={(hovered) => webStyle({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 38,
            paddingLeft: 14,
            paddingRight: hasMenu ? 4 : 14,
            borderRadius: 999,
            backgroundColor: hovered && !active && !hasMenu ? `${colors.onBrand}12` : 'transparent',
            cursor: 'pointer',
          })}
        >
          <Icon name={icon} size={17} color={active ? colors.axel : creamSoft} />
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, lineHeight: 20, fontFamily: active ? 'Lexend_600SemiBold' : 'Lexend_500Medium', color: active ? cream : creamSoft }}
          >
            {label}
          </Text>
        </WebHoverable>
        {hasMenu ? (
          <WebHoverable
            onPress={() => onOpenChange(!isOpen)}
            accessibilityLabel={isOpen ? `Fechar ${label}` : `Abrir ${label}`}
            style={webStyle({ height: 38, paddingLeft: 2, paddingRight: 12, justifyContent: 'center', cursor: 'pointer' })}
          >
            <Icon name="chevron-down" size={12} color={creamSoft} />
          </WebHoverable>
        ) : null}
      </View>

      {hasMenu && isOpen ? (
        // paddingTop: ponte invisível entre o item e o suspenso, para o mouse não "cair" no vão
        <View style={{ position: 'absolute', top: 38, left: 0, paddingTop: 8, zIndex: 30 }}>
          <View
            style={webStyle({
              minWidth: 220,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.hairline,
              boxShadow: '0 12px 32px rgba(21, 32, 34, 0.16)',
            })}
          >
            {items.map((c) =>
            {
              const on = isChildOn(c)
              const count = countOf(c)
              return (
                <WebHoverable
                  key={c.key}
                  onPress={() => onPick(c)}
                  accessibilityLabel={c.label}
                  style={(hovered) => webStyle({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 38,
                    paddingHorizontal: 14,
                    backgroundColor: on ? colors.axelMuted : hovered ? colors.surface : 'transparent',
                    cursor: 'pointer',
                  })}
                >
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 14, lineHeight: 20, fontFamily: on ? 'Lexend_600SemiBold' : 'Lexend_400Regular', color: on ? colors.axel : colors.ink }}
                  >
                    {c.label}
                  </Text>
                  {count ? <Text variant="caption" muted>{count}</Text> : null}
                </WebHoverable>
              )
            })}
          </View>
        </View>
      ) : null}
    </View>
  )
}
