import { useState } from 'react';
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
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { AuditScheduleRecord } from './fixtures';

// ─── SVG Icons Matching Admin Theme ──────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UploadFileIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M17 8l-5-5-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SlidersIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="8" x2="20" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="4" y1="16" x2="20" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="9" cy="8" r="2.5" fill={adminColors.card} stroke={color} strokeWidth="1.8" />
      <Circle cx="15" cy="16" r="2.5" fill={adminColors.card} stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function FileTextIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DiamondIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,2 22,8.5 12,22 2,8.5" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="2" y1="8.5" x2="22" y2="8.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function TractorIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="17" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="17" cy="15" r="5" stroke={color} strokeWidth="1.8" />
      <Path d="M7 14h6v-6h-4l-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 11h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LeafIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 17-9 17z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 21c3-3 7-7 11-10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AppleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z" stroke={color} strokeWidth="1.8" />
      <Path d="M10 2c1 .5 2 2 2 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BarcodeIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="5" x2="3" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="5" x2="7" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="5" x2="11" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="5" x2="16" y2="19" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <Line x1="21" y1="5" x2="21" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UsersIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BankIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="2" y1="21" x2="22" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Polygon points="12,2 2,7 22,7" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="6" y1="10" x2="6" y2="18" stroke={color} strokeWidth="1.8" />
      <Line x1="10" y1="10" x2="10" y2="18" stroke={color} strokeWidth="1.8" />
      <Line x1="14" y1="10" x2="14" y2="18" stroke={color} strokeWidth="1.8" />
      <Line x1="18" y1="10" x2="18" y2="18" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function StoreIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-5h16l1 5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 14v7h16v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LightbulbIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18h6M10 22h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 2a7 7 0 0 0-4.5 12.36V16a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1.64A7 7 0 0 0 12 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Custom UI Pickers & Helpers ─────────────────────────────────────────────

interface SelectBoxProps {
  label?: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  iconType?: 'chevron' | 'search' | 'sliders' | 'calendar';
  options?: string[];
  onSelect?: (val: string) => void;
  helperText?: string;
}

