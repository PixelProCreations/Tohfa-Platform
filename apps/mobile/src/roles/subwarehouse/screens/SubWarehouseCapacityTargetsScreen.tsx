import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#E08331',
  headerOrange: '#E08331',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  inputBorder: '#E5E7EB',
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryBorder: '#E5E7EB',
  warningBg: '#FDF0E5',
  warningText: '#8A5A30',
  greenText: '#15803D',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 32, color = '#15803D' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SubWarehouseCapacityTargetsScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [capacityStr, setCapacityStr] = useState('10000');
  
  const handleEditCapacity = () => setStep(2);
  const handleReview = () => setStep(3);
  const handleUpdate = () => setStep(4);
  const handleConfirm = () => setStep(5);

  const getHeaderTitle = () => {
    switch (step) {
      case 1: return 'Capacity & Targets';
      case 2: return 'Edit Capacity';
      case 3: return 'Review Changes';
      case 4: return 'Capacity & Targets';
      case 5: return 'Capacity Updated';
      default: return 'Capacity';
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              <View style={styles.cardHalf}>
                <Text style={styles.cardLabel}>TOTAL CAPACITY</Text>
                <Text style={styles.cardValue}>10,000 kg</Text>
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.cardLabel}>USED</Text>
                <Text style={styles.cardValue}>7,420 kg</Text>
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.cardLabel}>AVAILABLE</Text>
                <Text style={styles.cardValue}>2,580 kg</Text>
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.cardLabel}>UTILIZATION</Text>
                <Text style={styles.cardValue}>74.2%</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Warehouse Targets</Text>
            <View style={styles.cardFull}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Receiving Target</Text>
                  <Text style={styles.cardValue}>500 kg/day</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Sales Target</Text>
                  <Text style={styles.cardValue}>₹25,000/day</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Edit Capacity</Text>
            <Text style={styles.inputLabel}>Total Warehouse Capacity (kg)</Text>
            <TextInput
              style={styles.input}
              value={capacityStr}
              onChangeText={setCapacityStr}
              keyboardType="numeric"
            />
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>Changing capacity here never modifies inventory.</Text>
            </View>
          </ScrollView>
        );
      case 3:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Review Changes</Text>
            <View style={styles.cardFull}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Current Capacity</Text>
                  <Text style={styles.cardValue}>10,000 kg</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>New Capacity</Text>
                  <Text style={styles.cardValue}>{capacityStr} kg</Text>
                </View>
              </View>
              <View style={{marginTop: 16}}>
                <Text style={styles.cardLabel}>Difference</Text>
                <Text style={[styles.cardValue, {color: PALETTE.greenText}]}>+0 kg</Text>
              </View>
            </View>
          </ScrollView>
        );
      case 4:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.cardFull, {borderColor: PALETTE.primary, borderWidth: 1}]}>
              <Text style={[styles.sectionTitle, {marginTop: 0, marginBottom: 16}]}>Update warehouse capacity?</Text>
              <TouchableOpacity style={styles.confirmOutlineBtn} onPress={handleConfirm}>
                <Text style={styles.confirmOutlineBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      case 5:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <SuccessCheckIcon />
            </View>
            <Text style={styles.successTitle}>Warehouse capacity updated.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEditCapacity}>
              <Text style={styles.primaryBtnText}>Edit Capacity</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleReview}>
              <Text style={styles.primaryBtnText}>Review Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate}>
              <Text style={styles.primaryBtnText}>Update Capacity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return null;
      case 5:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={step === 1 || step === 5 ? onBack : () => setStep(prev => prev - 1)} style={styles.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      {renderContent()}
      {renderFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  cardHalf: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  cardFull: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 24,
  },
  
  cardLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 4 },
  cardValue: { fontFamily: 'Poppins', fontSize: 16, fontWeight: '800', color: '#000' },
  
  row: { flexDirection: 'row' },
  col: { flex: 1 },

  sectionTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8A5A30', marginBottom: 16, marginTop: 8 },
  
  inputLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
  },

  warningBanner: {
    backgroundColor: PALETTE.warningBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFE0D3',
  },
  warningText: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: '#6B7280' },

  confirmOutlineBtn: {
    borderWidth: 1,
    borderColor: PALETTE.greenText,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmOutlineBtnText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.greenText },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontFamily: 'Poppins', fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 8, textAlign: 'center' },

  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  secondaryBtn: {
    backgroundColor: PALETTE.btnSecondaryBg,
    borderWidth: 1,
    borderColor: PALETTE.btnSecondaryBorder,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#4B5563' },
});
