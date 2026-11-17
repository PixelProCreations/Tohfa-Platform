/**
 * Thin, typed wrapper over react-native-razorpay's checkout sheet.
 *
 * Normalises the SDK's promise (resolve on success, reject with
 * `{code, description}` on failure OR user cancel, with platform-dependent
 * codes) into one discriminated `RazorpayOutcome` so callers never parse SDK
 * errors themselves. The key and order id always come from the API
 * (`POST /wallets/me/topups` -> `razorpayKeyId`, `gatewayOrderId`); nothing
 * here is hardcoded. Amount is integer paise (the SDK's unit).
 */
import RazorpayCheckout, { type RazorpayCheckoutOptions } from 'react-native-razorpay';

export interface RazorpayCheckoutInput {
  keyId: string;
  orderId: string;
  /** Integer paise. */
  amountPaise: number;
  currency: 'INR';
  name: string;
  description?: string | undefined;
  prefill?: { name?: string | undefined; email?: string | undefined; contact?: string | undefined } | undefined;
  /** Preferred method hint, e.g. 'upi' | 'card' | 'netbanking'. */
  method?: string | undefined;
  themeColor?: string | undefined;
}

export type RazorpayOutcome =
  | { status: 'success'; paymentId: string; orderId?: string | undefined; signature?: string | undefined }
  | { status: 'cancelled'; code: number | null; description: string }
  | { status: 'failed'; code: number | null; description: string };

export interface RazorpaySdk {
  open(options: RazorpayCheckoutOptions): Promise<{
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }>;
}

/** Android `Checkout.PAYMENT_CANCELED` is 0; iOS reports cancel with code 2 + a cancel description. */
function isCancellation(code: number | null, description: string): boolean {
  if (/cancel/i.test(description)) return true;
  try {
    const parsed = JSON.parse(description) as { error?: { reason?: string } };
    if (parsed.error?.reason === 'payment_cancelled') return true;
  } catch {
    // description is usually plain text
  }
  return code === 0;
}

function buildOptions(input: RazorpayCheckoutInput): RazorpayCheckoutOptions {
  const options: RazorpayCheckoutOptions = {
    key: input.keyId,
    order_id: input.orderId,
    amount: input.amountPaise,
    currency: input.currency,
    name: input.name,
  };
  if (input.description !== undefined) options.description = input.description;
  if (input.method !== undefined) options['method'] = input.method;
  if (input.themeColor !== undefined) options.theme = { color: input.themeColor };
  if (input.prefill !== undefined) {
    const prefill: { name?: string; email?: string; contact?: string } = {};
    if (input.prefill.name !== undefined) prefill.name = input.prefill.name;
    if (input.prefill.email !== undefined) prefill.email = input.prefill.email;
    if (input.prefill.contact !== undefined) prefill.contact = input.prefill.contact;
    options.prefill = prefill;
  }
  return options;
}

export async function openRazorpayCheckout(
  input: RazorpayCheckoutInput,
  sdk: RazorpaySdk = RazorpayCheckout,
): Promise<RazorpayOutcome> {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new Error(`Razorpay amount must be positive integer paise, got ${String(input.amountPaise)}`);
  }
  try {
    const data = await sdk.open(buildOptions(input));
    return {
      status: 'success',
      paymentId: data.razorpay_payment_id,
      orderId: data.razorpay_order_id,
      signature: data.razorpay_signature,
    };
  } catch (err) {
    const raw = (err ?? {}) as { code?: unknown; description?: unknown; message?: unknown };
    const code = typeof raw.code === 'number' ? raw.code : null;
    const description =
      typeof raw.description === 'string'
        ? raw.description
        : typeof raw.message === 'string'
          ? raw.message
          : 'Payment failed';
    return isCancellation(code, description)
      ? { status: 'cancelled', code, description }
      : { status: 'failed', code, description };
  }
}
