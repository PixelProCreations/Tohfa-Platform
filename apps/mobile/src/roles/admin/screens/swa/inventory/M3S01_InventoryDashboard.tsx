import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAGradient } from '../components/SWAGradient';
import { SWABottomNav } from '../components/SWABottomNav';
import { SWA_COLORS } from '../constants';

interface M3S01Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
  onTabChange?: ((tab: any) => void) | undefined;
}

// ─── Pixel-Perfect Custom SVGs matching Design Mockup ─────────────────────────

function HeaderBoxIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 18.5 4h-13z" stroke={color} strokeWidth="2.2" />
      <Path d="M3 9.5h18" stroke={color} strokeWidth="2.2" />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15V10a6 6 0 0 0-12 0v5l-2 3h16l-2-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18v1a2 2 0 0 0 4 0v-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// Stat Card 1: Available (Clipboard with checkmark)
function StatAvailableIcon({ size = 22, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 13l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Stat Card 2: Reserved (Padlock with mini-clock dial on bottom right)
function StatReservedIcon({ size = 22, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M7 10V6.5a3 3 0 0 1 6 0V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M17.5 12.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9z" fill="#FFFFFF" stroke={color} strokeWidth="1.8" />
      <Path d="M17.5 15v2l1.2 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// Stat Card 3: Allocated (Circle divided into pie sections)
function StatAllocatedIcon({ size = 22, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// Stat Card 4: Low Stock (Diagonal downward zig-zag arrow with arrowhead, BROWN outline)
function StatLowStockIcon({ size = 22, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8l6 6 4-4 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 17h5v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Stat Card 5: Verification Pending (Checklist box with checkmark and lines)
function StatVerificationPendingIcon({ size = 22, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" />
      <Path d="M7.5 10l2 2 3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// Stat Card 6: Stock Ledger (Receipt ticket with serrated/jagged zigzag top edge)
function StatStockLedgerIcon({ size = 22, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 20V5.5L7.5 3.5 10 5.5l2-2 2 2 2-2 3 2V20H5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 9h8M8 13h8M8 16.5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export const M3S01_InventoryDashboard: React.FC<M3S01Props> = ({ onNavigate, onBack, onTabChange }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header matching Design Mockup Exactly */}
        <SWAGradient colors={['#F0562A', '#F0562A']}>
          <View style={styles.header}>
            {/* Top Row: Back Button + Box Icon + "Inventory & Stock" (Left) and Notification Bell (Right) */}
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleGroup}>
                {onBack && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="Back to Dashboard"
                  >
                    <BackArrowIcon size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <HeaderBoxIcon size={24} color="#FFFFFF" />
                <Text style={styles.headerTitle}>Inventory & Stock</Text>
              </View>
              <TouchableOpacity 
                style={styles.notificationButton} 
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <BellIcon size={19} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Row: Left-Aligned Pill Capsule for Warehouse */}
            <View style={styles.warehousePill}>
              <LockBadgeIcon size={12} color="#FFFFFF" />
              <Text style={styles.warehouseText}>Coonoor Warehouse</Text>
            </View>
          </View>
        </SWAGradient>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Available Stock - White Card with Brown Text */}
          <View style={styles.totalStockCard}>
            <Text style={styles.totalStockValue}>1,245 KG</Text>
            <Text style={styles.totalStockLabel}>TOTAL AVAILABLE STOCK</Text>
          </View>

          {/* 6 Stats Grid - 2 columns x 3 rows (matching reference mockup exactly) */}
          <View style={styles.statsGrid}>
            {/* Row 1 Left: Available */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => onNavigate('M3S02')}
              activeOpacity={0.7}
            >
              <StatAvailableIcon size={22} color="#8B4513" />
              <Text style={styles.statValue}>1,245 KG</Text>
              <Text style={styles.statLabel}>Available</Text>
            </TouchableOpacity>

            {/* Row 1 Right: Reserved */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => onNavigate('M3S02')}
              activeOpacity={0.7}
            >
              <StatReservedIcon size={22} color="#8B4513" />
              <Text style={styles.statValue}>320 KG</Text>
              <Text style={styles.statLabel}>Reserved</Text>
            </TouchableOpacity>

            {/* Row 2 Left: Allocated */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => onNavigate('M3S07')}
              activeOpacity={0.7}
            >
              <StatAllocatedIcon size={22} color="#8B4513" />
              <Text style={styles.statValue}>580 KG</Text>
              <Text style={styles.statLabel}>Allocated</Text>
            </TouchableOpacity>

            {/* Row 2 Right: Low Stock */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => onNavigate('M3S09')}
              activeOpacity={0.7}
            >
              <StatLowStockIcon size={22} color="#8B4513" />
              <Text style={styles.lowStockValue}>05</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </TouchableOpacity>

            {/* Row 3 Left: Verification Pending */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => onNavigate('M3S10')}
              activeOpacity={0.7}
            >
              <StatVerificationPendingIcon size={22} color="#8B4513" />
              <Text style={styles.statValue}>02</Text>
              <Text style={styles.statLabel}>Verification Pending</Text>
            </TouchableOpacity>

            {/* Row 3 Right: View Stock Ledger */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => onNavigate('M3S06')}
              activeOpacity={0.7}
            >
              <StatStockLedgerIcon size={22} color="#8B4513" />
              <Text style={styles.statValue}>View</Text>
              <Text style={styles.statLabel}>Stock Ledger</Text>
            </TouchableOpacity>
          </View>

          {/* Top Stock Products Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Stock Products</Text>
              <TouchableOpacity onPress={() => onNavigate('M3S02')} activeOpacity={0.7}>
                <Text style={styles.viewAllLink}>View All Stock</Text>
              </TouchableOpacity>
            </View>

            {/* Tomato - Available */}
            <TouchableOpacity 
              style={styles.productCard}
              onPress={() => onNavigate('M3S03')}
              activeOpacity={0.7}
            >
              <View style={styles.productHeader}>
                <View>
                  <Text style={styles.productName}>Tomato</Text>
                  <Text style={styles.productGrade}>Grade 1</Text>
                </View>
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>Available</Text>
                </View>
              </View>
              <View style={styles.productStats}>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Available</Text>
                  <Text style={styles.productStatValue}>245 KG</Text>
                </View>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Reserved</Text>
                  <Text style={styles.productStatValue}>50 KG</Text>
                </View>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Allocated</Text>
                  <Text style={styles.productStatValue}>120 KG</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Carrot - Available */}
            <TouchableOpacity 
              style={styles.productCard}
              onPress={() => onNavigate('M3S03')}
              activeOpacity={0.7}
            >
              <View style={styles.productHeader}>
                <View>
                  <Text style={styles.productName}>Carrot</Text>
                  <Text style={styles.productGrade}>Grade 1</Text>
                </View>
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>Available</Text>
                </View>
              </View>
              <View style={styles.productStats}>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Available</Text>
                  <Text style={styles.productStatValue}>180 KG</Text>
                </View>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Reserved</Text>
                  <Text style={styles.productStatValue}>20 KG</Text>
                </View>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Allocated</Text>
                  <Text style={styles.productStatValue}>80 KG</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Beans - Low Stock */}
            <TouchableOpacity 
              style={styles.productCard}
              onPress={() => onNavigate('M3S09')}
              activeOpacity={0.7}
            >
              <View style={styles.productHeader}>
                <View>
                  <Text style={styles.productName}>Beans</Text>
                  <Text style={styles.productGrade}>Grade 1</Text>
                </View>
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockBadgeText}>Low Stock</Text>
                </View>
              </View>
              <View style={styles.productStats}>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Available</Text>
                  <Text style={styles.productStatValue}>95 KG</Text>
                </View>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Reserved</Text>
                  <Text style={styles.productStatValue}>10 KG</Text>
                </View>
                <View style={styles.productStat}>
                  <Text style={styles.productStatLabel}>Allocated</Text>
                  <Text style={styles.productStatValue}>30 KG</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
  // Dashboard Header matching Design Mockup
  header: {
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  warehouseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
  },
  // Total Stock Card - WHITE background with BROWN text, 20px radius
  totalStockCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  totalStockValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#8B4513',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  totalStockLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C6E65',
    fontFamily: 'Poppins',
    letterSpacing: 1.4,
  },
  // Stats Grid - 2 columns x 3 rows - WHITE background with subtle borders, LEFT-ALIGNED
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    minHeight: 104,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6DF',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginTop: 4,
    marginBottom: 2,
  },
  lowStockValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'Poppins',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#5C6B63',
    fontFamily: 'Poppins',
  },
  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  viewAllLink: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#8B4513',
    fontFamily: 'Poppins',
  },
  // Product Cards
  productCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  productGrade: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#7C6E65',
    fontFamily: 'Poppins',
    marginTop: 2,
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
  lowStockBadge: {
    backgroundColor: '#FCE9E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowStockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'Poppins',
  },
  productStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
  },
  productStat: {
    minWidth: 64,
  },
  productStatLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7C6E65',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  productStatValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
});
