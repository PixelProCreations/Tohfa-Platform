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
  badgeGreenBg: '#E8F5E9',
  badgeGreenText: '#2E7D32',
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

export interface SupportHistoryScreenProps {
  customerName?: string;
  onBack?: () => void;
  onSelectTicket?: (ticketId: string) => void;
}

export function SupportHistoryScreen({
  customerName = 'Rajesh Kumar',
  onBack,
  onSelectTicket,
}: SupportHistoryScreenProps) {
  const KPIS = [
    { label: 'TOTAL', value: '8' },
    { label: 'OPEN', value: '1' },
    { label: 'RESOLVED', value: '7' },
  ];

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
          <Text style={styles.headerTitle}>Support History</Text>
        </View>
        <Text style={styles.headerSubtitle}>{customerName}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 3 KPI Cards */}
        <View style={styles.kpiRow}>
          {KPIS.map((item, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{item.value}</Text>
              <Text style={styles.kpiLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Support Ticket Card */}
        <TouchableOpacity
          style={styles.ticketCard}
          onPress={() => onSelectTicket?.('SUP-00182')}
          activeOpacity={0.8}
        >
          <View style={styles.ticketTopRow}>
            <Text style={styles.ticketId}>SUP-00182</Text>
            <View style={styles.badgeResolved}>
              <Text style={styles.badgeText}>Resolved</Text>
            </View>
          </View>
          <Text style={styles.ticketSub}>Pickup Issue</Text>
        </TouchableOpacity>

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
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ticketCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  badgeResolved: {
    backgroundColor: PALETTE.badgeGreenBg,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.badgeGreenText,
  },
  ticketSub: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
  },
});
