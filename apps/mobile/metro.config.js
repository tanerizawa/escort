const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Force Metro to resolve from local node_modules FIRST, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Block root-level react-native-screens entirely so local version is used
config.resolver.blockList = [
  new RegExp(
    path.resolve(monorepoRoot, 'node_modules/react-native-screens').replace(/[/\\]/g, '[/\\\\]') + '/.*'
  ),
];

module.exports = config;
