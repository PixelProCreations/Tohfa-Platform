import React, { useState } from 'react';
import {
  Alert,
  Pressable,
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
import { adminColors } from '../../theme';
import { ProduceQualityVerificationScreen } from './ProduceQualityVerificationScreen';
import { ProduceGradeCheckScreen } from './ProduceGradeCheckScreen';
import { ProduceDamageInspectionScreen } from './ProduceDamageInspectionScreen';
import { ProduceFairPriceCheckScreen } from './ProduceFairPriceCheckScreen';
import { ProduceFinalEligibilityDecisionScreen } from './ProduceFinalEligibilityDecisionScreen';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { FarmerProfileDetailScreen } from './FarmerProfileDetailScreen';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 — App canvas soft cream
  card: adminColors.card, // #FFFFFF — Card surface
  border: adminColors.border, // #EEDCD3 — Border stroke
  borderLight: '#F3ECE4',
  borderDashed: '#D1D5DB',

  // Typography
  titleRust: '#A63D18', // Warm rust
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink, // Dark ink
  muted: adminColors.muted, // Secondary gray
  labelMuted: '#78716C',

  // Buttons & Actions
  orangeBtn: adminColors.brand,
  disabledBtnBg: '#F8D8CE', // Soft muted peach for disabled Submit Verification
  disabledBtnText: 'rgba(255, 255, 255, 0.85)',

  // Badges
  notCompletedBg: '#F3F4F6',
  notCompletedText: '#4B5563',
  verifiedText: '#15803D',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = THEME.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 18, color = THEME.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadDocumentIcon({ size = 20, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Document outline with folded top-right corner */}
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Upload Arrow with base bar (Image 1 Left Exact) */}
      <Path
        d="M12 15V8M9 11l3-3 3 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="9"
        y1="16"
        x2="15"
        y2="16"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CornerGripIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Line x1="11" y1="3" x2="3" y2="11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="7" x2="7" y2="11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Step 2 Quality Checks Config (Exact from Mockups S03B) ───────────────────
interface QualityCheckConfig {
  id: string;
  title: string;
  standard: string;
  leftLabel: string;
  rightLabel: string;
}

const QUALITY_CHECKS_CONFIG: QualityCheckConfig[] = [
  {
    id: 'freshness',
    title: 'Freshness',
    standard: 'Standard: Fresh, no wilting',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'colour',
    title: 'Colour',
    standard: 'Standard: Uniform ripe colour',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'size_appearance',
    title: 'Size and Appearance',
    standard: 'Standard: Even size, no blemishes',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'maturity',
    title: 'Maturity',
    standard: 'Standard: Correct maturity for the grade',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'cleanliness',
    title: 'Cleanliness',
    standard: 'Standard: Free of soil and residue',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'foreign_matter',
    title: 'Foreign Matter',
    standard: 'Standard: Within allowed limit',
    leftLabel: 'Within Allowed Limit',
    rightLabel: 'Exceeds Allowed Limit',
  },
  {
    id: 'firmness',
    title: 'Firmness',
    standard: 'Standard: Firm to the touch',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
];

export interface ProduceVerificationApprovalScreenProps {
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  initialStep?: number;
  onBack: () => void;
  onSubmitSuccess?: () => void;
  onViewFarmerProfile?: () => void;
  onViewListing?: () => void;
}

export function ProduceVerificationApprovalScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  initialStep = 1,
  onBack,
  onSubmitSuccess,
  onViewFarmerProfile,
  onViewListing,
}: ProduceVerificationApprovalScreenProps) {
  // Navigation to Module 2 Farmer Profile
  const [showFarmerProfile, setShowFarmerProfile] = useState(false);

  // Collapsible Accordions State
  const [farmerInfoOpen, setFarmerInfoOpen] = useState(true);
  const [produceInfoOpen, setProduceInfoOpen] = useState(true);
  const [tohfaReqOpen, setTohfaReqOpen] = useState(true);

  // Verification Step Active (1 to 6) — Defaults to 1 (S03A Verification Workspace)
  const [activeStep, setActiveStep] = useState(initialStep);
  const [showHandoverConfirmation, setShowHandoverConfirmation] = useState(false);

  // Step 1 Form Inputs State (Image 1 Left: Starts Clean / Empty)
  const [verifiedQuantity, setVerifiedQuantity] = useState('');
  const [weighingRef, setWeighingRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Step 2 Quality Check States (Matches Screenshot S03B: freshness=fail, colour=pass)
  const [qualityCheckResults, setQualityCheckResults] = useState<Record<string, 'pass' | 'fail' | null>>({
    freshness: 'fail',
    colour: 'pass',
    size_appearance: null,
    maturity: null,
    cleanliness: null,
    foreign_matter: null,
    firmness: null,
  });
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionPhoto, setInspectionPhoto] = useState<string | null>(null);

  // Step 3 Grade Check State
  const [selectedGrade, setSelectedGrade] = useState<'Grade 1' | 'Grade 2' | 'Rejected' | null>('Grade 1');

  const isStep1Valid = Boolean(verifiedQuantity.trim());

  // ─── Step 2: Quality Verification (S03B Dedicated Screen - AFTER ALL HOOKS) ───
  if (activeStep === 2) {
    return (
      <ProduceQualityVerificationScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        onBack={() => setActiveStep(1)}
        onPreviousStep={() => setActiveStep(1)}
        onContinue={() => setActiveStep(3)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 3: Grade Check (Dedicated Screen - AFTER ALL HOOKS) ───
  if (activeStep === 3) {
    return (
      <ProduceGradeCheckScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        selectedGrade={selectedGrade ?? 'Grade 1'}
        onBack={() => setActiveStep(2)}
        onPreviousStep={() => setActiveStep(2)}
        onContinue={(grade) => {
          setSelectedGrade(grade);
          setActiveStep(4);
        }}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 4: Damage Inspection (Dedicated Screen - AFTER ALL HOOKS) ───
  if (activeStep === 4) {
    return (
      <ProduceDamageInspectionScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        verifiedQty={parseFloat(verifiedQuantity) || 50}
        onBack={() => setActiveStep(3)}
        onPreviousStep={() => setActiveStep(3)}
        onContinue={() => setActiveStep(5)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 5: Fair Price Check (Dedicated Screen - AFTER ALL HOOKS) ───
  if (activeStep === 5) {
    return (
      <ProduceFairPriceCheckScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        grade={selectedGrade ?? 'Grade 1'}
        fairPriceRange={selectedGrade === 'Grade 2' ? 'Rs. 80-90/KG' : 'Rs. 95-105/KG'}
        onBack={() => setActiveStep(4)}
        onPreviousStep={() => setActiveStep(4)}
        onContinue={() => setActiveStep(6)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 6: Final Eligibility & Decision (Dedicated Screen - AFTER ALL HOOKS) ───
  if (activeStep === 6) {
    if (showHandoverConfirmation) {
      return (
        <HandoverConfirmationScreen
          handoverId="HO-2026-0002"
          status="Completed"
          onBack={() => setShowHandoverConfirmation(false)}
        />
      );
    }

    return (
      <ProduceFinalEligibilityDecisionScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        farmerId="FR-00241"
        listedQty={parseFloat(verifiedQuantity) || 50}
        selectedGrade={selectedGrade ?? 'Grade 1'}
        onBack={() => setActiveStep(5)}
        onPreviousStep={() => setActiveStep(5)}
        onApproveSuccess={() => setShowHandoverConfirmation(true)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // If navigating into Module 2 Farmer Profile
  if (showFarmerProfile) {
    return (
      <FarmerProfileDetailScreen
        farmer={{
          farmerId: 'FR-00241',
          name: farmerName,
          zone: 'Coonoor',
          farmingMethod: 'Organic',
          accountStatus: 'Active',
          certification: 'Certified',
          farmCount: 1,
          listingCount: 18,
          rating: '4.6 ★',
          auditStatus: 'Upcoming',
        }}
        onBack={() => setShowFarmerProfile(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Produce Verification & Approval</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {listingId} · {cropName} · {farmerName}
        </Text>
      </View>

      {/* ─── Body Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Metadata Card (Screenshot 1) */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Verification ID</Text>
              <Text style={styles.metaValue}>Assigned on first save</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Product Listing ID</Text>
              <Text style={styles.metaValue}>{listingId}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Verification status</Text>
              <Text style={styles.metaValue}>Not started</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Inspection date and time</Text>
              <Text style={styles.metaValue}>10 Oct 2026, 10:00</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Farmer Admin</Text>
              <Text style={styles.metaValue}>Suresh Kumar</Text>
            </View>
          </View>
        </View>



        {/* 4. Farmer Information Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setFarmerInfoOpen(!farmerInfoOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.accordionTitle}>Farmer information</Text>
            {farmerInfoOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </TouchableOpacity>

          {farmerInfoOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer ID</Text>
                <Text style={styles.dataValue}>FR-00241</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer name</Text>
                <Text style={styles.dataValue}>{farmerName}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Contact number</Text>
                <Text style={styles.dataValue}>+91 98XXX XX045</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farm location</Text>
                <Text style={styles.dataValue}>Coonoor, Nilgiris</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer verification status</Text>
                <Text style={[styles.dataValue, { color: THEME.verifiedText }]}>Verified</Text>
              </View>

              <TouchableOpacity
                style={styles.viewSubBtn}
                onPress={() => {
                  if (onViewFarmerProfile) {
                    onViewFarmerProfile();
                  } else {
                    setShowFarmerProfile(true);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewSubBtnText}>View Farmer Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 5. Produce Information Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setProduceInfoOpen(!produceInfoOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.accordionTitle}>Produce information</Text>
            {produceInfoOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </TouchableOpacity>

          {produceInfoOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Product</Text>
                <Text style={styles.dataValue}>Tomato</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Crop variety</Text>
                <Text style={styles.dataValue}>Hybrid</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farming type</Text>
                <Text style={styles.dataValue}>Organic</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Listed quantity</Text>
                <Text style={styles.dataValue}>50 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer&apos;s expected price</Text>
                <Text style={styles.dataValue}>Rs. 100/KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Harvest date</Text>
                <Text style={styles.dataValue}>28 Sep 2026</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Expected availability</Text>
                <Text style={styles.dataValue}>1 Oct 2026</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Listing date</Text>
                <Text style={styles.dataValue}>29 Sep 2026</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Product images</Text>
                <Text style={styles.dataValue}>tomato-1.jpg, tomato-2.jpg</Text>
              </View>

              <TouchableOpacity
                style={styles.viewSubBtn}
                onPress={() => {
                  if (onViewListing) {
                    onViewListing();
                  } else {
                    onBack();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewSubBtnText}>View Listing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 6. TOHFA Purchase Requirements Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setTohfaReqOpen(!tohfaReqOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.accordionTitle}>TOHFA purchase requirements</Text>
            {tohfaReqOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </TouchableOpacity>

          {tohfaReqOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Required product</Text>
                <Text style={styles.dataValue}>Tomato</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Required quantity</Text>
                <Text style={styles.dataValue}>30 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Previously committed</Text>
                <Text style={styles.dataValue}>0 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Remaining required</Text>
                <Text style={styles.dataValue}>30 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Applicable fair price</Text>
                <Text style={styles.dataValue}>Depends on the grade (Step 5)</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Warehouse / collection point</Text>
                <Text style={styles.dataValue}>Coonoor Warehouse</Text>
              </View>

              <Text style={styles.footnoteText}>
                These values come from the listing, purchase and pricing records.
              </Text>
            </View>
          )}
        </View>

        {/* 7. Verification Steps (Stepper + Forms from Screenshots 3 & 4) */}
        <Text style={styles.sectionTitle}>Verification steps</Text>

        {/* Numbered Stepper Circles 1 to 6 */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCurrent = activeStep === step;
            const isCompleted = activeStep > step || (activeStep >= 2 && step === 1);
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    (isCurrent || isCompleted) && styles.stepCircleActive,
                  ]}
                  onPress={() => setActiveStep(step)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.stepCircleText,
                      (isCurrent || isCompleted) && styles.stepCircleTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </TouchableOpacity>
                {idx < 5 && (
                  <View
                    style={[
                      styles.stepperLine,
                      step < activeStep && styles.stepperLineActive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* ─── STEP 1: QUANTITY CHECK ─── */}
        {activeStep === 1 && (
          <View>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepHeaderTitle}>Step 1 of 6 · Quantity Check</Text>
              <View style={styles.notCompletedBadge}>
                <Text style={styles.notCompletedBadgeText}>Not completed</Text>
              </View>
            </View>

            <View style={styles.outstandingCard}>
              <Text style={styles.outstandingTitle}>Outstanding</Text>
              <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
              <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
              <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
              <Text style={styles.outstandingItem}>• and 2 more</Text>
            </View>

            <View style={styles.qtyCard}>
              <View style={styles.qtyRow}>
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLabel}>Listed quantity</Text>
                  <Text style={styles.qtyValue}>50 KG</Text>
                </View>
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLabel}>TOHFA required</Text>
                  <Text style={styles.qtyValue}>30 KG</Text>
                </View>
              </View>

              <View style={styles.qtyRow}>
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLabel}>Previously committed</Text>
                  <Text style={styles.qtyValue}>0 KG</Text>
                </View>
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLabel}>Remaining required</Text>
                  <Text style={styles.qtyValue}>30 KG</Text>
                </View>
              </View>

              <View style={styles.qtyRow}>
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLabel}>Unit</Text>
                  <Text style={styles.qtyValue}>KG</Text>
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>
                Verified available quantity (KG) <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                placeholder=""
                value={verifiedQuantity}
                onChangeText={setVerifiedQuantity}
              />
              <Text style={styles.inputCaption}>
                Enter the quantity confirmed by inspection or weighing. This is separate from the quantity the farmer listed.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Weighing reference</Text>
              <TextInput
                style={styles.inputBox}
                placeholder=""
                value={weighingRef}
                onChangeText={setWeighingRef}
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Remarks</Text>
              <TextInput
                style={[styles.inputBox, styles.inputBoxMultiline]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={remarks}
                onChangeText={setRemarks}
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Supporting evidence (optional)</Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => {
                  setUploadedFile('weighing_slip_001.jpg');
                  Alert.alert('File Attached', 'weighing_slip_001.jpg attached successfully.');
                }}
                activeOpacity={0.7}
              >
                <UploadDocumentIcon size={20} color={THEME.titleRustDark} />
                <Text style={styles.uploadText}>
                  {uploadedFile ?? 'Upload file'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Quantity comparison</Text>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Listed (declared by the farmer)</Text>
                <Text style={styles.comparisonValue}>50 KG</Text>
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Verified available</Text>
                <Text style={[styles.comparisonValue, !verifiedQuantity && { color: THEME.ink }]}>
                  {verifiedQuantity ? `${verifiedQuantity} KG` : 'Not entered'}
                </Text>
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>TOHFA remaining</Text>
                <Text style={styles.comparisonValue}>30 KG</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                if (!verifiedQuantity.trim()) {
                  Alert.alert('Required Field', 'Please enter the verified available quantity in KG.');
                  return;
                }
                setActiveStep(2);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 2: QUALITY VERIFICATION (Exact UI from Mockup S03B) ─── */}
        {activeStep === 2 && (
          <View>
            {/* Step Header & Status Badge */}
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepHeaderTitle}>Step 2 of 6 · Quality Verification</Text>
              <View style={styles.notCompletedBadge}>
                <Text style={styles.notCompletedBadgeText}>Not completed</Text>
              </View>
            </View>

            {/* Outstanding Card */}
            <View style={styles.outstandingCard}>
              <Text style={styles.outstandingTitle}>Outstanding</Text>
              <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
              <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
              <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
              <Text style={styles.outstandingItem}>• and 2 more</Text>
            </View>

            {/* Standard Notice Caption */}
            <Text style={styles.stepCaptionText}>
              Only the checks configured for Tomato are shown, with the configured standard beside each.
            </Text>

            {/* The 7 Quality Check Cards */}
            {QUALITY_CHECKS_CONFIG.map((check) => {
              const result = qualityCheckResults[check.id];
              const isPass = result === 'pass';
              const isFail = result === 'fail';

              return (
                <View key={check.id} style={styles.qualityCard}>
                  <Text style={styles.qualityTitle}>
                    {check.title} <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <Text style={styles.qualityStandard}>{check.standard}</Text>

                  <View style={styles.qualityBtnRow}>
                    {/* Left Button -> Meets Standard (Green active when clicked) */}
                    <TouchableOpacity
                      style={[
                        styles.qualityBtn,
                        isPass ? styles.qualityBtnPassActive : styles.qualityBtnDefault,
                      ]}
                      onPress={() =>
                        setQualityCheckResults((prev) => ({
                          ...prev,
                          [check.id]: 'pass',
                        }))
                      }
                      activeOpacity={0.7}
                      accessibilityLabel={`${check.title} ${check.leftLabel}`}
                    >
                      <Text
                        style={[
                          styles.qualityBtnText,
                          isPass ? styles.qualityBtnTextPass : styles.qualityBtnTextDefault,
                        ]}
                      >
                        {check.leftLabel}
                      </Text>
                    </TouchableOpacity>

                    {/* Right Button -> Does Not Meet Standard (Red active when clicked) */}
                    <TouchableOpacity
                      style={[
                        styles.qualityBtn,
                        isFail ? styles.qualityBtnFailActive : styles.qualityBtnDefault,
                      ]}
                      onPress={() =>
                        setQualityCheckResults((prev) => ({
                          ...prev,
                          [check.id]: 'fail',
                        }))
                      }
                      activeOpacity={0.7}
                      accessibilityLabel={`${check.title} ${check.rightLabel}`}
                    >
                      <Text
                        style={[
                          styles.qualityBtnText,
                          isFail ? styles.qualityBtnTextFail : styles.qualityBtnTextDefault,
                        ]}
                      >
                        {check.rightLabel}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Inspection notes Textarea with corner grip */}
            <Text style={styles.inputLabelBold}>Inspection notes</Text>
            <View style={styles.notesWrap}>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder=""
                value={inspectionNotes}
                onChangeText={setInspectionNotes}
              />
              <View style={styles.gripCorner}>
                <CornerGripIcon />
              </View>
            </View>

            {/* Inspection photographs upload box */}
            <Text style={[styles.inputLabelBold, { marginTop: 16 }]}>Inspection photographs</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => {
                setInspectionPhoto('quality_inspection_photo_01.jpg');
                Alert.alert('Photograph Attached', 'quality_inspection_photo_01.jpg attached.');
              }}
              activeOpacity={0.7}
            >
              <UploadDocumentIcon size={20} color={THEME.titleRustDark} />
              <Text style={styles.uploadText}>
                {inspectionPhoto ?? 'Upload file'}
              </Text>
            </TouchableOpacity>

            {/* Action Buttons Row: Previous Step (Outline) & Continue (Solid Orange) */}
            <View style={styles.stepActionRow}>
              <TouchableOpacity
                style={styles.prevStepBtn}
                onPress={() => setActiveStep(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.prevStepBtnText}>Previous Step</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueStepBtn}
                onPress={() => setActiveStep(3)}
                activeOpacity={0.8}
              >
                <Text style={styles.continueStepBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP 3: GRADE CHECK ─── */}
        {activeStep === 3 && (
          <View>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepHeaderTitle}>Step 3 of 6 · Grade Check</Text>
              <View style={styles.notCompletedBadge}>
                <Text style={styles.notCompletedBadgeText}>Not completed</Text>
              </View>
            </View>

            <View style={styles.outstandingCard}>
              <Text style={styles.outstandingTitle}>Outstanding</Text>
              <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
              <Text style={styles.outstandingItem}>• Step 4 Price Confirmation: Confirm fair price ceiling.</Text>
              <Text style={styles.outstandingItem}>• and 2 more</Text>
            </View>

            <View style={styles.qualityCard}>
              <Text style={styles.qualityTitle}>Applicable Grade Check</Text>
              <Text style={styles.qualityStandard}>Tomato declared grade: Grade 1</Text>

              <View style={styles.qualityBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.qualityBtn,
                    selectedGrade === 'Grade 1' ? styles.qualityBtnPassActive : styles.qualityBtnDefault,
                  ]}
                  onPress={() => setSelectedGrade('Grade 1')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.qualityBtnText,
                      selectedGrade === 'Grade 1' ? styles.qualityBtnTextPass : styles.qualityBtnTextDefault,
                    ]}
                  >
                    Grade 1 (Assigned)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.qualityBtn,
                    selectedGrade === 'Grade 2' ? styles.qualityBtnPassActive : styles.qualityBtnDefault,
                  ]}
                  onPress={() => setSelectedGrade('Grade 2')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.qualityBtnText,
                      selectedGrade === 'Grade 2' ? styles.qualityBtnTextPass : styles.qualityBtnTextDefault,
                    ]}
                  >
                    Grade 2
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepActionRow}>
              <TouchableOpacity
                style={styles.prevStepBtn}
                onPress={() => setActiveStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.prevStepBtnText}>Previous Step</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueStepBtn}
                onPress={() => {
                  Alert.alert('Verification Progress', 'Step 3 Grade Check recorded. Ready for Final Approval.', [
                    { text: 'OK', onPress: () => onSubmitSuccess?.() },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.continueStepBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEPS 4, 5, 6 FALLBACK ─── */}
        {activeStep > 3 && (
          <View>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepHeaderTitle}>Step {activeStep} of 6</Text>
              <View style={styles.notCompletedBadge}>
                <Text style={styles.notCompletedBadgeText}>In progress</Text>
              </View>
            </View>

            <View style={styles.stepActionRow}>
              <TouchableOpacity
                style={styles.prevStepBtn}
                onPress={() => setActiveStep(activeStep - 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.prevStepBtnText}>Previous Step</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueStepBtn}
                onPress={() => {
                  if (activeStep < 6) setActiveStep(activeStep + 1);
                  else onSubmitSuccess?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.continueStepBtnText}>
                  {activeStep === 6 ? 'Complete' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    paddingLeft: 42,
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // ─── Top Meta Card ───
  metaCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    width: '48%',
  },
  metaLabel: {
    fontSize: 11,
    color: THEME.muted,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 2,
  },

  // ─── Action Buttons Row ───
  actionRowTwo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  outlineActionBtn: {
    flex: 1,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.headerBg,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // ─── Submit Disabled Button ───
  submitBtnDisabled: {
    backgroundColor: THEME.disabledBtnBg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnTextDisabled: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.disabledBtnText,
  },
  disabledHintText: {
    fontSize: 11,
    color: THEME.muted,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 15,
  },

  // ─── Accordion Cards ───
  accordionCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  accordionBody: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F0',
  },
  dataLabel: {
    fontSize: 12,
    color: THEME.muted,
  },
  dataValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.ink,
    textAlign: 'right',
  },
  viewSubBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.headerBg,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  viewSubBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  footnoteText: {
    fontSize: 11,
    color: THEME.muted,
    marginTop: 8,
    lineHeight: 15,
  },

  // ─── Stepper ───
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 12,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2DDD6',
    backgroundColor: THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: THEME.orangeBtn,
    borderWidth: 2,
  },
  stepCircleDone: {
    backgroundColor: THEME.orangeBtn,
    borderColor: THEME.orangeBtn,
  },
  stepCircleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepCircleTextActive: {
    color: THEME.orangeBtn,
    fontWeight: '800',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2DDD6',
    marginHorizontal: 0,
  },
  stepperLineActive: {
    backgroundColor: THEME.orangeBtn,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  notCompletedBadge: {
    backgroundColor: THEME.notCompletedBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notCompletedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.notCompletedText,
  },

  // ─── Outstanding Card ───
  outstandingCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  outstandingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 4,
  },
  outstandingItem: {
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 18,
  },

  // ─── Quantity Card ───
  qtyCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    gap: 12,
    marginBottom: 14,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qtyCol: {
    width: '48%',
  },
  qtyLabel: {
    fontSize: 11,
    color: THEME.muted,
    fontWeight: '500',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 2,
  },

  // ─── Form Section ───
  formSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: THEME.ink,
  },
  inputBoxMultiline: {
    height: 85,
  },
  inputCaption: {
    fontSize: 11,
    color: THEME.muted,
    marginTop: 4,
    lineHeight: 15,
  },
  uploadBox: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.borderDashed,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // ─── Quantity Comparison Card ───
  comparisonCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  comparisonTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 2,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F0',
  },
  comparisonLabel: {
    fontSize: 12,
    color: THEME.muted,
  },
  comparisonValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.ink,
  },

  // ─── Continue Button (Step 1) ───
  continueBtn: {
    backgroundColor: THEME.orangeBtn,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.white,
  },

  // ─── Step 2 & 3: Quality Verification & Grade Check ───
  stepCaptionText: {
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 14,
  },
  qualityCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  qualityStandard: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
    marginBottom: 14,
  },
  qualityBtnRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  qualityBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1.5,
  },
  qualityBtnDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  qualityBtnPassActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  qualityBtnFailActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  qualityBtnText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  qualityBtnTextDefault: {
    color: THEME.ink,
    fontWeight: '700',
  },
  qualityBtnTextPass: {
    color: '#15803D',
    fontWeight: '800',
  },
  qualityBtnTextFail: {
    color: '#DC2626',
    fontWeight: '800',
  },
  inputLabelBold: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 6,
  },
  notesWrap: {
    position: 'relative',
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesInput: {
    minHeight: 90,
    padding: 12,
    paddingBottom: 22,
    fontSize: 13,
    color: THEME.ink,
  },
  gripCorner: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  stepActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  prevStepBtn: {
    flex: 1,
    height: 48,
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
  continueStepBtn: {
    flex: 1,
    height: 48,
    backgroundColor: THEME.orangeBtn,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.white,
  },
});
