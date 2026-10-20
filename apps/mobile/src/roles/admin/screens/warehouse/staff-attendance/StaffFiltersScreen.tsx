/**
 * Staff Filters: the roster filters the server actually has (GET
 * /admin/warehouse-staff `q` and `status`). The old Role (driver / warehouse
 * staff) and Attendance chips filtered fields the staff record does not have,
 * so they are gone. The warehouse is chosen on the Staff screen's selector
 * (Main) or locked to the scope (a confined admin).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  InfoNote,
  isAllWarehouses,
  SearchBar,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { staffStatusLabel } from './mappers';
import type { StaffStatus, WarehouseScope } from './types';

export type StaffStatusFilter = 'All' | StaffStatus;

export interface StaffFilterValues {
  searchQuery: string;
  status: StaffStatusFilter;
}

export interface StaffFiltersScreenProps {
  scope: WarehouseScope;
  initialFilters: StaffFilterValues;
  onBack: () => void;
  onApply: (filters: StaffFilterValues) => void;
}

const STATUS_OPTIONS: readonly StaffStatusFilter[] = ['All', 'ACTIVE', 'INACTIVE'];

export function StaffFiltersScreen({ scope, initialFilters, onBack, onApply }: StaffFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [status, setStatus] = useState<StaffStatusFilter>(initialFilters.status);

  return (
    <WalletScreen
      title={t('staff.filters.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label={t('staff.filters.apply')} onPress={() => onApply({ searchQuery, status })} />
          <WalletButton
            label={t('staff.filters.clear')}
            variant="neutral"
            onPress={() => {
              setSearchQuery('');
              setStatus('All');
            }}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} keyboardShouldPersistTaps="handled">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('staff.list.searchPlaceholder')} />
        <Text style={styles.sectionTitle}>{t('staff.filters.status')}</Text>
        <ChipGroup
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          labelOf={(value) => (value === 'All' ? t('staff.filter.all') : staffStatusLabel(value))}
        />
        {!isAllWarehouses(scope) ? (
          <View style={styles.note}>
            <InfoNote>{t('staff.filters.scopeLocked', { warehouse: scope.warehouseName ?? scope.warehouseId ?? '' })}</InfoNote>
          </View>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.lg, marginBottom: adminSpacing.sm },
  note: { marginTop: adminSpacing.lg },
});
