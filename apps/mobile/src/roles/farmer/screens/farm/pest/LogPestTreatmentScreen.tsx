import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
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
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../api/farms';
import {
  createPestTreatmentLog,
  listPestLibrary,
  uploadPestPhoto,
  type CreatePestTreatmentLogInput,
  type PestCategory,
  type PestLibraryEntry,
  type PestSeverity,
  type PestTreatmentLog,
} from '../../../api/pest';
import { useActiveCropItems, type CropItem } from '../crops/cropItems';

// ─────────────────────────────────────────────
// Vector Icons (Strictly no emojis, theme tokens only)
// ─────────────────────────────────────────────

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

function FieldBoxIcon({ size = 15, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.4" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
      <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
    </Svg>
  );
}

function PestBugIcon({ size = 16, color = P.deepPurple600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7V3.5M7 12H3.5M20.5 12H17M7.5 7.5L5 5M19 5l-2.5 2.5M7.5 16.5L5 19M19 19l-2.5-2.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
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

function CameraPlusIcon({ size = 22, color = P.deepPurple600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="10" cy="13" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M19 10v4M17 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CrossMedicalIcon({ size = 16, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 15, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

function CheckmarkIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Static option lists (no reference-data endpoint for these -- same convention
// as the treatment picker's TREATMENTS list below).
// ─────────────────────────────────────────────

const TREATMENTS = [
  'Bordeaux mixture',
  'Neem oil spray (1500 ppm)',
  'Agniastra + Yellow Sticky Traps',
  'Wettable Sulphur / Trichoderma',
  'Dashparni kashayam',
  'Brahmastra decoction',
];

const SEVERITIES: PestSeverity[] = ['High', 'Medium', 'Low'];
/** Matches pest.schema.ts's `pestCategorySchema` exactly (`Weed` included). */
const CATEGORIES: PestCategory[] = ['Disease', 'Pest', 'Weed', 'Deficiency'];

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function addDaysDisplay(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export interface LogPestTreatmentScreenProps {
  crop?: CropItem | null | undefined;
  /**
   * Threaded down when the caller already knows it (nothing in App.tsx does
   * today -- InputManagementScreen has no farm/zone context of its own), else
   * resolved locally (first farm + first zone), the same fallback
   * PestManagementScreen and TreatmentScheduleScreen use.
   */
  farmId?: string | undefined;
  plotId?: string | undefined;
  onBack?: (() => void) | undefined;
  onSave?: ((data?: PestTreatmentLog) => void) | undefined;
}

export function LogPestTreatmentScreen({
  crop,
  farmId,
  plotId,
  onBack,
  onSave,
}: LogPestTreatmentScreenProps): React.JSX.Element {
  // Hardware back button for Android
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

  // Selected crop -- picked from the farmer's real active crops (cropItems.ts).
  // It is display/filter context only and is not sent as a `farmCropId` on the
  // create body below.
  const { items: cropOptions } = useActiveCropItems();
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(crop ?? null);
  useEffect(() => {
    if (!selectedCrop && cropOptions[0]) setSelectedCrop(cropOptions[0]);
  }, [cropOptions, selectedCrop]);

  // Farm/zone context this treatment log is actually saved against.
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
          if (!cancelled) setContextError('No farm found. Add a farm before logging pest treatments.');
          return;
        }
        let pid = plotId;
        if (!pid) {
          const plots = await getPlots(fid);
          pid = plots[0]?.id;
        }
        if (!pid) {
          if (!cancelled) setContextError('This farm has no zones yet. Add a zone before logging pest treatments.');
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

  // Pest / disease options, filtered to the selected crop -- listPestLibrary's
  // `crop` query already does a case-insensitive exact match against the
  // library's crops array, so no further client-side filtering is needed.
  const [pestOptions, setPestOptions] = useState<PestLibraryEntry[]>([]);
  const [pestOptionsLoading, setPestOptionsLoading] = useState(true);
  const [pestOptionsError, setPestOptionsError] = useState<string | null>(null);
  const [selectedPest, setSelectedPest] = useState<PestLibraryEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPestOptionsLoading(true);
      setPestOptionsError(null);
      try {
        const items = await listPestLibrary(selectedCrop?.name ? { crop: selectedCrop.name } : undefined);
        if (cancelled) return;
        setPestOptions(items);
        setSelectedPest((prev) => {
          if (prev && items.some((i) => i.id === prev.id)) return prev;
          const first = items[0];
          if (first) applyPestDefaults(first);
          return first ?? null;
        });
      } catch (err) {
        if (!cancelled) setPestOptionsError(formatErrorMessage(err, 'Could not load the pest library.'));
      } finally {
        if (!cancelled) setPestOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCrop?.name]);

  // Selected pest & details
  const [category, setCategory] = useState<PestCategory>('Disease');
  const [severity, setSeverity] = useState<PestSeverity>('Low');
  const [treatment, setTreatment] = useState<string>(TREATMENTS[0] ?? '');
  const [intervalDays, setIntervalDays] = useState<string>('');
  const [phiDays, setPhiDays] = useState<string>('');
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modals
  const [showCropModal, setShowCropModal] = useState(false);
  const [showPestModal, setShowPestModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);

  function applyPestDefaults(pest: PestLibraryEntry): void {
    const cat = CATEGORIES.includes(pest.category as PestCategory) ? (pest.category as PestCategory) : 'Pest';
    const sev = SEVERITIES.includes(pest.riskLevel as PestSeverity) ? (pest.riskLevel as PestSeverity) : 'Medium';
    setCategory(cat);
    setSeverity(sev);
    setTreatment(pest.recommendedTreatment ?? TREATMENTS[0] ?? '');
    setIntervalDays(pest.intervalDays != null ? String(pest.intervalDays) : '');
    setPhiDays(pest.phiDays != null ? String(pest.phiDays) : '');
  }

  const handleSelectPest = (pest: PestLibraryEntry) => {
    setSelectedPest(pest);
    applyPestDefaults(pest);
    setShowPestModal(false);
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      setPhoto({
        uri: picked.fileCopyUri ?? picked.uri,
        name: picked.name ?? 'pest_photo.jpg',
        type: picked.type ?? 'image/jpeg',
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Could Not Attach Photo', formatErrorMessage(err, 'Please try again.'));
      }
    }
  };

  const handleSave = async () => {
    if (!selectedPest) {
      Alert.alert('Required Field', 'Please select a pest / disease.');
      return;
    }
    if (!resolvedFarmId || !resolvedPlotId) {
      Alert.alert('Not Ready', 'Still loading your farm — please try again in a moment.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      let photoUploadId: string | undefined;
      if (photo) {
        try {
          const uploaded = await uploadPestPhoto(photo.uri, photo.name, photo.type);
          photoUploadId = uploaded.uploadId;
        } catch {
          // Non-fatal: the treatment log itself is still worth saving.
        }
      }

      const intervalNum = intervalDays.trim() ? Number(intervalDays) : undefined;
      const phiNum = phiDays.trim() ? Number(phiDays) : undefined;

      const body: CreatePestTreatmentLogInput = {
        pestLibraryId: selectedPest.id,
        pestName: selectedPest.name,
        category,
        severity,
        treatment,
        appliedOn: todayIso(),
        ...(intervalNum !== undefined && !Number.isNaN(intervalNum) ? { intervalDays: intervalNum } : {}),
        ...(phiNum !== undefined && !Number.isNaN(phiNum) ? { phiDays: phiNum } : {}),
        ...(intervalNum ? { nextApplicationDate: toIsoDate(new Date(Date.now() + intervalNum * 86_400_000)) } : {}),
        ...(photoUploadId ? { photoUploadId } : {}),
      };

      const created = await createPestTreatmentLog(resolvedFarmId, resolvedPlotId, body);

      Alert.alert(
        'Treatment Logged',
        `${treatment} treatment for ${selectedPest.name} saved successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSave) {
                onSave(created);
              } else if (onBack) {
                onBack();
              }
            },
          },
        ],
      );
    } catch (err) {
      setSaveError(formatErrorMessage(err, 'Could not save this treatment.'));
    } finally {
      setSaving(false);
    }
  };

  const nextDateDisplay = intervalDays.trim() && !Number.isNaN(Number(intervalDays))
    ? addDaysDisplay(Number(intervalDays))
    : addDaysDisplay(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Log Pest Treatment</Text>
          <Text style={styles.headerSubtitle}>Record a pest / disease issue</Text>
        </View>

        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
      >
        {/* Field 1: Crop / Area selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FieldBoxIcon size={15} color={P.forestGreen} />
            <Text style={styles.label}>
              Crop / Area <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowCropModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Crop / Area"
          >
            <Text style={styles.selectBoxText}>
              {selectedCrop
                ? `${selectedCrop.zone} (${selectedCrop.name})`
                : 'Zone 2 — Lower Slope (Tomato)'}
            </Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>
        </View>

        {/* Field 2: Pest / disease selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <PestBugIcon size={16} color={P.deepPurple600} />
            <Text style={styles.label}>
              Pest / disease <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxPurple}
            onPress={() => setShowPestModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Pest or disease"
            disabled={pestOptionsLoading}
          >
            <Text style={styles.selectBoxText}>
              {pestOptionsLoading ? 'Loading…' : selectedPest?.name ?? 'No matches'}
            </Text>
            <ChevronDownIcon size={18} color={P.deepPurple600} />
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Filtered to pests known to affect {selectedCrop?.name ?? 'this crop'} only.
          </Text>
          {pestOptionsError ? <Text style={styles.errorText}>{pestOptionsError}</Text> : null}
        </View>

        {/* Pest Info Badge */}
        {selectedPest ? (
          <View style={styles.pestInfoCard}>
            <View style={styles.pestInfoHeaderRow}>
              <View style={styles.pestTitleRow}>
                <View style={styles.redDot} />
                <Text style={styles.scientificNameText}>{selectedPest.scientificName ?? selectedPest.name}</Text>
              </View>

              {selectedPest.season ? (
                <View style={styles.seasonBadge}>
                  <CalendarIcon size={12} color={P.twGray500} />
                  <Text style={styles.seasonBadgeText}>{selectedPest.season}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.pestSubNote}>
              {selectedPest.category} · typically {selectedPest.riskLevel} severity
            </Text>
          </View>
        ) : null}

        {/* Row: Type & Severity */}
        <View style={styles.rowTwoCols}>
          {/* Type */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Type</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowTypeModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select Type"
            >
              <Text style={styles.inputBoxText}>{category}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* Severity */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Severity</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowSeverityModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select Severity"
            >
              <View style={styles.severityRow}>
                <View
                  style={[
                    styles.severityDot,
                    {
                      backgroundColor:
                        severity === 'High'
                          ? P.twRed500
                          : severity === 'Medium'
                          ? P.twAmber600
                          : P.twGreen500,
                    },
                  ]}
                />
                <Text style={styles.inputBoxText}>{severity}</Text>
              </View>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Identification photo */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CameraIcon size={16} color={P.twGray600} />
            <Text style={styles.subLabelNoMargin}>Identification photo</Text>
          </View>

          <View style={styles.photoRow}>
            {photo && (
              <View style={styles.photoThumbContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setPhoto(null)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <CloseIcon size={12} color={P.white} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={() => void handlePickPhoto()}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Attach identification photo"
            >
              <CameraPlusIcon size={24} color={P.deepPurple600} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended treatment selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CrossMedicalIcon size={16} color={P.forestGreen} />
            <Text style={styles.label}>
              Recommended treatment <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowTreatmentModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Recommended treatment"
          >
            <Text style={styles.selectBoxText}>{treatment}</Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Suggested from the library · any approved input can be chosen instead.
          </Text>
        </View>

        {/* Row: Interval (days) & PHI (days) */}
        <View style={styles.rowTwoCols}>
          {/* Interval */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Interval (days)</Text>
            <TextInput
              style={styles.numInput}
              value={intervalDays}
              onChangeText={setIntervalDays}
              keyboardType="numeric"
              accessibilityLabel="Interval in days"
            />
          </View>

          {/* PHI (days) */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>PHI (days)</Text>
            <View style={styles.autoFieldBox}>
              <TextInput
                style={styles.phiInputText}
                value={phiDays}
                onChangeText={setPhiDays}
                keyboardType="numeric"
                accessibilityLabel="PHI in days"
              />
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next application date */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CalendarIcon size={16} color={P.twGray600} />
            <Text style={styles.subLabelNoMargin}>Next application date</Text>
          </View>

          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{nextDateDisplay}</Text>
            <View style={styles.dateDaysBadge}>
              <Text style={styles.dateDaysBadgeText}>
                TODAY +{intervalDays.trim() || 0}
              </Text>
            </View>
          </View>
        </View>

        {contextError ? <Text style={styles.errorText}>{contextError}</Text> : null}
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        {/* Bottom Button: Save treatment */}
        <TouchableOpacity
          style={[styles.saveBtn, (saving || contextLoading || !!contextError) && { opacity: 0.7 }]}
          onPress={() => void handleSave()}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Save treatment"
          disabled={saving || contextLoading || !!contextError}
        >
          {saving ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <>
              <CheckmarkIcon size={18} color={P.white} />
              <Text style={styles.saveBtnText}>Save treatment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Select Crop / Area */}
      <Modal
        visible={showCropModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCropModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCropModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Crop / Area</Text>
              <TouchableOpacity onPress={() => setShowCropModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {cropOptions.map((item) => {
              const isSelected = selectedCrop?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedCrop(item);
                    setShowCropModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.zone} ({item.name})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Pest / Disease */}
      <Modal
        visible={showPestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPestModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPestModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pest / Disease</Text>
              <TouchableOpacity onPress={() => setShowPestModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {pestOptions.length === 0 ? (
              <Text style={styles.modalSubItemText}>No pests found for this crop.</Text>
            ) : (
              pestOptions.map((p) => {
                const isSelected = selectedPest?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => handleSelectPest(p)}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}
                    >
                      {p.name}
                    </Text>
                    <Text style={styles.modalSubItemText}>
                      {p.scientificName ?? p.category} · {p.season ?? p.riskLevel}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Type */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Issue Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {CATEGORIES.map((t) => {
              const isSelected = category === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setCategory(t);
                    setShowTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Severity */}
      <Modal
        visible={showSeverityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSeverityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSeverityModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Severity Level</Text>
              <TouchableOpacity onPress={() => setShowSeverityModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {SEVERITIES.map((s) => {
              const isSelected = severity === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setSeverity(s);
                    setShowSeverityModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {s} Severity
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Treatment */}
      <Modal
        visible={showTreatmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTreatmentModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTreatmentModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Recommended Treatment</Text>
              <TouchableOpacity onPress={() => setShowTreatmentModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {TREATMENTS.map((item) => {
              const isSelected = treatment === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setTreatment(item);
                    setShowTreatmentModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 10,
    backgroundColor: P.white,
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
  headerTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 1,
  },
  cancelButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray600,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  formGroup: {
    marginTop: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: 6,
  },
  subLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
    marginBottom: 6,
  },
  subLabelNoMargin: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
    marginLeft: 6,
  },
  requiredAsterisk: {
    color: P.red700,
    fontWeight: '700',
  },
  selectBoxGreen: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.forestGreen,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxPurple: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.deepPurple600,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray900,
  },
  helpText: {
    fontSize: typography.bodySmall,
    lineHeight: 16,
    color: P.twGray400,
    marginTop: 6,
  },
  errorText: {
    fontSize: typography.bodySmall,
    lineHeight: 16,
    color: P.twRed600,
    fontWeight: '600',
    marginTop: 6,
  },
  pestInfoCard: {
    backgroundColor: P.violetTint1,
    borderWidth: 1,
    borderColor: P.twPurple200,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  pestInfoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twRed500,
    marginRight: 8,
  },
  scientificNameText: {
    fontSize: typography.body,
    fontWeight: '700',
    fontStyle: 'italic',
    color: P.twGray900,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  seasonBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray600,
  },
  pestSubNote: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 4,
    marginLeft: 16,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  col: {
    flex: 1,
  },
  inputBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBoxText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  photoThumbContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: P.twGray100,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.deepPurple600,
    backgroundColor: P.twPurple100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  autoFieldBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.twGray50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phiInputText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    flex: 1,
  },
  autoBadge: {
    backgroundColor: P.twGray200,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  autoBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
  },
  dateBox: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  dateDaysBadge: {
    backgroundColor: P.twGray100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateDaysBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: P.deepPurple600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray50,
  },
  modalItemSelected: {
    backgroundColor: P.twPurple100,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  modalItemTextSelected: {
    color: P.deepPurple600,
    fontWeight: '700',
  },
  modalSubItemText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
});
