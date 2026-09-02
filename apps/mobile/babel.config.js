const path = require('path')

// Precisa estar definido ANTES do babel-preset-expo processar o expo-router
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app')

module.exports = function (api)
{
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
