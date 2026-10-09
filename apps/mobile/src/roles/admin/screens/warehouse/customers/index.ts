// Shared Main/Sub warehouse customer screens. Explicit exports only (no `export *`),
// mirroring finance-expenses/index.ts so type names can never clash across barrels.
export { CustomerSearchScreen, type CustomerSearchScreenProps } from './CustomerSearchScreen';
export type { CustomerSearchItem } from './types';
