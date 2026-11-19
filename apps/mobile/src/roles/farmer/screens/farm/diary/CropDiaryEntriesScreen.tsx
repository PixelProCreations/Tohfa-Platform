import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { authPalette as P, typography } from '../../../theme';
import { listDiaryEntries, type DiaryEntrySummary } from '../../../api/farmDiary';
import { formatMinutes, formatTimeOfDay, useDiaryReferenceData } from './diaryLookups';
import type { CropItem } from '../crops/ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SproutIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 16v-5M12 11c0-2 1.5-3.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5zM12 13c0-1.8-1.2-3-3-3 0 1.8 1.2 3 3 3z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ManureIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8 12c0-2.2 1.8-4 4-4 1.5 0 2.8.8 3.5 2M16 12c0 2.2-1.8 4-4 4-1.5 0-2.8-.8-3.5-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PestIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 6V3M6 12H3M21 12h-3M6.34 6.34L4.22 4.22M19.78 4.22l-2.12 2.12M6.34 17.66l-2.12 2.12M19.78 19.78l-2.12-2.12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & server data
// ─────────────────────────────────────────────

/** Nothing has a source until the server answers — see EMPTY_VALUE's uses. */
const EMPTY_VALUE = '—';

/**
 * Which of this screen's four badge styles an entry draws in.
 *
 * The activity taxonomy is admin-managed (`diary_activity_categories`), so a
 * category can arrive that this design has no badge for. The three the design
 * does name map onto the seeded keys; everything else draws in the fourth,
 * generic badge. Only the badge picture is a guess — the title the farmer
 * reads is always the category/sub-activity name the server sent.
 */
type BadgeKind = 'Watering' | 'Weeding' | 'Fertilizing' | 'Other';

function badgeKindFor(categoryKey: string): BadgeKind {
  if (categoryKey === 'water_mgmt') return 'Watering';
  if (categoryKey === 'weed_mgmt') return 'Weeding';
  if (categoryKey === 'nutrient_mgmt') return 'Fertilizing';
  return 'Other';
}

/** The filter pills, in design order, and the category key each one selects. */
const FILTERS = [
  { key: 'All', categoryKey: null },
  { key: 'Watering', categoryKey: 'water_mgmt' },
  { key: 'Weeding', categoryKey: 'weed_mgmt' },
  { key: 'Fertilizing', categoryKey: 'nutrient_mgmt' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const MONTH_SHORT_KEYS = [
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
] as const;

const MS_PER_DAY = 86_400_000;

/** `2026-07-15` → `15 Jul`. Empty string on anything unparseable. */
function formatDayMonth(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const monthKey = MONTH_SHORT_KEYS[d.getMonth()] ?? MONTH_SHORT_KEYS[0];
  return `${d.getDate()} ${t(monthKey)}`;
}

/** Whole days between an entry's activity date and today; null if unparseable. */
function daysSince(isoDate: string): number | null {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const startOf = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.round((startOf(new Date()) - startOf(then)) / MS_PER_DAY));
}

/** Server max page size; see ListDiaryEntriesQuery in farm-diary.schema.ts. */
const ENTRIES_PAGE_LIMIT = 100;
/**
 * Guard against a runaway cursor loop. The list endpoint has no `farmCropId`
 * filter (docs/openapi.yaml: date/month/plotId/categoryKey only), so this crop's
 * entries are selected client-side from the farmer's own entries, newest first.
 */
const MAX_ENTRY_PAGES = 10;

async function fetchEntriesForCrop(
  farmCropId: string | null,
  signal: AbortSignal,
): Promise<DiaryEntrySummary[]> {
  const all: DiaryEntrySummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_ENTRY_PAGES; page++) {
    const res = await listDiaryEntries(
      { limit: ENTRIES_PAGE_LIMIT, ...(cursor !== undefined ? { cursor } : {}) },
      signal,
    );
    all.push(
      ...(farmCropId === null ? res.items : res.items.filter((e) => e.farmCropId === farmCropId)),
    );
    if (!res.page.hasMore || res.page.nextCursor === null) break;
    cursor = res.page.nextCursor;
  }
  return all;
}

