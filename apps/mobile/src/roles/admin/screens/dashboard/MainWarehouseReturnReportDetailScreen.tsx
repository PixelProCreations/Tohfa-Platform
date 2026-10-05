import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  infoBg: '#F4EFEB',
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

export function MainWarehouseReturnReportDetailScreen({ onBack }: { onBack: () => void }) {
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
          
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Record</Text>
                <Text style={styles.value}>#001245</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse</Text>
                <Text style={styles.value}>Coonoor</Text>
              </View>
            </View>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>25 Sep 2026</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Deep-links to the owning module for the actual record — never a duplicate workflow.</Text>
          </View>
          
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
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#555', marginBottom: 4 },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  infoBox: {
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },
});
