/** Garante EXPO_ROUTER_APP_ROOT relativo — Metro exige string literal no require.context */
const path = require('path')

if (!process.env.EXPO_ROUTER_APP_ROOT)
{
  // relativo ao project root do Expo (apps/mobile)
  process.env.EXPO_ROUTER_APP_ROOT = path.join(__dirname, '..', 'app')
}
