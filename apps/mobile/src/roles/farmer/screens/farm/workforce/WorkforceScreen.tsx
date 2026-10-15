import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors, typography } from '../../../theme';
import { getFarms } from '../../../api/farms';
import {
  getMyWorkforcePayrollSummary,
  getMyWorkforceSummary,
  listMyWorkers,
  type PayrollSummaryItem,
  type Worker,
  type WorkforceSummary,
} from '../../../api/workforce';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TimesheetIcon({ size = 20, color = P.blue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 16l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserPlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M2 20a7 7 0 0 1 14 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19 8v6M16 11h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** `YYYY-MM` for "this month", the period `getMyWorkforcePayrollSummary` expects. */
function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Full month name for the Timesheet & Payroll alert, e.g. "September". */
function currentMonthName(): string {
  return new Date().toLocaleString('en-US', { month: 'long' });
}

/** 3-letter month abbreviation for the "Hours · Jul" stat label, e.g. "Sep". */
function currentMonthShort(): string {
  return new Date().toLocaleString('en-US', { month: 'short' });
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

/** Integer paise -> "Daily · ₹450/day" / "Monthly · ₹12,000". */
function formatRateTag(payType: string, payRatePaise: number): string {
  const rupees = Math.round(payRatePaise / 100).toLocaleString('en-IN');
  return payType === 'monthly' ? `Monthly · ₹${rupees}` : `Daily · ₹${rupees}/day`;
}

function formatPaiseFull(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

/** Compact form for the stat card, e.g. "₹20.8k" -- matches the original mock's style. */
function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100;
  if (Math.abs(rupees) >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}k`;
  }
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
}

const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: P.twGreen100, fg: P.twGreen800 },
  { bg: P.twPurple100, fg: P.deepPurple600 },
  { bg: P.twAmber100, fg: P.twAmber800 },
  { bg: P.twBlue50, fg: P.blue700 },
];

export interface WorkforceScreenProps {
  /**
   * Threaded down like PestManagementScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) when this screen is
   * the root of the workforce subtree -- App.tsx's `navigate('Workforce')`
   * passes no farmId today.
   */
  farmId?: string | undefined;
  onBack?: () => void;
  onNavigateToAddWorker?: (farmId: string) => void;
  onNavigateToTimesheet?: () => void;
  onNavigateToPayroll?: () => void;
  onNavigateToWorkerDetail?: (id: string, name?: string, role?: string) => void;
}

export function WorkforceScreen({
  farmId,
  onBack,
  onNavigateToAddWorker,
  onNavigateToTimesheet,
  onNavigateToPayroll,
  onNavigateToWorkerDetail,
}: WorkforceScreenProps): React.JSX.Element {
  // ── Farm context ──
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

  // ── Roster, summary, and this month's payroll (for the per-worker earnings figure) ──
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
  const [payroll, setPayroll] = useState<PayrollSummaryItem[]>([]);

  const loadWorkforce = useCallback(async () => {
    if (!resolvedFarmId) return;
    try {
      const [workerList, summaryData, payrollData] = await Promise.all([
        listMyWorkers(resolvedFarmId),
        getMyWorkforceSummary(resolvedFarmId),
        getMyWorkforcePayrollSummary(resolvedFarmId, currentYearMonth()),
      ]);
      setWorkers(workerList);
      setSummary(summaryData);
      setPayroll(payrollData);
    } catch {
      // Swallowed for the same reason as the farm-context resolution above.
    }
  }, [resolvedFarmId]);

  useEffect(() => {
    void loadWorkforce();
  }, [loadWorkforce]);

  const handleWorkerPress = (worker: Worker) => {
    const roleLabel = `${worker.roleTitle ?? 'Worker'} · ${worker.payType === 'monthly' ? 'Monthly salary' : 'Daily wage'}`;
    if (onNavigateToWorkerDetail) {
      onNavigateToWorkerDetail(worker.id, worker.name, roleLabel);
    } else if (onNavigateToAddWorker) {
      onNavigateToAddWorker(resolvedFarmId);
    } else {
      const payrollRow = payroll.find((p) => p.workerId === worker.id);
      Alert.alert(
        worker.name,
        `Role: ${worker.roleTitle ?? '—'}\nRate: ${formatRateTag(worker.payType, worker.payRatePaise)}\nEarnings this month: ${
          payrollRow ? formatPaiseFull(payrollRow.grossPaise) : '—'
        }\nCrops: —`,
      );
    }
  };

  const handleAddWorker = () => {
    if (onNavigateToAddWorker) {
      onNavigateToAddWorker(resolvedFarmId);
    } else {
      Alert.alert('Add Worker', 'Worker onboarding form coming soon.');
    }
  };

  const handleTimesheetPress = () => {
    if (onNavigateToPayroll) {
      onNavigateToPayroll();
    } else if (onNavigateToTimesheet) {
      onNavigateToTimesheet();
    } else {
      const hours = summary ? summary.hoursThisMonth : 0;
      Alert.alert(
        'Timesheet & Payroll',
        `${currentMonthName()} payroll report: ${hours} total hours logged across ${workerCountLabel} worker${
          workerCountLabel === 1 ? '' : 's'
        }.`,
      );
    }
  };

  const workerCountLabel = summary ? summary.workerCount : workers.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>

            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Workforce</Text>
              <Text style={styles.headerSubtitle}>
                {workerCountLabel} worker{workerCountLabel === 1 ? '' : 's'} on staff
              </Text>
            </View>

            <TouchableOpacity
              style={styles.timesheetBtn}
              onPress={handleTimesheetPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Timesheet & Payroll"
            >
              <TimesheetIcon size={20} color={P.blue700} />
            </TouchableOpacity>
          </View>

          {/* 3 Summary Stats Cards */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => {
                const first = workers[0];
                if (onNavigateToWorkerDetail && first) {
                  handleWorkerPress(first);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Workers details"
            >
              <Text style={styles.statNumber}>{workerCountLabel}</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </TouchableOpacity>
            <View style={styles.statCard}>
              <View style={styles.hoursRow}>
                <Text style={styles.statNumber}>{summary ? summary.hoursThisMonth : 0}</Text>
                <Text style={styles.hourUnit}>h</Text>
              </View>
              <Text style={styles.statLabel}>Hours · {currentMonthShort()}</Text>
            </View>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={handleTimesheetPress}
              accessibilityRole="button"
              accessibilityLabel="Payroll due"
            >
              <Text style={[styles.statNumber, { color: colors.brandGreen }]}>
                {summary ? formatPaiseCompact(summary.payrollDueThisMonthPaise) : '₹0'}
              </Text>
              <Text style={styles.statLabel}>Payroll due</Text>
            </TouchableOpacity>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionHeader}>STAFF</Text>

          {/* Workers List */}
          <View style={styles.workersList}>
            {workers.map((item, idx) => {
              const payrollRow = payroll.find((p) => p.workerId === item.id);
              const avatar = AVATAR_PALETTE[idx % AVATAR_PALETTE.length]!;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.workerCard}
                  onPress={() => handleWorkerPress(item)}
                  activeOpacity={0.75}
                >
                  {/* Left Avatar Circle */}
                  <View style={[styles.avatarCircle, { backgroundColor: avatar.bg }]}>
                    <Text style={[styles.avatarText, { color: avatar.fg }]}>{initialsOf(item.name)}</Text>
                  </View>

                  {/* Middle Info */}
                  <View style={styles.cardContent}>
                    <View style={styles.namePayRow}>
                      <Text style={styles.workerName}>{item.name}</Text>
                      <Text style={styles.workerPay}>
                        {payrollRow ? formatPaiseFull(payrollRow.grossPaise) : '—'}
                      </Text>
                    </View>

                    <Text style={styles.workerRole}>
                      {item.roleTitle ?? '—'} · this month
                    </Text>

                    {/* Badges Row */}
                    <View style={styles.badgesRow}>
                      <View
                        style={[
                          styles.rateBadge,
                          item.payType === 'monthly' ? styles.rateBadgeBlue : styles.rateBadgeGreen,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rateBadgeText,
                            item.payType === 'monthly'
                              ? styles.rateBadgeTextBlue
                              : styles.rateBadgeTextGreen,
                          ]}
                        >
                          {formatRateTag(item.payType, item.payRatePaise)}
                        </Text>
                      </View>

                      {/* Per-worker "crops worked" would need one extra
                          attendance query per worker just for this list
                          view -- judged not worth N extra calls here, so
                          this shows the worker's own roleTitle instead
                          (see final report for this tradeoff). */}
                      {item.roleTitle ? (
                        <View style={styles.cropTag}>
                          <Text style={styles.cropTagText}>{item.roleTitle}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddWorker}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add worker"
        >
          <UserPlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>Add worker</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 2,
  },
  timesheetBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: P.twBlue50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hourUnit: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray500,
    marginLeft: 2,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 4,
    textAlign: 'center',
  },

  sectionHeader: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  workersList: {
    gap: 12,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  namePayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workerName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  workerPay: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  workerRole: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateBadgeGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  rateBadgeBlue: {
    backgroundColor: P.twBlue50,
  },
  rateBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  rateBadgeTextGreen: {
    color: colors.brandGreen,
  },
  rateBadgeTextBlue: {
    color: P.blue700,
  },
  cropTag: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cropTagText: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGray600,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  fabText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
});
