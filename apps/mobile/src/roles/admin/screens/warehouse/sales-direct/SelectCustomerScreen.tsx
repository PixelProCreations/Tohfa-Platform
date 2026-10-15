/**
 * Select Customer (design M6-S05): the buyer of a counter sale. Either a
 * registered customer found through GET /admin/sales/customers/lookup
 * (sales.sale.create, BR-91, BR-92: a 10+ digit mobile or a 2+ character `q`),
 * or a walk-in with a name and an optional mobile (BR-86: exactly one of the
 * two goes on the sale).
 *
 * The lookup returns a masked mobile only; the full number never reaches the
 * phone. A walk-in cannot pay from a wallet; Payment enforces that.
 */
import React, { useEffect, useState } from 'react';
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
import Svg, { Circle, Path } from 'react-native-svg';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { normalizeWalkInMobile, type SaleBuyerInput, type SaleCustomerView } from './mappers';
import type { WarehouseScreenBaseProps } from './types';
import { useSaleCustomerLookup } from './useSalesData';

const SEARCH_DEBOUNCE_MS = 300;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" fill={adminColors.success.bg} />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Design id: M6-S05
export interface SelectCustomerScreenProps extends WarehouseScreenBaseProps {
  /** Opened from New Sale / Payment to only pick the buyer; otherwise it continues to Payment. */
  pickOnly: boolean;
  /** Search text to start with (e.g. a customer code the caller passed). */
  initialQuery?: string | undefined;
  onPick: (buyer: SaleBuyerInput) => void;
}

type Mode = 'CUSTOMER' | 'WALK_IN';

export function SelectCustomerScreen({ can, onBack, pickOnly, initialQuery, onPick }: SelectCustomerScreenProps) {
  const canCreate = can('sales.sale.create');
  const [mode, setMode] = useState<Mode>('CUSTOMER');

  // ─── Registered customer lookup ───
  const [search, setSearch] = useState(initialQuery ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery ?? '');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);
  // Without the permission no lookup is sent ('' is never a valid lookup).
  const lookup = useSaleCustomerLookup(canCreate && mode === 'CUSTOMER' ? debouncedSearch : '');
  const [selected, setSelected] = useState<SaleCustomerView | null>(null);

  // ─── Walk-in ───
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState('');
  const [attempted, setAttempted] = useState(false);
  const nameMissing = walkInName.trim() === '';
  const mobileInvalid = normalizeWalkInMobile(walkInMobile) === null;

  const submit = () => {
    if (mode === 'CUSTOMER') {
      setAttempted(true);
      if (selected !== null) onPick({ kind: 'CUSTOMER', customer: selected });
      return;
    }
    setAttempted(true);
    if (nameMissing || mobileInvalid) return;
    const mobile = walkInMobile.trim();
    onPick({ kind: 'WALK_IN', name: walkInName.trim(), mobile: mobile === '' ? undefined : mobile });
  };

  const view = queryViewState({ isLoading: lookup.isLoading, error: lookup.error, itemCount: lookup.customers.length });

  let results: React.ReactNode;
  if (!lookup.searched) {
    results = <Text style={styles.hintText}>{t('sales.customer.searchHint')}</Text>;
  } else if (view === 'loading') {
    results = <AdminLoadingState />;
  } else if (view === 'error') {
    results = <AdminErrorState error={lookup.error} onRetry={lookup.refresh} />;
  } else if (view === 'empty') {
    results = <AdminEmptyState title={t('sales.customer.noMatch')} subtitle={t('sales.customer.noMatchHint')} />;
  } else {
    results = lookup.customers.map((customer) => {
      const isSelected = selected?.customerId === customer.customerId;
      return (
        <TouchableOpacity
          key={customer.customerId}
          style={[styles.customerCard, isSelected && styles.customerCardSelected]}
          onPress={() => setSelected(customer)}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
        >
          <View style={styles.customerHeader}>
            <Text style={[styles.customerName, styles.flex]}>{customer.name}</Text>
            {isSelected ? <CheckCircleIcon size={22} /> : null}
          </View>
          <Text style={styles.customerSubtitle}>
            {t('sales.customer.codeMobile', { code: customer.customerCode, mobile: customer.mobileMasked })}
          </Text>
          <Text style={styles.walletText}>
            {t('sales.customer.wallet', { amount: formatPaise(customer.walletBalancePaise) })}
          </Text>
        </TouchableOpacity>
      );
    });
  }

  const header = (
    <View style={styles.headerBanner}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('sales.common.back')}
        >
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('sales.customer.title')}
        </Text>
      </View>
    </View>
  );

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <AdminEmptyState title={t('sales.common.noPermission')} />
      </SafeAreaView>
    );
  }

  const modes: { id: Mode; label: string }[] = [
    { id: 'CUSTOMER', label: t('sales.customer.modeRegistered') },
    { id: 'WALK_IN', label: t('sales.customer.modeWalkIn') },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <View style={styles.modeRow}>
        {modes.map((m) => {
          const active = mode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeChip, active && styles.modeChipActive]}
              onPress={() => {
                setMode(m.id);
                setAttempted(false);
              }}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'CUSTOMER' ? (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('sales.customer.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setSelected(null);
              }}
              autoCorrect={false}
              accessibilityLabel={t('sales.customer.searchLabel')}
            />
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'CUSTOMER' ? (
          <>
            {results}
            {attempted && selected === null ? (
              <Text style={styles.errorText}>{t('sales.customer.pickRequired')}</Text>
            ) : null}
          </>
        ) : (
          <View style={styles.walkInCard}>
            <Text style={styles.fieldLabel}>{t('sales.customer.walkInName')}</Text>
            <TextInput
              style={[styles.input, attempted && nameMissing && styles.inputError]}
              value={walkInName}
              onChangeText={setWalkInName}
              placeholder={t('sales.customer.walkInNamePlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel={t('sales.customer.walkInName')}
            />
            {attempted && nameMissing ? (
              <Text style={styles.errorText}>{t('sales.customer.walkInNameRequired')}</Text>
            ) : null}

            <Text style={[styles.fieldLabel, styles.fieldGap]}>{t('sales.customer.walkInMobile')}</Text>
            <TextInput
              style={[styles.input, mobileInvalid && walkInMobile.trim() !== '' && styles.inputError]}
              value={walkInMobile}
              onChangeText={setWalkInMobile}
              placeholder={t('sales.customer.walkInMobilePlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              keyboardType="phone-pad"
              accessibilityLabel={t('sales.customer.walkInMobile')}
            />
            {mobileInvalid && (attempted || walkInMobile.trim().length >= 10) ? (
              <Text style={styles.errorText}>{t('sales.customer.walkInMobileInvalid')}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.continueBtn} onPress={submit} activeOpacity={0.85} accessibilityRole="button">
          <ArrowRightIcon size={18} />
          <Text style={styles.continueBtnText}>
            {pickOnly ? t('sales.customer.use') : t('sales.customer.continueToPayment')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  flex: {
    flex: 1,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  modeRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modeChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  modeChipActive: {
    backgroundColor: adminColors.brandSoft.bg,
    borderColor: adminColors.brandSoft.border,
  },
  modeChipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  modeChipTextActive: {
    color: adminColors.brandSoft.text,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  hintText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.lg,
  },
  customerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  customerCardSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  customerName: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 3,
  },
  customerSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 6,
  },
  walletText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  walkInCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
  },
  fieldLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  fieldGap: {
    marginTop: adminSpacing.lg,
  },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  inputError: {
    borderColor: adminColors.danger.text,
  },
  errorText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    marginTop: adminSpacing.xs,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
});
