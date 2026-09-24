import { ScrollViewStyleReset } from 'expo-router/html'
import { type PropsWithChildren } from 'react'

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
  html, body { background-color: #1E1C1A; }
  input:focus, textarea:focus {
    outline: 2px solid rgba(232, 115, 74, 0.55);
    outline-offset: 1px;
  }
  ::selection {
    background-color: rgba(232, 115, 74, 0.35);
    color: #F5F1EC;
  }
`
