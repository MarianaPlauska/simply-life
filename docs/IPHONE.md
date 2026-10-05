# SunFy no iPhone

Como colocar o SunFy no iPhone de alguém e o que cada caminho entrega. Atualizado em outubro de 2026.

O app em `apps/mobile` é um só código para Android, iPhone e navegador. O que muda é **como ele chega ao aparelho**. No Android já existe o APK (ver [MOBILE_INSTALADOR.md](MOBILE_INSTALADOR.md)). No iPhone, a Apple não deixa instalar um arquivo baixado da internet, então os caminhos são outros.

## Resumo

| Caminho | É um app de verdade? | Custo | Quanto demora | Serve para |
|---|---|---|---|---|
| **1. Site instalado (PWA)** | Não. É o site aberto em tela cheia, a partir de um ícone na tela de início | Grátis | Na hora, depois do deploy na Vercel | Testar com poucas pessoas agora |
| **2. TestFlight** | Sim. App nativo, instalado pelo app TestFlight da Apple | US$ 99 por ano (Apple Developer Program) | De 2 a 5 dias na primeira vez | Usar com amigos, com notificação e câmera |
| **3. App Store** | Sim | Os mesmos US$ 99 por ano | De 1 a 2 semanas na primeira vez (revisão da Apple) | Qualquer pessoa baixar |
| Expo Go | Só para desenvolvimento | Grátis | Na hora | Você testar mudanças com o PC ligado. Não serve para amigos |

**Recomendação:** começar pelo caminho 1 para testar a ideia com a sua amiga sem gastar nada. Se o uso firmar, passar para o 2 (TestFlight). Assim ela ganha notificações, câmera e o app funcionando sem internet.

---

## 1. Site instalado (PWA)

### O que é
A Vercel publica a versão web do próprio app (`apps/mobile`, gerada com `expo export -p web`). No iPhone, o Safari permite **adicionar o site à tela de início**: fica com ícone, nome e abre em tela cheia, sem a barra do navegador. Por baixo, continua sendo o site.

### O que funciona e o que não funciona

| Recurso | No site instalado | No app nativo (TestFlight ou App Store) |
|---|---|---|
| Tarefas, Carteira, Saúde, diário, relatório | Sim | Sim |
| Amigos, Metas juntos, Elo | Sim (mesmo banco Supabase) | Sim |
| IA do Axel | Sim (funções da Vercel) | Sim |
| Os dados ficam na conta e aparecem em outros aparelhos | Sim | Sim |
| **Notificações** (lembretes, remédios, apoio dos amigos) | **Não.** A versão web do app não tem service worker nem registro de notificação na web | Sim |
| **Funcionar sem internet** | **Não.** Sem service worker, abrir sem internet mostra erro | Sim, os dados ficam no aparelho e sobem depois |
| Leitor de código de barras da comida | Incerto. Depende da câmera do Safari e não foi testado | Sim |
| Vibração ao concluir e lembretes no horário | Não | Sim |
| Modo convidado (sem conta) | Funciona, mas o iPhone pode apagar os dados de sites guardados no aparelho. Use sempre com conta | Sim |
| Estar na App Store | Não | Sim, no caminho 3 |

> O site antigo (`frontend/`) tinha service worker e notificação web. Ao trocar o que a Vercel publica pela versão web do app, isso ficou para trás. Para trazer de volta, é preciso escrever um service worker para a build do Expo e ligar o registro de notificação na web. É uma tarefa própria, ainda não feita.

### Passo a passo

**Você, uma vez:**
1. Faça o commit e o push para a `main`. A Vercel usa o `vercel.json` da raiz, que gera a versão web do app (ver [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)).
2. No Supabase, em **Authentication → URL Configuration**, deixe o Site URL como `https://simply-life.vercel.app` e confirme estas Redirect URLs:
   * `https://simply-life.vercel.app/auth/callback`
   * `https://simply-life.vercel.app/reset-password`
   * `https://simply-life.vercel.app/google-callback`
3. Confira se as migrações do Supabase estão aplicadas até a mais recente (`supabase/migrations`).

**A pessoa, no iPhone:**
1. Abrir `https://simply-life.vercel.app` no **Safari**. Pelo Chrome do iPhone não aparece a opção de instalar.
2. Tocar em **Compartilhar** (quadrado com seta para cima) e depois em **Adicionar à Tela de Início**.
3. Abrir pelo ícone novo, criar a conta e confirmar o e-mail.

