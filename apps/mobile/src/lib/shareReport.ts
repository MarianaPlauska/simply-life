import { Platform, Share } from 'react-native'

/** Texto do relatório: compartilhar no celular; no navegador, compartilhar ou copiar. */
export async function shareReportText(text: string, title: string): Promise<string>
{
  if (Platform.OS === 'web' && typeof navigator !== 'undefined')
  {
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> }
    if (nav.share)
    {
      try
      {
        await nav.share({ title, text })
        return 'Pronto para enviar.'
      }
      catch
      {
        /* cancelado: cai na cópia */
      }
    }
    if (nav.clipboard?.writeText)
    {
      await nav.clipboard.writeText(text)
      return 'Copiado. É só colar no e-mail ou na conversa.'
    }
  }
  await Share.share({ message: text, title })
  return 'Pronto para enviar.'
}

/** HTML do relatório como PDF: impressão no navegador; expo-print no celular. */
export async function shareReportPdf(html: string): Promise<string>
{
  if (Platform.OS === 'web' && typeof window !== 'undefined')
  {
    const w = window.open('', '_blank')
    if (w)
    {
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
      return 'Na janela de impressão, escolha salvar como PDF.'
    }
    return 'O navegador bloqueou a janela. Libere pop-ups para este site.'
  }
  try
  {
    const Print = await import('expo-print')
    const Sharing = await import('expo-sharing')
    const printed = await Print.printToFileAsync({ html })
    if (printed.uri && (await Sharing.isAvailableAsync()))
    {
      await Sharing.shareAsync(printed.uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' })
      return 'PDF pronto para enviar.'
    }
  }
  catch
  {
    /* sem expo-print neste build */
  }
  return 'Não deu para gerar o PDF aqui. Use o texto.'
}
