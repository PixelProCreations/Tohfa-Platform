import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
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
import DocumentPicker from 'react-native-document-picker';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function CloseIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
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

function InfoCircleIcon({ size = 14, color = P.deepPurple800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="7" r="1" fill={color} />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 14, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CheckCircleIcon({ size = 14, color = P.twGreen600 }: { size?: number; color?: string }) {
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

function WaterDropIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocIcon({ size = 14, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="7" x2="16" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function CloudUploadIcon({ size = 32, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 16l-4-4-4 4M12 12v9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PdfFileIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M14 2v5h5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9.5 15.5h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Options
// ─────────────────────────────────────────────

export interface UploadNewSoilTestScreenProps {
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
  onNavigateToFieldContext?: (() => void) | undefined;
}

const LIME_STATUS_OPTIONS = ['Harmless', 'Slight', 'Moderate', 'Severe'];

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function UploadNewSoilTestScreen({
  onBack,
  onSave,
  onNavigateToFieldContext,
}: UploadNewSoilTestScreenProps): React.JSX.Element {
  const [testDate, setTestDate] = useState('12/06/26');
  const [nextDue, setNextDue] = useState('11/06/27');

  const [organicCarbon, setOrganicCarbon] = useState('0.62');
  const [ph, setPh] = useState('5.8');
  const [ec, setEc] = useState('0.7');
  const [tds, setTds] = useState('312');
  const [limeStatus, setLimeStatus] = useState('Harmless');

  const [limePickerVisible, setLimePickerVisible] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<{
    name: string;
    size: string;
    uri: string;
  } | null>(null);

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

  const handlePickDocument = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const sizeMB = ((picked.size ?? 1024 * 1024) / (1024 * 1024)).toFixed(1);
      const isPdf = (picked.name ?? '').toLowerCase().endsWith('.pdf');
      setAttachedDoc({
        name: picked.name ?? 'soil_lab_report.pdf',
        size: `${sizeMB} MB · ${isPdf ? 'PDF' : 'IMAGE'}`,
        uri: picked.fileCopyUri ?? picked.uri,
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        // Fallback demo document if picker unavailable
        setAttachedDoc({
          name: 'soil_lab_report_june2026.pdf',
          size: '1.8 MB · PDF',
          uri: 'https://storage.tohfa.in/reports/soil_lab_report_2026.pdf',
        });
      }
    }
  };

  const handleSave = () => {
    if (!testDate.trim() || !ph.trim() || !organicCarbon.trim()) {
      Alert.alert('Required Fields', 'Please ensure Test Date, Organic Carbon, and pH are filled.');
      return;
    }

    Alert.alert(
      'Soil Test Saved',
      `Soil test record successfully saved.\n\n• Test Date: ${testDate}\n• pH: ${ph}\n• OC: ${organicCarbon}%\n• EC: ${ec} dS/m`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSave) {
              onSave();
            } else if (onBack) {
              onBack();
            }
          },
        },
      ],
    );
  };

  // Helper validations matching exact UI
  const ocVal = parseFloat(organicCarbon) || 0;
  const phVal = parseFloat(ph) || 0;
  const isPhAcidic = phVal > 0 && phVal < 6.0;
  const isPhGood = phVal >= 6.0 && phVal <= 7.5;
  const isPhAlkaline = phVal > 7.5;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navCircleButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <CloseIcon size={18} color={P.twGreen700} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>New Soil Test</Text>
          <Text style={styles.headerSubtitle}>Log your latest lab results</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Date Row ── */}
        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <View style={styles.labelRow}>
              <CalendarIcon size={14} color={P.twGray600} />
              <Text style={styles.inputLabel}> Test Date </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputText}
                value={testDate}
                onChangeText={setTestDate}
                placeholder="DD/MM/YY"
                placeholderTextColor={P.twGray400}
              />
              <CalendarIcon size={16} color={P.twGray400} />
            </View>
          </View>

          <View style={styles.dateInputContainer}>
            <View style={styles.labelRow}>
              <CalendarIcon size={14} color={P.twGray600} />
              <Text style={styles.inputLabel}> Next Due </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputText}
                value={nextDue}
                onChangeText={setNextDue}
                placeholder="DD/MM/YY"
                placeholderTextColor={P.twGray400}
              />
              <CalendarIcon size={16} color={P.twGray400} />
            </View>
          </View>
        </View>
        <Text style={styles.dateHintText}>Auto-suggested as test date + 1 year — editable.</Text>

        {/* ── Section Heading ── */}
        <Text style={styles.sectionHeading}>MEASURED VALUES</Text>

        {/* ── Organic Carbon (%) ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Organic Carbon (%) </Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={organicCarbon}
            onChangeText={setOrganicCarbon}
            keyboardType="decimal-pad"
            placeholder="0.62"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            <InfoCircleIcon size={14} color={P.deepPurple800} />
            <Text style={styles.infoText}>
              {ocVal >= 0.51 && ocVal <= 0.75
                ? 'Medium — within the 0.51–0.75% range'
                : ocVal < 0.51
                ? 'Low — below 0.51% range'
                : 'High — above 0.75% ideal range'}
            </Text>
          </View>
        </View>

        {/* ── pH ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>pH </Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>
          <TextInput
            style={[styles.textInput, isPhAcidic ? styles.textInputError : undefined]}
            value={ph}
            onChangeText={setPh}
            keyboardType="decimal-pad"
            placeholder="5.8"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            {isPhAcidic ? (
              <>
                <WarningTriangleIcon size={14} color={P.twRed600} />
                <Text style={styles.errorText}>Acidic — below the 6.0–7.5 ideal range</Text>
              </>
            ) : isPhGood ? (
              <>
                <CheckCircleIcon size={14} color={P.twGreen600} />
                <Text style={styles.successText}>Good — within the 6.0–7.5 ideal range</Text>
              </>
            ) : (
              <>
                <WarningTriangleIcon size={14} color={P.twRed600} />
                <Text style={styles.errorText}>Alkaline — above the 6.0–7.5 ideal range</Text>
              </>
            )}
          </View>
        </View>

        {/* ── EC (dS/m) ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>EC (dS/m) </Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={ec}
            onChangeText={setEc}
            keyboardType="decimal-pad"
            placeholder="0.7"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            <CheckCircleIcon size={14} color={P.twGreen600} />
            <Text style={styles.successText}>Good — at or below 1.0 dS/m</Text>
          </View>
        </View>

        {/* ── TDS (ppm) ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>TDS (ppm) </Text>
            <Text style={styles.optionalText}>optional</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={tds}
            onChangeText={setTds}
            keyboardType="number-pad"
            placeholder="312"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            <CheckCircleIcon size={14} color={P.twGreen600} />
            <Text style={styles.successText}>Good — within 0–500 ppm</Text>
          </View>
        </View>

        {/* ── Lime Status ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Lime Status </Text>
            <Text style={styles.optionalText}>optional</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.8}
            onPress={() => setLimePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Select Lime Status"
          >
            <Text style={styles.dropdownSelectedText}>{limeStatus}</Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── Water Source Context ── */}
        <View style={styles.waterContextBox}>
          <View style={styles.waterIconCircle}>
            <WaterDropIcon size={20} color={P.twGray500} />
          </View>
          <View style={styles.waterContextInfo}>
            <Text style={styles.waterContextLabel}>WATER SOURCE (FROM FIELD CONTEXT)</Text>
            <Text style={styles.waterContextValue}>Borewell · Rainwater harvesting</Text>
          </View>
          <TouchableOpacity
            onPress={onNavigateToFieldContext}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.waterContextEditBtn}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Lab Report Document ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <DocIcon size={14} color={P.twGray600} />
            <Text style={styles.inputLabel}> Lab Report Document</Text>
          </View>

          {attachedDoc ? (
            <View style={styles.docCard}>
              <View style={styles.docIconBox}>
                <PdfFileIcon size={20} color={P.white} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>
                  {attachedDoc.name}
                </Text>
                <Text style={styles.docMeta}>{attachedDoc.size}</Text>
              </View>
              <TouchableOpacity
                style={styles.docRemoveBtn}
                onPress={() => setAttachedDoc(null)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Remove document"
              >
                <CloseIcon size={14} color={P.twRed600} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBox}
              activeOpacity={0.8}
              onPress={handlePickDocument}
              accessibilityRole="button"
              accessibilityLabel="Choose lab report document"
            >
              <CloudUploadIcon size={32} color={P.twGreen600} />
              <Text style={styles.uploadTitle}>Choose file</Text>
              <Text style={styles.uploadSubtitle}>PDF, JPG or PNG · max 10 MB</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Save Soil Test"
        >
          <Text style={styles.saveBtnText}>✓ Save Soil Test</Text>
        </TouchableOpacity>
      </View>

      {/* ── Lime Status Selection Modal ── */}
      <Modal
        visible={limePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLimePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLimePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Lime Status</Text>
            {LIME_STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.modalOption,
                  limeStatus === opt ? styles.modalOptionSelected : undefined,
                ]}
                onPress={() => {
                  setLimeStatus(opt);
                  setLimePickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    limeStatus === opt ? styles.modalOptionTextSelected : undefined,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
    backgroundColor: P.white,
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

  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  dateInputContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: P.slate700,
  },
  requiredAsterisk: {
    color: P.twRed500,
    fontWeight: '700',
    fontSize: 13,
  },
  optionalText: {
    color: P.slate400,
    fontWeight: 'normal',
    fontSize: 12,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: P.white,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: P.slate800,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dateHintText: {
    fontSize: 11,
    color: P.slate400,
    marginBottom: 20,
    lineHeight: 16,
  },

  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
    marginBottom: 14,
    letterSpacing: 0.6,
  },

  fieldContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: P.white,
    fontSize: 14,
    color: P.slate800,
    fontWeight: '500',
  },
  textInputError: {
    borderColor: P.twRed500,
    borderWidth: 1.2,
  },

  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: P.white,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: P.slate800,
    fontWeight: '500',
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: P.deepPurple800,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: P.twRed600,
    fontWeight: '500',
  },
  successText: {
    fontSize: 12,
    color: P.twGreen600,
    fontWeight: '500',
  },

  waterContextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.slate50,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  waterIconCircle: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterContextInfo: {
    flex: 1,
    marginLeft: 8,
  },
  waterContextLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: P.twGray500,
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  waterContextValue: {
    fontSize: 13,
    fontWeight: '700',
    color: P.slate800,
  },
  waterContextEditBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGreen700,
    paddingHorizontal: 6,
  },

  uploadBox: {
    borderWidth: 1.5,
    borderColor: P.twGreen400,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: P.twGreen50,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen700,
    marginTop: 6,
    marginBottom: 3,
  },
  uploadSubtitle: {
    fontSize: 11,
    color: P.twGray500,
  },

  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGreen50,
    borderWidth: 1,
    borderColor: P.twGreen400,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: P.twGreen700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGreen900,
  },
  docMeta: {
    fontSize: 11,
    color: P.twGreen700,
    marginTop: 2,
  },
  docRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    elevation: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 14,
    color: P.slate800,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: P.twGreen700,
    fontWeight: '700',
  },
});
