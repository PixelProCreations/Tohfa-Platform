import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7.5" stroke="#7D7571" strokeWidth="2" />
      <Path d="M20 20l-3.8-3.8" stroke="#7D7571" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PencilEditIcon({ color = WAREHOUSE_THEME.ink }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface StockBatchItem {
  id: string;
  name: string;
  quantityKg: number;
  batchId: string;
  zone: string;
  receivedDate: string;
}

const DEFAULT_BATCHES: StockBatchItem[] = [
  {
    id: '1',
    name: 'Carrots',
    quantityKg: 240,
    batchId: 'BT-4471',
    zone: 'Zone A-2',
    receivedDate: 'Received Sep 9',
  },
  {
    id: '2',
    name: 'Cabbage',
    quantityKg: 180,
    batchId: 'BT-4460',
    zone: 'Zone B-1',
    receivedDate: 'Received Sep 7',
  },
  {
    id: '3',
    name: 'Beetroot',
    quantityKg: 95,
    batchId: 'BT-4452',
    zone: 'Zone A-3',
    receivedDate: 'Received Sep 5',
  },
];

export interface StockLedgerScreenProps {
  onBack?: () => void;
  warehouseName?: string;
  onVerifyBatch?: (batch?: StockBatchItem) => void;
}

export function StockLedgerScreen({
  onBack,
  warehouseName = 'Ooty Warehouse',
  onVerifyBatch,
}: StockLedgerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBatches = DEFAULT_BATCHES.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.batchId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={WAREHOUSE_THEME.bg} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackChevronIcon />
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Stock Ledger</Text>
          <Text style={styles.subtitle}>{warehouseName} · live per-batch stock record</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by produce name"
            placeholderTextColor="#A59E99"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Batches List */}
        {filteredBatches.map((item) => (
          <View
            key={item.id}
            style={styles.batchCard}
          >
            <View style={styles.cardRow}>
              <Text style={styles.produceName}>{item.name}</Text>
              <Text style={styles.produceQty}>{item.quantityKg} kg</Text>
            </View>
            <View style={[styles.cardRow, { marginTop: 6 }]}>
              <Text style={styles.produceMeta}>Batch {item.batchId} · {item.zone}</Text>
              <Text style={styles.produceMeta}>{item.receivedDate}</Text>
            </View>
          </View>
        ))}

        {/* Bottom Button: Verify / Adjust a Batch */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => onVerifyBatch?.(filteredBatches[0] || DEFAULT_BATCHES[0])}
          activeOpacity={0.8}
        >
          <PencilEditIcon color={WAREHOUSE_THEME.ink} />
          <Text style={styles.outlineActionBtnText}>Verify / Adjust a Batch</Text>
        </TouchableOpacity>

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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    backgroundColor: WAREHOUSE_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerBlock: {
    marginBottom: 16,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: WAREHOUSE_THEME.ink,
  },
  batchCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  produceName: {
    fontSize: 16,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  produceQty: {
    fontSize: 16,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  produceMeta: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
  },
  outlineActionBtn: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  outlineActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginLeft: 8,
  },
});
