# Instalador Android — Simply-Life

Como ter o app **no celular sem o PC ligado**: um **APK** (instala direto) e um **AAB** (Play Store). Depois de instalado, as mudanças de código chegam pelo **EAS Update**, sem reinstalar.

A [Vercel](DEPLOY_VERCEL.md) continua sendo o **site/PWA**. Este guia é o app nativo em `apps/mobile` (React Native + Expo + EAS). O APK **não** é um site embrulhado: a interface é nativa do Android e o código JS vai empacotado dentro dele.

Identidade Android já definida em `apps/mobile/app.json`:

- Nome: **Simply-Life**
- Package: `app.simplylife.os`
- Scheme: `simplylife`

iOS / TestFlight **não** entram neste documento.

---

## Visão geral

```
1x  eas init                 → liga o projeto à sua conta Expo
1x  eas update:configure     → ativa atualizações pela internet
1x  eas build (preview)      → gera o APK → instala no celular
Nx  eas update               → cada ajuste de JS/telas chega no celular sozinho
às vezes  eas build de novo  → só quando mudar algo nativo (ver seção 4)
```

---

## O que cada perfil gera

| Perfil em `apps/mobile/eas.json` | Arquivo | Channel de update | Uso |
|----------------------------------|---------|-------------------|-----|
| `preview` | `.apk` | `preview` | Instalar no seu Android (link do build) |
| `production` | `.aab` | `production` | Enviar à Play Console |

O build roda **na nuvem da Expo** (10–20 min). O Metro local (`npm run mobile`) **não** produz instalador: aquilo é só desenvolvimento, e é por isso que o Expo Go precisa do PC ligado.

---

## 0. Uma vez no PC

