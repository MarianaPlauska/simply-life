const path = require('path')

// Precisa estar definido ANTES do babel-preset-expo processar o expo-router
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app')

// No monorepo o babel-preset-expo fica na raiz e não enxerga o expo-router (só em apps/mobile),
// então não injeta EXPO_PROJECT_ROOT; sem ele o painel de erros da web quebra (file.replace em undefined).
function inlineProjectRoot({ types: t })
{
  return {
    visitor: {
      MemberExpression(p)
      {
        if (p.matchesPattern('process.env.EXPO_PROJECT_ROOT')) p.replaceWith(t.stringLiteral(__dirname))
      },
    },
  }
}

module.exports = function (api)
{
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [inlineProjectRoot, 'react-native-reanimated/plugin'],
  }
}
