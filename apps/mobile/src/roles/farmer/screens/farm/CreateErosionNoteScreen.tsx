import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
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
import { DatePicker, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../theme';
import { formatErrorMessage } from '../../../../shell/api/client';
import { getPlots, type Plot } from '../../api/farms';
import { createErosionNote, type CreateErosionNoteInput, type ErosionRiskLevel } from '../../api/soil';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
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

function CalendarIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 24, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MountainSlopeIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 20L12 4l5 9 4-3 0 10H3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Options & Presets
// ─────────────────────────────────────────────

interface RiskOption {
  level: ErosionRiskLevel;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

const RISK_OPTIONS: RiskOption[] = [
  {
    level: 'Low Risk',
    description: 'Flat slope (0–2%), dense vegetation cover, no noticeable topsoil runoff.',
    badgeBg: P.twGreen50,
    badgeText: P.twGreen700,
    borderColor: P.twGreen600,
  },
  {
    level: 'Moderate Risk',
    description: 'Mild slope (2–8%), slight rill formation, requires mulching & contour bunds.',
    badgeBg: P.twAmber50,
    badgeText: P.twAmber800,
    borderColor: P.twAmber600,
  },
  {
    level: 'High Risk',
    description: 'Steep slope (>8%), visible gullying, urgent terracing or grass barriers needed.',
    badgeBg: P.twRed50,
    badgeText: P.twRed700,
    borderColor: P.twRed600,
  },
];

const CONSERVATION_PRESETS = [
  'Contour Bunding',
  'Mulching & Ground Cover',
  'Terracing along Slope',
  'Vetiver Grass Barrier',
  'Cover Cropping',
  'Silt Traps / Small Check Dam',
  'Tree Windbreaks',
  'Zero / Minimum Tillage',
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDisplayDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function parseSoilDate(value: string): Date {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2}|\d{4})$/);
  if (match && match[1] && match[2] && match[3]) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const rawYear = Number(match[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toIsoTimestamp(value: string): string {
  const parsed = parseSoilDate(value);
  return parsed.toISOString();
}

export interface CreateErosionNoteScreenProps {
  farmId: string;
  plotId?: string | undefined;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

interface SavedSuccessData {
  plotName: string;
  riskLevel: ErosionRiskLevel;
  dateStr: string;
  practiceNotes?: string | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CreateErosionNoteScreen({
  farmId,
  plotId: initialPlotId,
  onBack,
  onSave,
}: CreateErosionNoteScreenProps): React.JSX.Element {
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

  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>(initialPlotId ?? '');
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [plotsError, setPlotsError] = useState<string | null>(null);

  const [riskLevel, setRiskLevel] = useState<ErosionRiskLevel>('Low Risk');
  const [logDate, setLogDate] = useState(formatDisplayDate(new Date()));
  const [practiceNotes, setPracticeNotes] = useState('');

  const [zonePickerVisible, setZonePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successModalData, setSuccessModalData] = useState<SavedSuccessData | null>(null);

  const loadPlots = useCallback(async () => {
    if (!farmId) {
      setPlotsLoading(false);
      setPlotsError('No farm selected. Go back and choose a farm first.');
      return;
    }
    setPlotsLoading(true);
    setPlotsError(null);
    try {
      const list = await getPlots(farmId);
      setPlots(list);
      if (!selectedPlotId && list.length > 0) {
        const first = list[0];
        if (first) setSelectedPlotId(first.id);
      }
    } catch (err) {
      setPlotsError(formatErrorMessage(err, 'Could not load farm zones.'));
    } finally {
      setPlotsLoading(false);
    }
  }, [farmId, selectedPlotId]);

  useEffect(() => {
    void loadPlots();
  }, [loadPlots]);

  const selectedPlotName = plots.find((p) => p.id === selectedPlotId)?.name ?? 'Select Zone';

  const handleTogglePreset = (preset: string) => {
    if (!practiceNotes.includes(preset)) {
      setPracticeNotes((prev) => (prev.trim() ? `${prev.trim()}\n• ${preset}` : `• ${preset}`));
    }
  };

  const handleSelectDate = (date: Date) => {
    setLogDate(formatDisplayDate(date));
    setDatePickerVisible(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!selectedPlotId) {
      setSaveError('Please select a zone to record this erosion note.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateErosionNoteInput = {
        riskLevel,
        loggedAt: toIsoTimestamp(logDate),
        ...(practiceNotes.trim() ? { practiceNotes: practiceNotes.trim() } : {}),
      };

      await createErosionNote(farmId, selectedPlotId, payload);

      setSuccessModalData({
        plotName: selectedPlotName,
        riskLevel,
        dateStr: logDate,
        practiceNotes: practiceNotes.trim() || undefined,
      });
    } catch (err) {
      setSaveError(formatErrorMessage(err, 'Could not log this erosion note.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalData(null);
    if (onSave) {
      onSave();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>FR-F06</Text>
            <Text style={styles.headerTitle}>Log Erosion Note</Text>
            <Text style={styles.headerSubtitle}>Record erosion observations & conservation</Text>
          </View>
        </View>
      </View>

      {plotsLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={48} width="100%" style={{ marginBottom: 16 }} />
          <Skeleton height={200} width="100%" />
        </View>
      ) : plotsError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{plotsError}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error Banner */}
          {saveError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{saveError}</Text>
            </View>
          ) : null}

          {/* ── Target Zone ── */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Target Zone / Plot </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={() => setZonePickerVisible(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Select zone"
            >
              <Text style={styles.pickerValueText}>{selectedPlotName}</Text>
              <ChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* ── Observation Date ── */}
          <View style={styles.fieldContainer}>
            <TouchableOpacity
              style={styles.labelRow}
              activeOpacity={0.7}
              onPress={() => setDatePickerVisible(true)}
            >
              <CalendarIcon size={14} color={P.twGray600} />
              <Text style={styles.inputLabel}> Observation Date </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </TouchableOpacity>
            <View style={styles.dateBox}>
              <TextInput
                style={styles.dateTextInput}
                value={logDate}
                onChangeText={setLogDate}
                placeholder="DD/MM/YY"
                placeholderTextColor={P.twGray400}
              />
              <TouchableOpacity
                onPress={() => setDatePickerVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Pick date"
              >
                <CalendarIcon size={16} color={P.twGray400} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Erosion Risk Level ── */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <MountainSlopeIcon size={16} color={P.twAmber800} />
              <Text style={styles.inputLabel}> Erosion Risk Assessment </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>

            <View style={styles.riskCardsList}>
              {RISK_OPTIONS.map((opt) => {
                const isSelected = riskLevel === opt.level;
                return (
                  <TouchableOpacity
                    key={opt.level}
                    style={[
                      styles.riskCard,
                      isSelected && {
                        borderColor: opt.borderColor,
                        backgroundColor: opt.badgeBg,
                      },
                    ]}
                    onPress={() => setRiskLevel(opt.level)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.riskCardHeader}>
                      <View
                        style={[
                          styles.riskBadge,
                          {
                            backgroundColor: isSelected ? P.white : opt.badgeBg,
                            borderColor: opt.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.riskBadgeText, { color: opt.badgeText }]}>
                          {opt.level}
                        </Text>
                      </View>
                      {isSelected ? (
                        <CheckCircleIcon size={20} color={opt.badgeText} />
                      ) : (
                        <View style={styles.radioUnchecked} />
                      )}
                    </View>
                    <Text style={styles.riskDescText}>{opt.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Conservation Practice Presets ── */}
          <View style={styles.fieldContainer}>
            <Text style={styles.inputLabel}>Conservation Practices Applied</Text>
            <Text style={styles.chipHeader}>Tap to include in practice notes:</Text>

            <View style={styles.presetChipsWrap}>
              {CONSERVATION_PRESETS.map((preset) => {
                const isIncluded = practiceNotes.includes(preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, isIncluded && styles.presetChipActive]}
                    onPress={() => handleTogglePreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.presetChipText, isIncluded && styles.presetChipTextActive]}
                    >
                      {isIncluded ? '✓ ' : '+ '}
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Detailed Observation Notes ── */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Practice Details & Observations</Text>
              <Text style={styles.optionalText}> (optional)</Text>
            </View>
            <TextInput
              style={styles.textArea}
              value={practiceNotes}
              onChangeText={setPracticeNotes}
              placeholder="e.g. Established vetiver grass along the lower terrace slope. Added 4-inch leaf mulch to prevent topsoil wash during pre-monsoon rains..."
              placeholderTextColor={P.twGray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      )}

      {/* ── Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { opacity: saving || plotsLoading || !!plotsError ? 0.7 : 1 }]}
            onPress={() => void handleSave()}
            disabled={saving || plotsLoading || !!plotsError}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save Erosion Note"
          >
            {saving ? (
              <ActivityIndicator size="small" color={P.white} />
            ) : (
              <Text style={styles.saveBtnText}>✓ Save Erosion Note</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Zone Selection Modal ── */}
      <Modal
        visible={zonePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZonePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setZonePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Target Zone</Text>
            {plots.map((plot) => {
              const isSelected = selectedPlotId === plot.id;
              return (
                <TouchableOpacity
                  key={plot.id}
                  style={[styles.modalOption, isSelected ? styles.modalOptionSelected : undefined]}
                  onPress={() => {
                    setSelectedPlotId(plot.id);
                    setZonePickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected ? styles.modalOptionTextSelected : undefined,
                    ]}
                  >
                    {plot.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Date Picker Modal ── */}
      <DatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleSelectDate}
        value={parseSoilDate(logDate)}
        title="Select Observation Date"
        format="DD/MM/YY"
      />

      {/* ── Success Modal ── */}
      <Modal
        visible={!!successModalData}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircleIcon size={30} color={P.twGreen700} />
            </View>

            <Text style={styles.successModalTitle}>Erosion Note Logged</Text>
            <Text style={styles.successModalSubtitle}>
              Erosion risk observation and conservation practices have been recorded.
            </Text>

            <View style={styles.successDataBox}>
              <View style={styles.successDataRow}>
                <View style={styles.successDataCol}>
                  <Text style={styles.successColLabel}>TARGET ZONE</Text>
                  <Text style={styles.successColVal}>{successModalData?.plotName}</Text>
                </View>
                <View style={styles.successDataCol}>
                  <Text style={styles.successColLabel}>DATE LOGGED</Text>
                  <Text style={styles.successColVal}>{successModalData?.dateStr}</Text>
                </View>
              </View>

              <View style={styles.successDivider} />

              <View style={styles.successContextRow}>
                <Text style={styles.successContextLabel}>Risk Assessment:</Text>
                <Text
                  style={[
                    styles.successContextVal,
                    {
                      color:
                        successModalData?.riskLevel === 'Low Risk'
                          ? P.twGreen700
                          : successModalData?.riskLevel === 'Moderate Risk'
                          ? P.twAmber800
                          : P.twRed600,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {successModalData?.riskLevel}
                </Text>
              </View>

              {successModalData?.practiceNotes ? (
                <View style={[styles.successContextRow, { alignItems: 'flex-start', marginTop: 6 }]}>
                  <Text style={styles.successContextLabel}>Notes / Practices:</Text>
                  <Text style={[styles.successContextVal, { fontSize: 10 }]} numberOfLines={3}>
                    {successModalData.practiceNotes}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.successModalOkBtn}
              onPress={handleSuccessClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text style={styles.successModalOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTag: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loadErrorText: {
    color: P.twRed600,
    fontSize: typography.body,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate700,
  },
  requiredAsterisk: {
    color: P.twRed500,
    fontWeight: '700',
    fontSize: typography.body,
  },
  optionalText: {
    color: P.slate400,
    fontSize: typography.bodySmall,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: P.white,
  },
  pickerValueText: {
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '600',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: P.white,
  },
  dateTextInput: {
    flex: 1,
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '500',
    paddingVertical: 0,
  },
  riskCardsList: {
    gap: 8,
    marginTop: 4,
  },
  riskCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    padding: 12,
    backgroundColor: P.white,
  },
  riskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  radioUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: P.slate300,
  },
  riskDescText: {
    fontSize: typography.bodySmall,
    color: P.slate600,
    lineHeight: 18,
  },
  chipHeader: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate500,
    marginBottom: 6,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  presetChipActive: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen600,
  },
  presetChipText: {
    fontSize: 11,
    color: P.slate600,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: P.twGreen800,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 90,
    fontSize: typography.body,
    color: P.slate800,
    backgroundColor: P.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
    elevation: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bottomBarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  cancelBtnText: {
    color: P.slate600,
    fontSize: typography.body,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
    backgroundColor: P.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: P.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
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
    borderRadius: 14,
    padding: 16,
    elevation: 6,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: P.twGreen700,
    fontWeight: '700',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModalCard: {
    backgroundColor: P.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: P.twGreen100,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  successModalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
    textAlign: 'center',
  },
  successModalSubtitle: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  successDataBox: {
    backgroundColor: P.twGray50,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    marginBottom: 18,
  },
  successDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successDataCol: {
    flex: 1,
  },
  successColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  successColVal: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
  },
  successDivider: {
    height: 1,
    backgroundColor: P.slate200,
    marginVertical: 8,
  },
  successContextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  successContextLabel: {
    fontSize: 11,
    color: P.slate500,
    fontWeight: '500',
  },
  successContextVal: {
    fontSize: 11,
    fontWeight: '600',
    color: P.slate800,
    maxWidth: '65%',
    textAlign: 'right',
  },
  successModalOkBtn: {
    backgroundColor: P.twGreen700,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalOkBtnText: {
    color: P.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
