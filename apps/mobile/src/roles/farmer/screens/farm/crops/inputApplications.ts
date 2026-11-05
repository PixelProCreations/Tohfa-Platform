import { useCallback, useEffect, useRef, useState } from 'react';
import { format, parseMoney, type Money } from '@tohfa/shared-types';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import {
  listAllActiveFarmCrops,
  listCropInputs,
  listFarmCropInputs,
  type CropInputResponse,
  type CropInputType,
  type CropInputUnit,
  type FarmCropInputResponse,
} from '../../../api/crops';
import { getFarms, getPlots, type Plot } from '../../../api/farms';
import {
  listPestTreatmentLogs,
  listPestTreatmentReminders,
  type PestTreatmentLog,
  type PestTreatmentReminder,
} from '../../../api/pest';
import { shortMonthKey } from '../../../api/audits';
import { todayInKolkata } from '../../certifications/certificationForm';

/**
 * One "input application" row for Input Management (FR-F05) and its history
 * screen, built from the two real write paths the farmer app has:
 *
 *  - `crop_inputs` (BR-56) — what LogFertigationScreen / AddInputApplied POST.
 *    Has a cost (`costInr`, a 2dp decimal string) and an `inputType`.
 *  - `pest_treatment_logs` — what LogPestTreatmentScreen POSTs. Zone-scoped,
 *    optionally tied to a crop, and has NO cost field in the API.
 *
 * Crop inputs come from ONE paginated source: the farm-wide
 * GET /farmers/me/crop-inputs (BR-56h), which covers every own crop including
 * harvested ones and already carries cropName/plotName, or — for a single
 * crop (Crop Detail → Inputs Applied) — that crop's own list. Pest treatment
 * logs have no farm-wide endpoint, so they are still read per zone and merged
 * client-side. Nothing here is invented: a missing cost stays `null` and
 * renders a placeholder, a pest log with no crop shows its zone.
 */

export type ApplicationKind = 'fertigation' | 'pest';
export type ApplicationIcon = 'organic' | 'flask' | 'leaf' | 'seedling' | 'pest';

export interface InputApplication {
  /** `${source}:${id}` — the two tables' ids are separate UUID spaces. */
  key: string;
  source: 'cropInput' | 'pestLog';
  kind: ApplicationKind;
  icon: ApplicationIcon;
  name: string;
  cropName: string | null;
  zoneName: string | null;
  /** YYYY-MM-DD calendar date. */
  appliedOn: string;
  createdAt: string;
  cost: Money | null;
  /** Quantity as the API stores it; null for a pest treatment log (that table has no quantity). */
  quantity: { value: number; unit: CropInputUnit } | null;
}

export interface DueReminder {
  id: string;
  farmId: string;
  plotId: string;
  zoneName: string;
  title: string;
  dueDate: string;
  /** Whole days from today (Asia/Kolkata) to `dueDate`; negative when overdue. */
  daysUntilDue: number;
}

// ── Mapping (pure) ───────────────────────────────────────────────────────────

/** Only a pesticide is a pest treatment; manure, fertilizer and bio-inputs are nutrient applications. */
export function kindForInputType(type: CropInputType): ApplicationKind {
  return type === 'PESTICIDE' ? 'pest' : 'fertigation';
}

const ICON_FOR_INPUT_TYPE: Record<CropInputType, ApplicationIcon> = {
  MANURE: 'organic',
  FERTILIZER: 'flask',
  BIO_INPUT: 'leaf',
  PESTICIDE: 'pest',
  OTHER: 'seedling',
};

export function iconForInputType(type: CropInputType): ApplicationIcon {
  return ICON_FOR_INPUT_TYPE[type] ?? 'seedling';
}

/**
 * `costInr` as Money (integer-paise backed). A value the Money parser rejects
 * (or more than 2 decimals) is treated as "no cost" rather than rounded —
 * rounding money silently is the bug root CLAUDE.md §2.2 is about.
 */
