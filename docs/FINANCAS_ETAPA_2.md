# Finanças — Etapa 2 (previsão) e o que ficou da Etapa 1

## Status (implementado)
- **Salário com hora extra:** `packages/shared/src/salaryForecast.ts`, `store/salaryStore.ts`, `lib/sync/salary.ts`,
  Contas → **Salário** (`FinanceSalaryPane`). O divisor sai do horário (8h–17h com 1h de almoço, 5 dias = 40h → **200**).
  Feriados nacionais + Sexta-feira Santa calculados; 5º dia útil conta sábado (CLT art. 459).
- **Confirmar salário:** card na Carteira e na Início no dia do pagamento; ao confirmar vira receita e o desconto real é aprendido.
- **Projeção do fim do mês:** `financeProjection.ts` + card "Fim do mês" na Carteira (com parcelas futuras).
- **Fixas viram lançamentos:** "Já paguei" na projeção e no Kanban (`settleFixa` / `settleBill`); o botão "Feito" da
  notificação de conta agora lança o gasto e marca o mês (`api/_lib/pushActionExecute.js`).
- **Orquestrador** usa o dia real do salário (`nextSalaryPayday`).
- **Pendências da Etapa 1 resolvidas:** ícone/cor de categoria, ícone/cor/urgência de fixa e "fatura/conta paga" sincronizam
  com o banco (`lib/sync/financeMeta.ts`).
- **Parcelas agrupadas:** coluna `despesas.grupo_parcela`; a folha de edição mostra "parcela N de M", aplica valor às próximas, apaga desta em diante ou a compra inteira. Parcelas antigas são reconhecidas pelo "N/M" + cartão + valor.
- **Fixa vencida sem marcação:** a projeção pergunta "já pagou?" (Já paguei / Ainda não). Gasto lançado à mão com o mesmo nome (ou mesmo valor perto do vencimento) conta como pago, sem perguntar.
- **Aba Coach** usa a mesma projeção do fim do mês.
- **Migrações 058–061 são defensivas:** criam as tabelas/colunas que faltarem no banco (ex.: `despesas.categoria_id` não existia em produção). Testadas duas vezes seguidas num Postgres 17 simulando o banco de produção.
- **Ordem:** 058 → 059 → 060 → 061.

### Ainda não feito
- Tabelas oficiais de INSS/IRRF (hoje: líquido pela taxa informada ou aprendida).
- Adiantamento/vale (duas parcelas do salário no mês) e freelancer sem divisor.
- Botão da notificação ainda se chama "Feito" (categoria única de ações); dá para ter "Já paguei" só para contas.

## O que a Etapa 1 resolveu (integridade)

| Antes | Agora |
|---|---|
| Cartões só existiam na tela e sumiam ao reabrir | Salvos em `fin_cartoes` (criar, editar, bloquear, remover). Só os 4 últimos dígitos; **CVV e número completo nunca vão ao banco** (migração 060 apaga CVVs existentes). |
| Metas nunca salvas, "atual" sempre 0 | Salvas em `fin_metas`; botões **Guardar / Retirar / Apagar meta**. |
| Não dava para corrigir nem apagar lançamento | Tocar num lançamento (Extrato ou Carteira) abre **Editar / Apagar** (`FinanceTxEditSheet`). |
| Orçamento não contava gastos novos (só texto em `categoria`, orçamento somava por `categoria_id`) | Gasto novo já sai com `categoria_id` (slug em `fin_categorias`); gastos antigos contam pelo texto; limite editável no celular. |
| Importar o mesmo CSV duplicava tudo; categoria do extrato ignorada | `import_hash` único por usuário + comparação com o que já existe; categoria do extrato mapeada ("Alimentação", "IFOOD", "Uber"...). Compras iguais legítimas continuam separadas. |

**Aplicar no Supabase:** `supabase/migrations/060_financas_integridade.sql`.
Sem ela o app continua funcionando (tenta de novo sem as colunas novas), mas o orçamento e a deduplicação no banco só valem depois dela.

