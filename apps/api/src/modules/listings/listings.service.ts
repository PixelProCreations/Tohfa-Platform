import { greaterThan, isMoney, parseMoney, ZERO, type Money } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { beginIdempotent, idempotencyStore, requireIdempotencyKey, type IdempotencyStore } from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { LISTING_QUALIFYING_CERT_TYPES } from '../certifications/certifications.schema.js';
import { listingsRepo, type ListingRollup, type ListingRow } from './listings.repo.js';
import type { CreateListingBody, ListListingsQuery, UpdateListingBody } from './listings.schema.js';

/**
 * A client-supplied price as exact Money (integer paise underneath — see
 * packages/shared-types/src/money.ts), or a 422. Never `Number(x) * 100`: the
 * float turned "1.005" into 100 paise, so it passed a 1.00 ceiling (BR-07) and
 * NUMERIC(12,2) then stored 1.01. Sub-paise digits are refused, not rounded.
 * Positive only, like the `price_per_kg > 0` CHECK and wallet.service's amount
 * gate, so a bad value is a 422 here instead of a 500 from the INSERT.
 */
function requirePositivePrice(value: string, field: string): Money {
  if (!isMoney(value) || !greaterThan(parseMoney(value), ZERO)) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: 'Price must be a positive amount with at most 2 decimal places.',
      errors: { [`body.${field}`]: ['Must be a positive amount with at most 2 decimal places.'] },
    });
  }
  return parseMoney(value);
}

