import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerSpacing,
} from '../theme';

export interface CustomerSupportScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HeadsetSvg = ({ color = '#2E7D32', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 18v-6a9 9 0 0118 0v6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightSvg = ({ color = '#2E7D32', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CustomerSupportScreen: React.FC<CustomerSupportScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const [selectedTab, setSelectedTab] = useState<'All' | 'Open' | 'In Review' | 'Resolved'>('Open');

  const filterTabs: Array<{ id: 'All' | 'Open' | 'In Review' | 'Resolved'; label: string }> = [
    { id: 'All', label: 'All (5)' },
    { id: 'Open', label: 'Open (2)' },
    { id: 'In Review', label: 'In Review (1)' },
    { id: 'Resolved', label: 'Resolved (2)' },
  ];

  const tickets = [
    {
      id: 'SUP-20261115-0039-1',
      ticketNumber: 'SUP-20261115-0039',
      orderNumber: 'ORD-20261115-0039',
      topic: 'Product Support',
      date: '15 Nov 2026, 9:41 AM',
      status: 'Open',
    },
    {
      id: 'SUP-20261115-0039-2',
      ticketNumber: 'SUP-20261115-0039',
      orderNumber: 'ORD-20261115-0039',
      topic: 'Product Support',
      date: '15 Nov 2026, 9:41 AM',
      status: 'Open',
    },
    {
      id: 'SUP-20261110-0012',
      ticketNumber: 'SUP-20261110-0012',
      orderNumber: 'ORD-20261110-0012',
      topic: 'Delivery Delay Support',
      date: '10 Nov 2026, 2:15 PM',
      status: 'In Review',
    },
    {
      id: 'SUP-20261028-0081',
      ticketNumber: 'SUP-20261028-0081',
      orderNumber: 'ORD-20261028-0081',
      topic: 'Refund Assistance',
      date: '28 Oct 2026, 11:30 AM',
      status: 'Resolved',
    },
    {
      id: 'SUP-20261020-0044',
      ticketNumber: 'SUP-20261020-0044',
      orderNumber: 'ORD-20261020-0044',
      topic: 'Payment Query',
      date: '20 Oct 2026, 4:00 PM',
      status: 'Resolved',
    },
  ];

  const filteredTickets = tickets.filter(t => {
    if (selectedTab === 'All') return true;
    return t.status === selectedTab;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── FILTER PILL TABS ────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {filterTabs.map(tab => {
            const isActive = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                onPress={() => setSelectedTab(tab.id)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── TICKETS LIST ────────────────────────────────────────────────────── */}
        <View style={styles.ticketList}>
          {filteredTickets.map(ticket => (
            <TouchableOpacity
              key={ticket.id}
              activeOpacity={0.8}
              onPress={() => {}}
              style={styles.ticketCard}
            >
              <View style={styles.ticketHeaderRow}>
                <Text style={styles.ticketNumberText}>{ticket.ticketNumber}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{ticket.status}</Text>
                  <ChevronRightSvg size={11} color={customerColors.brand} />
                </View>
              </View>

              <View style={styles.ticketBodyRow}>
                <HeadsetSvg size={15} color={customerColors.brand} />
                <Text style={styles.ticketBodyText}>
                  {ticket.orderNumber} - {ticket.topic}
                </Text>
              </View>

              <Text style={styles.ticketDateText}>{ticket.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  tabPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: customerRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabPillActive: {
    backgroundColor: '#E9F7E9',
    borderColor: customerColors.brand,
  },
  tabPillText: {
    fontSize: 11,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  tabPillTextActive: {
    color: customerColors.brand,
    fontWeight: '600',
    fontFamily: customerFonts.semibold,
  },
  ticketList: {
    gap: 14,
  },
  ticketCard: {
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.heading,
    fontFamily: customerFonts.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF8EE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: customerRadius.pill,
  },
  statusBadgeText: {
    fontSize: 11,
    color: customerColors.brand,
    fontWeight: '500',
    fontFamily: customerFonts.regular,
  },
  ticketBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ticketBodyText: {
    fontSize: 12,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  ticketDateText: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
});

