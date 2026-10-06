import React from 'react';
import {
  Alert,
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
import {
  INITIAL_TRANSFERS,
  transferCode,
  transferStatusColors,
  type InterWarehouseTransferItem,
} from './InterWarehouseTransferScreen';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  orangeDeep: '#7A2E14',
  primarySoft: '#FDF3F0',
  primaryBorder: '#F7CFC4',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  divider: '#F2ECE5',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  pendingDot: '#D6CEC5',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 11, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface TransferDetailScreenProps {
  transfer?: InterWarehouseTransferItem;
  onBack?: () => void;
  onTrackReceiving?: () => void;
  onBackToTransfers?: () => void;
}

export function TransferDetailScreen({
  transfer = INITIAL_TRANSFERS[0]!,
  onBack,
  onTrackReceiving,
  onBackToTransfers,
}: TransferDetailScreenProps) {
  const c = transferStatusColors(transfer.status);

  const stepIndex =
    transfer.status === 'Pending SA Approval' ? 1 : transfer.status === 'In Transit' ? 3 : 5;

  const STEPS = [
    'Transfer Requested',
    'Super Admin Approval',
    'Dispatched from Source',
    'In Transit',
    'Arrived at Destination',
    'Received & Ledger Updated',
  ];

  const handleCancel = () => {
    Alert.alert('Cancel Transfer', `Cancel ${transferCode(transfer)}? This request will be withdrawn.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Transfer', style: 'destructive', onPress: () => (onBackToTransfers ?? onBack)?.() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Go back">
              <ArrowBackIcon />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Transfer Detail</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {transferCode(transfer)} · {transfer.source} → {transfer.destination}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* Route summary */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.routeValue}>{transfer.source}</Text>
            </View>
            <View style={styles.routeArrow}>
              <ArrowRightIcon />
            </View>
            <View style={[styles.routeCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.routeValue}>{transfer.destination}</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusPillText, { color: c.text }]}>{transfer.status}</Text>
            </View>
            {transfer.eta ? <Text style={styles.etaText}>{transfer.eta}</Text> : null}
          </View>
        </View>

        {/* Info grid */}
        <Text style={styles.sectionTitle}>Transfer Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Transfer ID</Text>
              <Text style={styles.gridValue}>{transferCode(transfer)}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Produce</Text>
              <Text style={styles.gridValue}>{transfer.produceDescription}</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Vehicle</Text>
              <Text style={styles.gridValue}>TN-43-E-8821</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Initiated By</Text>
              <Text style={styles.gridValue}>Suresh (MWA)</Text>
            </View>
          </View>
        </View>

        {/* Progress timeline */}
        <Text style={styles.sectionTitle}>Transfer Progress</Text>
        <View style={styles.card}>
          {STEPS.map((label, idx) => {
            const done = idx <= stepIndex;
            const isLast = idx === STEPS.length - 1;
            return (
              <View key={label} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepDot, done ? styles.stepDotDone : styles.stepDotPending]}>
                    {done && <CheckIcon />}
                  </View>
                  {!isLast && <View style={[styles.stepLine, done && idx < stepIndex && styles.stepLineDone]} />}
                </View>
                <Text style={[styles.stepText, done ? styles.stepTextDone : null]}>{label}</Text>
              </View>
            );
          })}
        </View>

        {transfer.status === 'Pending SA Approval' && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              This transfer exceeds 1,000 kg and is awaiting Super Admin dual-key sign-off before a dispatch manifest is issued.
            </Text>
          </View>
        )}

        {/* Actions */}
        {transfer.status === 'In Transit' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={onTrackReceiving} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Receive at Destination →</Text>
          </TouchableOpacity>
        )}

        {transfer.status === 'Pending SA Approval' && (
          <TouchableOpacity style={styles.dangerBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.dangerBtnText}>Cancel Transfer Request</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={onBackToTransfers ?? onBack} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Back to All Transfers</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.headerBg },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 2, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.95)', marginTop: 4, marginLeft: 32 },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollPad: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.orangeDeep, marginBottom: 10 },

  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  cardDivider: { height: 1, backgroundColor: PALETTE.divider, marginVertical: 12 },

  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeCol: { flex: 1 },
  routeArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: { fontSize: 10.5, fontWeight: '700', color: PALETTE.textSecondary, letterSpacing: 0.5 },
  routeValue: { fontSize: 19, fontWeight: '800', color: PALETTE.textInk, marginTop: 2 },

  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusPillText: { fontSize: 11.5, fontWeight: '700' },
  etaText: { fontSize: 12, fontWeight: '600', color: PALETTE.textSecondary, marginLeft: 10 },

  gridRow: { flexDirection: 'row', marginBottom: 14 },
  gridCol: { flex: 1, paddingRight: 8 },
  gridLabel: { fontSize: 11.5, fontWeight: '600', color: PALETTE.textSecondary, marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '800', color: PALETTE.textInk },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepRail: { alignItems: 'center', width: 22, marginRight: 12 },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: PALETTE.primary },
  stepDotPending: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: PALETTE.pendingDot },
  stepLine: { width: 2, height: 22, backgroundColor: PALETTE.pendingDot },
  stepLineDone: { backgroundColor: PALETTE.primary },
  stepText: { fontSize: 13.5, fontWeight: '500', color: PALETTE.textSecondary, paddingTop: 1 },
  stepTextDone: { color: PALETTE.textInk, fontWeight: '700' },

  noticeBox: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: { fontSize: 12, fontWeight: '600', color: PALETTE.orangeDeep, lineHeight: 17.5 },

  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  dangerBtn: {
    backgroundColor: '#FCEBEB',
    borderWidth: 1,
    borderColor: '#F5C2C1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dangerBtnText: { fontSize: 14.5, fontWeight: '800', color: '#E24B4A' },
  secondaryBtn: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1.5,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 14.5, fontWeight: '800', color: PALETTE.orangeDeep },
});
