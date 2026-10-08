import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../components';

interface M3S08Props {
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

function WarehouseStoreIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
        stroke="#8B4513"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke="#8B4513"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#0284C7" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export const M3S08_StorageLocationStock: React.FC<M3S08Props> = ({ onNavigate, onBack, onTabChange }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader colors={['#F0562A', '#F0562A']} 
          title="Storage Locations"
          onBack={onBack}
          showWarehouse={true}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Warehouse Header Item */}
          <View style={styles.warehouseRow}>
            <WarehouseStoreIcon />
            <Text style={styles.warehouseTitle}>Coonoor Warehouse</Text>
          </View>

          {/* Cold Storage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cold Storage</Text>

            {/* Section A */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>Section A</Text>
                <View style={styles.greenBadge}>
                  <Text style={styles.greenBadgeText}>75% Full</Text>
                </View>
              </View>
              <Text style={styles.locationMeta}>3 racks · 2 products stored</Text>
              
              {/* Progress Bar (Orange fill ~75%) */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '75%', backgroundColor: '#D97706' }]} />
              </View>
            </View>

            {/* Section B */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>Section B</Text>
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>92% Full</Text>
                </View>
              </View>
              <Text style={styles.locationMeta}>4 racks · 3 products stored</Text>
              
              {/* Progress Bar (Red fill ~92%) */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '92%', backgroundColor: '#EF4444' }]} />
              </View>
            </View>

            {/* Section A · Rack 03 · Shelf 03 */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>Section A · Rack 03 · Shelf 03</Text>
                <View style={styles.tealBadge}>
                  <Text style={styles.tealBadgeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.locationMeta}>BAT-COO-00241 · Tomato · Grade 1</Text>
              
              {/* Progress Bar (Orange fill ~65%) */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '65%', backgroundColor: '#D97706' }]} />
              </View>
            </View>
          </View>

          {/* Dry Storage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dry Storage</Text>

            {/* Section C */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>Section C</Text>
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>Empty</Text>
                </View>
              </View>
              <Text style={styles.locationMeta}>2 racks · 0 products stored</Text>
              
              {/* Progress Bar (0%) */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
            </View>
          </View>

          {/* Info Banner matching design */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <InfoCircleIcon />
            </View>
            <Text style={styles.infoText}>
              Capacity and occupancy figures are read from the warehouse's storage configuration, 
              not entered here — SWA views storage, it doesn't reconfigure it.
            </Text>
          </View>

          <View style={{ height: 24 }} />
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
  lockBarRow: {
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  warehouseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    flex: 1,
    marginRight: 8,
  },
  locationMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F4EFE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  greenBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: 'Poppins',
  },
  redBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  redBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'Poppins',
  },
  tealBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tealBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    fontFamily: 'Poppins',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoIconWrap: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
    fontFamily: 'Poppins',
    lineHeight: 17,
  },
});
