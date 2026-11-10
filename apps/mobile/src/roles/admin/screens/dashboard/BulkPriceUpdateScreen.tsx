/**
 * Screen: Bulk Update Ceilings
 * Exact 3-step wizard implementation matching Image 3 Right, Image 4 Left, Image 4 Right.
 * Super Admin Level 1 Authority (pricing.fair_price.bulk_update).
 */
import React, { useState } from 'react';
import {
  Modal,
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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
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

function PackageIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RepeatIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SlidersIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UpTrendArrowIcon({ size = 14, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BulkPriceUpdateScreen({ onBack, onApply }: BulkPriceUpdateScreenProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [applyMode, setApplyMode] = useState<'% Changes' | 'Fixed Value'>('% Changes');
  const [percentValue, setPercentValue] = useState('+5');
  const [effectiveDate, _setEffectiveDate] = useState('20 Oct 2026');
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
        {/* ─── 3-Step Wizard Stepper (Exact horizontal dashed line matching Image 1 Left) ─── */}
        <View style={styles.stepperContainer}>
          {/* Circles and Dashed Lines Row */}
          <View style={styles.stepperCirclesRow}>
            <View style={[styles.stepCircle, currentStep >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepCircleText, currentStep < 1 && styles.stepCircleTextInactive]}>1</Text>
            </View>

            <View style={styles.dashedLineWrap}>
              <Svg height="2" width="100%">
                <Line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke={currentStep > 1 ? adminColors.brand : adminColors.border}
                  strokeWidth="2"
                  strokeDasharray="5, 4"
                />
              </Svg>
            </View>

            <View style={[styles.stepCircle, currentStep >= 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepCircleText, currentStep < 2 && styles.stepCircleTextInactive]}>2</Text>
            </View>

            <View style={styles.dashedLineWrap}>
              <Svg height="2" width="100%">
                <Line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke={currentStep > 2 ? adminColors.brand : adminColors.border}
                  strokeWidth="2"
                  strokeDasharray="5, 4"
                />
              </Svg>
            </View>

            <View style={[styles.stepCircle, currentStep >= 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepCircleText, currentStep < 3 && styles.stepCircleTextInactive]}>3</Text>
            </View>
          </View>

          {/* Labels Row aligned under circles */}
          <View style={styles.stepperLabelsRow}>
            <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive, { textAlign: 'left', minWidth: 60 }]}>
              Edit Prices
            </Text>
            <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive, { textAlign: 'center', minWidth: 80 }]}>
              Review Changes
            </Text>
            <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive, { textAlign: 'right', minWidth: 80 }]}>
              Confirm & Update
            </Text>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: EDIT PRICES (Image 3 Right) */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.screenHeading}>Edit Bulk Price Changes</Text>

            {/* Filter Dropdowns Card */}
            <View style={styles.filterCard}>
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

              {/* Apply Changes Mode Toggle */}
              <Text style={[styles.inputMiniLabel, { marginTop: 12 }]}>Apply Changes</Text>
              <View style={styles.modeToggleRow}>
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

              {/* Value & Date Row */}
              <View style={[styles.dropdownHalfRow, { marginTop: 12 }]}>
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
                    <CalendarIcon size={16} />
                  </View>
                </View>
              </View>
            </View>

            {/* Price Table Card */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <View style={[styles.cropCheckCell, { flex: 1.4 }]}>
                  <View style={[styles.tableCheckbox, styles.tableCheckboxActive, { marginRight: 6 }]}>
                    <Text style={styles.checkboxCheck}>✓</Text>
                  </View>
                  <Text style={styles.tableColHeader}>Crop & Grade</Text>
                </View>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Current Ceiling (₹/kg)</Text>
                <Text style={[styles.tableColHeader, { flex: 0.9 }]}>Category</Text>
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
                <View style={styles.proposedBoxCell}>
                  <Text style={styles.proposedBoxText}>₹147</Text>
                </View>
                <View style={styles.changePercentCell}>
                  <UpTrendArrowIcon size={12} color={adminColors.success.text} />
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
                <View style={styles.proposedBoxCell}>
                  <Text style={styles.proposedBoxText}>₹78.75</Text>
                </View>
                <View style={styles.changePercentCell}>
                  <UpTrendArrowIcon size={12} color={adminColors.success.text} />
                  <Text style={styles.changePercentText}>+5.0%</Text>
                </View>
              </View>

              {/* Row 3: Onion */}
              <View style={styles.tableRow}>
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
                <View style={styles.proposedBoxCell}>
                  <Text style={styles.proposedBoxText}>₹52.75</Text>
                </View>
                <View style={styles.changePercentCell}>
                  <UpTrendArrowIcon size={12} color={adminColors.success.text} />
                  <Text style={styles.changePercentText}>+5.0%</Text>
                </View>
              </View>
            </View>

            {/* Review Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryTitleWrap}>
                  <InfoCircleIcon size={16} color={adminColors.brand} />
                  <Text style={styles.summaryTitle}>Review Summary</Text>
                </View>
                <View style={styles.summaryPillGreen}>
                  <Text style={styles.summaryPillGreenText}>5 Items Selected</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Records</Text>
                <Text style={styles.summaryValue}>5</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price Increase</Text>
                <Text style={styles.summaryValue}>+5.0%</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Effective From</Text>
                <Text style={styles.summaryValue}>20 Oct 2026</Text>
              </View>
            </View>

            {/* Buttons */}
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
                <Text style={styles.wizardPrimaryBtnText}>Review Changes →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: REVIEW CHANGES (Image 4 Left) */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.screenHeading}>Review Price changes</Text>

            {/* 3 KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>12</Text>
                <Text style={styles.kpiLabel}>Crops/Grades</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>12</Text>
                <Text style={styles.kpiLabel}>Changes</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardWarning]}>
                <Text style={[styles.kpiNumber, { color: adminColors.warning.text }]}>2</Text>
                <Text style={styles.kpiLabel}>Warnings</Text>
              </View>
            </View>

            {/* Comparison Table */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Crop & Grade</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Current Ceiling</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Proposed Ceiling</Text>
                <Text style={[styles.tableColHeader, { flex: 1 }]}>Change</Text>
                <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>Status</Text>
              </View>

              {/* Row 1 */}
              <View style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cropTableName}>Tomato</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <Text style={[styles.changeGreenText, { flex: 1 }]}>+₹5 (+4.2%)</Text>
                <View style={[styles.statusBadgeGreen, { flex: 0.8 }]}>
                  <Text style={styles.statusBadgeGreenText}>Ready</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cropTableName}>Carrot</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <Text style={[styles.changeGreenText, { flex: 1 }]}>+₹5 (+4.2%)</Text>
                <View style={[styles.statusBadgeGreen, { flex: 0.8 }]}>
                  <Text style={styles.statusBadgeGreenText}>Ready</Text>
                </View>
              </View>

              {/* Row 3 */}
              <View style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cropTableName}>Onion</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <Text style={[styles.changeGreenText, { flex: 1 }]}>+₹5 (+4.2%)</Text>
                <View style={[styles.statusBadgeGreen, { flex: 0.8 }]}>
                  <Text style={styles.statusBadgeGreenText}>Ready</Text>
                </View>
              </View>
            </View>

            {/* Review Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryTitleWrap}>
                  <InfoCircleIcon size={16} color={adminColors.brand} />
                  <Text style={styles.summaryTitle}>Review Summary</Text>
                </View>
                <View style={styles.summaryPillGreen}>
                  <Text style={styles.summaryPillGreenText}>5 Items Selected</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Records</Text>
                <Text style={styles.summaryValue}>5</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price Increase</Text>
                <Text style={styles.summaryValue}>+5.0%</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Effective From</Text>
                <Text style={styles.summaryValue}>20 Oct 2026</Text>
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
                <Text style={styles.wizardPrimaryBtnText}>Continue to Confirm →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: CONFIRM & UPDATE (Image 4 Right) */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.screenHeading}>Final Confirmation</Text>

            {/* Details Box */}
            <View style={styles.detailsCard}>
              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <PackageIcon size={18} color={adminColors.muted} />
                  <Text style={styles.detailRowLabel}>Items to Update</Text>
                </View>
                <Text style={styles.detailRowValue}>12</Text>
              </View>

              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <CalendarIcon size={18} color={adminColors.muted} />
                  <Text style={styles.detailRowLabel}>Effective from</Text>
                </View>
                <Text style={styles.detailRowValue}>02 Nov 2026</Text>
              </View>

              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <RepeatIcon size={18} color={adminColors.muted} />
                  <Text style={styles.detailRowLabel}>Update frequency</Text>
                </View>
                <Text style={styles.detailRowValue}>Daily</Text>
              </View>

              <View style={styles.detailCardRow}>
                <View style={styles.detailRowLabelWrap}>
                  <UserIcon size={18} color={adminColors.muted} />
                  <Text style={styles.detailRowLabel}>Updated by</Text>
                </View>
                <Text style={styles.detailRowValue}>Super admin</Text>
              </View>

              <View style={[styles.detailCardRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailRowLabelWrap}>
                  <SlidersIcon size={18} color={adminColors.muted} />
                  <Text style={styles.detailRowLabel}>Change type</Text>
                </View>
                <Text style={styles.detailRowValue}>Mixed increases</Text>
              </View>
            </View>

            {/* Preview List */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Crop & Grade</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Current Ceiling</Text>
                <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Proposed Ceiling</Text>
                <Text style={[styles.tableColHeader, { flex: 1 }]}>Change</Text>
                <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>Status</Text>
              </View>

              <View style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cropTableName}>Tomato</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <Text style={[styles.changeGreenText, { flex: 1 }]}>+₹5 (+4.2%)</Text>
                <View style={[styles.statusBadgeGreen, { flex: 0.8 }]}>
                  <Text style={styles.statusBadgeGreenText}>Ready</Text>
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cropTableName}>Carrot</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <Text style={[styles.changeGreenText, { flex: 1 }]}>+₹5 (+4.2%)</Text>
                <View style={[styles.statusBadgeGreen, { flex: 0.8 }]}>
                  <Text style={styles.statusBadgeGreenText}>Ready</Text>
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cropTableName}>Onion</Text>
                  <Text style={styles.cropTableGrade}>Grade 1</Text>
                </View>
                <Text style={[styles.tableBodyText, { flex: 1.1 }]}>₹120/kg</Text>
                <Text style={[styles.tableBodyText, { flex: 1.1, fontWeight: '700' }]}>₹125/kg</Text>
                <Text style={[styles.changeGreenText, { flex: 1 }]}>+₹5 (+4.2%)</Text>
                <View style={[styles.statusBadgeGreen, { flex: 0.8 }]}>
                  <Text style={styles.statusBadgeGreenText}>Ready</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.7}>
                <Text style={styles.viewAllLinkText}>View all 12 changes &gt;</Text>
              </TouchableOpacity>
            </View>

            {/* Checkbox Confirmation */}
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

            {/* Notice / Warning Box */}
            <View style={styles.noticeCard}>
              <InfoCircleIcon size={18} color={adminColors.brand} />
              <Text style={styles.noticeCardText}>
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
                <Text style={styles.wizardPrimaryBtnText}>Confirm & Update →</Text>
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
                {filterCrop === item && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke={adminColors.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
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
                {filterGrade === item && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke={adminColors.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  stepperContainer: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  stepperCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dashedLineWrap: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: adminColors.brand,
  },
  stepCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepCircleText: {
    color: adminColors.onBrand,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  stepCircleTextInactive: {
    color: '#9CA3AF',
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    color: adminColors.muted,
    fontSize: 11,
    fontWeight: '500',
    includeFontPadding: false,
  },
  stepLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  screenHeading: {
    color: adminColors.brandDeep,
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    marginBottom: 12,
  },
  filterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  dropdownHalfRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputMiniLabel: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    includeFontPadding: false,
  },
  dropdownBox: {
    height: 40,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBoxText: {
    color: adminColors.ink,
    fontSize: 13,
    includeFontPadding: false,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  modeToggleBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  modeToggleText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  modeToggleTextActive: {
    color: adminColors.onBrand,
  },
  modeValueInputWrap: {
    height: 40,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: adminColors.card,
  },
  modeValueInput: {
    flex: 1,
    color: adminColors.ink,
    fontSize: 13,
    padding: 0,
    includeFontPadding: false,
  },
  modeValueUnit: {
    color: adminColors.muted,
    fontSize: 13,
    includeFontPadding: false,
  },
  datePickerWrap: {
    height: 40,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: adminColors.card,
  },
  datePickerText: {
    color: adminColors.ink,
    fontSize: 13,
    includeFontPadding: false,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF4ED',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6DC',
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
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: adminColors.border,
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
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: adminColors.card,
  },
  tableCheckboxActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxCheck: {
    color: adminColors.onBrand,
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  cropTableName: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
    marginRight: 4,
  },
  cropTableGrade: {
    color: adminColors.muted,
    fontSize: 11,
    includeFontPadding: false,
  },
  gradePeachBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  gradePeachText: {
    color: adminColors.brandDeep,
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  currentCeilingCell: {
    flex: 1.1,
    color: adminColors.muted,
    fontSize: 13,
    includeFontPadding: false,
  },
  proposedBoxCell: {
    flex: 0.9,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
  },
  proposedBoxText: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  changePercentCell: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  changePercentText: {
    color: adminColors.success.text,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  summaryCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    padding: 12,
    marginBottom: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTitle: {
    color: adminColors.brandDeep,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  summaryPillGreen: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  summaryPillGreenText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    color: adminColors.ink,
    fontSize: 12,
    includeFontPadding: false,
  },
  summaryValue: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  wizardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  wizardSecondaryBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardSecondaryBtnText: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
  },
  wizardPrimaryBtn: {
    flex: 1.2,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  wizardPrimaryBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 10,
    alignItems: 'center',
  },
  kpiCardWarning: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.border,
  },
  kpiNumber: {
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '800',
    includeFontPadding: false,
    lineHeight: 22,
  },
  kpiLabel: {
    color: adminColors.muted,
    fontSize: 10,
    marginTop: 2,
    includeFontPadding: false,
  },
  tableBodyText: {
    color: adminColors.ink,
    fontSize: 12,
    includeFontPadding: false,
  },
  changeGreenText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  statusBadgeGreen: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  statusBadgeGreenText: {
    color: adminColors.success.text,
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  detailCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: adminColors.border,
  },
  detailRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRowLabel: {
    color: adminColors.ink,
    fontSize: 13,
    includeFontPadding: false,
  },
  detailRowValue: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  viewAllRow: {
    alignItems: 'center',
    paddingTop: 10,
  },
  viewAllLinkText: {
    color: adminColors.brand,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkboxLabelText: {
    flex: 1,
    color: adminColors.ink,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
  },
  noticeCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  noticeCardText: {
    flex: 1,
    color: adminColors.brandDeep,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
  },
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