**Para se conectarem:** em **Juntos → Amigos**, uma manda o convite ou o código para a outra. Para uma meta, quem cria manda o código e a outra digita em **Metas → Tenho um código**. Links que abrem o app direto ainda não existem (ver [METAS_JUNTOS.md](METAS_JUNTOS.md), "Ficou para depois").

### Atualizações
Cada deploy na Vercel chega na próxima vez que a pessoa abrir o app. Não precisa reinstalar.

---

## 2. TestFlight (app nativo para testadores)

### O que é
TestFlight é o app da Apple para distribuir versões de teste. Você envia o build para a Apple, convida as pessoas por e-mail, e elas instalam pelo app TestFlight. É o app nativo completo, com notificação, câmera e funcionamento sem internet.

### O que precisa
* **Apple Developer Program**: US$ 99 por ano, em https://developer.apple.com/programs/. Pessoa física serve. A aprovação leva de 1 a 2 dias.
* Conta Expo (a mesma do APK do Android).
* Não precisa de Mac: o build roda na nuvem da Expo (EAS).

### Passo a passo

**Uma vez:**
1. Faça a inscrição no Apple Developer Program e espere a aprovação.
2. No PC, ligue o projeto à conta Expo, se ainda não ligou (é o mesmo passo do Android):
   ```bash
   cd apps/mobile
   npx eas-cli login
   npx eas-cli init
   ```
3. Gere o build de iOS. Na primeira vez, o EAS pede o login da Apple e cria sozinho os certificados e o registro do app (bundle id `app.simplylife.os`, já definido no `app.json`):
   ```bash
   npx eas-cli build -p ios --profile production
   ```
4. Envie o build para a Apple:
   ```bash
   npx eas-cli submit -p ios --latest
   ```
   Isso cria o app no **App Store Connect** se ele ainda não existir.
5. No App Store Connect, em **TestFlight**:
   * **Testadores internos** (até 100, precisam estar na sua equipe da Apple): entram na hora.
   * **Testadores externos** (até 10.000, só com o e-mail): a primeira versão passa por uma revisão rápida da Apple, normalmente de 1 dia. É aqui que entra a sua amiga.
6. Adicione o e-mail dela como testadora externa.

**Ela:**
1. Instala o app **TestFlight** da App Store.
2. Abre o convite que chega por e-mail e toca em **Instalar**.

### Atualizações
* Mudanças só de telas e lógica (JavaScript) chegam pelo `eas update`, sem novo build, como no Android.
* Mudanças nativas (biblioteca nova, permissão, ícone) pedem um build e um envio novos.
* Cada build do TestFlight vale por 90 dias. Depois disso, é preciso mandar outro.

### O que ajustar no projeto antes do primeiro build de iOS
* `apps/mobile/eas.json`: o perfil `production` hoje só define o Android. O EAS usa valores padrão para iOS, mas vale conferir no primeiro build.
* `apps/mobile/app.json`: com `"appVersionSource": "local"`, cada envio para a Apple precisa de um `ios.buildNumber` maior que o anterior. Dá para trocar para `"remote"` no `eas.json` e deixar o EAS contar sozinho.
* Login com Google no app nativo: ver a seção 8 de [MOBILE_INSTALADOR.md](MOBILE_INSTALADOR.md). No iOS também é preciso cadastrar o esquema `simplylife://` nas Redirect URLs do Supabase.

---

## 3. App Store

Mesmo build e mesma conta do TestFlight. A diferença é preencher a ficha do app no App Store Connect (descrição, capturas de tela, política de privacidade, classificação etária) e mandar para a revisão da Apple.

Antes de publicar:
* **Política de privacidade:** a Apple exige um endereço público. O site antigo tinha `/privacidade` e `/termos`; a versão web do app ainda não tem essas páginas.
* **Dados de saúde e humor:** declarar na ficha de privacidade da Apple o que é coletado (humor, água, sono, refeições, gastos) e que fica na conta da própria pessoa.
* O app não substitui atendimento de saúde mental. A frase que já aparece nas boas-vindas precisa estar também na descrição da loja.

---

## Expo Go (só para desenvolvimento)

O Expo Go abre o app direto do seu PC (`npm run mobile`), pelo QR code. Serve para você ver mudanças na hora. Não serve para uma amiga usar no dia a dia: depende do PC ligado e na mesma rede.