export function costFromApi(costInr: string | null): Money | null {
  if (costInr === null) return null;
  try {
    return parseMoney(costInr);
  } catch {
    return null;
  }
}

export function fromCropInput(input: CropInputResponse, cropName: string | null, zoneName: string | null): InputApplication {
  return {
    key: `cropInput:${input.id}`,
    source: 'cropInput',
    kind: kindForInputType(input.inputType),
    icon: iconForInputType(input.inputType),
    name: input.inputName,
    cropName,
    zoneName,
    appliedOn: input.appliedOn.slice(0, 10),
    createdAt: input.createdAt,
    cost: costFromApi(input.costInr),
    quantity: { value: input.quantity, unit: input.unit },
  };
}

export function fromPestLog(
  log: PestTreatmentLog,
  zoneName: string | null,
  cropNameById: ReadonlyMap<string, string>,
): InputApplication {
  return {
    key: `pestLog:${log.id}`,
    source: 'pestLog',
    kind: 'pest',
    icon: 'pest',
    name: log.treatment,
    cropName: log.farmCropId === null ? null : (cropNameById.get(log.farmCropId) ?? null),
    zoneName,
    appliedOn: log.appliedOn.slice(0, 10),
    createdAt: log.createdAt,
    cost: null,
    quantity: null,
  };
}

/** Newest `appliedOn` first; same-day rows by newest `createdAt`. */
export function compareApplications(a: InputApplication, b: InputApplication): number {
  if (a.appliedOn !== b.appliedOn) return a.appliedOn < b.appliedOn ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.key < b.key ? -1 : 1;
}

function isoDayNumber(iso: string): number {
  return Math.round(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / 86_400_000);
}

/** Calendar-day difference `dueDate - today`, both YYYY-MM-DD. */
export function daysUntil(dueDate: string, today: string): number {
  return isoDayNumber(dueDate) - isoDayNumber(today);
}

/** Open (not Completed) reminders, soonest due first. */
export function toDueReminders(
  rows: ReadonlyArray<{ reminder: PestTreatmentReminder; plot: Plot }>,
  today: string,
): DueReminder[] {
  return rows
    .filter(({ reminder }) => reminder.status !== 'Completed')
    .map(({ reminder, plot }) => ({
      id: reminder.id,
      farmId: plot.farmId,
      plotId: plot.id,
      zoneName: plot.name,
      title: reminder.title,
      dueDate: reminder.dueDate.slice(0, 10),
      daysUntilDue: daysUntil(reminder.dueDate, today),
    }))
    .sort((a, b) => (a.dueDate === b.dueDate ? (a.id < b.id ? -1 : 1) : a.dueDate < b.dueDate ? -1 : 1));
}

// ── Formatting (i18n) ────────────────────────────────────────────────────────

/** "12 Jul" (or "12 Jul 2026" with `withYear`), month from the i18n catalogue. */
export function formatAppliedDate(appliedOn: string, withYear = false): string {
  const [y, m, d] = appliedOn.split('-');
  const monthIndex = Number(m) - 1;
  const day = String(Number(d));
  const month = t(shortMonthKey(monthIndex) as TranslationKey);
  return withYear ? `${day} ${month} ${y ?? ''}` : `${day} ${month}`;
}

export function formatApplicationCost(cost: Money | null): string {
  return cost === null ? t('farmer.inputManagement.noCost') : format(cost);
}

export function applicationTypeLabel(kind: ApplicationKind): string {
  return kind === 'pest' ? t('farmer.inputManagement.type.pest') : t('farmer.inputManagement.type.fertigation');
}

/** "{name} · {crop}", falling back to the zone when the row has no crop. */
export function applicationTitle(app: InputApplication): string {
  const where = app.cropName ?? app.zoneName;
  return where === null ? app.name : `${app.name} · ${where}`;
}

