import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textDark: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseVoucherDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voucher Detail</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Voucher Detail</Text>

        {/* Voucher Info */}
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Voucher Number</Text>
              <Text style={styles.gridValue}>VCH-000821</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Type</Text>
              <Text style={styles.gridValue}>Expense</Text>
            </View>
          </View>
          
          <View style={[styles.gridRow, { marginTop: 16 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Related Transaction</Text>
              <Text style={styles.gridValue}>EXP-001245</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Amount</Text>
              <Text style={styles.gridValue}>₹2,400</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 16 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Warehouse</Text>
              <Text style={styles.gridValue}>Coonoor</Text>
            </View>
          </View>
        </View>

        {/* Big Receipt/Voucher Presentation */}
        <View style={styles.receiptCard}>
          <Text style={styles.receiptHeader}>TOHFA — Coonoor Warehouse</Text>
          <Text style={styles.receiptSubHeader}>PAYMENT VOUCHER</Text>
          <Text style={styles.receiptAmount}>₹2,400</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.75}>
            <Text style={styles.outlineBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.75}>
            <Text style={styles.outlineBtnText}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            No Approve Voucher or Reject Voucher action exists — no voucher approval workflow is invented here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  headerBanner: { backgroundColor: '#F0562A', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 2 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#8B5E3C', marginBottom: 12 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 16, marginBottom: 16 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { flex: 1 },
  gridLabel: { fontSize: 12, fontWeight: '600', color: PALETTE.textSecondary, marginBottom: 4 },
  gridValue: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark },
  receiptCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, borderStyle: 'dashed', padding: 24, alignItems: 'center', marginBottom: 16 },
  receiptHeader: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 12, letterSpacing: 0.5 },
  receiptSubHeader: { fontSize: 15, fontWeight: '800', color: '#A0522D', marginBottom: 16, letterSpacing: 1 },
  receiptAmount: { fontSize: 32, fontWeight: '900', color: '#1E1612' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: '#F0562A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '800', color: '#A0522D' },
  noticeCard: { backgroundColor: '#FAF7F2', borderRadius: 8, borderWidth: 1, borderColor: PALETTE.border, padding: 12 },
  noticeText: { fontSize: 12, fontWeight: '600', color: '#4B5563', lineHeight: 18 },
});
