import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  textBody:      '#374151',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
};

// ─── Pure SVG Icons (No Rect or Circle to avoid Hermes runtime errors) ───────

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

function SearchIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21l-4.35-4.35"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export interface SubWarehouseCustomerSearchScreenProps {
  onBack: () => void;
  onSelectCustomer: (customerName: string, customerId?: string) => void;
}

const RECENT_SEARCHES = ['Rajesh Kumar', 'CUS-00192', 'XXXXX12345'];

const SEARCH_DATABASE = [
  { name: 'Rajesh Kumar', id: 'CUS-00291', phone: '+91 XXXXX XXXXX', status: 'Active' },
  { name: 'Priya Stores', id: 'CUS-00152', phone: '+91 XXXXX XXXXX', status: 'Active' },
  { name: 'Ganesh K.', id: 'CUS-00087', phone: '+91 XXXXX XXXXX', status: 'Inactive' },
  { name: 'Ramesh Patel', id: 'CUS-00192', phone: '+91 XXXXX 12345', status: 'Active' },
];

export function SubWarehouseCustomerSearchScreen({
  onBack,
  onSelectCustomer,
}: SubWarehouseCustomerSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? SEARCH_DATABASE.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query)
      )
    : [];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header (Orange Theme with Back Arrow) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Customers</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#7A726C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, Customer ID or mobile"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Search Results (if typing) ─── */}
        {query ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>Search Results</Text>
            <View style={styles.recentCard}>
              {searchResults.length > 0 ? (
                searchResults.map((item, index) => {
                  const isLast = index === searchResults.length - 1;
                  return (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        style={styles.resultRow}
                        onPress={() => onSelectCustomer(item.name, item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultSub}>
                            {item.id} · {item.phone}
                          </Text>
                        </View>
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>{item.status}</Text>
                        </View>
                      </TouchableOpacity>
                      {!isLast && <View style={styles.divider} />}
                    </React.Fragment>
                  );
                })
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No matching customers found</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* ─── Recent Searches (Default matching screenshot) ─── */
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>Recent Searches</Text>
            <View style={styles.recentCard}>
              {RECENT_SEARCHES.map((item, index) => {
                const isLast = index === RECENT_SEARCHES.length - 1;
                return (
                  <React.Fragment key={item}>
                    <TouchableOpacity
                      style={styles.recentRow}
                      onPress={() => onSelectCustomer(item === 'CUS-00192' ? 'Rajesh Kumar' : item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recentText}>{item}</Text>
                    </TouchableOpacity>
                    {!isLast && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  searchBar: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '400',
    color: PALETTE.textInk,
    marginLeft: 8,
    paddingVertical: 0,
  },
  sectionWrap: {
    marginTop: 16,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  recentCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  recentRow: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  recentText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '400',
    color: PALETTE.textBody,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  resultName: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  resultSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  emptyWrap: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 16,
  },
});
