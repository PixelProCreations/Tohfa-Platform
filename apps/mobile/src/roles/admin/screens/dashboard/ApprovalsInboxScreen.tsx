/**
 * Approvals Inbox Screen (SA-M2-S04)
 * Comprehensive approval inbox for platform escalations, high-value transfers,
 * admin promotions, stock adjustments, and farmer listings/applications.
 */
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

import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  ChevronDownIcon,
  FilterSlidersIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { OverviewApprovalCard } from '../../components/OverviewDashboardCard';
import { t } from '../../i18n';

export interface ApprovalItem {
  id: string;
  category: string;
  statusText: string;
  statusTone?: 'warning' | 'info' | 'danger' | 'success';
  title: string;
  meta: string;
  type: 'payout' | 'transfer' | 'promotion' | 'stock' | 'farmer_application' | 'listing';
}

export interface ApprovalsInboxScreenProps {
  onBack: () => void;
  onSelectApproval: (item: ApprovalItem) => void;
}

export const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'PAY-0002',
    category: 'Farmer Payout (>₹10,000)',
    statusText: 'Escalated',
    statusTone: 'info',
    title: 'PAY-0002 · Kumar · ₹18,000.00',
    meta: 'Escalated by Demo TOHFA Admin · Waiting 4 days',
    type: 'payout',
  },
  {
    id: 'TR-0015',
    category: 'Inter-Warehouse Transfer',
    statusText: 'High value',
    statusTone: 'info',
    title: 'TR-0015 · Ooty → Coonoor · ₹42,000.00',
    meta: 'Requested by Demo Main Warehouse Admin · Waiting 1 day',
    type: 'transfer',
  },
  {
    id: 'PROMO-001',
    category: 'Warehouse Admin Promotion',
    statusText: 'Pending',
    statusTone: 'warning',
    title: 'Priya Nair → Main Warehouse Admin',
    meta: 'Requested by Demo TOHFA Admin · Waiting 2 days',
    type: 'promotion',
  },
  {
    id: 'ADJ-0031',
    category: 'Stock Adjustment',
    statusText: 'Pending',
    statusTone: 'warning',
    title: 'ADJ-0031 · Carrot · -42 kg (Main Warehouse, Ooty)',
    meta: 'Requested by Demo Sub Warehouse Admin · Waiting 6 hours',
    type: 'stock',
  },
  {
    id: 'APP-2026-0101',
    category: 'Farmer Application',
    statusText: 'Pending Review',
    statusTone: 'warning',
    title: 'APP-2026-0101 · Sathish Kumar',
    meta: 'Submitted 5 Oct 2026 · Waiting 3 days',
    type: 'farmer_application',
  },
  {
    id: 'LST-2026-0045',
    category: 'Produce Listing',
    statusText: 'Pending Review',
    statusTone: 'warning',
    title: 'LST-2026-0045 · Tomato Grade 1 · Selvi',
    meta: 'Submitted 11 Oct 2026 · Waiting 2 days',
    type: 'listing',
  },
  {
    id: 'LST-2026-0047',
    category: 'Produce Listing',
    statusText: 'Routed — own listing',
    statusTone: 'warning',
    title: 'LST-2026-0047 · Carrot Grade 2 · Demo Farmer Admin',
    meta: 'Auto-routed away from the Farmer Admin who owns it · Waiting 1 day',
    type: 'listing',
  },
];

export function ApprovalsInboxScreen({
  onBack,
  onSelectApproval,
}: ApprovalsInboxScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, _setSelectedFilter] = useState<string>('All');

  const filteredItems = INITIAL_APPROVALS.filter((item) => {
    if (selectedFilter !== 'All' && item.type !== selectedFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.meta.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('approvalsInbox.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('approvalsInbox.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Count & Filter Row */}
        <View style={styles.filterCountRow}>
          <TouchableOpacity style={styles.filterDropdownPill} activeOpacity={0.7}>
            <Text style={styles.filterCountText}>
              {t('approvalsInbox.allCount', { count: filteredItems.length })}
            </Text>
            <ChevronDownIcon size={14} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Approvals List */}
        <View style={styles.approvalsList}>
          {filteredItems.map((item) => (
            <OverviewApprovalCard
              key={item.id}
              category={item.category}
              statusText={item.statusText}
              statusTone={item.statusTone}
              title={item.title}
              meta={item.meta}
              onPress={() => onSelectApproval(item)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  filterDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
  },
  filterCountText: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '500',
  },
  approvalsList: {
    gap: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
});
