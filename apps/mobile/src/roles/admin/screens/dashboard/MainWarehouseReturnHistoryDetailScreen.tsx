import React from 'react';
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
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  greenIcon: '#059669',
  brownText: '#8A5A30',
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

function FilterIcon({ color = '#FFF', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MainWarehouseReturnHistoryDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>RMA Detail</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={onBack} activeOpacity={0.8}>
            <FilterIcon color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>RMA</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>RMA</Text>
                <Text style={styles.value}>RMA-2026-00125</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>Ravi Kumar</Text>
              </View>
            </View>
            
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Decision</Text>
                <Text style={styles.value}>Approved</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Refund</Text>
                <Text style={styles.value}>₹375</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.card}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Return Requested</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Return Approved</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
              </View>
              <View style={[styles.timelineTextCol, { paddingBottom: 0 }]}>
                <Text style={styles.timelineTitle}>Wallet Credited</Text>
              </View>
            </View>
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 8, marginTop: 4 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', marginBottom: 20 },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '600', color: PALETTE.textSecondary, marginBottom: 4 },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: PALETTE.greenIcon,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.greenIcon,
  },
  timelineLine: {
    width: 1.5,
    height: 30,
    backgroundColor: '#EBE5DC',
    marginVertical: 4,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
});
