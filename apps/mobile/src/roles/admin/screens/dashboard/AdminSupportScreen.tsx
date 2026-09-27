import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  textHeading: '#662208',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  orangePrimary: '#D9532F',
  orangeLight: '#FFF1EB',
  borderSoft: '#F0ECE6',
  borderCard: '#ECE5DC',
  greenSuccess: '#166534',
  greenLight: '#EAF7EE',
  redAlert: '#DC2626',
  redLight: '#FDF2F0',
  amberWarn: '#B45309',
  amberLight: '#FEF3C7',
  blueInfo: '#1D4ED8',
  blueLight: '#EFF6FF',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1F2937"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PhoneIcon({ color = PALETTE.orangePrimary }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ color = PALETTE.greenSuccess }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon({ color = PALETTE.textSecondary }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertTriangleIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={PALETTE.redAlert}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={PALETTE.redAlert} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HeadsetIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18v-6a9 9 0 0118 0v6"
        stroke={PALETTE.orangePrimary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
        stroke={PALETTE.orangePrimary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Mock Ticket Data ─────────────────────────────────────────────────────────
interface SupportTicket {
  id: string;
  ticketNo: string;
  category: 'PAYMENT' | 'QUALITY' | 'LOGISTICS' | 'KYC';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  subject: string;
  description: string;
  userName: string;
  userRole: 'Farmer' | 'B2B Buyer' | 'Wholesale Trader';
  userCode: string;
  userPhone: string;
  hub: string;
  timeAgo: string;
  relatedBatch?: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: '1',
    ticketNo: '#TCK-2041',
    category: 'PAYMENT',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Payout delayed for Batch #CR-882 (Carrots 1,200kg)',
    description:
      'Bank NEFT transfer pending after warehouse gate receipt verification. Farmer needs funds for seed procurement.',
    userName: 'Ramasamy S.',
    userRole: 'Farmer',
    userCode: '#TOHFA-F-00189',
    userPhone: '+91 94431 28910',
    hub: 'Coonoor Hub',
    timeAgo: '15m ago',
    relatedBatch: 'Batch #CR-882 · Carrots 1,200kg',
  },
  {
    id: '2',
    ticketNo: '#TCK-2039',
    category: 'QUALITY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    subject: 'Grade discrepancy dispute at Secondary Hub receipt',
    description:
      'Dispatched Grade 1 Cabbage batch received with 2 broken crates. Discrepancy logged by hub intake supervisor.',
    userName: 'Nilgiri Organic Mart',
    userRole: 'B2B Buyer',
    userCode: '#TOHFA-B-00812',
    userPhone: '+91 98422 45120',
    hub: 'Ooty Sub-WH',
    timeAgo: '42m ago',
    relatedBatch: 'Order #ORD-8419 · Cabbage 450kg',
  },
  {
    id: '3',
    ticketNo: '#TCK-2035',
    category: 'KYC',
    priority: 'MEDIUM',
    status: 'OPEN',
    subject: 'PGS Organic certificate renewal PDF upload error',
    description:
      'Renewal certificate PDF file size exceeded 5MB limit. Needs admin assistance or manual document attachment.',
    userName: 'Lakshmi R.',
    userRole: 'Farmer',
    userCode: '#TOHFA-F-00289',
    userPhone: '+91 97892 11045',
    hub: 'Ooty Valley',
    timeAgo: '1h ago',
  },
  {
    id: '4',
    ticketNo: '#TCK-2031',
    category: 'LOGISTICS',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Reefer vehicle pickup delayed at Kotagiri pickup point',
    description:
      'Scheduled pickup for 200kg Tea harvest was 8:00 AM. Driver reported mechanical issue at Mettupalayam ghat.',
    userName: 'Vijay Anand',
    userRole: 'Farmer',
    userCode: '#TOHFA-F-00234',
    userPhone: '+91 94861 77230',
    hub: 'Kotagiri WH',
    timeAgo: '2h ago',
    relatedBatch: 'Logistics Trip #LOG-3301',
  },
  {
    id: '5',
    ticketNo: '#TCK-2028',
    category: 'PAYMENT',
    priority: 'MEDIUM',
    status: 'OPEN',
    subject: 'GST invoice reverse-charge split correction requested',
    description:
      'Buyer requires revised tax invoice displaying RCM credit note before monthly closing ledger run.',
    userName: 'Fresh Greens Horeca',
    userRole: 'B2B Buyer',
    userCode: '#TOHFA-H-00042',
    userPhone: '+91 99401 55670',
    hub: 'Coimbatore Hub',
    timeAgo: '3h ago',
    relatedBatch: 'Invoice #INV-2026-0914',
  },
  {
    id: '6',
    ticketNo: '#TCK-2024',
    category: 'QUALITY',
    priority: 'MEDIUM',
    status: 'OPEN',
    subject: 'Moisture content QC calibration log query',
    description:
      'Farmer requesting recalibration lab test certificate for CTC Tea consignment leaf grade verification.',
    userName: 'Muthukumar S.',
    userRole: 'Farmer',
    userCode: '#TOHFA-F-00104',
    userPhone: '+91 98433 90124',
    hub: 'Kotagiri WH',
    timeAgo: '4h ago',
  },
  {
    id: '7',
    ticketNo: '#TCK-2019',
    category: 'LOGISTICS',
    priority: 'LOW',
    status: 'OPEN',
    subject: 'Empty crate return pickup scheduling for upcoming market day',
    description:
      'Farmer has 30 Tohfa returnable plastic crates ready for collection before Friday harvest intake.',
    userName: 'Kavitha M.',
    userRole: 'Farmer',
    userCode: '#TOHFA-F-00302',
    userPhone: '+91 94420 88712',
    hub: 'Coonoor Hub',
    timeAgo: 'Yesterday',
  },
];

// ─── Props ───────────────────────────────────────────────────────────────────
export interface AdminSupportScreenProps {
  onBack: () => void;
}

export function AdminSupportScreen({ onBack }: AdminSupportScreenProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PAYMENT' | 'QUALITY' | 'LOGISTICS' | 'KYC'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH'>('ALL');

  const openCount = tickets.filter((t) => t.status !== 'RESOLVED').length;
  const highPriorityCount = tickets.filter((t) => t.priority === 'HIGH' && t.status !== 'RESOLVED').length;

  const handleResolveTicket = (ticket: SupportTicket) => {
    Alert.alert(
      'Resolve Ticket',
      `Mark ticket ${ticket.ticketNo} as resolved? Resolution notification will be sent to ${ticket.userName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          style: 'default',
          onPress: () => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticket.id ? { ...t, status: 'RESOLVED' } : t
              )
            );
            Alert.alert('Ticket Resolved', `${ticket.ticketNo} has been closed.`);
          },
        },
      ]
    );
  };

  const handleCallUser = (ticket: SupportTicket) => {
    Alert.alert(
      `Call ${ticket.userName}`,
      `Dialing ${ticket.userPhone} (${ticket.userRole} · ${ticket.hub})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => {} },
      ]
    );
  };

  const handleReplyTicket = (ticket: SupportTicket) => {
    Alert.alert(
      `Quick Response to ${ticket.ticketNo}`,
      `Send automated resolution update to ${ticket.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SMS & Push',
          onPress: () => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticket.id ? { ...t, status: 'IN_PROGRESS' } : t
              )
            );
            Alert.alert('Update Sent', `Status updated to In Progress for ${ticket.ticketNo}.`);
          },
        },
      ]
    );
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (selectedFilter !== 'ALL' && ticket.category !== selectedFilter) return false;
    if (priorityFilter === 'HIGH' && ticket.priority !== 'HIGH') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ticket.ticketNo.toLowerCase().includes(q) ||
        ticket.userName.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.hub.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Circular Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackChevronIcon />
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <HeadsetIcon />
            <Text style={styles.headerBadgeText}>TOHFA Helpdesk</Text>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.screenTitle}>Support Hub</Text>
        <Text style={styles.screenSub}>
          {openCount} open tickets awaiting admin resolution · Nilgiris Zone
        </Text>

        {/* 4 KPI Summary Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{openCount}</Text>
            <Text style={styles.kpiLabel}>Open Tickets</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: PALETTE.redAlert }]}>{highPriorityCount}</Text>
            <Text style={styles.kpiLabel}>High Priority</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>28m</Text>
            <Text style={styles.kpiLabel}>Avg Response</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: PALETTE.greenSuccess }]}>96%</Text>
            <Text style={styles.kpiLabel}>Resolution</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets, farmers, orders..."
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: PALETTE.textSecondary, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
              All ({tickets.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'PAYMENT' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('PAYMENT')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, selectedFilter === 'PAYMENT' && styles.filterTextActive]}>
              Payment & Dues
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'QUALITY' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('QUALITY')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, selectedFilter === 'QUALITY' && styles.filterTextActive]}>
              Quality / QC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'LOGISTICS' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('LOGISTICS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, selectedFilter === 'LOGISTICS' && styles.filterTextActive]}>
              Logistics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'KYC' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('KYC')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, selectedFilter === 'KYC' && styles.filterTextActive]}>
              KYC & Docs
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Ticket List */}
        <View style={styles.ticketListContainer}>
          {filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'RESOLVED';
            const isHigh = ticket.priority === 'HIGH';

            return (
              <View
                key={ticket.id}
                style={[styles.ticketCard, isResolved && { opacity: 0.6 }]}
              >
                {/* Card Top Row: ID, Priority, Time */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.ticketIdBadge}>
                    <Text style={styles.ticketIdText}>{ticket.ticketNo}</Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    {isHigh && !isResolved && (
                      <View style={styles.priorityHighBadge}>
                        <AlertTriangleIcon />
                        <Text style={styles.priorityHighText}>HIGH</Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.statusBadge,
                        ticket.status === 'OPEN' && { backgroundColor: PALETTE.orangeLight },
                        ticket.status === 'IN_PROGRESS' && { backgroundColor: PALETTE.blueLight },
                        ticket.status === 'RESOLVED' && { backgroundColor: PALETTE.greenLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          ticket.status === 'OPEN' && { color: PALETTE.orangePrimary },
                          ticket.status === 'IN_PROGRESS' && { color: PALETTE.blueInfo },
                          ticket.status === 'RESOLVED' && { color: PALETTE.greenSuccess },
                        ]}
                      >
                        {ticket.status === 'IN_PROGRESS' ? 'IN PROGRESS' : ticket.status}
                      </Text>
                    </View>

                    <Text style={styles.timeText}>{ticket.timeAgo}</Text>
                  </View>
                </View>

                {/* User Info Line */}
                <View style={styles.userInfoRow}>
                  <Text style={styles.userNameText}>{ticket.userName}</Text>
                  <View style={styles.userRoleTag}>
                    <Text style={styles.userRoleText}>{ticket.userRole}</Text>
                  </View>
                  <Text style={styles.userCodeText}>{ticket.userCode}</Text>
                  <Text style={styles.hubDot}>·</Text>
                  <Text style={styles.hubText}>{ticket.hub}</Text>
                </View>

                {/* Subject & Description */}
                <Text style={styles.subjectText}>{ticket.subject}</Text>
                <Text style={styles.descriptionText}>{ticket.description}</Text>

                {ticket.relatedBatch && (
                  <View style={styles.batchTag}>
                    <Text style={styles.batchTagText}>📦 {ticket.relatedBatch}</Text>
                  </View>
                )}

                {/* Action Buttons Row */}
                {!isResolved && (
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.resolveBtn}
                      onPress={() => handleResolveTicket(ticket)}
                      activeOpacity={0.8}
                    >
                      <CheckmarkIcon />
                      <Text style={styles.resolveBtnText}>Resolve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCallUser(ticket)}
                      activeOpacity={0.8}
                    >
                      <PhoneIcon />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => handleReplyTicket(ticket)}
                      activeOpacity={0.8}
                    >
                      <ChatIcon />
                      <Text style={styles.replyBtnText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {filteredTickets.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching tickets</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or category filter.
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Field Escalation Card */}
        <View style={styles.hotlineCard}>
          <View style={styles.hotlineHeader}>
            <PhoneIcon color="#B45309" />
            <Text style={styles.hotlineTitle}>Tohfa Nilgiris Field Ops Escalation</Text>
          </View>
          <Text style={styles.hotlineBody}>
            For urgent weighbridge or cold-chain logistics breakdowns, contact Nilgiris Zonal Coordinator:
            +91 94890 00112 (Available 24x7).
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orangePrimary,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 18,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textPrimary,
    padding: 0,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  filterPillActive: {
    backgroundColor: PALETTE.orangePrimary,
    borderColor: PALETTE.orangePrimary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ticketListContainer: {
    gap: 12,
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketIdBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityHighBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.redLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  priorityHighText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.redAlert,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  userRoleTag: {
    backgroundColor: PALETTE.orangeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.orangePrimary,
  },
  userCodeText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  hubDot: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  hubText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  batchTag: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  batchTagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.greenLight,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  resolveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenSuccess,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.orangeLight,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orangePrimary,
  },
  replyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  hotlineCard: {
    backgroundColor: PALETTE.amberLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hotlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hotlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  hotlineBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
});
