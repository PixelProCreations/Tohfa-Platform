// Type declaration for the `@env` virtual module react-native-dotenv creates
// at build time from the repo-root .env (see babel.config.js). Not shipped
// by the library itself. Needed here even though nothing under apps/mobile/src
// imports from '@env' directly: `pnpm --filter @tohfa/mobile typecheck`
// transitively type-checks packages/mobile-ui/src/FarmBoundaryMap.tsx (via
// the @tohfa/mobile-ui path mapping), which does import from '@env' -- but
// apps/mobile/tsconfig.json's `include` only covers its own src/**, so it
// never loads packages/mobile-ui/src/env.d.ts's ambient declaration on its
// own. Keep this in sync with that file.
declare module '@env' {
  export const MAPBOX_ACCESS_TOKEN: string;
}
