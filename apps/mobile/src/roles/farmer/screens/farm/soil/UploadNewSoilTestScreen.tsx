import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Skeleton, DatePicker } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../api/farms';
import { signUpload } from '../../../api/registration';
import { uploadWithResume } from '../../../api/uploader';
import { createSoilTest, type CreateSoilTestInput, type LimeStatus } from '../../../api/soil';

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
  /** The farm this test belongs to, threaded from SoilManagementScreen. */
  farmId: string;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
  onNavigateToFieldContext?: (() => void) | undefined;
}

const LIME_STATUS_OPTIONS = ['Harmless', 'Slight', 'Moderate', 'Severe'];

/**
 * The date inputs on this screen are free-typed as `DD/MM/YY` (matching the
 * pre-filled example values below); the API wants `YYYY-MM-DD`
 * (soil.schema.ts's `dateSchema`). Returns null for anything that doesn't
 * parse, which handleSave treats as a validation failure exactly like an
 * empty field.
 */
function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  const slashMatch = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2}|\d{4})$/);
  if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const rawYear = slashMatch[3];
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = trimmed.match(/^(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})$/);
  if (ymdMatch && ymdMatch[1] && ymdMatch[2] && ymdMatch[3]) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
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

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function UploadNewSoilTestScreen({
  farmId,
  onBack,
  onSave,
  onNavigateToFieldContext,
}: UploadNewSoilTestScreenProps): React.JSX.Element {
  // No plot picker exists in this mock's UI (no zone selector is drawn anywhere
  // below), so -- same "no create-form UI to invent" limit that applies to
  // Amendments/Erosion -- the test is logged against the farm's first plot.
  // Flagged in the task report as a judgment call: multi-plot farms cannot pick
  // a different zone here today.
  const [plotId, setPlotId] = useState('');
  const [plotLoading, setPlotLoading] = useState(true);
  const [plotLoadError, setPlotLoadError] = useState<string | null>(null);
  const [waterSourcesText, setWaterSourcesText] = useState('Borewell · Rainwater harvesting');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!farmId) {
        setPlotLoadError('No farm selected. Go back and choose a farm first.');
        setPlotLoading(false);
        return;
      }
      setPlotLoading(true);
      setPlotLoadError(null);
      try {
        const [plots, farms] = await Promise.all([
          getPlots(farmId),
          getFarms().catch(() => []),
        ]);
        if (cancelled) return;
        const currentFarm = farms.find((f) => f.id === farmId);
        if (currentFarm && currentFarm.waterSources && currentFarm.waterSources.length > 0) {
          setWaterSourcesText(currentFarm.waterSources.join(' · '));
        }
        const firstPlot = plots[0];
        if (!firstPlot) {
          setPlotLoadError('This farm has no zones yet. Add a zone before logging a soil test.');
        } else {
          setPlotId(firstPlot.id);
        }
      } catch (err) {
        if (!cancelled) {
          setPlotLoadError(formatErrorMessage(err, 'Could not load this farm’s zones.'));
        }
      } finally {
        if (!cancelled) setPlotLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  interface SavedSoilTestData {
    testDate: string;
    nextDue: string;
    ph: number;
    oc: number;
    ec: number;
    tds?: number | null | undefined;
    nitrogen?: number | null | undefined;
    phosphorus?: number | null | undefined;
    potassium?: number | null | undefined;
    limeStatus: string;
    waterSources?: string | undefined;
    documentName?: string | undefined;
  }
  const [savedSuccessModal, setSavedSuccessModal] = useState<SavedSoilTestData | null>(null);

  const handleSuccessModalClose = () => {
    setSavedSuccessModal(null);
    if (onSave) {
      onSave();
    } else if (onBack) {
      onBack();
    }
  };

  const [testDate, setTestDate] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [isTestDatePickerVisible, setIsTestDatePickerVisible] = useState(false);
  const [isNextDuePickerVisible, setIsNextDuePickerVisible] = useState(false);

  const handleSelectTestDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    setTestDate(`${dd}/${mm}/${yy}`);

    // Auto-suggest next due date as test date + 1 year (editable)
    const nextDate = new Date(date);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    const nextDd = String(nextDate.getDate()).padStart(2, '0');
    const nextMm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const nextYy = String(nextDate.getFullYear()).slice(-2);
    setNextDue(`${nextDd}/${nextMm}/${nextYy}`);
    setIsTestDatePickerVisible(false);
  };

  const handleSelectNextDue = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    setNextDue(`${dd}/${mm}/${yy}`);
    setIsNextDuePickerVisible(false);
  };

  const [organicCarbon, setOrganicCarbon] = useState('');
  const [ph, setPh] = useState('');
  const [ec, setEc] = useState('');
  const [tds, setTds] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [limeStatus, setLimeStatus] = useState('');

  const [limePickerVisible, setLimePickerVisible] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<{
    name: string;
    size: string;
    uri: string;
  } | null>(null);
  const [docPickError, setDocPickError] = useState<string | null>(null);

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
      setDocPickError(null);
    } catch (err) {
      // User cancelling the picker is not an error -- just leave attachedDoc
      // untouched. Any other failure must be shown to the farmer, never
      // papered over with a fabricated "attached" document (that previously
      // let the UI claim a real file was attached when nothing was picked).
      if (!DocumentPicker.isCancel(err)) {
        setDocPickError(formatErrorMessage(err, 'Could not attach the document. Please try again.'));
      }
    }
  };

  const handleSave = async () => {
    setSaveError(null);

    if (!testDate.trim() || !nextDue.trim() || !organicCarbon.trim() || !ph.trim() || !ec.trim()) {
      setSaveError('Please fill in Test Date, Next Due, Organic Carbon, pH and EC — these are required.');
      return;
    }

    const isoTestDate = toIsoDate(testDate);
    const isoNextDue = toIsoDate(nextDue);
    if (!isoTestDate || !isoNextDue) {
      setSaveError('Test Date and Next Due must be a valid date in DD/MM/YY format.');
      return;
    }
    if (!farmId || !plotId) {
      setSaveError('No zone available to log this test against.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      // Best-effort lab report upload. POST /uploads/sign now returns the
      // uploads-table row id (`id`) alongside the signed target, so it can be
      // linked to this soil test record as `labReportUploadId` -- soil.service.ts's
      // requireOwnUpload looks it up by primary key and rejects anything the
      // caller doesn't own.
      let labReportUploadId: string | undefined;
      if (attachedDoc) {
        try {
          const fileResp = await fetch(attachedDoc.uri);
          const buffer = await fileResp.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const signed = await signUpload({
            purpose: 'SOIL_TEST_REPORT',
            fileName: attachedDoc.name,
            contentType: attachedDoc.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            sizeBytes: bytes.length,
          });
          await uploadWithResume({
            uploadUrl: signed.uploadUrl,
            fileUrl: signed.fileUrl,
            resumable: signed.resumable ?? false,
            data: bytes,
            contentType: attachedDoc.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            headers: signed.headers,
            method: signed.method,
          });
          labReportUploadId = signed.id;
        } catch {
          // Non-fatal: the soil test record itself is still worth saving even
          // if the report upload failed.
        }
      }

      const body: CreateSoilTestInput = {
        testDate: isoTestDate,
        nextDueDate: isoNextDue,
        organicCarbonPct: parseFloat(organicCarbon),
        ph: parseFloat(ph),
        ecDsPerM: parseFloat(ec),
        ...(tds.trim() ? { tdsPpm: Math.round(parseFloat(tds)) } : {}),
        ...(nitrogen.trim() ? { nitrogenKgPerHa: parseFloat(nitrogen) } : {}),
        ...(phosphorus.trim() ? { phosphorusKgPerHa: parseFloat(phosphorus) } : {}),
        ...(potassium.trim() ? { potassiumKgPerHa: parseFloat(potassium) } : {}),
        ...(limeStatus ? { limeStatus: limeStatus as LimeStatus } : {}),
        ...(labReportUploadId ? { labReportUploadId } : {}),
      };

      const saved = await createSoilTest(farmId, plotId, body);

      setSavedSuccessModal({
        testDate,
        nextDue,
        ph: saved.ph,
        oc: saved.organicCarbonPct,
        ec: saved.ecDsPerM,
        tds: saved.tdsPpm ?? (tds.trim() ? parseFloat(tds) : null),
        nitrogen: saved.nitrogenKgPerHa ?? (nitrogen.trim() ? parseFloat(nitrogen) : null),
        phosphorus: saved.phosphorusKgPerHa ?? (phosphorus.trim() ? parseFloat(phosphorus) : null),
        potassium: saved.potassiumKgPerHa ?? (potassium.trim() ? parseFloat(potassium) : null),
        limeStatus: saved.limeStatus || limeStatus,
        waterSources: waterSourcesText,
        documentName: attachedDoc?.name,
      });
    } catch (err) {
      setSaveError(formatErrorMessage(err, 'Could not save this soil test.'));
    } finally {
      setSaving(false);
    }
  };

  // Helper validations matching exact UI
  const ocVal = parseFloat(organicCarbon) || 0;
  const phVal = parseFloat(ph) || 0;
  const isPhAcidic = phVal > 0 && phVal < 6.0;
  const isPhGood = phVal >= 6.0 && phVal <= 7.5;
  const isPhAlkaline = phVal > 7.5;

  const nVal = parseFloat(nitrogen) || 0;
  const pVal = parseFloat(phosphorus) || 0;
  const kVal = parseFloat(potassium) || 0;

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

      {plotLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={48} width="100%" style={{ marginBottom: 16 }} />
          <Skeleton height={200} width="100%" />
        </View>
      ) : plotLoadError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{plotLoadError}</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Date Row ── */}
        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <TouchableOpacity
              style={styles.labelRow}
              activeOpacity={0.7}
              onPress={() => setIsTestDatePickerVisible(true)}
            >
              <CalendarIcon size={14} color={P.twGray600} />
              <Text style={styles.inputLabel}> Test Date </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </TouchableOpacity>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputText}
                value={testDate}
                onChangeText={setTestDate}
                placeholder="e.g. 12/06/26"
                placeholderTextColor={P.twGray400}
              />
              <TouchableOpacity
                onPress={() => setIsTestDatePickerVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Open Test Date calendar"
              >
                <CalendarIcon size={16} color={P.twGray400} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateInputContainer}>
            <TouchableOpacity
              style={styles.labelRow}
              activeOpacity={0.7}
              onPress={() => setIsNextDuePickerVisible(true)}
            >
              <CalendarIcon size={14} color={P.twGray600} />
              <Text style={styles.inputLabel}> Next Due </Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </TouchableOpacity>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputText}
                value={nextDue}
                onChangeText={setNextDue}
                placeholder="e.g. 11/06/27"
                placeholderTextColor={P.twGray400}
              />
              <TouchableOpacity
                onPress={() => setIsNextDuePickerVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Open Next Due Date calendar"
              >
                <CalendarIcon size={16} color={P.twGray400} />
              </TouchableOpacity>
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
            {ocVal > 0 ? (
              <>
                <InfoCircleIcon size={14} color={P.deepPurple800} />
                <Text style={styles.infoText}>
                  {ocVal >= 0.51 && ocVal <= 0.75
                    ? 'Medium — within the 0.51–0.75% range'
                    : ocVal < 0.51
                    ? 'Low — below 0.51% range'
                    : 'High — above 0.75% ideal range'}
                </Text>
              </>
            ) : null}
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
            ) : isPhAlkaline ? (
              <>
                <WarningTriangleIcon size={14} color={P.twRed600} />
                <Text style={styles.errorText}>Alkaline — above the 6.0–7.5 ideal range</Text>
              </>
            ) : null}
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

        {/* ── Section Heading: NPK Primary Nutrients ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>PRIMARY NUTRIENTS (NPK)</Text>

        {/* ── Available Nitrogen (N) ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Available Nitrogen (N) (kg/ha) </Text>
            <Text style={styles.optionalText}>optional</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={nitrogen}
            onChangeText={setNitrogen}
            keyboardType="decimal-pad"
            placeholder="280"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            {nVal > 0 && nVal < 280 ? (
              <>
                <WarningTriangleIcon size={14} color={P.twRed600} />
                <Text style={styles.errorText}>Low — below 280 kg/ha ideal range</Text>
              </>
            ) : nVal >= 280 && nVal <= 560 ? (
              <>
                <CheckCircleIcon size={14} color={P.twGreen600} />
                <Text style={styles.successText}>Medium / Good — within 280–560 kg/ha range</Text>
              </>
            ) : nVal > 560 ? (
              <>
                <InfoCircleIcon size={14} color={P.deepPurple800} />
                <Text style={styles.infoText}>High — above 560 kg/ha</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* ── Available Phosphorus (P) ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Available Phosphorus (P) (kg/ha) </Text>
            <Text style={styles.optionalText}>optional</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={phosphorus}
            onChangeText={setPhosphorus}
            keyboardType="decimal-pad"
            placeholder="24"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            {pVal > 0 && pVal < 10 ? (
              <>
                <WarningTriangleIcon size={14} color={P.twRed600} />
                <Text style={styles.errorText}>Low — below 10 kg/ha ideal range</Text>
              </>
            ) : pVal >= 10 && pVal <= 25 ? (
              <>
                <CheckCircleIcon size={14} color={P.twGreen600} />
                <Text style={styles.successText}>Medium / Good — within 10–25 kg/ha range</Text>
              </>
            ) : pVal > 25 ? (
              <>
                <CheckCircleIcon size={14} color={P.twGreen600} />
                <Text style={styles.successText}>High — above 25 kg/ha</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* ── Available Potassium (K) ── */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Available Potassium (K) (kg/ha) </Text>
            <Text style={styles.optionalText}>optional</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={potassium}
            onChangeText={setPotassium}
            keyboardType="decimal-pad"
            placeholder="195"
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.badgeRow}>
            {kVal > 0 && kVal < 110 ? (
              <>
                <WarningTriangleIcon size={14} color={P.twRed600} />
                <Text style={styles.errorText}>Low — below 110 kg/ha ideal range</Text>
              </>
            ) : kVal >= 110 && kVal <= 280 ? (
              <>
                <CheckCircleIcon size={14} color={P.twGreen600} />
                <Text style={styles.successText}>Good — within 110–280 kg/ha range</Text>
              </>
            ) : kVal > 280 ? (
              <>
                <CheckCircleIcon size={14} color={P.twGreen600} />
                <Text style={styles.successText}>High — above 280 kg/ha</Text>
              </>
            ) : null}
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
            <Text
              style={[
                styles.dropdownSelectedText,
                !limeStatus ? styles.dropdownPlaceholderText : undefined,
              ]}
            >
              {limeStatus || 'Select lime status'}
            </Text>
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
            <Text style={styles.waterContextValue}>{waterSourcesText}</Text>
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
          {docPickError ? (
            <View style={styles.badgeRow}>
              <WarningTriangleIcon size={14} color={P.twRed600} />
              <Text style={styles.errorText}>{docPickError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      )}

      {/* ── Sticky Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
        <View style={styles.bottomBarRow}>
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
          style={[styles.saveBtn, { opacity: saving || plotLoading || !!plotLoadError ? 0.7 : 1 }]}
          onPress={() => void handleSave()}
          disabled={saving || plotLoading || !!plotLoadError}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Save Soil Test"
        >
          {saving ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <Text style={styles.saveBtnText}>✓ Save Soil Test</Text>
          )}
        </TouchableOpacity>
        </View>
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

      {/* ── Test Date Picker Modal ── */}
      <DatePicker
        visible={isTestDatePickerVisible}
        onClose={() => setIsTestDatePickerVisible(false)}
        onSelect={(date) => handleSelectTestDate(date)}
        value={parseSoilDate(testDate)}
        title="Select Test Date"
        format="DD/MM/YY"
      />

      {/* ── Next Due Date Picker Modal ── */}
      <DatePicker
        visible={isNextDuePickerVisible}
        onClose={() => setIsNextDuePickerVisible(false)}
        onSelect={(date) => handleSelectNextDue(date)}
        value={parseSoilDate(nextDue)}
        title="Select Next Due Date"
        format="DD/MM/YY"
      />

      {/* ── Soil Test Saved Success Modal ── */}
      <Modal
        visible={!!savedSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircleIcon size={30} color={P.twGreen700} />
            </View>

            <Text style={styles.successModalTitle}>Soil Test Saved</Text>
            <Text style={styles.successModalSubtitle}>
              Soil test record successfully saved with all parameters.
            </Text>

            <View style={styles.successDataBox}>
              {/* Date Row */}
              <View style={styles.successDataRow}>
                <View style={styles.successDataCol}>
                  <Text style={styles.successColLabel}>TEST DATE</Text>
                  <Text style={styles.successColVal}>{savedSuccessModal?.testDate || '-'}</Text>
                </View>
                <View style={styles.successDataCol}>
                  <Text style={styles.successColLabel}>NEXT DUE</Text>
                  <Text style={styles.successColVal}>{savedSuccessModal?.nextDue || '-'}</Text>
                </View>
              </View>

              <View style={styles.successDivider} />

              {/* Core 3: pH, OC, EC */}
              <View style={styles.successMetricsGrid}>
                <View style={styles.successMetricItem}>
                  <Text style={styles.successMetricLabel}>pH</Text>
                  <Text style={styles.successMetricVal}>{savedSuccessModal?.ph}</Text>
                  <Text
                    style={[
                      styles.successMetricBadge,
                      (savedSuccessModal?.ph ?? 7) < 6.0
                        ? styles.badgeWarning
                        : (savedSuccessModal?.ph ?? 7) <= 7.5
                        ? styles.badgeGood
                        : styles.badgeWarning,
                    ]}
                  >
                    {(savedSuccessModal?.ph ?? 7) < 6.0
                      ? 'Acidic'
                      : (savedSuccessModal?.ph ?? 7) <= 7.5
                      ? 'Good'
                      : 'Alkaline'}
                  </Text>
                </View>

                <View style={styles.successMetricItem}>
                  <Text style={styles.successMetricLabel}>OC</Text>
                  <Text style={styles.successMetricVal}>{savedSuccessModal?.oc}%</Text>
                  <Text
                    style={[
                      styles.successMetricBadge,
                      (savedSuccessModal?.oc ?? 0) < 0.51
                        ? styles.badgeWarning
                        : (savedSuccessModal?.oc ?? 0) <= 0.75
                        ? styles.badgeGood
                        : styles.badgeInfo,
                    ]}
                  >
                    {(savedSuccessModal?.oc ?? 0) < 0.51
                      ? 'Low'
                      : (savedSuccessModal?.oc ?? 0) <= 0.75
                      ? 'Medium'
                      : 'High'}
                  </Text>
                </View>

                <View style={styles.successMetricItem}>
                  <Text style={styles.successMetricLabel}>EC</Text>
                  <Text style={styles.successMetricVal}>
                    {savedSuccessModal?.ec} <Text style={styles.successUnitText}>dS/m</Text>
                  </Text>
                  <Text
                    style={[
                      styles.successMetricBadge,
                      (savedSuccessModal?.ec ?? 0) <= 1.0
                        ? styles.badgeGood
                        : (savedSuccessModal?.ec ?? 0) <= 2.0
                        ? styles.badgeWarning
                        : styles.badgeDanger,
                    ]}
                  >
                    {(savedSuccessModal?.ec ?? 0) <= 1.0
                      ? 'Normal'
                      : (savedSuccessModal?.ec ?? 0) <= 2.0
                      ? 'Slight'
                      : 'Saline'}
                  </Text>
                </View>
              </View>

              {/* Nutrients N-P-K / TDS if present */}
              {(savedSuccessModal?.nitrogen != null ||
                savedSuccessModal?.phosphorus != null ||
                savedSuccessModal?.potassium != null ||
                savedSuccessModal?.tds != null) && (
                <>
                  <View style={styles.successDivider} />
                  <View style={styles.successNutrientsGrid}>
                    {savedSuccessModal.nitrogen != null && (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientChipKey}>N:</Text>
                        <Text style={styles.nutrientChipVal}>{savedSuccessModal.nitrogen} kg/ha</Text>
                      </View>
                    )}
                    {savedSuccessModal.phosphorus != null && (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientChipKey}>P:</Text>
                        <Text style={styles.nutrientChipVal}>{savedSuccessModal.phosphorus} kg/ha</Text>
                      </View>
                    )}
                    {savedSuccessModal.potassium != null && (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientChipKey}>K:</Text>
                        <Text style={styles.nutrientChipVal}>{savedSuccessModal.potassium} kg/ha</Text>
                      </View>
                    )}
                    {savedSuccessModal.tds != null && (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientChipKey}>TDS:</Text>
                        <Text style={styles.nutrientChipVal}>{savedSuccessModal.tds} ppm</Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Context info (Lime, Water, Doc) */}
              <View style={styles.successDivider} />
              <View style={styles.successContextRow}>
                <Text style={styles.successContextLabel}>Lime Status</Text>
                <Text style={styles.successContextVal}>{savedSuccessModal?.limeStatus || 'Not applied'}</Text>
              </View>
              {savedSuccessModal?.waterSources ? (
                <View style={styles.successContextRow}>
                  <Text style={styles.successContextLabel}>Water Source</Text>
                  <Text style={styles.successContextVal} numberOfLines={1}>
                    {savedSuccessModal.waterSources}
                  </Text>
                </View>
              ) : null}
              {savedSuccessModal?.documentName ? (
                <View style={styles.successContextRow}>
                  <Text style={styles.successContextLabel}>Report</Text>
                  <View style={styles.docReportValueBox}>
                    <DocIcon size={12} color={P.twGreen700} />
                    <Text style={[styles.successContextVal, { color: P.twGreen700, marginLeft: 4 }]} numberOfLines={1}>
                      {savedSuccessModal.documentName}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.successModalOkBtn}
              onPress={handleSuccessModalClose}
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
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: P.slate500,
    fontSize: typography.bodySmall,
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
    fontWeight: 'normal',
    fontSize: typography.bodySmall,
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
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dateHintText: {
    fontSize: typography.caption,
    color: P.slate400,
    marginBottom: 20,
    lineHeight: 16,
  },

  sectionHeading: {
    fontSize: typography.caption,
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
    fontSize: typography.body,
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
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '500',
  },
  dropdownPlaceholderText: {
    color: P.twGray400,
    fontWeight: 'normal',
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  infoText: {
    fontSize: typography.bodySmall,
    color: P.deepPurple800,
    fontWeight: '500',
  },
  errorText: {
    fontSize: typography.bodySmall,
    color: P.twRed600,
    fontWeight: '500',
  },
  successText: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  waterContextValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  waterContextEditBtn: {
    fontSize: typography.body,
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
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen700,
    marginTop: 6,
    marginBottom: 3,
  },
  uploadSubtitle: {
    fontSize: typography.caption,
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
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGreen900,
  },
  docMeta: {
    fontSize: typography.caption,
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
  saveErrorText: {
    color: P.twRed600,
    fontSize: typography.bodySmall,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadErrorText: {
    color: P.twRed600,
    fontSize: typography.body,
    fontWeight: '600',
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
  successMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  successMetricItem: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.slate100,
  },
  successMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.slate500,
  },
  successMetricVal: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
    marginVertical: 2,
  },
  successUnitText: {
    fontSize: 10,
    fontWeight: '500',
    color: P.slate500,
  },
  successMetricBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeGood: {
    backgroundColor: P.twGreen100,
    color: P.twGreen700,
  },
  badgeWarning: {
    backgroundColor: P.twAmber100,
    color: P.twAmber800,
  },
  badgeInfo: {
    backgroundColor: P.violetTint,
    color: P.deepPurple800,
  },
  badgeDanger: {
    backgroundColor: P.twRed100,
    color: P.twRed600,
  },
  docReportValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
  },
  successNutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nutrientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  nutrientChipKey: {
    fontSize: 11,
    fontWeight: '700',
    color: P.slate600,
    marginRight: 3,
  },
  nutrientChipVal: {
    fontSize: 11,
    fontWeight: '600',
    color: P.slate800,
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
