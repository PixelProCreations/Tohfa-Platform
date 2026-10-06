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
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  border: '#EEDCD3',
  orangeDeep: '#7A2E14',
  greenBadge: '#EAF3DE',
  greenText: '#173404',
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

function SearchIcon({ size = 18, color = '#8E8780' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface InvoiceHistoryScreenProps {
  onBack?: () => void;
  onSelectInvoice?: (invoiceId: string) => void;
}

export function InvoiceHistoryScreen({ onBack, onSelectInvoice }: InvoiceHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Invoice History</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar matching screenshot */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Invoice / Order / Customer"
            placeholderTextColor="#8E8780"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Invoice Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectInvoice?.('INV-2026-001245')}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.invoiceId}>INV-2026-001245</Text>
            <View style={styles.badgeGenerated}>
              <Text style={styles.badgeText}>Generated</Text>
            </View>
          </View>

          <Text style={styles.customerSub}>Arun Kumar · ORD-2026-00982</Text>

          <View style={styles.cardDivider} />

          <View style={styles.cardBottomRow}>
            <Text style={styles.invoiceType}>Normal Invoice</Text>
            <Text style={styles.amount}>₹2,100</Text>
          </View>
        </TouchableOpacity>

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
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textInk,
    padding: 0,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceId: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  badgeGenerated: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100, // Full 100px from Design System PDF
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  customerSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3EFE9',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceType: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  amount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
});
