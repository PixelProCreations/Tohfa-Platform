/**
 * Maps a live farmer row (api/farmerMappers.ts) and that farmer's certificate
 * records (GET /admin/certifications) onto a Verification & Compliance card.
 * The rule is the one in allFarmersMappers.ts / api/pricingMappers.ts: what the
 * API sends is shown as sent, what it does not send is the dash
 * (ADMIN_NO_VALUE), NEVER a guess.
 *
 * Why this is strict: this card sits beside a real farmer's name and carries
 * KYC, certification and audit status. It used to say "Verified" for every
 * ACTIVE account (account status and KYC are different things), a
 * "PGS-India / Organic" certificate expiring 2027-12-31 for everyone, and an
 * audit "Completed" for everyone. An admin could act on that. So:
 *   - KYC is the server's kycStatus, nothing derived from the account status.
 *   - The certificate is the farmer's own record, or "no certificate" when the
 *     server says there is none, or the dash while that is unknown (loading,
 *     failed, or the admin lacks certification.view).
 *   - The internal audit has no per-farmer join (listAudits / getAuditCompliance
 *     are not read per farmer here) and "last updated" has no source: both dash.
 *   - The rating is the 0-100 score (BR-06) or the dash. The design's 0-5 star
 *     figure has no source and is not derived.
 * Pure (no React), so plain-Node vitest covers it.
 */
import type { CertificationDto } from '../../api/certifications';
import type { FarmerRowView } from '../../api/farmerTypes';
import { t } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

/** How a status value is coloured: success (green), danger (red), or plain ink for "not decided yet". */
export type ComplianceTone = 'success' | 'danger' | 'neutral';

export interface ComplianceFarmer {
  id: string;
  name: string;
  farmerId: string;
  zone: string;
  badge?: string | undefined;
  kycStatus: string;
  kycTone: ComplianceTone;
  certificationType: string;
  certExpiry: string;
  certStatus: string;
  certTone: ComplianceTone;
  auditStatus: string;
  ratingScore: string;
  ratingTier: string;
  lastUpdated: string;
}

/** What the certificate read knows: `enabled` is false without certification.view (nothing was asked). */
export interface CertificationReadState {
  enabled: boolean;
  isLoading: boolean;
  error: unknown;
  items: readonly CertificationDto[];
}

export interface CertificationFields {
  certificationType: string;
  certExpiry: string;
  certStatus: string;
  certTone: ComplianceTone;
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function istDay(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Past its expiry: the server's daysToExpiry when it sent one, else the YYYY-MM-DD date against today (IST). */
function isExpired(cert: CertificationDto, now: Date): boolean {
  if (cert.daysToExpiry !== undefined) return cert.daysToExpiry < 0;
  return cert.expiresOn < istDay(now);
}

/**
 * The certificate that stands for the farmer: a verified, unexpired one if
 * there is one (the one expiring last), else the one expiring last. A farmer
 * holding an old expired certificate and a current one is shown as certified.
 */
export function pickCertification(items: readonly CertificationDto[], now: Date): CertificationDto | undefined {
  let best: CertificationDto | undefined;
  let bestCurrent = false;
  for (const item of items) {
    const current = item.verificationStatus === 'VERIFIED' && !isExpired(item, now);
    if (best === undefined || (current && !bestCurrent) || (current === bestCurrent && item.expiresOn > best.expiresOn)) {
      best = item;
      bestCurrent = current;
    }
  }
  return best;
}

const UNKNOWN: CertificationFields = {
  certificationType: ADMIN_NO_VALUE,
  certExpiry: ADMIN_NO_VALUE,
  certStatus: ADMIN_NO_VALUE,
  certTone: 'neutral',
};

export function certificationFields(state: CertificationReadState, now: Date): CertificationFields {
  // Nothing is known: not asked, still in flight, or failed. "No certificate" would be a claim.
  if (!state.enabled || state.isLoading || (state.error !== null && state.error !== undefined)) return UNKNOWN;
  const cert = pickCertification(state.items, now);
  if (cert === undefined) {
    return { ...UNKNOWN, certStatus: t('superAdmin.compliance.cert.none') };
  }
  const expired = isExpired(cert, now);
  const day = formatAdminDay(cert.expiresOn);
  const type =
    cert.certType === 'OTHER' && cert.customTypeName !== null && cert.customTypeName !== ''
      ? cert.customTypeName
      : t(`superAdmin.compliance.cert.type.${cert.certType}`);
  let status: string;
  let tone: ComplianceTone;
  if (cert.verificationStatus === 'REJECTED') {
    status = t('superAdmin.compliance.cert.status.REJECTED');
    tone = 'danger';
  } else if (expired) {
    status = t('superAdmin.compliance.cert.status.EXPIRED');
    tone = 'danger';
  } else if (cert.verificationStatus === 'VERIFIED') {
    status = t('superAdmin.compliance.cert.status.VERIFIED');
    tone = 'success';
  } else {
    status = t('superAdmin.compliance.cert.status.UNVERIFIED');
    tone = 'neutral';
  }
  return { certificationType: type, certExpiry: day === '' ? ADMIN_NO_VALUE : day, certStatus: status, certTone: tone };
}

function kycTone(status: FarmerRowView['kycStatus']): ComplianceTone {
  if (status === 'VERIFIED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'neutral';
}

export function toComplianceFarmer(row: FarmerRowView, cert: CertificationFields): ComplianceFarmer {
  return {
    id: row.id,
    name: row.name,
    farmerId: row.farmerCode,
    zone: row.zoneName ?? ADMIN_NO_VALUE,
    // A server fact, not a derived label: the farmer is blocked from the market.
    ...(row.isMarketBlocked ? { badge: t('superAdmin.compliance.badge.marketBlocked') } : {}),
    kycStatus: t(`farmersList.kyc.${row.kycStatus}`),
    kycTone: kycTone(row.kycStatus),
    ...cert,
    auditStatus: ADMIN_NO_VALUE,
    // BR-06: the 0-100 score as sent.
    ratingScore: row.overallRating === null ? ADMIN_NO_VALUE : t('farmersList.card.ratingValue', { score: row.overallRating }),
    ratingTier: row.ratingTierLabel ?? ADMIN_NO_VALUE,
    lastUpdated: ADMIN_NO_VALUE,
  };
}
