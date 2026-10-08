import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { SWAHeader } from '../components';

interface M3S04Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

export const M3S04_BatchList: React.FC<M3S04Props> = ({ onNavigate, onBack }) => {
  const batches = [
    {
      id: 'BAT-2026-00124',
      product: 'Tomato',
      grade: 'Grade 1',
      status: 'Active',
      available: '95 KG',
      storage: 'Cold Storage · A03',
      dateText: 'Received 24 Sep 2026',
    },
    {
      id: 'BAT-2026-00125',
      product: 'Tomato',
      grade: 'Grade 1',
      status: 'Active',
      available: '150 KG',
      storage: 'Cold Storage · A04',
      dateText: 'Received 24 Sep 2026',
    },
    {
      id: 'BAT-2026-00098',
      product: 'Tomato',
      grade: 'Grade 1',
      status: 'Active',
      available: '0 KG',
      storage: 'Cold Storage · A01',
      dateText: 'Fully consumed',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader colors={['#F0562A', '#F0562A']} 
          title="Batches"
          subtitle="Tomato · Grade 1 · 5 Active Batches"
          onBack={onBack}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {batches.map((batch, index) => (
          <TouchableOpacity
            key={index}
            style={styles.batchCard}
            onPress={() => onNavigate('M3S05')}
            activeOpacity={0.7}
          >
            <View style={styles.batchHeader}>
              <Text style={styles.batchId}>{batch.id}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{batch.status}</Text>
              </View>
            </View>
            <Text style={styles.batchProduct}>{batch.product} · {batch.grade}</Text>
            
            <View style={styles.batchStatsRow}>
              <View style={styles.batchStatCol}>
                <Text style={styles.batchStatLabel}>Available</Text>
                <Text style={styles.batchStatValueAvailable}>{batch.available}</Text>
              </View>
              <View style={styles.batchStatCol}>
                <Text style={styles.batchStatLabel}>Storage</Text>
                <Text style={styles.batchStatValueStorage}>{batch.storage}</Text>
              </View>
            </View>
            
            <Text style={styles.batchDate}>{batch.dateText}</Text>
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  batchId: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  activeBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
  },
  batchProduct: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 14,
  },
  batchStatsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  batchStatCol: {
    width: '42%',
  },
  batchStatLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C6E65',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  batchStatValueAvailable: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  batchStatValueStorage: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  batchDate: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#8B4513',
    textAlign: 'right',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
});
