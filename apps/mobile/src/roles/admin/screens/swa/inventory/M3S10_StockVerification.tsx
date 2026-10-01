import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../components';

interface M3S10Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
  onTabChange?: ((tab: any) => void) | undefined;
}

function LockSmallIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke="#8B4513" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#8B4513" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockTabBoxIcon({ color = '#3B4856' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = '#3B4856' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
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
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M9 11.5l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#7A726C', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlaskIcon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5.5L4.5 18A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-3L14 8.5V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 16h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export const M3S10_StockVerification: React.FC<M3S10Props> = ({ onNavigate, onBack, onTabChange }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Stock Verification"
          onBack={onBack}
        />

        {/* Warehouse Pill Row */}
        <View style={styles.warehousePillRow}>
          <View style={styles.warehousePill}>
            <LockSmallIcon />
            <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
          </View>
        </View>

        {/* 4 Rounded Tab Cards */}
        <View style={styles.tabCardsRow}>
          {/* Stock Tab */}
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate('M3S02')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color="#3B4856" />
            <Text style={styles.tabCardText}>Stock</Text>
          </TouchableOpacity>

          {/* Ledger Tab */}
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate('M3S06')}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color="#3B4856" />
            <Text style={styles.tabCardText}>Ledger</Text>
          </TouchableOpacity>

          {/* Allocation Tab */}
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate('M3S07')}
            activeOpacity={0.7}
          >
            <AllocationTabIcon color="#3B4856" />
            <Text style={styles.tabCardText}>Allocation</Text>
          </TouchableOpacity>

          {/* Verify Tab (Active) */}
          <TouchableOpacity 
            style={[styles.tabCard, styles.activeTabCard]}
            activeOpacity={0.85}
          >
            <VerifyTabIcon color="#FFFFFF" />
            <Text style={[styles.tabCardText, styles.activeTabCardText]}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Selector */}
          <View style={styles.selectorCard}>
            <Text style={styles.selectorLabel}>PRODUCT</Text>
            <TouchableOpacity style={styles.selectorButton} activeOpacity={0.7}>
              <Text style={styles.selectorText}>Tomato · Grade 1</Text>
              <View style={styles.chevronBox}>
                <ChevronDownIcon color="#7A726C" size={16} />
              </View>
            </TouchableOpacity>
          </View>

          {/* System Quantity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Quantity</Text>
          </View>
          <View style={styles.quantityCard}>
            <Text style={styles.quantityValue}>100 KG</Text>
            <Text style={styles.quantityLabel}>SYSTEM QUANTITY</Text>
          </View>

          {/* Verification History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verification History</Text>
          </View>

          {/* History Item 1 */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>24 Sep</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending Review</Text>
              </View>
            </View>
            <Text style={styles.historyProduct}>Tomato</Text>
            <Text style={styles.historyDetails}>
              100 KG → 95 KG · Variance <Text style={styles.varianceBold}>-5 KG</Text>
            </Text>
          </View>

          {/* History Item 2 */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>20 Sep</Text>
              <View style={styles.matchedBadge}>
                <Text style={styles.matchedBadgeText}>Matched</Text>
              </View>
            </View>
            <Text style={styles.historyProduct}>Carrot</Text>
            <Text style={styles.historyDetails}>
              80 KG → 80 KG
            </Text>
          </View>

          {/* History Item 3 */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>15 Sep</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>
            <Text style={styles.historyProduct}>Beans</Text>
            <Text style={styles.historyDetails}>
              50 KG → 48 KG · Variance <Text style={styles.varianceBold}>-2 KG</Text>
            </Text>
          </View>

          {/* Start Physical Count Action Button */}
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => onNavigate('M3S11')}
              activeOpacity={0.85}
            >
              <FlaskIcon color="#FFFFFF" size={20} />
              <Text style={styles.startButtonText}>Start Physical Count</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        <SWABottomNav activeTab="Inventory" onTabChange={onTabChange} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  warehousePillRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5ED',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
    fontFamily: 'Poppins',
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
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
  },
  activeTabCard: {
    backgroundColor: '#E85226',
    borderColor: '#E85226',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  chevronBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  quantityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B4513',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    letterSpacing: 0.8,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: 'Poppins',
  },
  matchedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  matchedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: 'Poppins',
  },
  completedBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    fontFamily: 'Poppins',
  },
  historyProduct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  historyDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  varianceBold: {
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  actionButtonContainer: {
    marginTop: 8,
    marginBottom: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85226',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