### Pendências de integridade que ficaram para depois
- Nome/ícone/cor de categoria, ícone/cor/urgência de conta fixa e "fatura paga" ainda são só locais
  (`lib/categoryMeta.ts`, `lib/fixaMeta.ts`, `duePaidStore`). Levar para `fin_categorias` (nome, cor, icone já existem) e `fin_contas_fixas`.
- "A pagar" (`fin_faturas_reservas`) engole erros e nada no app cria essas linhas.
- A notificação de conta a vencer só "anota para depois"; deveria ter **"Já paguei"** marcando a conta.

---

## Etapa 2 — Previsão

### 1. Salário com hora extra (pedido da usuária)

**Ideia:** o salário entra sozinho todo mês como *previsto*; a pessoa lança as horas extras
durante o mês, o app calcula o valor esperado, e **no dia do pagamento aparece "Seu salário caiu? Confirmar R$ X"**
(editável). Só depois de confirmado vira receita de verdade no saldo.

#### Cadastro (uma vez)
| Campo | Exemplo | Observação |
|---|---|---|
| Salário base (bruto, sem horas extras) | R$ 3.500 | |
| Jornada / divisor | 44h/semana → **220** | 40h → 200 · 36h → 180 · 30h → 150 |
| Adicional de HE em dia útil | 50% | mínimo da CLT; convenções podem ter 60%, 70%... |
| Adicional de HE em domingo/feriado | 100% | |
| Adicional noturno (opcional) | 20% | |
| Considerar DSR sobre HE | sim | reflexo no descanso semanal remunerado |
| Fechamento do ponto | dia 20 | HE de 21/set a 20/out entram no salário de out/nov |
| Dia do pagamento | 5º dia útil ou dia fixo | CLT: até o 5º dia útil |
| Descontos | "meu líquido sem HE costuma ser R$ 2.980" | ver "Líquido" abaixo |

#### Lançar horas (durante o mês)
Entrada rápida: data, horas (ex.: 2h30) e tipo (útil 50% / domingo-feriado 100%).
Dá para aceitar texto solto como nas tarefas: *"fiz 3h extra ontem"* → leitor local já entende "3h" e "ontem".

#### Cálculo
```
valor_hora      = salario_base / divisor                       (3500 / 220 = 15,91)
HE_50           = valor_hora × 1,5 × horas_50                  (10h → 238,64)
HE_100          = valor_hora × 2,0 × horas_100                 (4h  → 127,27)
total_HE        = HE_50 + HE_100 (+ noturno)
DSR_sobre_HE    = total_HE / dias_uteis_do_periodo × (domingos + feriados do período)
bruto_previsto  = salario_base + total_HE + DSR_sobre_HE
```
**Líquido:** INSS (progressivo) e IRRF mudam de tabela todo ano. Duas opções:
1. *Simples (recomendado para começar):* a pessoa informa o líquido de um mês sem HE; o app tira a
   taxa efetiva de desconto (`1 − líquido/bruto`) e aplica sobre o bruto previsto, avisando que é estimativa.
2. *Completo (depois):* tabelas INSS/IRRF por ano em `packages/shared` (arquivo versionado, fácil de atualizar).

Na confirmação, a diferença previsto × real vira aprendizado (igual ao tempo das tarefas):
"seu líquido costuma vir 3% abaixo do previsto".

