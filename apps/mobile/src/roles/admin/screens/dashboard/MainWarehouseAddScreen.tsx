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
  pillBg: '#FAF7F2',
  pillActiveBg: '#E08331',
  warningBg: '#FDF0E5',
  warningText: '#8A5A30',
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

export function MainWarehouseAddScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [warehouseType, setWarehouseType] = useState('Main Storage');
  const [location, setLocation] = useState('Gudalur Market');

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.inputLabel}>Warehouse Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Gudalur Storage Facility" 
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Warehouse Type</Text>
            <View style={styles.pillRow}>
              {['Main Storage', 'Market Storage', 'Cold Storage'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.pill, warehouseType === type && styles.pillActive]}
                  onPress={() => setWarehouseType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, warehouseType === type && styles.pillTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.pillRow}>
              {['Ooty', 'Coonoor', 'Gudalur Market'].map(loc => (
                <TouchableOpacity 
                  key={loc} 
                  style={[styles.pill, location === loc && styles.pillActive]}
                  onPress={() => setLocation(loc)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, location === loc && styles.pillTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <Text style={styles.inputLabel}>Primary Contact Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Full name" 
              placeholderTextColor="#9CA3AF"
            />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.sectionTitle}>Capacity</Text>
            
            <Text style={styles.inputLabel}>Total Warehouse Capacity</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter capacity" 
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
            
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>Capacity numbers are never pre-filled or assumed.</Text>
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.sectionTitle}>Documents</Text>
            
            <View style={styles.docCard}>
              <Text style={styles.docTitle}>Warehouse Registration</Text>
              <View style={styles.docBottomRow}>
                <Text style={styles.docSub}>Not uploaded</Text>
                <Text style={styles.docRequired}>Required</Text>
              </View>
            </View>
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.sectionTitle}>Review</Text>
            
            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Warehouse Name</Text>
                  <Text style={styles.reviewValue}>Gudalur Storage Facility</Text>
                </View>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Location</Text>
                  <Text style={styles.reviewValue}>Gudalur Market</Text>
                </View>
              </View>
            </View>
          </>
        );
      case 6:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <SuccessCheckIcon />
            </View>
            <Text style={styles.successTitle}>Warehouse Created</Text>
            <Text style={styles.successSub}>Gudalur Storage Facility has been added.</Text>
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
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Next: Contact</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.primaryBtnText}>Next: Operating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.primaryBtnText}>Next: Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(5)}>
              <Text style={styles.primaryBtnText}>Next: Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(6)}>
              <Text style={styles.primaryBtnText}>Create Warehouse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 6:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
              <Text style={styles.primaryBtnText}>View Warehouse</Text>
            </TouchableOpacity>
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 6 ? 'Warehouse Created' : 'Add Warehouse'}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

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
  
  sectionTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8A5A30', marginBottom: 16 },
  
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

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
  },
  pillActive: {
    backgroundColor: PALETTE.pillActiveBg,
    borderColor: PALETTE.pillActiveBg,
  },
  pillText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: '#6B7280' },
  pillTextActive: { color: '#FFFFFF', fontWeight: '800' },

  warningBanner: {
    backgroundColor: PALETTE.warningBg,
    borderRadius: 8,
    padding: 12,
  },
  warningText: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: PALETTE.warningText },

  docCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: 12,
    padding: 16,
  },
  docTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 12 },
  docBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docSub: { fontFamily: 'Poppins', fontSize: 12, color: '#6B7280' },
  docRequired: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: '#E08331' },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: 12,
    padding: 16,
  },
  reviewRow: { flexDirection: 'row' },
  reviewCol: { flex: 1 },
  reviewLabel: { fontFamily: 'Poppins', fontSize: 11, color: '#6B7280', marginBottom: 4 },
  reviewValue: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#000' },

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
  successTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 8 },
  successSub: { fontFamily: 'Poppins', fontSize: 12, color: '#6B7280', textAlign: 'center' },

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