const UNIT_LABEL_KEY: Partial<Record<CropInputUnit, TranslationKey>> = {
  KG: 'farmer.inputHistory.unit.KG',
  LITRE: 'farmer.inputHistory.unit.LITRE',
  GRAM: 'farmer.inputHistory.unit.GRAM',
  ML: 'farmer.inputHistory.unit.ML',
  BAG: 'farmer.inputHistory.unit.BAG',
  TONNE: 'farmer.inputHistory.unit.TONNE',
};

/**
 * "4 L" / "200 ml" — the Inputs Applied quantity column. A pest treatment log
 * has no quantity, so it gets the placeholder; an `OTHER` unit is not guessed
 * at, so the number stands alone.
 */
export function formatApplicationQuantity(quantity: InputApplication['quantity']): string {
  if (quantity === null) return t('farmer.inputHistory.placeholder');
  const key = UNIT_LABEL_KEY[quantity.unit];
  return key === undefined ? String(quantity.value) : `${quantity.value} ${t(key)}`;
}

/** The Inputs Applied filter/tag label ("Fertigation" / "Pest Treatment", Dev's casing). */
export function historyTypeLabel(kind: ApplicationKind): string {
  return kind === 'pest' ? t('farmer.inputHistory.type.pest') : t('farmer.inputHistory.type.fertigation');
}

// ── Parsing (Add Input Applied) ──────────────────────────────────────────────

const MONTH_ABBR_EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function isoIfReal(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function monthIndexFromName(name: string): number {
  const lower = name.toLowerCase();
  for (let i = 0; i < 12; i += 1) {
    const local = t(shortMonthKey(i) as TranslationKey).toLowerCase();
    if (lower === local || lower.slice(0, 3) === MONTH_ABBR_EN[i]) return i;
  }
  return -1;
}

export type AppliedOnParse = { ok: true; appliedOn: string } | { ok: false; reason: 'invalid' | 'future' };

/**
 * The farmer types the date by hand (Dev's "17 Sep 2026, 09:20 AM" field; no
 * auto-timestamping). Accepts "17 Sep 2026" with an optional ", 09:20 AM"
 * (the API stores `appliedOn` as a calendar date only, so a time is ignored)
 * or "2026-09-17". A non-calendar date is invalid, and a date after today in
 * Asia/Kolkata is rejected as BR-56b does server-side.
 */
export function parseAppliedOn(text: string, today: string): AppliedOnParse {
  const value = text.trim();
  let iso: string | null = null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    iso = isoIfReal(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  } else {
    const dmy = /^(\d{1,2})\s+(\S+?)\s+(\d{4})(?:\s*,?\s*\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)?$/.exec(value);
    if (dmy) {
      const monthIndex = monthIndexFromName(dmy[2] ?? '');
      if (monthIndex >= 0) iso = isoIfReal(Number(dmy[3]), monthIndex + 1, Number(dmy[1]));
    }
  }
  if (iso === null) return { ok: false, reason: 'invalid' };
  if (iso > today) return { ok: false, reason: 'future' };
  return { ok: true, appliedOn: iso };
}

export function dueLabel(daysUntilDue: number): string {
  if (daysUntilDue === 0) return t('farmer.inputManagement.reminder.dueToday');
  if (daysUntilDue === 1) return t('farmer.inputManagement.reminder.dueTomorrow');
  if (daysUntilDue > 1) return t('farmer.inputManagement.reminder.dueInDays', { count: daysUntilDue });
  if (daysUntilDue === -1) return t('farmer.inputManagement.reminder.overdueOne');
  return t('farmer.inputManagement.reminder.overdueDays', { count: -daysUntilDue });
}

// ── Loading ──────────────────────────────────────────────────────────────────

/** Rows Input Management shows under RECENT APPLICATIONS (a layout choice, not a business threshold). */
export const RECENT_APPLICATIONS_LIMIT = 5;
/** LimitParam maximum in docs/openapi.yaml. */
const HISTORY_PAGE_SIZE = 100;
/** Guard against a server bug looping a cursor (same doctrine as crops.ts MAX_CROP_PAGES). */
const MAX_INPUT_PAGES = 20;

export interface HistoryCrop {
  id: string;
  name: string;
  zone: string | null;
}

export interface LoadApplicationsOptions {
  /**
   * 'recent': first page of inputs (newest applied first) plus open
   * reminders. 'history': every page, no reminders.
   */
  mode: 'recent' | 'history';
  /** Restrict to one crop (Crop Detail → Inputs Applied). Omitted = every own crop, harvested ones included. */
  crop?: HistoryCrop | null | undefined;
}

export interface InputApplicationsData {
  applications: InputApplication[];
  reminders: DueReminder[];
  /** False when the inputs cursor had to be abandoned at MAX_INPUT_PAGES. */
  complete: boolean;
  /** True when some zone's pest treatment logs or reminders (or a farm's zone list) could not be loaded. */
  partial: boolean;
}

interface CursorPage<T> {
  items: T[];
  page: { nextCursor: string | null; hasMore: boolean };
}

/**
 * 'recent' reads one page of RECENT_APPLICATIONS_LIMIT rows; 'history' walks the
 * cursor to the end (bounded by MAX_INPUT_PAGES) so counts are exact.
 */
async function walkPages<T>(
  mode: LoadApplicationsOptions['mode'],
  fetchPage: (query: { limit: number; cursor?: string }) => Promise<CursorPage<T>>,
): Promise<{ items: T[]; complete: boolean }> {
  if (mode === 'recent') {
    const page = await fetchPage({ limit: RECENT_APPLICATIONS_LIMIT });
    return { items: page.items, complete: true };
  }
  const items: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_INPUT_PAGES; i += 1) {
    const page = await fetchPage({ limit: HISTORY_PAGE_SIZE, ...(cursor === undefined ? {} : { cursor }) });
    items.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) return { items, complete: true };
    cursor = page.page.nextCursor;
  }
  return { items, complete: false };
}

