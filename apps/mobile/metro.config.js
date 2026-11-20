/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Path to repository root and required monorepo folders
const monorepoRoot = path.resolve(__dirname, '../..');
const packagesDir = path.resolve(monorepoRoot, 'packages');
const monorepoNodeModules = path.resolve(monorepoRoot, 'node_modules');

/**
 * Metro configuration for PNPM monorepo.
 *
 * Single entry point (index.js) for every role — farmer, customer and admin
 * screens all ship in one bundle, and which ones a signed-in user sees is
 * decided at runtime by their account's role, not by which entry file was
 * built. BR-16 farm-anonymity is enforced server-side (the catalog
 * serializer's allow-list), not by bundler config; the import-graph
 * discipline between role directories is still worth keeping, see
 * src/tests/cross_role_import_guard.test.ts.
 *
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

// metro-config 0.87 (pulled in by @react-native/metro-config 0.88) has a
// package.json "exports" map that blocks the old deep import
// 'metro-config/src/defaults/exclusionList'. The supported path is the
// 'private/*' subpath, resolved from @react-native/metro-config's own copy
// because pnpm does not hoist metro-config into this app's node_modules.
const exclusionListPath = require.resolve('metro-config/private/defaults/exclusionList', {
  paths: [require.resolve('@react-native/metro-config')],
});
const exclusionList = require(exclusionListPath).default;

const config = {
  watchFolders: [packagesDir, monorepoNodeModules],
  // .svg files are compiled to React components by react-native-svg-transformer
  // rather than bundled as static assets, so svg moves from assetExts to
  // sourceExts. Farmer's registration/profile screens import icons this way.
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    blockList: exclusionList([
      /.*[/\\]android[/\\]\.gradle[/\\].*/,
      /.*[/\\]android[/\\]build[/\\].*/,
      /.*[/\\]android[/\\]app[/\\]build[/\\].*/,
      /.*[/\\]ios[/\\]build[/\\].*/,
      /.*[/\\]\.git[/\\].*/,
      /.*[/\\]\.gradle[/\\].*/,
      /.*[/\\]\.agents[/\\].*/,
      /.*[/\\]apps[/\\]api[/\\].*/,
      /.*[/\\]apps[/\\]web[/\\].*/,
      /.*[/\\]db[/\\].*/,
      /.*[/\\]docs[/\\].*/,
      /.*[/\\]infra[/\\].*/,
      /.*[/\\]scripts[/\\].*/,
    ]),
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Follow pnpm symlinks into the .pnpm virtual store
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);
