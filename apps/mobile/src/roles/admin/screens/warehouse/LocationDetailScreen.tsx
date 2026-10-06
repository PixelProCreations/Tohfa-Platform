import React from 'react';
import {
  Platform,
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
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
  trackBg: '#EAE5DE',
  fillColor: '#F0562A',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface LocationDetailScreenProps {
  locationId?: string;
  onBack?: () => void;
  onViewProductDetail?: (productName: string) => void;
}

export function LocationDetailScreen({
  locationId = 'LOC-COO-A02-S03',
  onBack,
  onViewProductDetail,
}: LocationDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Rack 02 · Shelf 03</Text>
        </View>
        <Text style={styles.headerSubtitle}>Coonoor Warehouse · Occupied</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Location Information ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Location Information</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Location ID</Text>
              <Text style={styles.fieldValue}>{locationId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>Coonoor</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Section</Text>
              <Text style={styles.fieldValue}>A</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Rack / Shelf</Text>
              <Text style={styles.fieldValue}>02 / 03</Text>
            </View>
          </View>
        </View>

        {/* ─── Occupancy ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Occupancy</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.linkText}>Detail →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '68%' }]} />
          </View>
          <Text style={styles.occupancySub}>Current 68%</Text>
        </View>

        {/* ─── Stored Stock ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Stored Stock</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.linkText}>View →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.stockItemRow}
            onPress={() => onViewProductDetail?.('Tomato G1')}
            activeOpacity={0.7}
          >
            <Text style={styles.stockName}>Tomato G1</Text>
            <Text style={styles.stockQty}>140 KG</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.stockItemRow}
            onPress={() => onViewProductDetail?.('Carrot G1')}
            activeOpacity={0.7}
          >
            <Text style={styles.stockName}>Carrot G1</Text>
            <Text style={styles.stockQty}>80 KG</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer Note */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This is not a stock-editing screen — tapping a product always deep-links into Module 3's Product/Batch Detail rather than opening a second inventory system here.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 38,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.orangeDeep,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: PALETTE.trackBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PALETTE.fillColor,
    borderRadius: 4,
  },
  occupancySub: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  stockItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stockName: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  stockQty: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  disclaimerBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderColor: PALETTE.noticeBorderOrange,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
  },
});
