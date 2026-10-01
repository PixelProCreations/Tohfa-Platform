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

export interface SupportTicketRecord {
  id: string;
  ticketNo: string;
  subject: string;
  orderRef: string;
  dateText: string;
  status: 'Resolved' | 'Open';
}

const SAMPLE_TICKETS: SupportTicketRecord[] = [
  {
    id: 's1',
    ticketNo: 'SUP-00182',
    subject: 'Pickup Issue',
    orderRef: 'ORD-00251',
    dateText: '24 Sep 2026',
    status: 'Resolved',
  },
];

export interface SubWarehouseSupportHistoryScreenProps {
  customerName?: string;
  onBack: () => void;
}

export function SubWarehouseSupportHistoryScreen({
  customerName = 'Rajesh Kumar',
  onBack,
}: SubWarehouseSupportHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const filteredTickets = SAMPLE_TICKETS.filter((t) => {
    if (!query) return true;
    return (
      t.ticketNo.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.orderRef.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
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

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Support History</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 3 Summary Cards in a row ─── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>OPEN</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>11</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#7A726C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ticket ID, subject or order"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Support Ticket Cards List ─── */}
        {filteredTickets.map((ticket) => {
          return (
            <View key={ticket.id} style={styles.ticketCard}>
              <Text style={styles.ticketNo}>{ticket.ticketNo}</Text>
              <Text style={styles.subjectText}>
                {ticket.subject} · Order {ticket.orderRef}
              </Text>

              <View style={styles.cardBottomRow}>
                <Text style={styles.dateText}>{ticket.dateText}</Text>
                <View style={styles.resolvedBadge}>
                  <Text style={styles.resolvedText}>{ticket.status}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 24 }} />
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
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: 'center',
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
    marginHorizontal: 16,
    marginBottom: 12,
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
  ticketCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  ticketNo: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  subjectText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textBody,
    marginTop: 4,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  resolvedBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resolvedText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
});
