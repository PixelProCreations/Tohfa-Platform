import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { extractFieldErrors, formatErrorMessage } from '../../../../shell/api/client';
import { authPalette as P } from '../../theme';
import {
  createDiaryEntry,
  type CreateDiaryEntryInput,
  type DiaryWorkerInput,
} from '../../api/farmDiary';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function WaterDropletOutlineIcon({ size = 20, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UsersGroupIcon({ size = 16, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseRedIcon({ size = 14, color = P.twRed500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseWhiteIcon({ size = 10, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.slate500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleIcon({ size = 18, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = P.slate600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CameraPlusIcon({ size = 22, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MicrophoneIcon({ size = 16, color = P.slate600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon({ size = 14, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3l14 9-14 9V3z"
        fill={color}
      />
    </Svg>
  );
}

function NotesIcon({ size = 16, color = P.slate600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Initial Data
// ─────────────────────────────────────────────

interface WorkerEntry {
  id: string;
  initials: string;
  name: string;
  role: string;
  hoursWorked: string;
  wageRate: number;
  task: string;
}

const IRRIGATION_METHODS = [
  'Drip',
  'Sprinkler',
  'Flood',
  'Furrow',
  'Basin',
  'Sub-surface Drip',
];

const INITIAL_WORKERS: WorkerEntry[] = [
  {
    id: 'w1',
    initials: 'RK',
    name: 'Ravi Kumar',
    role: 'Farm Labourer',
    hoursWorked: '4.5',
    wageRate: 80,
    task: 'Task: Irrigation (Drip line check)',
  },
  {
    id: 'w2',
    initials: 'MS',
    name: 'Muthu Selvam',
    role: 'Farm Labourer',
    hoursWorked: '4.5',
    wageRate: 75,
    task: 'Task: Irrigation (Emitter clearing)',
  },
];

const INITIAL_PHOTOS = [
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&auto=format&fit=crop&q=85',
];

const WAVEFORM_BARS = [10, 16, 22, 12, 18, 14, 20];

export interface NewFarmDiaryEntryStep3ScreenProps {
  crop?: CropItem | null;
  /** Required for the create call. Missing means the Step 1 → 3 navigation lost it. */
  plotId?: string | undefined;
  /** Only present when Step 1 had several active crops and the farmer picked one. */
  farmCropId?: string | undefined;
  categoryKey?: string | undefined;
  subActivityKey?: string | undefined;
  /** Display-only labels for the summary banner, carried forward from Steps 1 and 2. */
  entryCategory?: string | undefined;
  entrySubActivity?: string | undefined;
  fieldZone?: string | undefined;
  cropName?: string | undefined;
  onBack?: () => void;
  onCancel?: () => void;
  onDone?: () => void;
  onSave?: () => void;
}

/** Mirrors the server's zod bound on `minutes` (farm-diary.schema.ts). */
const MAX_MINUTES = 1440;

function toWorkerInputs(
  workers: WorkerEntry[],
  paymentStatus: 'Pending' | 'Paid',
): DiaryWorkerInput[] {
  return workers.map((w) => ({
    name: w.name,
    role: w.role,
    hoursWorked: parseFloat(w.hoursWorked) || 0,
    // The UI holds a rupee rate; the API takes integer paise (root CLAUDE.md §2.2).
    wageRatePaise: Math.round((w.wageRate || 0) * 100),
    paymentStatus: paymentStatus === 'Paid' ? 'PAID' : 'PENDING',
  }));
}

export function NewFarmDiaryEntryStep3Screen({
  crop,
  plotId,
  farmCropId,
  categoryKey,
  subActivityKey,
  entryCategory = '',
  entrySubActivity = '',
  fieldZone = '',
  cropName: cropNameProp,
  onBack,
  onCancel,
  onDone,
  onSave,
}: NewFarmDiaryEntryStep3ScreenProps): React.JSX.Element {
  const cropName = cropNameProp ?? crop?.name ?? '';

  // A missing id here is a navigation bug, not something to mock around: surface
  // it and refuse to save rather than posting a half-formed entry.
  const missingIds = [
    !plotId ? 'field' : null,
    !categoryKey ? 'category' : null,
    !subActivityKey ? 'sub-activity' : null,
  ].filter((x): x is string => x !== null);
  const missingIdsLabel = missingIds.join(', ');
  useEffect(() => {
    if (missingIdsLabel) {
      console.warn(
        `NewFarmDiaryEntryStep3Screen mounted without: ${missingIdsLabel}. ` +
          'The Step 1/2 navigation params were lost.',
      );
    }
  }, [missingIdsLabel]);

  // Details State
  const [irrigationMethod, setIrrigationMethod] = useState<string>('Drip');
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<string>('45');

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Workforce State
  // Off by default: the worker list below is still placeholder data with no
  // real entry UI, and leaving the toggle on would persist fabricated labour
  // rows (and labour cost) on every save.
  const [isWorkforceEnabled, setIsWorkforceEnabled] = useState<boolean>(false);
  const [workers, setWorkers] = useState<WorkerEntry[]>(INITIAL_WORKERS);
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid'>('Pending');

  // Attachments State
  const [photos, setPhotos] = useState<string[]>(INITIAL_PHOTOS);
  const [notes, setNotes] = useState<string>('');

  const handleRemoveWorker = (workerId: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
  };

  const handleAddWorker = () => {
    const newId = `w_${Date.now()}`;
    setWorkers((prev) => [
      ...prev,
      {
        id: newId,
        initials: 'SK',
        name: 'Suresh Kumar',
        role: 'Farm Labourer',
        hoursWorked: '4.0',
        wageRate: 75,
        task: 'Task: Irrigation (Field channel)',
      },
    ]);
  };

  const handleRemovePhoto = (photoIndex: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== photoIndex));
  };

  const handleAddPhoto = () => {
    setPhotos((prev) => [
      ...prev,
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=85',
    ]);
  };

  // Calculations
  const totalCombinedHours = workers.reduce(
    (acc, w) => acc + (parseFloat(w.hoursWorked) || 0),
    0,
  );
  const calculatedTotalCost = workers.reduce(
    (acc, w) => acc + (parseFloat(w.hoursWorked) || 0) * (w.wageRate || 0),
    0,
  );
  const displayTotalCost = calculatedTotalCost.toFixed(2);

  const handleSave = async () => {
    if (isSubmitting) return;
    setSubmitError('');
    setFieldErrors({});

    if (!plotId || !categoryKey || !subActivityKey) {
      setSubmitError(
        `Cannot save: missing ${missingIdsLabel}. Go back and choose them again.`,
      );
      return;
    }

    const minutes = Number(timeSpent.trim());
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > MAX_MINUTES) {
      setFieldErrors({
        minutes: `Enter the time spent as a whole number of minutes (1–${MAX_MINUTES}).`,
      });
      return;
    }

    const trimmedNotes = notes.trim();
    const input: CreateDiaryEntryInput = {
      plotId,
      ...(farmCropId ? { farmCropId } : {}),
      categoryKey,
      subActivityKey,
      minutes,
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      // Omitted entirely (not []) when the toggle is off or nobody was added.
      ...(isWorkforceEnabled && workers.length > 0
        ? { workers: toWorkerInputs(workers, paymentStatus) }
        : {}),
    };

    setIsSubmitting(true);
    try {
      await createDiaryEntry(input);
    } catch (err: unknown) {
      setSubmitError(formatErrorMessage(err, 'Could not save this diary entry.'));
      setFieldErrors(extractFieldErrors(err));
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    if (onSave) {
      onSave();
    } else if (onDone) {
      onDone();
    }
  };

  const handleExit = onCancel ?? onBack;
  const isSaveDisabled = isSubmitting || missingIds.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={18} color={P.twGreen700} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>New Entry</Text>
            <Text style={styles.headerSubtitle}>Step 3 of 3 · Details</Text>
          </View>

          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3-Segment Progress Bar (All 3 Active) ── */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Top Summary Banner Card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBox}>
            <WaterDropletOutlineIcon size={20} color={P.twGreen700} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {[entrySubActivity, cropName].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.summarySubtitle}>
              {[entryCategory, fieldZone].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {missingIds.length > 0 && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              This entry is missing its {missingIdsLabel}. Go back to the earlier steps and choose
              them again before saving.
            </Text>
          </View>
        )}

        {/* ── 2. Irrigation Details Section ── */}
        <Text style={styles.sectionHeading}>IRRIGATION DETAILS</Text>

        {/* Irrigation method Dropdown */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            Irrigation method <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.8}
            onPress={() => setIsMethodModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select Irrigation method"
          >
            <Text style={styles.dropdownSelectedText}>{irrigationMethod}</Text>
            <ChevronDownIcon size={18} color={P.slate500} />
          </TouchableOpacity>
        </View>

        {/* Time spent */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            Time spent <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.timeSpentBox}>
            <TextInput
              style={styles.timeSpentInput}
              value={timeSpent}
              onChangeText={setTimeSpent}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.timeSpentUnit}>minutes</Text>
          </View>
          {fieldErrors['minutes'] ? (
            <Text style={styles.fieldErrorText}>{fieldErrors['minutes']}</Text>
          ) : null}
        </View>

        {/* ── 3. WORKFORCE Card ── */}
        <View style={styles.workforceCard}>
          {/* Workforce Header */}
          <View style={styles.workforceHeader}>
            <View style={styles.workforceTitleRow}>
              <UsersGroupIcon size={18} color={P.twGreen800} />
              <Text style={styles.workforceTitle}>WORKFORCE</Text>
            </View>
            <Switch
              value={isWorkforceEnabled}
              onValueChange={setIsWorkforceEnabled}
              trackColor={{ false: P.slate300, true: P.twGreen800 }}
              thumbColor={P.white}
            />
          </View>

          <Text style={styles.workforceSubtitle}>Did workers help with this activity?</Text>

          {isWorkforceEnabled && (
            <>
              {/* Workers List */}
              {workers.map((worker) => (
                <View key={worker.id} style={styles.workerItemBox}>
                  {/* Worker Top Row */}
                  <View style={styles.workerTopRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{worker.initials}</Text>
                    </View>
                    <View style={styles.workerInfoBox}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text style={styles.workerRole}>{worker.role}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveWorker(worker.id)}
                      activeOpacity={0.7}
                      style={styles.removeWorkerBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${worker.name}`}
                    >
                      <CloseRedIcon size={14} color={P.twRed500} />
                    </TouchableOpacity>
                  </View>

                  {/* Stat Boxes Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>HOURS WORKED</Text>
                      <Text style={styles.statValue}>
                        {worker.hoursWorked} <Text style={styles.statUnit}>hrs</Text>
                      </Text>
                    </View>

                    <View style={[styles.statBox, styles.wageStatBox]}>
                      <Text style={styles.wageStatLabel}>WAGE RATE</Text>
                      <Text style={styles.wageStatValue}>
                        ₹{worker.wageRate} <Text style={styles.wageStatUnit}>/hr</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Task Dropdown */}
                  <TouchableOpacity
                    style={styles.taskDropdown}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={worker.task}
                  >
                    <Text style={styles.taskDropdownText} numberOfLines={1}>
                      {worker.task}
                    </Text>
                    <ChevronDownIcon size={16} color={P.slate500} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Worker Dashed Button */}
              <TouchableOpacity
                style={styles.addWorkerButton}
                onPress={handleAddWorker}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Add Worker"
              >
                <PlusCircleIcon size={18} color={P.twGreen800} />
                <Text style={styles.addWorkerButtonText}>Add Worker</Text>
              </TouchableOpacity>

              {/* Total Labour Cost Dark Banner */}
              <View style={styles.totalCostBanner}>
                <View style={styles.totalCostLeft}>
                  <Text style={styles.totalCostTitle}>Total labour cost</Text>
                  <Text style={styles.totalCostSubtitle}>
                    {workers.length} workers · {totalCombinedHours.toFixed(1)} hrs combined
                  </Text>
                </View>
                <Text style={styles.totalCostAmount}>₹ {displayTotalCost}</Text>
              </View>

              {/* Payment Status Segmented Control */}
              <View style={styles.paymentStatusRow}>
                <Text style={styles.paymentStatusLabel}>Payment status</Text>
                <View style={styles.paymentPillGroup}>
                  <TouchableOpacity
                    style={[
                      styles.paymentPill,
                      paymentStatus === 'Pending' && styles.paymentPillPendingActive,
                    ]}
                    onPress={() => setPaymentStatus('Pending')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Pending"
                  >
                    <Text
                      style={[
                        styles.paymentPillText,
                        paymentStatus === 'Pending' && styles.paymentPillTextPendingActive,
                      ]}
                    >
                      Pending
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentPill,
                      paymentStatus === 'Paid' && styles.paymentPillPaidActive,
                    ]}
                    onPress={() => setPaymentStatus('Paid')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Paid"
                  >
                    <Text
                      style={[
                        styles.paymentPillText,
                        paymentStatus === 'Paid' && styles.paymentPillTextPaidActive,
                      ]}
                    >
                      Paid
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── 4. Photos Section ── */}
        <View style={styles.attachmentSection}>
          <View style={styles.attachmentHeaderRow}>
            <CameraIcon size={16} color={P.slate600} />
            <Text style={styles.attachmentHeaderTitle}>Photos</Text>
          </View>

          <View style={styles.photosGridRow}>
            {photos.map((photoUri, index) => (
              <View key={`photo_${index}`} style={styles.photoThumbWrapper}>
                <Image source={{ uri: photoUri }} style={styles.photoThumbImage} />
                <TouchableOpacity
                  style={styles.photoRemoveBadge}
                  onPress={() => handleRemovePhoto(index)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <CloseWhiteIcon size={8} color={P.white} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addPhotoCard}
              onPress={handleAddPhoto}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <CameraPlusIcon size={22} color={P.twGreen800} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 5. Voice Note Section ── */}
        <View style={styles.attachmentSection}>
          <View style={styles.attachmentHeaderRow}>
            <MicrophoneIcon size={16} color={P.slate600} />
            <Text style={styles.attachmentHeaderTitle}>Voice note</Text>
          </View>

          <View style={styles.voiceNoteCard}>
            <TouchableOpacity
              style={styles.voicePlayBtn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Play voice note"
            >
              <PlayIcon size={13} color={P.twGreen800} />
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
              {WAVEFORM_BARS.map((height, i) => (
                <View
                  key={`bar_${i}`}
                  style={[styles.waveformBar, { height }]}
                />
              ))}
            </View>

            <Text style={styles.voiceDurationText}>0:14</Text>
          </View>
        </View>

        {/* ── 6. Notes Section ── */}
        <View style={styles.attachmentSection}>
          <View style={styles.attachmentHeaderRow}>
            <NotesIcon size={16} color={P.slate600} />
            <Text style={styles.attachmentHeaderTitle}>Notes</Text>
          </View>

          <TextInput
            style={styles.notesTextInput}
            placeholder="Add notes, observations, or special instructions..."
            placeholderTextColor={P.slate400}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {submitError ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Bottom Sticky Action Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaveDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Save entry"
          accessibilityState={{ disabled: isSaveDisabled, busy: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <CheckmarkIcon size={16} color={P.white} />
          )}
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving…' : 'Save entry'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Irrigation Method Selection Modal ── */}
      <Modal
        visible={isMethodModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMethodModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMethodModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Irrigation Method</Text>
            {IRRIGATION_METHODS.map((method) => {
              const isSelected = irrigationMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setIrrigationMethod(method);
                    setIsMethodModalOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={method}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: P.slate900,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: P.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtnText: {
    color: P.slate600,
    fontSize: 14,
    fontWeight: '600',
  },

  /* 3-Segment Progress */
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: P.twGreen700,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  /* Summary Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.mintTintBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.slate900,
  },
  summarySubtitle: {
    fontSize: 12,
    color: P.slate500,
    marginTop: 2,
  },

  /* Section Headings */
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: P.slate500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  /* Form Fields */
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: P.twRed500,
    fontWeight: '700',
  },

  /* Dropdown Box */
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: P.white,
  },
  dropdownSelectedText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.slate900,
  },

  /* Time Spent Input */
  timeSpentBox: {
    width: 140,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.twGreen800,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  timeSpentInput: {
    fontSize: 18,
    fontWeight: '800',
    color: P.slate900,
    padding: 0,
    margin: 0,
  },
  timeSpentUnit: {
    fontSize: 13,
    color: P.slate600,
    marginLeft: 6,
    fontWeight: '500',
  },

  /* Workforce Container */
  workforceCard: {
    borderWidth: 1.5,
    borderColor: P.twGreen800,
    borderRadius: 16,
    padding: 16,
    backgroundColor: P.white,
    marginBottom: 22,
  },
  workforceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workforceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.twGreen800,
    letterSpacing: 0.5,
  },
  workforceSubtitle: {
    fontSize: 12,
    color: P.slate500,
    marginTop: 4,
    marginBottom: 14,
  },

  /* Worker Card */
  workerItemBox: {
    backgroundColor: P.white,
    marginBottom: 14,
  },
  workerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.avatarMintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.twGreen800,
  },
  workerInfoBox: {
    flex: 1,
    marginLeft: 10,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '700',
    color: P.slate900,
  },
  workerRole: {
    fontSize: 11.5,
    color: P.slate500,
    marginTop: 1,
  },
  removeWorkerBtn: {
    padding: 6,
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: P.white,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: P.slate900,
  },
  statUnit: {
    fontSize: 11.5,
    fontWeight: '500',
    color: P.slate500,
  },

  wageStatBox: {
    backgroundColor: P.mintTintBg,
    borderColor: P.mintTintBg,
  },
  wageStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: P.twGreen800,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  wageStatValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: P.twGreen900,
  },
  wageStatUnit: {
    fontSize: 11.5,
    fontWeight: '500',
    color: P.twGreen800,
  },

  /* Task Dropdown */
  taskDropdown: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: P.white,
  },
  taskDropdownText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.slate800,
    flex: 1,
  },

  /* Add Worker Button */
  addWorkerButton: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.twGreen800,
    backgroundColor: P.mintTintBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 14,
  },
  addWorkerButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGreen800,
  },

  /* Total Cost Banner */
  totalCostBanner: {
    backgroundColor: P.darkForestBanner,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCostLeft: {
    flex: 1,
  },
  totalCostTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: P.white,
  },
  totalCostSubtitle: {
    fontSize: 10.5,
    color: P.slate300,
    marginTop: 2,
  },
  totalCostAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: P.white,
  },

  /* Payment Status */
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  paymentStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: P.slate800,
  },
  paymentPillGroup: {
    flexDirection: 'row',
    backgroundColor: P.slate100,
    borderRadius: 8,
    padding: 2,
  },
  paymentPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paymentPillPendingActive: {
    backgroundColor: P.twAmber100,
  },
  paymentPillPaidActive: {
    backgroundColor: P.twGreen100,
  },
  paymentPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.slate500,
  },
  paymentPillTextPendingActive: {
    color: P.twAmber800,
    fontWeight: '700',
  },
  paymentPillTextPaidActive: {
    color: P.twGreen800,
    fontWeight: '700',
  },

  /* Attachments (Photos, Voice Note, Notes) */
  attachmentSection: {
    marginBottom: 20,
  },
  attachmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  attachmentHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.slate700,
  },

  /* Photos Grid */
  photosGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoThumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    position: 'relative',
    overflow: 'visible',
  },
  photoThumbImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: P.slate800,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: P.white,
  },
  addPhotoCard: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.twGreen500,
    backgroundColor: P.twGreen50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Voice Note Player */
  voiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: P.white,
  },
  voicePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 14,
  },
  waveformBar: {
    width: 14,
    borderRadius: 3,
    backgroundColor: P.waveformBarBg,
  },
  voiceDurationText: {
    fontSize: 12,
    fontWeight: '500',
    color: P.slate500,
    marginLeft: 10,
  },

  /* Notes Text Input */
  notesTextInput: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 14,
    backgroundColor: P.white,
    minHeight: 70,
    padding: 12,
    fontSize: 13,
    color: P.slate900,
  },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  backButtonText: {
    color: P.slate800,
    fontSize: 14.5,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.twGreen800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: P.white,
    fontSize: 14.5,
    fontWeight: '700',
  },

  /* Errors */
  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorBannerText: {
    fontSize: 12.5,
    color: P.twRed700,
    lineHeight: 18,
  },
  fieldErrorText: {
    fontSize: 11.5,
    color: P.twRed700,
    marginTop: 6,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 18,
    elevation: 6,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: P.slate900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: 14.5,
    color: P.slate800,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: P.twGreen800,
    fontWeight: '700',
  },
});
