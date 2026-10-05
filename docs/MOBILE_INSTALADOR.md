# APK do SunFy (Android)

Passo a passo para gerar o APK do SunFy, instalar no seu celular Android e mandar atualizações sem reinstalar. Atualizado em outubro de 2026.

Para iPhone, o caminho é outro (o iPhone não instala APK): ver [IPHONE.md](IPHONE.md).

---

## Antes de tudo: o que é cada coisa

| Termo | O que é |
|---|---|
| **APK** | O arquivo de instalação de um app Android. Você baixa e instala, como um instalador de programa no PC. Só funciona em Android. |
| **Expo** | A ferramenta que transforma o código de `apps/mobile` em app de celular. |
| **EAS** | O serviço da Expo que **gera o APK na nuvem**. Você não precisa de Android Studio: o PC só envia o código, e o build roda nos servidores da Expo. |
| **Keystore** | A "assinatura" do app. O Android só aceita uma atualização se ela tiver a mesma assinatura do app instalado. A Expo cria e guarda para você. |
| **EAS Update** | Manda mudanças de telas e de lógica direto para o app instalado, pela internet, sem gerar outro APK. |
| **Channel** | O "canal" de atualizações. O APK de teste escuta o canal `preview`; o da Play Store, o `production`. |

O APK **não é** o site dentro de uma moldura: as telas são nativas do Android e o código vai empacotado dentro dele. Os dados são os mesmos do site, porque os dois usam o mesmo banco (Supabase) e a mesma IA (Vercel).

Dados do app no `apps/mobile/app.json`:
* Nome: **SunFy**
* Pacote (package): `app.simplylife.os`
* Esquema de links: `simplylife://`

---

## Visão geral

```
Uma vez só     login + init + update:configure   liga o projeto à sua conta Expo
Uma vez        build preview                     gera o APK (10 a 20 min na nuvem)
Uma vez        instalar no celular               baixa pelo link e instala
Sempre que     eas update                        manda mudanças de tela, sem reinstalar
mudar código
Às vezes       build de novo                     só quando mudar algo nativo (seção 6)
```

---

## 1. O que você precisa

* **Conta grátis na Expo**: crie em https://expo.dev/signup. O plano grátis basta para isso. Ele tem um limite mensal de builds e a fila costuma ser mais lenta.
* **No PC**: o projeto com as dependências instaladas (`npm install` na raiz do repositório) e o Node instalado. Os comandos abaixo funcionam no Git Bash, no PowerShell ou no terminal do VS Code.
* **Tudo commitado**: o EAS envia o código a partir do git. Antes de cada build, faça o commit do que quer ver no APK. Se houver mudança sem commit, o EAS avisa e pergunta o que fazer.
* **No celular**: Android com uns 150 MB livres e internet.

---

## 2. Ligar o projeto à sua conta Expo (uma vez só)

Abra o terminal na pasta do app:

```bash
cd apps/mobile
```

### 2.1 Entrar na conta

```bash
npx eas-cli login
```

Ele pede o **e-mail (ou usuário) e a senha** da conta Expo. Se perguntar se pode instalar o `eas-cli`, responda **y** (sim).

Para conferir se entrou: `npx eas-cli whoami` mostra o seu usuário.

### 2.2 Criar o projeto na Expo

```bash
npx eas-cli init
```

* Se perguntar **"Would you like to create a project for @seu-usuario/simply-life?"**, responda **Y**.
* Ele grava um `projectId` dentro de `app.json` (em `expo.extra.eas.projectId`). **Não invente nem copie esse ID de outro lugar**: ele é da sua conta.

### 2.3 Ligar as atualizações pela internet

```bash
npx eas-cli update:configure
```

* Se perguntar se pode alterar o `app.json` ou o `eas.json`, responda **sim**.
* Ele grava o endereço de atualizações (`updates.url`) no `app.json`. Os canais `preview` e `production` e a regra de versão (`runtimeVersion`) já estão prontos no projeto.

### 2.4 Commit

O passo 2 mexeu no `app.json` (e talvez no `eas.json`). Faça o commit dessas mudanças, por exemplo:

```
chore(mobile): liga o projeto ao EAS e ativa atualizações
```

> Este passo tem que vir **antes** do primeiro build. Um APK gerado sem o passo 2.3 não recebe atualizações e vai precisar ser gerado de novo.

---

## 3. Variáveis de ambiente (já configuradas)

O arquivo `apps/mobile/.env` fica fora do git e **não vai para o build na nuvem**. Por isso, os endereços de produção estão no `apps/mobile/eas.json`, no perfil `base`, que os perfis `preview` e `production` herdam:

