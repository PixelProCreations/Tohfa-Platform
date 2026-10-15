import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../api/farms';
import {
  createPestTreatmentReminder,
  listPestDetections,
  listPestTreatmentReminders,
  updatePestTreatmentReminder,
  type CreatePestTreatmentReminderInput,
  type PestDetection,
  type PestRepeatInterval,
  type PestTreatmentReminder,
} from '../../../api/pest';

// ── Icons ────────────────────────────────────────────────────────────────────

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

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarScheduleIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 14v4M10 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Empty/unchecked circle -- the visible "tap here to mark done" affordance for an Upcoming reminder. */
function CircleOutlineIcon({ size = 22, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
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

function ChevronLeftIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarMiniIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 15, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface TreatmentScheduleScreenProps {
  /**
   * Threaded down from PestManagementScreen when reached via the hub; resolved
   * locally (first farm + first zone) when this screen is opened directly, the
   * same "no plot picker in this mock's UI" fallback UploadNewSoilTestScreen.tsx
   * uses -- there is no zone selector drawn anywhere in this screen either.
   */
  farmId?: string | undefined;
  plotId?: string | undefined;
  onBack?: () => void;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** `Date` -> the `YYYY-MM-DD` the API's `dateSchema` requires (pest.schema.ts). */
function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** `YYYY-MM-DD` (or any ISO datetime) -> the `DD Mon YYYY` this screen displays. */
function formatIsoDisplay(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return formatDisplayDate(d);
}

/**
 * Display label <-> API enum. `REPEAT_OPTIONS`/labels are limited to what
 * `repeatIntervalSchema` (pest.schema.ts) actually accepts -- there is no
 * `DAILY` value in `ONE_TIME | WEEKLY | BIWEEKLY | MONTHLY`, so the mock's old
 * "Daily" option is dropped rather than sent as a value the API would reject.
 */
const REPEAT_OPTIONS: { label: string; value: PestRepeatInterval }[] = [
  { label: 'One-time', value: 'ONE_TIME' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Bi-weekly', value: 'BIWEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
];

const REPEAT_DISPLAY: Record<string, string> = {
  ONE_TIME: 'One-time',
  WEEKLY: 'Repeats weekly',
  BIWEEKLY: 'Repeats bi-weekly',
  MONTHLY: 'Repeats monthly',
};

export function TreatmentScheduleScreen({
  farmId,
  plotId,
  onBack,
}: TreatmentScheduleScreenProps): React.JSX.Element {
  const [resolvedFarmId, setResolvedFarmId] = useState(farmId ?? '');
  const [resolvedPlotId, setResolvedPlotId] = useState(plotId ?? '');
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
          if (!cancelled) setContextError('No farm found. Add a farm before scheduling treatments.');
          return;
        }
        let pid = plotId;
        if (!pid) {
          const plots = await getPlots(fid);
          pid = plots[0]?.id;
        }
        if (!pid) {
          if (!cancelled) setContextError('This farm has no zones yet. Add a zone before scheduling treatments.');
          return;
        }
        if (!cancelled) {
          setResolvedFarmId(fid);
          setResolvedPlotId(pid);
        }
      } catch (err) {
        if (!cancelled) setContextError(formatErrorMessage(err, 'Could not load your farm.'));
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId, plotId]);

  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed'>('Upcoming');
  const [reminders, setReminders] = useState<PestTreatmentReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [remindersError, setRemindersError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    if (!resolvedFarmId || !resolvedPlotId) return;
    setRemindersLoading(true);
    setRemindersError(null);
    try {
      const items = await listPestTreatmentReminders(resolvedFarmId, resolvedPlotId);
      setReminders(items);
    } catch (err) {
      setRemindersError(formatErrorMessage(err, 'Could not load treatment reminders.'));
    } finally {
      setRemindersLoading(false);
    }
  }, [resolvedFarmId, resolvedPlotId]);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  // Live pest detections for the "Linked Detection" picker.
  const [detections, setDetections] = useState<PestDetection[]>([]);

  useEffect(() => {
    if (!resolvedFarmId || !resolvedPlotId) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await listPestDetections(resolvedFarmId, resolvedPlotId);
        if (!cancelled) setDetections(items);
      } catch {
        // Non-fatal -- the picker just offers "None" if detections can't be fetched.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedFarmId, resolvedPlotId]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [linkedDetectionId, setLinkedDetectionId] = useState<string | null>(null);
  const [isDetectionPickerOpen, setIsDetectionPickerOpen] = useState(false);
  const [treatmentName, setTreatmentName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('21 Sep 2026');
  const [repeatOption, setRepeatOption] = useState<PestRepeatInterval>('WEEKLY');
  const [isRepeatPickerOpen, setIsRepeatPickerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dynamic Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calDate, setCalDate] = useState<Date>(new Date(2026, 8, 21));
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(8);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const filteredReminders = reminders.filter((r) => r.status === activeTab);

  const linkedDetection = linkedDetectionId ? detections.find((d) => d.id === linkedDetectionId) ?? null : null;
  const linkedDetectionLabel = linkedDetection
    ? `${linkedDetection.pestName} — detected ${formatIsoDisplay(linkedDetection.detectedOn)}`
    : 'None (General reminder)';

  const handleSaveReminder = async () => {
    if (!treatmentName.trim()) {
      Alert.alert('Required Field', 'Please enter a treatment name.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Same resilient on-demand resolution as AddWorkerScreen.tsx /
      // PestManagementScreen.tsx: resolve farmId/plotId here if the
      // background effect hasn't landed yet, rather than failing Save on
      // that race.
      let saveFarmId = resolvedFarmId;
      let savePlotId = resolvedPlotId;
      if (!saveFarmId || !savePlotId) {
        const farms = await getFarms();
        const fid = farms[0]?.id;
        if (fid) {
          const plots = await getPlots(fid);
          const pid = plots[0]?.id;
          if (pid) {
            saveFarmId = fid;
            savePlotId = pid;
            setResolvedFarmId(fid);
            setResolvedPlotId(pid);
          }
        }
      }
      if (!saveFarmId || !savePlotId) {
        Alert.alert('No Farm Found', 'Add a farm and a zone before scheduling a reminder.');
        setSaving(false);
        return;
      }

      const body: CreatePestTreatmentReminderInput = {
        title: treatmentName.trim(),
        dueDate: toIsoDate(calDate),
        repeatInterval: repeatOption,
        ...(linkedDetection ? { detectionId: linkedDetection.id, targetPest: linkedDetection.pestName } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      const created = await createPestTreatmentReminder(saveFarmId, savePlotId, body);
      setReminders((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setTreatmentName('');
      setNotes('');
      setLinkedDetectionId(null);
      setActiveTab('Upcoming');
    } catch (err) {
      setSaveError(formatErrorMessage(err, 'Could not save this reminder.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminderStatus = async (reminder: PestTreatmentReminder) => {
    if (!resolvedFarmId || !resolvedPlotId) return;
    const nextStatus = reminder.status === 'Upcoming' ? 'Completed' : 'Upcoming';
    try {
      const updated = await updatePestTreatmentReminder(resolvedFarmId, resolvedPlotId, reminder.id, {
        status: nextStatus,
      });
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      // The toggle moves the reminder to the other tab -- it can otherwise
      // look identical to the item being deleted, since it disappears from
      // whichever tab is currently open. Confirm what happened and where to
      // find it, rather than leaving this silent.
      Alert.alert(
        nextStatus === 'Completed' ? 'Marked Complete' : 'Moved Back to Upcoming',
        nextStatus === 'Completed'
          ? `"${updated.title}" is now under the Completed tab.`
          : `"${updated.title}" is now under the Upcoming tab.`,
      );
    } catch (err) {
      Alert.alert('Could Not Update', formatErrorMessage(err, 'Please try again.'));
    }
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleApplyDate = () => {
    setScheduledDate(formatDisplayDate(calDate));
    setIsCalendarOpen(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Treatment Schedule</Text>
            <Text style={styles.headerSubtitle}>
              {reminders.filter((r) => r.status === 'Upcoming').length} upcoming
            </Text>
          </View>
        </View>

        {contextLoading ? (
          <Skeleton height={140} width="100%" />
        ) : contextError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.loadErrorText}>{contextError}</Text>
          </View>
        ) : (
          <>
            {/* ── Filter Tabs ── */}
            <View style={styles.tabRow}>
              {(['Upcoming', 'Completed'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabPill, isActive && styles.tabPillActive]}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Reminders List ── */}
            {remindersLoading ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={80} width="100%" />
                <Skeleton height={80} width="100%" />
              </View>
            ) : remindersError ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.loadErrorText}>{remindersError}</Text>
              </View>
            ) : (
              <View style={styles.remindersList}>
                {filteredReminders.length > 0 ? (
                  filteredReminders.map((item) => {
                    const isCompleted = item.status === 'Completed';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.reminderCard}
                        activeOpacity={0.85}
                        onPress={() => void handleToggleReminderStatus(item)}
                      >
                        <View
                          style={[
                            styles.iconBox,
                            isCompleted ? styles.iconBoxCompleted : styles.iconBoxUpcoming,
                          ]}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon size={22} color={colors.brandGreen} />
                          ) : (
                            <CalendarScheduleIcon size={22} color={P.deepGreen} />
                          )}
                        </View>

                        <View style={styles.reminderContent}>
                          <Text style={styles.reminderTitle}>{item.title}</Text>
                          <Text style={styles.reminderSub}>
                            {isCompleted
                              ? `Completed ${formatIsoDisplay(item.completedAt ?? item.dueDate)}`
                              : `Due ${formatIsoDisplay(item.dueDate)} · ${REPEAT_DISPLAY[item.repeatInterval] ?? item.repeatInterval}`}
                          </Text>
                        </View>

                        {/* Explicit tap target for the status toggle -- the
                            whole card is also tappable (kept for convenience),
                            but this is the visible, labeled affordance so it's
                            clear what tapping actually does. */}
                        <View style={styles.completeToggleCol}>
                          {isCompleted ? (
                            <CheckCircleIcon size={26} color={colors.brandGreen} />
                          ) : (
                            <CircleOutlineIcon size={26} color={P.twGray400} />
                          )}
                          <Text style={styles.completeToggleLabel}>
                            {isCompleted ? 'Tap to reopen' : 'Tap to complete'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No {activeTab.toLowerCase()} treatment reminders</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Floating Add Reminder CTA ── */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingBtn}
          activeOpacity={0.85}
          onPress={() => setIsAddModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add Reminder"
          disabled={contextLoading || !!contextError}
        >
          <Text style={styles.floatingBtnPlus}>+</Text>
          <Text style={styles.floatingBtnText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Treatment Reminder Modal ── */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsAddModalOpen(false)}
            >
              <CloseIcon size={20} color={P.twGray700} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Treatment Reminder</Text>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Field 1: Linked Detection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Linked Detection</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsDetectionPickerOpen(true)}
              >
                <Text style={styles.dropdownValue}>{linkedDetectionLabel}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
              <View style={styles.helperRow}>
                <InfoCircleIcon size={14} color={P.twGray400} />
                <Text style={styles.helperText}>
                  Optional — leave as None for a general reminder not tied to a detection.
                </Text>
              </View>
            </View>

            {/* Field 2: Treatment Name * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Treatment Name <Text style={styles.asterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={treatmentName}
                onChangeText={setTreatmentName}
                placeholder="e.g. Neem Oil Spray"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Field 3: Scheduled Date * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Scheduled Date <Text style={styles.asterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Text style={styles.dropdownValue}>{scheduledDate}</Text>
                <CalendarMiniIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Field 4: Repeat */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Repeat</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsRepeatPickerOpen(true)}
              >
                <Text style={styles.dropdownValue}>
                  {REPEAT_OPTIONS.find((o) => o.value === repeatOption)?.label ?? repeatOption}
                </Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Field 5: Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes"
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
              />
            </View>

            {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
          </ScrollView>

          {/* Modal Bottom Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsAddModalOpen(false)}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={() => void handleSaveReminder()}
              disabled={saving}
            >
              <CheckIcon size={18} color={P.white} />
              <Text style={styles.modalSaveText}>{saving ? 'Saving…' : 'Save Reminder'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── In-Modal Linked Detection Selector Overlay ── */}
          {isDetectionPickerOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsDetectionPickerOpen(false)}
              />
              <View style={styles.pickerCard}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Linked Detection</Text>
                  <TouchableOpacity onPress={() => setIsDetectionPickerOpen(false)}>
                    <CloseIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.pickerOption, linkedDetectionId === null && styles.pickerOptionSelected]}
                  onPress={() => {
                    setLinkedDetectionId(null);
                    setIsDetectionPickerOpen(false);
                  }}
                >
                  <Text
                    style={[styles.pickerOptionText, linkedDetectionId === null && styles.pickerOptionTextSelected]}
                  >
                    None (General reminder)
                  </Text>
                  {linkedDetectionId === null && <CheckIcon size={18} color={P.twGreen700} />}
                </TouchableOpacity>
                {detections.map((d) => {
                  const isSelected = linkedDetectionId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                      onPress={() => {
                        setLinkedDetectionId(d.id);
                        setIsDetectionPickerOpen(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                        {d.pestName} — detected {formatIsoDisplay(d.detectedOn)}
                      </Text>
                      {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── In-Modal Repeat Selector Overlay ── */}
          {isRepeatPickerOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsRepeatPickerOpen(false)}
              />
              <View style={styles.pickerCard}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Repeat Interval</Text>
                  <TouchableOpacity onPress={() => setIsRepeatPickerOpen(false)}>
                    <CloseIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                </View>
                {REPEAT_OPTIONS.map((opt) => {
                  const isSelected = repeatOption === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                      onPress={() => {
                        setRepeatOption(opt.value);
                        setIsRepeatPickerOpen(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                        {opt.label}
                      </Text>
                      {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── In-Modal Dynamic Calendar Overlay ── */}
          {isCalendarOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsCalendarOpen(false)}
              />
              <View style={styles.calModalCard}>
                <View style={styles.calHeader}>
                  <Text style={styles.calFieldBadge}>Scheduled Date</Text>
                  <Text style={styles.calSelectedDateTitle}>
                    {calDate.getDate()} {MONTHS_FULL[calDate.getMonth()]} {calDate.getFullYear()}
                  </Text>
                </View>

                {/* Navigation Row */}
                <View style={styles.calMonthNav}>
                  <TouchableOpacity style={styles.calNavBtn} onPress={handlePrevMonth}>
                    <ChevronLeftIcon size={18} color={P.deepGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.calMonthYearBtn}
                    onPress={() => setIsYearPickerOpen(!isYearPickerOpen)}
                  >
                    <Text style={styles.calMonthYearLabel}>
                      {MONTHS_FULL[calMonth]} {calYear}
                    </Text>
                    <ChevronDownIcon size={14} color={P.deepGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.calNavBtn} onPress={handleNextMonth}>
                    <ChevronRightIcon size={18} color={P.deepGreen} />
                  </TouchableOpacity>
                </View>

                {/* Year Selector or Days Grid */}
                {isYearPickerOpen ? (
                  <View style={styles.yearGridContainer}>
                    <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={false}>
                      <View style={styles.yearGrid}>
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => {
                          const isSel = calYear === y;
                          return (
                            <TouchableOpacity
                              key={`yr-${y}`}
                              style={[styles.yearChip, isSel && styles.yearChipActive]}
                              onPress={() => {
                                setCalYear(y);
                                setCalDate(new Date(y, calMonth, Math.min(calDate.getDate(), new Date(y, calMonth + 1, 0).getDate())));
                                setIsYearPickerOpen(false);
                              }}
                            >
                              <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>
                                {y}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <View style={styles.calWeekdaysRow}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                        <Text key={wd} style={styles.calWeekdayText}>
                          {wd}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.calDaysGrid}>
                      {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                        <View key={`empty-${i}`} style={styles.calDayCellEmpty} />
                      ))}

                      {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const isSelected =
                          calDate.getFullYear() === calYear &&
                          calDate.getMonth() === calMonth &&
                          calDate.getDate() === day;
                        const isToday =
                          new Date().getFullYear() === calYear &&
                          new Date().getMonth() === calMonth &&
                          new Date().getDate() === day;

                        return (
                          <TouchableOpacity
                            key={`day-${day}`}
                            style={styles.calDayCell}
                            onPress={() => setCalDate(new Date(calYear, calMonth, day))}
                          >
                            <View
                              style={[
                                styles.calDayInner,
                                isSelected && styles.calDayInnerSelected,
                                !isSelected && isToday && styles.calDayInnerToday,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.calDayText,
                                  isSelected && styles.calDayTextSelected,
                                  !isSelected && isToday && styles.calDayTextToday,
                                ]}
                              >
                                {day}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Actions */}
                <View style={styles.calFooterActions}>
                  <TouchableOpacity style={styles.calCancelBtn} onPress={() => setIsCalendarOpen(false)}>
                    <Text style={styles.calCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyDate}>
                    <Text style={styles.calApplyBtnText}>Apply Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  loadErrorText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twRed600,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  tabPillActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  tabPillText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabPillTextActive: {
    color: P.white,
    fontWeight: '700',
  },

  // Reminders List
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxUpcoming: {
    backgroundColor: P.twGreen50,
  },
  iconBoxCompleted: {
    backgroundColor: P.twGreen100,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 4,
  },
  reminderSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  completeToggleCol: {
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  completeToggleLabel: {
    fontSize: typography.caption,
    color: P.twGray400,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray400,
  },

  // Floating CTA
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'flex-end',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.deepGreen,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  floatingBtnPlus: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.white,
    lineHeight: 22,
  },
  floatingBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },

  // In-Modal Overlay
  inModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 30,
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.deepGreen,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray700,
  },
  asterisk: {
    color: P.red600,
  },
  dropdownInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.nearBlack,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  helperText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.twGray500,
    lineHeight: 16,
  },
  textInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: typography.body,
    color: P.nearBlack,
  },
  notesInput: {
    minHeight: 70,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
    color: P.nearBlack,
    textAlignVertical: 'top',
  },
  saveErrorText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twRed600,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    gap: 12,
    backgroundColor: P.white,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  // Selection Popups
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  pickerTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  pickerOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  pickerOptionText: {
    fontSize: typography.body,
    color: P.twGray700,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    fontWeight: '700',
    color: P.deepGreen,
  },

  // Calendar
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  calHeader: {
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    paddingBottom: 12,
    marginBottom: 14,
  },
  calFieldBadge: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: P.deepGreen,
    marginBottom: 4,
  },
  calSelectedDateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.nearBlack,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: P.twGray100,
  },
  calMonthYearLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: 180,
  },
  yearScrollView: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
    minWidth: 64,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  yearChipText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  yearChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray400,
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  calDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.deepGreen,
  },
  calDayText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.deepGreen,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  calCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
});
