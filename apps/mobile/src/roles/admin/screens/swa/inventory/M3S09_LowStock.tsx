import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../components';

interface M3S09Props {
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

function TrendingDownIcon({ color = '#EF4444', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 18l-9.5-9.5-5 5L1 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 18h6v-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color = '#9CA3AF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export const M3S09_LowStock: React.FC<M3S09Props> = ({ onNavigate, onBack, onTabChange }) => {
  const lowStockItems = [
    {
      name: 'Carrot — Grade 1',
      available: '12 KG',
      threshold: '20 KG',
    },
    {
      name: 'Beans — Grade 1',
      available: '8 KG',
      threshold: '15 KG',
    },
    {
      name: 'Spinach — Grade 2',
      available: '0 KG',
      threshold: '10 KG',
    },
    {
      name: 'Beetroot — Grade 1',
      available: '6 KG',
      threshold: '12 KG',
    },
    {
      name: 'Cow Milk',
      available: '4 L',
      threshold: '10 L',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Low Stock"
          onBack={onBack}
        />

        {/* Warehouse Pill */}
        <View style={styles.warehousePillRow}>
          <View style={styles.warehousePill}>
            <LockSmallIcon />
            <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <InfoCircleIcon />
            </View>
            <Text style={styles.infoText}>
              Thresholds shown below are read from system configuration — never a fixed number in this app.
            </Text>
          </View>

          {/* Low Stock Items matching Image 4 Left */}
          {lowStockItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.itemCard}
              onPress={() => onNavigate('M3S03')}
              activeOpacity={0.7}
            >
              <View style={styles.itemRow}>
                <View style={styles.iconWrap}>
                  <TrendingDownIcon color="#EF4444" size={20} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    Available {item.available} · Configured Threshold {item.threshold}
                  </Text>
                </View>
                <ChevronRightIcon color="#9CA3AF" size={18} />
              </View>
            </TouchableOpacity>
          ))}

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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
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
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    borderLeftWidth: 4.5,
    borderLeftColor: '#EF4444',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  itemDetails: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 3,
  },
});
