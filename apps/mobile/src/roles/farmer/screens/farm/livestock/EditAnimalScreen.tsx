import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { extractFieldErrors, formatErrorMessage } from '../../../../../shell/api/client';
import {
  getAnimal,
  updateAnimal,
  type AnimalGender,
  type AnimalResponse,
  type AnimalSource,
  type AnimalSpecies,
  type OrganicStatus,
  type UpdateAnimalBody,
} from '../../../api/livestock';
import { type AnimalFormData } from './RegisterAnimalScreen';

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

function PawPrintIcon({ size = 28, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14.5" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
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

// ── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

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

/** `YYYY-MM-DD` for the API from this screen's `"2 Jun 2026"` display strings. */
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` parsed as a LOCAL calendar date, never `new Date(iso)` (which
 *  reads it as UTC midnight and can roll back a day west of Greenwich). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function isoToDisplay(iso: string): string {
  return formatDisplayDate(parseIsoDate(iso));
}

function computeAgeLabel(dateStr: string): string {
  const birth = parseDisplayDate(dateStr);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    return 'Upcoming / Newborn';
  }
  if (months === 0) {
    const msDiff = now.getTime() - birth.getTime();
    const days = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    if (days <= 0) return 'Born today';
    if (days === 1) return '≈ 1 day old';
    if (days < 7) return `≈ ${days} days old`;
    const weeks = Math.floor(days / 7);
    return `≈ ${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
  }
  if (months < 12) {
    return `≈ ${months} ${months === 1 ? 'month' : 'months'} old`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) {
    return `≈ ${years} ${years === 1 ? 'year' : 'years'} old`;
  }
  return `≈ ${years} yr ${remMonths} mo old`;
}

// ── Enum mapping (form <-> API) ──────────────────────────────────────────────
// Explicit switches (not `.toUpperCase() as X`) so a future enum addition on
// either side fails to compile instead of silently mismatching.

function speciesToApi(v: string): AnimalSpecies {
  switch (v) {
    case 'Buffalo':
      return 'BUFFALO';
    case 'Goat':
      return 'GOAT';
    case 'Poultry':
      return 'POULTRY';
    case 'Sheep':
      return 'SHEEP';
    case 'Cattle':
    default:
      return 'CATTLE';
  }
}

function speciesFromApi(v: AnimalSpecies): string {
  switch (v) {
    case 'CATTLE':
      return 'Cattle';
    case 'BUFFALO':
      return 'Buffalo';
    case 'GOAT':
      return 'Goat';
    case 'POULTRY':
      return 'Poultry';
    case 'SHEEP':
      return 'Sheep';
  }
}

function genderToApi(v: 'Female' | 'Male'): AnimalGender {
  return v === 'Male' ? 'MALE' : 'FEMALE';
}

function genderFromApi(v: AnimalGender): 'Female' | 'Male' {
  return v === 'MALE' ? 'Male' : 'Female';
}

function sourceToApi(v: 'born_on_farm' | 'purchased'): AnimalSource {
  return v === 'purchased' ? 'PURCHASED' : 'BORN_ON_FARM';
}

function sourceFromApi(v: AnimalSource): 'born_on_farm' | 'purchased' {
  return v === 'PURCHASED' ? 'purchased' : 'born_on_farm';
}

function organicStatusToApi(v: 'Organic' | 'Transitioning' | 'Conventional'): OrganicStatus {
  switch (v) {
    case 'Organic':
      return 'ORGANIC';
    case 'Conventional':
      return 'CONVENTIONAL';
    case 'Transitioning':
    default:
      return 'TRANSITIONING';
  }
}

function organicStatusFromApi(v: OrganicStatus): 'Organic' | 'Transitioning' | 'Conventional' {
  switch (v) {
    case 'ORGANIC':
      return 'Organic';
    case 'TRANSITIONING':
      return 'Transitioning';
    case 'CONVENTIONAL':
      return 'Conventional';
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface EditAnimalScreenProps {
  initialAnimal?: Partial<AnimalFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: AnimalFormData) => void;
}

export function EditAnimalScreen({
  initialAnimal,
  onBack,
  onCancel,
  onSave,
}: EditAnimalScreenProps): React.JSX.Element {
  const animalId = initialAnimal?.id;

  const [tag, setTag] = useState(initialAnimal?.tag || '');
  const [species, setSpecies] = useState(initialAnimal?.species || 'Cattle');
  const [gender, setGender] = useState<'Female' | 'Male'>(initialAnimal?.gender || 'Female');
  const [breed, setBreed] = useState(initialAnimal?.breed || '');
  const [dob, setDob] = useState(initialAnimal?.dob || '');
  const [source, setSource] = useState<'born_on_farm' | 'purchased'>(
    initialAnimal?.source || 'purchased',
  );
  const [purchaseDate, setPurchaseDate] = useState(initialAnimal?.purchaseDate || '');
  const [sourceFarm, setSourceFarm] = useState(initialAnimal?.sourceFarm || '');
  const [organicStatus, setOrganicStatus] = useState<'Organic' | 'Transitioning' | 'Conventional'>(
    initialAnimal?.organicStatus || 'Organic',
  );
  const [animalName, setAnimalName] = useState(initialAnimal?.name);

  // Modals
  const [isSpeciesPickerOpen, setIsSpeciesPickerOpen] = useState(false);
  const [isGenderPickerOpen, setIsGenderPickerOpen] = useState(false);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  // Load / error state for the initial GET
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const applyAnimal = useCallback((animal: AnimalResponse) => {
    setTag(animal.tag);
    setAnimalName(animal.name ?? undefined);
    setSpecies(speciesFromApi(animal.species));
    setGender(genderFromApi(animal.gender));
    setBreed(animal.breed ?? '');
    setDob(animal.dateOfBirth ? isoToDisplay(animal.dateOfBirth) : '');
    setSource(sourceFromApi(animal.source));
    setPurchaseDate(animal.purchasedOn ? isoToDisplay(animal.purchasedOn) : '');
    setSourceFarm(animal.sourceFarm ?? '');
    setOrganicStatus(organicStatusFromApi(animal.organicStatus));
  }, []);

  const load = useCallback(async () => {
    if (!animalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const animal = await getAnimal(animalId);
      applyAnimal(animal);
    } catch (err: unknown) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [animalId, applyAnimal]);

  useEffect(() => {
    void load();
  }, [load]);

  const speciesOptions = ['Cattle', 'Buffalo', 'Goat', 'Poultry', 'Sheep'];
  const genderOptions: ('Female' | 'Male')[] = ['Female', 'Male'];
  const statusOptions: ('Organic' | 'Transitioning' | 'Conventional')[] = [
    'Organic',
    'Transitioning',
    'Conventional',
  ];

  const handleSave = async () => {
    if (isSubmitting) return;
    setSubmitError('');
    setFieldErrors({});

    if (!animalId) {
      setSubmitError(t('farmer.livestock.editAnimal.missingIdError'));
      return;
    }

    const trimmedTag = tag.trim();
    if (!trimmedTag) {
      setFieldErrors({ tag: t('farmer.livestock.editAnimal.tagRequiredError') });
      return;
    }

    const body: UpdateAnimalBody = {
      tag: trimmedTag,
      species: speciesToApi(species),
      gender: genderToApi(gender),
      breed: breed.trim() ? breed.trim() : null,
      dateOfBirth: dob.trim() ? toIsoDate(parseDisplayDate(dob)) : null,
      source: sourceToApi(source),
      purchasedOn: source === 'purchased' && purchaseDate.trim() ? toIsoDate(parseDisplayDate(purchaseDate)) : null,
      sourceFarm: source === 'purchased' && sourceFarm.trim() ? sourceFarm.trim() : null,
      organicStatus: organicStatusToApi(organicStatus),
    };

    setIsSubmitting(true);
    try {
      const updated = await updateAnimal(animalId, body);
      const payload: AnimalFormData = {
        id: updated.id,
        tag: updated.tag,
        name: updated.name ?? undefined,
        species,
        gender,
        breed: updated.breed ?? '',
        dob,
        source,
        purchaseDate: source === 'purchased' ? purchaseDate : undefined,
        sourceFarm: source === 'purchased' ? sourceFarm.trim() : undefined,
        organicStatus,
      };

      if (onSave) {
        onSave(payload);
      } else {
        Alert.alert(
          'Animal Updated',
          `Animal ${trimmedTag} (${breed.trim() || species}) details have been saved.`,
          [{ text: 'OK', onPress: onBack || onCancel }],
        );
      }
    } catch (err: unknown) {
      setSubmitError(formatErrorMessage(err, t('farmer.livestock.editAnimal.saveError')));
      setFieldErrors(extractFieldErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert('Animal Photo', 'Choose an option to upload animal picture:', [
      { text: 'Take Photo', onPress: () => {} },
      { text: 'Choose from Gallery', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width="100%" height={78} borderRadius={39} style={{ alignSelf: 'center', width: 78 }} />
          <Skeleton width="100%" height={48} borderRadius={12} />
          <Skeleton width="100%" height={48} borderRadius={12} />
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !animalId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <ErrorState
            error={loadError}
            message={!animalId ? t('farmer.livestock.editAnimal.missingIdError') : undefined}
            onRetry={animalId ? () => void load() : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.headerTitle}>Edit Animal</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {(animalName || tag)} · {tag}
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
              accessibilityLabel="Change animal photo"
            >
              <View style={styles.avatarCircle}>
                <PawPrintIcon size={30} color={P.twAmber800} />
              </View>

              <View style={styles.cameraBadge}>
                <CameraIcon size={13} color={P.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarHint}>Change photo (optional)</Text>
          </View>

          {/* ── Form Fields ── */}
          <View style={styles.formContainer}>
            {/* Animal ID / tag */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Animal ID / tag <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={tag}
                onChangeText={setTag}
                placeholder="e.g. C-014"
                placeholderTextColor={P.twGray400}
                autoCapitalize="characters"
              />
              {fieldErrors['tag'] ? (
                <Text style={styles.fieldErrorText}>{fieldErrors['tag']}</Text>
              ) : null}
            </View>

            {/* Species & Gender (2 columns) */}
            <View style={styles.twoColumnRow}>
              {/* Species */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>
                  Species <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerInputBox}
                  activeOpacity={0.8}
                  onPress={() => setIsSpeciesPickerOpen(true)}
                >
                  <Text style={styles.pickerValueText}>{species}</Text>
                  <ChevronDownIcon size={16} color={P.twGray500} />
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

            {/* Breed */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Breed</Text>
              <TextInput
                style={styles.textInput}
                value={breed}
                onChangeText={setBreed}
                placeholder="e.g. Jersey cross"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of birth</Text>
              <TouchableOpacity
                style={styles.pickerInputBox}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.prompt
                    ? Alert.prompt('Date of Birth', 'Enter birth date (DD Mon YYYY):', (val) => {
                        if (val) setDob(val);
                      })
                    : null;
                }}
              >
                <Text style={styles.pickerValueText}>{dob || '—'}</Text>
                <CalendarIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
              {dob ? <Text style={styles.ageHelperText}>{computeAgeLabel(dob)}</Text> : null}
            </View>

            {/* ── Source Section ── */}
            <Text style={styles.sectionHeaderTitle}>SOURCE</Text>

            {/* Born on farm / Purchased Segmented Toggle */}
            <View style={styles.sourceSegmentContainer}>
              <TouchableOpacity
                style={[
                  styles.sourceSegmentBtn,
                  source === 'born_on_farm' && styles.sourceSegmentBtnActive,
                ]}
                onPress={() => setSource('born_on_farm')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sourceSegmentText,
                    source === 'born_on_farm' && styles.sourceSegmentTextActive,
                  ]}
                >
                  Born on farm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sourceSegmentBtn,
                  source === 'purchased' && styles.sourceSegmentBtnActive,
                ]}
                onPress={() => setSource('purchased')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sourceSegmentText,
                    source === 'purchased' && styles.sourceSegmentTextActive,
                  ]}
                >
                  Purchased
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conditional Purchase Details when Purchased */}
            {source === 'purchased' && (
              <View style={styles.twoColumnRow}>
                {/* Purchase date */}
                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>Purchase date</Text>
                  <TouchableOpacity
                    style={styles.pickerInputBox}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.prompt
                        ? Alert.prompt('Purchase Date', 'Enter purchase date (DD Mon YYYY):', (val) => {
                            if (val) setPurchaseDate(val);
                          })
                        : null;
                    }}
                  >
                    <Text style={styles.pickerValueText}>{purchaseDate || '—'}</Text>
                    <CalendarIcon size={18} color={P.twGray400} />
                  </TouchableOpacity>
                </View>

                {/* Source farm */}
                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>Source farm</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sourceFarm}
                    onChangeText={setSourceFarm}
                    placeholder="e.g. Coonoor Dairy"
                    placeholderTextColor={P.twGray400}
                  />
                </View>
              </View>
            )}

            {/* Organic Status */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Organic status <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerInputBox}
                activeOpacity={0.8}
                onPress={() => setIsStatusPickerOpen(true)}
              >
                <Text style={styles.pickerValueText}>{organicStatus}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
              <Text style={styles.statusExplainerText}>
                Organic status is verified in the Farm Context and certification audits.
              </Text>
            </View>

            {submitError ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* ── Bottom Floating Save Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            activeOpacity={0.85}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={P.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Species Picker Modal */}
        <Modal
          visible={isSpeciesPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSpeciesPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsSpeciesPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Species</Text>
              {speciesOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    species === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSpecies(opt);
                    setIsSpeciesPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      species === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Gender Picker Modal */}
        <Modal
          visible={isGenderPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsGenderPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsGenderPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              {genderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    gender === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setGender(opt);
                    setIsGenderPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      gender === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Status Picker Modal */}
        <Modal
          visible={isStatusPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsStatusPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsStatusPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Organic Status</Text>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    organicStatus === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setOrganicStatus(opt);
                    setIsStatusPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      organicStatus === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
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
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
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
  ageHelperText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.brandGreen,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
  },
  sourceSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  sourceSegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  sourceSegmentBtnActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceSegmentText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray500,
  },
  sourceSegmentTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  statusExplainerText: {
    fontSize: typography.bodySmall,
    lineHeight: 17,
    color: P.twGray500,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    lineHeight: 18,
  },
  fieldErrorText: {
    fontSize: typography.caption,
    color: P.twRed600,
    marginTop: 4,
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
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
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionSelected: {
    borderBottomColor: colors.brandGreen,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