function SelectBox({
  label,
  required,
  value,
  placeholder = 'Select...',
  iconType = 'chevron',
  options,
  onSelect,
  helperText,
}: SelectBoxProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isSelected = value && value !== 'Select...';

  const defaultOptions = options || ['Select...', 'Compliant', 'Non-compliant', 'Verified', 'Pending', 'Active'];

  return (
    <View style={styles.formFieldGroup}>
      {label && (
        <Text style={styles.formLabel}>
          {label} {required && <Text style={styles.asterisk}>*</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={styles.selectInput}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={[styles.selectText, !isSelected && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        {iconType === 'chevron' && <ChevronDownIcon size={16} />}
        {iconType === 'search' && <SearchIcon size={16} />}
        {iconType === 'sliders' && <SlidersIcon size={16} />}
        {iconType === 'calendar' && <CalendarIcon size={18} />}
      </TouchableOpacity>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Modal visible={modalOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label || 'Select option'}</Text>
            {defaultOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOptionRow, value === opt && styles.modalOptionActive]}
                onPress={() => {
                  if (onSelect) onSelect(opt);
                  setModalOpen(false);
                }}
              >
                <Text style={[styles.modalOptionText, value === opt && styles.modalOptionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export interface StepFormProps {
  step: number;
  record: AuditScheduleRecord;
  onBack: () => void;
  onSave: () => void;
}

export interface WaterSourceEntry {
  id: number;
  source: string;
  sourceType: string;
  location: string;
  purpose: string;
  verification: string;
  condition: string;
  testDate: string;
  testingMethod: string;
}

export function AuditInspectionStepForms({ step, record, onBack, onSave }: StepFormProps) {
  const farmerName = record?.farmerName || 'Ramesh Kumar';
  const farmerId = record?.farmerId || 'FR-00241';
  const auditId = record?.id || 'AUD-2026-0042';

  // Save Confirmation Popup
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // Step 1: Farmer Contact Verification
  const [phone, setPhone] = useState('+91 984XX XX011');
  const [address, setAddress] = useState('12, Hill View Road, Coonoor, Nilgiris');
  const [contactMethod, setContactMethod] = useState('Phone Call');
  const [contactVerifStatus, setContactVerifStatus] = useState('Verified');
  const [contactNotes, setContactNotes] = useState('Primary phone verified via OTP.');

  // Step 2: FMB & Land Verification (M5-S04D)
  const [surveyRef, setSurveyRef] = useState('');
  const [fmbAvailable, setFmbAvailable] = useState('Select...');
  const [docLegibility, setDocLegibility] = useState('Select...');
  const [boundaryVerif, setBoundaryVerif] = useState('Select...');
  const [farmLocVerif, setFarmLocVerif] = useState('Select...');
  const [plotZoneMapping, setPlotZoneMapping] = useState('Select...');
  const [landBoundaryStatus, setLandBoundaryStatus] = useState('Select...');
  const [step2Notes, setStep2Notes] = useState('');

  // Step 3: Farm Details Verification (M5-S04E)
  const [farmingType, setFarmingType] = useState('Select...');
  const [cropsGrown, setCropsGrown] = useState('Select...');
  const [plotZone, setPlotZone] = useState('Select...');
  const [farmWaterSource, setFarmWaterSource] = useState('Select...');
  const [irrigationType, setIrrigationType] = useState('Select...');
  const [farmRecordsAvail, setFarmRecordsAvail] = useState('Select...');
  const [farmDetailsVerif, setFarmDetailsVerif] = useState('Select...');
  const [step3Notes, setStep3Notes] = useState('');

  // Step 4: Certification Verification (M5-S04F)
  const [pgsOpen, setPgsOpen] = useState(true);
  const [npopOpen, setNpopOpen] = useState(false);
  const [pgsStatus, setPgsStatus] = useState('Select...');
  const [pgsCertDate, setPgsCertDate] = useState('');
  const [pgsExpiryDate, setPgsExpiryDate] = useState('');
  const [pgsDocVerif, setPgsDocVerif] = useState('Select...');
  const [pgsNotes, setPgsNotes] = useState('');

  const [npopStatus, setNpopStatus] = useState('Select...');
  const [npopCertDate, setNpopCertDate] = useState('');
  const [npopExpiryDate, setNpopExpiryDate] = useState('');
  const [npopDocVerif, setNpopDocVerif] = useState('Select...');
  const [npopNotes, setNpopNotes] = useState('');

  // Step 5: Soil Testing & Soil Report (M5-S04G)
  const [soilReportAvail, setSoilReportAvail] = useState('Select...');

  // Step 6: Water Sources & Water pH Testing (M5-S04H)
  const [waterSourcesList, setWaterSourcesList] = useState<WaterSourceEntry[]>([
    {
      id: 1,
      source: 'Select...',
      sourceType: 'Select...',
      location: '',
      purpose: 'Select...',
      verification: 'Select...',
      condition: 'Select...',
      testDate: '',
      testingMethod: 'Select...',
    },
  ]);

  const updateWaterSource = (index: number, field: keyof WaterSourceEntry, value: string) => {
    setWaterSourcesList(prev => {
      const next = [...prev];
      const target = next[index];
      if (target) {
        next[index] = { ...target, [field]: value };
      }
      return next;
    });
  };

  const handleAddWaterSource = () => {
    setWaterSourcesList(prev => [
      ...prev,
      {
        id: prev.length + 1,
        source: 'Select...',
        sourceType: 'Select...',
        location: '',
        purpose: 'Select...',
        verification: 'Select...',
        condition: 'Select...',
        testDate: '',
        testingMethod: 'Select...',
      },
    ]);
  };

  const handleRemoveWaterSource = (index: number) => {
    setWaterSourcesList(prev => prev.filter((_, i) => i !== index));
  };

  // Step 7: Farm Practices Checklist (M5-S04I)
  const [farmDocResult, setFarmDocResult] = useState('Select...');
  const [farmDocNotes, setFarmDocNotes] = useState('');
  const [farmDocEvidence, setFarmDocEvidence] = useState('Select...');

  const [organicResult, setOrganicResult] = useState('Select...');
  const [organicNotes, setOrganicNotes] = useState('');
  const [organicEvidence, setOrganicEvidence] = useState('Select...');

  const [cropMgmtResult, setCropMgmtResult] = useState('Select...');
  const [cropMgmtNotes, setCropMgmtNotes] = useState('');
  const [cropMgmtEvidence, setCropMgmtEvidence] = useState('Select...');

  const [inputUsageResult, setInputUsageResult] = useState('Select...');
  const [inputUsageNotes, setInputUsageNotes] = useState('');
  const [inputUsageEvidence, setInputUsageEvidence] = useState('Select...');

  // Step 8: Documents & Findings (M5-S04J)
  const [evidenceCat, setEvidenceCat] = useState('Select...');
  const [relatedSection, setRelatedSection] = useState('Select...');
  const [obsText, setObsText] = useState('');
  const [followupRec, setFollowupRec] = useState('Select...');
  const [recNotes, setRecNotes] = useState('');
  const [evidenceVerifStatus, setEvidenceVerifStatus] = useState('Select...');
  const [missingReason, setMissingReason] = useState('Select...');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // Step 9: Farm Hygiene & Storage
  const [storageStatus, setStorageStatus] = useState('Select...');
  const [hygieneStatus, setHygieneStatus] = useState('Select...');
  const [wasteStatus, setWasteStatus] = useState('Select...');
  const [hygieneNotes, setHygieneNotes] = useState('');

  // Step 10: Farmer Admin Assessment (M5-S04L)
  const [overallAssessment, setOverallAssessment] = useState('Select...');
  const [strengthsObserved, setStrengthsObserved] = useState('');
  const [followupRequired, setFollowupRequired] = useState('Select...');
  const [recommendation, setRecommendation] = useState('Select...');
  const [supportingRemarks, setSupportingRemarks] = useState('');

  // Step 11: Add External Audit (M5-S04M)
  const [extOrg, setExtOrg] = useState('');
  const [extAuditDate, setExtAuditDate] = useState('');
  const [extReportExpiry, setExtReportExpiry] = useState('');
  const [extNextAuditDate, setExtNextAuditDate] = useState('');
  const [extRemarks, setExtRemarks] = useState('');

  // Step 12: Farmer Rating (M5-S04M Farmer Rating)
  const [expandedRatingCat, setExpandedRatingCat] = useState<string | null>(null);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});

  const ratedCount = Object.keys(categoryScores).length;
  const totalScore = Object.values(categoryScores).reduce((sum, s) => sum + s, 0);

  const stepTitles: Record<number, string> = {
    1: 'Farmer Contact Verification',
    2: 'FMB & Land Verification',
    3: 'Farm Details Verification',
    4: 'Certification Verification',
    5: 'Soil Testing & Soil Report',
    6: 'Water Sources & Water pH Testing',
    7: 'Farm Practices Checklist',
    8: 'Documents & Findings',
    9: 'Farm Hygiene & Storage',
    10: 'Farmer Admin Assessment',
    11: 'Add External Audit',
    12: 'Farmer Rating',
  };

  const pillLabel = step === 11 ? 'STEP 11' : step === 12 ? 'STEP 12' : `${step}/10`;
  const currentTitle = stepTitles[step] || 'Inspection Step';

  const handleSavePress = () => {
    setSaveModalVisible(true);
  };

  const handleConfirmSave = () => {
    setSaveModalVisible(false);
    onSave();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header in Brand Theme ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{currentTitle}</Text>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>{pillLabel}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitleText}>
              {auditId} · {farmerName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        key={step}
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── STEP 1: Farmer Contact Verification ─── */}
        {step === 1 && (
          <View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Farmer Name</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>{farmerName}</Text></View>
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Farmer ID</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>{farmerId}</Text></View>
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} />
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput style={styles.textInput} value={address} onChangeText={setAddress} multiline />
            </View>
            <SelectBox
              label="Preferred Contact Method"
              value={contactMethod}
              onSelect={setContactMethod}
              options={['Phone Call', 'In Person', 'SMS / WhatsApp', 'Email']}
            />
            <SelectBox
              label="Contact Verification Status"
              required
              value={contactVerifStatus}
              onSelect={setContactVerifStatus}
              options={['Verified', 'Pending OTP', 'Unreachable', 'Mismatch']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Additional Notes</Text>
              <TextInput style={styles.textareaInput} value={contactNotes} onChangeText={setContactNotes} multiline />
            </View>
          </View>
        )}

        {/* ─── STEP 2: FMB & Land Verification (M5-S04D) ─── */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionHeaderTitle}>FMB Sketch</Text>
            <View style={styles.whiteCardRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileTextIcon size={18} color={adminColors.ink} />
                <Text style={styles.whiteCardTitle}>FMB Sketch</Text>
              </View>
              <TouchableOpacity
                style={styles.outlinePillBtn}
                onPress={() => Alert.alert('FMB Sketch', 'Displaying cadastral survey map.')}
                activeOpacity={0.7}
              >
                <Text style={styles.outlinePillBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formFieldGroup, { marginTop: 14 }]}>
              <Text style={styles.formLabel}>Upload / replace FMB sketch</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload Document', 'FMB sketch file selected.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Survey Reference Number</Text>
              <TextInput
                style={styles.textInput}
                value={surveyRef}
                onChangeText={setSurveyRef}
                placeholder="Enter survey reference..."
                placeholderTextColor={adminColors.placeholder}
              />
              <Text style={styles.helperText}>Not on record — enter it from the document.</Text>
            </View>

            <SelectBox
              label="FMB Document Available"
              required
              value={fmbAvailable}
              onSelect={setFmbAvailable}
              options={['Select...', 'Available', 'Not Available', 'Expired']}
            />
            <SelectBox
              label="Document Legibility"
              value={docLegibility}
              onSelect={setDocLegibility}
              options={['Select...', 'Legible', 'Partially Legible', 'Illegible']}
            />
            <SelectBox
              label="Boundary Verification"
              value={boundaryVerif}
              onSelect={setBoundaryVerif}
              options={['Select...', 'Verified with survey stones', 'Disputed', 'Pending Survey']}
            />
            <SelectBox
              label="Farm Location Verification"
              value={farmLocVerif}
              onSelect={setFarmLocVerif}
              options={['Select...', 'Matches GPS on record', 'Slight deviation', 'Mismatch']}
            />
            <SelectBox
              label="Plot / Zone Mapping Status"
              value={plotZoneMapping}
              onSelect={setPlotZoneMapping}
              options={['Select...', 'Mapped', 'Unmapped', 'Under Review']}
            />
            <SelectBox
              label="Land Boundary Status"
              value={landBoundaryStatus}
              onSelect={setLandBoundaryStatus}
              options={['Select...', 'No encroachment observed', 'Encroachment reported', 'Boundary dispute']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={step2Notes}
                onChangeText={setStep2Notes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Supporting Evidence</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload Document', 'Supporting file selected.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP 3: Farm Details Verification (M5-S04E) ─── */}
        {step === 3 && (
          <View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Farm Name 🔒</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>Ramesh Organic Farm</Text></View>
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Farm ID 🔒</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>FRM-00124-01</Text></View>
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Farm Location 🔒</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>Coonoor, Nilgiris</Text></View>
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>GPS Coordinates 🔒</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>11.3530° N, 76.7959° E</Text></View>
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Farm Area 🔒</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>2.4 acres</Text></View>
            </View>

            <SelectBox
              label="Farming Type"
              value={farmingType}
              onSelect={setFarmingType}
              options={['Select...', 'Organic', 'Conventional', 'Natural Farming', 'In Conversion']}
              helperText="Recorded on profile: Organic"
            />
            <SelectBox
              label="Crops Grown"
              value={cropsGrown}
              onSelect={setCropsGrown}
              iconType="sliders"
              options={['Select...', 'Carrots, Potatoes', 'Tea, Spices', 'Cabbage, Broccoli', 'Mixed Vegetables']}
            />
            <SelectBox
              label="Plot / Zone"
              value={plotZone}
              onSelect={setPlotZone}
              iconType="search"
              options={['Select...', 'Zone A - Plot 1', 'Zone A - Plot 2', 'Zone B - Hill Plot']}
            />
            <SelectBox
              label="Water Source"
              value={farmWaterSource}
              onSelect={setFarmWaterSource}
              iconType="search"
              options={['Select...', 'Open Well 1', 'Borewell 2', 'Stream / Canal', 'Rainwater Tank']}
            />
            <SelectBox
              label="Irrigation Type"
              value={irrigationType}
              onSelect={setIrrigationType}
              options={['Select...', 'Drip Irrigation', 'Sprinkler', 'Flood', 'Rainfed']}
            />
            <SelectBox
              label="Farm Records Availability"
              value={farmRecordsAvail}
              onSelect={setFarmRecordsAvail}
              options={['Select...', 'Available & Complete', 'Partially Available', 'Not Maintained']}
            />
            <SelectBox
              label="Farm Details Verification"
              required
              value={farmDetailsVerif}
              onSelect={setFarmDetailsVerif}
              options={['Select...', 'Fully Verified', 'Discrepancy Noted', 'Pending Documents']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={step3Notes}
                onChangeText={setStep3Notes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>
        )}

        {/* ─── STEP 4: Certification Verification (M5-S04F) ─── */}
        {step === 4 && (
          <View>
            {/* Accordion 1: PGS Organic */}
            <View style={styles.accordionCard}>
              <TouchableOpacity
                style={styles.accordionHeaderRow}
                onPress={() => setPgsOpen(!pgsOpen)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.accordionTitle}>PGS Organic</Text>
                  <Text style={styles.accordionSub}>certified 2026-06-12 · renewal 2027-06-12</Text>
                </View>
                {pgsOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
              </TouchableOpacity>

              {pgsOpen && (
                <View style={styles.accordionBody}>
                  <Text style={styles.noticeText}>
                    Recorded on profile: Active · certified 2026-06-12 · renewal 2027-06-12.{'\n'}
                    The inspection does not declare a certificate valid or expired.
                  </Text>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Certification Type 🔒</Text>
                    <View style={styles.lockedBox}><Text style={styles.lockedText}>PGS Organic</Text></View>
                  </View>

                  <SelectBox
                    label="Certification Status"
                    value={pgsStatus}
                    onSelect={setPgsStatus}
                    options={['Select...', 'Active', 'Suspended', 'Expired', 'Under Audit']}
                  />

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Certificate Document</Text>
                    <View style={styles.whiteCardRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FileTextIcon size={18} color={adminColors.ink} />
                        <Text style={styles.whiteCardTitle}>PGS Organic Certificate</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.outlinePillBtn}
                        onPress={() => Alert.alert('Certificate', 'Showing PGS Organic Certificate document.')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlinePillBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Upload certificate</Text>
                    <TouchableOpacity
                      style={styles.dashedUploadBox}
                      onPress={() => Alert.alert('Upload Document', 'Certificate file attached.')}
                      activeOpacity={0.7}
                    >
                      <UploadFileIcon size={18} color={adminColors.brand} />
                      <Text style={styles.dashedUploadText}>Upload file</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Certified Date</Text>
                    <View style={styles.selectInput}>
                      <TextInput
                        style={styles.dateTextInput}
                        value={pgsCertDate}
                        onChangeText={setPgsCertDate}
                        placeholder="dd - mm - yyyy"
                        placeholderTextColor={adminColors.placeholder}
                      />
                      <CalendarIcon size={18} />
                    </View>
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Renewal / Expiry Date</Text>
                    <View style={styles.selectInput}>
                      <TextInput
                        style={styles.dateTextInput}
                        value={pgsExpiryDate}
                        onChangeText={setPgsExpiryDate}
                        placeholder="dd - mm - yyyy"
                        placeholderTextColor={adminColors.placeholder}
                      />
                      <CalendarIcon size={18} />
                    </View>
                  </View>

                  <SelectBox
                    label="Document Verification"
                    required
                    value={pgsDocVerif}
                    onSelect={setPgsDocVerif}
                    options={['Select...', 'Verified Valid', 'Tampered / Mismatch', 'Pending Issuance']}
                  />

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Verification Notes</Text>
                    <TextInput
                      style={styles.textareaInput}
                      value={pgsNotes}
                      onChangeText={setPgsNotes}
                      multiline
                      placeholder="Enter verification notes..."
                      placeholderTextColor={adminColors.placeholder}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 2: NPOP */}
            <View style={[styles.accordionCard, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.accordionHeaderRow}
                onPress={() => setNpopOpen(!npopOpen)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.accordionTitle}>NPOP</Text>
                  <Text style={styles.accordionSub}>certified 2025-03-01 · renewal 2027-03-01</Text>
                </View>
                {npopOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
              </TouchableOpacity>

              {npopOpen && (
                <View style={styles.accordionBody}>
                  <Text style={styles.noticeText}>
                    Recorded on profile: Active · certified 2025-03-01 · renewal 2027-03-01.{'\n'}
                    The inspection does not declare a certificate valid or expired.
                  </Text>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Certification Type 🔒</Text>
                    <View style={styles.lockedBox}><Text style={styles.lockedText}>NPOP</Text></View>
                  </View>

                  <SelectBox
                    label="Certification Status"
                    value={npopStatus}
                    onSelect={setNpopStatus}
                    options={['Select...', 'Active', 'Suspended', 'Expired', 'Under Audit']}
                  />

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Certificate Document</Text>
                    <View style={styles.whiteCardRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FileTextIcon size={18} color={adminColors.ink} />
                        <Text style={styles.whiteCardTitle}>NPOP Certificate</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.outlinePillBtn}
                        onPress={() => Alert.alert('Certificate', 'Showing NPOP Certificate document.')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlinePillBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Upload certificate</Text>
                    <TouchableOpacity
                      style={styles.dashedUploadBox}
                      onPress={() => Alert.alert('Upload Document', 'NPOP certificate file attached.')}
                      activeOpacity={0.7}
                    >
                      <UploadFileIcon size={18} color={adminColors.brand} />
                      <Text style={styles.dashedUploadText}>Upload file</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Certified Date</Text>
                    <View style={styles.selectInput}>
                      <TextInput
                        style={styles.dateTextInput}
                        value={npopCertDate}
                        onChangeText={setNpopCertDate}
                        placeholder="dd - mm - yyyy"
                        placeholderTextColor={adminColors.placeholder}
                      />
                      <CalendarIcon size={18} />
                    </View>
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Renewal / Expiry Date</Text>
                    <View style={styles.selectInput}>
                      <TextInput
                        style={styles.dateTextInput}
                        value={npopExpiryDate}
                        onChangeText={setNpopExpiryDate}
                        placeholder="dd - mm - yyyy"
                        placeholderTextColor={adminColors.placeholder}
                      />
                      <CalendarIcon size={18} />
                    </View>
                  </View>

                  <SelectBox
                    label="Document Verification"
                    required
                    value={npopDocVerif}
                    onSelect={setNpopDocVerif}
                    options={['Select...', 'Verified Valid', 'Tampered / Mismatch', 'Pending Issuance']}
                  />

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Verification Notes</Text>
                    <TextInput
                      style={styles.textareaInput}
                      value={npopNotes}
                      onChangeText={setNpopNotes}
                      multiline
                      placeholder="Enter verification notes..."
                      placeholderTextColor={adminColors.placeholder}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── STEP 5: Soil Testing & Soil Report (M5-S04G) ─── */}
        {step === 5 && (
          <View>
            <SelectBox
              label="Soil Report Availability"
              required
              value={soilReportAvail}
              onSelect={setSoilReportAvail}
              options={['Select...', 'Available', 'Not Available', 'Sample Sent to Lab']}
            />
          </View>
        )}

        {/* ─── STEP 6: Water Sources & Water pH Testing (M5-S04H) ─── */}
        {step === 6 && (
          <View>
            {waterSourcesList.map((ws, index) => (
              <View key={`water-source-${index}`} style={styles.waterSourceSection}>
                <View style={styles.waterSourceHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>WATER SOURCE {index + 1}</Text>
                  {waterSourcesList.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveWaterSource(index)}
                      style={styles.removeSourceBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeSourceBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <SelectBox
                  label="Water Source"
                  value={ws.source}
                  onSelect={(val) => updateWaterSource(index, 'source', val)}
                  iconType="search"
                  options={['Select...', 'Open Well 1', 'Borewell 1', 'Creek / Stream']}
                />

                <SelectBox
                  label="Water Source Type"
                  value={ws.sourceType}
                  onSelect={(val) => updateWaterSource(index, 'sourceType', val)}
                  options={['Select...', 'Open Well', 'Borewell', 'Rainwater Pond', 'Municipal']}
                />

                <View style={styles.formFieldGroup}>
                  <Text style={styles.formLabel}>Water Source Location</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ws.location}
                    onChangeText={(val) => updateWaterSource(index, 'location', val)}
                    placeholder="Enter location..."
                    placeholderTextColor={adminColors.placeholder}
                  />
                  <Text style={styles.helperText}>
                    No location is recorded for this source — enter it if you are authorized to.
                  </Text>
                </View>

                <SelectBox
                  label="Water Use Purpose"
                  value={ws.purpose}
                  onSelect={(val) => updateWaterSource(index, 'purpose', val)}
                  iconType="sliders"
                  options={['Select...', 'Irrigation Only', 'Irrigation & Washing', 'Livestock & Crops']}
                />

                <SelectBox
                  label="Water Source Verification"
                  value={ws.verification}
                  onSelect={(val) => updateWaterSource(index, 'verification', val)}
                  options={['Select...', 'Verified Functional', 'Dry / Inactive', 'Contaminated']}
                />

                <SelectBox
                  label="Water Source Condition"
                  value={ws.condition}
                  onSelect={(val) => updateWaterSource(index, 'condition', val)}
                  options={['Select...', 'Clean / Good', 'Turbid / Needs Filter', 'Stagnant']}
                />

                <View style={styles.formFieldGroup}>
                  <Text style={styles.formLabel}>Test Date</Text>
                  <View style={styles.selectInput}>
                    <TextInput
                      style={styles.dateTextInput}
                      value={ws.testDate}
                      onChangeText={(val) => updateWaterSource(index, 'testDate', val)}
                      placeholder="dd - mm - yyyy"
                      placeholderTextColor={adminColors.placeholder}
                    />
                    <CalendarIcon size={18} />
                  </View>
                </View>

                <SelectBox
                  label="Testing Method"
                  value={ws.testingMethod}
                  onSelect={(val) => updateWaterSource(index, 'testingMethod', val)}
                  options={['Select...', 'Digital pH Meter', 'Chemical Strip', 'Certified Lab Report']}
                />
              </View>
            ))}

            {/* + Add Water Source Button */}
            <TouchableOpacity
              style={styles.addWaterSourceBtn}
              onPress={handleAddWaterSource}
              activeOpacity={0.7}
            >
              <Text style={styles.addWaterSourceBtnText}>+ Add Water Source</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 7: Farm Practices Checklist (M5-S04I) ─── */}
        {step === 7 && (
          <View>
            {/* Section 1: FARM DOCUMENTATION */}
            <Text style={styles.sectionHeaderTitle}>FARM DOCUMENTATION</Text>
            <SelectBox
              label="Inspection Result"
              required
              value={farmDocResult}
              onSelect={setFarmDocResult}
              options={['Select...', 'Compliant', 'Non-compliant', 'Needs Improvement']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={farmDocNotes}
                onChangeText={setFarmDocNotes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <SelectBox
              label="Evidence (existing)"
              value={farmDocEvidence}
              onSelect={setFarmDocEvidence}
              iconType="search"
              options={['Select...', 'Farm Logbook 2026', 'Seed Purchase Invoices', 'Pest Record Sheet']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Upload evidence</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload', 'Evidence file selected.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: ORGANIC PRACTICES */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>ORGANIC PRACTICES</Text>
            <SelectBox
              label="Inspection Result"
              required
              value={organicResult}
              onSelect={setOrganicResult}
              options={['Select...', 'Compliant', 'Non-compliant', 'Needs Improvement']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={organicNotes}
                onChangeText={setOrganicNotes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <SelectBox
              label="Evidence (existing)"
              value={organicEvidence}
              onSelect={setOrganicEvidence}
              iconType="search"
              options={['Select...', 'Compost Pit Photos', 'Neem Cake Stock Record']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Upload evidence</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload', 'Evidence file selected.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: CROP MANAGEMENT */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>CROP MANAGEMENT</Text>
            <SelectBox
              label="Inspection Result"
              required
              value={cropMgmtResult}
              onSelect={setCropMgmtResult}
              options={['Select...', 'Compliant', 'Non-compliant', 'Needs Improvement']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={cropMgmtNotes}
                onChangeText={setCropMgmtNotes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <SelectBox
              label="Evidence (existing)"
              value={cropMgmtEvidence}
              onSelect={setCropMgmtEvidence}
              iconType="search"
              options={['Select...', 'Rotation Schedule Map', 'Intercropping Ledger']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Upload evidence</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload', 'Evidence file selected.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: INPUT USAGE */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>INPUT USAGE</Text>
            <SelectBox
              label="Inspection Result"
              required
              value={inputUsageResult}
              onSelect={setInputUsageResult}
              options={['Select...', 'Compliant', 'Non-compliant', 'Needs Improvement']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={inputUsageNotes}
                onChangeText={setInputUsageNotes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <SelectBox
              label="Evidence (existing)"
              value={inputUsageEvidence}
              onSelect={setInputUsageEvidence}
              iconType="search"
              options={['Select...', 'Panchagavya Batch Record', 'Pheromone Trap Register']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Upload evidence</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload', 'Evidence file selected.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP 8: Documents & Findings (M5-S04J) ─── */}
        {step === 8 && (
          <View>
            <Text style={styles.sectionHeaderTitle}>Existing documents & evidence</Text>

            {/* Document 1: FMB Sketch */}
            <View style={styles.docRowCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FileTextIcon size={20} color={adminColors.ink} />
                <View>
                  <Text style={styles.docRowTitle}>FMB Sketch</Text>
                  <Text style={styles.docRowSub}>0.1 MB</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.outlinePillBtn}
                  onPress={() => Alert.alert('View', 'Viewing FMB Sketch.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlinePillBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlinePillBtn}
                  onPress={() => Alert.alert('Download', 'Downloading FMB Sketch.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlinePillBtnText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document 2: PGS Organic Certificate */}
            <View style={[styles.docRowCard, { marginTop: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FileTextIcon size={20} color={adminColors.ink} />
                <View>
                  <Text style={styles.docRowTitle}>PGS Organic Certificate</Text>
                  <Text style={styles.docRowSub}>0.1 MB</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.outlinePillBtn}
                  onPress={() => Alert.alert('View', 'Viewing PGS Organic Certificate.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlinePillBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlinePillBtn}
                  onPress={() => Alert.alert('Download', 'Downloading PGS Organic Certificate.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlinePillBtnText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionHeaderTitle, { marginTop: 20 }]}>Add evidence</Text>
            <SelectBox
              label="Evidence Category"
              required
              value={evidenceCat}
              onSelect={setEvidenceCat}
              options={['Select...', 'Land Documents', 'Organic Certification', 'Soil & Water', 'Pest Management']}
            />
            <SelectBox
              label="Related Inspection Section"
              required
              value={relatedSection}
              onSelect={setRelatedSection}
              iconType="search"
              options={['Select...', '1 - Farmer Contact', '2 - FMB & Land', '3 - Farm Details', '4 - Certification']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Observation <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.textareaInput}
                value={obsText}
                onChangeText={setObsText}
                multiline
                placeholder="Enter observation..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <SelectBox
              label="Follow-up Recommendation"
              value={followupRec}
              onSelect={setFollowupRec}
              options={['Select...', 'None Required', 'Submit Corrected Document', 'Re-inspect in 30 Days']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Recommendation Notes (optional)</Text>
              <TextInput
                style={styles.textareaInput}
                value={recNotes}
                onChangeText={setRecNotes}
                multiline
                placeholder="Enter recommendation notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Evidence File</Text>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => Alert.alert('Upload Document', 'File attached.')}
                activeOpacity={0.7}
              >
                <UploadFileIcon size={18} color={adminColors.brand} />
                <Text style={styles.dashedUploadText}>Upload file</Text>
              </TouchableOpacity>
            </View>
            <SelectBox
              label="Evidence Verification Status"
              value={evidenceVerifStatus}
              onSelect={setEvidenceVerifStatus}
              options={['Select...', 'Verified Valid', 'Pending Verification', 'Rejected']}
            />
            <SelectBox
              label="Missing Document Reason"
              required
              value={missingReason}
              onSelect={setMissingReason}
              options={['Select...', 'Not Applicable (Doc Present)', 'Farmer Lost Original', 'Pending Govt Issuance']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={evidenceNotes}
                onChangeText={setEvidenceNotes}
                multiline
                placeholder="Enter notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <TouchableOpacity
              style={styles.addEvidenceBtn}
              onPress={() => Alert.alert('Add Evidence', 'New evidence record added.')}
              activeOpacity={0.75}
            >
              <Text style={styles.addEvidenceBtnText}>+ Add Evidence</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 9: Farm Hygiene & Storage ─── */}
        {step === 9 && (
          <View>
            <SelectBox
              label="Produce Storage Facility"
              value={storageStatus}
              onSelect={setStorageStatus}
              options={['Select...', 'Dedicated Clean Room', 'Crates / Pallets on floor', 'Shared Shed']}
            />
            <SelectBox
              label="Sanitization & Equipment Status"
              value={hygieneStatus}
              onSelect={setHygieneStatus}
              options={['Select...', 'Excellent / Sanitized', 'Good', 'Needs Cleaning']}
            />
            <SelectBox
              label="Waste Disposal & Composting"
              value={wasteStatus}
              onSelect={setWasteStatus}
              options={['Select...', 'On-farm Compost Pit', 'Segregated & Recycled', 'Open Dumping']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.textareaInput}
                value={hygieneNotes}
                onChangeText={setHygieneNotes}
                multiline
                placeholder="Enter hygiene notes..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>
        )}

        {/* ─── STEP 10: Farmer Admin Assessment (M5-S04L) ─── */}
        {step === 10 && (
          <View>
            <SelectBox
              label="Overall Assessment"
              required
              value={overallAssessment}
              onSelect={setOverallAssessment}
              options={['Select...', 'Compliant', 'Minor Non-Compliances', 'Major Non-Compliances', 'Rejected']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Strengths Observed</Text>
              <TextInput
                style={styles.textareaInput}
                value={strengthsObserved}
                onChangeText={setStrengthsObserved}
                multiline
                placeholder="Enter strengths..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <SelectBox
              label="Follow-up Required"
              value={followupRequired}
              onSelect={setFollowupRequired}
              options={['Select...', 'No', 'Yes - 15 Days', 'Yes - 30 Days', 'Immediate Action']}
            />
            <SelectBox
              label="Recommendation"
              value={recommendation}
              onSelect={setRecommendation}
              options={['Select...', 'Approved for Continued Certification', 'Conditional Approval', 'Audit Escalation']}
            />
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Supporting Remarks</Text>
              <TextInput
                style={styles.textareaInput}
                value={supportingRemarks}
                onChangeText={setSupportingRemarks}
                multiline
                placeholder="Enter supporting remarks..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Official Audit Score 🔒</Text>
              <View style={styles.lockedBox}><Text style={styles.lockedText}>Not scored yet</Text></View>
            </View>
          </View>
        )}

        {/* ─── STEP 11: Add External Audit (M5-S04M) ─── */}
        {step === 11 && (
          <View>
            {/* Section 1: Farmer & Farm Details */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>Farmer & Farm Details</Text>
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Farmer ID</Text>
                  <Text style={styles.metaVal}>{farmerId}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Farmer Name</Text>
                  <Text style={styles.metaVal}>{farmerName}</Text>
                </View>
              </View>
              <View style={[styles.threeColRow, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Zone</Text>
                  <Text style={styles.metaVal}>Coonoor</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Farms</Text>
                  <Text style={styles.metaVal}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Total Area</Text>
                  <Text style={styles.metaVal}>4.25 Acre</Text>
                </View>
              </View>
            </View>

            {/* Section 2: External Audit Information */}
            <View style={[styles.cardBox, { marginTop: 14 }]}>
              <Text style={styles.cardHeaderTitle}>External Audit Information</Text>
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Issuing Organization <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={extOrg}
                  onChangeText={setExtOrg}
                  placeholder="Enter organization name"
                  placeholderTextColor={adminColors.placeholder}
                />
              </View>
              <View style={styles.twoColRow}>
                <View style={[styles.formFieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Audit Date <Text style={styles.asterisk}>*</Text></Text>
                  <View style={styles.selectInput}>
                    <TextInput
                      style={styles.dateTextInput}
                      value={extAuditDate}
                      onChangeText={setExtAuditDate}
                      placeholder="Select audit date"
                      placeholderTextColor={adminColors.placeholder}
                    />
                    <CalendarIcon size={18} />
                  </View>
                </View>
                <View style={[styles.formFieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Report Expiry Date <Text style={styles.asterisk}>*</Text></Text>
                  <View style={styles.selectInput}>
                    <TextInput
                      style={styles.dateTextInput}
                      value={extReportExpiry}
                      onChangeText={setExtReportExpiry}
                      placeholder="Select expiry date"
                      placeholderTextColor={adminColors.placeholder}
                    />
                    <CalendarIcon size={18} />
                  </View>
                </View>
              </View>
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Next Audit Date <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.selectInput}>
                  <TextInput
                    style={styles.dateTextInput}
                    value={extNextAuditDate}
                    onChangeText={setExtNextAuditDate}
                    placeholder="Select next audit date"
                    placeholderTextColor={adminColors.placeholder}
                  />
                  <CalendarIcon size={18} />
                </View>
              </View>
            </View>

            {/* Section 3: Audit Report Upload */}
            <View style={[styles.cardBox, { marginTop: 14 }]}>
              <Text style={styles.cardHeaderTitle}>Audit Report Upload</Text>
              <TouchableOpacity
                style={styles.dashedUploadBoxLarge}
                onPress={() => Alert.alert('Upload Document', 'External audit PDF selected.')}
                activeOpacity={0.7}
              >
                <FileTextIcon size={24} color={adminColors.brand} />
                <Text style={styles.dashedUploadTitle}>Tap to upload audit report</Text>
                <Text style={styles.dashedUploadSub}>PDF, JPG, PNG (Max 10 MB)</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: Additional Details */}
            <View style={[styles.cardBox, { marginTop: 14 }]}>
              <Text style={styles.cardHeaderTitle}>Additional Details</Text>
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Remarks / Notes</Text>
                <TextInput
                  style={[styles.textareaInput, { minHeight: 90 }]}
                  value={extRemarks}
                  onChangeText={setExtRemarks}
                  placeholder="Enter any remarks or notes (optional)"
                  placeholderTextColor={adminColors.placeholder}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.charCountText}>{extRemarks.length}/500</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── STEP 12: Farmer Rating (M5-S04M Farmer Rating) ─── */}
        {step === 12 && (
          <View>
            {/* Top Breadcrumb / Details Box */}
            <View style={styles.cardBox}>
              <Text style={styles.breadcrumbSub}>Audit Inspection → Farmer Rating</Text>
              <View style={[styles.twoColRow, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Audit</Text>
                  <Text style={styles.metaVal}>{auditId}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Audit Date</Text>
                  <Text style={styles.metaVal}>15 Oct 2026</Text>
                </View>
              </View>
              <View style={[styles.twoColRow, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Farmer</Text>
                  <Text style={styles.metaVal}>{farmerName}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Farmer ID</Text>
                  <Text style={styles.metaVal}>FMR-00124</Text>
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.metaLabel}>Farm</Text>
                <Text style={styles.metaVal}>Ramesh Organic Farm · Coonoor, Nilgiris</Text>
              </View>
            </View>

            {/* Overall Rating Box */}
            <View style={[styles.ratingOverviewBox, { marginTop: 14 }]}>
              <Text style={styles.overallRatingLabel}>OVERALL RATING</Text>
              <Text style={styles.ratingPendingTitle}>
                {ratedCount === 10 ? `${totalScore} / 100` : ratedCount > 0 ? `${totalScore} / 100 (in progress)` : 'Pending'}
              </Text>
              <Text style={styles.ratingPendingSub}>
                {ratedCount} of 10 categories rated — the overall score appears once all 10 are rated.{'\n'}
                Previous overall: 80 / 100.
              </Text>
              <Text style={styles.ratingFootnote}>
                Overall = the sum of the category scores; no weights, penalties or thresholds are applied.
              </Text>
            </View>

            {/* 10 Rating Categories */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>Rating categories</Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              {[
                { name: 'Certification & Compliance', icon: <ShieldCheckIcon /> },
                { name: 'Soil & Land Management', icon: <DiamondIcon /> },
                { name: 'Farming Practices', icon: <TractorIcon /> },
                { name: 'Environmental Sustainability', icon: <LeafIcon /> },
                { name: 'Produce Quality & Yield', icon: <AppleIcon /> },
                { name: 'Traceability & Transparency', icon: <BarcodeIcon /> },
                { name: 'Social & Labor Practices', icon: <UsersIcon /> },
                { name: 'Financial & Operational', icon: <BankIcon /> },
                { name: 'Market & Buyer Relations', icon: <StoreIcon /> },
                { name: 'Innovation & Improvement', icon: <LightbulbIcon /> },
              ].map((cat) => {
                const isExpanded = expandedRatingCat === cat.name;
                const score = categoryScores[cat.name];
                const isAssessed = typeof score === 'number';
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={styles.ratingCategoryCard}
                    onPress={() => setExpandedRatingCat(isExpanded ? null : cat.name)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.ratingCategoryRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={styles.catIconWrap}>{cat.icon}</View>
                        <Text style={styles.ratingCatName} numberOfLines={1}>{cat.name}</Text>
                      </View>
                      <View style={[styles.ratingNotAssessedBadge, isAssessed && { backgroundColor: adminColors.brandTint }]}>
                        <Text style={[styles.ratingNotAssessedText, isAssessed && { color: adminColors.brand, fontWeight: '800' }]}>
                          {isAssessed ? `${score} / 10` : 'Not assessed'}
                        </Text>
                        {isExpanded ? <ChevronUpIcon size={14} color={adminColors.muted} /> : <ChevronDownIcon size={14} color={adminColors.muted} />}
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={styles.ratingSubCard}>
                        <Text style={styles.ratingSubPrompt}>Select Category Score (1 - 10)</Text>
                        <View style={styles.scoreRow}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                            <TouchableOpacity
                              key={s}
                              style={[
                                styles.scoreBtn,
                                score === s && styles.scoreBtnActive,
                              ]}
                              onPress={() => {
                                setCategoryScores((prev) => ({ ...prev, [cat.name]: s }));
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.scoreBtnText,
                                score === s && styles.scoreBtnTextActive,
                              ]}>
                                {s}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Save Action in Brand Theme ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSavePress}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{step === 12 ? 'Save Draft' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Section Saved Popup Modal in Admin Theme ─── */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.savedModalOverlay}>
          <View style={styles.savedModalCard}>
            <Text style={styles.savedModalTitle}>Section Saved</Text>
            <Text style={styles.savedModalMessage}>Step {step} has been saved.</Text>
            <TouchableOpacity
              style={styles.savedModalOkBtn}
              onPress={handleConfirmSave}
              activeOpacity={0.8}
            >
              <Text style={styles.savedModalOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Theme-Bound Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
    paddingRight: 8,
  },
  stepPill: {
    backgroundColor: adminOverlay.whitePill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.full,
  },
  stepPillText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitleText: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    padding: adminSpacing.card,
  },

  // Field Groups & Inputs
  formFieldGroup: {
    marginBottom: adminSpacing.sm,
  },
  formLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 6,
  },
  asterisk: {
    color: adminColors.brand,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: adminColors.ink,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  textareaInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: adminColors.ink,
    textAlignVertical: 'top',
  },
  lockedBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  lockedText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  selectInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  selectPlaceholder: {
    color: adminColors.placeholder,
  },
  helperText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 5,
  },
  charCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'right',
    marginTop: 4,
  },

  // Headings & Cards
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: 10,
  },
  cardBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  cardHeaderTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 12,
  },
  breadcrumbSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontWeight: '600',
  },

  // Two & Three Column Grids
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threeColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  metaVal: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Upload Box
  dashedUploadBox: {
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashedUploadText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  dashedUploadBoxLarge: {
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedUploadTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 8,
  },
  dashedUploadSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },

  // White Card Row
  whiteCardRow: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whiteCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  outlinePillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  outlinePillBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brand,
  },

  // Accordion (PGS Organic / NPOP)
  accordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  accordionHeaderRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  accordionSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 14,
  },
  noticeText: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 14,
  },

  // Document rows (Step 8)
  docRowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docRowTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  docRowSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 1,
  },
  addEvidenceBtn: {
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addEvidenceBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  // Step 6 Multi Water Source Styles
  waterSourceSection: {
    marginBottom: 8,
  },
  waterSourceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 4,
  },
  removeSourceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.danger.bg,
  },
  removeSourceBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  addWaterSourceBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  addWaterSourceBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.brand,
  },

  // Step 12 Rating
  ratingOverviewBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.card,
  },
  overallRatingLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  ratingPendingTitle: {
    ...adminType.title,
    fontSize: 22,
    color: adminColors.ink,
    marginTop: 4,
  },
  ratingPendingSub: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 6,
  },
  ratingFootnote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  ratingCategoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ratingCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingCatName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  ratingNotAssessedBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: adminRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingNotAssessedText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  ratingSubCard: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  ratingSubPrompt: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  scoreBtn: {
    width: '18%',
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: adminRadius.sm,
  },
  scoreBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  scoreBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  scoreBtnTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },

  // Fixed Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  saveBtn: {
    backgroundColor: adminColors.brand,
    height: 50,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  saveBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  // Generic Select Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 18,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 12,
  },
  modalOptionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalOptionTextActive: {
    fontWeight: '800',
    color: adminColors.brand,
  },

  // Saved Section Confirmation Modal
  savedModalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  savedModalCard: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  savedModalTitle: {
    ...adminType.title,
    fontSize: 18,
    color: adminColors.ink,
    marginBottom: 8,
  },
  savedModalMessage: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 20,
  },
  savedModalOkBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  savedModalOkText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.success.text,
  },
});
