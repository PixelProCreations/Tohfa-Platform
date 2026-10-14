import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms } from '../../../api/farms';
import {
  createMyWorker,
  getMyWorker,
  updateMyWorker,
  uploadWorkerIdProof,
  uploadWorkerPhoto,
  type CreateWorkerInput,
  type UpdateWorkerInput,
  type Worker,
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

function CameraIcon({ size = 14, color = P.white }: { size?: number; color?: string }) {
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

function CalendarIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function CheckIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PdfDocIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13h4M10 17h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Date Helpers ─────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

function parseDisplayDate(str: string): Date {
  if (!str) return new Date();
  const parts = str.trim().split(/\s+/);
  const part0 = parts[0];
  const part1 = parts[1];
  const part2 = parts[2];
  if (parts.length === 3 && part0 && part1 && part2) {
    const day = parseInt(part0, 10);
    const monthIdx = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === part1.toLowerCase().slice(0, 3));
    const year = parseInt(part2, 10);
    if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
      return new Date(year, monthIdx, day);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** `Date` -> the `YYYY-MM-DD` workforce.schema.ts's `dateSchema` requires. */
function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkerFormData {
  id?: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  idProofName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  salaryType: 'daily' | 'monthly';
  wageAmount: string;
}

export interface AddWorkerScreenProps {
  /**
   * Threaded down like WorkforceScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) when this screen is
   * reached directly -- App.tsx's `navigate('AddWorker')` passes no farmId
   * today, the same situation WorkforceScreen resolves for itself.
   */
  farmId?: string | undefined;
  initialWorker?: Partial<WorkerFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: WorkerFormData) => void;
}

export function AddWorkerScreen({
  farmId,
  initialWorker,
  onBack,
  onCancel,
  onSave,
}: AddWorkerScreenProps): React.JSX.Element {
  const isEditing = Boolean(initialWorker?.id || initialWorker?.name);

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
        // Swallowed: this is a background pre-fetch for the edit-mode worker
        // load below; handleSave resolves the farm again on demand at save
        // time, so a failure here just means that retry does the work instead.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  // ── Full worker record (edit mode) ──
  // App.tsx's WorkerDetailScreen -> AddWorker navigation only forwards
  // {id, name, role} (see WorkerDetailScreen.tsx's onNavigateToEditWorker
  // call), not the full worker -- so the real bank/pay/DOB fields for an
  // existing worker are fetched here rather than trusted from initialWorker.
  const [fetchedWorker, setFetchedWorker] = useState<Worker | null>(null);

  const [name, setName] = useState(initialWorker?.name || '');
  const [dob, setDob] = useState(initialWorker?.dob || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(initialWorker?.gender || 'Male');
  const [isGenderPickerOpen, setIsGenderPickerOpen] = useState(false);

  // Dynamic Date Picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(() => parseDisplayDate(dob));
  const [calendarYear, setCalendarYear] = useState<number>(() => parseDisplayDate(dob).getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => parseDisplayDate(dob).getMonth());
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const openDatePicker = () => {
    const parsed = parseDisplayDate(dob);
    setCalendarDate(parsed);
    setCalendarYear(parsed.getFullYear());
    setCalendarMonth(parsed.getMonth());
    setIsYearPickerOpen(false);
    setIsDatePickerOpen(true);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleConfirmDate = () => {
    setDob(formatDisplayDate(calendarDate));
    setIsDatePickerOpen(false);
  };

  const [idProofName, setIdProofName] = useState(initialWorker?.idProofName || '');
  const [accountNo, setAccountNo] = useState(initialWorker?.accountNo || '');
  const [ifsc, setIfsc] = useState(initialWorker?.ifsc || '');
  const [upiId, setUpiId] = useState(initialWorker?.upiId || '');
  const [salaryType, setSalaryType] = useState<'daily' | 'monthly'>(initialWorker?.salaryType || 'daily');
  const [wageAmount, setWageAmount] = useState(initialWorker?.wageAmount || '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // `POST /uploads/sign` now returns the uploads-table row id alongside the
  // signed target, so the worker's id proof / photo can actually be linked to
  // the worker record on save -- see handleUploadDoc/handlePickPhoto below.
  const [idProofUploadId, setIdProofUploadId] = useState<string | undefined>(undefined);
  const [photoUploadId, setPhotoUploadId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isEditing || !initialWorker?.id || !resolvedFarmId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const w = await getMyWorker(resolvedFarmId, initialWorker.id!);
        if (cancelled) return;
        setFetchedWorker(w);
        setName(w.name);
        setDob(w.dateOfBirth ? formatDisplayDate(new Date(`${w.dateOfBirth}T00:00:00`)) : '');
        setGender(w.gender === 'Female' || w.gender === 'Other' ? w.gender : 'Male');
        setAccountNo(w.bankAccountNo ?? '');
        setIfsc(w.ifscCode ?? '');
        setUpiId(w.upiId ?? '');
        setSalaryType(w.payType === 'monthly' ? 'monthly' : 'daily');
        setWageAmount(String(Math.round(w.payRatePaise / 100)));
        // The server only stores an upload id, never a filename -- there is no
        // real filename to show here, so this stays blank rather than the
        // mock's fabricated "aadhaar_murugan.pdf".
      } catch {
        // Swallowed: the form still renders with whatever initialWorker gave it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, initialWorker?.id, resolvedFarmId]);

  // Compute avatar initials
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the worker name.');
      return;
    }
    const rupees = wageAmount.trim() ? Number(wageAmount.replace(/[^0-9.]/g, '')) : NaN;
    if (!wageAmount.trim() || isNaN(rupees) || rupees <= 0) {
      Alert.alert(
        'Required Field',
        `Please enter a valid ${salaryType === 'daily' ? 'daily wage' : 'monthly salary'} amount.`,
      );
      return;
    }
    // Rupee display string -> integer paise (root CLAUDE.md §2.2: money is
    // never a float). Round guards a stray fractional-paise rupee value
    // (e.g. "450.005") before it reaches the API's integer paise schema.
    const payRatePaise = Math.round(rupees * 100);
    const dateOfBirth = dob.trim() ? toIsoDate(parseDisplayDate(dob)) : undefined;

    setSaving(true);
    try {
      // The `farmId` prop (or this screen's own background getFarms() call,
      // see the effect above) may not have resolved yet if the caller's own
      // farm data was still loading at navigation time -- rather than
      // failing the save on that race, resolve it here on demand so Save
      // never depends on timing.
      let saveFarmId = resolvedFarmId;
      if (!saveFarmId) {
        const farms = await getFarms();
        saveFarmId = farms[0]?.id ?? '';
        if (saveFarmId) setResolvedFarmId(saveFarmId);
      }
      if (!saveFarmId) {
        Alert.alert('No Farm Found', 'Add a farm before adding workers.');
        setSaving(false);
        return;
      }

      const workerId = fetchedWorker?.id ?? initialWorker?.id;
      if (isEditing && workerId) {
        const input: UpdateWorkerInput = {
          name: name.trim(),
          dateOfBirth: dateOfBirth ?? null,
          gender,
          bankAccountNo: accountNo.trim() || null,
          ifscCode: ifsc.trim() || null,
          upiId: upiId.trim() || null,
          payType: salaryType,
          payRatePaise,
          ...(idProofUploadId ? { idProofUploadId } : {}),
          ...(photoUploadId ? { photoUploadId } : {}),
        };
        await updateMyWorker(saveFarmId, workerId, input);
      } else {
        const input: CreateWorkerInput = {
          name: name.trim(),
          ...(dateOfBirth ? { dateOfBirth } : {}),
          gender,
          ...(accountNo.trim() ? { bankAccountNo: accountNo.trim() } : {}),
          ...(ifsc.trim() ? { ifscCode: ifsc.trim() } : {}),
          ...(upiId.trim() ? { upiId: upiId.trim() } : {}),
          payType: salaryType,
          payRatePaise,
          ...(idProofUploadId ? { idProofUploadId } : {}),
          ...(photoUploadId ? { photoUploadId } : {}),
        };
        await createMyWorker(saveFarmId, input);
      }

      const payload: WorkerFormData = {
        id: workerId || `w-${Date.now()}`,
        name: name.trim(),
        dob,
        gender,
        idProofName,
        accountNo,
        ifsc,
        upiId,
        salaryType,
        wageAmount,
      };

      if (onSave) {
        onSave(payload);
      } else {
        Alert.alert(
          isEditing ? 'Worker Updated' : 'Worker Added',
          `${name.trim()} has been successfully saved to your workforce.`,
          [{ text: 'OK', onPress: onBack || onCancel }],
        );
      }
    } catch (err) {
      Alert.alert('Could Not Save', formatErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });
      const uri = picked.fileCopyUri ?? picked.uri;
      const fileName = picked.name ?? 'id_proof';
      setIdProofName(fileName);
      try {
        const uploaded = await uploadWorkerIdProof(uri, fileName, picked.type ?? 'application/octet-stream');
        setIdProofUploadId(uploaded.uploadId);
      } catch (err) {
        Alert.alert('Upload Failed', formatErrorMessage(err, 'The file was picked but could not be uploaded.'));
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Could Not Attach Document', formatErrorMessage(err, 'Please try again.'));
      }
    }
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const uri = picked.fileCopyUri ?? picked.uri;
      setPhotoUri(uri);
      try {
        const uploaded = await uploadWorkerPhoto(uri, picked.name ?? 'worker_photo.jpg', picked.type ?? 'image/jpeg');
        setPhotoUploadId(uploaded.uploadId);
      } catch (err) {
        Alert.alert('Upload Failed', formatErrorMessage(err, 'The photo was picked but could not be uploaded.'));
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Could Not Attach Photo', formatErrorMessage(err, 'Please try again.'));
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack || onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>{isEditing ? 'Edit Worker' : 'Add Worker'}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {name.trim() || 'New profile'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onCancel || onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar Photo Section ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickPhoto}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Change worker photo"
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarCircle} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}

              <View style={styles.cameraBadge}>
                <CameraIcon size={13} color={P.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarHint}>Add photo (optional)</Text>
          </View>

          {/* ── Form Fields ── */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter worker full name"
                placeholderTextColor={P.twGray400}
                autoCapitalize="words"
              />
            </View>

            {/* Date of Birth & Gender */}
            <View style={styles.twoColumnRow}>
              {/* Date of Birth */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>Date of birth</Text>
                <TouchableOpacity
                  style={styles.pickerInputBox}
                  activeOpacity={0.8}
                  onPress={openDatePicker}
                >
                  <Text style={styles.pickerValueText}>{dob}</Text>
                  <CalendarIcon size={18} color={P.twGray400} />
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <TouchableOpacity
                  style={styles.pickerInputBox}
                  activeOpacity={0.8}
                  onPress={() => setIsGenderPickerOpen(true)}
                >
                  <Text style={styles.pickerValueText}>{gender}</Text>
                  <ChevronDownIcon size={16} color={P.twGray500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ID Proof (Aadhaar) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ID proof (Aadhaar)</Text>
              <TouchableOpacity
                style={styles.dashedFileContainer}
                onPress={handleUploadDoc}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Upload Aadhaar ID proof"
              >
                <PdfDocIcon size={20} color={colors.brandGreen} />
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {idProofName}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Payment Details ── */}
            <Text style={styles.sectionHeaderTitle}>PAYMENT DETAILS</Text>

            <View style={styles.twoColumnRow}>
              {/* Account No */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>Account no.</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNo}
                  onChangeText={setAccountNo}
                  placeholder="Enter account no."
                  placeholderTextColor={P.twGray400}
                />
              </View>

              {/* IFSC */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>IFSC</Text>
                <TextInput
                  style={styles.textInput}
                  value={ifsc}
                  onChangeText={setIfsc}
                  placeholder="IFSC Code"
                  placeholderTextColor={P.twGray400}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* UPI ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>UPI ID</Text>
              <TextInput
                style={styles.textInput}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. name@okhdfcbank"
                placeholderTextColor={P.twGray400}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* ── Salary Details ── */}
            <Text style={styles.sectionHeaderTitle}>SALARY</Text>

            {/* Daily / Monthly Segmented Toggle */}
            <View style={styles.salarySegmentContainer}>
              <TouchableOpacity
                style={[
                  styles.salarySegmentBtn,
                  salaryType === 'daily' && styles.salarySegmentBtnActive,
                ]}
                onPress={() => setSalaryType('daily')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.salarySegmentText,
                    salaryType === 'daily' && styles.salarySegmentTextActive,
                  ]}
                >
                  Daily wage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.salarySegmentBtn,
                  salaryType === 'monthly' && styles.salarySegmentBtnActive,
                ]}
                onPress={() => setSalaryType('monthly')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.salarySegmentText,
                    salaryType === 'monthly' && styles.salarySegmentTextActive,
                  ]}
                >
                  Monthly salary
                </Text>
              </TouchableOpacity>
            </View>

            {/* Wage Amount Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {salaryType === 'daily' ? 'Daily Wage Rate (₹)' : 'Monthly Salary Amount (₹)'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={wageAmount}
                onChangeText={setWageAmount}
                placeholder={salaryType === 'daily' ? '450' : '12000'}
                placeholderTextColor={P.twGray400}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Floating Save Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={() => void handleSave()}
            activeOpacity={0.85}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Save changes' : 'Add Worker'}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add Worker'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gender Picker Modal */}
        <Modal
          visible={isGenderPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsGenderPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsGenderPickerOpen(false)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <TouchableOpacity
                  onPress={() => setIsGenderPickerOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseIcon size={18} color={P.twGray400} />
                </TouchableOpacity>
              </View>
              {(['Male', 'Female', 'Other'] as const).map((opt) => {
                const isSelected = gender === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setGender(opt);
                      setIsGenderPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* Dynamic Date of Birth Picker Modal */}
        <Modal
          visible={isDatePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDatePickerOpen(false)}
        >
          <View style={styles.calModalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsDatePickerOpen(false)}
            />
            <View style={styles.calModalCard}>
              {/* Header */}
              <View style={styles.calHeader}>
                <Text style={styles.calFieldBadge}>Date of Birth</Text>
                <Text style={styles.calSelectedDateTitle}>
                  {calendarDate.getDate()} {MONTHS_FULL[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </Text>
              </View>

              {/* Navigation Row */}
              <View style={styles.calMonthNav}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={handlePrevMonth}
                  accessibilityLabel="Previous month"
                >
                  <ChevronLeftIcon size={18} color={P.deepGreen} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calMonthYearBtn}
                  onPress={() => setIsYearPickerOpen(!isYearPickerOpen)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.calMonthYearLabel}>
                    {MONTHS_FULL[calendarMonth]} {calendarYear}
                  </Text>
                  <ChevronDownIcon size={14} color={P.deepGreen} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={handleNextMonth}
                  accessibilityLabel="Next month"
                >
                  <ChevronRightIcon size={18} color={P.deepGreen} />
                </TouchableOpacity>
              </View>

              {/* Year Quick Selector View */}
              {isYearPickerOpen ? (
                <View style={styles.yearGridContainer}>
                  <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                    <View style={styles.yearGrid}>
                      {Array.from({ length: 75 }).map((_, i) => {
                        const y = 2026 - i;
                        const isSel = calendarYear === y;
                        return (
                          <TouchableOpacity
                            key={`yr-${y}`}
                            style={[styles.yearChip, isSel && styles.yearChipActive]}
                            onPress={() => {
                              setCalendarYear(y);
                              setCalendarDate(new Date(y, calendarMonth, Math.min(calendarDate.getDate(), new Date(y, calendarMonth + 1, 0).getDate())));
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
                  {/* Weekdays Row */}
                  <View style={styles.calWeekdaysRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                      <Text key={`${dayName}-${idx}`} style={styles.calWeekdayText}>
                        {dayName}
                      </Text>
                    ))}
                  </View>

                  {/* Days Grid */}
                  <View style={styles.calDaysGrid}>
                    {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, idx) => (
                      <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
                    ))}
                    {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, idx) => {
                      const day = idx + 1;
                      const isSelected =
                        calendarDate.getFullYear() === calendarYear &&
                        calendarDate.getMonth() === calendarMonth &&
                        calendarDate.getDate() === day;
                      const isToday =
                        new Date().getFullYear() === calendarYear &&
                        new Date().getMonth() === calendarMonth &&
                        new Date().getDate() === day;

                      return (
                        <TouchableOpacity
                          key={`day-${day}`}
                          style={styles.calDayCell}
                          onPress={() => setCalendarDate(new Date(calendarYear, calendarMonth, day))}
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
                <TouchableOpacity
                  style={styles.calCancelBtn}
                  onPress={() => setIsDatePickerOpen(false)}
                >
                  <Text style={styles.calCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calApplyBtn}
                  onPress={handleConfirmDate}
                >
                  <Text style={styles.calApplyBtnText}>Apply Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 1,
  },
  cancelButtonText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray500,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: P.twGreen800,
    letterSpacing: 0.5,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brandGreen,
    borderWidth: 2,
    borderColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 8,
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 2,
  },
  requiredAsterisk: {
    color: P.twRed500,
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
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnField: {
    flex: 1,
    gap: 6,
  },
  pickerInputBox: {
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
  pickerValueText: {
    fontSize: typography.body,
    color: P.nearBlack,
    fontWeight: '500',
  },
  dashedFileContainer: {
    height: 50,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray300,
    borderStyle: 'dashed',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  fileNameText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.brandGreen,
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
  },
  salarySegmentContainer: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  salarySegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  salarySegmentBtnActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  salarySegmentText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray500,
  },
  salarySegmentTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  saveButton: {
    height: 50,
    backgroundColor: colors.brandGreen,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen100,
  },
  modalOptionText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen800,
  },

  // ── Dynamic Calendar Styles ──
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calModalCard: {
    backgroundColor: P.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  calHeader: {
    marginBottom: 14,
  },
  calFieldBadge: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGreen700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calSelectedDateTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: P.twGray200,
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calMonthYearLabel: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: 220,
    marginVertical: 6,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
    minWidth: 62,
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
    justifyContent: 'space-between',
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calDayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.twGreen700,
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
    color: P.twGreen700,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: P.twGray200,
  },
  calCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    backgroundColor: P.deepGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calApplyBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
});
