/**
 * Shared read-side helpers for the Farm Diary viewing screens
 * (FarmDiaryScreen, DiaryCalendarScreen).
 *
 * Why this exists: diary entries from the API carry only ids/keys
 * (`plotId`, `farmCropId`, `categoryKey`, `subActivityKey`), never display
 * names. Both screens need the same client-side resolution of those ids into
 * human-readable text, so the lookup-building lives here once rather than
 * being duplicated across two ~1000-line screen files.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { formatErrorMessage } from '../../../../shell/api/client';
import { authPalette as P } from '../../theme';
import { formatMoneyAmount } from '../../api/wallet';
import {
  getDiaryCalendar,
  getDiaryTaxonomy,
  listActiveCrops,
  listDiaryEntries,
  listDiaryPlots,
  type DiaryActiveCrop,
  type DiaryCategory,
  type DiaryEntrySummary,
  type DiaryPlot,
  type DiarySubActivity,
} from '../../api/farmDiary';

export type LoadState = 'loading' | 'error' | 'ready';

// ─────────────────────────────────────────────
// Category icons (taxonomy `iconKey` → inline icon)
//
// Same 12-icon set as NewFarmDiaryEntryStep2Screen (which defines them
// privately, not exported), so a category looks the same when it is picked
// and when it is later viewed.
// ─────────────────────────────────────────────

type IconProps = { size?: number; color?: string };
export type IconComponentType = React.ComponentType<IconProps>;

function MountainIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20L10 8L15 15L17 12L21 20H3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SowingSeedIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21V10M12 10c0-4 3-6 7-6 0 4-2 7-7 6zM12 14c0-3.5-2.5-5-6-5 0 3.5 2 5.5 6 5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NutrientsCircleIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 0 1 9 9c0 2.2-.8 4.2-2.1 5.8M5.1 17.8A9 9 0 0 1 3 12a9 9 0 0 1 9-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M12 8c-2 2-3 4-3 5.5a3 3 0 0 0 6 0C15 12 14 10 12 8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19 7l2 5-5-1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropletIcon({ size = 22, color = P.twGreen700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PestBugIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20a6 6 0 0 0 6-6V9a6 6 0 1 0-12 0v5a6 6 0 0 0 6 6z M12 3v1 M7 6l-2-2 M17 6l2-2 M3 11h2 M19 11h2 M5 16l-2 2 M19 16l2 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ScissorsIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" />
      <Line x1="20" y1="4" x2="8.12" y2="15.88" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14.47" y1="14.48" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.12" y1="8.12" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function TractorHarvestIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M4 17H2V9h5v8M10 17h4M14 9h7v8M9 9h5v8M14 12h7M14 9l2-4h3l2 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CrateBoxIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="15" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="11" x2="21" y2="11" stroke={color} strokeWidth="2" />
      <Line x1="9" y1="11" x2="9" y2="17" stroke={color} strokeWidth="2" />
      <Line x1="15" y1="11" x2="15" y2="17" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ToolsHammerIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PawIcon({ size = 22, color = P.twGray700 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="15" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="10" cy="5.5" r="2.2" fill={color} />
      <Circle cx="14" cy="5.5" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
    </Svg>
  );
}

/**
 * The taxonomy is admin-managed, so a category can arrive with an `iconKey`
 * this build has never heard of (or none at all). Unknown keys fall back to
 * FALLBACK_CATEGORY_ICON rather than crashing the list.
 */
const CATEGORY_ICONS: Record<string, IconComponentType> = {
  mountain: MountainIcon,
  sowing_seed: SowingSeedIcon,
  nutrients_circle: NutrientsCircleIcon,
  water_droplet: WaterDropletIcon,
  shield: ShieldIcon,
  pest_bug: PestBugIcon,
  scissors: ScissorsIcon,
  search: SearchIcon,
  tractor_harvest: TractorHarvestIcon,
  crate_box: CrateBoxIcon,
  tools_hammer: ToolsHammerIcon,
  paw: PawIcon,
};

const FALLBACK_CATEGORY_ICON: IconComponentType = MountainIcon;

export function iconForCategory(iconKey: string | null | undefined): IconComponentType {
  return (iconKey ? CATEGORY_ICONS[iconKey] : undefined) ?? FALLBACK_CATEGORY_ICON;
}

// ─────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local-calendar `YYYY-MM-DD` (not toISOString, which would shift to UTC). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** `YYYY-MM` for a 0-indexed month. */
export function toIsoMonth(year: number, month0: number): string {
  return `${year}-${pad2(month0 + 1)}`;
}

