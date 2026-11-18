/**
 * BR-16 / BR-97 for customer-authored free text (support tickets, reviews).
 *
 * A customer-facing surface must never carry a farmer identity (farmer name, id or code, farm name,
 * village, survey number, GPS, batch code, mobile). The identity list is the one the admin customer
 * support module already builds (`customersRepo.farmerIdentityTerms`) for the farmers whose batches
 * reached this customer; the matcher is the BR-97 redactor from `customers.policy.ts`. One
 * definition of "what names a farmer" for both apps.
 */
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { buildRedactor, type Redactor } from '../customers/customers.policy.js';
import { customersRepo } from '../customers/customers.repo.js';

export type FarmerIdentityLookup = (
  db: Executor,
  customerId: string,
  orderIds: string[],
) => Promise<{ terms: string[]; personNames: string[]; phones?: string[] }>;

export async function buildFarmerRedactor(
  db: Executor,
  customerId: string,
  orderIds: string[],
  lookup: FarmerIdentityLookup = (d, c, o) => customersRepo.farmerIdentityTerms(d, c, o),
): Promise<Redactor> {
  const identity = await lookup(db, customerId, orderIds);
  return buildRedactor(identity.terms, identity.personNames, { phones: identity.phones ?? [] });
}

/**
 * Refuse (422, never silently rewrite: the author must know) text that names a farmer or farm.
 * `fields` maps a dotted request path to its text; undefined and null values are skipped.
 */
export function refuseFarmerIdentity(redactor: Redactor, fields: Record<string, string | null | undefined>): void {
  const offending: Record<string, string[]> = {};
  for (const [path, text] of Object.entries(fields)) {
    if (typeof text === 'string' && redactor.matches(text)) {
      offending[path] = ['Must not name a farmer, farm, village or location.'];
    }
  }
  if (Object.keys(offending).length > 0) {
    throw new AppError('VALIDATION_FAILED', {
      detail: 'The text names a farmer or farm. Remove it before sending (BR-97, BR-16).',
      errors: offending,
    });
  }
}
