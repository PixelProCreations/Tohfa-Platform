import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  chipBorder:    '#E8E2D8',
  avatarBg:      '#FFF2EB',
  avatarText:    '#E85226',
  redOverdue:    '#DC2626',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PenIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="#1A1412"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type AgingFilter = 'All' | '0-7 days' | '8-15 days' | '15+ days';

interface PayoutDueItem {
  id: string;
  initials: string;
  farmerName: string;
  agingDays: number;
  agingStatus: 'within window' | 'aging' | 'overdue';
  amount: number;
  requiresDualApproval: boolean;
  farmId: string;
  location: string;
}

const DUES_DATA: PayoutDueItem[] = [
  {
    id: 'pay-1',
    initials: 'VA',
    farmerName: 'Vijay Anand',
    agingDays: 4,
    agingStatus: 'within window',
    amount: 8200,
    requiresDualApproval: false,
    farmId: '#TOHFA-F-00234',
    location: 'Ooty',
  },
  {
    id: 'pay-2',
    initials: 'RS',
    farmerName: 'Ramasamy S.',
    agingDays: 12,
    agingStatus: 'aging',
    amount: 15400,
    requiresDualApproval: true,
    farmId: '#TOHFA-F-00189',
    location: 'Coonoor',
  },
  {
    id: 'pay-3',
    initials: 'KM',
    farmerName: 'Kavitha M.',
    agingDays: 22,
    agingStatus: 'overdue',
    amount: 6750,
    requiresDualApproval: false,
    farmId: '#TOHFA-F-00302',
    location: 'Kotagiri',
  },
  {
    id: 'pay-4',
    initials: 'PR',
    farmerName: 'Praveen Raj',
    agingDays: 2,
    agingStatus: 'within window',
    amount: 9400,
    requiresDualApproval: false,
    farmId: '#TOHFA-F-00411',
    location: 'Gudalur',
  },
  {
    id: 'pay-5',
    initials: 'SB',
    farmerName: 'Selvi B.',
    agingDays: 16,
    agingStatus: 'overdue',
    amount: 4800,
    requiresDualApproval: false,
    farmId: '#TOHFA-F-00142',
    location: 'Coonoor',
  },
];

export interface FarmerPayoutDuesScreenProps {
  onBack: () => void;
  onNavigateToProcessing: (dueItem?: PayoutDueItem | undefined) => void;
}

export function FarmerPayoutDuesScreen({
  onBack,
  onNavigateToProcessing,
}: FarmerPayoutDuesScreenProps) {
  const [activeFilter, setActiveFilter] = useState<AgingFilter>('All');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const filteredList = DUES_DATA.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === '0-7 days') return item.agingDays <= 7;
    if (activeFilter === '8-15 days') return item.agingDays >= 8 && item.agingDays <= 15;
    if (activeFilter === '15+ days') return item.agingDays > 15;
    return true;
  });

  function handleBulkProcess() {
    setIsProcessingBulk(true);
    setTimeout(() => {
      setIsProcessingBulk(false);
      Alert.alert(
        'Bulk Payouts Initiated',
        'Direct bank transfers scheduled for 32 eligible farmer accounts under ₹10,000 via Tohfa Escrow.',
        [{ text: 'OK' }]
      );
    }, 800);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>Farmer Payout Dues</Text>
        <Text style={styles.screenSub}>
          ₹4.2L pending across 34 farmers · aged 7/15/30 days
        </Text>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['All', '0-7 days', '8-15 days', '15+ days'] as AgingFilter[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Farmer Dues List */}
        <View style={styles.duesListCol}>
          {filteredList.map((item) => {
            const isOverdue = item.agingStatus === 'overdue';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.dueCard}
                onPress={() => {
                  if (item.requiresDualApproval) {
                    onNavigateToProcessing(item);
                  }
                }}
                activeOpacity={item.requiresDualApproval ? 0.75 : 1}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>

                <View style={styles.dueDetailsCol}>
                  <Text style={styles.farmerName}>{item.farmerName}</Text>
                  <Text style={[styles.agingText, isOverdue && styles.overdueText]}>
                    {item.agingDays} days · {item.agingStatus}
                  </Text>
                </View>

                <Text style={styles.amountText}>
                  ₹{item.amount.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.btnStack}>
          {/* Primary Bulk Process */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleBulkProcess}
            activeOpacity={0.8}
            disabled={isProcessingBulk}
          >
            <CheckmarkIcon />
            <Text style={styles.primaryBtnText}>
              {isProcessingBulk ? 'Processing...' : 'Bulk-Process Payouts < ₹10K'}
            </Text>
          </TouchableOpacity>

          {/* Secondary Escalate Button */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              const ramasamy = DUES_DATA.find((d) => d.amount > 10000);
              onNavigateToProcessing(ramasamy);
            }}
            activeOpacity={0.75}
          >
            <PenIcon />
            <Text style={styles.secondaryBtnText}>
              Escalate ₹15,400 Payout (&gt; ₹10K)
            </Text>
          </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
  },
  filterChipActive: {
    backgroundColor: PALETTE.orange,
    borderColor: PALETTE.orange,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  duesListCol: {
    gap: 10,
    marginBottom: 24,
  },
  dueCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.avatarText,
  },
  dueDetailsCol: {
    flex: 1,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  agingText: {
    fontSize: 12,
    color: PALETTE.labelMuted,
  },
  overdueText: {
    color: PALETTE.redOverdue,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  btnStack: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
});
