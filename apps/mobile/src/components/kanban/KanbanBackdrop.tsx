import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg'
import { parseBackdrop, type KanbanBackdrop as Backdrop } from '@simply-life/shared'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'

/** Tons translúcidos: funcionam no claro e no escuro sem brigar com o texto. */
const TONES: Record<Extract<Backdrop, { tipo: 'cor' }>['tom'], string> = {
  areia: 'rgba(215, 183, 147, 0.16)',
  salvia: 'rgba(108, 199, 155, 0.13)',
  lavanda: 'rgba(160, 140, 210, 0.14)',
  ceu: 'rgba(141, 178, 214, 0.16)',
  pessego: 'rgba(232, 155, 120, 0.14)',
}

function PatternLayer({ desenho, ink }: { desenho: Extract<Backdrop, { tipo: 'padrao' }>['desenho']; ink: string })
{
  const id = `kb-${desenho}`
  const tile = desenho === 'grade' ? 28 : desenho === 'ondas' ? 48 : desenho === 'folhas' ? 56 : desenho === 'estrelas' ? 64 : 20
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={tile} height={tile}>
          {desenho === 'pontos' ? <Circle cx={10} cy={10} r={1.6} fill={ink} /> : null}
          {desenho === 'grade' ? <Path d={`M ${tile} 0 L 0 0 0 ${tile}`} stroke={ink} strokeWidth={1} fill="none" /> : null}
          {desenho === 'ondas' ? (
            <Path d="M 0 24 Q 12 14 24 24 T 48 24" stroke={ink} strokeWidth={1.2} fill="none" />
          ) : null}
          {desenho === 'folhas' ? (
            <Path d="M 14 40 Q 14 18 34 12 Q 34 34 14 40 Z M 14 40 L 30 18" stroke={ink} strokeWidth={1.1} fill="none" />
          ) : null}
          {desenho === 'estrelas' ? (
            <>
              <Path d="M 16 10 L 18 15 L 23 16 L 18 18 L 16 23 L 14 18 L 9 16 L 14 15 Z" fill={ink} />
              <Circle cx={46} cy={44} r={1.4} fill={ink} />
              <Circle cx={40} cy={14} r={1} fill={ink} />
            </>
          ) : null}
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  )
}

/** Fundo do quadro de tarefas escolhido nos desbloqueios. */
export function KanbanBackdrop()
{
  const { mode } = useTheme()
  const value = usePrefsStore((s) => s.prefs.kanban_fundo)
  const b = parseBackdrop(value)
  if (b.tipo === 'nenhum') return null
  if (b.tipo === 'cor')
  {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: TONES[b.tom] }]} />
  }
  // traço bem leve: textura, não estampa
  const ink = mode === 'dark' ? 'rgba(238, 242, 240, 0.07)' : 'rgba(30, 28, 26, 0.07)'
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <PatternLayer desenho={b.desenho} ink={ink} />
    </View>
  )
}

/** Miniatura para a loja de desbloqueios. */
export function BackdropSwatch({ value, size = 56 }: { value: string; size?: number })
{
  const { colors, mode, radius } = useTheme()
  const b = parseBackdrop(value)
  const ink = mode === 'dark' ? 'rgba(238, 242, 240, 0.22)' : 'rgba(30, 28, 26, 0.2)'
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.control,
        overflow: 'hidden',
        backgroundColor: colors.canvas,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      {b.tipo === 'cor' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: TONES[b.tom].replace(/0\.1\d\)/, '0.5)') }]} /> : null}
      {b.tipo === 'padrao' ? <PatternLayer desenho={b.desenho} ink={ink} /> : null}
    </View>
  )
}
