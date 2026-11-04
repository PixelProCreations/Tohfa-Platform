/**
 * Pure API-record -> display mapping for AnimalDetailScreen's five tabs.
 * Everything a row shows comes from a real record field or is derived from
 * real records (the breeding cycle number is 1 + the animal's CALVING records,
 * see `breedingCycleNumber`); where the API has no honest source (a sparkline
 * with fewer than two days of yield), the view returns nothing and the screen
 * hides it.
 */
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import type {
  AnimalGender,
  BreedingMethod,
  CalvingOutcome,
  CheckupType,
  FeedLogUnit,
  FeedType,
  GrazingDurationUnit,
  HousingSpaceStandard,
  InseminationType,
  LivestockBreedingRecord,
  LivestockFeedPlan,
  LivestockHealthRecord,
  LivestockHousingListItem,
  Measured,
  PregnancyResult,
  SpaceUnit,
  WaterSource,
} from '../../../api/livestock';

// ── Dates ───────────────────────────────────────────────────────────────────

const MONTH_KEYS: readonly TranslationKey[] = [
  'farmer.audits.monthShort.jan',
  'farmer.audits.monthShort.feb',
  'farmer.audits.monthShort.mar',
  'farmer.audits.monthShort.apr',
  'farmer.audits.monthShort.may',
  'farmer.audits.monthShort.jun',
  'farmer.audits.monthShort.jul',
  'farmer.audits.monthShort.aug',
  'farmer.audits.monthShort.sep',
  'farmer.audits.monthShort.oct',
  'farmer.audits.monthShort.nov',
  'farmer.audits.monthShort.dec',
];

function isoParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split('-').map((part) => parseInt(part, 10));
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/** `YYYY-MM-DD` -> "12 Jul" (translated month). */
export function formatDayMonth(iso: string): string {
  const [, m, d] = isoParts(iso);
  return `${d} ${t(MONTH_KEYS[m - 1] ?? MONTH_KEYS[0]!)}`;
}

/** `YYYY-MM-DD` -> "12 Jul 2026" (translated month). */
export function formatDayMonthYear(iso: string): string {
  const [y] = isoParts(iso);
  return `${formatDayMonth(iso)} ${y}`;
}

/** `YYYY-MM-DD` -> "12 Jul 2026" in English month abbreviations, the format RegisterAnimalScreen parses. */
export function formatRegisterFormDate(iso: string): string {
  const EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = isoParts(iso);
  return `${String(d).padStart(2, '0')} ${EN[m - 1] ?? EN[0]} ${y}`;
}

