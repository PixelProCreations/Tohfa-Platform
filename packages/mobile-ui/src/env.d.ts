// Type declaration for the `@env` virtual module react-native-dotenv creates
// at build time from the repo-root .env (see apps/mobile/babel.config.js --
// Metro bundles this package through that same root Babel config). Not
// shipped by the library itself -- add a name here whenever this package
// needs a new var, and only ones meant to ship inside the public mobile
// bundle (see the CAUTION comment in apps/mobile/babel.config.js).
declare module '@env' {
  export const MAPBOX_ACCESS_TOKEN: string;
}
