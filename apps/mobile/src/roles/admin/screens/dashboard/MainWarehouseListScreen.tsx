import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MainWarehouseDetailScreen } from './MainWarehouseDetailScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#D97706', // The design has a different header color, looks like #D97706 or similar brownish-orange
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  greenBg: '#E8F5E9',
  greenText: '#15803D',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#999' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MainWarehouseListScreen({ onBack }: { onBack: () => void }) {
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<string | null>(null);

  if (selectedWarehouse) {
    return <MainWarehouseDetailScreen onBack={() => setSelectedWarehouse(null)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#D97706" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Warehouses</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search warehouse name, ID, location"
            placeholderTextColor="#999"
          />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.card} onPress={() => setSelectedWarehouse('Ooty')} activeOpacity={0.8}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Ooty · WH-001</Text>
                <Text style={styles.cardSub}>Ooty, Nilgiris</Text>
              </View>
              <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Active</Text></View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>4,820 kg</Text>
                <Text style={styles.statLabel}>Inventory</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>68%</Text>
                <Text style={styles.statLabel}>Capacity</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>12</Text>
                <Text style={styles.statLabel}>Staff</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => setSelectedWarehouse('Coonoor')} activeOpacity={0.8}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Coonoor · WH-002</Text>
                <Text style={styles.cardSub}>Coonoor, Nilgiris</Text>
              </View>
              <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Active</Text></View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>5,240 kg</Text>
                <Text style={styles.statLabel}>Inventory</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>74%</Text>
                <Text style={styles.statLabel}>Capacity</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>15</Text>
                <Text style={styles.statLabel}>Staff</Text>
              </View>
            </View>
          </TouchableOpacity>

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
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  
  mainContainer: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#000',
    marginLeft: 8,
  },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 2 },
  cardSub: { fontFamily: 'Poppins', fontSize: 11, color: '#666' },
  tagGreen: { backgroundColor: PALETTE.greenBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagGreenText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.greenText },
  
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: PALETTE.border, paddingTop: 16 },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 2 },
  statLabel: { fontFamily: 'Poppins', fontSize: 11, color: '#666' },
});
