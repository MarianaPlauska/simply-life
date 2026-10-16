import type { ColorTokens, ThemeMode } from '@simply-life/ui-tokens'

/**
 * Ajustes de cor só para a web no computador (tela larga com barra lateral).
 * O celular fica com a paleta de colors.ts sem mudança.
 *
 * Por quê: no monitor, a névoa petróleo e cartões quase da cor do fundo viram uma
 * massa escura sem hierarquia. Aqui o fundo é liso, cada camada é um degrau
 * visível (fundo, cartão, linha) e a barra lateral é da família do fundo,
 * não um bloco petróleo saturado.
 */
/**
 * Escuro da web: cinza escuro puxado para o petróleo da marca (#1F3A3D), não preto.
 * Cada camada acima clareia um degrau (fundo, barra, cartão), como no dark theme do
 * Material: profundidade por tom, não por sombra.
 */
const WEB_DARK: Partial<ColorTokens> = {
  // página e barra lateral no mesmo tom: uma superfície só, como um site integrado
  canvas: '#152022',
  chrome: '#172426',
  /** campos e hover: um degrau acima do cartão */
  surface: '#1E2C2E',
  /** cartão quase do tom da página: se mistura, sem parecer caixa */
  elevated: '#192628',
  ink: '#EEF2F0',
  /** 7,8:1 no elevated */
  inkMuted: '#B0C0BD',
  /** 5,1:1 no elevated */
  inkFaint: '#8A9B98',
  /** divisões dentro dos blocos (é a linha que dá estrutura ao texto) */
  hairline: '#263739',
  hairlineStrong: 'rgba(238, 242, 240, 0.18)',
  /** contorno dos cartões: só um indício de borda */
  cardRim: 'rgba(238, 242, 240, 0.045)',
  widget: '#192628',
  widgetInk: '#EEF2F0',
  widgetMuted: '#B0C0BD',
  featureBg: '#192628',
  featureInk: '#EEF2F0',
  featureMuted: '#B0C0BD',
  heroBg: '#192628',
  heroBgDeep: '#192628',
  heroInk: '#EEF2F0',
  heroMuted: '#B0C0BD',
  navBg: '#152022',
  navBorder: '#213133',
  navInk: '#B0C0BD',
}

const WEB_LIGHT: Partial<ColorTokens> = {
  canvas: '#F4F3F0',
  chrome: '#FFFFFF',
  /** campos e hover: um tom abaixo do cartão branco (igual ao cartão, o hover sumia) */
  surface: '#F7F6F3',
  elevated: '#FFFFFF',
  hairline: '#E3E6E3',
  cardRim: 'rgba(31, 58, 61, 0.05)',
  widget: '#FFFFFF',
  featureBg: '#FFFFFF',
  heroBg: '#FFFFFF',
  heroBgDeep: '#FFFFFF',
  navBg: '#F4F3F0',
  navBorder: '#E3E6E3',
}

export function withWebPalette(base: ColorTokens, mode: ThemeMode): ColorTokens
{
  return { ...base, ...(mode === 'dark' ? WEB_DARK : WEB_LIGHT) }
}

/**
 * Faixa do menu no topo (web, computador): petróleo da marca clareado um degrau,
 * para não pesar como um bloco escuro. No escuro fica o petróleo puro, que já
 * se destaca do fundo.
 */
export function webBandColor(mode: ThemeMode): string
{
  return mode === 'dark' ? '#1F3A3D' : '#33585B'
}
