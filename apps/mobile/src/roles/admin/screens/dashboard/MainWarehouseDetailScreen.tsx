import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MainWarehouseDocumentsScreen } from './MainWarehouseDocumentsScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#D97706',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentIcon({ color = '#E08331' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseDetailScreen({ onBack }: { onBack: () => void }) {
  const [showDocs, setShowDocs] = useState(false);

  if (showDocs) {
    return <MainWarehouseDocumentsScreen onBack={() => setShowDocs(false)} />;
  }
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#D97706" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Warehouse Detail</Text>
            <Text style={styles.headerSub}>Coonoor Warehouse</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse Name</Text>
                <Text style={styles.value}>Coonoor Warehouse</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse ID</Text>
                <Text style={styles.value}>WH-002</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>Coonoor, Nilgiris</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>Active</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Operational KPIs</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>CURRENT STOCK</Text>
              <Text style={styles.kpiValue}>5,240 kg</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>UTILIZATION</Text>
              <Text style={styles.kpiValue}>74%</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S RECEIVING</Text>
              <Text style={styles.kpiValue}>420 kg</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S ORDERS</Text>
              <Text style={styles.kpiValue}>84</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Warehouse Information</Text>
          <View style={styles.card}>
            <View style={{marginBottom: 16}}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>14 Market Road, Coonoor, Tamil Nadu 643101</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Assigned SWA</Text>
                <Text style={styles.value}>Karthik Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Staff Count</Text>
                <Text style={styles.value}>15</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
              <View style={{marginBottom: 8}}><DocumentIcon /></View>
              <Text style={styles.actionLabel}>View Documents</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { marginRight: 16, marginTop: 4 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontFamily: 'Poppins', fontSize: 12, color: '#FFF0EB', marginTop: 2 },
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#666', marginBottom: 4 },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000' },

  sectionTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8A5A30', marginBottom: 12, marginTop: 8 },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  kpiCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  kpiLabel: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: '#666', marginBottom: 8 },
  kpiValue: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#000' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#EBE5DC',
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#8A5A30', textAlign: 'center' },
});
