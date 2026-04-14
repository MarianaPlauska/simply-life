# Design System — Simply-Life OS

## Filosofia Visual: SaaS OS (Dark UI)

O frontend **não é um dashboard estático**. É um sistema operacional pessoal que usa **Scrolltelling** (fluxo vertical contínuo) com animações baseadas no viewport.

---

## UI01 — Composição Material (Glassmorphism)

Nenhum card usa cor sólida opaca. Todos os containers principais usam:

```
bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl
```

- Fundo semi-transparente (`bg-zinc-900/30` ou `bg-zinc-900/40`)
- Desfoque intenso (`backdrop-blur-xl` ou `backdrop-blur-2xl`)
- Borda capilar (`border border-white/5`)
- Hover reactivo: `hover:border-white/10 hover:bg-zinc-800/40`
- Transição fluida: `transition-all duration-500`

## UI02 — Arredondamento Acentuado

Para evitar aspecto de "planilha", cantos usam raio amplo:

```
rounded-[2rem]  ou  rounded-3xl
```

Nunca use `rounded-lg` ou `rounded-md` em containers principais.

## UI03 — Tipografia Brutalista

- Números primários: `text-4xl md:text-5xl font-black tracking-tighter tabular-nums`
- Textos secundários: `text-[11px] text-zinc-500` ou `text-[13px] text-zinc-400`
- Labels de card: `text-[13px] font-medium text-zinc-400`

## UI04 — Fundo Dinâmico (Ambient Background)

O body/main não tem fundo sólido. Usa-se `bg-zinc-950` com divs absolutas de gradientes radiais:

```tsx
<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
  <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[120px]" />
  <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[100px]" />
  <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px]" />
</div>
```

---

## UX01 — Revelação Progressiva (Scroll-triggered Fade-up)

Cada bloco de conteúdo é encapsulado em `<motion.div>`:

```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
  {/* conteúdo */}
</motion.div>
```

## UX02 — Interação Tátil (Hover States)

Cards reagem ao hover com:
- `hover:border-white/10`
- `hover:bg-zinc-800/40`
- `hover:scale-[1.01]` (opcional, sutil)
- `transition-all duration-500`

## UX03 — Arquitetura de Informação em Funil

O fluxo de rolagem segue a jornada de foco:

1. **Camada 1 (Contexto Imediato):** Saudação, tarefas bloqueantes, última notificação da IA
2. **Camada 2 (Fluxo Tático):** Kanban em lista horizontal / linha do tempo
3. **Camada 3 (Consulta Secundária):** Agenda do Google, gráficos financeiros, medicação

---

## Paleta de Cores

| Uso | Classe |
|-----|--------|
| Fundo principal | `bg-zinc-950` |
| Card base | `bg-zinc-900/30` |
| Card hover | `bg-zinc-800/40` |
| Borda card | `border-white/5` |
| Borda hover | `border-white/10` |
| Texto primário | `text-white` |
| Texto secundário | `text-zinc-400` |
| Texto terciário | `text-zinc-500` / `text-zinc-600` |
| Acento principal | `violet-500` / `violet-400` |
| Acento secundário | `indigo-500` / `cyan-400` |
| Sucesso | `emerald-400` / `emerald-500` |
| Erro | `red-400` / `red-500` |
| Alerta | `amber-400` |
| Blur | `backdrop-blur-2xl` |

---

## Componente GlassCard (padrão)

```tsx
function GlassCard({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-900/30 backdrop-blur-2xl border border-white/5 hover:border-white/10 hover:bg-zinc-800/40 transition-all duration-500 rounded-[2rem] p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}
```