/** Crop inputs as application rows, from exactly one paginated endpoint. */
async function loadInputs(
  mode: LoadApplicationsOptions['mode'],
  singleCrop: HistoryCrop | null,
  signal: AbortSignal | undefined,
): Promise<{ apps: InputApplication[]; cropNames: Array<[string, string]>; complete: boolean }> {
  if (singleCrop !== null) {
    const r = await walkPages<CropInputResponse>(mode, (q) => listCropInputs(singleCrop.id, q, signal));
    return {
      apps: r.items.map((i) => fromCropInput(i, singleCrop.name, singleCrop.zone)),
      cropNames: [[singleCrop.id, singleCrop.name]],
      complete: r.complete,
    };
  }
  const r = await walkPages<FarmCropInputResponse>(mode, (q) => listFarmCropInputs(q, signal));
  return {
    apps: r.items.map((i) => fromCropInput(i, i.cropName, i.plotName)),
    cropNames: r.items.map((i) => [i.farmCropId, i.cropName]),
    complete: r.complete,
  };
}

export async function loadInputApplications(
  options: LoadApplicationsOptions,
  signal?: AbortSignal,
): Promise<InputApplicationsData> {
  const singleCrop = options.crop ?? null;

  // Active-crop names label pest treatment logs that carry a farmCropId (pest logs have no
  // farm-wide endpoint and no crop name of their own). Not needed for a single crop.
  const activeCropNamesPromise: Promise<Array<[string, string]>> =
    singleCrop !== null
      ? Promise.resolve([])
      : listAllActiveFarmCrops(signal).then((r) => r.items.map(({ crop }) => [crop.id, crop.cropName]));

  // Zones across every farm: pest treatment logs and reminders are zone-scoped.
  // Pest data is read per farm and per zone, so one zone (or one farm's zone
  // list) failing must not blank the whole screen: those requests are settled
  // individually, what loaded is shown, and `partial` tells the screen to say
  // that some of it is missing. The crop inputs themselves (one endpoint) and
  // the farm list still fail the load, since without them there is nothing
  // meaningful to show.
  let partial = false;
  const plotsPromise = getFarms(signal).then(async (farms) => {
    const settled = await Promise.allSettled(farms.map((farm) => getPlots(farm.id, signal)));
    return settled.flatMap((r) => {
      if (r.status === 'fulfilled') return r.value;
      partial = true;
      return [];
    });
  });

  const wantReminders = options.mode === 'recent';

  const [inputs, activeCropNames, pestPerPlot] = await Promise.all([
    loadInputs(options.mode, singleCrop, signal),
    activeCropNamesPromise,
    plotsPromise.then((plots) => Promise.all(
      plots.map(async (plot) => {
        const [logs, reminders] = await Promise.allSettled([
          listPestTreatmentLogs(plot.farmId, plot.id),
          wantReminders ? listPestTreatmentReminders(plot.farmId, plot.id) : Promise.resolve([]),
        ]);
        if (logs.status === 'rejected' || reminders.status === 'rejected') partial = true;
        return {
          plot,
          logs: logs.status === 'fulfilled' ? logs.value : [],
          reminders: reminders.status === 'fulfilled' ? reminders.value : [],
        };
      }),
    )),
  ]);

  // Names seen on input rows cover harvested crops the active list no longer has.
  const cropNameById = new Map<string, string>([...inputs.cropNames, ...activeCropNames]);

  const pestApps = pestPerPlot.flatMap(({ plot, logs }) =>
    logs
      .filter((log) => singleCrop === null || log.farmCropId === singleCrop.id)
      .map((log) => fromPestLog(log, plot.name, cropNameById)),
  );

  let applications = [...inputs.apps, ...pestApps].sort(compareApplications);
  if (options.mode === 'recent') applications = applications.slice(0, RECENT_APPLICATIONS_LIMIT);

  const reminders = wantReminders
    ? toDueReminders(
        pestPerPlot.flatMap(({ plot, reminders: rs }) => rs.map((reminder) => ({ reminder, plot }))),
        todayInKolkata(),
      )
    : [];

  return { applications, reminders, complete: inputs.complete, partial };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export type ApplicationsLoadState = 'loading' | 'ready' | 'error';

export interface InputApplicationsState {
  state: ApplicationsLoadState;
  data: InputApplicationsData | null;
  /** Refetch after an error (shows the loading state again). */
  retry: () => void;
  /** Pull-to-refresh: keeps the current rows on screen while refetching. */
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Same abortable useEffect + reloadKey pattern as
 * `screens/dashboard/useCommunityPlanting.ts`. The screen is remounted when the
 * farmer comes back from a Log screen (App.tsx renders one screen at a time),
 * so a fresh mount always refetches and shows what was just logged.
 */
export function useInputApplications(
  mode: LoadApplicationsOptions['mode'],
  crop?: HistoryCrop | null,
): InputApplicationsState {
  const [state, setState] = useState<ApplicationsLoadState>('loading');
  const [data, setData] = useState<InputApplicationsData | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const cropId = crop?.id ?? null;
  const cropName = crop?.name ?? null;
  const cropZone = crop?.zone ?? null;

  useEffect(() => {
    const controller = new AbortController();
    if (!refreshingRef.current) setState('loading');
    const scoped = cropId === null ? null : { id: cropId, name: cropName ?? '', zone: cropZone };
    loadInputApplications({ mode, crop: scoped }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setState('ready');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setData(null);
        setState('error');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        refreshingRef.current = false;
        setRefreshing(false);
      });
    return () => controller.abort();
  }, [mode, cropId, cropName, cropZone, reloadKey]);

  const retry = useCallback(() => {
    refreshingRef.current = false;
    setReloadKey((k) => k + 1);
  }, []);

  const refresh = useCallback(() => {
    refreshingRef.current = true;
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { state, data, retry, refreshing, refresh };
}
