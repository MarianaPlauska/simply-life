import { useState } from 'react'
import { View, Platform } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useModules } from '../../hooks/useModules'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { BrandMark, SunFyWordmark } from '../BrandMark'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore, captureForTab, captureFabLabel } from '../../store/captureStore'
import { useAuthStore } from '../../store/authStore'
import { usePrefsStore } from '../../store/prefsStore'
import { resolveAxelName } from '../../lib/axelName'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { DESKTOP_SIDEBAR_WIDTH, DESKTOP_SIDEBAR_COLLAPSED } from './DesktopSidebar'
import { useSectionNavStore, type SectionArea } from '../../store/sectionNavStore'
import { useSidebarTree, applySidebarChild } from './sidebarTree'

const NAV: { href: string; match: string; exact?: boolean; label: string; icon: keyof typeof Icon.glyphMap; area?: SectionArea }[] = [
  { href: '/(tabs)', match: '/(tabs)', exact: true, label: 'Início', icon: 'home-outline' },
  { href: '/(tabs)/kanban', match: 'kanban', label: 'Tarefas', icon: 'list-outline', area: 'kanban' },
  { href: '/(tabs)/saude', match: 'saude', label: 'Saúde', icon: 'heart-outline', area: 'saude' },
  { href: '/(tabs)/financeiro', match: 'financeiro', label: 'Finanças', icon: 'wallet-outline', area: 'financeiro' },
]

/**
 * Sidebar da build web — deliberadamente não segue o padrão "pílula ativa
 * com entalhe" comum em dashboards gerados: navegação tipográfica, sem
 * ícone-em-círculo, sem avatar redondo.
 */