#### Banco (migração 061)
```sql
-- base do salário (reaproveita fin_receitas_recorrentes)
ALTER TABLE fin_receitas_recorrentes
  ADD COLUMN IF NOT EXISTS variavel      BOOLEAN DEFAULT false,  -- tem hora extra
  ADD COLUMN IF NOT EXISTS divisor_horas INTEGER DEFAULT 220,
  ADD COLUMN IF NOT EXISTS he_util_pct   NUMERIC(5,2) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS he_folga_pct  NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS noturno_pct   NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS dsr_sobre_he  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS dia_fechamento INTEGER,               -- ponto
  ADD COLUMN IF NOT EXISTS quinto_dia_util BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS taxa_desconto NUMERIC(5,4);           -- líquido/bruto aprendido

CREATE TABLE fin_horas_extras (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id INTEGER NOT NULL REFERENCES fin_receitas_recorrentes(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  minutos INTEGER NOT NULL CHECK (minutos > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('util', 'folga', 'noturno')),
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- uma linha por mês: previsto → confirmado (vira despesa tipo 'receita')
CREATE TABLE fin_receitas_confirmacoes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id INTEGER NOT NULL REFERENCES fin_receitas_recorrentes(id) ON DELETE CASCADE,
  competencia CHAR(7) NOT NULL,            -- '2026-10'
  valor_previsto NUMERIC(12,2) NOT NULL,
  valor_real NUMERIC(12,2),
  despesa_id INTEGER REFERENCES despesas(id),
  confirmado_em TIMESTAMPTZ,
  UNIQUE (user_id, receita_id, competencia)
);
-- + RLS "own" nas duas tabelas
```

#### Onde entra no app
- `packages/shared/src/salaryForecast.ts` (novo): cálculo puro + testes (divisor, DSR, feriados).
- Contas → nova aba **"Salário"**: base, horas do período, previsão ao vivo ("com 12h extras: ~R$ 3.910").
- Carteira e Início: no dia do pagamento, card **"Confirmar salário"** (valor editável). Confirmar cria a receita
  (`addDespesa` tipo `receita`) e fecha a competência. Enquanto não confirma, o saldo mostra "previsto" à parte.
- Orquestrador: `estimateNextIncomeIso` passa a usar a data real configurada (hoje é um palpite pelo histórico).
- Ritual da noite: "amanhã cai o salário: quer confirmar o valor quando chegar?".

#### Casos de borda
- Feriados: tabela nacional + opção de marcar feriado local.
- Mês sem HE: previsão = base; confirmação continua (salário pode vir diferente por falta, bônus, adiantamento).
- Adiantamento/vale (ex.: 40% no dia 20): a receita recorrente aceita duas parcelas.
- Freelancer/autônomo: `variavel = true` sem divisor → só "valor previsto" editável + confirmação.

### 2. Projeção do fim do mês
`financeRules.cashflowForecast` hoje é `saldo − média diária × 14`. Trocar por:
```
saldo_hoje
− fixas que ainda vencem no mês (fin_contas_fixas, dia_vencimento > hoje e não pagas)
− faturas de cartão que vencem no mês
− parcelas do mês
+ receitas previstas (salário previsto/confirmado, recorrentes)
− gasto variável médio por dia × dias restantes (mediana dos últimos 60 dias, sem fixas)
= "vai sobrar ~R$ X no dia 30"
```
Mostrar como **um número** na Carteira, com a explicação ao tocar. Tom calmo: "Faltam R$ 200 para fechar; três ideias pequenas".

### 3. Parcelas de verdade
Hoje `parseParcela` só lê "3/12" no fim do título. Na compra no cartão com N parcelas, criar as N linhas
(uma por fatura, `import_hash` por parcela) e mostrar "comprometido nos próximos meses".
`CaptureSheet` já divide o valor em N (`splitCents`) — falta gravar datas por fatura e agrupar (`grupo_parcela_id`).

### 4. Fixas viram lançamentos
No vencimento, "Pagar luz R$ 180?" com um toque (cria a despesa ligada à fixa, marca paga no mês).
Reaproveitar a notificação diária de contas (`api/_lib/handlers/cron/push-bills.js`) com a ação **"Já paguei"**.

### Ordem sugerida
1. `salaryForecast.ts` + migração 061 + aba Salário + card Confirmar salário
2. Projeção do fim do mês (usa o salário previsto)
3. Fixas → lançamentos + "Já paguei" na notificação
4. Parcelas
