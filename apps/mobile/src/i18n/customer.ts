/**
 * Customer's i18n entry point: customer's own namespaced strings plus the
 * shared `error.<ErrorCode>` bucket, wired into the shared engine in
 * `./runtime.ts`.
 *
 * Import this (not `./runtime` directly) from customer screens. See
 * `./runtime.ts` for why the catalogue data is split per role rather than
 * merged into one shared JSON module -- importing this file, and not
 * `./farmer.ts`, is what keeps farmer's strings out of the customer bundle.
 */
import errorsEn from './errors.en.json';
import errorsTa from './errors.ta.json';
import customerEn from './customer.en.json';
import customerTa from './customer.ta.json';
import commerceEn from './customer.commerce.en.json';
import commerceTa from './customer.commerce.ta.json';
import walletEn from './customer.wallet.en.json';
import walletTa from './customer.wallet.ta.json';
import ordersEn from './customer.orders.en.json';
import ordersTa from './customer.orders.ta.json';
import accountEn from './customer.account.en.json';
import accountTa from './customer.account.ta.json';
import supportEn from './customer.support.en.json';
import supportTa from './customer.support.ta.json';
import catalogEn from './customer.catalog.en.json';
import catalogTa from './customer.catalog.ta.json';
import { createI18n, LOCALES, type Locale } from './runtime';

export const en = {
  ...errorsEn,
  ...customerEn,
  ...commerceEn,
  ...walletEn,
  ...ordersEn,
  ...accountEn,
  ...supportEn,
  ...catalogEn,
};
const ta: Record<string, string> = {
  ...errorsTa,
  ...customerTa,
  ...commerceTa,
  ...walletTa,
  ...ordersTa,
  ...accountTa,
  ...supportTa,
  ...catalogTa,
};

export type TranslationKey = keyof typeof en;

export { LOCALES };
export type { Locale };

const instance = createI18n<TranslationKey>({ en, ta });

export const setLocale = instance.setLocale;
export const getLocale = instance.getLocale;
export const t = instance.t;
export const missingKeys = instance.missingKeys;
export const fontFamilyForLocale = instance.fontFamilyForLocale;
