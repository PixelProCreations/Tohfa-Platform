import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { authPalette as P, typography } from '../../../theme';
import { getFarms } from '../../../api/farms';
import {
  getMyWorkforceCropHoursSummary,
  listMyWorkerAttendance,
  listMyWorkers,
  type CropHoursSummary,
} from '../../../api/workforce';
import type { CropItem } from './ProduceCalendarScreen';

/**
 * ProduceCalendarScreen's `CropItem.id` (e.g. `"crop-1"`) is local mock data
 * -- there is no backend `farm_crops` table wired up behind it yet, so these
 * ids are never real `farm_crops` UUIDs. workforce.schema.ts's
 * `cropHoursSummaryQuery`/`workerAttendanceQuery` both require `farmCropId`
 * to be `z.string().uuid()`, so sending a mock id would always fail
 * validation (400), not just "not found". Rather than fire calls that are
 * guaranteed to fail, this screen checks the shape first and falls back to a
 * "no data" state when it isn't a real UUID -- see the effect below.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

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

// ─────────────────────────────────────────────
// Types & Sample Data
// ─────────────────────────────────────────────

export interface WorkerItem {
  id: string;
  initials: string;
  name: string;
  tasks: string;
  hours: string;
  earnings: string;
}

/** `irrigation|weeding|...` (WorkerDetailScreen.tsx's `DayActivity.type`) -> a display label. */
const ACTIVITY_LABELS: Record<string, string> = {
  irrigation: 'Irrigation',
  weeding: 'Weeding',
  fertigation: 'Fertigation',
  harvesting: 'Harvesting',
  landprep: 'Land prep',
};
function activityLabel(raw: string): string {
  return ACTIVITY_LABELS[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

function formatPaiseFull(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export interface CropWorkforceHoursScreenProps {
  /**
   * Threaded down like WorkforceScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) otherwise -- the
   * CropWorkforceHours route in App.tsx passes no farmId today.
   */
  farmId?: string | undefined;
  crop?: CropItem | null;
  onBack?: () => void;
}

export function CropWorkforceHoursScreen({
  farmId,
  crop,
  onBack,
}: CropWorkforceHoursScreenProps): React.JSX.Element {
  // Android hardware back
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

  const cropName = crop?.name ?? 'Carrot';
  const variety = crop?.variety ?? 'Nantes';
  const zone = crop?.zoneShort || crop?.zone || 'Zone 1';
  const subtitle = `${cropName} — ${variety} · ${zone}`;

  // ── Farm context ── (same self-resolution pattern as WorkforceScreen.tsx)
  const [resolvedFarmId, setResolvedFarmId] = useState(farmId ?? '');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        if (fid && !cancelled) setResolvedFarmId(fid);
      } catch {
        // Swallowed: nothing real to show without a farm, so the screen
        // simply keeps rendering its zero-state defaults below.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  // ── Hero stats + per-worker breakdown ──
  const cropHasRealId = isUuid(crop?.id);
  const [summary, setSummary] = useState<CropHoursSummary | null>(null);
  const [workerRows, setWorkerRows] = useState<WorkerItem[]>([]);

  const loadCropWorkforce = useCallback(async () => {
    if (!resolvedFarmId) return;
    if (!cropHasRealId) {
      // ProduceCalendarScreen crop gap (see the isUuid() docblock above): this
      // crop has no real farm_crops id to query against, so there is nothing
      // real to fetch for it yet.
      setSummary(null);
      setWorkerRows([]);
      return;
    }
    try {
      const farmCropId = crop!.id;
      const [cropSummary, workers] = await Promise.all([
        getMyWorkforceCropHoursSummary(resolvedFarmId, farmCropId).catch(() => null),
        listMyWorkers(resolvedFarmId),
      ]);
      setSummary(cropSummary);

      // Per-worker breakdown: aggregate this worker's *present* attendance
      // rows logged against this crop. `tasks` is the set of distinct
      // activities logged; `hours` sums hoursWorked; `earnings` approximates
      // this worker's pay for those hours using a standard 8h working day
      // (daily-wage workers) or a 26-day/208h working month (monthly-salary
      // workers) as the hourly-rate basis -- the API has no per-task/per-hour
      // rate of its own to read, so this is a client-side estimate, not the
      // authoritative payroll figure (that's PayrollScreen/getMyWorkforcePayrollSummary).
      const rows = await Promise.all(
        workers.map(async (w): Promise<WorkerItem | null> => {
          let records;
          try {
            records = await listMyWorkerAttendance(resolvedFarmId, w.id, { farmCropId });
          } catch {
            return null;
          }
          const present = records.filter((r) => r.present);
          if (present.length === 0) return null;
          const hours = present.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
          const tasks = Array.from(new Set(present.map((r) => r.activity).filter((a): a is string => !!a)))
            .map(activityLabel)
            .join(', ');
          const hourlyRatePaise = w.payType === 'monthly' ? w.payRatePaise / 208 : w.payRatePaise / 8;
          const earningsPaise = Math.round(hours * hourlyRatePaise);
          return {
            id: w.id,
            initials: initialsOf(w.name),
            name: w.name,
            tasks: tasks || '—',
            hours: `${hours} h`,
            earnings: formatPaiseFull(earningsPaise),
          };
        }),
      );
      setWorkerRows(rows.filter((r): r is WorkerItem => r !== null));
    } catch {
      // Swallowed for the same reason as the farm-context resolution above.
    }
  }, [resolvedFarmId, cropHasRealId, crop]);

  useEffect(() => {
    void loadCropWorkforce();
  }, [loadCropWorkforce]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

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
            <Text style={styles.headerTitle}>Workforce Hours</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Green Hero Summary Card ── */}
          <View style={styles.heroCard}>
            <Text style={styles.heroSubLabel}>Total Labour Cost</Text>
            <Text style={styles.heroCostValue}>{formatPaiseFull(summary?.totalCostPaise ?? 0)}</Text>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetricsRow}>
              {/* Col 1 */}
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Hours Logged</Text>
                <Text style={styles.heroMetricValue}>{summary?.hoursLogged ?? 0} h</Text>
              </View>

              {/* Col 2 */}
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Workers Involved</Text>
                <Text style={styles.heroMetricValue}>{summary?.workersInvolved ?? 0}</Text>
              </View>

              {/* Col 3 */}
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Avg Rate</Text>
                <Text style={styles.heroMetricValue}>{formatPaiseFull(summary?.avgRatePaise ?? 0)}/h</Text>
              </View>
            </View>
          </View>

          {/* ── Section Title: BY WORKER ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>BY WORKER</Text>
          </View>

          {/* ── Workers List ── */}
          <View style={styles.workersList}>
            {workerRows.map((worker) => (
              <View key={worker.id} style={styles.workerCard}>
                {/* Initials Avatar */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{worker.initials}</Text>
                </View>

                {/* Name & Tasks */}
                <View style={styles.workerDetailsCol}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerTasks}>{worker.tasks}</Text>
                </View>

                {/* Hours & Pay */}
                <View style={styles.workerEarningsCol}>
                  <Text style={styles.workerHours}>{worker.hours}</Text>
                  <Text style={styles.workerEarnings}>{worker.earnings}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
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
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: P.deepGreen,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 22,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroSubLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroCostValue: {
    fontSize: typography.display,
    fontWeight: '800',
    color: P.white,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 14,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetricCol: {
    flex: 1,
  },
  heroMetricLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  heroMetricValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.white,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  workersList: {
    gap: 10,
  },
  workerCard: {
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.twBlue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twBlue700,
  },
  workerDetailsCol: {
    flex: 1,
    marginLeft: 14,
  },
  workerName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  workerTasks: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  workerEarningsCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  workerHours: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.ink,
  },
  workerEarnings: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
});
