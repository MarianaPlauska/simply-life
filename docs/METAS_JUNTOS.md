# Metas juntos, academia e comida

Plano de produto e engenharia. Atualizado em setembro de 2026.

## Por que

A ideia nasceu de duas pessoas que queriam se exercitar juntas, mas sem o clima de GymRats: sem foto como prova, sem ranking, sem ver o que o outro anotou. O público do Simply Life vive com ansiedade, depressão ou TDAH. Então a regra é apoiar sem vigiar e sem culpa.

## Princípios

1. **Cada um anota no próprio app.** O registro de água, treino, sono etc. que a pessoa já faz é o que conta para a meta. Ninguém precisa anotar duas vezes.
2. **Ninguém vê o registro do outro.** O grupo vê só o progresso juntos, nunca números individuais.
3. **Ninguém paga pela falha do outro.** Nada quebra para todos quando um some.
4. **Semana vale mais que dia.** Perder um dia não zera nada.
5. **Sair é livre.** Dá para silenciar, pausar ou sair de uma meta sem aviso constrangedor.
6. **Sem dinheiro em jogo, sem cobrar para recuperar.**

## Metas juntos

### O que é uma meta

Uma meta vale para qualquer coisa, pelo tempo que o grupo quiser:

| Campo | Exemplos |
|---|---|
| O quê | água, treino, proteína, sono, minutos de foco, tarefas concluídas, dias com humor registrado, ou algo livre ("ler 20 páginas") |
| Quanto | 10 L, 3 treinos, 20 páginas |
| Como conta | **Pote juntos**: todos somam para um total ("10 L juntos na semana"). **Cada um a sua**: cada pessoa tem a própria meta ("3 treinos cada um") |
| Por quanto tempo | uma semana, um mês, 21 dias, datas livres, ou sem fim com ciclos semanais |
| Quem | de 2 a 5 pessoas, convidadas por link |

### Como o progresso aparece

O grupo escolhe um de dois modos ao criar a meta:

* **Faixas:** o pote enche em partes. Começando, um quarto, metade, quase lá, conseguimos. Sem número exato.
* **Só o ritmo:** "vocês estão no ritmo", "um pouco atrás" ou "bem à frente", comparando com o esperado para o dia do período. Sem quantidade.

Na meta "cada um a sua", o grupo vê só quantas pessoas estão no ritmo ("2 de 3 no ritmo"), nunca quem.

Por que não número exato: numa dupla, o total entrega o número do outro (juntos 7 L, eu bebi 4 L, então você bebeu 3 L).

### Privacidade no banco

* Cada contribuição fica numa tabela que só o dono lê (RLS `user_id = auth.uid()`).
* O grupo lê o progresso por uma função `SECURITY DEFINER` que devolve apenas a faixa ou o ritmo. Nunca devolve linhas nem somas por pessoa.
* O modelo de membros e convite segue o das finanças em casal (`053_partner_workspace.sql`): tabela de membros, helper de membro e aceite atômico por RPC.

### Apoio

* Mensagens prontas com um toque: "tô contigo", "bora juntos", "orgulho de você", "um passo de cada vez". Sem texto livre, sem chat.
* Silenciar o grupo a qualquer hora.
* Avisos respeitam `notifyPolicy` (lotes e silêncio das 22h às 8h) e nunca dizem "você esqueceu".
* Resumo no fim do período: "vocês chegaram a quase lá juntos", com sugestão para o próximo ciclo baseada no anterior.

### Ofensiva sem culpa

* Dia de descanso automático e gratuito.
* Voltar recupera a sequência, sem pagar.
* A ofensiva do grupo conta semanas em que o grupo chegou perto da meta, não dias perfeitos.

## Academia

Inspirada no que o Hevy oferece de graça, sem os limites dos planos pagos:

* Rotinas ilimitadas, histórico sem limite, sem anúncios.
* Registro rápido de séries (carga, repetições), timer de descanso.
* Volume da semana por grupo muscular.
* Usa a tabela `sessoes_treino`, que já existe. Um treino registrado conta para metas de treino.

## Comida

### Sem obsessão por caloria

* Registro por texto com o mesmo leitor do Dump ("almocei arroz, feijão e frango").
* Frequência: "você comeu pão de queijo 12 vezes neste mês".
* Calorias só se a pessoa ligar, escondidas por padrão, nunca em vermelho, sem aviso de "passou do limite".
* Código de barras com o Open Food Facts (licença ODbL: citar a fonte na tela).
* TACO (Unicamp) e TBCA (USP) só depois de pedir autorização para uso comercial.

### Comida com dinheiro

* **Agora:** agrupar os gastos pelo item ("café: 18 vezes no mês, R$ 214"), a partir do que já está no extrato.
* **Depois:** ler o QR Code da nota fiscal (NFC-e) para puxar cada item com preço. Cada estado tem o seu portal, então fica para uma fase própria.

## Fases

| Fase | O quê | Estado |
|---|---|---|
| 0 | Convite de amigo no celular, Ofensiva e água salvas no APK, histórico diário de proteína, sono e treino | feito (migrações 063 e 064) |
| 1 | Amigos no celular: lista, convite, remover, silenciar | feito (`/amigos`) |
| 2 | Metas juntos: qualquer métrica, qualquer duração, pote ou cada um, faixas ou ritmo, até 5 pessoas, apoio | feito (`/metas`, migração 064) |
| 3 | Registro de treino | feito (`/treino`, migração 066) |
| 4 | Comida por texto, frequência e gasto por item | feito (`/comida`, migração 067) |
| 5 | Calorias opcionais e código de barras | feito (precisa de build nativo novo por causa do expo-camera) |
| 6 | Nota fiscal (NFC-e) | depois |

### Ficou para depois

* Links de convite abrindo direto no app (Android App Links e universal links) e rota `/meta/CODIGO` no site antigo. Hoje o convite funciona pelo link dentro do app ou digitando o código.
* Resumo de fim de período por push e ofensiva do grupo contada em semanas.
* Remover amigo pela versão web do perfil.
* Calorias para itens escritos à mão (hoje só vêm do código de barras).
* A sessão guiada antiga (`/academia/sessao`) ainda não grava em `sessoes_treino`.

### Privacidade: detalhe de implementação

O progresso do grupo fica em cache por até 1 hora. Sem isso, numa dupla, alguém poderia mudar o próprio registro várias vezes até a faixa virar e descobrir o número do outro. O preço é o grupo ver o progresso com até 1 hora de atraso.

## Fontes

* Duolingo Friends Quests: https://blog.duolingo.com/friends-quests/
* Silverman e Barasch, sequência quebrada e motivação (J. Consumer Research, 2023): https://www.psychologytoday.com/gb/blog/ulterior-motives/202306/how-broken-streaks-sap-motivation
* Zhang e Centola, apoio e comparação em redes (Prev Med Rep, 2016): https://www.ncbi.nlm.nih.gov/pubmed/27617191
* Patel et al., STEP UP (JAMA Intern Med, 2019): https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2749761
* Levinson et al., MyFitnessPal e transtornos alimentares (2017): https://www.sciencedirect.com/science/article/abs/pii/S1471015317301484
* Open Food Facts, licença: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/
* TACO: https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/
* TBCA: https://www.tbca.net.br/
* Hevy, plano grátis: https://repreturn.com/hevy-pro-vs-free/