export function WebSidebar()
{
  const { space, colors } = useTheme()
  const { isTablet, isDesktop } = useWorkspace()
  const router = useRouter()
  const modules = useModules()
  const navVisible = (match: string) =>
    match === 'kanban' ? modules.group('tarefas')
      : match === 'saude' ? modules.group('saude')
        : match === 'financeiro' ? modules.group('carteira')
          : true
  const pathname = usePathname()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isGuest = useAuthStore((s) => s.isGuest)
  const prefs = usePrefsStore((s) => s.prefs)
  const name = resolveAxelName({
    isGuest,
    callsYou: prefs.axel_calls_you,
    displayName: prefs.display_name,
    email,
  })
  const sectionTabs = useSectionNavStore((s) => s.tabs)
  const sectionActive = useSectionNavStore((s) => s.active)
  const tree = useSidebarTree()
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({})
  const prefsCollapsed = Boolean(usePrefsStore((s) => s.prefs.sidebar_collapsed))
  const patchPrefs = usePrefsStore((s) => s.patch)
  const [tabletExpanded, setTabletExpanded] = useState(false)
  const collapsed = isTablet && !isDesktop ? !tabletExpanded : prefsCollapsed
  const width = collapsed ? DESKTOP_SIDEBAR_COLLAPSED : DESKTOP_SIDEBAR_WIDTH

  // Escuro: barra petróleo. Claro: barra branca com contorno. Coral só marca o item ativo (borda e ícone)
  const CREAM = colors.heroInk
  const inkOnBrand = `${colors.heroInk}D1`
  const inkMutedOnBrand = colors.navInk
  const divider = `${colors.navInk}29`

  const isActive = (item: (typeof NAV)[0]) =>
  {
    if (item.exact)
    {
      return pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index')
    }
    return pathname.includes(item.match)
  }

  const toggleCollapsed = () =>
  {
    if (isTablet && !isDesktop)
    {
      setTabletExpanded((v) => !v)
      return
    }
    void patchPrefs({ sidebar_collapsed: !prefsCollapsed })
  }

  return (
    <View
      style={{
        width,
        alignSelf: 'stretch',
        backgroundColor: colors.navBg,
        borderRightWidth: 1,
        borderRightColor: colors.navBorder,
        paddingTop: space.lg,
        paddingBottom: space.lg,
        justifyContent: 'space-between',
        ...(Platform.OS === 'web'
          ? ({ transitionProperty: 'width', transitionDuration: '200ms' } as object)
          : null),
      }}
    >
      <View style={{ gap: 28 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 20,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <BrandMark size={28} />
            {!collapsed ? (
              <SunFyWordmark
                color={CREAM}
                style={{ fontFamily: 'Fraunces_500Medium', fontSize: 20, lineHeight: 26, letterSpacing: -0.2 }}
              />
            ) : null}
          </View>
          {!collapsed ? (
            <WebHoverable
              onPress={toggleCollapsed}
              accessibilityLabel="Recolher menu"
              style={webStyle({ padding: 6, cursor: 'pointer' })}
            >
              <Icon name="chevron-back" size={18} color={inkMutedOnBrand} />
            </WebHoverable>
          ) : null}
        </View>

        {/* recolhida: sem este botão não havia como abrir o menu de novo */}
        {collapsed ? (
          <WebHoverable
            onPress={toggleCollapsed}
            accessibilityLabel="Abrir menu"
            style={webStyle({ alignSelf: 'center', padding: 6, marginTop: -16, cursor: 'pointer' })}
          >
            <Icon name="chevron-forward" size={18} color={inkMutedOnBrand} />
          </WebHoverable>
        ) : null}

        <View style={{ gap: 2, alignItems: 'stretch' }}>
          {NAV.filter((item) => navVisible(item.match)).map((item) =>
          {
            const active = isActive(item)
            // subitens fixos de cada área (Finanças > Cartões etc.); o pai da página aberta vem aberto
            const children = item.area && !collapsed ? (tree[item.area] ?? []) : []
            const expanded = children.length > 0 && (openAreas[item.href] ?? active)
            return (
              <View key={item.href}>
                <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                  <WebHoverable
                    onPress={() =>
                    {
                      router.push(item.href as never)
                      // sanfona: abrir uma área fecha as outras (a seta ainda abre várias, se quiser)
                      setOpenAreas(children.length ? { [item.href]: true } : {})
                    }}
                    accessibilityLabel={item.label}
                    style={(hovered) => webStyle({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 14,
                      minHeight: 48,
                      paddingHorizontal: collapsed ? 0 : 20,
                      borderLeftWidth: 3,
                      borderLeftColor: active ? colors.axelFill : 'transparent',
                      backgroundColor: active
                        ? `${colors.navInk}1F`
                        : hovered ? `${colors.navInk}0F` : 'transparent',
                      cursor: 'pointer',
                    })}
                  >
                    <Icon
                      name={active ? (item.icon.replace('-outline', '') as keyof typeof Icon.glyphMap) : item.icon}
                      size={20}
                      color={active ? colors.axel : inkOnBrand}
                    />
                    {!collapsed ? (
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 16,
                          lineHeight: 24,
                          fontFamily: active ? 'Lexend_600SemiBold' : 'Lexend_500Medium',
                          color: active ? CREAM : inkOnBrand,
                        }}
                      >
                        {item.label}
                      </Text>
                    ) : null}
                  </WebHoverable>
                  {children.length ? (
                    <WebHoverable
                      onPress={() => setOpenAreas((o) => ({ ...o, [item.href]: !expanded }))}
                      accessibilityLabel={expanded ? `Fechar ${item.label}` : `Abrir ${item.label}`}
                      style={(hovered) => webStyle({
                        width: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active
                          ? `${colors.navInk}1F`
                          : hovered ? `${colors.navInk}0F` : 'transparent',
                        cursor: 'pointer',
                      })}
                    >
                      <Icon name={expanded ? 'chevron-down' : 'chevron-forward'} size={14} color={inkMutedOnBrand} />
                    </WebHoverable>
                  ) : null}
                </View>
                {expanded ? (
                  <View style={{ paddingTop: 2, paddingBottom: 8 }}>
                    {children.map((child) =>
                    {
                      const on = active && child.isOn(sectionActive)
                      const count = child.countOf
                        ? sectionTabs[child.countOf.area]?.find((t) => t.id === child.countOf?.id)?.count
                        : undefined
                      return (
                        <WebHoverable
                          key={child.key}
                          onPress={() =>
                          {
                            applySidebarChild(child)
                            if (!active) router.push(item.href as never)
                          }}
                          accessibilityLabel={child.label}
                          style={(hovered) => webStyle({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            minHeight: 36,
                            // alinha com o texto do item pai (borda 3 + recuo 20 + ícone 20 + espaço 14)
                            paddingLeft: 57,
                            paddingRight: 20,
                            backgroundColor: hovered && !on ? `${colors.navInk}0F` : 'transparent',
                            cursor: 'pointer',
                          })}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              fontSize: 14,
                              lineHeight: 20,
                              fontFamily: on ? 'Lexend_600SemiBold' : 'Lexend_400Regular',
                              color: on ? colors.axel : inkMutedOnBrand,
                            }}
                          >
                            {child.label}
                          </Text>
                          {count ? (
                            <Text style={{ fontSize: 13, lineHeight: 20, fontFamily: 'Lexend_500Medium', color: inkMutedOnBrand }}>
                              {count}
                            </Text>
                          ) : null}
                        </WebHoverable>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>

        <View style={{ paddingHorizontal: collapsed ? 10 : 20 }}>
          <WebHoverable
            onPress={() =>
            {
              const spec = captureForTab(pathname)
              openCapture(spec.kind, null, { studio: spec.studio })
            }}
            accessibilityLabel={captureFabLabel(captureForTab(pathname).kind)}
            style={webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 44,
              borderRadius: 10,
              backgroundColor: colors.axelFill,
              cursor: 'pointer',
            })}
          >
            <Icon name="add" size={18} color={colors.axelOnFill} />
            {!collapsed ? (
              <Text style={{ fontSize: 15, fontFamily: 'Lexend_600SemiBold', color: colors.axelOnFill }}>
                Capturar
              </Text>
            ) : null}
          </WebHoverable>
        </View>
      </View>

      <WebHoverable
        onPress={() => router.push('/perfil')}
        accessibilityLabel="Abrir perfil"
        style={webStyle({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: collapsed ? 0 : 20,
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingTop: space.md,
          marginTop: space.md,
          borderTopWidth: 1,
          borderTopColor: divider,
          cursor: 'pointer',
        })}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: `${colors.navInk}29`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Lexend_700Bold', color: CREAM, fontSize: 14 }}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        {!collapsed ? (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: 'Lexend_600SemiBold', color: CREAM }}>
              {name}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Lexend_500Medium', color: inkMutedOnBrand }}>
              {isAdmin ? 'Admin' : 'Perfil'}
            </Text>
          </View>
        ) : null}
      </WebHoverable>
    </View>
  )
}
