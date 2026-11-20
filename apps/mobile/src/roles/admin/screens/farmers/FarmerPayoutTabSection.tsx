import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow } from '../../theme';
import type { PayoutDetailItem } from './FarmerPayoutDetailScreen';

function BankBuildingIcon({ size = 18, color = '#D9480F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HdfcLogoIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect width="32" height="32" rx="4" fill="#004C8F" />
      <Rect x="4" y="4" width="24" height="24" rx="2" fill="#FFFFFF" />
      <Rect x="12" y="6" width="8" height="20" fill="#ED1C24" />
      <Rect x="6" y="12" width="20" height="8" fill="#ED1C24" />
      <Rect x="12" y="12" width="8" height="8" fill="#004C8F" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = '#A8A29E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#D9480F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#A8A29E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeToggleIcon({ size = 14, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface FarmerPayoutTabSectionProps {
  farmerName?: string;
  farmerId?: string;
  onOpenBankDetails: () => void;
  onOpenPayoutDetail: (payout: PayoutDetailItem) => void;
}

export const DEMO_PAYOUT_ITEMS: PayoutDetailItem[] = [
  {
    id: 'pay-1',
    code: 'PAY-0008',
    amount: '₹10,800',
    status: 'SA Approval Required',
    date: '18 Nov 2026',
    poNumber: 'PO-2026-0038',
    produce: 'Beans',
    quantity: '300 kg',
  },
  {
    id: 'pay-2',
    code: 'PAY-0008',
    amount: '₹10,800',
    status: 'Processing',
    date: '18 Nov 2026',
    poNumber: 'PO-2026-0038',
    produce: 'Beans',
    quantity: '300 kg',
  },
  {
    id: 'pay-3',
    code: 'PAY-0008',
    amount: '₹10,800',
    status: 'Settled',
    date: '18 Nov 2026',
    poNumber: 'PO-2026-0038',
    produce: 'Carrot',
    quantity: '250 kg',
  },
  {
    id: 'pay-4',
    code: 'PAY-0008',
    amount: '₹10,800',
    status: 'Settled',
    date: '18 Nov 2026',
    poNumber: 'PO-2026-0038',
    produce: 'Cabbage',
    quantity: '400 kg',
  },
  {
    id: 'pay-5',
    code: 'PAY-0008',
    amount: '₹5,000',
    status: 'Failed',
    date: '18 Nov 2026',
    poNumber: 'PO-2026-0038',
    produce: 'Beetroot',
    quantity: '150 kg',
  },
  {
    id: 'pay-6',
    code: 'PAY-0008',
    amount: '₹5,000',
    status: 'Rejected',
    date: '18 Nov 2026',
    poNumber: 'PO-2026-0038',
    produce: 'Potato',
    quantity: '180 kg',
  },
];

export function FarmerPayoutTabSection({
  farmerName = 'Ramesh Kumar',
  farmerId = 'FMR-00124',
  onOpenBankDetails,
  onOpenPayoutDetail,
}: FarmerPayoutTabSectionProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState(true);

  const filteredItems = DEMO_PAYOUT_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.code.toLowerCase().includes(q) ||
      item.amount.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      (item.poNumber && item.poNumber.toLowerCase().includes(q))
    );
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SA Approval Required':
        return (
          <View style={styles.badgeSaApproval}>
            <Text style={styles.badgeSaApprovalText}>SA Approval Required</Text>
          </View>
        );
      case 'Processing':
        return (
          <View style={styles.badgeProcessing}>
            <Text style={styles.badgeProcessingText}>Processing</Text>
          </View>
        );
      case 'Settled':
        return (
          <View style={styles.badgeSettled}>
            <Text style={styles.badgeSettledText}>Settled</Text>
          </View>
        );
      case 'Failed':
        return (
          <View style={styles.badgeFailed}>
            <Text style={styles.badgeFailedText}>Failed</Text>
          </View>
        );
      case 'Rejected':
        return (
          <View style={styles.badgeRejected}>
            <Text style={styles.badgeRejectedText}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={styles.badgeDefault}>
            <Text style={styles.badgeDefaultText}>{status}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.sectionContainer}>
      {/* 1. Payout Account Card */}
      <TouchableOpacity
        style={styles.payoutAccountCard}
        onPress={onOpenBankDetails}
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.payoutAccountHeader}>
          <View style={styles.payoutAccountHeaderLeft}>
            <BankBuildingIcon size={18} color="#D9480F" />
            <Text style={styles.payoutAccountTitle}>Payout Account</Text>
          </View>
          <View style={styles.verifiedGreenBadge}>
            <Text style={styles.verifiedGreenBadgeText}>✓ Bank verified</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.bankInfoRow}>
          <View style={styles.bankLogoBox}>
            <HdfcLogoIcon size={30} />
            <Text style={styles.bankNameSmall}>HDFC Bank</Text>
          </View>

          <View style={styles.bankDetailsColumn}>
            <View style={styles.accountDetailRow}>
              <Text style={styles.detailPropLabel}>Account Holder :</Text>
              <Text style={styles.detailPropValue}>{farmerName} Farm</Text>
            </View>

            <View style={styles.accountDetailRow}>
              <Text style={styles.detailPropLabel}>Account Number :</Text>
              <View style={styles.accountNumberMaskRow}>
                <Text style={styles.detailPropValue}>
                  {accountNumberMasked ? '******4821' : '501004821992'}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setAccountNumberMasked(!accountNumberMasked);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: 6 }}
                >
                  <EyeToggleIcon size={13} color="#78716C" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.accountDetailRow}>
              <Text style={styles.detailPropLabel}>IFSC Code       :</Text>
              <Text style={styles.detailPropValue}>IDIB000C123</Text>
            </View>
          </View>

          <View style={styles.chevronBox}>
            <ChevronRightIcon size={20} color="#78716C" />
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. Search & Filter Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputBox}>
          <SearchIcon size={16} color="#A8A29E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <FilterSlidersIcon size={18} color="#D9480F" />
        </TouchableOpacity>
      </View>

      {/* 3. Payout Transactions List */}
      <View style={styles.payoutList}>
        {filteredItems.map((item, idx) => (
          <TouchableOpacity
            key={`${item.id}-${idx}`}
            style={styles.payoutCard}
            onPress={() => onOpenPayoutDetail(item)}
            activeOpacity={0.7}
          >
            {/* Top Row: Code + Amount */}
            <View style={styles.payoutCardTop}>
              <Text style={styles.payoutCodeText}>{item.code}</Text>
              <Text style={styles.payoutAmountText}>{item.amount}</Text>
            </View>

            {/* Bottom Row: Date/PO + Status Badge + Chevron */}
            <View style={styles.payoutCardBottom}>
              <Text style={styles.payoutDatePoText}>
                {item.date} | {item.poNumber}
              </Text>
              <View style={styles.statusAndChevron}>
                {renderStatusBadge(item.status)}
                <ChevronRightIcon size={18} color="#A8A29E" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  payoutAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  payoutAccountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  payoutAccountHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payoutAccountTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 6,
  },
  verifiedGreenBadge: {
    backgroundColor: '#E6F4EA',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedGreenBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#137333',
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 68,
  },
  bankNameSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 4,
    textAlign: 'center',
  },
  bankDetailsColumn: {
    flex: 1,
    gap: 4,
  },
  accountDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailPropLabel: {
    fontSize: 11.5,
    color: '#78716C',
    width: 106,
  },
  detailPropValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1C1917',
  },
  accountNumberMaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronBox: {
    marginLeft: 8,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInputBox: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#1C1917',
    paddingVertical: 0,
    marginLeft: 6,
  },
  filterBtn: {
    width: 42,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutList: {
    gap: 12,
  },
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    ...adminShadow.sm,
  },
  payoutCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  payoutAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  payoutCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutDatePoText: {
    fontSize: 12,
    color: '#78716C',
  },
  statusAndChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeSaApproval: {
    backgroundColor: '#FEF3EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSaApprovalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  badgeProcessing: {
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeProcessingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  badgeSettled: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSettledText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#137333',
  },
  badgeFailed: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeFailedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  badgeRejected: {
    backgroundColor: '#FFE4E6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRejectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E11D48',
  },
  badgeDefault: {
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDefaultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
  },
});
