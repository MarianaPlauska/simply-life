/**
 * Metro exige string literal em require.context.
 * No monorepo o babel às vezes não embute EXPO_ROUTER_* - patch local.
 */
const fs = require('fs')
const path = require('path')

const routerDir = path.resolve(__dirname, '../node_modules/expo-router')
if (!fs.existsSync(routerDir))
{
  console.warn('[patch-expo-router-ctx] expo-router não encontrado, skip')
  process.exit(0)
}

const web = `export const ctx = require.context(
  "../../app",
  true,
  /^(?:\\.\\/)(?!(?:(?:(?:.*\\+api)|(?:\\+(html|native-intent))))\\.[tj]sx?$).*(?:\\.android|\\.ios|\\.native)?\\.[tj]sx?$/,
  "sync"
);
`

const native = `export const ctx = require.context(
  "../../app",
  true,
  /^(?:\\.\\/)(?!(?:(?:(?:.*\\+api)|(?:\\+html)))\\.[tj]sx?$).*\\.[tj]sx?$/
);
`

fs.writeFileSync(path.join(routerDir, '_ctx.web.js'), web)
fs.writeFileSync(path.join(routerDir, '_ctx.js'), native)
console.log('[patch-expo-router-ctx] ok → ../../app (mode sync)')
