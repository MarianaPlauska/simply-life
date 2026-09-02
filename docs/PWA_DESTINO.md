# Destino do PWA legado (`frontend/`)

## Decisão (Fase 3)

**Opção A (recomendada):** o produto principal passa a ser o app **Expo** (`apps/mobile`).  
O PWA Vite em `frontend/` fica em **manutenção mínima**:

- Correções críticas de segurança/bugs
- Sem features novas de UI
- Futuro: landing + deep link `simplylife://` / “abra no app”

**Opção B (alternativa):** manter PWA com os mesmos tokens (`@simply-life/ui-tokens`) espelhados em CSS por 1–2 trimestres, se ainda houver usuários web intensivos.

## Breakpoints desktop no mobile

- Tablet ≥ 768: layout de 2 colunas onde fizer sentido
- Desktop ≥ 1024: workspace main + rail (paridade com imagem multi-painel)

Implementação inicial: shell mobile-first; tablet/desktop via `BREAKPOINT` em `ui-tokens`.

## Migração de código

| Reaproveitar | Reescrever |
|--------------|------------|
| `api/`, Supabase, regras em `packages/shared` | Componentes React DOM / Tailwind |
| Auth Supabase | Layout AppLayout / Sidebar |
| Push handlers | Telas Health/Finance/Kanban web |
