// Design id: M3S03
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { adminColors } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export type ProductStockDetailScreenProps = InventoryScreenBaseProps;

// ─── Custom Icons for Action Buttons ──────────────────────────────────────────

function ActionBatchesIcon({ color = '#8B3A1C' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.6" fill="#FFFFFF" />
      <Path d="M8 10h8M8 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ActionLedgerIcon({ color = '#8B3A1C' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20.5H6V3.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ActionPinIcon({ color = '#8B3A1C' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ActionVerifyIcon({ color = '#8B3A1C' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z" stroke={color} strokeWidth="1.8" />
      <Path d="M7 6.5h4.5v4.5H7z" stroke={color} strokeWidth="1.4" />
      <Path d="M8 8.8l1 1 2-2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 7.5h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M14 10h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 14.5h10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 17.5h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

interface ProductStockData {
  title: string;
  subtitle: string;
  availableVal: string;
  reservedVal: string;
  allocatedVal: string;
}

const KNOWN_PRODUCT_STOCK: Record<string, ProductStockData> = {
  tomato: {
    title: 'Tomato',
    subtitle: 'Grade 1',
    availableVal: '245 KG',
    reservedVal: '50 KG',
    allocatedVal: '120 KG',
  },
  carrot: {
    title: 'Carrot',
    subtitle: 'Grade 1',
    availableVal: '12 KG',
    reservedVal: '0 KG',
    allocatedVal: '0 KG',
  },
  beetroot: {
    title: 'Beetroot',
    subtitle: 'Grade 1',
    availableVal: '60 KG',
    reservedVal: '5 KG',
    allocatedVal: '15 KG',
  },
  spinach: {
    title: 'Spinach',
    subtitle: 'Grade 2',
    availableVal: '0 KG',
    reservedVal: '0 KG',
    allocatedVal: '0 KG',
  },
};

export function ProductStockDetailScreen({
  onNavigate,
  onBack,
  routeParams,
}: ProductStockDetailScreenProps) {
  const rawProduct = typeof routeParams?.['product'] === 'string' ? routeParams['product'] : undefined;
  const productKey = rawProduct?.toLowerCase().trim() ?? '';
  const matchingKey = Object.keys(KNOWN_PRODUCT_STOCK).find((key) => productKey.includes(key));
  const isCarrot = matchingKey === 'carrot';
  const productData = matchingKey ? KNOWN_PRODUCT_STOCK[matchingKey] : undefined;

  const title = productData?.title ?? (rawProduct ? rawProduct : 'Unknown Product');
  const subtitle = productData?.subtitle ?? (productData ? 'Grade 1' : 'Unspecified');
  const availableVal = productData?.availableVal ?? '0 KG';
  const reservedVal = productData?.reservedVal ?? '0 KG';
  const allocatedVal = productData?.allocatedVal ?? '0 KG';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          badge={
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available</Text>
            </View>
          }
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Stock Summary - 3 Separate White Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Summary</Text>
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{availableVal}</Text>
                <Text style={styles.summaryLabel}>AVAILABLE</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{reservedVal}</Text>
                <Text style={styles.summaryLabel}>RESERVED</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{allocatedVal}</Text>
                <Text style={styles.summaryLabel}>ALLOCATED</Text>
              </View>
            </View>
          </View>

          {/* Allocation - Single Card Container */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allocation</Text>
            <View style={styles.allocationSingleCard}>
              <View style={styles.allocationRow}>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>ONLINE</Text>
                  <Text style={styles.allocationValue}>{isCarrot ? '0 KG' : '120 KG'}</Text>
                </View>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>LIVE MARKET</Text>
                  <Text style={styles.allocationValue}>{isCarrot ? '12 KG' : '40 KG'}</Text>
                </View>
              </View>
              <View style={styles.allocationRowBottom}>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>RESERVE</Text>
                  <Text style={styles.allocationValue}>{isCarrot ? '0 KG' : '50 KG'}</Text>
                </View>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>BUFFER</Text>
                  <Text style={styles.allocationValue}>{isCarrot ? '0 KG' : '30 KG'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Batches & Storage - Single Card Container */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batches & Storage</Text>
            <View style={styles.batchesCard}>
              <View style={styles.infoRowTop}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Active Batches</Text>
                  <Text style={styles.infoValue}>5</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Storage Locations</Text>
                  <Text style={styles.infoValue}>3</Text>
                </View>
              </View>
              <View style={styles.primaryStorageRow}>
                <Text style={styles.infoLabel}>Primary Storage</Text>
                <Text style={styles.primaryStorageValue}>Cold Storage · Section A · Rack 03</Text>
              </View>
            </View>
          </View>

          {/* Actions - White Cards with Orange Border and Centered Brown Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S04')}
              activeOpacity={0.7}
            >
              <ActionBatchesIcon color="#8B3A1C" />
              <Text style={styles.actionButtonText}>View Batches</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S06')}
              activeOpacity={0.7}
            >
              <ActionLedgerIcon color="#8B3A1C" />
              <Text style={styles.actionButtonText}>View Ledger</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S08')}
              activeOpacity={0.7}
            >
              <ActionPinIcon color="#8B3A1C" />
              <Text style={styles.actionButtonText}>View Storage Locations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S10')}
              activeOpacity={0.7}
            >
              <ActionVerifyIcon color="#8B3A1C" />
              <Text style={styles.actionButtonText}>Verify Stock</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 14,
    paddingBottom: 36,
  },
  availableBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  // 3 Summary Cards
  summaryCards: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A7E75',
    fontFamily: 'Poppins',
    letterSpacing: 0.8,
  },
  // Single Allocation Card
  allocationSingleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    padding: 16,
  },
  allocationRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  allocationRowBottom: {
    flexDirection: 'row',
  },
  allocationCol: {
    flex: 1,
  },
  allocationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7E75',
    fontFamily: 'Poppins',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  allocationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  // Batches & Storage Card
  batchesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    padding: 16,
  },
  infoRowTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5C6B63',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  primaryStorageRow: {
    marginTop: 2,
  },
  primaryStorageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  // Action Buttons (Centered, Orange Border, Brown Text)
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E85226',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B3A1C',
    fontFamily: 'Poppins',
    marginLeft: 10,
  },
});
