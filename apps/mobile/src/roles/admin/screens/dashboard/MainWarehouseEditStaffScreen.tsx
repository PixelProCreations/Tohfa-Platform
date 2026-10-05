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
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  btnOrange: '#E88B38',
  successBg: '#E8F5E9',
  successText: '#15803D',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

export function MainWarehouseEditStaffScreen({ onBack, onComplete }: { onBack: () => void, onComplete: () => void }) {
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  if (step === 'success') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile Updated</Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <CheckCircleIcon />
            </View>
            <Text style={styles.successTitle}>Profile Updated</Text>
            <Text style={styles.successDesc}>Driver profile information has been updated.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onComplete} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Back to Staff List</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => setStep('form')} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Staff Detail</Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Save Changes?</Text>
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>The driver profile will be updated.</Text>
              </View>
              <TouchableOpacity style={styles.confirmApproveBtn} onPress={() => setStep('success')}>
                <Text style={styles.confirmApproveBtnText}>Confirm Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setStep('form')}>
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Form Step
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Driver Profile</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Edit Driver Profile</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver Name</Text>
            <TextInput style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact</Text>
            <TextInput style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Details</Text>
            <TextInput style={styles.input} />
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('confirm')} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
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
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  sectionTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 16 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: '#000', marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#000',
  },

  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.btnOrange,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryBtnText: { fontFamily: 'Poppins', color: '#557B83', fontSize: 14, fontWeight: '800' },

  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0562A',
    padding: 16,
  },
  confirmTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.brownText, marginBottom: 16 },
  confirmBox: {
    backgroundColor: '#F4F0EB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmText: { fontFamily: 'Poppins', fontSize: 12, color: '#333' },
  confirmApproveBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.successText,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmApproveBtnText: { fontFamily: 'Poppins', color: PALETTE.successText, fontSize: 14, fontWeight: '800' },
  confirmCancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmCancelBtnText: { fontFamily: 'Poppins', color: '#333', fontSize: 14, fontWeight: '800' },

  successContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.successBg,
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
