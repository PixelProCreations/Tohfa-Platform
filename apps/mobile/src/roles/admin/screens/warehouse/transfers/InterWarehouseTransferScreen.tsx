// Design id: Transfers
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import type { TransferItem, WarehouseScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';

export interface InterWarehouseTransferScreenProps extends WarehouseScreenBaseProps {
  transfers?: readonly TransferItem[] | undefined;
  onNewTransfer?: (() => void) | undefined;
  onSelectTransfer?: ((transfer: TransferItem) => void) | undefined;
}

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function PlusIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InterWarehouseTransferScreen({
  onBack,
  onNewTransfer,
  onSelectTransfer,
}: InterWarehouseTransferScreenProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'In Transit' | 'Discrepancy'>('All');

  const items = [
    {
      id: 'TRF-00284',
      route: 'Coonoor → Ooty · 200 KG',
      status: 'In Transit' as const,
    },
  ];

  const filteredItems =
    activeTab === 'All'
      ? items
      : activeTab === 'In Transit'
      ? items.filter((i) => i.status === 'In Transit')
      : [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inter-Warehouse Transfer</Text>
        </View>
      </SafeAreaView>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'All' ? styles.filterTabActive : styles.filterTabInactive]}
          onPress={() => setActiveTab('All')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, activeTab === 'All' ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'In Transit' ? styles.filterTabActive : styles.filterTabInactive]}
          onPress={() => setActiveTab('In Transit')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, activeTab === 'In Transit' ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
            In Transit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'Discrepancy' ? styles.filterTabActive : styles.filterTabInactive]}
          onPress={() => setActiveTab('Discrepancy')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, activeTab === 'Discrepancy' ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
            Discrepancy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onSelectTransfer?.(item as any)}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>{item.id}</Text>
              <View style={styles.inTransitBadge}>
                <Text style={styles.inTransitBadgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{item.route}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Action Button */}
      <SafeAreaView style={styles.bottomSafeArea}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={onNewTransfer}
          activeOpacity={0.85}
        >
          <PlusIcon size={18} color="#FFFFFF" />
          <Text style={styles.bottomBtnText}>Create Transfer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  headerSafeArea: {
    backgroundColor: '#F0562A',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF7F2',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: '#F0562A',
  },
  filterTabInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabTextInactive: {
    color: '#374151',
  },
  body: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  inTransitBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inTransitBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 6,
  },
  bottomSafeArea: {
    backgroundColor: '#FAF7F2',
  },
  bottomBtn: {
    backgroundColor: '#F0562A',
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'android' ? 16 : 8,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bottomBtnText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
