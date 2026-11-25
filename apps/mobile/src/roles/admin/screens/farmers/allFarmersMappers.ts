/**
 * Maps the live farmer / application rows (api/farmerMappers.ts) onto the
 * design port's list items (AdminAllFarmersScreen). The rule is the one in
 * api/pricingMappers.ts: what the API sends is shown as sent, what it does not
 * send is the dash (ADMIN_NO_VALUE) or an absent field, NEVER a guess.
 *
 * Why this is strict: these cards sit beside real names. A farmer painted
 * "KYC Verified" with a Verified certificate and an Active · Paid subscription
 * regardless of the truth reads as fully compliant, and an admin could act on
 * it. So:
 *   - KYC is the server's kycStatus (Verified / Pending / Rejected), nothing else.
 *   - There is no certification, subscription, farming-type, farm-name or Aadhaar
 *     value in the list API, so those fields are left off the item; the screen
 *     draws the dash. The certificate filter therefore matches nothing today.
 *   - The rating is the 0-100 score (BR-06) or null. The design's 0-5 star figure
 *     has no source and is not derived.
 *   - An application's Aadhaar is only ever the last four digits the server sent
 *     (BR-33b), in the masked form.
 * Pure (no React), so plain-Node vitest covers it.
 */
import type { ApplicationRowView, FarmerRowView } from '../../api/farmerTypes';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import type { ApplicationListItem, FarmerListItem } from './AdminAllFarmersScreen';

/** The day in the design's "25 Sep 2026" form, or the dash when the instant is missing or unreadable. */
function dayOrDash(iso: string | null): string {
  if (iso === null) return ADMIN_NO_VALUE;
  const day = formatAdminDay(iso);
  return day === '' ? ADMIN_NO_VALUE : day;
}

export function toDesignFarmerItem(row: FarmerRowView): FarmerListItem {
  const memberSince = dayOrDash(row.registeredAt);
  return {
    id: row.id,
    name: row.name,
    code: row.farmerCode,
    farmerId: row.farmerCode,
    initials: row.initials,
    location: row.zoneName ?? ADMIN_NO_VALUE,
    ...(row.zoneName === null ? {} : { zone: row.zoneName }),
    status: row.accountStatus,
    rating: row.overallRating,
    ...(row.ratingTierLabel === null ? {} : { ratingTier: row.ratingTierLabel }),
    mobile: row.mobile,
    ...(memberSince === ADMIN_NO_VALUE ? {} : { memberSince }),
    kycVerifiedText: t(`farmersList.kyc.${row.kycStatus}`),
  };
}

/**
 * The card's four labels. DOCS_REVIEW is a review stage, not a request for a
 * correction; only INFO_REQUESTED is (the same reading as the live list).
 */
function applicationStatusLabel(status: ApplicationRowView['status']): ApplicationListItem['status'] {
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'INFO_REQUESTED') return 'Correction Required';
  return 'Pending';
}

export function toDesignApplicationItem(row: ApplicationRowView): ApplicationListItem {
  const place = [row.village, row.district].filter((p): p is string => p !== null && p !== '').join(', ');
  const acres = row.statedAreaAcres === null ? ADMIN_NO_VALUE : t('farmersList.applications.farmSize', { acres: row.statedAreaAcres });
  return {
    id: row.id,
    name: row.name,
    applicantName: row.name,
    code: row.applicationCode ?? ADMIN_NO_VALUE,
    status: applicationStatusLabel(row.status),
    phone: row.mobile,
    address: place === '' ? ADMIN_NO_VALUE : place,
    zone: row.district ?? ADMIN_NO_VALUE,
    farmingType: row.farmingType ?? ADMIN_NO_VALUE,
    crops: row.primaryCrops.length === 0 ? ADMIN_NO_VALUE : row.primaryCrops.join(', '),
    submittedDate: dayOrDash(row.submittedAt ?? row.createdAt),
    // The list sends no KYC status for an application, and documentsComplete is not one.
    kycStatus: row.kycStatus ?? ADMIN_NO_VALUE,
    farmSize: acres,
    soilType: ADMIN_NO_VALUE,
    landArea: acres,
    fmbSketch: ADMIN_NO_VALUE,
    reviewNotes: ADMIN_NO_VALUE,
    identityProofNumber:
      row.aadhaarLast4 === null ? ADMIN_NO_VALUE : t('farmersList.applications.aadhaarMasked', { last4: row.aadhaarLast4 }),
    identityProofStatus: row.documentsComplete === null ? null : row.documentsComplete ? 'Verified' : 'Pending',
  };
}

/** BR-06: the 0-100 score as the server sent it, or the dash for a farmer never rated. */
export function ratingText(farmer: FarmerListItem): string {
  return farmer.rating === null || farmer.rating === undefined
    ? ADMIN_NO_VALUE
    : t('farmersList.card.ratingValue', { score: farmer.rating });
}

/** The account status as the server has it: a pending account is not shown as inactive or disabled. */
export function statusLabelKey(status: FarmerListItem['status']): TranslationKey {
  if (status === 'ACTIVE') return 'farmersList.status.active';
  if (status === 'PENDING') return 'farmersList.status.pending';
  return 'farmersList.status.disabled';
}
