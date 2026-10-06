import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A', // Vibrant Brand Orange
  headerBg:      '#F0562A',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14', // Deep Terracotta / Mahogany for section headings
  pageBg:        '#F3EFE9', // App canvas soft cream

  textInk:       '#1A1A1A', // Pitch ink for values and titles
  textSecondary: '#5F5E5A', // Muted label color
  border:        '#EEDCD3', // Card and input borders
  cardBg:        '#FFFFFF',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 11, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayCircleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Polygon points="10,8 16.5,12 10,16" fill={color} />
    </Svg>
  );
}

export interface StartReceivingScreenProps {
  shipmentId?: string;
  source?: string;
  destination?: string;
  expectedProduct?: string;
  expectedQty?: string;
  mwaName?: string;
  warehouse?: string;
  onBack?: () => void;
  onConfirmStartReceiving?: () => void;
}

export function StartReceivingScreen({
  shipmentId = 'SHP-000124',
  source = 'Farmer Admin',
  destination = 'Coonoor',
  expectedProduct = 'Tomato',
  expectedQty = '500 KG',
  mwaName = 'Suresh',
  warehouse = 'Coonoor',
  onBack,
  onConfirmStartReceiving,
}: StartReceivingScreenProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Start Receiving</Text>
        </View>
        <Text style={styles.headerSubtitle}>{shipmentId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Shipment Confirmation ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Shipment Confirmation</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Source</Text>
              <Text style={styles.gridValue}>{source}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Destination</Text>
              <Text style={styles.gridValue}>{destination}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Product</Text>
              <Text style={styles.gridValue}>{expectedProduct}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Qty</Text>
              <Text style={styles.gridValue}>{expectedQty}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Receiver Information ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Receiver Information</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>MWA</Text>
              <Text style={styles.gridValue}>{mwaName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Warehouse</Text>
              <Text style={styles.gridValue}>{warehouse}</Text>
            </View>
          </View>
        </View>

        {/* ─── Checkbox Confirmation ─── */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
            {confirmed && <CheckmarkIcon size={11} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxText}>
            I confirm that the physical shipment has arrived and I am starting the receiving inspection.
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onConfirmStartReceiving}
          activeOpacity={0.8}
        >
          <PlayCircleIcon size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Start Receiving</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#756E66',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1.5,
  },
  checkboxActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    lineHeight: 18.5,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
