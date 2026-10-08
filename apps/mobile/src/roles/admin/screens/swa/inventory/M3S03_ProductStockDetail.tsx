import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../components';

interface M3S03Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
  onTabChange?: ((tab: any) => void) | undefined;
}

// ─── Custom Icons for Action Buttons ──────────────────────────────────────────

function ActionBatchesIcon({ color = '#F0562A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.6" fill="#FFFFFF" />
      <Path d="M8 10h8M8 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ActionLedgerIcon({ color = '#F0562A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M7 8h10M7 12h10M7 16h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ActionPinIcon({ color = '#F0562A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ActionVerifyIcon({ color = '#F0562A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-12A2.5 2.5 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.6" fill="#FFFFFF" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const M3S03_ProductStockDetail: React.FC<M3S03Props> = ({ onNavigate, onBack, onTabChange }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader colors={['#F0562A', '#F0562A']} 
          title="Tomato"
          subtitle="Grade 1"
          onBack={onBack}
          badge={
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available</Text>
            </View>
          }
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stock Summary - 3 Separate White Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Summary</Text>
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>245 KG</Text>
                <Text style={styles.summaryLabel}>AVAILABLE</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>50 KG</Text>
                <Text style={styles.summaryLabel}>RESERVED</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>120 KG</Text>
                <Text style={styles.summaryLabel}>ALLOCATED</Text>
              </View>
            </View>
          </View>

          {/* Allocation - Single Card Container (matching design mockup exactly) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allocation</Text>
            <View style={styles.allocationSingleCard}>
              <View style={styles.allocationRow}>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>ONLINE</Text>
                  <Text style={styles.allocationValue}>120 KG</Text>
                </View>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>LIVE MARKET</Text>
                  <Text style={styles.allocationValue}>40 KG</Text>
                </View>
              </View>
              <View style={styles.allocationRow}>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>RESERVE</Text>
                  <Text style={styles.allocationValue}>50 KG</Text>
                </View>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>BUFFER</Text>
                  <Text style={styles.allocationValue}>30 KG</Text>
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
              onPress={() => onNavigate('M3S04')}
              activeOpacity={0.7}
            >
              <ActionBatchesIcon color="#8B4513" />
              <Text style={styles.actionButtonText}>View Batches</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate('M3S06')}
              activeOpacity={0.7}
            >
              <ActionLedgerIcon color="#8B4513" />
              <Text style={styles.actionButtonText}>View Ledger</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate('M3S08')}
              activeOpacity={0.7}
            >
              <ActionPinIcon color="#8B4513" />
              <Text style={styles.actionButtonText}>View Storage Locations</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate('M3S10')}
              activeOpacity={0.7}
            >
              <ActionVerifyIcon color="#8B4513" />
              <Text style={styles.actionButtonText}>Verify Stock</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
    paddingTop: 10,
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
    marginBottom: 14,
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
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C6E65',
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
  allocationCol: {
    flex: 1,
  },
  allocationLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C6E65',
    fontFamily: 'Poppins',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  allocationValue: {
    fontSize: 17,
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '500',
    color: '#7C6E65',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  primaryStorageRow: {
    marginTop: 2,
  },
  primaryStorageValue: {
    fontSize: 13.5,
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
    borderColor: '#F0562A',
  },
  actionButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#8B4513',
    fontFamily: 'Poppins',
    marginLeft: 10,
  },
});
