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
 * Faixa do menu no topo (web, computador): petróleo um degrau acima do fundo,
 * para a barra não sumir na mesma tinta da tela.
 */
export function webBandColor(mode: ThemeMode): string
{
  return mode === 'dark' ? '#2F565A' : '#33585B'
}
