/**
 * A farmer's Payout tab: the payout destination on file and that farmer's
 * payouts, both from the API.
 *
 *   - Payouts: GET /admin/payouts?farmerId= (payout.view), through
 *     api/w5FarmerPayouts. A row carries only what openapi PayoutSummary has
 *     (number, amount, status, requested date); there is no PO number on it,
 *     so that slot is the dash. Tapping a row hands the real payout (its uuid)
 *     to the payout detail screen.
 *   - Payout account: GET /admin/farmers/{id}/bank-accounts
 *     (farmer.bank_account.view). BR-53a: only the last four digits exist, so
 *     the account number can never be unmasked; the eye toggle stays drawn but
 *     disabled.
 *
 * Without the permission nothing is fetched and the list says "not loaded",
 * never "no payouts".
 */
import React, { useMemo, useState } from 'react';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { adminShadow } from '../../theme';
import type { PayoutDetailItem } from './FarmerPayoutDetailScreen';
import type { Can } from '../../permissions/can';
import { useFarmerBankAccounts } from '../../api/farmerHooks';
import { useFarmerPayoutList, type FarmerPayoutSummaryDto } from '../../api/w5FarmerPayouts';
import { moneyText } from '../dashboard/saOverviewFormat';
import { formatAdminDay } from '../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { t, type TranslationKey } from '../../i18n';