export function getTodayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export class ListingsService {
  constructor(
    private readonly repo = listingsRepo,
    private readonly runTx: TransactionRunner = withTransaction,
    private readonly dbPool: Executor = pool,
    private readonly idempotency: IdempotencyStore = idempotencyStore,
  ) {}

  private async resolveFarmer(db: Executor, actor: Actor): Promise<{ id: string; userId: string; isMarketBlocked: boolean }> {
    let farmer = actor.farmerId ? await this.repo.findFarmerById(db, actor.farmerId) : null;
    if (!farmer) {
      farmer = await this.repo.findFarmerByUserId(db, actor.userId);
    }

    if (!farmer) {
      throw new AppError('FORBIDDEN', {
        detail: 'Authenticated user is not registered as an approved farmer.',
      });
    }

    return farmer;
  }

  async createListing(
    actor: Actor,
    _scope: ResolvedScope,
    body: CreateListingBody,
    idempotencyKey?: string,
  ): Promise<ListingRow> {
    // BR-68: a missing key is refused before anything else runs, and a replay
    // returns the original listing before the gates below are re-evaluated (a
    // retry after the certificate expired must not turn a created listing into
    // an error).
    const key = requireIdempotencyKey(idempotencyKey);
    return this.runTx(async (client) => {
      const idem = await beginIdempotent<ListingRow>(this.idempotency, client, {
        actorUserId: actor.userId,
        key,
        operation: 'listing.create',
        request: body,
      });
      if (idem.replay) return idem.response;

      const farmer = await this.resolveFarmer(client, actor);

      // Gate 1: certificate eligibility (BR-01, BR-02). Decided for the FARMER,
      // not per certificate: one verified, unexpired PGS/NPOP certificate is
      // enough, and an expired old certificate or a pending renewal next to it
      // must never block (the old per-row check did exactly that). Only when
      // nothing qualifies does the code name the way back: verification if an
      // unexpired certificate is waiting for it, renewal if one has expired,
      // otherwise adding a certificate. Only the qualifying types are asked
      // about, so an OTHER certificate never names the way back either (BR-02i).
      const certs = await this.repo.getListingCertEligibility(
        client,
        farmer.id,
        getTodayKolkata(),
        LISTING_QUALIFYING_CERT_TYPES,
      );

      if (!certs.eligible) {
        if (certs.pendingCert) {
          throw new AppError('CERT_UNVERIFIED', {
            status: 422,
            detail: `Certificate ${certs.pendingCert.certNumber} is pending verification.`,
          });
        }

        if (certs.expiredCert) {
          throw new AppError('CERT_EXPIRED', {
            status: 422,
            detail: `${certs.expiredCert.certType} certificate ${certs.expiredCert.certNumber} expired on ${certs.expiredCert.expiresOn}.`,
          });
        }

        // No PGS/NPOP certificate at all (none, or only OTHER ones), or only
        // unexpired REJECTED ones. Refused here
        // rather than left to the materialised is_market_blocked flag below:
        // that flag is a cache, and a stale `false` (seeded or not yet
        // recomputed) used to let such a farmer list. BR-02; docs/rules.md
        // "Open contradictions" #14, resolved 2026-10-05.
        throw new AppError('CERT_MISSING', {
          status: 422,
          detail: 'No verified PGS or NPOP certificate on file. Add one and have it verified to list produce.',
        });
      }

      // Kept after Gate 1 on purpose: the materialised flag is still honoured
      // on its own (e.g. a block a recompute has not yet cleared). Removing
      // this check is a separate decision.
      if (farmer.isMarketBlocked) {
        throw new AppError('CERT_EXPIRED', {
          status: 422,
          detail: 'Farmer market access is currently blocked.',
        });
      }

      // Gate 2: Free-tier Listing Limit Gate (BR-14a, BR-14b)
      const limitsEnabled = await this.repo.getSystemConfig(client, 'free_tier_limits_enabled');
      if (limitsEnabled === true || limitsEnabled === 'true') {
        const limitVal = await this.repo.getSystemConfig(client, 'free_tier_listing_limit');
        const limit = typeof limitVal === 'number' ? limitVal : parseInt(String(limitVal ?? '5'), 10);
        const activeCount = await this.repo.countActiveListings(client, farmer.id);

        if (activeCount >= limit) {
          throw new AppError('FREE_TIER_LIMIT', {
            status: 422,
            detail: `You have reached your active listing limit of ${limit}.`,
          });
        }
      }

      // Gate 3: Reject Grade is Not Sellable
      if (body.grade === 'REJECT') {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Produce of grade REJECT may not be listed for sale.',
        });
      }

      // Gate 4: Fair Price Ceiling Check (BR-07a, BR-07b, BR-07c)
      const effectiveDate = body.availableFrom || getTodayKolkata();
      const ceiling = await this.repo.findEffectiveFairPrice(
        client,
        body.cropId,
        body.grade,
        effectiveDate,
      );

      if (!ceiling) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: `No fair price ceiling in effect for this crop and grade on ${effectiveDate}.`,
        });
      }

      const asking = requirePositivePrice(body.askingPricePerKg, 'askingPricePerKg');

      if (greaterThan(asking, parseMoney(ceiling.ceilingPrice))) {
        throw new AppError('PRICE_ABOVE_CEILING', {
          status: 422,
          detail: `Asking price ₹${body.askingPricePerKg} exceeds fair price ceiling of ₹${ceiling.ceilingPrice}.`,
          meta: {
            ceilingPrice: ceiling.ceilingPrice,
            attemptedPrice: body.askingPricePerKg,
          },
        });
      }

      // Generate Listing Number and Insert Row with Frozen Certification Badges
      const listingNumber = await this.repo.generateListingNumber(client);

      const listing = await this.repo.insertListing(client, {
        listingNumber,
        farmerId: farmer.id,
        farmId: body.farmId,
        cropId: body.cropId,
        grade: body.grade,
        quantityKg: body.quantityKg,
        askingPricePerKg: body.askingPricePerKg,
        fairPriceId: ceiling.id,
        availableFrom: body.availableFrom,
        photos: body.photos,
        certificationBadges: certs.qualifyingBadges,
      });

      await idem.complete(listing);
      return listing;
    });
  }

  async listMyListings(
    actor: Actor,
    _scope: ResolvedScope,
    query: ListListingsQuery,
  ): Promise<{
    items: ListingRow[];
    rollup: ListingRollup;
    page: { nextCursor: string | null; hasMore: boolean };
  }> {
    const farmer = await this.resolveFarmer(this.dbPool, actor);

    const [listingsResult, rollup] = await Promise.all([
      this.repo.listFarmerListings(this.dbPool, farmer.id, {
        status: query.status,
        cursor: query.cursor,
        limit: query.limit,
      }),
      this.repo.getRollupSummary(this.dbPool, farmer.id),
    ]);

    return {
      items: listingsResult.items,
      rollup,
      page: {
        nextCursor: listingsResult.nextCursor,
        hasMore: listingsResult.hasMore,
      },
    };
  }

  async updateListing(
    actor: Actor,
    _scope: ResolvedScope,
    id: string,
    body: UpdateListingBody,
  ): Promise<ListingRow> {
    return this.runTx(async (client) => {
      const farmer = await this.resolveFarmer(client, actor);
      const existing = await this.repo.findListingById(client, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', {
          detail: 'Listing not found.',
        });
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `Only listings in PENDING_APPROVAL status may be edited (current status: ${existing.status}).`,
        });
      }

      // If asking price is being modified, re-validate against ceiling
      if (body.askingPricePerKg !== undefined) {
        const asking = requirePositivePrice(body.askingPricePerKg, 'askingPricePerKg');
        const effectiveDate = body.availableFrom || existing.availableFrom || getTodayKolkata();
        const ceiling = await this.repo.findEffectiveFairPrice(
          client,
          existing.cropId,
          existing.grade,
          effectiveDate,
        );

        if (ceiling) {
          if (greaterThan(asking, parseMoney(ceiling.ceilingPrice))) {
            throw new AppError('PRICE_ABOVE_CEILING', {
              status: 422,
              detail: `Asking price ₹${body.askingPricePerKg} exceeds fair price ceiling of ₹${ceiling.ceilingPrice}.`,
              meta: {
                ceilingPrice: ceiling.ceilingPrice,
                attemptedPrice: body.askingPricePerKg,
              },
            });
          }
        }
      }

      const version = body.version ?? existing.version;
      const updated = await this.repo.updateListing(client, id, version, body);

      if (!updated) {
        throw new AppError('CONFLICT', {
          detail: 'The listing was modified by another request. Please refresh and try again.',
        });
      }

      return updated;
    });
  }

  async withdrawListing(
    actor: Actor,
    _scope: ResolvedScope,
    id: string,
    version?: number,
    idempotencyKey?: string,
  ): Promise<ListingRow> {
    const key = requireIdempotencyKey(idempotencyKey);
    return this.runTx(async (client) => {
      // BR-68: a replay returns the original body, not LISTING_NOT_PENDING.
      const idem = await beginIdempotent<ListingRow>(this.idempotency, client, {
        actorUserId: actor.userId,
        key,
        operation: 'listing.withdraw',
        request: { id, version },
      });
      if (idem.replay) return idem.response;

      const farmer = await this.resolveFarmer(client, actor);
      const existing = await this.repo.findListingById(client, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', {
          detail: 'Listing not found.',
        });
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `Only listings in PENDING_APPROVAL status may be withdrawn (current status: ${existing.status}).`,
        });
      }

      const ver = version ?? existing.version;
      const withdrawn = await this.repo.withdrawListing(client, id, ver);

      if (!withdrawn) {
        throw new AppError('CONFLICT', {
          detail: 'The listing was modified by another request. Please refresh and try again.',
        });
      }

      await idem.complete(withdrawn);
      return withdrawn;
    });
  }
}

export const listingsService = new ListingsService();
