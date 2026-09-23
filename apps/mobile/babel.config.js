module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Inlines the repo-root .env (gitignored, real values -- shared with
    // apps/api) at bundle time into `import { X } from '@env'` -- Metro does
    // not read .env files on its own. See
    // packages/mobile-ui/src/FarmBoundaryMap.tsx for why this matters:
    // `process.env.X` is always undefined in the RN bundle without it, which
    // previously crashed the app (MapboxConfigurationException).
    //
    // CAUTION: the root .env also holds real backend secrets (JWT_SECRET,
    // DATABASE_URL, RAZORPAY_KEY_SECRET, ...). Only ever `import` a name here
    // that is meant to ship inside the public mobile app bundle -- anything
    // imported from '@env' is inlined as a plaintext string into a binary
    // distributed to app stores. Add new client-safe vars to env.d.ts
    // deliberately, one at a time; never widen this to a wildcard export.
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '../../.env',
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
};
