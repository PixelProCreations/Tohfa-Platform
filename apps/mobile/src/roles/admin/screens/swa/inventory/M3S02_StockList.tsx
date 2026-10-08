import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../components';

interface M3S02Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  onTabChange?: ((tab: any) => void) | undefined;
  initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify';
}

// ─── Custom Icons matching Design Mockup (Pure Path - zero Hermes/SVG errors) ─

function StockTabBoxIcon({ color = '#3B4856' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {/* Top lid */}
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v2A1.5 1.5 0 0 1 17.5 8h-11A1.5 1.5 0 0 1 5 6.5v-2z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Bottom crate */}
      <Path
        d="M5.5 8h13a1 1 0 0 1 1 1v10.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 19.5V9a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Handle slot */}
      <Path
        d="M9.5 13.5h5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = '#3B4856' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20.5H6V3.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = '#3B4856' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = '#3B4856' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {/* Outer rounded card */}
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Checkbox box */}
      <Path
        d="M7 6.5h4.5v4.5H7z"
        stroke={color}
        strokeWidth="1.4"
      />
      {/* Checkmark inside checkbox */}
      <Path
        d="M8 8.8l1 1 2-2"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Text lines */}
      <Path d="M14 7.5h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M14 10h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 14.5h10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 17.5h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ color = '#8A7E75' }: { color?: string }) {
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

export const M3S02_StockList: React.FC<M3S02Props> = ({ onNavigate, onBack, onTabChange, initialTab = 'Stock' }) => {
  const [activeTab, setActiveTab] = useState<'Stock' | 'Ledger' | 'Allocation' | 'Verify'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const stockItems = [
    {
      name: 'Tomato',
      grade: 'Grade 1',
      status: 'Healthy Stock',
      available: '245 KG',
      reserved: '50 KG',
      allocated: '120 KG',
    },
    {
      name: 'Carrot',
      grade: 'Grade 1',
      status: 'Low Stock',
      available: '12 KG',
      reserved: '0 KG',
      allocated: '0 KG',
    },
    {
      name: 'Beetroot',
      grade: 'Grade 1',
      status: 'Healthy Stock',
      available: '60 KG',
      reserved: '5 KG',
      allocated: '15 KG',
    },
    {
      name: 'Spinach',
      grade: 'Grade 2',
      status: 'Out of Stock',
      available: '0 KG',
      reserved: '0 KG',
      allocated: '0 KG',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader colors={['#F0562A', '#F0562A']} 
          title="Stock List"
          onBack={onBack}
          showFilter={true}
          onFilterPress={() => onNavigate('M3S16')}
        />

        {/* 4 Rounded Tab Cards (positioned UP, directly below header matching reference) */}
        <View style={styles.tabCardsRow}>
          {/* Stock Tab */}
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Stock' && styles.activeTabCard]}
            onPress={() => setActiveTab('Stock')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color={activeTab === 'Stock' ? '#FFFFFF' : '#3B4856'} />
            <Text style={[styles.tabCardText, activeTab === 'Stock' && styles.activeTabCardText]}>Stock</Text>
          </TouchableOpacity>

          {/* Ledger Tab */}
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Ledger' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Ledger');
              onNavigate('M3S06');
            }}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color={activeTab === 'Ledger' ? '#FFFFFF' : '#3B4856'} />
            <Text style={[styles.tabCardText, activeTab === 'Ledger' && styles.activeTabCardText]}>Ledger</Text>
          </TouchableOpacity>

          {/* Allocation Tab */}
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Allocation' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Allocation');
              onNavigate('M3S07');
            }}
            activeOpacity={0.7}
          >
            <AllocationTabIcon color={activeTab === 'Allocation' ? '#FFFFFF' : '#3B4856'} />
            <Text style={[styles.tabCardText, activeTab === 'Allocation' && styles.activeTabCardText]}>Allocation</Text>
          </TouchableOpacity>

          {/* Verify Tab */}
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Verify' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Verify');
              onNavigate('M3S10');
            }}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={activeTab === 'Verify' ? '#FFFFFF' : '#3B4856'} />
            <Text style={[styles.tabCardText, activeTab === 'Verify' && styles.activeTabCardText]}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchIcon color="#8A7E75" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search product, crop or batch"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Stock Items */}
          {stockItems.map((item, index) => {
            const isHealthy = item.status === 'Healthy Stock';
            return (
              <TouchableOpacity
                key={index}
                style={styles.stockCard}
                onPress={() => onNavigate('M3S03', { product: item })}
                activeOpacity={0.7}
              >
                <View style={styles.stockHeader}>
                  <View style={styles.stockTitleColumn}>
                    <Text style={styles.stockName}>{item.name}</Text>
                    <Text style={styles.stockGrade}>{item.grade}</Text>
                  </View>
                  <View style={[styles.statusBadge, isHealthy ? styles.healthyBadge : styles.alertBadge]}>
                    <Text style={[styles.statusBadgeText, isHealthy ? styles.healthyBadgeText : styles.alertBadgeText]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Metrics on left, View > on right */}
                <View style={styles.stockBottomRow}>
                  <View style={styles.stockStatsGroup}>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Available</Text>
                      <Text style={styles.stockStatValue}>{item.available}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Reserved</Text>
                      <Text style={styles.stockStatValue}>{item.reserved}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Allocated</Text>
                      <Text style={styles.stockStatValue}>{item.allocated}</Text>
                    </View>
                  </View>

                  <View style={styles.viewLinkRow}>
                    <Text style={styles.viewLink}>View</Text>
                    <Text style={styles.viewChevron}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SWABottomNav activeTab="Inventory" onTabChange={onTabChange} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  tabCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTabCard: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  tabCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B4856',
    fontFamily: 'Poppins',
  },
  activeTabCardText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    fontFamily: 'Poppins',
    color: '#1D2420',
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockTitleColumn: {
    flex: 1,
  },
  stockName: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  stockGrade: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#5C6B63',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  healthyBadge: {
    backgroundColor: '#E6F5ED',
  },
  healthyBadgeText: {
    color: '#1E8E5A',
  },
  alertBadge: {
    backgroundColor: '#FCE9E9',
  },
  alertBadgeText: {
    color: '#DC2626',
  },
  stockBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  stockStatsGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  stockStat: {
    minWidth: 54,
  },
  stockStatLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#5C6B63',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  stockStatValue: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0562A',
    fontFamily: 'Poppins',
  },
  viewChevron: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0562A',
    marginTop: -1,
  },
});

