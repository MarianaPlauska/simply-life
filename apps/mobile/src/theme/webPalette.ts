import type { ColorTokens, ThemeMode } from '@simply-life/ui-tokens'

/**
 * Web no computador: mesma paleta do celular (colors.ts). Só a barra lateral muda:
 * no computador ela é da família do fundo, não a barra de abas petróleo do celular.
 */
export function withWebPalette(base: ColorTokens, mode: ThemeMode): ColorTokens
{
  return {
    ...base,
    navBg: base.canvas,
    navBorder: base.hairline,
    navInk: mode === 'dark' ? base.inkMuted : base.navInk,
  }
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
