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
import { WAREHOUSE_THEME } from './WarehouseOverviewScreen';

function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={WAREHOUSE_THEME.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={WAREHOUSE_THEME.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={WAREHOUSE_THEME.orange}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke="#B45309"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface InterWarehouseTransferItem {
  id: string;
  source: string;
  destination: string;
  produceDescription: string;
  status: 'In Transit' | 'Pending SA Approval' | 'Completed';
  eta?: string | undefined;
}

export const INITIAL_TRANSFERS: InterWarehouseTransferItem[] = [
  {
    id: '1',
    source: 'Ooty',
    destination: 'Kotagiri',
    produceDescription: 'Beetroot — 300 kg',
    status: 'In Transit',
    eta: 'ETA 3 hrs',
  },
  {
    id: '2',
    source: 'Coonoor',
    destination: 'Kotagiri',
    produceDescription: 'Mixed vegetables — 1,200 kg',
    status: 'Pending SA Approval',
  },
];

export interface InterWarehouseTransferScreenProps {
  onBack?: () => void;
  onNewTransfer?: () => void;
  transfers?: InterWarehouseTransferItem[];
}

export function InterWarehouseTransferScreen({
  onBack,
  onNewTransfer,
  transfers = INITIAL_TRANSFERS,
}: InterWarehouseTransferScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={WAREHOUSE_THEME.bg} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Row: Back Button on Left, Plus on Right */}
        <View style={styles.navRow}>
          {onBack ? (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackChevronIcon />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}

          <TouchableOpacity
            style={styles.navBtn}
            onPress={onNewTransfer}
            activeOpacity={0.7}
            accessibilityLabel="Initiate new transfer"
          >
            <PlusIcon />
          </TouchableOpacity>
        </View>

        {/* Title Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Inter-Warehouse Transfer</Text>
          <Text style={styles.subtitle}>Rebalancing stock across locations</Text>
        </View>

        {/* Transfer Cards List */}
        {transfers.map((item) => (
          <View key={item.id} style={styles.transferCard}>
            {/* Route Row: Source -> Destination */}
            <View style={styles.routeRow}>
              <Text style={styles.whName}>{item.source}</Text>
              <View style={styles.arrowBox}>
                <ArrowRightIcon />
              </View>
              <Text style={styles.whName}>{item.destination}</Text>
            </View>

            {/* Produce Description */}
            <Text style={styles.produceText}>{item.produceDescription}</Text>

            {/* Status Row */}
            <View style={styles.statusRow}>
              {item.status === 'In Transit' ? (
                <View style={styles.inTransitBadge}>
                  <Text style={styles.inTransitText}>In Transit</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending SA Approval</Text>
                </View>
              )}

              {item.eta ? (
                <Text style={styles.etaText}>{item.eta}</Text>
              ) : null}
            </View>
          </View>
        ))}

        {/* Warning / Policy Notice Box */}
        <View style={styles.policyNoticeBox}>
          <WarningTriangleIcon />
          <Text style={styles.policyNoticeText}>
            High-value transfers can't dispatch without Super Admin sign-off, consistent with dual-approval on large actions.
          </Text>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    backgroundColor: WAREHOUSE_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: WAREHOUSE_THEME.titleRust,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: WAREHOUSE_THEME.muted,
    marginTop: 6,
  },
  transferCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whName: {
    fontSize: 18,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  arrowBox: {
    marginHorizontal: 12,
  },
  produceText: {
    fontSize: 14,
    color: WAREHOUSE_THEME.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  inTransitBadge: {
    backgroundColor: '#EAF5EA',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  inTransitText: {
    color: '#0D8253',
    fontSize: 13,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: '#FEF6E9',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pendingText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },
  etaText: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
    marginLeft: 12,
    fontWeight: '500',
  },
  policyNoticeBox: {
    backgroundColor: WAREHOUSE_THEME.alertBg,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.alertBorder,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 13,
    color: WAREHOUSE_THEME.alertText,
    lineHeight: 19,
    marginLeft: 10,
  },
});
