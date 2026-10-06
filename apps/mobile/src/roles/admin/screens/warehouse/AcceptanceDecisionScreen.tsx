import React, { useState } from 'react';
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
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FFF7F1',
  noticeBorderOrange: '#FCDCCB',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  cardBg:             '#FFFFFF',

  greenIcon:          '#168038',
  redIcon:            '#E24B4A',
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

function CheckCircleIcon({ size = 24, color = PALETTE.greenIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PartialAcceptIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8l2.5 2.5 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 8h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M15 15l4 4M19 15l-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function RejectCircleIcon({ size = 24, color = PALETTE.redIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export interface AcceptanceDecisionScreenProps {
  shipmentId?: string;
  expectedQty?: string;
  receivedQty?: string;
  onBack?: () => void;
  onSelectOutcome?: (outcome: 'Accept' | 'Partial Accept' | 'Reject') => void;
}

export function AcceptanceDecisionScreen({
  shipmentId = 'SHP-000124',
  expectedQty = '500 KG',
  receivedQty = '480 KG',
  onBack,
  onSelectOutcome,
}: AcceptanceDecisionScreenProps) {
  const [selected, setSelected] = useState<'Accept' | 'Partial Accept' | 'Reject'>('Partial Accept');

  const handleSelect = (outcome: 'Accept' | 'Partial Accept' | 'Reject') => {
    setSelected(outcome);
    if (onSelectOutcome) {
      onSelectOutcome(outcome);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Acceptance Decision</Text>
        </View>
        <Text style={styles.headerSubtitle}>{shipmentId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Quantity Overview Card ─── */}
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Quantity</Text>
              <Text style={styles.gridValue}>{expectedQty}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Received Quantity</Text>
              <Text style={styles.gridValue}>{receivedQty}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Accepted Quantity</Text>
              <Text style={styles.gridValue}>—</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Rejected/Damaged</Text>
              <Text style={styles.gridValue}>35 KG (flagged)</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Business Logic Disclaimer Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Only three documented outcomes exist: Accept, Partial Accept, Reject — no additional business outcome is invented.
          </Text>
        </View>

        {/* ─── 3. Decision Option Cards ─── */}

        {/* Option A: Accept */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelect('Accept')}
          activeOpacity={0.8}
        >
          <CheckCircleIcon size={24} color={PALETTE.greenIcon} />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Accept</Text>
            <Text style={styles.optionSub}>Accept the applicable quantity</Text>
          </View>
        </TouchableOpacity>

        {/* Option B: Partial Accept */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelect('Partial Accept')}
          activeOpacity={0.8}
        >
          <PartialAcceptIcon size={24} color={PALETTE.primary} />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Partial Accept</Text>
            <Text style={styles.optionSub}>Accept some, reject the remainder</Text>
          </View>
        </TouchableOpacity>

        {/* Option C: Reject */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelect('Reject')}
          activeOpacity={0.8}
        >
          <RejectCircleIcon size={24} color={PALETTE.redIcon} />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Reject</Text>
            <Text style={styles.optionSub}>Reject the incoming goods</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
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
    marginLeft: 32,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.orangeDeep,
    lineHeight: 16,
  },
  optionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
});
