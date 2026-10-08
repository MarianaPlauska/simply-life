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
  input, textarea { outline: none; }
  /* o campo já marca o foco com a própria borda (petróleo no claro, menta no escuro) */
  input:focus, textarea:focus { outline: none; }
  /* preenchimento automático do navegador: sem o fundo amarelo dele */
  input:-webkit-autofill, textarea:-webkit-autofill {
    -webkit-text-fill-color: inherit;
    transition: background-color 9999s ease-out 0s;
  }
  ::selection {
    background-color: rgba(232, 115, 74, 0.30);
  }
  /* Panel: bloco que não tem nada a mostrar não deixa faixa vazia */
  [data-panel-item]:empty { display: none; }
  /* Panel inteiro sem nenhum bloco com conteúdo (ex.: aviso que não se aplica hoje) some da grade */
  [data-panel]:not(:has([data-panel-item]:not(:empty))) { display: none; }
`
