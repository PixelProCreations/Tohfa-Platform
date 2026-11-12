/**
 * Screen: Bulk Update Ceilings
 * Exact 3-step wizard implementation matching Design: Image 1 Left, Image 2 Left, Image 3 Left.
 * Super Admin Level 1 Authority (pricing.fair_price.bulk_update).
 * Strictly adheres to Admin Design Tokens from ../../theme.
 */
import React, { useState } from 'react';
import {
  Modal,
  Platform,
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

import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';

export interface BulkPriceUpdateScreenProps {
  onBack: () => void;
  onApply?: (selectedIds: string[], percentage: number) => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DropdownChevronIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PackageIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RepeatIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UpTrendArrowIcon({ size = 14, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 17L17 7M17 7H7M17 7V17" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function SummaryDocIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M8 16v-4M12 16v-7M16 16v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ButtonArrowRight({ size = 15, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BulkPriceUpdateScreen({ onBack, onApply }: BulkPriceUpdateScreenProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [applyMode, setApplyMode] = useState<'% Changes' | 'Fixed Value'>('% Changes');
  const [percentValue, setPercentValue] = useState('+5');
  const [effectiveDate, setEffectiveDate] = useState('20 Oct 2026');
  const [effectiveCalendarOpen, setEffectiveCalendarOpen] = useState(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(true);
  const [filterCrop, setFilterCrop] = useState('All Crops');
  const [filterGrade, setFilterGrade] = useState('All Grades');
  const [cropDropdownVisible, setCropDropdownVisible] = useState(false);
  const [gradeDropdownVisible, setGradeDropdownVisible] = useState(false);

  // Checkbox selections for Step 1
  const [selectedCrops, setSelectedCrops] = useState<Record<string, boolean>>({
    tomato: true,
    carrot: true,
    onion: true,
  });

  const toggleCrop = (key: string) => {
    setSelectedCrops((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinalConfirm = () => {
    if (onApply) {
      onApply(['tomato', 'carrot', 'onion'], 5);
    }
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep((s) => (s - 1) as 1 | 2 | 3);
            } else {
              onBack();
            }
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulk Update Ceilings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 3-Step Wizard Stepper (Aligned Circles and Labels matching Design) ─── */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperRow}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                <Text style={[styles.stepCircleText, currentStep < 1 && styles.stepCircleTextInactive]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
                Edit Prices
              </Text>
            </View>

            {/* Dashed Line 1 */}
            <View style={styles.dashedLineWrap}>
              <Svg height="2" width="100%">
                <Line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke={currentStep > 1 ? adminColors.brand : '#E2D8CF'}
                  strokeWidth="2"
                  strokeDasharray="4, 4"
                />
              </Svg>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                <Text style={[styles.stepCircleText, currentStep < 2 && styles.stepCircleTextInactive]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
                Review Changes
              </Text>
            </View>

            {/* Dashed Line 2 */}
            <View style={styles.dashedLineWrap}>
              <Svg height="2" width="100%">
                <Line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke={currentStep > 2 ? adminColors.brand : '#E2D8CF'}
                  strokeWidth="2"
                  strokeDasharray="4, 4"
                />
              </Svg>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                <Text style={[styles.stepCircleText, currentStep < 3 && styles.stepCircleTextInactive]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>
                Confirm & Update
              </Text>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: EDIT PRICES (Image 1 Left) */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.screenHeading}>Edit Bulk Price Changes</Text>

            {/* Filter Dropdowns Card */}
            <View style={styles.filterCard}>
              {/* Row 1: Crop and Grade Dropdowns */}
              <View style={styles.dropdownHalfRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputMiniLabel}>Crop</Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    activeOpacity={0.8}
                    onPress={() => setCropDropdownVisible(true)}
                  >
                    <Text style={styles.dropdownBoxText}>{filterCrop}</Text>
                    <DropdownChevronIcon size={16} />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputMiniLabel}>Grade</Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    activeOpacity={0.8}
                    onPress={() => setGradeDropdownVisible(true)}
                  >
                    <Text style={styles.dropdownBoxText}>{filterGrade}</Text>
                    <DropdownChevronIcon size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: Apply Changes Label + Toggle Buttons (Side-by-side in one row matching Design) */}
              <View style={styles.applyModeRow}>
                <Text style={styles.applyModeLabel}>Apply Changes</Text>
                <View style={styles.modeToggleGroup}>
                  <TouchableOpacity
                    style={[styles.modeToggleBtn, applyMode === '% Changes' && styles.modeToggleBtnActive]}
                    onPress={() => setApplyMode('% Changes')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modeToggleText, applyMode === '% Changes' && styles.modeToggleTextActive]}>
                      % Changes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeToggleBtn, applyMode === 'Fixed Value' && styles.modeToggleBtnActive]}
                    onPress={() => setApplyMode('Fixed Value')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modeToggleText, applyMode === 'Fixed Value' && styles.modeToggleTextActive]}>
                      Fixed Value
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 3: Effective from & Grade / Date Inputs */}
              <View style={styles.dropdownHalfRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputMiniLabel}>Effective from</Text>
                  <View style={styles.modeValueInputWrap}>
                    <TextInput
                      style={styles.modeValueInput}
                      value={percentValue}
                      onChangeText={setPercentValue}
                    />
                    <Text style={styles.modeValueUnit}>%</Text>
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputMiniLabel}>Grade</Text>
                  <View style={styles.datePickerWrap}>
                    <Text style={styles.datePickerText}>{effectiveDate}</Text>
                    <TouchableOpacity
                      onPress={() => setEffectiveCalendarOpen(true)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Pick effective date"
                    >
                      <CalendarIcon size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Price Table Card matching Design Image 1 Left */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <View style={[styles.cropCheckCell, { flex: 1.4 }]}>
                  <View style={[styles.tableCheckbox, styles.tableCheckboxActive, { marginRight: 6 }]}>
                    <Text style={styles.checkboxCheck}>✓</Text>
                  </View>
                  <Text style={styles.tableColHeader}>Crop & Grade</Text>
                </View>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Current Ceiling (₹/kg)</Text>
                <Text style={[styles.tableColHeader, { flex: 0.95, textAlign: 'center' }]}>Category</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1, textAlign: 'right' }]}>Description</Text>
              </View>

              {/* Row 1: Tomato */}
              <View style={styles.tableRow}>
                <TouchableOpacity
                  style={styles.cropCheckCell}
                  onPress={() => toggleCrop('tomato')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tableCheckbox, selectedCrops.tomato && styles.tableCheckboxActive]}>
                    {selectedCrops.tomato && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.cropTableName}>Tomato</Text>
                  <View style={styles.gradePeachBadge}>
                    <Text style={styles.gradePeachText}>G1</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.currentCeilingCell}>₹140</Text>
                <View style={{ flex: 0.95, alignItems: 'center' }}>
                  <View style={styles.proposedBoxCell}>
                    <Text style={styles.proposedBoxText}>₹147</Text>
                  </View>
                </View>
                <View style={styles.changePercentCell}>
                  <UpTrendArrowIcon size={14} color="#16A34A" />
                  <Text style={styles.changePercentText}>+5.0%</Text>
                </View>
              </View>

              {/* Row 2: Carrot */}
              <View style={styles.tableRow}>
                <TouchableOpacity
                  style={styles.cropCheckCell}
                  onPress={() => toggleCrop('carrot')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tableCheckbox, selectedCrops.carrot && styles.tableCheckboxActive]}>
                    {selectedCrops.carrot && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.cropTableName}>Carrot</Text>
                  <View style={styles.gradePeachBadge}>
                    <Text style={styles.gradePeachText}>G1</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.currentCeilingCell}>₹75</Text>
                <View style={{ flex: 0.95, alignItems: 'center' }}>
                  <View style={styles.proposedBoxCell}>
                    <Text style={styles.proposedBoxText}>₹78.75</Text>
                  </View>
                </View>
                <View style={styles.changePercentCell}>
                  <UpTrendArrowIcon size={14} color="#16A34A" />
                  <Text style={styles.changePercentText}>+5.0%</Text>
                </View>
              </View>

              {/* Row 3: Onion */}
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <TouchableOpacity
                  style={styles.cropCheckCell}
                  onPress={() => toggleCrop('onion')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tableCheckbox, selectedCrops.onion && styles.tableCheckboxActive]}>
                    {selectedCrops.onion && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.cropTableName}>Onion</Text>
                  <View style={styles.gradePeachBadge}>
                    <Text style={styles.gradePeachText}>G2</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.currentCeilingCell}>₹50</Text>
                <View style={{ flex: 0.95, alignItems: 'center' }}>
                  <View style={styles.proposedBoxCell}>
                    <Text style={styles.proposedBoxText}>₹52.75</Text>
                  </View>
                </View>
                <View style={styles.changePercentCell}>
                  <UpTrendArrowIcon size={14} color="#16A34A" />
                  <Text style={styles.changePercentText}>+5.0%</Text>
                </View>
              </View>
            </View>

            {/* Review Summary Card matching Design Image 1 Left */}
            <View style={styles.reviewSummaryCard}>
              <View style={styles.reviewSummaryHeader}>
                <View style={styles.reviewSummaryTitleGroup}>
                  <SummaryDocIcon size={18} color={adminColors.brand} />
                  <Text style={styles.reviewSummaryTitle}>Review Summary</Text>
                </View>
                <Text style={styles.reviewSummaryCount}>5 Items Selected</Text>
              </View>

              <View style={styles.reviewSummaryBody}>
                <View style={styles.reviewSummaryRow}>
                  <Text style={styles.reviewSummaryLabel}>Total Records</Text>
                  <Text style={styles.reviewSummaryValue}>5</Text>
                </View>
                <View style={styles.reviewSummaryRow}>
                  <Text style={styles.reviewSummaryLabel}>Price Increase</Text>
                  <Text style={styles.reviewSummaryValue}>+5.0%</Text>
                </View>
                <View style={[styles.reviewSummaryRow, { marginBottom: 0 }]}>
                  <Text style={styles.reviewSummaryLabel}>Effective From</Text>
                  <Text style={styles.reviewSummaryValue}>20 Oct 2026</Text>
                </View>
              </View>
            </View>

            {/* Buttons: Fixed height, crisp arrow, no letter 'g' clipping */}
            <View style={styles.wizardBtnRow}>
              <TouchableOpacity
                style={styles.wizardSecondaryBtn}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text style={styles.wizardSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.wizardPrimaryBtn}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <View style={styles.wizardPrimaryBtnContent}>
                  <Text style={styles.wizardPrimaryBtnText}>Review Changes</Text>
                  <ButtonArrowRight size={15} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: REVIEW CHANGES (Image 2 Left) */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.screenHeading}>Review Price changes</Text>

            {/* 3 KPI Cards matching Image 2 Left (All white cards, left-aligned) */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>12</Text>
                <Text style={styles.kpiLabel}>Crops / Grades</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>12</Text>
                <Text style={styles.kpiLabel}>Changes</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>2</Text>
                <Text style={styles.kpiLabel}>Warnings</Text>
              </View>
            </View>

            {/* Comparison Table matching Image 2 Left */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 1.3 }]}>Crop & Grade</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Current Ceiling (₹/kg)</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Proposed Ceiling</Text>
                <Text style={[styles.tableColHeader, { flex: 0.95 }]}>Change</Text>
                <Text style={[styles.tableColHeader, { flex: 0.85, textAlign: 'right' }]}>Status</Text>
              </View>

              {/* Row 1 */}
              <View style={styles.tableRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cropTableName}>Tomato</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <View style={{ flex: 0.95 }}>
                  <Text style={styles.changeStackAmount}>+₹5</Text>
                  <Text style={styles.changeStackPercent}>(+4.2%)</Text>
                </View>
                <View style={{ flex: 0.85, alignItems: 'flex-end' }}>
                  <View style={styles.statusPillGreen}>
                    <Text style={styles.statusPillGreenText}>Ready</Text>
                  </View>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.tableRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cropTableName}>Carrot</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <View style={{ flex: 0.95 }}>
                  <Text style={styles.changeStackAmount}>+₹5</Text>
                  <Text style={styles.changeStackPercent}>(+4.2%)</Text>
                </View>
                <View style={{ flex: 0.85, alignItems: 'flex-end' }}>
                  <View style={styles.statusPillGreen}>
                    <Text style={styles.statusPillGreenText}>Ready</Text>
                  </View>
                </View>
              </View>

              {/* Row 3 */}
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cropTableName}>Onion</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <View style={{ flex: 0.95 }}>
                  <Text style={styles.changeStackAmount}>+₹5</Text>
                  <Text style={styles.changeStackPercent}>(+4.2%)</Text>
                </View>
                <View style={{ flex: 0.85, alignItems: 'flex-end' }}>
                  <View style={styles.statusPillGreen}>
                    <Text style={styles.statusPillGreenText}>Ready</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Review Summary Card */}
            <View style={styles.reviewSummaryCard}>
              <View style={styles.reviewSummaryHeader}>
                <View style={styles.reviewSummaryTitleGroup}>
                  <SummaryDocIcon size={18} color={adminColors.brand} />
                  <Text style={styles.reviewSummaryTitle}>Review Summary</Text>
                </View>
                <Text style={styles.reviewSummaryCount}>5 Items Selected</Text>
              </View>

              <View style={styles.reviewSummaryBody}>
                <View style={styles.reviewSummaryRow}>
                  <Text style={styles.reviewSummaryLabel}>Total Records</Text>
                  <Text style={styles.reviewSummaryValue}>5</Text>
                </View>
                <View style={styles.reviewSummaryRow}>
                  <Text style={styles.reviewSummaryLabel}>Price Increase</Text>
                  <Text style={styles.reviewSummaryValue}>+5.0%</Text>
                </View>
                <View style={[styles.reviewSummaryRow, { marginBottom: 0 }]}>
                  <Text style={styles.reviewSummaryLabel}>Effective From</Text>
                  <Text style={styles.reviewSummaryValue}>20 Oct 2026</Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.wizardBtnRow}>
              <TouchableOpacity
                style={styles.wizardSecondaryBtn}
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.wizardSecondaryBtnText}>Back to Edit Prices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.wizardPrimaryBtn}
                onPress={() => setCurrentStep(3)}
                activeOpacity={0.8}
              >
                <View style={styles.wizardPrimaryBtnContent}>
                  <Text style={styles.wizardPrimaryBtnText}>Continue to Confirm</Text>
                  <ButtonArrowRight size={15} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: CONFIRM & UPDATE (Image 3 Left) */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.screenHeading}>Final Confirmation</Text>

            {/* Details Box matching Design: Orange outline border, orange icons */}
            <View style={styles.detailsCardOrange}>
              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <PackageIcon size={18} color={adminColors.brand} />
                  <Text style={styles.detailRowLabel}>Items to Update</Text>
                </View>
                <Text style={styles.detailRowValue}>12</Text>
              </View>

              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <CalendarIcon size={18} color={adminColors.brand} />
                  <Text style={styles.detailRowLabel}>Effective from</Text>
                </View>
                <Text style={styles.detailRowValue}>02 Nov 2026</Text>
              </View>

              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <RepeatIcon size={18} color={adminColors.brand} />
                  <Text style={styles.detailRowLabel}>Update frequency</Text>
                </View>
                <Text style={styles.detailRowValue}>Daily</Text>
              </View>

              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <UserIcon size={18} color={adminColors.brand} />
                  <Text style={styles.detailRowLabel}>Updated by</Text>
                </View>
                <Text style={styles.detailRowValue}>Super admin</Text>
              </View>

              <View style={[styles.detailCardRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailRowLabelWrap}>
                  <SlidersIcon size={18} color={adminColors.brand} />
                  <Text style={styles.detailRowLabel}>Change type</Text>
                </View>
                <Text style={styles.detailRowValue}>Mixed increases</Text>
              </View>
            </View>

            {/* Preview List matching Design Image 3 Left */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 1.3 }]}>Crop & Grade</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Current Ceiling (₹/kg)</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Proposed Ceiling</Text>
                <Text style={[styles.tableColHeader, { flex: 0.95 }]}>Change</Text>
                <Text style={[styles.tableColHeader, { flex: 0.85, textAlign: 'right' }]}>Status</Text>
              </View>

              <View style={styles.tableRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cropTableName}>Tomato</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <View style={{ flex: 0.95 }}>
                  <Text style={styles.changeStackAmount}>+₹5</Text>
                  <Text style={styles.changeStackPercent}>(+4.2%)</Text>
                </View>
                <View style={{ flex: 0.85, alignItems: 'flex-end' }}>
                  <View style={styles.statusPillGreen}>
                    <Text style={styles.statusPillGreenText}>Ready</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cropTableName}>Carrot</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <View style={{ flex: 0.95 }}>
                  <Text style={styles.changeStackAmount}>+₹5</Text>
                  <Text style={styles.changeStackPercent}>(+4.2%)</Text>
                </View>
                <View style={{ flex: 0.85, alignItems: 'flex-end' }}>
                  <View style={styles.statusPillGreen}>
                    <Text style={styles.statusPillGreenText}>Ready</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.cropTableName}>Onion</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <View style={{ flex: 0.95 }}>
                  <Text style={styles.changeStackAmount}>+₹5</Text>
                  <Text style={styles.changeStackPercent}>(+4.2%)</Text>
                </View>
                <View style={{ flex: 0.85, alignItems: 'flex-end' }}>
                  <View style={styles.statusPillGreen}>
                    <Text style={styles.statusPillGreenText}>Ready</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.7}>
                <Text style={styles.viewAllLinkText}>View all 12 changes &gt;</Text>
              </TouchableOpacity>
            </View>

            {/* Checkbox Confirmation matching Design */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setConfirmedCheckbox((c) => !c)}
              activeOpacity={0.8}
            >
              <View style={[styles.tableCheckbox, confirmedCheckbox && styles.tableCheckboxActive]}>
                {confirmedCheckbox && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabelText}>
                I have reviewed these changes and confirm the new fair price ceilings.
              </Text>
            </TouchableOpacity>

            {/* Notice Box matching Design Image 3 Left (Solid warm peach background, NO border, orange circular icon) */}
            <View style={styles.step3NoticeCard}>
              <View style={styles.step3InfoCircle}>
                <Text style={styles.step3InfoText}>i</Text>
              </View>
              <Text style={styles.step3NoticeText}>
                This action will update the approved ceilings and be recorded in the price history.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.wizardBtnRow}>
              <TouchableOpacity
                style={styles.wizardSecondaryBtn}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.wizardSecondaryBtnText}>Back to Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.wizardPrimaryBtn, !confirmedCheckbox && { opacity: 0.5 }]}
                disabled={!confirmedCheckbox}
                onPress={handleFinalConfirm}
                activeOpacity={0.8}
              >
                <View style={styles.wizardPrimaryBtnContent}>
                  <Text style={styles.wizardPrimaryBtnText}>Confirm & Update</Text>
                  <ButtonArrowRight size={15} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Crop Selection Modal ─── */}
      <Modal
        visible={cropDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCropDropdownVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCropDropdownVisible(false)}>
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Crop</Text>
            {['All Crops', 'Tomato', 'Carrot', 'Onion', 'Potato'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.dropdownOptionRow, filterCrop === item && styles.dropdownOptionRowActive]}
                onPress={() => {
                  setFilterCrop(item);
                  setCropDropdownVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, filterCrop === item && styles.dropdownOptionTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Grade Selection Modal ─── */}
      <Modal
        visible={gradeDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGradeDropdownVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setGradeDropdownVisible(false)}>
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Grade</Text>
            {['All Grades', 'Grade 1', 'Grade 2', 'Grade 3'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.dropdownOptionRow, filterGrade === item && styles.dropdownOptionRowActive]}
                onPress={() => {
                  setFilterGrade(item);
                  setGradeDropdownVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, filterGrade === item && styles.dropdownOptionTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <AdminCalendarPickerModal
        visible={effectiveCalendarOpen}
        format="DD MMM YYYY"
        value={effectiveDate}
        onSelect={setEffectiveDate}
        onClose={() => setEffectiveCalendarOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived From Admin Theme & Left Design ─────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ─── Stepper ───
  stepperContainer: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 86,
  },
  dashedLineWrap: {
    flex: 1,
    marginTop: 13,
    marginHorizontal: -6,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: adminColors.brand,
  },
  stepCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  stepCircleTextInactive: {
    color: '#9CA3AF',
  },
  stepLabel: {
    color: '#7A6E65',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  stepLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // ─── Headings ───
  screenHeading: {
    color: '#5A3E2B',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    marginBottom: 14,
  },

  // ─── Filter Card ───
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE6DC',
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  dropdownHalfRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputMiniLabel: {
    color: '#3D2B1F',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    includeFontPadding: false,
  },
  dropdownBox: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E2D8CF',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBoxText: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },

  // ─── Mode Toggle Row (Side-by-side matching Design Image 1 Left) ───
  applyModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
  },
  applyModeLabel: {
    color: '#3D2B1F',
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  modeToggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2D8CF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  modeToggleText: {
    color: '#3D2B1F',
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Value & Date Pickers ───
  modeValueInputWrap: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E2D8CF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  modeValueInput: {
    flex: 1,
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
    includeFontPadding: false,
  },
  modeValueUnit: {
    color: '#7A6E65',
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },
  datePickerWrap: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E2D8CF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  datePickerText: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },

  // ─── Tables ───
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE6DC',
    overflow: 'hidden',
    padding: 12,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  tableColHeader: {
    color: '#7C4A27',
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFE6DC',
  },
  cropCheckCell: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D4C4B5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  tableCheckboxActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    includeFontPadding: false,
  },
  cropTableName: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
    marginRight: 6,
  },
  cropTableGrade: {
    color: '#7A6E65',
    fontSize: 11,
    marginTop: 2,
    includeFontPadding: false,
  },
  gradePeachBadge: {
    backgroundColor: '#F5E6D8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gradePeachText: {
    color: '#8D5B36',
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  currentCeilingCell: {
    flex: 1.1,
    color: '#1F1B18',
    fontSize: 13,
    includeFontPadding: false,
  },
  proposedBoxCell: {
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  proposedBoxText: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  changePercentCell: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  changePercentText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },

  // ─── Step 2 Stacks ───
  changeStackAmount: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  changeStackPercent: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    includeFontPadding: false,
  },
  statusPillGreen: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillGreenText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },

  // ─── Review Summary Card (Warm Peach Banner + White Body matching Design) ───
  reviewSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE6DC',
    overflow: 'hidden',
    marginBottom: 20,
    ...adminShadow.sm,
  },
  reviewSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF2E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E4D6',
  },
  reviewSummaryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewSummaryTitle: {
    color: '#5A3E2B',
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  reviewSummaryCount: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  reviewSummaryBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reviewSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewSummaryLabel: {
    color: '#5A3E2B',
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },
  reviewSummaryValue: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },

  // ─── Step 2 KPI Row (All clean white cards, left-aligned) ───
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE6DC',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    ...adminShadow.sm,
  },
  kpiNumber: {
    color: '#1F1B18',
    fontSize: 22,
    fontWeight: '800',
    includeFontPadding: false,
    lineHeight: 26,
  },
  kpiLabel: {
    color: '#7A6E65',
    fontSize: 11,
    marginTop: 4,
    includeFontPadding: false,
  },
  tableBodyText: {
    color: '#1F1B18',
    fontSize: 12,
    includeFontPadding: false,
  },

  // ─── Step 3 Details Card (Orange outline border, orange icons matching Design) ───
  detailsCardOrange: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  detailCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE4',
  },
  detailRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailRowLabel: {
    color: '#3D2B1F',
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },
  detailRowValue: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  viewAllRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  viewAllLinkText: {
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },

  // ─── Checkbox Row ───
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabelText: {
    flex: 1,
    color: '#3D2B1F',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    includeFontPadding: false,
  },

  // ─── Step 3 Notice Card (Warm peach background, NO border, orange circular icon) ───
  step3NoticeCard: {
    backgroundColor: '#FDF2E9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  step3InfoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step3InfoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 16,
    includeFontPadding: false,
  },
  step3NoticeText: {
    flex: 1,
    color: '#5A3E2B',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    includeFontPadding: false,
  },

  // ─── Action Buttons (Fixed height 48, crisp arrow, letter 'g' never clipped) ───
  wizardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  wizardSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    ...adminShadow.sm,
  },
  wizardSecondaryBtnText: {
    color: '#3D2B1F',
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  wizardPrimaryBtn: {
    flex: 1.3,
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...adminShadow.sm,
  },
  wizardPrimaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  wizardPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    includeFontPadding: false,
  },

  // ─── Modal Dropdown ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dropdownModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  dropdownModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: adminSpacing.md,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: adminRadius.sm,
    marginBottom: 4,
  },
  dropdownOptionRowActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