1. Crie uma conta grátis em [expo.dev](https://expo.dev).
2. Na raiz do monorepo já houve `npm install`.
3. Login e vínculo do projeto (grava `extra.eas.projectId` no `app.json` — **não invente** o ID):

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli init
```

4. Ative o EAS Update (grava `updates.url` no `app.json`; o resto já está configurado):

```bash
npx eas-cli update:configure
```

> Se ele perguntar se pode alterar `app.json` / `eas.json`, responda **sim**. Os channels `preview`/`production` e o `runtimeVersion` já existem; ele só completa o que falta.

5. Faça commit das alterações que o CLI fez em `app.json` e `eas.json`.

O monorepo instala da raiz no CI via script `eas-build-pre-install` em `apps/mobile/package.json`.

---

## 1. Variáveis de ambiente (já configuradas)

O `apps/mobile/.env` está no `.gitignore` e **não** vai para o build na nuvem. Por isso, as variáveis de produção ficam no perfil `base` do `apps/mobile/eas.json`, herdado por `preview` e `production`:

| Variável | Valor |
|----------|-------|
| `EXPO_PUBLIC_API_URL` | `https://simply-life.vercel.app` |
| `EXPO_PUBLIC_APP_URL` | `https://simply-life.vercel.app` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://zuxkqmooxvnulgllduhr.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | chave anon (pública, a mesma do `vercel.json`) |

Nunca use `http://localhost:3000` aqui: no celular, `localhost` é o próprio aparelho.

> **Importante para o EAS Update:** o `eas update` roda no **seu PC** e lê o `apps/mobile/.env`, não o `eas.json`. Antes de publicar um update, confira que o `.env` tem a URL de produção, ou rode com as variáveis na frente (ver seção 3).

---

## 2. APK — instalar no celular

### No PC

```bash
cd apps/mobile
npx eas-cli build -p android --profile preview
```

- Na primeira vez, aceite **gerar o keystore pela Expo** (é a assinatura do app). Sem ele você não consegue atualizar o mesmo app depois; a Expo guarda uma cópia na sua conta.
- Quando aparecer *"Build queued"* / o upload terminar, **pode fechar o PC**. O build continua na nuvem.
- No final o terminal mostra um **link** e um **QR code**.

### No celular (Android)

1. Abra o link do build de uma destas formas:
   - aponte a **câmera** para o QR code do terminal; **ou**
   - no navegador do celular, entre em [expo.dev](https://expo.dev) com a sua conta → projeto **simply-life** → **Builds** → o build mais recente; **ou**
   - mande o link para você mesma (WhatsApp, e-mail) e abra no celular.
2. Toque em **Install** / **Download** → baixa o arquivo `simply-life-....apk`.
3. Abra o arquivo baixado (notificação de download ou app **Arquivos → Downloads**).
4. O Android vai avisar que o app vem de fonte desconhecida:
   - toque em **Configurações** → ative **Permitir desta fonte** para o navegador (Chrome) ou o app de Arquivos → volte.
5. Toque em **Instalar**. Se o **Play Protect** perguntar, toque em **Instalar mesmo assim** (é esperado para apps fora da loja).
6. O ícone **Simply-Life** aparece na tela de apps. Abra e faça login normalmente.

Pronto: o app roda sozinho, sem PC e sem Expo Go. Os dados são os mesmos da versão web (mesmo Supabase e mesma API).

---

## 3. EAS Update — atualizar sem reinstalar

Depois que o APK com EAS Update estiver instalado (build feito **depois** do passo 0.4), cada ajuste de código vai assim:

```bash
cd apps/mobile
npx eas-cli update --channel preview --message "o que mudou"
```

Se o seu `.env` estiver com `localhost`, publique passando as variáveis de produção na frente (Git Bash):

```bash
EXPO_PUBLIC_API_URL=https://simply-life.vercel.app \
EXPO_PUBLIC_APP_URL=https://simply-life.vercel.app \
npx eas-cli update --channel preview --message "o que mudou"
```

No celular:

1. Feche o app de vez (tire dos recentes) e abra de novo → ele baixa o update em segundo plano.
2. Feche e abra **mais uma vez** → a versão nova aparece.

(Esse é o comportamento padrão: baixa numa abertura, aplica na seguinte.)

Para o app da Play Store, use `--channel production`.

### Voltar atrás

Se um update quebrar algo, em [expo.dev](https://expo.dev) → **Updates** dá para republicar um update anterior, ou rode:

```bash
npx eas-cli update:republish --channel preview
```

---

## 4. Quando precisa de um APK novo (e não basta `eas update`)

O EAS Update só troca **JavaScript, telas, estilos e imagens**. Precisa de `eas build` de novo quando você:

- instalar ou atualizar uma biblioteca **nativa** (ex. `npx expo install expo-camera`);
- mudar **ícone, splash, nome, package, permissões ou plugins** no `app.json`;
- atualizar a versão do **Expo SDK**.

O `runtimeVersion` está com a política `appVersion`: o app instalado só aceita updates da **mesma** `expo.version` do `app.json`. Então, ao fazer uma mudança nativa:

1. Suba `expo.version` no `app.json` (ex. `1.0.0` → `1.1.0`).
2. Rode `npx eas-cli build -p android --profile preview` e instale o APK novo por cima (não precisa desinstalar; os dados ficam).
3. Os próximos `eas update` vão para essa versão nova.

Se esquecer de subir a versão depois de uma mudança nativa, o update pode chegar num app que não tem a biblioteca e fechar ao abrir. Na dúvida, gere um APK novo.

---

## 5. Play Store — AAB

1. Conta de desenvolvedor [Google Play Console](https://play.google.com/console) (taxa única).
2. Crie o app com o package **`app.simplylife.os`** (tem que bater com o `app.json`).
3. Ative **Play App Signing**.
4. Gere o bundle:

```bash
cd apps/mobile
npx eas-cli build -p android --profile production
```

5. Baixe o `.aab` e faça upload em **Teste interno** primeiro (e-mails testers). Só depois trilha de produção.
6. Preencha ficha: ícone, capturas, classificação, política de privacidade.

Antes de cada envio à loja, suba a versão no `app.json`:

- `expo.version` (ex. `1.0.1`)
- `expo.android.versionCode` (inteiro, sempre **maior** que o anterior; comece em `1`)

Envio opcional pela CLI (depois do perfil `submit` existir):

```bash
npx eas-cli submit -p android --profile production --latest
```

---

## 6. Google login no app nativo

No Supabase → Authentication → URL Configuration, **Redirect URLs** (além das de localhost do preview web):

```
simplylife://
simplylife://auth/callback
simplylife://*
```

No Google Cloud, o redirect do cliente OAuth continua sendo o do **Supabase**:

`https://zuxkqmooxvnulgllduhr.supabase.co/auth/v1/callback`

Não use a URL da Vercel como redirect do app nativo.

---

## 7. Push

O APK registra o token em `EXPO_PUBLIC_API_URL` + `/api/push-subscribe`. A API precisa estar no ar na Vercel. Ícone de notificação: plugin `expo-notifications` no `app.json`.

No Android, o push da Expo precisa de credenciais do **Firebase (FCM v1)**, que ainda **não** estão configuradas. Sem elas o app funciona normalmente, só sem notificações. Para ativar:

1. Crie um projeto no [Firebase](https://console.firebase.google.com) e adicione um app Android com o package `app.simplylife.os`.
2. Baixe o `google-services.json` para `apps/mobile/` e adicione em `app.json` → `expo.android.googleServicesFile: "./google-services.json"`.
3. Em Firebase → Configurações do projeto → Contas de serviço, gere uma chave privada (JSON) e envie para a Expo com `npx eas-cli credentials` → Android → **FCM V1 service account key**.
4. Gere um APK novo (é mudança nativa, ver seção 4).

---

## Checklist rápido

- [ ] `eas-cli login` + `eas init` em `apps/mobile`
- [ ] `eas update:configure` e commit do `app.json` / `eas.json`
- [ ] `build --profile preview` → keystore Expo aceito
- [ ] APK baixado e instalado no celular (fontes desconhecidas liberadas)
- [ ] Teste: `eas update --channel preview` → fechar/abrir o app 2x → mudança aparece
- [ ] Redirect `simplylife://` no Supabase
- [ ] (Opcional) Firebase/FCM para push
- [ ] (Depois) Play Console + `versionCode` + `build --profile production` → AAB em teste interno

---

## Fora deste guia

- Publicar na Play **por você** (precisa da sua conta Google).
- iPhone / TestFlight.
- Expo Go com o PC ligado (`npm run mobile` na raiz) — isso é só desenvolvimento.
