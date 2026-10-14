import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

function WalletBtnIcon({ color = '#1E824C', size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M16 3H4a2 2 0 0 0-2 2v2M18 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function BankBtnIcon({ color = '#1D6399', size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 3L2 8h20L12 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RejectBtnIcon({ color = '#D93838', size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M6 18L18 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export interface RmaTicket {
  id: string;
  ticketNumber: string;
  issue: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  secondaryActionType: 'bank' | 'reject';
  status?: 'Open' | 'Refunded' | 'Rejected';
}

const INITIAL_RMA_TICKETS: RmaTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TKT-2026-00412',
    issue: 'Item quality issue — wilted cabbage',
    customerName: 'Anitha K.',
    orderNumber: 'ORD-20260909-0088',
    amount: 56,
    secondaryActionType: 'bank',
    status: 'Open',
  },
  {
    id: 'tkt-2',
    ticketNumber: 'TKT-2026-00409',
    issue: 'Wrong item received',
    customerName: 'Divya Ramesh',
    orderNumber: 'ORD-20260908-0071',
    amount: 42,
    secondaryActionType: 'reject',
    status: 'Open',
  },
  {
    id: 'tkt-3',
    ticketNumber: 'TKT-2026-00405',
    issue: 'Missing item — Garlic 500g',
    customerName: 'Kavitha S.',
    orderNumber: 'ORD-20260907-0052',
    amount: 65,
    secondaryActionType: 'bank',
    status: 'Open',
  },
  {
    id: 'tkt-4',
    ticketNumber: 'TKT-2026-00398',
    issue: 'Packaging damaged during transit',
    customerName: 'Suresh M.',
    orderNumber: 'ORD-20260906-0033',
    amount: 110,
    secondaryActionType: 'bank',
    status: 'Open',
  },
];

export interface SalesReturnsRefundsScreenProps {
  onBack?: () => void;
}

export function SalesReturnsRefundsScreen({ onBack }: SalesReturnsRefundsScreenProps) {
  const [tickets, setTickets] = useState<RmaTicket[]>(INITIAL_RMA_TICKETS);

  const handleWalletRefund = (ticket: RmaTicket) => {
    Alert.alert(
      'Process Wallet Refund',
      `Credit ₹${ticket.amount} instantly to ${ticket.customerName}'s Tohfa Wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Refund',
          onPress: () => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticket.id ? { ...t, status: 'Refunded' } : t
              )
            );
            Alert.alert('Refund Processed', `₹${ticket.amount} credited to customer wallet.`);
          },
        },
      ]
    );
  };

  const handleBankRefund = (ticket: RmaTicket) => {
    Alert.alert(
      'Process Bank Refund',
      `Initiate bank reversal of ₹${ticket.amount} to ${ticket.customerName}'s source payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Bank Refund',
          onPress: () => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticket.id ? { ...t, status: 'Refunded' } : t
              )
            );
            Alert.alert('Bank Refund Initiated', `Bank transfer of ₹${ticket.amount} initiated.`);
          },
        },
      ]
    );
  };

  const handleReject = (ticket: RmaTicket) => {
    Alert.alert(
      'Reject RMA Ticket',
      `Are you sure you want to reject ticket ${ticket.ticketNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Ticket',
          style: 'destructive',
          onPress: () => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticket.id ? { ...t, status: 'Rejected' } : t
              )
            );
          },
        },
      ]
    );
  };

  const openTickets = tickets.filter((t) => t.status === 'Open');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Returns & Refunds</Text>
          <Text style={styles.screenSubtitle}>
            {openTickets.length} open RMA tickets
          </Text>
        </View>

        {/* Tickets List */}
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.ticketCard}>
              <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
              <Text style={styles.ticketIssue}>{item.issue}</Text>
              <Text style={styles.ticketMeta}>
                {item.customerName} · {item.orderNumber} · ₹{item.amount}
              </Text>

              {item.status === 'Open' ? (
                <View style={styles.actionsRow}>
                  {/* Wallet Refund */}
                  <TouchableOpacity
                    style={styles.walletBtn}
                    onPress={() => handleWalletRefund(item)}
                    activeOpacity={0.7}
                  >
                    <WalletBtnIcon color="#1E824C" size={14} />
                    <Text style={styles.walletBtnText}>Wallet Refund</Text>
                  </TouchableOpacity>

                  {/* Secondary Action */}
                  {item.secondaryActionType === 'bank' ? (
                    <TouchableOpacity
                      style={styles.bankBtn}
                      onPress={() => handleBankRefund(item)}
                      activeOpacity={0.7}
                    >
                      <BankBtnIcon color="#1D6399" size={14} />
                      <Text style={styles.bankBtnText}>Bank Refund</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(item)}
                      activeOpacity={0.7}
                    >
                      <RejectBtnIcon color="#D93838" size={14} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        item.status === 'Refunded' ? '#DCFCE7' : '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          item.status === 'Refunded' ? '#15803D' : '#B91C1C',
                      },
                    ]}
                  >
                    {item.status === 'Refunded' ? '✓ Refunded' : '✕ Rejected'}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 32,
  },
  ticketCard: {
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  ticketNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B2C0D',
    marginBottom: 4,
  },
  ticketIssue: {
    fontSize: 14,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 4,
  },
  ticketMeta: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F8EE',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  walletBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E824C',
  },
  bankBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF3FA',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  bankBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D6399',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE8E8',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D93838',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
