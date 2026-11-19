/**
 * CustomerDirectoryScreen: the full customer list reached from the Customers
 * Management hub's "Customer Directory" quick action. Design: origin/Superadmin-main
 * CustomerManagementFlow.tsx "Screen 2: Customer Directory Screen".
 *
 * Uses real data from GET /admin/customers. Client-side filters for Type and
 * Status (the API's `q` param handles the search string). The Preferred Warehouse
 * filter renders as the design shows but is not wired to the API — the list
 * endpoint has no warehouse filter param and CustomerRow has no warehouse field;
 * dashed where missing, never hidden (CLAUDE.md 2.7).
 *
 * Access: customer.list.view — fail closed.
 * Add button: customer.record.create — hidden when absent.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useCursorList } from '../../api/hooks';
import { listCustomers, type AdminCustomerListItemDto, type CustomerListPage } from '../../api/customers';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { LinkButton } from '../warehouse/customers/CustomersParts';
import {
  BackArrowWhiteIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from './customersManagementIcons';
import { customersManagementStyles as styles } from './customersManagementStyles';

const GRADIENT_ID = 'custDirGrad';
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const SEARCH_DEBOUNCE_MS = 300;
const CUSTOMER_LIST_PERMISSION = 'customer.list.view';
const CUSTOMER_CREATE_PERMISSION = 'customer.record.create';

type DirFilterType = 'All' | 'Individual' | 'B2B';
type DirFilterStatus = 'All' | 'Active' | 'Pending activation';

function useDebounced(value: string, ms: number): string {
  const [d, setD] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setD(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return d;
}

function matchesType(dto: AdminCustomerListItemDto, filter: DirFilterType): boolean {
  if (filter === 'All') return true;
  if (filter === 'Individual') return dto.customerType === 'RETAIL';
  // 'B2B' covers both B2B and HORECA in the design
  return dto.customerType === 'B2B' || dto.customerType === 'HORECA';
}

function matchesStatus(dto: AdminCustomerListItemDto, filter: DirFilterStatus): boolean {
  if (filter === 'All') return true;
  if (filter === 'Active') return dto.status === 'ACTIVE';
  return dto.status === 'INACTIVE';
}

function statusBadgeStyle(status: string) {
  return status === 'ACTIVE' ? dirStyles.badgeActive : dirStyles.badgePending;
}

function statusBadgeTextStyle(status: string) {
  return status === 'ACTIVE' ? dirStyles.badgeActiveText : dirStyles.badgePendingText;
}

function statusLabel(status: string): string {
  if (status === 'ACTIVE') return t('customersDirectory.status.active');
  return t('customersDirectory.status.pendingActivation');
}

function typeLabel(type: string): string {
  if (type === 'RETAIL') return t('customersDirectory.type.individual');
  if (type === 'B2B') return t('customersDirectory.type.b2b');
  if (type === 'HORECA') return t('customersDirectory.type.horeca');
  return type;
}

export interface CustomerDirectoryScreenProps {
  can: Can | undefined;
  onBack: () => void;
  onAddCustomer?: (() => void) | undefined;
  onSelectCustomer: (customer: { id: string; name: string }) => void;
}

export function CustomerDirectoryScreen({
  can,
  onBack,
  onAddCustomer,
  onSelectCustomer,
}: CustomerDirectoryScreenProps) {
  const canView = can?.(CUSTOMER_LIST_PERMISSION) === true;
  const canCreate = can?.(CUSTOMER_CREATE_PERMISSION) === true;

  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<DirFilterType>('All');
  const [filterStatus, setFilterStatus] = useState<DirFilterStatus>('All');

  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);

  const mapFn = useCallback((dto: AdminCustomerListItemDto) => dto, []);
  const list = useCursorList<AdminCustomerListItemDto, AdminCustomerListItemDto, CustomerListPage>(
    ['admin', 'customersDirectory', debouncedSearch],
    (cursor, signal) => listCustomers({ q: debouncedSearch || undefined, cursor }, signal),
    mapFn,
    { enabled: canView },
  );

  const hasActiveFilter = filterType !== 'All' || filterStatus !== 'All';

  const filtered = useMemo(() => {
    return list.items.filter(
      (dto) => matchesType(dto, filterType) && matchesStatus(dto, filterStatus),
    );
  }, [list.items, filterType, filterStatus]);

  const handleResetFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setShowFilterModal(false);
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
        </Svg>

        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWithIconRow}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={HIT_SLOP}
              style={styles.headerBackBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customersDirectory.backA11y')}
            >
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} accessibilityRole="header">
              {t('customersDirectory.title')}
            </Text>
          </View>
          {canCreate && onAddCustomer ? (
            <TouchableOpacity
              style={styles.circularHeaderBtn}
              onPress={onAddCustomer}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('customersDirectory.addA11y')}
              testID="customersDirectory.add"
            >
              <PlusIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!canView ? (
        <AdminEmptyState
          title={t('customersDirectory.notAvailable.title')}
          subtitle={t('customersDirectory.notAvailable.subtitle')}
        />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search bar + filter toggle */}
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('customersDirectory.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              testID="customersDirectory.search"
            />
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
              style={hasActiveFilter ? styles.filterBtnActive : undefined}
              accessibilityRole="button"
              accessibilityLabel={t('customersDirectory.filterA11y')}
            >
              <FilterSlidersIcon
                size={18}
                color={hasActiveFilter ? adminColors.onBrand : adminColors.brand}
              />
            </TouchableOpacity>
          </View>

          {/* Count */}
          <Text style={styles.directoryCountText}>
            {list.isLoading
              ? t('customersDirectory.loading')
              : t('customersDirectory.count', { count: String(filtered.length) })}
          </Text>

          {list.isLoading ? (
            <AdminLoadingState />
          ) : list.error !== null && list.error !== undefined ? (
            <AdminErrorState error={list.error} onRetry={list.refresh} />
          ) : filtered.length === 0 ? (
            <AdminEmptyState title={t('customersDirectory.empty')} />
          ) : (
            <>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.customerCard}
                  onPress={() => onSelectCustomer({ id: item.id, name: item.name })}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.customerCardTitle}>
                      {item.customerCode} · {item.name}
                    </Text>
                    <View style={statusBadgeStyle(item.status)}>
                      <Text style={statusBadgeTextStyle(item.status)}>
                        {statusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.customerCardMetaLine1}>
                    {typeLabel(item.customerType)} · {item.mobileMasked}
                  </Text>
                  <Text style={styles.customerCardMetaLine2}>
                    {item.totalOrders > 0
                      ? t('customersDirectory.orders', { count: String(item.totalOrders) })
                      : t('customersDirectory.noOrders')}
                    {item.lastActivityAt
                      ? ` · ${t('customersDirectory.lastActivity')} ${item.lastActivityAt}`
                      : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              {list.hasMore && list.loadMore ? (
                <LinkButton label={t('customers.loadMore')} onPress={list.loadMore} />
              ) : null}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{t('customersDirectory.filter.title')}</Text>

            <Text style={styles.filterSectionTitle}>{t('customersDirectory.filter.type')}</Text>
            <View style={styles.filterChipsRow}>
              {(['All', 'Individual', 'B2B'] as const).map((option) => {
                const selected = filterType === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() => setFilterType(option)}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {option === 'All'
                        ? t('customersDirectory.filter.all')
                        : option === 'Individual'
                        ? t('customersDirectory.type.individual')
                        : t('customersDirectory.type.b2b')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterSectionTitle}>{t('customersDirectory.filter.status')}</Text>
            <View style={styles.filterChipsRow}>
              {(['All', 'Active', 'Pending activation'] as const).map((option) => {
                const selected = filterStatus === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() => setFilterStatus(option)}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {option === 'All'
                        ? t('customersDirectory.filter.all')
                        : option === 'Active'
                        ? t('customersDirectory.status.active')
                        : t('customersDirectory.status.pendingActivation')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleResetFilters}
                accessibilityRole="button"
              >
                <Text style={styles.modalResetBtnText}>{t('customersDirectory.filter.reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
                accessibilityRole="button"
              >
                <Text style={styles.modalApplyBtnText}>{t('customersDirectory.filter.apply')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Inline badge styles — shared with the hub screen but duplicated here so this
// file has no runtime dependency on the hub's stylesheet.
const dirStyles = StyleSheet.create({
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePendingText: {
    fontSize: 11,
    color: adminColors.warning.text,
    fontWeight: '600',
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActiveText: {
    fontSize: 11,
    color: adminColors.success.text,
    fontWeight: '600',
  },
});
