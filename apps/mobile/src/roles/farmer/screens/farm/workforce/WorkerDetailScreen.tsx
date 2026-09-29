import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms } from '../../../api/farms';
import {
  getMyWorkforcePayrollSummary,
  listMyWorkerAttendance,
  listMyWorkerPayouts,
  type AttendanceRecord,
  type PayrollSummaryItem,
  type WorkerPayout,
} from '../../../api/workforce';
import { localProduceCropsCache } from '../crops/ProduceCalendarScreen';

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

function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 20, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 18, color = P.twBlue500 }: { size?: number; color?: string }) {
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

function WeedingIcon({ size = 18, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21h16M12 21V12M12 12C9 9 5 10 5 10s0 5 7 5M12 12c3-3 7-2 7-2s0 5-7 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FertigationIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8v4l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function ShearsIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8.59" y1="8.59" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.59" y1="15.41" x2="20" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TractorIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="17" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17" cy="15.5" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 17H2.5v-4H8l2.5-4H15v6.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Activity type/labels ─────────────────────────────────────────────────────

interface DayActivity {
  id: string;
  activity: string;
  /** Undefined when a real record's crop can't be resolved (see the
   * `cropFilterOptions()` docblock below) -- the row then just omits the
   * "· crop" segment rather than showing invented explanatory text. */
  crop: string | undefined;
  date: string;
  hours: number;
  type: 'irrigation' | 'weeding' | 'fertigation' | 'harvesting' | 'landprep';
}

/** `irrigation|weeding|...` -- the same set DailyAttendanceScreen.tsx's activity
 * picker and this screen's icon switch both key off, matching `DayActivity['type']`. */
const ACTIVITY_LABELS: Record<string, string> = {
  irrigation: 'Irrigation',
  weeding: 'Weeding',
  fertigation: 'Fertigation',
  harvesting: 'Harvesting',
  landprep: 'Land prep',
};
function activityLabel(raw: string | null | undefined): string {
  if (!raw) return 'Work logged';
  return ACTIVITY_LABELS[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}
function activityType(raw: string | null | undefined): DayActivity['type'] {
  return (raw && raw in ACTIVITY_LABELS ? raw : 'landprep') as DayActivity['type'];
}

// ── Period helpers ───────────────────────────────────────────────────────────

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** The last 6 calendar months (this one first) as `{value: "YYYY-MM", label}` --
 * a client-side option list is fine here (per this feature's brief), it just
 * needs to be real months instead of a fixed "July/June/May 2026". */
function monthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return opts;
}

function periodLabel(period: string): string {
  const [y, m] = period.split('-');
  const idx = m ? parseInt(m, 10) - 1 : NaN;
  return y && MONTHS_FULL[idx] ? `${MONTHS_FULL[idx]} ${y}` : period;
}

function periodBounds(period: string): { start: string; end: string } {
  const [yStr, mStr] = period.split('-');
  const year = Number(yStr);
  const month = Number(mStr); // 1-indexed
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(lastDay)}` };
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

function formatWorkDate(iso: string): string {
  // workDate is `YYYY-MM-DD`; parse manually to avoid UTC/local timezone drift.
  const parts = iso.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const day = parts[2];
  if (!y || !m || !day) return iso;
  return `${String(day).padStart(2, '0')} ${MONTHS_SHORT[m - 1]}`;
}

function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100;
  if (Math.abs(rupees) >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
}

/**
 * ProduceCalendarScreen has no real backend behind it (`localProduceCropsCache`
 * ids like `"crop-1"` are mock, not `farm_crops` UUIDs) -- the same gap
 * CropWorkforceHoursScreen.tsx and DailyAttendanceScreen.tsx flag. This
 * screen's crop filter stays selectable against that mock list (so the UI
 * isn't silently missing a control the mock had), but a real attendance
 * record's `farmCropId` is always a backend UUID that can never match one of
 * these mock ids -- so selecting a specific crop cannot actually narrow the
 * "days worked" list yet. The picker stays selectable (matching the original
 * mock's always-present filter control) rather than showing an explanatory
 * disclaimer the mock never had; it just doesn't filter anything yet.
 */
function cropFilterOptions(): string[] {
  return ['All crops', ...localProduceCropsCache.map((c) => c.name)];
}

export interface WorkerDetailScreenProps {
  /**
   * Threaded down like WorkforceScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) otherwise -- App.tsx's
   * `navigate('WorkerDetail')` passes no farmId today.
   */
  farmId?: string | undefined;
  workerId?: string;
  workerName?: string;
  workerRole?: string;
  onBack?: () => void;
  onNavigateToEditWorker?: (workerData?: any) => void;
}

export function WorkerDetailScreen({
  farmId,
  workerId = 'w1',
  workerName = 'Murugan R.',
  workerRole = 'Field Worker · Daily wage',
  onBack,
  onNavigateToEditWorker,
}: WorkerDetailScreenProps): React.JSX.Element {
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
          if (!cancelled) setContextError('No farm found.');
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

  const months = monthOptions();
  const [selectedMonth, setSelectedMonth] = useState(months[0]!.value);
  const [selectedCrop, setSelectedCrop] = useState('All crops');

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isCropPickerOpen, setIsCropPickerOpen] = useState(false);

  const crops = cropFilterOptions();

  // Initials
  const initials = workerName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MR';

  // ── This worker's attendance + payroll for the selected month ──
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payrollItem, setPayrollItem] = useState<PayrollSummaryItem | null>(null);
  const [paidDetail, setPaidDetail] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!resolvedFarmId || !workerId) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const [records, payrollItems] = await Promise.all([
        listMyWorkerAttendance(resolvedFarmId, workerId, { month: selectedMonth }),
        getMyWorkforcePayrollSummary(resolvedFarmId, selectedMonth),
      ]);
      setAttendance(records);
      const item = payrollItems.find((p) => p.workerId === workerId) ?? null;
      setPayrollItem(item);

      if (item?.paidStatus === 'paid') {
        try {
          const payouts = await listMyWorkerPayouts(resolvedFarmId, workerId);
          const { start, end } = periodBounds(selectedMonth);
          const match: WorkerPayout | undefined = payouts.find(
            (p) => p.periodStart === start && p.periodEnd === end,
          );
          setPaidDetail(
            match
              ? `Paid via ${
                  match.paymentMethod === 'upi'
                    ? 'UPI'
                    : match.paymentMethod === 'bank_transfer'
                      ? 'Bank transfer'
                      : 'Cash'
                } · ${formatShortDate(match.paidAt)}`
              : 'Paid',
          );
        } catch {
          setPaidDetail('Paid');
        }
      } else {
        setPaidDetail(null);
      }
    } catch (err) {
      setDataError(formatErrorMessage(err, "Could not load this worker's activity."));
    } finally {
      setDataLoading(false);
    }
  }, [resolvedFarmId, workerId, selectedMonth]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const presentRecords = attendance.filter((r) => r.present);
  const daysWorked = presentRecords.length;
  const hoursLogged = presentRecords.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
  const wagesAccruedPaise = payrollItem?.grossPaise ?? 0;

  const activities: DayActivity[] = presentRecords
    .slice()
    .sort((a, b) => b.workDate.localeCompare(a.workDate))
    .map((r) => ({
      id: r.id,
      activity: activityLabel(r.activity),
      // No fabricated crop name -- see cropFilterOptions()'s docblock above
      // for why a real record's farmCropId can't be resolved to one of
      // ProduceCalendarScreen's mock crop names. The row omits the segment.
      crop: undefined,
      date: formatWorkDate(r.workDate),
      hours: r.hoursWorked ?? 0,
      type: activityType(r.activity),
    }));

  const renderActivityIcon = (type: DayActivity['type']) => {
    switch (type) {
      case 'irrigation':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twBlue50 }]}>
            <WaterDropIcon size={18} color={P.twBlue500} />
          </View>
        );
      case 'weeding':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twGreen50 }]}>
            <WeedingIcon size={18} color={P.twGreen600} />
          </View>
        );
      case 'fertigation':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twGreen50 }]}>
            <FertigationIcon size={18} color={P.twGreen700} />
          </View>
        );
      case 'harvesting':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twOrange50 }]}>
            <ShearsIcon size={18} color={P.twOrange600} />
          </View>
        );
      case 'landprep':
      default:
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twGreen50 }]}>
            <TractorIcon size={18} color={P.twGreen700} />
          </View>
        );
    }
  };

  const showSkeleton = contextLoading || dataLoading;
  const showError = contextError || dataError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.headerTitles}>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.workerRole}>{workerRole}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (onNavigateToEditWorker) {
                onNavigateToEditWorker({
                  id: workerId,
                  name: workerName,
                  role: workerRole,
                  farmId: resolvedFarmId,
                });
              }
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Edit worker"
          >
            <PencilEditIcon size={18} color={colors.brandGreen} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Dropdown Filters Row ── */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setIsMonthPickerOpen(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterPillText}>{periodLabel(selectedMonth)}</Text>
              <ChevronDownIcon size={15} color={P.twGray500} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setIsCropPickerOpen(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterPillText}>{selectedCrop}</Text>
              <ChevronDownIcon size={15} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {showError ? (
            <Text style={styles.errorText}>{showError}</Text>
          ) : showSkeleton ? (
            <View style={{ gap: 14 }}>
              <Skeleton height={64} width="100%" />
              <Skeleton height={90} width="100%" />
              <Skeleton height={220} width="100%" />
            </View>
          ) : (
            <>
              {/* ── Payment Banner (always visible, like the original mock; defaults
                  to the "pending" state when there's no payroll record yet) ── */}
              {payrollItem?.paidStatus === 'paid' ? (
                <View style={[styles.paymentBanner, styles.paymentBannerPaid]}>
                  <View style={styles.clockIconWrap}>
                    <CheckCircleIcon size={20} color={colors.brandGreen} />
                  </View>
                  <View style={styles.paymentBannerTextCol}>
                    <Text style={[styles.paymentBannerTitle, styles.paymentBannerTitlePaid]}>Payment received</Text>
                    <Text style={styles.paymentBannerSub}>{paidDetail ?? `${periodLabel(selectedMonth)} wages paid`}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.paymentBanner}>
                  <View style={styles.clockIconWrap}>
                    <ClockIcon size={20} color={P.twBlue600} />
                  </View>
                  <View style={styles.paymentBannerTextCol}>
                    <Text style={styles.paymentBannerTitle}>Payment pending</Text>
                    <Text style={styles.paymentBannerSub}>
                      {periodLabel(selectedMonth)} wages not yet paid out
                    </Text>
                  </View>
                </View>
              )}

              {/* ── 3 Stat Summary Cards ── */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{daysWorked}</Text>
                  <Text style={styles.statLabel}>Days worked</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.hoursNumberRow}>
                    <Text style={styles.statNumber}>{hoursLogged}</Text>
                    <Text style={styles.hourUnit}> h</Text>
                  </View>
                  <Text style={styles.statLabel}>Hours logged</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statNumber, { color: colors.brandGreen }]}>
                    {formatPaiseCompact(wagesAccruedPaise)}
                  </Text>
                  <Text style={styles.statLabel}>Wages accrued</Text>
                </View>
              </View>

              {/* ── Days Worked List ── */}
              <Text style={styles.sectionHeaderTitle}>DAYS WORKED</Text>

              <View style={styles.activitiesCard}>
                {activities.map((act, index) => (
                  <View key={act.id}>
                    <View style={styles.activityRow}>
                      {renderActivityIcon(act.type)}

                      <View style={styles.activityInfoCol}>
                        <Text style={styles.activityTitle}>
                          {act.crop ? (
                            <>
                              {act.activity} · <Text style={styles.activityCrop}>{act.crop}</Text>
                            </>
                          ) : (
                            act.activity
                          )}
                        </Text>
                        <Text style={styles.activityDate}>{act.date}</Text>
                      </View>

                      <Text style={styles.activityHours}>{act.hours} h</Text>
                    </View>

                    {index < activities.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                ))}
              </View>

              {/* Bottom Footer Caption */}
              <Text style={styles.footerCaption}>6 more days this month</Text>
            </>
          )}
        </ScrollView>

        {/* Month Picker Modal */}
        <Modal
          visible={isMonthPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMonthPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsMonthPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Period</Text>
              {months.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.modalOption,
                    selectedMonth === m.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(m.value);
                    setIsMonthPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedMonth === m.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Crop Picker Modal */}
        <Modal
          visible={isCropPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCropPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsCropPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Crop</Text>
              {crops.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.modalOption,
                    selectedCrop === c && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCrop(c);
                    setIsCropPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedCrop === c && styles.modalOptionTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen800,
  },
  headerTitles: {
    flex: 1,
  },
  workerName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  workerRole: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: typography.body,
    color: P.twRed600,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterPill: {
    flex: 1,
    height: 44,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.nearBlack,
  },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.paleBlueBg,
    borderLeftWidth: 3.5,
    borderLeftColor: P.twBlue600,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  paymentBannerPaid: {
    backgroundColor: colors.brandGreenLight,
    borderLeftColor: colors.brandGreen,
  },
  clockIconWrap: {
    marginRight: 12,
  },
  paymentBannerTextCol: {
    flex: 1,
  },
  paymentBannerTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twBlue700,
  },
  paymentBannerTitlePaid: {
    color: colors.brandGreen,
  },
  paymentBannerSub: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    marginTop: 2,
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
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statNumber: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.nearBlack,
    letterSpacing: -0.3,
  },
  hoursNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hourUnit: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray400,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  activitiesCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  activityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityInfoCol: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  activityCrop: {
    fontWeight: '500',
    color: P.twGray600,
  },
  activityDate: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 2,
  },
  activityHours: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  rowDivider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
  footerCaption: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray400,
    textAlign: 'center',
    marginTop: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen100,
  },
  modalOptionText: {
    fontSize: typography.bodyLarge,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen800,
  },
});