function BankBuildingIcon({ size = 18, color = '#D9480F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  farmerName?: string | undefined;
  /** The farmer's UUID (never the TOHFA code): the API filters payouts by it. */
  farmerId?: string | undefined;
  can?: Can | undefined;
  onOpenBankDetails: () => void;
  onOpenPayoutDetail: (payout: PayoutDetailItem) => void;
}

/** A PayoutSummary row as the payout detail screen's item: real fields only. */
export function toPayoutDetailItem(row: FarmerPayoutSummaryDto): PayoutDetailItem {
  const day = formatAdminDay(row.requestedAt);
  return {
    id: row.id,
    code: row.payoutNumber,
    amount: row.amount,
    status: row.status,
    farmerId: row.farmerId,
    farmerName: row.farmerName,
    ...(day === '' ? {} : { date: day }),
  };
}

const STATUS_LABEL_KEYS: Partial<Record<string, TranslationKey>> = {
  REQUESTED: 'wiringFarmers.payouts.status.REQUESTED',
  PENDING_APPROVAL: 'wiringFarmers.payouts.status.PENDING_APPROVAL',
  APPROVED: 'wiringFarmers.payouts.status.APPROVED',
  PROCESSING: 'wiringFarmers.payouts.status.PROCESSING',
  PAID: 'wiringFarmers.payouts.status.PAID',
  FAILED: 'wiringFarmers.payouts.status.FAILED',
  REVERSED: 'wiringFarmers.payouts.status.REVERSED',
};

export function FarmerPayoutTabSection({
  farmerName,
  farmerId,
  can,
  onOpenBankDetails,
  onOpenPayoutDetail,
}: FarmerPayoutTabSectionProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const canViewPayouts = can?.('payout.view') ?? false;
  const canViewBank = can?.('farmer.bank_account.view') ?? false;
  const payouts = useFarmerPayoutList(farmerId, { enabled: canViewPayouts });
  const bank = useFarmerBankAccounts(undefined, farmerId, { enabled: canViewBank });

  const account = useMemo(() => {
    const list = bank.destinations ?? [];
    return list.find((d) => d.isDefault) ?? list[0];
  }, [bank.destinations]);

  const items = useMemo(() => payouts.items.map(toPayoutDetailItem), [payouts.items]);
  // Search narrows the rows already loaded; it is not a server search.
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.code.toLowerCase().includes(q) || item.status.toLowerCase().includes(q);
  });

  const accountNumber =
    account !== undefined && account.accountNumberLast4 !== null
      ? t('wiringFarmers.payouts.accountMasked', { last4: account.accountNumberLast4 })
      : account?.upiVpa ?? ADMIN_NO_VALUE;

  const renderStatusBadge = (status: string) => {
    const key = STATUS_LABEL_KEYS[status];
    const label = key === undefined ? status : t(key);
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <View style={styles.badgeSaApproval}>
            <Text style={styles.badgeSaApprovalText}>{label}</Text>
          </View>
        );
      case 'APPROVED':
      case 'PROCESSING':
        return (
          <View style={styles.badgeProcessing}>
            <Text style={styles.badgeProcessingText}>{label}</Text>
          </View>
        );
      case 'PAID':
        return (
          <View style={styles.badgeSettled}>
            <Text style={styles.badgeSettledText}>{label}</Text>
          </View>
        );
      case 'FAILED':
        return (
          <View style={styles.badgeFailed}>
            <Text style={styles.badgeFailedText}>{label}</Text>
          </View>
        );
      case 'REVERSED':
        return (
          <View style={styles.badgeRejected}>
            <Text style={styles.badgeRejectedText}>{label}</Text>
          </View>
        );
      default:
        return (
          <View style={styles.badgeDefault}>
            <Text style={styles.badgeDefaultText}>{label}</Text>
          </View>
        );
    }
  };

  const renderList = () => {
    if (farmerId === undefined || !canViewPayouts) {
      return <AdminEmptyState title={t('wiringFarmers.payouts.notLoaded')} />;
    }
    if (payouts.isLoading) return <AdminLoadingState />;
    if (payouts.error) return <AdminErrorState error={payouts.error} onRetry={payouts.refresh} />;
    if (items.length === 0) return <AdminEmptyState title={t('wiringFarmers.payouts.empty')} />;
    return filteredItems.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.payoutCard}
        onPress={() => onOpenPayoutDetail(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {/* Top Row: Code + Amount */}
        <View style={styles.payoutCardTop}>
          <Text style={styles.payoutCodeText}>{item.code}</Text>
          <Text style={styles.payoutAmountText}>{moneyText(item.amount)}</Text>
        </View>

        {/* Bottom Row: Date/PO + Status Badge + Chevron. PayoutSummary carries no PO number. */}
        <View style={styles.payoutCardBottom}>
          <Text style={styles.payoutDatePoText}>
            {t('wiringFarmers.payouts.dateAndPo', { date: item.date ?? ADMIN_NO_VALUE, po: ADMIN_NO_VALUE })}
          </Text>
          <View style={styles.statusAndChevron}>
            {renderStatusBadge(item.status)}
            <ChevronRightIcon size={18} color="#A8A29E" />
          </View>
        </View>
      </TouchableOpacity>
    ));
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
            <Text style={styles.payoutAccountTitle}>{t('wiringFarmers.payouts.accountTitle')}</Text>
          </View>
          {account?.isVerified === true ? (
            <View style={styles.verifiedGreenBadge}>
              <Text style={styles.verifiedGreenBadgeText}>{t('wiringFarmers.payouts.bankVerified')}</Text>
            </View>
          ) : null}
        </View>

        {/* Card Body */}
        <View style={styles.bankInfoRow}>
          <View style={styles.bankLogoBox}>
            <BankBuildingIcon size={30} color="#D9480F" />
            <Text style={styles.bankNameSmall}>{account?.bankName ?? ADMIN_NO_VALUE}</Text>
          </View>

          <View style={styles.bankDetailsColumn}>
            <View style={styles.accountDetailRow}>
              <Text style={styles.detailPropLabel}>{t('wiringFarmers.payouts.accountHolder')}</Text>
              <Text style={styles.detailPropValue}>{account?.accountHolderName ?? farmerName ?? ADMIN_NO_VALUE}</Text>
            </View>

            <View style={styles.accountDetailRow}>
              <Text style={styles.detailPropLabel}>{t('wiringFarmers.payouts.accountNumber')}</Text>
              <View style={styles.accountNumberMaskRow}>
                <Text style={styles.detailPropValue}>{accountNumber}</Text>
                {/* BR-53a: the full number is never sent, so there is nothing to unmask. */}
                <TouchableOpacity
                  disabled
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  style={[{ marginLeft: 6 }, styles.actionUnavailable]}
                >
                  <EyeToggleIcon size={13} color="#78716C" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.accountDetailRow}>
              <Text style={styles.detailPropLabel}>{t('wiringFarmers.payouts.ifsc')}</Text>
              <Text style={styles.detailPropValue}>{account?.ifsc ?? ADMIN_NO_VALUE}</Text>
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
            placeholder={t('wiringFarmers.payouts.searchPlaceholder')}
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {/* No filter is defined for this list yet: drawn, disabled. */}
        <TouchableOpacity
          style={[styles.filterBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
        >
          <FilterSlidersIcon size={18} color="#D9480F" />
        </TouchableOpacity>
      </View>

      {/* 3. Payout Transactions List */}
      <View style={styles.payoutList}>{renderList()}</View>
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
  actionUnavailable: {
    opacity: 0.5,
  },
});
