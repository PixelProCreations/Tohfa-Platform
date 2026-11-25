import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  ChevronRightIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { statusLabelKey } from './allFarmersMappers';
import type { FarmerListItem } from './AdminAllFarmersScreen';

const ALL_ZONES = 'ALL' as const;

export interface SuperAdminFarmRecordsListScreenProps {
  onBack: () => void;
  onSelectRecord: (farmer: FarmerListItem) => void;
  onAddRecord?: (() => void) | undefined;
  /** The live farmers (toDesignFarmerItem). Empty is an empty state, never a fixture. */
  farmers: readonly FarmerListItem[];
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
}

/**
 * Farm records are per farmer, and the farmer list is the only thing this card
 * needs: there is no bulk farm-records endpoint, and nothing on the card is a
 * land-location field, so no per-farmer getFarmer fetch is made. The title is
 * the farmer's own name (the list API sends no farm name; "<name> Farm" was an
 * invention); code and mobile are the server's, or the dash.
 */
export function SuperAdminFarmRecordsListScreen({
  onBack,
  onSelectRecord,
  onAddRecord,
  farmers,
  isLoading = false,
  error,
  onRetry,
}: SuperAdminFarmRecordsListScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>(ALL_ZONES);
  const [filterOpen, setFilterOpen] = useState(false);

  // Only the zones of the farmers actually loaded; a farmer with no zone is in none of them.
  const zoneOptions = useMemo(() => {
    const zones = new Set<string>();
    for (const f of farmers) if (f.zone !== undefined && f.zone !== '') zones.add(f.zone);
    return [...zones].sort((a, b) => a.localeCompare(b));
  }, [farmers]);

  const viewState = queryViewState({ isLoading, error, itemCount: farmers.length });

  const visibleFarmers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return farmers.filter((f) => {
      if (selectedZone !== ALL_ZONES && f.zone !== selectedZone) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.code ?? '').toLowerCase().includes(q) ||
        (f.mobile ?? '').toLowerCase().includes(q) ||
        (f.zone ?? '').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedZone, farmers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('superAdmin.farmRecords.back')}
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('superAdmin.farmRecords.title')}
        </Text>
        {onAddRecord ? (
          <TouchableOpacity
            style={styles.headerPlusBtn}
            onPress={onAddRecord}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('superAdmin.farmRecords.add.a11y')}
          >
            <PlusIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchBarRow}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('superAdmin.farmRecords.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('superAdmin.farmRecords.filter.a11y')}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {viewState === 'loading' && <AdminLoadingState />}
        {viewState === 'error' && <AdminErrorState error={error} onRetry={onRetry} />}
        {viewState === 'empty' && <AdminEmptyState title={t('farmersList.empty.farmers')} />}
        {viewState === 'ready' && visibleFarmers.length === 0 && (
          <AdminEmptyState title={t('farmersList.empty.farmersFiltered')} />
        )}

        {viewState === 'ready' && visibleFarmers.length > 0 && (
          <>
            <Text style={styles.resultsCount}>
              {[
                t(visibleFarmers.length === 1 ? 'superAdmin.farmRecords.count.one' : 'superAdmin.farmRecords.count.other', {
                  count: visibleFarmers.length,
                }),
                ...(selectedZone === ALL_ZONES ? [] : [selectedZone]),
              ].join(' · ')}
            </Text>

            <View style={styles.listWrap}>
              {visibleFarmers.map((farmer) => (
                <TouchableOpacity
                  key={farmer.id}
                  style={styles.recordCard}
                  onPress={() => onSelectRecord(farmer)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={farmer.name}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{farmer.initials ?? farmer.name.slice(0, 2).toUpperCase()}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.farmTitle}>{farmer.name}</Text>
                    <Text style={styles.farmMeta}>
                      {t('superAdmin.farmRecords.codePhone', {
                        code: farmer.code ?? ADMIN_NO_VALUE,
                        phone: farmer.mobile ?? ADMIN_NO_VALUE,
                      })}
                    </Text>
                  </View>

                  <View style={styles.cardRight}>
                    <AdminStatusBadge
                      status={farmer.status}
                      label={t(statusLabelKey(farmer.status))}
                      size="sm"
                    />
                    <ChevronRightIcon size={16} color={adminColors.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setFilterOpen(false)} />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>{t('superAdmin.farmRecords.filter.title')}</Text>
            {[ALL_ZONES, ...zoneOptions].map((zone) => {
              const active = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.pickerOption, active && styles.pickerOptionActive]}
                  onPress={() => {
                    setSelectedZone(zone);
                    setFilterOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>
                    {zone === ALL_ZONES ? t('superAdmin.farmRecords.filter.allZones') : zone}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    flex: 1,
    color: adminColors.onBrand,
    fontWeight: '700',
    textAlign: 'left',
  },
  headerPlusBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconBtn: {
    padding: adminSpacing.xs,
  },
  resultsCount: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  listWrap: {
    gap: adminSpacing.sm,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  avatarText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  cardInfo: {
    flex: 1,
  },
  farmTitle: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
  farmMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  modalDismiss: {
    ...StyleSheet.absoluteFill,
  },
  pickerSheet: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
    ...adminShadow.lg,
  },
  pickerTitle: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  pickerOption: {
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  pickerOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerOptionTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});
