# Performance e acessibilidade

Code splitting por rota já existia (`React.lazy` em `App.tsx`). Medição após a frente 9 (`vite build`, ago/2026):

| Chunk | gzip |
|-------|------|
| Entry `index-*.js` | ~69 kB |
| `KanbanView` | ~32 kB |
| `HealthView` | ~28 kB |
| `DashboardView` | ~14 kB |
| `FinancePlannerView` | ~57 kB |
| `vendor-react` | ~90 kB |
| `vendor-charts` | ~115 kB (só quem usa Recharts) |

## Ajustes desta frente

- Contraste de `--sl-text-muted` (claro `#52525B`, escuro `#C4C8D0`).
- Skip link “Ir para o conteúdo” + `main#conteudo-principal`.
- `og:locale` e canonical.

## Lighthouse (produção)

Rodar no Chrome DevTools → Lighthouse (mobile + desktop) em `https://simply-life.vercel.app` após o deploy:

1. Performance / Accessibility / Best Practices / SEO
2. Anotar scores antes (baseline deste commit) e depois do deploy

O audit de PWA fica na frente 8.
