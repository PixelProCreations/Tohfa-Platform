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
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseMaterialDetailScreenProps {
  materialId: string;
  onBack: () => void;
}

export function SubWarehouseMaterialDetailScreen({
  materialId,
  onBack,
}: SubWarehouseMaterialDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Material Detail</Text>
          <Text style={styles.headerSub}>Packaging Box</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Material Information */}
        <Text style={styles.sectionTitle}>Material Information</Text>
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Material Name</Text>
              <Text style={styles.value}>Packaging Box</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Material ID</Text>
              <Text style={styles.value}>MAT-0021</Text>
            </View>
          </View>
          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value}>Packaging</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Unit</Text>
              <Text style={styles.value}>Units</Text>
            </View>
          </View>
          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>Available</Text>
            </View>
          </View>
        </View>

        {/* Quantity */}
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.qtyRow}>
          <View style={styles.qtyCard}>
            <Text style={styles.qtyVal}>120</Text>
            <Text style={styles.qtyLabel}>CURRENT</Text>
          </View>
          <View style={styles.qtyCard}>
            <Text style={styles.qtyVal}>20</Text>
            <Text style={styles.qtyLabel}>RESERVED</Text>
          </View>
          <View style={styles.qtyCard}>
            <Text style={styles.qtyVal}>100</Text>
            <Text style={styles.qtyLabel}>AVAILABLE</Text>
          </View>
        </View>

        {/* Warehouse */}
        <Text style={styles.sectionTitle}>Warehouse</Text>
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Warehouse</Text>
              <Text style={styles.value}>Coonoor Warehouse</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Storage Location</Text>
              <Text style={styles.value}>Material Storage Area</Text>
            </View>
          </View>
        </View>

        {/* Material History */}
        <Text style={styles.sectionTitle}>Material History</Text>
        <View style={styles.historyList}>
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Issued</Text>
            <Text style={styles.historyDesc}>20 Units · Reason: Order Fulfillment</Text>
            <View style={styles.historyFooter}>
              <Text style={styles.historyMeta}>By Suresh · SWA</Text>
              <Text style={styles.historyMeta}>24 Sep, 09:50 AM</Text>
            </View>
          </View>
          
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Received</Text>
            <Text style={styles.historyDesc}>50 Units · From Main Warehouse</Text>
            <View style={styles.historyFooter}>
              <Text style={styles.historyMeta}>By Suresh · SWA</Text>
              <Text style={styles.historyMeta}>22 Sep, 11:10 AM</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
          <UploadIcon color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Issue Material</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 100 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk, marginTop: 8, marginBottom: 12 },
  card: { backgroundColor: PALETTE.cardBg, borderRadius: 16, borderWidth: 1, borderColor: PALETTE.border, padding: 16, marginBottom: 16 },
  rowTwoCol: { flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 6 },
  value: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk },

  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  qtyCard: { flex: 1, backgroundColor: PALETTE.cardBg, borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, paddingVertical: 20, alignItems: 'center' },
  qtyVal: { fontSize: 22, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  qtyLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textSecondary },

  historyList: { gap: 12 },
  historyCard: { backgroundColor: PALETTE.cardBg, borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 16 },
  historyTitle: { fontSize: 15, fontWeight: '800', color: '#B45309', marginBottom: 6 },
  historyDesc: { fontSize: 13, color: PALETTE.textInk, marginBottom: 12 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  historyMeta: { fontSize: 11, color: PALETTE.textSecondary },

  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
