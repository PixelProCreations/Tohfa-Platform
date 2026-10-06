import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MainWarehouseReturnReportDetailScreen } from './MainWarehouseReturnReportDetailScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
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

export function MainWarehouseReturnsReportScreen({ onBack }: { onBack: () => void }) {
  const [selectedRecord, setSelectedRecord] = useState(false);

  if (selectedRecord) {
    return <MainWarehouseReturnReportDetailScreen onBack={() => setSelectedRecord(false)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Returns Report</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Total Returns</Text>
              <Text style={styles.kpiValue}>22</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Pending</Text>
              <Text style={styles.kpiValue}>5</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Completed</Text>
              <Text style={styles.kpiValue}>15</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Refunded</Text>
              <Text style={styles.kpiValue}>14</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.recordCard} onPress={() => setSelectedRecord(true)} activeOpacity={0.8}>
            <Text style={styles.recordId}>Record #001245</Text>
            <Text style={styles.recordSub}>Tap to view full detail</Text>
          </TouchableOpacity>
          
        </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiBox: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  kpiLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 8 },
  kpiValue: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: PALETTE.textInk },
  recordCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginTop: 8,
  },
  recordId: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  recordSub: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.textSecondary, marginTop: 4, fontWeight: '500' },
});
