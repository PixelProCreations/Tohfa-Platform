// Design id: M3S02
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockListScreenProps extends InventoryScreenBaseProps {
  initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify';
}

function SearchIcon({ color = '#6B7280' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ color = '#4B5563' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StockListScreen({
  scope,
  onNavigate,
  onBack,
}: StockListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const warehouseName = scope.warehouseName ?? 'Ooty';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title={`Warehouse Stock — ${warehouseName}`}
          onBack={onBack}
          colors={['#F0562A', '#F0562A']}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchIcon color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Product, grade, batch..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Product Items Card */}
          <View style={styles.stockCard}>
            {/* Tomato G1 */}
            <TouchableOpacity
              style={styles.stockRow}
              onPress={() => onNavigate?.('M3S03', { product: 'Tomato G1' })}
              activeOpacity={0.7}
            >
              <View style={styles.stockInfo}>
                <Text style={styles.productTitle}>Tomato G1</Text>
                <Text style={styles.productSubtitle}>210 KG available</Text>
              </View>
              <ChevronRightIcon color="#4B5563" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Carrot G1 */}
            <TouchableOpacity
              style={styles.stockRow}
              onPress={() => onNavigate?.('M3S03', { product: 'Carrot G1' })}
              activeOpacity={0.7}
            >
              <View style={styles.stockInfo}>
                <Text style={styles.productTitle}>Carrot G1</Text>
                <Text style={styles.productSubtitle}>850 KG available</Text>
              </View>
              <ChevronRightIcon color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Export Warehouse Stock Button */}
          <TouchableOpacity style={styles.exportButton} activeOpacity={0.7}>
            <Text style={styles.exportButtonText}>Export Warehouse Stock</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  searchInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
    color: '#111827',
    paddingVertical: 0,
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stockInfo: {
    flex: 1,
  },
  productTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  productSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  exportButton: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});