| Variável | Valor |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://simply-life.vercel.app` |
| `EXPO_PUBLIC_APP_URL` | `https://simply-life.vercel.app` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://zuxkqmooxvnulgllduhr.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | a chave pública (anon), a mesma do `vercel.json` |

Você não precisa mexer em nada aqui. Só nunca troque por `http://localhost:3000`: no celular, `localhost` é o próprio celular.

---

## 4. Gerar o APK

### 4.1 No PC

```bash
cd apps/mobile
npx eas-cli build -p android --profile preview
```

O que vai acontecer:

1. **"Generate a new Android Keystore?"**: responda **Y** (sim). É a assinatura do app, e a Expo guarda uma cópia na sua conta. Sem ela, você não consegue atualizar este app depois. Isso só aparece na primeira vez.
2. Ele compacta o projeto e envia para a nuvem. Quando aparecer **"Build queued"** ou **"Waiting for build to complete"**, o envio terminou. **Pode fechar o terminal e até desligar o PC**: o build continua na Expo.
3. Leva de 10 a 20 minutos, às vezes mais no plano grátis.
4. No fim, o terminal mostra um **link** e um **QR code** do build.

Para acompanhar sem o terminal: entre em https://expo.dev, abra o projeto **simply-life** e depois **Builds**. Lá aparece o progresso, o log e o botão de baixar.

### 4.2 No celular

1. **Abra o link do build no celular**, de um destes jeitos:
   * aponte a câmera para o QR code que apareceu no terminal; ou
   * no navegador do celular, entre em https://expo.dev com a sua conta → **simply-life** → **Builds** → o build mais recente; ou
   * mande o link para você mesma pelo WhatsApp ou e-mail e abra no celular.
2. Toque em **Install** ou **Download**. O celular baixa um arquivo `.apk`.
3. Abra o arquivo: pela notificação de download ou pelo app **Arquivos → Downloads**.
4. O Android avisa que o app vem de uma **fonte desconhecida**. Toque em **Configurações**, ative **Permitir desta fonte** para o app que você usou para abrir (Chrome ou Arquivos) e volte.
5. Toque em **Instalar**.
6. Se o **Play Protect** perguntar, toque em **Mais detalhes → Instalar mesmo assim**. Isso é normal para apps fora da Play Store.
7. O ícone do **SunFy** aparece na lista de apps. Abra e entre com a mesma conta do site.

Pronto: o app roda sozinho, sem PC e sem Expo Go.

### 4.3 Conferir que deu certo

* [ ] O app abre e mostra a tela de entrar.
* [ ] O login com e-mail funciona, e as suas tarefas e gastos aparecem.
* [ ] Crie uma tarefa no app e veja se ela aparece no site (`https://simply-life.vercel.app`). Isso confirma que app e site estão no mesmo banco.
* [ ] Toque no **+**, lance um gasto e veja o aviso de "cabe no mês" funcionando.

---

## 5. Mandar atualizações sem reinstalar (EAS Update)

Para mudanças de **telas, textos, estilos, lógica e imagens**:

```bash
cd apps/mobile
npx eas-cli update --channel preview --message "o que mudou"
```

> O `eas update` roda no **seu PC** e lê o `apps/mobile/.env`, não o `eas.json`. Se o seu `.env` estiver apontando para `localhost`, passe os endereços de produção na frente (no Git Bash):
>
> ```bash
> EXPO_PUBLIC_API_URL=https://simply-life.vercel.app \
> EXPO_PUBLIC_APP_URL=https://simply-life.vercel.app \
> npx eas-cli update --channel preview --message "o que mudou"
> ```

**No celular**, a atualização chega em duas aberturas:
1. Feche o app de vez (tire da lista de apps recentes) e abra de novo. Ele baixa a atualização em segundo plano.
2. Feche e abra **mais uma vez**. A versão nova aparece.

### Voltar atrás
Se uma atualização quebrar algo, em https://expo.dev → **Updates** dá para republicar uma anterior. Ou pelo terminal:

```bash
npx eas-cli update:republish --channel preview
```

---

## 6. Quando precisa gerar um APK novo

O EAS Update **não** troca a parte nativa do app. Gere um APK novo quando:

* instalar ou atualizar uma biblioteca nativa (por exemplo, `npx expo install expo-camera`);
* mudar **ícone, tela de abertura, nome, pacote, permissões ou plugins** no `app.json`;
* atualizar a versão do Expo SDK.

Como fazer:
1. Suba a versão em `app.json`, no campo `expo.version` (por exemplo, de `1.0.0` para `1.1.0`). O app instalado só aceita atualizações da **mesma** versão (regra `runtimeVersion: appVersion`). Subir a versão evita mandar código novo para um app que não tem a biblioteca nova.
2. Faça o commit.
3. Rode o build de novo: `npx eas-cli build -p android --profile preview`.
4. Instale o APK novo **por cima** do antigo. Não precisa desinstalar, e os dados continuam.

