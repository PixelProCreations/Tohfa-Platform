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
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  inputBorder: '#E5E7EB',
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryBorder: '#E5E7EB',
  greenText: '#15803D',
  pillBg: '#FAF7F2',
  pillActiveBg: '#F0562A',
  dangerBg: '#FDF2F2',
  dangerText: '#DC2626',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserActiveIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke="#8A5A30" strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke="#8A5A30" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UserUnassignedIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke="#9CA3AF" strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="4" x2="20" y2="20" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AddUserIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M17 21c0-4-3-7-8-7s-8 3-8 7M19 8v6M16 11h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function BanIcon({ size = 16, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function MainWarehouseManageSWAsScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [adminName, setAdminName] = useState('');
  const [warehouse, setWarehouse] = useState('Gudalur Market');

  const getHeaderTitle = () => {
    switch (step) {
      case 1: return 'Sub Warehouse Admins';
      case 2:
      case 3:
      case 4:
      case 5:
        return 'Create Sub Warehouse Admin';
      case 6: return 'Admin Created';
      case 7: return 'Sub Warehouse Admin';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              <View style={styles.cardHalf}>
                <Text style={styles.cardLabel}>TOTAL SWAs</Text>
                <Text style={styles.cardValue}>3</Text>
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.cardLabel}>PENDING</Text>
                <Text style={[styles.cardValue, {color: '#D97706'}]}>1</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.listItem} onPress={() => setStep(7)} activeOpacity={0.8}>
              <View style={styles.avatarWrapActive}>
                <UserActiveIcon />
              </View>
              <View style={styles.listItemTextWrap}>
                <Text style={styles.listItemTitle}>Karthik Kumar</Text>
                <Text style={styles.listItemSub}>SWA-002 · Coonoor · Active</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.listItem}>
              <View style={styles.avatarWrapUnassigned}>
                <UserUnassignedIcon />
              </View>
              <View style={styles.listItemTextWrap}>
                <Text style={[styles.listItemTitle, {color: '#6B7280'}]}>Unassigned</Text>
                <Text style={styles.listItemSub}>Gudalur Market - No SWA</Text>
              </View>
            </View>
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Admin Information</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              value={adminName}
              onChangeText={setAdminName}
            />
          </ScrollView>
        );
      case 3:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Warehouse Assignment</Text>
            <View style={styles.pillRow}>
              {['Gudalur Market'].map(loc => (
                <TouchableOpacity 
                  key={loc} 
                  style={[styles.pill, warehouse === loc && styles.pillActive]}
                  onPress={() => setWarehouse(loc)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, warehouse === loc && styles.pillTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        );
      case 4:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Review</Text>
            <View style={styles.cardFull}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Name</Text>
                  <Text style={styles.cardValue}>{adminName || 'New Admin'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Assigned Warehouse</Text>
                  <Text style={styles.cardValue}>{warehouse}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      case 5:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.cardFull, {borderColor: PALETTE.primary, borderWidth: 1}]}>
              <Text style={[styles.sectionTitle, {marginTop: 0, marginBottom: 16}]}>Create Sub Warehouse Admin?</Text>
              <TouchableOpacity style={styles.confirmOutlineBtn} onPress={() => setStep(6)}>
                <Text style={styles.confirmOutlineBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      case 6:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <SuccessCheckIcon />
            </View>
            <Text style={styles.successTitle}>Sub Warehouse Admin Created</Text>
          </View>
        );
      case 7:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.cardFull, {alignItems: 'center', paddingTop: 24}]}>
              <View style={[styles.avatarWrapActive, {marginRight: 0, marginBottom: 12}]}>
                <UserActiveIcon />
              </View>
              <Text style={[styles.listItemTitle, {fontSize: 16}]}>Karthik Kumar</Text>
              <Text style={styles.listItemSub}>Admin ID: SWA-002 · Active</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Warehouse Assignment</Text>
            <View style={styles.cardFull}>
              <Text style={styles.cardLabel}>Assigned Warehouse</Text>
              <Text style={styles.cardValue}>Coonoor Warehouse</Text>
            </View>

            <Text style={styles.sectionTitle}>Responsibility Summary</Text>
            <View style={[styles.cardFull, {padding: 12}]}>
              <View style={styles.pillRow}>
                {['Goods Receiving', 'Inventory', 'Orders', 'Sales', 'Finance'].map(r => (
                  <View key={r} style={[styles.pill, {backgroundColor: '#FAF7F2'}]}>
                    <Text style={[styles.pillText, {fontSize: 11, fontWeight: '800', color: '#4B5563'}]}>{r}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>This summarizes the SWA's existing warehouse scope — not new permissions granted from here.</Text>
            </View>

            <View style={[styles.warningBanner, {backgroundColor: PALETTE.dangerBg, flexDirection: 'row', alignItems: 'center', marginTop: 12}]}>
              <BanIcon />
              <View style={{width: 8}} />
              <Text style={[styles.warningText, {color: PALETTE.dangerText, flex: 1}]}>No status-changing action here beyond what the permission matrix confirms.</Text>
            </View>
          </ScrollView>
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
              <AddUserIcon />
              <View style={{width: 8}} />
              <Text style={styles.primaryBtnText}>Create Sub Warehouse Admin</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.primaryBtnText}>Next: Warehouse Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.primaryBtnText}>Next: Review</Text>
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
              <Text style={styles.primaryBtnText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
      case 7:
        return null;
      case 6:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.primaryBtnText}>Back to Sub Warehouse Admins</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={step === 1 || step === 7 ? onBack : () => setStep(prev => prev - 1)} style={styles.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
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
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  cardHalf: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  cardFull: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 24,
  },
  
  cardLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#4B5563', marginBottom: 8 },
  cardValue: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#000' },
  
  row: { flexDirection: 'row' },
  col: { flex: 1 },

  listItem: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF0E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarWrapUnassigned: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listItemTextWrap: { flex: 1 },
  listItemTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 2 },
  listItemSub: { fontFamily: 'Poppins', fontSize: 11, color: '#6B7280' },

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
    backgroundColor: '#FDF0E5',
    borderRadius: 8,
    padding: 12,
  },
  warningText: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#8A5A30' },

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