/** Local-calendar today as `YYYY-MM-DD`. */
export function localTodayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Whole days from `fromIso` to `toIso` (negative when `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = isoParts(fromIso);
  const [ty, tm, td] = isoParts(toIso);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

// ── Enum labels ─────────────────────────────────────────────────────────────

const CHECKUP_TYPE_KEYS: Record<CheckupType, TranslationKey> = {
  ROUTINE: 'farmer.livestock.detail.checkupType.ROUTINE',
  EMERGENCY: 'farmer.livestock.detail.checkupType.EMERGENCY',
  PRE_BREEDING: 'farmer.livestock.detail.checkupType.PRE_BREEDING',
  POST_CALVING: 'farmer.livestock.detail.checkupType.POST_CALVING',
  FOLLOW_UP: 'farmer.livestock.detail.checkupType.FOLLOW_UP',
};

const FEED_TYPE_KEYS: Record<FeedType, TranslationKey> = {
  GREEN_FODDER: 'farmer.livestock.detail.feedType.GREEN_FODDER',
  DRY_FODDER: 'farmer.livestock.detail.feedType.DRY_FODDER',
  CONCENTRATE_MIX: 'farmer.livestock.detail.feedType.CONCENTRATE_MIX',
  SILAGE: 'farmer.livestock.detail.feedType.SILAGE',
  MINERAL_MIXTURE: 'farmer.livestock.detail.feedType.MINERAL_MIXTURE',
  PASTURE_GRAZING: 'farmer.livestock.detail.feedType.PASTURE_GRAZING',
};

const WATER_SOURCE_KEYS: Record<WaterSource, TranslationKey> = {
  BOREWELL: 'farmer.livestock.detail.waterSource.BOREWELL',
  WELL: 'farmer.livestock.detail.waterSource.WELL',
  CANAL: 'farmer.livestock.detail.waterSource.CANAL',
  PIPED_WATER: 'farmer.livestock.detail.waterSource.PIPED_WATER',
  POND_RIVER: 'farmer.livestock.detail.waterSource.POND_RIVER',
  RAINWATER_STORAGE: 'farmer.livestock.detail.waterSource.RAINWATER_STORAGE',
};

const GRAZING_KEYS: Record<GrazingDurationUnit, TranslationKey> = {
  HOURS_PER_DAY: 'farmer.livestock.detail.grazing.HOURS_PER_DAY',
  HOURS_PER_WEEK: 'farmer.livestock.detail.grazing.HOURS_PER_WEEK',
};

const FEED_LOG_UNIT_KEYS: Record<FeedLogUnit, TranslationKey> = {
  KG: 'farmer.livestock.detail.unit.KG',
  G: 'farmer.livestock.detail.unit.G',
  BUNDLES: 'farmer.livestock.detail.unit.BUNDLES',
};

const PREGNANCY_RESULT_KEYS: Record<PregnancyResult, TranslationKey> = {
  POSITIVE: 'farmer.livestock.detail.pregnancyResult.POSITIVE',
  NEGATIVE: 'farmer.livestock.detail.pregnancyResult.NEGATIVE',
  INCONCLUSIVE: 'farmer.livestock.detail.pregnancyResult.INCONCLUSIVE',
};

const BREEDING_METHOD_KEYS: Record<BreedingMethod, TranslationKey> = {
  ARTIFICIAL_INSEMINATION: 'farmer.livestock.detail.breedingMethod.ARTIFICIAL_INSEMINATION',
  NATURAL_SERVICE: 'farmer.livestock.detail.breedingMethod.NATURAL_SERVICE',
  EMBRYO_TRANSFER: 'farmer.livestock.detail.breedingMethod.EMBRYO_TRANSFER',
};

const INSEMINATION_TYPE_KEYS: Record<InseminationType, TranslationKey> = {
  ARTIFICIAL: 'farmer.livestock.detail.breedingMethod.ARTIFICIAL_INSEMINATION',
  NATURAL: 'farmer.livestock.detail.breedingMethod.NATURAL_SERVICE',
};

const CALVING_OUTCOME_KEYS: Record<CalvingOutcome, TranslationKey> = {
  LIVE_BIRTH: 'farmer.livestock.detail.calvingOutcome.LIVE_BIRTH',
  STILLBIRTH: 'farmer.livestock.detail.calvingOutcome.STILLBIRTH',
  OTHER: 'farmer.livestock.detail.calvingOutcome.OTHER',
};

const GENDER_KEYS: Record<AnimalGender, TranslationKey> = {
  FEMALE: 'farmer.livestock.detail.gender.FEMALE',
  MALE: 'farmer.livestock.detail.gender.MALE',
};

const SPACE_UNIT_KEYS: Record<SpaceUnit, TranslationKey> = {
  SQ_FT: 'farmer.livestock.detail.spaceUnit.SQ_FT',
  SQ_M: 'farmer.livestock.detail.spaceUnit.SQ_M',
  ACRES: 'farmer.livestock.detail.spaceUnit.ACRES',
};

/** Every key this module can resolve — for the i18n parity test. */
export const VIEW_I18N_KEYS: readonly TranslationKey[] = [
  ...MONTH_KEYS,
  ...Object.values(CHECKUP_TYPE_KEYS),
  ...Object.values(FEED_TYPE_KEYS),
  ...Object.values(WATER_SOURCE_KEYS),
  ...Object.values(GRAZING_KEYS),
  ...Object.values(FEED_LOG_UNIT_KEYS),
  ...Object.values(PREGNANCY_RESULT_KEYS),
  ...Object.values(BREEDING_METHOD_KEYS),
  ...Object.values(CALVING_OUTCOME_KEYS),
  ...Object.values(GENDER_KEYS),
  ...Object.values(SPACE_UNIT_KEYS),
];

export const feedTypeLabel = (v: FeedType): string => t(FEED_TYPE_KEYS[v]);
export const spaceUnitLabel = (v: SpaceUnit): string => t(SPACE_UNIT_KEYS[v]);

export function grazingLabel(g: Measured<GrazingDurationUnit>): string {
  return t(GRAZING_KEYS[g.unit], { value: g.value });
}

export function feedLogAmount(quantity: number, unit: FeedLogUnit): string {
  return `${quantity} ${t(FEED_LOG_UNIT_KEYS[unit])}`;
}

// ── Health tab ──────────────────────────────────────────────────────────────

export interface HealthRow {
  id: string;
  title: string;
  subtitle: string;
  /** "Next 10 Oct" from a stored nextDueDate — display only; nothing is scheduled from it (BR-38). */
  nextBadge: string | null;
}

export interface CheckupRow {
  id: string;
  kind: 'CHECKUP' | 'TREATMENT';
  title: string;
  doctor: string;
  description: string;
}

export interface HealthSections {
  vaccinations: HealthRow[];
  dewormings: HealthRow[];
  checkups: CheckupRow[];
}

/** One newest-first health list split into the tab's three sections (the API filters one recordType at a time). */
export function splitHealthRecords(records: readonly LivestockHealthRecord[]): HealthSections {
  const sections: HealthSections = { vaccinations: [], dewormings: [], checkups: [] };
  for (const record of records) {
    switch (record.recordType) {
      case 'VACCINATION':
        sections.vaccinations.push({
          id: record.id,
          title: record.vaccineName,
          subtitle: t('farmer.livestock.detail.health.given', { date: formatDayMonth(record.recordDate) }),
          nextBadge: record.nextDueDate
            ? t('farmer.livestock.detail.health.next', { date: formatDayMonth(record.nextDueDate) })
            : null,
        });
        break;
      case 'DEWORMING':
        sections.dewormings.push({
          id: record.id,
          title: record.productName,
          subtitle: t('farmer.livestock.detail.health.given', { date: formatDayMonth(record.recordDate) }),
          nextBadge: record.nextDueDate
            ? t('farmer.livestock.detail.health.next', { date: formatDayMonth(record.nextDueDate) })
            : null,
        });
        break;
      case 'CHECKUP':
        sections.checkups.push({
          id: record.id,
          kind: 'CHECKUP',
          title: t('farmer.livestock.detail.health.rowTitle', {
            name: t(CHECKUP_TYPE_KEYS[record.checkupType]),
            date: formatDayMonth(record.recordDate),
          }),
          doctor: record.veterinarian,
          description: record.diagnosis ?? record.findings ?? record.symptoms ?? record.notes ?? '',
        });
        break;
      case 'TREATMENT':
        sections.checkups.push({
          id: record.id,
          kind: 'TREATMENT',
          title: t('farmer.livestock.detail.health.rowTitle', {
            name: record.condition,
            date: formatDayMonth(record.recordDate),
          }),
          doctor: record.prescribedBy ?? record.administeredBy ?? '',
          description: record.description,
        });
        break;
    }
  }
  return sections;
}

// ── Breeding tab ────────────────────────────────────────────────────────────

export interface CurrentCycleView {
  /** Latest HEAT / INSEMINATION; null when none is recorded. */
  bred: { date: string; method: string } | null;
  /** Latest PREGNANCY_CHECK on/after `bred` (an older check belongs to a previous cycle). */
  statusLabel: string;
  isPregnant: boolean;
  expectedDelivery: { date: string; countdown: string } | null;
}

export function deriveCurrentCycle(
  records: readonly LivestockBreedingRecord[],
  todayIso: string,
): CurrentCycleView | null {
  // The list is newest first (recordDate DESC, created_at DESC), so the first match is the latest.
  const service = records.find((r) => r.recordType === 'HEAT' || r.recordType === 'INSEMINATION');
  const check = records.find(
    (r) => r.recordType === 'PREGNANCY_CHECK' && (service === undefined || r.recordDate >= service.recordDate),
  );
  if (service === undefined && check === undefined) return null;

  let bred: CurrentCycleView['bred'] = null;
  if (service?.recordType === 'HEAT') {
    bred = { date: formatDayMonth(service.recordDate), method: t(BREEDING_METHOD_KEYS[service.breedingMethod]) };
  } else if (service?.recordType === 'INSEMINATION') {
    bred = { date: formatDayMonth(service.recordDate), method: t(INSEMINATION_TYPE_KEYS[service.inseminationType]) };
  }

  if (check?.recordType !== 'PREGNANCY_CHECK') {
    return { bred, statusLabel: t('farmer.livestock.detail.breeding.awaitingCheck'), isPregnant: false, expectedDelivery: null };
  }
  let expectedDelivery: CurrentCycleView['expectedDelivery'] = null;
  if (check.result === 'POSITIVE' && check.expectedDeliveryDate) {
    const days = daysBetween(todayIso, check.expectedDeliveryDate);
    const countdown =
      days < 0
        ? t('farmer.livestock.detail.breeding.overdue')
        : days < 60
          ? t('farmer.livestock.detail.breeding.daysAway', { count: days })
          : t('farmer.livestock.detail.breeding.monthsAway', { count: Math.floor(days / 30) });
    expectedDelivery = { date: formatDayMonthYear(check.expectedDeliveryDate), countdown };
  }
  return {
    bred,
    statusLabel: t(PREGNANCY_RESULT_KEYS[check.result]),
    isPregnant: check.result === 'POSITIVE',
    expectedDelivery,
  };
}

/**
 * The current breeding cycle's number, derived honestly from the records:
 * every CALVING record closes one cycle, so the current cycle is
 * 1 + (number of CALVING records). No calving yet = cycle 1.
 *
 * The breeding list is cursor-paginated (newest first). While older pages are
 * still unloaded (`hasMore`), a calving may sit on them and the count would be
 * low, so this returns null and the screen shows no number until the whole
 * list is loaded ("Show more" until hasMore is false).
 */
export function breedingCycleNumber(records: readonly LivestockBreedingRecord[], hasMore: boolean): number | null {
  if (hasMore) return null;
  return 1 + records.filter((r) => r.recordType === 'CALVING').length;
}

export interface CalvingRow {
  id: string;
  recordDate: string;
  title: string;
  description: string;
  offspringGender: AnimalGender | null;
  canRegisterOffspring: boolean;
}

export function calvingRows(records: readonly LivestockBreedingRecord[]): CalvingRow[] {
  const rows: CalvingRow[] = [];
  for (const r of records) {
    if (r.recordType !== 'CALVING') continue;
    const parts = [
      t(CALVING_OUTCOME_KEYS[r.outcome]),
      t('farmer.livestock.detail.calving.offspringCount', { count: r.offspringCount }),
    ];
    if (r.offspringGender) parts.push(t(GENDER_KEYS[r.offspringGender]));
    if (r.offspringName) parts.push(r.offspringName);
    rows.push({
      id: r.id,
      recordDate: r.recordDate,
      title: r.calvingTime
        ? t('farmer.livestock.detail.calving.deliveredAt', { date: formatDayMonthYear(r.recordDate), time: r.calvingTime })
        : t('farmer.livestock.detail.calving.delivered', { date: formatDayMonthYear(r.recordDate) }),
      description: parts.join(' · '),
      offspringGender: r.offspringGender,
      canRegisterOffspring: r.outcome === 'LIVE_BIRTH' && r.offspringCount > 0,
    });
  }
  return rows;
}

// ── Feed tab ────────────────────────────────────────────────────────────────

export interface FeedReferenceView {
  feedType: string;
  source: string | null;
  grazing: string | null;
  waterSource: string;
}

export function feedReferenceView(plan: LivestockFeedPlan): FeedReferenceView {
  return {
    feedType: plan.planName ? `${feedTypeLabel(plan.feedType)} · ${plan.planName}` : feedTypeLabel(plan.feedType),
    source: plan.source,
    grazing: plan.grazingDuration ? grazingLabel(plan.grazingDuration) : null,
    waterSource: t(WATER_SOURCE_KEYS[plan.waterSource]),
  };
}

// ── Housing tab (BR-141) ────────────────────────────────────────────────────

export type HousingVerdict = 'meets' | 'below' | 'notRecorded';

export interface HousingStandardView {
  /** The server's threshold, e.g. "12.5" — never a client constant; null while the server has none configured. */
  value: string | null;
  /** Unit label of the threshold (the server states it in sq.ft per animal). */
  unit: string;
  /** From the current record's server-computed `meetsIndoorSpaceStandard`; no client-side comparison. */
  verdict: HousingVerdict;
}

/**
 * `current` is the newest-startDate housing record (page one, limit 1) or
 * undefined when none is recorded. The verdict is the server's (it converts
 * SQ_M / ACRES exactly); one standard applies to every species (BR-141).
 */
export function housingStandardView(
  current: LivestockHousingListItem | undefined,
  standard: HousingSpaceStandard | null,
): HousingStandardView {
  return {
    value: standard === null ? null : formatQuantity(standard.minIndoorSqFtPerAnimal),
    unit: spaceUnitLabel('SQ_FT'),
    // A null server verdict (no standard configured) is neither "meets" nor "below": no banner.
    verdict:
      current === undefined || current.meetsIndoorSpaceStandard === null
        ? 'notRecorded'
        : current.meetsIndoorSpaceStandard
          ? 'meets'
          : 'below',
  };
}

/** Drops float noise from a stored numeric (the server keeps at most 3 decimals). */
export function formatQuantity(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
