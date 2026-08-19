# PWA — Simply-Life

Tema e splash: `#1D2029` (HTML, VitePWA e `manifest.webmanifest`).

Atalho **Rotina Guiada** abre `/kanban?foco=1` (o overlay de foco absoluto da demanda mais urgente em HOJE). `/foco` redireciona para o mesmo caminho.

Ícone maskable: `pwa-maskable-512.png` (raio no centro com margem segura para recorte circular).

## iOS

- Instalar: Safari → Compartilhar → Adicionar à Tela de Início (não há `beforeinstallprompt`).
- Push: iOS **16.4+**, e só depois do app estar na tela inicial. Na aba do Safari a permissão não aparece.
- Android/Chrome: banner nativo + Configurações → Sistema → Enviar notificação de teste.

## Checklist de aceite (5 testes)

Faça em **produção HTTPS** (`https://simply-life.vercel.app`). O service worker não roda em `localhost` sem o plugin em modo PWA.

| # | Teste | Como | Resultado esperado |
|---|--------|------|--------------------|
| 1 | Lighthouse PWA | Chrome DevTools → Lighthouse → Progressive Web App | Installable, theme color, ícones |
| 2 | Android standalone | Chrome → Adicionar à tela inicial → abrir o ícone | `display-mode: standalone` (sem barra de URL) |
| 3 | iOS A2HS | Safari → Adicionar à Tela de Início | Ícone na Springboard; tela cheia |
| 4 | Offline shell | Abrir o app, DevTools → Offline, reload | Shell do app (Workbox), não a página de erro do Chrome |
| 5 | Push E2E | Permitir alertas → Configurações → Sistema → Enviar notificação de teste | Banner no dispositivo; toque abre `/kanban?foco=1` |

Itens 2, 3 e 5 precisam do telefone (ou emulador Android). Item 1 e 4 dão para rodar no desktop após o deploy.

VAPID: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` na Vercel (Production). Sem isso o teste 5 responde 503.
