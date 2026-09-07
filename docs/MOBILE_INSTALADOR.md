# Instalador Android — Simply-Life

Como ter o app **no celular sem o PC ligado**: um **APK** (instala direto) e um **AAB** (Play Store).

A [Vercel](DEPLOY_VERCEL.md) continua sendo o **site/PWA**. Este guia é o binário nativo em `apps/mobile` (Expo + EAS).

Identidade Android já definida em `apps/mobile/app.json`:

- Nome: **Simply-Life**
- Package: `app.simplylife.os`
- Scheme: `simplylife`

iOS / TestFlight **não** entram neste documento.

---

## O que cada arquivo gera

| Perfil em `apps/mobile/eas.json` | Arquivo | Uso |
|----------------------------------|---------|-----|
| `preview` | `.apk` | Instalar no seu Android (link do build) |
| `production` | `.aab` | Enviar à Play Console |

O build roda **na nuvem da Expo** (10–20 min). O Metro local (`npm run mobile`) **não** produz instalador.

---

## 0. Uma vez no PC

1. Conta em [expo.dev](https://expo.dev).
2. Na raiz do monorepo já houve `npm install`.
3. Login e vínculo do projeto (grava `extra.eas.projectId` no `app.json` — **não invente** o ID):

```bash
npx eas-cli login
cd apps/mobile
npx eas-cli init
```

4. Na primeira build Android, aceite o **keystore gerado pela Expo** e baixe o backup quando o CLI oferecer. Sem esse arquivo você não atualiza o mesmo app na loja depois.

O monorepo instala da raiz no CI via script `eas-build-pre-install` em `apps/mobile/package.json`.

---

## 1. Secrets (obrigatório para login real)

O `apps/mobile/.env` **não** entra no APK. Cadastre no Expo (**Project → Environment variables**) ou:

```bash
cd apps/mobile
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://zuxkqmooxvnulgllduhr.supabase.co" --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "cole-a-anon-key" --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_API_URL --value "https://simply-life.vercel.app" --scope project
```

Use a URL **de produção** da API (Vercel), nunca `http://localhost:3000`.

Sem secrets o instalado abre em **modo convidado / demo**.

---

## 2. APK — aplicativo no bolso

```bash
cd apps/mobile
npx eas-cli build -p android --profile preview
```

1. Espere o job em [expo.dev](https://expo.dev) → Builds.
2. Abra o link **Install** / download no **Android**.
3. Permita instalar de fontes desconhecidas, se o sistema pedir.
4. Abra **Simply-Life** como qualquer app.

Cada mudança de código que você quiser no telefone exige **outro** `eas build` (ou, mais tarde, EAS Update — fora deste guia).

---

## 3. Play Store — AAB

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

## 4. Google login no app nativo

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

## 5. Push

O APK registra o token em `EXPO_PUBLIC_API_URL` + `/api/push-subscribe`. A API precisa estar no ar na Vercel. Ícone de notificação: plugin `expo-notifications` no `app.json`.

---

## Checklist rápido

- [ ] `eas-cli login` + `eas init` em `apps/mobile`
- [ ] Secrets `EXPO_PUBLIC_SUPABASE_*` e `EXPO_PUBLIC_API_URL`
- [ ] Keystore Expo com backup
- [ ] `build --profile preview` → APK no celular
- [ ] Redirect `simplylife://` no Supabase
- [ ] Play Console + `versionCode` + `build --profile production` → AAB em teste interno

---

## Fora deste guia

- Publicar na Play **por você** (precisa da sua conta Google).
- iPhone / TestFlight.
- Expo Go com o PC ligado (`npm run mobile` na raiz) — isso é só desenvolvimento.