/** 135 → "2h 15m", 45 → "45m", 0 → "0m". */
export function formatMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/** ISO timestamp → "07:10 AM" in the device's local time. Empty on bad input. */
export function formatTimeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h24 = d.getHours();
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad2(h12)}:${pad2(d.getMinutes())} ${suffix}`;
}

/**
 * Integer paise → "₹1,234.50". Integer arithmetic only — never divides into a
 * float (CLAUDE.md §2.2).
 */
export function formatPaise(paise: number): string {
  const whole = Math.trunc(paise);
  const sign = whole < 0 ? '-' : '';
  const abs = Math.abs(whole);
  return formatMoneyAmount(`${sign}${Math.floor(abs / 100)}.${pad2(abs % 100)}`);
}

// ─────────────────────────────────────────────
// Reference data: plots + taxonomy (fetched once per screen mount)
// ─────────────────────────────────────────────

export interface DiaryReferenceData {
  state: LoadState;
  error: string;
  retry: () => void;
  plots: DiaryPlot[];
  /** Active categories only, sorted — for filter options. */
  activeCategories: DiaryCategory[];
  plotNameById: Map<string, string>;
  /** Includes inactive categories, so an old entry still resolves its name. */
  categoryByKey: Map<string, DiaryCategory>;
  subActivityByKey: Map<string, DiarySubActivity>;
}

export function useDiaryReferenceData(): DiaryReferenceData {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [plots, setPlots] = useState<DiaryPlot[]>([]);
  const [activeCategories, setActiveCategories] = useState<DiaryCategory[]>([]);
  const [plotNameById, setPlotNameById] = useState<Map<string, string>>(() => new Map());
  const [categoryByKey, setCategoryByKey] = useState<Map<string, DiaryCategory>>(() => new Map());
  const [subActivityByKey, setSubActivityByKey] = useState<Map<string, DiarySubActivity>>(
    () => new Map(),
  );

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    Promise.all([listDiaryPlots(controller.signal), getDiaryTaxonomy(controller.signal)])
      .then(([plotItems, taxonomy]) => {
        if (controller.signal.aborted) return;
        const catMap = new Map<string, DiaryCategory>();
        const subMap = new Map<string, DiarySubActivity>();
        for (const cat of taxonomy.categories) {
          catMap.set(cat.key, cat);
          for (const sub of cat.subActivities) subMap.set(sub.key, sub);
        }
        setPlots(plotItems);
        setPlotNameById(new Map(plotItems.map((p) => [p.id, p.name])));
        setCategoryByKey(catMap);
        setSubActivityByKey(subMap);
        setActiveCategories(
          taxonomy.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
        );
        setState('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(formatErrorMessage(err, 'Could not load your fields and activity types.'));
        setState('error');
      });
    return () => controller.abort();
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    state,
    error,
    retry,
    plots,
    activeCategories,
    plotNameById,
    categoryByKey,
    subActivityByKey,
  };
}

// ─────────────────────────────────────────────
// Entries for one day (+ crop-name resolution)
// ─────────────────────────────────────────────

/** Server max page size; see ListDiaryEntriesQuery in farm-diary.schema.ts. */
const ENTRIES_PAGE_LIMIT = 100;
/** Guard against a runaway cursor loop — a single day will never approach this. */
const MAX_ENTRY_PAGES = 10;

/**
 * Follows the cursor so the day's stats (count, time logged, fields covered)
 * are computed over every entry, not just the first page.
 */
async function fetchAllEntriesForDate(
  date: string,
  signal: AbortSignal,
): Promise<DiaryEntrySummary[]> {
  const all: DiaryEntrySummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_ENTRY_PAGES; page++) {
    const res = await listDiaryEntries(
      { date, limit: ENTRIES_PAGE_LIMIT, ...(cursor !== undefined ? { cursor } : {}) },
      signal,
    );
    all.push(...res.items);
    if (!res.page.hasMore || res.page.nextCursor === null) break;
    cursor = res.page.nextCursor;
  }
  return all;
}

export interface DiaryDayEntries {
  state: LoadState;
  error: string;
  retry: () => void;
  entries: DiaryEntrySummary[];
  cropNameById: Map<string, string>;
}

/**
 * Loads a day's entries, then resolves `farmCropId` → crop name.
 *
 * There is no bulk "list all my crops" endpoint (the plots/farm-crops module
 * does not exist yet), so crop names are resolved by calling
 * `listActiveCrops(plotId)` for each distinct plot on the day. Those lookups
 * are best-effort: a failure, or a crop that is no longer active, degrades to
 * a "Crop" placeholder at display time rather than failing the whole list.
 * Successful per-plot results are cached for the life of the screen so paging
 * between days does not refetch them.
 */
export function useDiaryDayEntries(date: string): DiaryDayEntries {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [entries, setEntries] = useState<DiaryEntrySummary[]>([]);
  const [cropNameById, setCropNameById] = useState<Map<string, string>>(() => new Map());
  const cropsByPlot = useRef<Map<string, DiaryActiveCrop[]>>(new Map());

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState('loading');

    const load = async (): Promise<void> => {
      const items = await fetchAllEntriesForDate(date, signal);
      const plotIds = Array.from(new Set(items.map((e) => e.plotId)));
      const missing = plotIds.filter((id) => !cropsByPlot.current.has(id));
      const results = await Promise.allSettled(missing.map((id) => listActiveCrops(id, signal)));
      if (signal.aborted) return;
      results.forEach((r, i) => {
        const plotId = missing[i];
        if (r.status === 'fulfilled' && plotId !== undefined) {
          cropsByPlot.current.set(plotId, r.value);
        }
      });
      const names = new Map<string, string>();
      for (const plotId of plotIds) {
        for (const crop of cropsByPlot.current.get(plotId) ?? []) names.set(crop.id, crop.cropName);
      }
      setEntries(items);
      setCropNameById(names);
      setState('ready');
    };

    load().catch((err: unknown) => {
      if (signal.aborted) return;
      setError(formatErrorMessage(err, 'Could not load diary entries.'));
      setState('error');
    });
    return () => controller.abort();
  }, [date, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { state, error, retry, entries, cropNameById };
}

// ─────────────────────────────────────────────
// Calendar month (which days have entries)
// ─────────────────────────────────────────────

export interface DiaryCalendarMonth {
  state: LoadState;
  error: string;
  retry: () => void;
  /** `YYYY-MM-DD` → entry count, only for days with at least one entry. */
  countsByDate: Map<string, number>;
}

/** Pass `null` to skip fetching (e.g. while a picker modal is closed). */
export function useDiaryCalendarMonth(month: string | null): DiaryCalendarMonth {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [countsByDate, setCountsByDate] = useState<Map<string, number>>(() => new Map());

  useEffect(() => {
    if (month === null) return undefined;
    const controller = new AbortController();
    setState('loading');
    setCountsByDate(new Map());
    getDiaryCalendar(month, controller.signal)
      .then((cal) => {
        if (controller.signal.aborted) return;
        setCountsByDate(
          new Map(cal.days.filter((d) => d.entryCount > 0).map((d) => [d.date, d.entryCount])),
        );
        setState('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(formatErrorMessage(err, 'Could not load this month.'));
        setState('error');
      });
    return () => controller.abort();
  }, [month, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { state, error, retry, countsByDate };
}

// ─────────────────────────────────────────────
// Entry display resolution
// ─────────────────────────────────────────────

export interface ResolvedDiaryEntry {
  entry: DiaryEntrySummary;
  categoryName: string;
  subActivityName: string | null;
  cropName: string;
  plotName: string;
  time: string;
  duration: string;
  Icon: IconComponentType;
}

/**
 * Display fallbacks are deliberate, not errors: an unknown key (taxonomy row
 * removed, crop no longer active) renders a generic label instead of blank
 * text or a crash.
 */
export function resolveDiaryEntry(
  entry: DiaryEntrySummary,
  ref: Pick<DiaryReferenceData, 'plotNameById' | 'categoryByKey' | 'subActivityByKey'>,
  cropNameById: Map<string, string>,
): ResolvedDiaryEntry {
  const category = ref.categoryByKey.get(entry.categoryKey);
  return {
    entry,
    categoryName: category?.name ?? 'Activity',
    subActivityName: ref.subActivityByKey.get(entry.subActivityKey)?.name ?? null,
    cropName: cropNameById.get(entry.farmCropId) ?? 'Crop',
    plotName: ref.plotNameById.get(entry.plotId) ?? 'Field',
    time: formatTimeOfDay(entry.loggedAt),
    duration: formatMinutes(entry.minutes),
    Icon: iconForCategory(category?.iconKey),
  };
}
