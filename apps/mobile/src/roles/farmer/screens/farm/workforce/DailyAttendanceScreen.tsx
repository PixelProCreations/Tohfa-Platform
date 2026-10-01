import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms } from '../../../api/farms';
import {
  listMyFarmAttendanceForDate,
  listMyWorkers,
  upsertMyFarmAttendance,
  type AttendanceRecord,
  type AttendanceUpsertItem,
  type Worker,
} from '../../../api/workforce';
import { ACTIVE_CROP_STATUSES, loadFarmCropEntries } from '../crops/cropItems';

// ── Date helpers ─────────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** `Date` -> the `YYYY-MM-DD` workforce.schema.ts's `dateSchema` requires. */
function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

/** e.g. "Thu · 16 July 2026" -- was a fixed mock string; now reflects the real date so it
 * doesn't keep reading "16 July 2026" forever while the underlying data is today's. */
function formatHeaderDate(d: Date): string {
  return `${WEEKDAYS_SHORT[d.getDay()]} · ${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Activity options ─────────────────────────────────────────────────────────

/** WorkerDetailScreen.tsx's `DayActivity['type']` union -- kept identical so an
 * activity logged here renders correctly on that screen's "Days worked" list. */
type ActivityType = 'irrigation' | 'weeding' | 'fertigation' | 'harvesting' | 'landprep';

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'fertigation', label: 'Fertigation' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'landprep', label: 'Land prep' },
];

function activityLabel(value: string | undefined): string {
  return ACTIVITY_OPTIONS.find((o) => o.value === value)?.label ?? 'Select';
}

// ── Crop options ─────────────────────────────────────────────────────────────

/**
 * Crop options are the farmer's real active farm_crops (loaded with the
 * roster, see `loadAttendance`), so a picked crop's id is a real UUID that
 * workforce.schema.ts's attendance upsert accepts as `farmCropId`. The
 * `isUuid` guard in `buildUpsertItem` is kept as a defensive check that only
 * a well-formed id is ever sent.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

interface CropOption {
  id: string;
  name: string;
}

// ── Per-worker form state ────────────────────────────────────────────────────

interface WorkerAttendanceForm {
  present: boolean;
  activity: ActivityType | undefined;
  /** Real farm_crops UUID of the crop this day's work went to, if any. */
  farmCropId: string | undefined;
  cropLabel: string | undefined;
  /** Raw text field value; parsed/validated at save time. */
  hours: string;
}

const DEFAULT_HOURS = '8';

function initialFormFor(
  worker: Worker,
  record: AttendanceRecord | undefined,
  crops: CropOption[],
): WorkerAttendanceForm {
  if (!record) {
    // Not yet marked today -- default to present with a full working day, the
    // same "sensible default" the old mock's Murugan/Lakshmi cards showed.
    return { present: true, activity: undefined, farmCropId: undefined, cropLabel: undefined, hours: DEFAULT_HOURS };
  }
  const matchedCrop = record.farmCropId
    ? crops.find((c) => c.id === record.farmCropId)
    : undefined;
  return {
    present: record.present,
    activity: (record.activity as ActivityType | null) ?? undefined,
    farmCropId: record.farmCropId ?? undefined,
    // A saved crop that is no longer active (e.g. since harvested) is not in
    // the active-crop options, so it can't be named here -- show an honest
    // "Crop set" rather than dropping the fact that a crop was recorded.
    cropLabel: matchedCrop ? matchedCrop.name : record.farmCropId ? 'Crop set' : undefined,
    hours: record.hoursWorked != null ? String(record.hoursWorked) : DEFAULT_HOURS,
  };
}

function buildUpsertItem(workerId: string, form: WorkerAttendanceForm): AttendanceUpsertItem {
  const item: AttendanceUpsertItem = { workerId, present: form.present };
  if (!form.present) return item;
  if (form.activity) item.activity = form.activity;
  if (isUuid(form.farmCropId)) item.farmCropId = form.farmCropId;
  const hours = Number(form.hours);
  if (form.hours.trim() !== '' && !isNaN(hours) && hours > 0 && hours <= 24) {
    item.hoursWorked = hours;
  }
  return item;
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
  { bg: P.twPurple100, fg: P.twPurple700 },
  { bg: P.twGray100, fg: P.twGray400 },
];

interface DailyAttendanceScreenProps {
  /**
   * Threaded down like WorkforceScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) otherwise -- App.tsx's
   * `navigate('DailyAttendance')` passes no farmId today.
   */
  farmId?: string | undefined;
  onNavigateBack: () => void;
}

export function DailyAttendanceScreen({ farmId, onNavigateBack }: DailyAttendanceScreenProps): React.JSX.Element {
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
          if (!cancelled) setContextError('No farm found. Add a farm before recording attendance.');
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

  // ── Roster + today's attendance ──
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [cropChoices, setCropChoices] = useState<CropOption[]>([]);
  const [forms, setForms] = useState<Record<string, WorkerAttendanceForm>>({});
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    if (!resolvedFarmId) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const [workerList, records, cropData] = await Promise.all([
        listMyWorkers(resolvedFarmId),
        listMyFarmAttendanceForDate(resolvedFarmId, todayIso()),
        // The crop is optional on an attendance row, so a failed crop fetch
        // must not block recording attendance: the crop picker is just empty.
        loadFarmCropEntries({ statuses: ACTIVE_CROP_STATUSES }).catch(() => ({ plots: [], entries: [] })),
      ]);
      const crops: CropOption[] = cropData.entries.map((e) => ({ id: e.item.id, name: e.item.name }));
      setWorkers(workerList);
      setCropChoices(crops);
      const nextForms: Record<string, WorkerAttendanceForm> = {};
      for (const w of workerList) {
        const record = records.find((r) => r.workerId === w.id);
        nextForms[w.id] = initialFormFor(w, record, crops);
      }
      setForms(nextForms);
    } catch (err) {
      setDataError(formatErrorMessage(err, 'Could not load today’s attendance.'));
    } finally {
      setDataLoading(false);
    }
  }, [resolvedFarmId]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const presentCount = useMemo(
    () => Object.values(forms).filter((f) => f.present).length,
    [forms],
  );

  const updateForm = (workerId: string, patch: Partial<WorkerAttendanceForm>) => {
    setForms((prev) => {
      const current = prev[workerId];
      if (!current) return prev;
      return { ...prev, [workerId]: { ...current, ...patch } };
    });
  };

  // ── Activity / crop picker modal ──
  const [picker, setPicker] = useState<{ workerId: string; field: 'activity' | 'crop' } | null>(null);
  const closePicker = () => setPicker(null);

  // ── Save ──
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!resolvedFarmId || workers.length === 0) {
      onNavigateBack();
      return;
    }
    // Validate hours for anyone marked present before sending anything.
    for (const w of workers) {
      const form = forms[w.id];
      if (!form || !form.present) continue;
      const trimmed = form.hours.trim();
      if (trimmed === '') continue;
      const n = Number(trimmed);
      if (isNaN(n) || n <= 0 || n > 24) {
        Alert.alert('Check hours', `${w.name}’s hours must be a number between 0 and 24.`);
        return;
      }
    }
    setSaving(true);
    try {
      const items: AttendanceUpsertItem[] = workers.map((w) => buildUpsertItem(w.id, forms[w.id]!));
      await upsertMyFarmAttendance(resolvedFarmId, todayIso(), items);
      onNavigateBack();
    } catch (err) {
      Alert.alert('Could Not Save Attendance', formatErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Icon name="arrow_back" size={20} color={P.twEmerald900} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Daily Attendance</Text>
          <Text style={styles.headerSubtitle}>{formatHeaderDate(new Date())}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {contextError ? (
          <Text style={styles.errorText}>{contextError}</Text>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>WHO WORKED TODAY</Text>
              <Text style={styles.presentCount}>{presentCount} present</Text>
            </View>

            {dataLoading ? (
              <View style={{ gap: 16 }}>
                <Skeleton height={90} width="100%" />
                <Skeleton height={90} width="100%" />
                <Skeleton height={90} width="100%" />
              </View>
            ) : dataError ? (
              <Text style={styles.errorText}>{dataError}</Text>
            ) : workers.length === 0 ? (
              <Text style={styles.emptyText}>No workers added yet.</Text>
            ) : (
              workers.map((worker, idx) => {
                const form = forms[worker.id];
                if (!form) return null;
                const avatar = AVATAR_PALETTE[idx % AVATAR_PALETTE.length]!;
                return (
                  <View key={worker.id} style={[styles.card, form.present && styles.cardActive]}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.workerInfo}>
                        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
                          <Text style={[styles.avatarText, { color: avatar.fg }]}>{initialsOf(worker.name)}</Text>
                        </View>
                        <View>
                          <Text style={[styles.workerName, !form.present && styles.textMuted]}>{worker.name}</Text>
                          <Text style={styles.workerRole}>
                            {worker.roleTitle ?? 'Worker'} ·{' '}
                            {worker.payType === 'monthly'
                              ? 'Monthly'
                              : `₹${Math.round(worker.payRatePaise / 100)}/day`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        {/* "Mark present by voice" is an intentional, already-decided stub --
                            no speech-to-text feature exists or was requested. Left non-functional. */}
                        <TouchableOpacity style={styles.micButton} disabled>
                          <Image
                            // eslint-disable-next-line @typescript-eslint/no-require-imports -- RN's bundler special-cases require() for static image assets; there is no ESM equivalent.
                            source={require('../../../../../assets/images/mic.png')}
                            style={{
                              width: 18,
                              height: 18,
                              tintColor: form.present ? P.twGray600 : P.twGray400,
                              opacity: form.present ? 1 : 0.5,
                            }}
                          />
                        </TouchableOpacity>
                        <Switch
                          value={form.present}
                          onValueChange={(v) => updateForm(worker.id, { present: v })}
                          trackColor={{ false: P.twGray200, true: P.twGreen800 }}
                          thumbColor={P.weatherCloudWhite}
                        />
                      </View>
                    </View>
                    {form.present && (
                      <View style={styles.formGrid}>
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Crop</Text>
                          <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => setPicker({ workerId: worker.id, field: 'crop' })}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.selectText}>{form.cropLabel ?? 'Select'}</Text>
                            <Icon name="expand_more" size={16} color={P.twGray500} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Activity</Text>
                          <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => setPicker({ workerId: worker.id, field: 'activity' })}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.selectText}>{activityLabel(form.activity)}</Text>
                            <Icon name="expand_more" size={16} color={P.twGray500} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.formGroup, { flex: 0.5 }]}>
                          <Text style={styles.label}>Hours</Text>
                          <TextInput
                            style={styles.textInput}
                            value={form.hours}
                            onChangeText={(v) => updateForm(worker.id, { hours: v.replace(/[^0-9.]/g, '') })}
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            <View style={styles.infoBanner}>
              {/* eslint-disable-next-line @typescript-eslint/no-require-imports -- RN's bundler special-cases require() for static image assets; there is no ESM equivalent. */}
              <Image source={require('../../../../../assets/images/mic.png')} style={{ width: 18, height: 18, tintColor: P.twAmber700 }} />
              <Text style={styles.infoBannerText}>
                Tap the mic to mark a worker present by voice — hands-free while out in the field.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (saving || contextLoading || !!contextError || dataLoading) && { opacity: 0.6 }]}
          onPress={() => void handleSave()}
          disabled={saving || contextLoading || !!contextError || dataLoading}
        >
          <Icon name="check_circle" size={20} color={P.weatherCloudWhite} />
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : "Save today's attendance"}</Text>
        </TouchableOpacity>
      </View>

      {/* Activity / Crop picker modal */}
      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={closePicker}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closePicker}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{picker?.field === 'crop' ? 'Select Crop' : 'Select Activity'}</Text>
            {picker?.field === 'activity' &&
              ACTIVITY_OPTIONS.map((opt) => {
                const currentForm = picker ? forms[picker.workerId] : undefined;
                const isSelected = currentForm?.activity === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      updateForm(picker!.workerId, { activity: opt.value });
                      closePicker();
                    }}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && <Icon name="check" size={18} color={P.twGreen800} />}
                  </TouchableOpacity>
                );
              })}
            {picker?.field === 'crop' &&
              cropChoices.map((opt) => {
                const currentForm = picker ? forms[picker.workerId] : undefined;
                const isSelected = currentForm?.farmCropId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      // Real farm_crops UUID -- sent as farmCropId on save.
                      updateForm(picker!.workerId, { cropLabel: opt.name, farmCropId: opt.id });
                      closePicker();
                    }}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {opt.name}
                    </Text>
                    {isSelected && <Icon name="check" size={18} color={P.twGreen800} />}
                  </TouchableOpacity>
                );
              })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.weatherCloudWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.twGray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twEmerald900,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray400,
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  errorText: {
    fontSize: typography.body,
    color: P.twRed600,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray400,
    letterSpacing: 0.5,
  },
  presentCount: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen800,
  },
  card: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 16,
  },
  cardActive: {
    borderColor: P.twGreen100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  workerName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  workerRole: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 2,
  },
  textMuted: {
    color: P.twGray400,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: P.tanTint6,
    borderWidth: 1,
    borderColor: P.twGray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    gap: 8,
  },
  formGroup: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray400,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: P.weatherCloudWhite,
  },
  selectText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: P.weatherCloudWhite,
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: P.twAmber100,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: typography.body,
    color: P.twAmber800,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: P.weatherCloudWhite,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: P.twGreen800,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: P.weatherCloudWhite,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
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
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
