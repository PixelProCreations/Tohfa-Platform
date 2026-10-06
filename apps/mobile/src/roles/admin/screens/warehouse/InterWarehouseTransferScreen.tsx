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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── TOHFA Admin Design System v1.0 tokens ──────────────────────────────────
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
  successText: '#0D684D',
  successBg: '#EAF3DE',
  warningText: '#854F0B',
  warningBg: '#FEF3E2',
  infoText: '#0C447C',
  infoBg: '#E6F1FB',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = '#B8B2A9' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
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
  {
    id: '3',
    source: 'Kotagiri',
    destination: 'Ooty',
    produceDescription: 'Carrots — 450 kg',
    status: 'Completed',
  },
];

export function transferCode(item: InterWarehouseTransferItem) {
  return `TRF-${String(item.id).slice(-5).padStart(5, '0')}`;
}

export function transferStatusColors(status: InterWarehouseTransferItem['status']) {
  if (status === 'In Transit') return { bg: PALETTE.infoBg, text: PALETTE.infoText };
  if (status === 'Completed') return { bg: PALETTE.successBg, text: PALETTE.successText };
  return { bg: PALETTE.warningBg, text: PALETTE.warningText };
}

type FilterKey = 'All' | 'In Transit' | 'Pending SA Approval' | 'Completed';

export interface InterWarehouseTransferScreenProps {
  onBack?: () => void;
  onNewTransfer?: () => void;
  onSelectTransfer?: (transfer: InterWarehouseTransferItem) => void;
  transfers?: InterWarehouseTransferItem[];
}

export function InterWarehouseTransferScreen({
  onBack,
  onNewTransfer,
  onSelectTransfer,
  transfers = INITIAL_TRANSFERS,
}: InterWarehouseTransferScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('All');

  const inTransit = transfers.filter((t) => t.status === 'In Transit').length;
  const pending = transfers.filter((t) => t.status === 'Pending SA Approval').length;
  const completed = transfers.filter((t) => t.status === 'Completed').length;

  const filtered = filter === 'All' ? transfers : transfers.filter((t) => t.status === filter);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'All', label: 'All' },
    { key: 'In Transit', label: 'In Transit' },
    { key: 'Pending SA Approval', label: 'Pending Approval' },
    { key: 'Completed', label: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            {onBack && (
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Go back">
                <ArrowBackIcon />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Inter-Warehouse Transfer</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onNewTransfer}
            activeOpacity={0.8}
            accessibilityLabel="Initiate new transfer"
          >
            <PlusIcon size={18} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Rebalancing stock across locations</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* ─── KPI Row ─── */}
        <View style={styles.kpiRow}>
          <TouchableOpacity style={styles.kpiCard} onPress={() => setFilter('In Transit')} activeOpacity={0.8}>
            <Text style={styles.kpiLabel}>IN TRANSIT</Text>
            <Text style={styles.kpiValue}>{inTransit}</Text>
            <Text style={styles.kpiSub}>transfers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.kpiCard} onPress={() => setFilter('Pending SA Approval')} activeOpacity={0.8}>
            <Text style={styles.kpiLabel}>PENDING</Text>
            <Text style={styles.kpiValue}>{pending}</Text>
            <Text style={styles.kpiSub}>SA approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.kpiCard} onPress={() => setFilter('Completed')} activeOpacity={0.8}>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
            <Text style={styles.kpiValue}>{completed}</Text>
            <Text style={styles.kpiSub}>this week</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Filter Pills ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Transfer List ─── */}
        <Text style={styles.sectionTitle}>Transfers</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transfers in this status.</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const c = transferStatusColors(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.transferCard}
                onPress={() => onSelectTransfer?.(item)}
                activeOpacity={0.8}
              >
                <View style={styles.transferTopRow}>
                  <View style={styles.iconBox}>
                    <TruckIcon size={18} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.routeRow}>
                      <Text style={styles.whName}>{item.source}</Text>
                      <View style={{ marginHorizontal: 8 }}>
                        <ArrowRightIcon />
                      </View>
                      <Text style={styles.whName}>{item.destination}</Text>
                    </View>
                    <Text style={styles.produceText}>
                      {transferCode(item)} · {item.produceDescription}
                    </Text>
                  </View>
                  <ChevronRightIcon />
                </View>
                <View style={styles.transferBottomRow}>
                  <View style={[styles.statusPill, { backgroundColor: c.bg }]}>
                    <Text style={[styles.statusPillText, { color: c.text }]}>{item.status}</Text>
                  </View>
                  {item.eta ? <Text style={styles.etaText}>{item.eta}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ─── Policy Notice ─── */}
        <View style={styles.noticeBox}>
          <WarningTriangleIcon />
          <Text style={styles.noticeText}>
            High-value transfers can't dispatch without Super Admin sign-off, consistent with dual-approval on large actions.
          </Text>
        </View>

        {/* ─── Primary CTA ─── */}
        <TouchableOpacity style={styles.primaryBtn} onPress={onNewTransfer} activeOpacity={0.85}>
          <PlusIcon size={18} />
          <Text style={styles.primaryBtnText}>Initiate New Transfer</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 2, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.95)', marginTop: 4, marginLeft: 32 },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollPad: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textSecondary, letterSpacing: 0.5 },
  kpiValue: { fontSize: 19, fontWeight: '800', color: PALETTE.textInk, marginTop: 4 },
  kpiSub: { fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginTop: 2 },

  filterRow: { gap: 8, paddingBottom: 14 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterPillActive: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
  filterPillText: { fontSize: 12.5, fontWeight: '600', color: PALETTE.textSecondary },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.orangeDeep, marginBottom: 10 },

  transferCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  transferTopRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  whName: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk },
  produceText: { fontSize: 12, fontWeight: '500', color: PALETTE.textSecondary, marginTop: 3 },
  transferBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusPillText: { fontSize: 11.5, fontWeight: '700' },
  etaText: { fontSize: 12, fontWeight: '600', color: PALETTE.textSecondary, marginLeft: 10 },

  emptyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: PALETTE.textSecondary, fontWeight: '500' },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 12, fontWeight: '600', color: PALETTE.orangeDeep, lineHeight: 17.5, marginLeft: 10 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 50,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