type LoadState = 'loading' | 'error' | 'ready';

function useCropDiaryEntries(farmCropId: string | null): {
  state: LoadState;
  error: string;
  retry: () => void;
  entries: DiaryEntrySummary[];
} {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [entries, setEntries] = useState<DiaryEntrySummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState('loading');
    fetchEntriesForCrop(farmCropId, signal)
      .then((items) => {
        if (signal.aborted) return;
        setEntries(items);
        setState('ready');
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        // No fixture fallback: a failed load is reported, never papered over.
        setEntries([]);
        setError(formatErrorMessage(err, t('farmer.cropDiary.loadError')));
        setState('error');
      });
    return () => controller.abort();
  }, [farmCropId, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { state, error, retry, entries };
}

export interface CropDiaryEntriesScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onNewEntry?: () => void;
}

export function CropDiaryEntriesScreen({
  crop,
  onBack,
  onNewEntry,
}: CropDiaryEntriesScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');

  // Handle Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  // A field with no source renders an em-dash; none of these is invented.
  const cropName = crop?.name || EMPTY_VALUE;
  const variety = crop?.variety || EMPTY_VALUE;
  const zone = crop?.zoneShort || crop?.zone || EMPTY_VALUE;
  const subtitle = `${cropName} — ${variety} · ${zone}`;

  // ── Server data ──
  const ref = useDiaryReferenceData();
  const list = useCropDiaryEntries(crop?.id ?? null);

  const listState: LoadState =
    ref.state === 'error' || list.state === 'error'
      ? 'error'
      : ref.state === 'loading' || list.state === 'loading'
        ? 'loading'
        : 'ready';
  const listError = ref.state === 'error' ? ref.error : list.error;
  const retryList = () => {
    if (ref.state === 'error') ref.retry();
    if (list.state === 'error') list.retry();
  };

  const { categoryByKey, subActivityByKey } = ref;
  const rows = useMemo(
    () =>
      list.entries.map((entry) => {
        const dayMonth = formatDayMonth(entry.activityOn);
        const time = formatTimeOfDay(entry.loggedAt);
        const parts = [dayMonth, time].filter((p) => p !== '');
        const notes = entry.notes !== null && entry.notes.trim() !== '' ? entry.notes.trim() : null;
        return {
          id: entry.id,
          categoryKey: entry.categoryKey,
          badge: badgeKindFor(entry.categoryKey),
          title:
            subActivityByKey.get(entry.subActivityKey)?.name ??
            categoryByKey.get(entry.categoryKey)?.name ??
            EMPTY_VALUE,
          timestamp: parts.length > 0 ? parts.join(' · ') : EMPTY_VALUE,
          note: notes ?? EMPTY_VALUE,
          duration: formatMinutes(entry.minutes),
        };
      }),
    [list.entries, categoryByKey, subActivityByKey],
  );

  const activeCategoryKey = FILTERS.find((f) => f.key === activeFilter)?.categoryKey ?? null;
  const filteredEntries = rows.filter(
    (row) => activeCategoryKey === null || row.categoryKey === activeCategoryKey,
  );

  // Stats describe the whole crop, independent of the list filter, and show an
  // em-dash until the server has actually answered.
  const statsReady = listState === 'ready';
  const entriesLogged = statsReady ? String(list.entries.length) : EMPTY_VALUE;
  const lastEntryDays = statsReady
    ? list.entries.reduce<number | null>((best, e) => {
      const d = daysSince(e.activityOn);
      if (d === null) return best;
      return best === null || d < best ? d : best;
    }, null)
    : null;
  const sinceLastEntry =
    lastEntryDays === null
      ? EMPTY_VALUE
      : lastEntryDays === 0
        ? t('farmer.cropDiary.sinceLastEntry.today')
        : lastEntryDays === 1
          ? t('farmer.cropDiary.sinceLastEntry.day', { count: lastEntryDays })
          : t('farmer.cropDiary.sinceLastEntry.days', { count: lastEntryDays });

  const handleFabPress = () => {
    if (onNewEntry) {
      onNewEntry();
    } else {
      Alert.alert('New Diary Entry', `Add a new activity log for ${cropName} (${zone})`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Diary Entries</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Stat Cards ── */}
          <View style={styles.statsRow}>
            {/* Card 1: Entries Logged */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twGreen100 }]}>
                <CalendarIcon size={18} color={P.twGreen700} />
              </View>
              <Text style={styles.statValue}>{entriesLogged}</Text>
              <Text style={styles.statLabel}>Entries Logged</Text>
            </View>

            {/* Card 2: Days Since Last Entry */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twBlue50 }]}>
                <ClockIcon size={18} color={P.twBlue600} />
              </View>
              <Text style={styles.statValue}>{sinceLastEntry}</Text>
              <Text style={styles.statLabel}>Since Last Entry</Text>
            </View>
          </View>

          {/* ── Filter Pills ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(({ key: filter }) => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isSelected ? styles.filterChipActive : styles.filterChipInactive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Diary Activity Cards List / Loading / Error / Empty ── */}
          {listState === 'loading' ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={P.twGreen700} />
              <Text style={styles.statusText}>{t('farmer.farmDiary.common.loadingEntries')}</Text>
            </View>
          ) : listState === 'error' ? (
            <View style={[styles.statusBox, styles.errorBox]}>
              <Text style={styles.errorText}>{listError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retryList}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.farmDiary.common.retryDiaryEntriesLabel')}
              >
                <Text style={styles.retryButtonText}>{t('farmer.common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : filteredEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('farmer.farmDiary.list.emptyTitle')}</Text>
              <Text style={styles.emptySubtitle}>
                {activeCategoryKey !== null
                  ? t('farmer.farmDiary.list.emptyFilteredSubtitle')
                  : t('farmer.cropDiary.emptySubtitle')}
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {filteredEntries.map((item) => {
                const fullSubtitle = `${item.timestamp} · ${item.note}`;
                return (
                  <View key={item.id} style={styles.entryCard}>
                    {/* Category-specific Icon Badge */}
                    <View
                      style={[
                        styles.entryIconBadge,
                        item.badge === 'Watering' && { backgroundColor: P.twBlue50 },
                        item.badge === 'Weeding' && { backgroundColor: P.twGreen100 },
                        item.badge === 'Fertilizing' && { backgroundColor: P.twOrange100 },
                        item.badge === 'Other' && { backgroundColor: P.twRed50 },
                      ]}
                    >
                      {item.badge === 'Watering' ? (
                        <DropletIcon size={18} color={P.twBlue600} />
                      ) : item.badge === 'Weeding' ? (
                        <SproutIcon size={18} color={P.twGreen700} />
                      ) : item.badge === 'Fertilizing' ? (
                        <ManureIcon size={18} color={P.twAmber800} />
                      ) : (
                        <PestIcon size={18} color={P.twRed600} />
                      )}
                    </View>

                    <View style={styles.entryTextCol}>
                      <Text style={styles.entryTitle}>{item.title}</Text>
                      <Text style={styles.entrySubtitle}>{fullSubtitle}</Text>
                    </View>

                    <Text style={styles.entryDurationText}>{item.duration}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* ── Floating Action Button (FAB) ── */}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleFabPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add diary entry"
        >
          <PlusIcon size={24} color={P.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: P.deepGreen,
  },
  filterChipInactive: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray300,
  },
  filterChipText: {
    fontSize: typography.body,
  },
  filterChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: P.twGray700,
    fontWeight: '600',
  },
  entriesList: {
    gap: 10,
  },
  statusBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  errorBox: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
  },
  errorText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twRed200,
  },
  retryButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twRed700,
  },
  emptyCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  emptyTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 18,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  entryIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  entryTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  entrySubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  entryDurationText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen700,
  },
  bottomSpacer: {
    height: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
