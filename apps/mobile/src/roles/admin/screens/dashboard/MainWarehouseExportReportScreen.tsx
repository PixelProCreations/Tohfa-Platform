import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  infoBg: '#FAEBE6',
  infoText: '#C47432',
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryText: '#557B83',
  successBg: '#E8F5E9',
  successText: '#15803D',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 48, color = '#15803D' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseExportReportScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <View
            key={idx}
            style={[
              styles.progressSegment,
              idx <= step ? styles.progressSegmentActive : styles.progressSegmentInactive
            ]}
          />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Step 1 — Select Report</Text>
            <View style={styles.optionSelected}>
              <Text style={styles.optionTextSelected}>Sales Report</Text>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Step 2 — Report Period</Text>
            <Text style={styles.inputLabel}>From</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>01 Sep 2026</Text>
            </View>
            <Text style={styles.inputLabel}>To</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>25 Sep 2026</Text>
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Step 3 — Filters</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Only filters relevant to the selected report type are shown.</Text>
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Step 4 — Export Format</Text>
            <View style={styles.optionBox}>
              <Text style={styles.optionText}>Excel</Text>
            </View>
            <View style={styles.optionBox}>
              <Text style={styles.optionText}>PDF</Text>
            </View>
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>Step 5 — Review</Text>
            <View style={styles.reviewCard}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.reviewLabel}>Report</Text>
                  <Text style={styles.reviewValue}>Sales Report</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.reviewLabel}>Warehouse</Text>
                  <Text style={styles.reviewValue}>All Warehouses</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.reviewLabel}>Period</Text>
                  <Text style={styles.reviewValue}>01 Sep – 25 Sep 2026</Text>
                </View>
              </View>
              <View style={[styles.row, {marginBottom: 0}]}>
                <View style={styles.col}>
                  <Text style={styles.reviewLabel}>Format</Text>
                  <Text style={styles.reviewValue}>Excel</Text>
                </View>
              </View>
            </View>
          </>
        );
      case 6:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <CheckCircleIcon />
            </View>
            <Text style={styles.successTitle}>Report Generated</Text>
            <Text style={styles.successDesc}>Sales Report · All Warehouses · Excel</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Report</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {step < 6 && renderProgressBar()}
        
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
      
      <View style={styles.footer}>
        {step === 6 ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Download Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Generate Another</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>{step === 5 ? 'Generate Report' : 'Next'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: { backgroundColor: '#8A5A30' },
  progressSegmentInactive: { backgroundColor: '#E2DCD2' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  stepTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 16 },
  
  // Step 1 & 4
  optionSelected: {
    backgroundColor: '#FAEEE3',
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionTextSelected: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText },
  optionBox: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.textInk },
  
  // Step 2
  inputLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#1E1612', marginBottom: 8 },
  inputBox: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  inputText: { fontFamily: 'Poppins', fontSize: 13, color: '#333' },
  
  // Step 3
  infoBox: {
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 8,
  },
  infoText: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.infoText, fontWeight: '600' },
  
  // Step 5
  reviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    padding: 16,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  reviewLabel: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.textSecondary, marginBottom: 4, fontWeight: '600' },
  reviewValue: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.textInk },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: '#E88B38', // Muted orange from screenshots for Next btn
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EBE5DC',
  },
  secondaryBtnText: { fontFamily: 'Poppins', color: '#8A5A30', fontSize: 14, fontWeight: '800' }, // Match brown from SS

  // Step 6 (Success)
  successContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  successDesc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