Na dúvida se a mudança é nativa, gere um APK novo.

---

## 7. Notificações

Há dois tipos:

| Tipo | Exemplo | Funciona no APK hoje? |
|---|---|---|
| **Locais** (o próprio celular agenda) | lembrete de tarefa com hora, lembrete de remédio | Sim, depois de permitir notificações |
| **Remotas** (vêm do servidor) | apoio de amigos nas Metas juntos, resumo do dia | **Ainda não.** Precisa do Firebase (FCM), que não está configurado |

Para ligar as notificações remotas:
1. Crie um projeto no [Firebase](https://console.firebase.google.com) e adicione um app Android com o pacote `app.simplylife.os`.
2. Baixe o `google-services.json` para `apps/mobile/` e adicione no `app.json`: `expo.android.googleServicesFile: "./google-services.json"`.
3. No Firebase, em **Configurações do projeto → Contas de serviço**, gere uma chave privada (arquivo JSON) e envie para a Expo:
   ```bash
   npx eas-cli credentials
   ```
   Escolha **Android → FCM V1 service account key** e aponte o arquivo.
4. Gere um APK novo (é mudança nativa, ver seção 6).

O app registra o aparelho em `https://simply-life.vercel.app/api/push-subscribe`, então a Vercel precisa estar no ar.

---

## 8. Login com Google no app

No Supabase, em **Authentication → URL Configuration → Redirect URLs**, adicione:

```
simplylife://
simplylife://auth/callback
simplylife://*
```

No Google Cloud, o endereço de retorno do OAuth continua sendo o do Supabase: `https://zuxkqmooxvnulgllduhr.supabase.co/auth/v1/callback`. Não use o endereço da Vercel como retorno do app.

Login com e-mail e senha funciona sem nada disso.

---

## 9. Quando algo dá errado

| O que aparece | O que fazer |
|---|---|
| `eas-cli` pede para fazer login de novo | Rode `npx eas-cli login` outra vez. |
| O build falha na nuvem | Em https://expo.dev → **Builds** → o build com erro, abra o log e procure a primeira linha vermelha. Mande o log para o Claude. |
| "App não instalado" no celular | Já existe um SunFy instalado com outra assinatura (por exemplo, de um build feito em outra conta). Desinstale o antigo e instale de novo. |
| O Play Protect bloqueia | **Mais detalhes → Instalar mesmo assim**. |
| O app abre numa tela branca ou não conecta | Confira as variáveis do `eas.json` (seção 3) e se o site da Vercel está no ar. |
| A atualização não aparece | Feche e abra o app duas vezes (seção 5). Se ainda não aparecer, confira se a `expo.version` do `app.json` é a mesma do APK instalado. |
| O login com Google não volta para o app | Falta o `simplylife://` nas Redirect URLs do Supabase (seção 8). |

---

## 10. Play Store (depois)

1. Crie uma conta no [Google Play Console](https://play.google.com/console). A taxa é paga uma vez só.
2. Crie o app com o pacote **`app.simplylife.os`**, igual ao do `app.json`.
3. Ative o **Play App Signing**.
4. Gere o pacote da loja (um `.aab`, não um `.apk`):
   ```bash
   cd apps/mobile
   npx eas-cli build -p android --profile production
   ```
5. Envie primeiro para **Teste interno**, com os e-mails dos testadores. Só depois para produção.
6. Preencha a ficha: ícone, capturas de tela, classificação etária e política de privacidade (o app ainda não tem a página pública de privacidade; ver [IPHONE.md](IPHONE.md), seção 3).

Antes de cada envio, suba no `app.json`:
* `expo.version` (por exemplo, `1.0.1`);
* `expo.android.versionCode`, um número inteiro sempre **maior** que o anterior (comece em `1`).

---

## Checklist

- [ ] Conta na Expo criada
- [ ] `npx eas-cli login`, `npx eas-cli init` e `npx eas-cli update:configure` em `apps/mobile`
- [ ] Commit do `app.json` e do `eas.json`
- [ ] `npx eas-cli build -p android --profile preview`, com o keystore gerado pela Expo
- [ ] APK baixado e instalado no celular (fonte desconhecida liberada)
- [ ] Login e uma tarefa aparecendo no app e no site
- [ ] Teste de atualização: `eas update --channel preview`, abrir e fechar o app duas vezes, mudança aparece
- [ ] (Opcional) `simplylife://` no Supabase para o login com Google
- [ ] (Opcional) Firebase para notificações remotas
- [ ] (Depois) Play Console e `build --profile production`
