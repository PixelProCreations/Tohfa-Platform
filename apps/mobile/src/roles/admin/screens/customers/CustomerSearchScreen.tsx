import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SAMPLE_CUSTOMERS, type CustomerItem } from './CustomerListScreen';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#888888' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface CustomerSearchScreenProps {
  onBack?: () => void;
  onSelectCustomer?: (customer: CustomerItem) => void;
}

export function CustomerSearchScreen({ onBack, onSelectCustomer }: CustomerSearchScreenProps) {
  const [query, setQuery] = useState('');

  const filteredCustomers = SAMPLE_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Search Customers</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, Customer ID or mobile"
            placeholderTextColor="#888888"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Section: Recent Customers */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Customers</Text>
        </View>

        <View style={styles.resultsList}>
          {filteredCustomers.map((cust) => (
            <TouchableOpacity
              key={cust.id}
              style={styles.recentCard}
              onPress={() => onSelectCustomer?.(cust)}
              activeOpacity={0.8}
            >
              <Text style={styles.custName}>{cust.name}</Text>
              <Text style={styles.custId}>{cust.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  resultsList: {
    gap: 10,
  },
  recentCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  custName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  custId: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
});
