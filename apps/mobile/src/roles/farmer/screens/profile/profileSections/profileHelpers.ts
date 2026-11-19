import { evalCertificateWarning, type Certification } from '../../../api/farmer';
import { shortMonthKey, type AuditTier, type AuditType } from '../../../api/audits';
import type { AuditCountdown } from '../../dashboard/dashboardWidgets';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';

export interface PersonalDetailsData {
  fullName: string;
  dob: string;
  mobile: string;
  aadhaar: string;
  yearsInOrganic: string;
  farmingType: string;
  farmName: string;
  location: string;
}

export interface FarmDetailsData {
  acres: string;
  zones: string;
  farms: string;
  fmbPts: string;
  waterSource: string;
  tags: string[];
}

/**
 * Mirrors `displayStatus` in CertificationsScreen deliberately: both screens must
 * agree on what "expiring" means, and both derive it from the server-computed
 * `daysToExpiry` plus the `certExpiryWarningDays` threshold from system config --
 * never a hardcoded window (root CLAUDE.md §2.7).
 */
export type CertDisplayStatus = 'active' | 'expiring' | 'expired';

export function certDisplayStatus(
  cert: Certification,
  warningThreshold: number,
): CertDisplayStatus {
  const warning = evalCertificateWarning(cert.daysToExpiry, warningThreshold);
  if (warning.isExpired) return 'expired';
  if (warning.isWarning) return 'expiring';
  return 'active';
}

export const CERT_TONE: Record<
  CertDisplayStatus,
  { bg: string; border: string; fg: string; labelKey: TranslationKey }
> = {
  active: {
    bg: P.certCardBg,
    border: P.sageTintBg,
    fg: colors.brandGreen,
    labelKey: 'farmer.profile.stats.certValid',
  },
  expiring: {
    bg: P.warnCardBg,
    border: P.warnCardBorder,
    fg: P.orange900,
    labelKey: 'farmer.profile.cert.expiring',
  },
  expired: {
    bg: P.red50,
    border: P.orange400,
    fg: P.red800,
    labelKey: 'farmer.certifications.expired',
  },
};

/** The 3 fixed farming-type codes this screen's chip picker offers. */
export const FARMING_TYPE_CODES = ['ORGANIC', 'NATURAL', 'BIODYNAMIC'] as const;
type FarmingTypeCode = (typeof FARMING_TYPE_CODES)[number];

export function isFarmingTypeCode(value: string): value is FarmingTypeCode {
  return (FARMING_TYPE_CODES as readonly string[]).includes(value);
}

/** Translated label for a farming-type code. An empty/unrecognised value (nothing picked
 * yet -- this field has no backing API read, see `fetchProfile` below) renders as blank
 * rather than a raw code or a missing-key fallback string. */
export function farmingTypeLabel(code: string): string {
  return isFarmingTypeCode(code) ? t(`farmer.profile.farmingType.${code}` as TranslationKey) : '';
}

/** Translated label for a farm's `landBoundaryContext` tag code, falling back to the raw
 * code (humanised) for anything outside the 7 known values -- see `loadFarms` below. */
export function farmTagLabel(code: string): string {
  switch (code) {
    case 'stand_alone':
      return t('farmer.profile.farm.tag.standAlone');
    case 'lower_hill':
      return t('farmer.profile.farm.tag.lowerHill');
    case 'forest_boundaries':
      return t('farmer.profile.farm.tag.forest');
    case 'upper_hill':
      return t('farmer.profile.farm.tag.upperHill');
    case 'forest_fire':
      return t('farmer.profile.farm.tag.forestFire');
    case 'wildlife_zone':
      return t('farmer.profile.farm.tag.wildlife');
    case 'chemical_sprayed':
      return t('farmer.profile.farm.tag.chemicalSprayed');
    default:
      return code.replace(/_/g, ' ');
  }
}

/** 'en-GB' short date (e.g. "20 Apr 2026") for a real server date -- never a
 *  hardcoded sample date. Shared by the Audits and Soil Test cards below. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function auditTypeKey(auditType: AuditType): TranslationKey {
  return auditType === 'EXTERNAL'
    ? 'farmer.profile.audits.external'
    : 'farmer.profile.audits.internal';
}

/** Dot/score colour from the audit's real tier (BR-04a) -- never a guessed pass/fail. */
export function auditToneColor(tier: AuditTier | null): string {
  if (tier === 'POOR') return P.red800;
  if (tier === 'MODERATE') return P.orange800;
  if (tier === 'GOOD' || tier === 'EXCELLENT') return colors.brandGreen;
  return P.slate400;
}

/**
 * Same countdown wording DashboardScreen's mini audit card uses (its own
 * `auditMiniValue`, not exported) -- reimplemented here against the same
 * i18n keys so the two surfaces agree, rather than inventing new copy.
 */
export function auditPillValue(countdown: AuditCountdown): string {
  switch (countdown.kind) {
    case 'none':
      return t('farmer.dashboard.header.auditNone');
    case 'inProgress':
      return t('farmer.audits.status.inProgress');
    case 'today':
      return t('farmer.dashboard.header.auditToday');
    case 'tomorrow':
      return t('farmer.dashboard.header.auditTomorrow');
    case 'inDays':
      return t('farmer.profile.daysShort', { days: countdown.days });
    case 'past':
      return t('farmer.dashboard.header.auditDate', {
        day: countdown.day,
        month: t(shortMonthKey(countdown.monthIndex) as TranslationKey),
      });
    case 'unknown':
      return '—';
  }
}

/** Bar/score colour for one farm-rating category, from its 0-10 score (null = not yet rated). */
export function ratingBarColor(score: number | null): string {
  return score === null
    ? P.slate300
    : score >= 8
      ? colors.brandGreen
      : score >= 6
        ? P.green700
        : score >= 4
          ? P.orange700
          : P.red600;
}

/** Extra touch area around the small text-link action on each Profile card header. */
export const CARD_ACTION_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
