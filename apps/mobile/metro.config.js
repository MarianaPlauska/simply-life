const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, 'packages/ui-tokens'),
  path.resolve(workspaceRoot, 'packages/shared'),
]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
