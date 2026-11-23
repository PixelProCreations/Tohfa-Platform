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

declare module 'react-native-safe-area-context' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface EdgeInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  export function useSafeAreaInsets(): EdgeInsets;
  export const SafeAreaView: React.ComponentType<ViewProps>;
  export const SafeAreaProvider: React.ComponentType<ViewProps>;
  export const SafeAreaConsumer: React.ComponentType<{ children: (insets: EdgeInsets) => React.ReactNode }>;
  export const initialWindowMetrics: { insets: EdgeInsets; frame: { x: number; y: number; width: number; height: number } } | null;
}

declare module '*/assets/images/products' {
  export const productImages: Record<string, any>;
  export const ProductImages: Record<string, any>;
  export const categoryImages: Record<string, any>;
  export const CategoryImages: Record<string, any>;
  const content: any;
  export default content;
}

