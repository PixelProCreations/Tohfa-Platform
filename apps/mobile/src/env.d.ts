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
  /** Optional API origin for this build (no /v1). See src/shell/config/env.ts. */
  export const MOBILE_API_BASE_URL: string | undefined;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.jpeg' {
  const content: any;
  export default content;
}

declare module 'react-native-razorpay' {
  /** Subset of the SDK's options this app uses; see src/shell/payments/razorpay.ts. */
  export interface RazorpayCheckoutOptions {
    key: string;
    amount: number | string;
    currency?: string;
    name?: string;
    description?: string;
    order_id?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    theme?: { color?: string };
    method?: string;
    [key: string]: unknown;
  }
  export interface RazorpaySuccess {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }
  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccess>;
  };
  export default RazorpayCheckout;
}
