import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../components';

interface M3S05Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
  onTabChange?: ((tab: any) => void) | undefined;
}

function LedgerIcon({ color = '#E85226' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

function VerifyIcon({ color = '#E85226' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" />
      <Path d="M7.5 10l2 2 3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export const M3S05_BatchDetail: React.FC<M3S05Props> = ({ onNavigate, onBack, onTabChange }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="BAT-2026-00124"
          subtitle="Tomato · Grade 1"
          onBack={onBack}
          badge={
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          }
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Batch Information - 2 Column Grid matching reference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batch Information</Text>
            <View style={styles.card}>
              {/* Row 1: Batch Code & Product */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Batch Code</Text>
                  <Text style={styles.fieldValue}>BAT-2026-00124</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Product</Text>
                  <Text style={styles.fieldValue}>Tomato</Text>
                </View>
              </View>

              {/* Row 2: Grade & Warehouse */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Grade</Text>
                  <Text style={styles.fieldValue}>Grade 1</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Warehouse</Text>
                  <Text style={styles.fieldValue}>Coonoor</Text>
                </View>
              </View>

              {/* Row 3: Storage Location & Received Quantity */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Storage Location</Text>
                  <Text style={styles.fieldValue}>Cold Storage · A03</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Received Quantity</Text>
                  <Text style={styles.fieldValue}>100 KG</Text>
                </View>
              </View>

              {/* Row 4: Available Quantity & Received Date */}
              <View style={[styles.gridRow, { marginBottom: 0 }]}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Available Quantity</Text>
                  <Text style={styles.fieldValue}>95 KG</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Received Date</Text>
                  <Text style={styles.fieldValue}>24 Sep 2026</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Traceability - 2 Column Grid with Internal only label */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Traceability</Text>
              <Text style={styles.sectionSubtitleMuted}>Internal only</Text>
            </View>
            <View style={styles.card}>
              <View style={[styles.gridRow, { marginBottom: 0 }]}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Goods Receipt</Text>
                  <Text style={styles.fieldValue}>GR-1024</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Source Farmer</Text>
                  <Text style={styles.fieldValue}>Internal reference</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stock Movement Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Movement Summary</Text>
            <View style={styles.movementCardsRow}>
              <View style={styles.movementCard}>
                <Text style={styles.movementValue}>100 KG</Text>
                <Text style={styles.movementLabel}>RECEIVED</Text>
              </View>
              <View style={styles.movementCard}>
                <Text style={styles.movementValue}>20 KG</Text>
                <Text style={styles.movementLabel}>DISPATCHED</Text>
              </View>
              <View style={styles.movementCard}>
                <Text style={styles.movementValue}>10 KG</Text>
                <Text style={styles.movementLabel}>RESERVED</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate('M3S06')}
              activeOpacity={0.7}
            >
              <LedgerIcon color="#8B4513" />
              <Text style={styles.actionButtonText}>View Stock Ledger</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate('M3S10')}
              activeOpacity={0.7}
            >
              <VerifyIcon color="#8B4513" />
              <Text style={styles.actionButtonText}>Verify Stock</Text>
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
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  sectionSubtitleMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  movementCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  movementCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  movementValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  movementLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    letterSpacing: 0.6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: '#E85226',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B4513',
    fontFamily: 'Poppins',
  },
  activeBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
  },
});
