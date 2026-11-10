/**
 * Alert Thresholds Screen (SA-M2-S07)
 * Lists and manages compliance tier thresholds, stock alerts, and trigger limits.
 */
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

import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';
import {
  BackArrowIcon,
  FilterSlidersIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { AdminStatusBadge } from '../../components';
import { t } from '../../i18n';
import type { AlertThresholdData } from './ComplianceTierThresholdsScreen';

export interface AlertThresholdItem {
  id: string;
  title: string;
  scoreOrCondition: string;
  reason: string;
  updatedMeta: string;
  isActive: boolean;
  category: string;
}

export interface AlertThresholdsScreenProps {
  onBack: () => void;
  onAddThreshold: () => void;
  onEditThreshold: (item: AlertThresholdData) => void;
}

export const INITIAL_THRESHOLDS: AlertThresholdItem[] = [
  {
    id: 'thresh-1',
    title: 'Audit',
    scoreOrCondition: 'Score 84 to 92 · Effective 15 Oct 2026',
    reason: 'Reason Good for farmer',
    updatedMeta: 'Updated by Demo Super Admin · 14 Oct 2026, 10:00',
    isActive: true,
    category: 'Audit & Compliance',
  },
  {
    id: 'thresh-2',
    title: 'Low Stock Alert',
    scoreOrCondition: 'Stock is less than or equal to 100 Kg',
    reason: 'Get alerted when stock falls below safety floor',
    updatedMeta: 'Updated by Demo Super Admin · 12 Oct 2026, 09:30',
    isActive: true,
    category: 'Stock',
  },
  {
    id: 'thresh-3',
    title: 'Warehouse Capacity Limit',
    scoreOrCondition: 'Capacity reaches above 90%',
    reason: 'Prevent warehouse intake congestion',
    updatedMeta: 'Updated by Demo Super Admin · 10 Oct 2026, 11:15',
    isActive: true,
    category: 'Warehouse Capacity',
  },
];

export function AlertThresholdsScreen({
  onBack,
  onAddThreshold,
  onEditThreshold,
}: AlertThresholdsScreenProps) {
  const [thresholds, setThresholds] = useState<AlertThresholdItem[]>(INITIAL_THRESHOLDS);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = thresholds.filter((tItem) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tItem.title.toLowerCase().includes(q) ||
      tItem.scoreOrCondition.toLowerCase().includes(q) ||
      tItem.reason.toLowerCase().includes(q)
    );
  });

  const handleToggleDeactivate = (id: string) => {
    setThresholds((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
    Alert.alert('Status Updated', 'Threshold status has been toggled.');
  };

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
        <Text style={styles.headerTitle}>Alert Thresholds</Text>
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
              placeholder="Search..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Count Label */}
        <Text style={styles.countText}>{`${filtered.length} of ${thresholds.length} items`}</Text>

        {/* List of Threshold Cards */}
        <View style={styles.cardsList}>
          {filtered.map((item) => (
            <View key={item.id} style={styles.thresholdCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <AdminStatusBadge
                  label={item.isActive ? 'Active' : 'Inactive'}
                  tone={item.isActive ? 'success' : 'neutral'}
                />
              </View>

              <Text style={styles.conditionText}>{item.scoreOrCondition}</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>
              <Text style={styles.metaText}>{item.updatedMeta}</Text>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.deactivateBtn}
                  onPress={() => handleToggleDeactivate(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deactivateBtnText}>
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    onEditThreshold({
                      id: item.id,
                      name: item.title,
                      description: item.reason,
                      category: item.category,
                      condition: item.scoreOrCondition,
                      thresholdValue: '100',
                      thresholdUnit: 'Kg',
                      appliesTo: 'all',
                      notifyRoles: ['TOHFA Admins', 'Warehouse Admins'],
                      isActive: item.isActive,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Floating/Fixed Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAddThreshold}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add tiers</Text>
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
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardsList: {
    gap: adminSpacing.md,
  },
  thresholdCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...adminType.headline,
    color: adminColors.ink,
    fontWeight: '700',
  },
  conditionText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  reasonText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  metaText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  deactivateBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtnText: {
    ...adminType.body,
    color: adminColors.danger.text,
    fontWeight: '600',
  },
  editBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 70,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  addBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});

