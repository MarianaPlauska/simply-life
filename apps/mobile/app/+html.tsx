import { ScrollViewStyleReset } from 'expo-router/html'
import { type PropsWithChildren } from 'react'
import { COLOR_DARK, COLOR_LIGHT } from '@simply-life/ui-tokens'

/**
 * Casca HTML raiz — só existe na build web (convenção do Expo Router;
 * o app nativo nunca lê este arquivo). Aqui trocamos o contorno de foco e a
 * cor de seleção de texto padrão do navegador (azul) pela cor da marca —
 * sem isso, clicar em qualquer input mostra o azul feio do Chrome/Firefox
 * em cima de um app preto/laranja.
 */
export default function Root({ children }: PropsWithChildren)
{
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webInputStyles }} />
      </head>
      <body>{children}</body>
    </html>
  )
}

const webInputStyles = `
  html, body { background-color: ${COLOR_LIGHT.canvas}; }
  @media (prefers-color-scheme: dark) { html, body { background-color: ${COLOR_DARK.canvas}; } }
  input:focus, textarea:focus {
    outline: 2px solid ${COLOR_LIGHT.axelFill};
    outline-offset: 1px;
  }
  ::selection {
    background-color: rgba(232, 115, 74, 0.30);
  }
`
