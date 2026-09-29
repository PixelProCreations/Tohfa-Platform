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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms } from '../../../api/farms';
import {
  createMyWorkerPayout,
  getMyWorkforcePayrollSummary,
  listMyWorkerAttendance,
  listMyWorkerPayouts,
  listMyWorkers,
  type PayrollSummaryItem,
  type Worker,
  type WorkerPayout,
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

function BanknoteCashIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 13, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Period helpers ───────────────────────────────────────────────────────────

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** `YYYY-MM` for "this month", the period `getMyWorkforcePayrollSummary` expects. */
function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function periodLabel(period: string): string {
  const parts = period.split('-');
  const y = parts[0];
  const m = parts[1];
  const idx = m ? parseInt(m, 10) - 1 : NaN;
  return y && MONTHS_FULL[idx] ? `${MONTHS_FULL[idx]} ${y}` : period;
}

/** `YYYY-MM` -> that month's first/last calendar day as `YYYY-MM-DD`, the
 * `periodStart`/`periodEnd` a payout is recorded against. */
function periodBounds(period: string): { start: string; end: string } {
  const parts = period.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]); // 1-indexed
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

function formatPaiseFull(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
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

const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: P.twGreen100, fg: P.twGreen800 },
  { bg: P.twOrange100, fg: P.twOrange700 },
  { bg: P.twPurple100, fg: P.deepPurple600 },
  { bg: P.twBlue50, fg: P.blue700 },
];

// ── View model ───────────────────────────────────────────────────────────────

interface WorkerPayrollRow {
  workerId: string;
  name: string;
  payType: string;
  avatar: { bg: string; fg: string };
  /** e.g. "12 days × ₹450 · 84 h" or "Monthly salary · 98 h" -- computed
   * client-side from this month's attendance (see loadPayroll below); the API
   * has no single endpoint that returns this pre-formatted. */
  calcSubtitle: string;
  grossPaise: number;
  advancesPaise: number;
  netPayablePaise: number;
  paidStatus: string;
  /** Only set for already-paid workers, from their own payout history
   * (listMyWorkerPayouts) -- "Paid" with no detail is the honest fallback
   * when no payout row for this exact period can be found. */
  paidDetails?: string | undefined;
}

export interface PayrollScreenProps {
  /**
   * Threaded down like WorkforceScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) otherwise -- App.tsx's
   * `navigate('Payroll')` passes no farmId today.
   */
  farmId?: string | undefined;
  onBack?: () => void;
  onNavigateToWorkerDetail?: (id: string, name: string) => void;
}

