import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const PALETTE = {
  primary: '#E08331',
  headerOrange: '#E08331',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  greenText: '#15803D',
  amberText: '#D97706',
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

function BanIcon({ size = 16, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function MainWarehouseDocumentsScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity style={styles.docCard} onPress={() => setStep(2)} activeOpacity={0.8}>
              <Text style={styles.docTitle}>Warehouse Registration</Text>
              <Text style={styles.docSub}>DOC-00125</Text>
              <View style={styles.divider} />
              <View style={styles.docFooter}>
                <Text style={[styles.docStatus, {color: PALETTE.greenText}]}>Active</Text>
                <Text style={styles.docDate}>Expires 31 Dec 2026</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.docCard} onPress={() => setStep(2)} activeOpacity={0.8}>
              <Text style={styles.docTitle}>Compliance Document</Text>
              <Text style={styles.docSub}>DOC-00126</Text>
              <View style={styles.divider} />
              <View style={styles.docFooter}>
                <Text style={[styles.docStatus, {color: PALETTE.amberText}]}>Expiring Soon</Text>
                <Text style={styles.docDate}>Expires 15 Oct 2026</Text>
              </View>
            </TouchableOpacity>

          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.cardFull}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Document Name</Text>
                  <Text style={styles.cardValue}>Warehouse Registration</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Document ID</Text>
                  <Text style={styles.cardValue}>DOC-00125</Text>
                </View>
              </View>
              <View style={[styles.row, {marginTop: 16}]}>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Status</Text>
                  <Text style={styles.cardValue}>Active</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Expiry</Text>
                  <Text style={styles.cardValue}>31 Dec 2026</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>View</Text>
              </TouchableOpacity>
              <View style={{width: 12}} />
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Download</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.warningBanner, {backgroundColor: PALETTE.dangerBg, flexDirection: 'row', alignItems: 'center'}]}>
              <BanIcon />
              <View style={{width: 8}} />
              <Text style={[styles.warningText, {color: PALETTE.dangerText}]}>No Edit, Delete, Replace, Approve or Verify here.</Text>
            </View>

          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={step === 1 ? onBack : () => setStep(prev => prev - 1)} style={styles.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 1 ? 'Warehouse Documents' : 'Document Detail'}</Text>
      </View>

      {renderContent()}
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
  
  docCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  docTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 2 },
  docSub: { fontFamily: 'Poppins', fontSize: 11, color: '#6B7280', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: -16, marginBottom: 12 },
  docFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docStatus: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800' },
  docDate: { fontFamily: 'Poppins', fontSize: 11, color: '#4B5563' },

  cardFull: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 24,
  },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  cardLabel: { fontFamily: 'Poppins', fontSize: 11, color: '#6B7280', marginBottom: 4 },
  cardValue: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#000' },

  actionRow: { flexDirection: 'row', marginBottom: 24 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E08331',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8A5A30' },

  warningBanner: {
    backgroundColor: '#FDF0E5',
    borderRadius: 8,
    padding: 12,
  },
  warningText: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#8A5A30' },
});