export function PayrollScreen({ farmId, onBack, onNavigateToWorkerDetail }: PayrollScreenProps): React.JSX.Element {
  // ── Farm context ── (same self-resolution pattern as WorkforceScreen.tsx)
  const [resolvedFarmId, setResolvedFarmId] = useState(farmId ?? '');
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setContextLoading(true);
      setContextError(null);
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        if (!fid) {
          if (!cancelled) setContextError('No farm found. Add a farm before managing payroll.');
          return;
        }
        if (!cancelled) setResolvedFarmId(fid);
      } catch (err) {
        if (!cancelled) setContextError(formatErrorMessage(err, 'Could not load your farm.'));
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  const period = currentYearMonth();
  const [rows, setRows] = useState<WorkerPayrollRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadPayroll = useCallback(async () => {
    if (!resolvedFarmId) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const [summary, workers]: [PayrollSummaryItem[], Worker[]] = await Promise.all([
        getMyWorkforcePayrollSummary(resolvedFarmId, period),
        listMyWorkers(resolvedFarmId),
      ]);
      const workerById = new Map(workers.map((w) => [w.id, w] as const));

      // Per-worker days/hours breakdown for `calcSubtitle`: one attendance
      // query per worker for this month, same tradeoff CropWorkforceHoursScreen
      // and WorkforceScreen already accept for this feature -- payroll rows
      // are few (one per worker on the farm), so this stays cheap.
      const built = await Promise.all(
        summary.map(async (item): Promise<WorkerPayrollRow> => {
          const worker = workerById.get(item.workerId);
          const payType = worker?.payType ?? 'daily';
          const rateRupees = worker ? Math.round(worker.payRatePaise / 100) : null;

          let daysWorked = 0;
          let hoursWorked = 0;
          try {
            const records = await listMyWorkerAttendance(resolvedFarmId, item.workerId, { month: period });
            const present = records.filter((r) => r.present);
            daysWorked = present.length;
            hoursWorked = present.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
          } catch {
            // Leave at 0/0 -- the subtitle still renders, just without a
            // days/hours breakdown, rather than failing the whole row.
          }

          const calcSubtitle =
            payType === 'monthly'
              ? `Monthly salary · ${hoursWorked} h`
              : `${daysWorked} day${daysWorked === 1 ? '' : 's'}${
                  rateRupees != null ? ` × ₹${rateRupees}` : ''
                } · ${hoursWorked} h`;

          let paidDetails: string | undefined;
          if (item.paidStatus === 'paid') {
            try {
              const payouts = await listMyWorkerPayouts(resolvedFarmId, item.workerId);
              const { start, end } = periodBounds(period);
              const match: WorkerPayout | undefined = payouts.find(
                (p) => p.periodStart === start && p.periodEnd === end,
              );
              paidDetails = match
                ? `Paid via ${match.paymentMethod === 'upi' ? 'UPI' : match.paymentMethod === 'bank_transfer' ? 'Bank transfer' : 'Cash'} · ${formatShortDate(match.paidAt)}`
                : 'Paid';
            } catch {
              paidDetails = 'Paid';
            }
          }

          return {
            workerId: item.workerId,
            name: item.workerName,
            payType,
            avatar: AVATAR_PALETTE[0]!,
            calcSubtitle,
            grossPaise: item.grossPaise,
            advancesPaise: item.advancesPaise,
            netPayablePaise: item.netPayablePaise,
            paidStatus: item.paidStatus,
            paidDetails,
          };
        }),
      );
      setRows(built.map((r, idx) => ({ ...r, avatar: AVATAR_PALETTE[idx % AVATAR_PALETTE.length]! })));
    } catch (err) {
      setDataError(formatErrorMessage(err, 'Could not load payroll.'));
    } finally {
      setDataLoading(false);
    }
  }, [resolvedFarmId, period]);

  useEffect(() => {
    void loadPayroll();
  }, [loadPayroll]);

  const [payingId, setPayingId] = useState<string | null>(null);

  const pendingTotal = rows.filter((r) => r.paidStatus === 'pending').reduce((sum, r) => sum + r.netPayablePaise, 0);
  const totalPayable = rows.reduce((sum, r) => sum + r.netPayablePaise, 0);
  const paidCount = rows.filter((r) => r.paidStatus === 'paid').length;

  const submitPayout = async (row: WorkerPayrollRow) => {
    if (!resolvedFarmId) return;
    setPayingId(row.workerId);
    try {
      const { start, end } = periodBounds(period);
      const idempotencyKey = `payout-${row.workerId}-${Date.now()}`;
      await createMyWorkerPayout(
        resolvedFarmId,
        row.workerId,
        {
          periodStart: start,
          periodEnd: end,
          amountPaise: row.netPayablePaise,
          paymentMethod: 'upi',
        },
        idempotencyKey,
      );
      Alert.alert('Payment Successful', `Payout of ${formatPaiseFull(row.netPayablePaise)} recorded for ${row.name}.`);
      await loadPayroll();
    } catch (err) {
      // The backend rejects an overpayment (422) and a duplicate payout for
      // the same period (409) -- both land here as a real error, not a
      // silent success like the old mock assumed.
      Alert.alert('Payout Failed', formatErrorMessage(err, 'Could not record this payout. Please try again.'));
    } finally {
      setPayingId(null);
    }
  };

  const handlePayout = (row: WorkerPayrollRow) => {
    Alert.alert(
      'Process Payout',
      `Confirm payout of ${formatPaiseFull(row.netPayablePaise)} to ${row.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay via UPI', onPress: () => void submitPayout(row) },
      ],
    );
  };

  const showError = contextError || dataError;
  const showSkeleton = contextLoading || dataLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Payroll</Text>
            <Text style={styles.headerSubtitle}>{periodLabel(period)}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showError ? (
            <Text style={styles.loadErrorText}>{showError}</Text>
          ) : showSkeleton ? (
            <View style={{ gap: 14 }}>
              <Skeleton height={130} width="100%" />
              <Skeleton height={110} width="100%" />
              <Skeleton height={110} width="100%" />
            </View>
          ) : (
            <>
              {/* ── Total Payable Banner Card ── */}
              <View style={styles.totalPayableCard}>
                <Text style={styles.totalPayableLabel}>Total payable · {periodLabel(period).split(' ')[0]}</Text>
                <Text style={styles.totalPayableAmount}>{formatPaiseFull(totalPayable)}</Text>

                {/* 3-column stats bar */}
                <View style={styles.totalPayableStatsRow}>
                  <View style={styles.payableStatCol}>
                    <Text style={styles.payableStatNumber}>{rows.length}</Text>
                    <Text style={styles.payableStatLabel}>workers</Text>
                  </View>

                  <View style={styles.payableStatDivider} />

                  <View style={styles.payableStatCol}>
                    <Text style={styles.payableStatNumber}>{formatPaiseFull(pendingTotal)}</Text>
                    <Text style={styles.payableStatLabel}>still pending</Text>
                  </View>

                  <View style={styles.payableStatDivider} />

                  <View style={styles.payableStatCol}>
                    <Text style={styles.payableStatNumber}>{paidCount}</Text>
                    <Text style={styles.payableStatLabel}>paid</Text>
                  </View>
                </View>
              </View>

              {/* ── Section: PER WORKER ── */}
              <Text style={styles.sectionHeader}>PER WORKER</Text>

              {rows.length === 0 ? (
                <Text style={styles.emptyText}>No workers to pay this period.</Text>
              ) : (
                <View style={styles.workersList}>
                  {rows.map((worker) => (
                    <View key={worker.workerId} style={styles.workerPayrollCard}>
                      {/* Top Row: Avatar, Name, Subtitle, Status Badge */}
                      <TouchableOpacity
                        style={styles.workerHeaderRow}
                        activeOpacity={0.8}
                        onPress={() => onNavigateToWorkerDetail?.(worker.workerId, worker.name)}
                      >
                        <View style={[styles.avatarCircle, { backgroundColor: worker.avatar.bg }]}>
                          <Text style={[styles.avatarText, { color: worker.avatar.fg }]}>
                            {initialsOf(worker.name)}
                          </Text>
                        </View>

                        <View style={styles.workerInfoCol}>
                          <Text style={styles.workerName}>{worker.name}</Text>
                          <Text style={styles.workerSubtitle}>{worker.calcSubtitle}</Text>
                        </View>

                        {worker.paidStatus === 'pending' ? (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        ) : (
                          <View style={styles.paidBadge}>
                            <CheckmarkCircleIcon size={13} color={colors.brandGreen} />
                            <Text style={styles.paidBadgeText}>Paid</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <View style={styles.cardDivider} />

                      {/* Financial Breakdown */}
                      {worker.paidStatus === 'pending' ? (
                        <View style={styles.financialSection}>
                          {worker.payType === 'monthly' ? (
                            <View style={styles.financeRow}>
                              <Text style={styles.financeLabel}>Monthly salary</Text>
                              <Text style={styles.financeValue}>{formatPaiseFull(worker.grossPaise)}</Text>
                            </View>
                          ) : (
                            <View style={styles.financeRow}>
                              <Text style={styles.financeLabel}>Gross salary</Text>
                              <Text style={styles.financeValue}>{formatPaiseFull(worker.grossPaise)}</Text>
                            </View>
                          )}

                          {worker.advancesPaise > 0 && (
                            <View style={styles.financeRow}>
                              <Text style={styles.financeLabel}>Advance taken</Text>
                              <Text style={styles.financeValueRed}>- {formatPaiseFull(worker.advancesPaise)}</Text>
                            </View>
                          )}

                          <View style={styles.netPayableRow}>
                            <Text style={styles.netPayableLabel}>Net payable</Text>
                            <Text style={styles.netPayableValue}>{formatPaiseFull(worker.netPayablePaise)}</Text>
                          </View>

                          {/* Pay Out Action Button */}
                          <TouchableOpacity
                            style={[styles.payoutButton, payingId === worker.workerId && { opacity: 0.6 }]}
                            onPress={() => handlePayout(worker)}
                            activeOpacity={0.85}
                            disabled={payingId === worker.workerId}
                            accessibilityRole="button"
                            accessibilityLabel={`Pay out ${formatPaiseFull(worker.netPayablePaise)}`}
                          >
                            <BanknoteCashIcon size={18} color={P.white} />
                            <Text style={styles.payoutButtonText}>
                              {payingId === worker.workerId
                                ? 'Processing…'
                                : `Pay out ${formatPaiseFull(worker.netPayablePaise)}`}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.paidSection}>
                          <View style={styles.netPaidRow}>
                            <View>
                              <Text style={styles.netPaidLabel}>Net paid</Text>
                              <Text style={styles.paidMethodText}>{worker.paidDetails}</Text>
                            </View>
                            <Text style={styles.netPaidValue}>{formatPaiseFull(worker.netPayablePaise)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
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
    backgroundColor: P.lightSurfaceAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
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
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadErrorText: {
    fontSize: typography.body,
    color: P.twRed600,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
  },

  // Total Payable Banner Card
  totalPayableCard: {
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 20,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  totalPayableLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  totalPayableAmount: {
    fontSize: typography.display,
    fontWeight: '800',
    color: P.white,
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  totalPayableStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  payableStatCol: {
    flex: 1,
  },
  payableStatNumber: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  payableStatLabel: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  payableStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },

  sectionHeader: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  workersList: {
    gap: 14,
  },
  workerPayrollCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  workerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  workerInfoCol: {
    flex: 1,
  },
  workerName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  workerSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: P.twAmber100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twAmber800,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paidBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 12,
  },

  financialSection: {
    gap: 8,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  financeValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.nearBlack,
  },
  financeValueRed: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twRed600,
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  netPayableLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  netPayableValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.nearBlack,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 4,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  paidSection: {
    paddingVertical: 2,
  },
  netPaidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPaidLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  paidMethodText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 2,
  },
  netPaidValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: colors.brandGreen,
  },
});
