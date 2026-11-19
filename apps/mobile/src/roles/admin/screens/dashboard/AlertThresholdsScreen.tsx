/**
 * Alert Thresholds Screen (SA-M2-S07)
 * Lists and manages compliance tier thresholds, stock alerts, and trigger limits.
 *
 * Ported from origin/Superadmin-main. docs/openapi.yaml has no endpoint that
 * lists alert thresholds (GET /admin/alerts is the alert FEED, and
 * /admin/audit-tier-thresholds is PATCH-only), so the host passes `thresholds`
 * when it has them; with none, the list shows its empty state and the search,
 * filter and "+ Add tiers" controls are still drawn. Deactivate / Activate calls
 * `onToggleActive`; without it, or without a permission, it is disabled.
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import { BackArrowIcon, FilterSlidersIcon, SearchIcon } from '../../components/AdminIcons';
import { AdminStatusBadge } from '../../components';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import type { AlertThresholdData } from './ComplianceTierThresholdsScreen';
import { THRESHOLD_CODES } from './thresholdOptions';

export interface AlertThresholdItem {
  id: string;
  title: string;
  scoreOrCondition: string;
  reason: string;
  updatedMeta: string;
  isActive: boolean;
  category: string;
  /** Carried into the edit form when the host has them. */
  thresholdValue?: string | undefined;
  thresholdUnit?: string | undefined;
  appliesTo?: 'all' | 'specific' | undefined;
  notifyRoles?: string[] | undefined;
}

export interface AlertThresholdsScreenProps {
  can: Can;
  onBack: () => void;
  onAddThreshold: () => void;
  onEditThreshold: (item: AlertThresholdData) => void;
  /** The thresholds to list. None until a backend source exists. */
  thresholds?: readonly AlertThresholdItem[] | undefined;
  /** Flip a threshold's status; receives the status it should now have. */
  onToggleActive?: ((id: string, nextActive: boolean) => void) | undefined;
}

const NO_THRESHOLDS: readonly AlertThresholdItem[] = [];

export function AlertThresholdsScreen({
  can,
  onBack,
  onAddThreshold,
  onEditThreshold,
  thresholds = NO_THRESHOLDS,
  onToggleActive,
}: AlertThresholdsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const mayConfigure = can(THRESHOLD_CODES.alert) || can(THRESHOLD_CODES.tier);

  const q = searchQuery.trim().toLowerCase();
  const filtered = thresholds.filter(
    (item) =>
      q === '' ||
      item.title.toLowerCase().includes(q) ||
      item.scoreOrCondition.toLowerCase().includes(q) ||
      item.reason.toLowerCase().includes(q),
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saThresholds.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saThresholds.list.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBarRow}>
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('saThresholds.list.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('saThresholds.list.filter')}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.countText}>
          {t('saThresholds.list.count', { shown: filtered.length, total: thresholds.length })}
        </Text>

        <View style={styles.cardsList}>
          {filtered.length === 0 ? <Text style={styles.emptyText}>{t('saThresholds.list.empty')}</Text> : null}
          {filtered.map((item) => (
            <View key={item.id} style={styles.thresholdCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <AdminStatusBadge
                  label={item.isActive ? t('saThresholds.status.active') : t('saThresholds.status.inactive')}
                  tone={item.isActive ? 'success' : 'neutral'}
                />
              </View>

              <Text style={styles.conditionText}>{item.scoreOrCondition}</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>
              <Text style={styles.metaText}>{item.updatedMeta}</Text>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.deactivateBtn, !(mayConfigure && onToggleActive) && styles.btnDisabled]}
                  onPress={() => onToggleActive?.(item.id, !item.isActive)}
                  disabled={!(mayConfigure && onToggleActive)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deactivateBtnText}>
                    {item.isActive ? t('saThresholds.list.deactivate') : t('saThresholds.list.activate')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editBtn, !mayConfigure && styles.btnDisabled]}
                  onPress={() =>
                    onEditThreshold({
                      id: item.id,
                      name: item.title,
                      description: item.reason,
                      category: item.category,
                      condition: item.scoreOrCondition,
                      thresholdValue: item.thresholdValue ?? '',
                      thresholdUnit: item.thresholdUnit ?? '',
                      appliesTo: item.appliesTo ?? 'all',
                      notifyRoles: item.notifyRoles ?? [],
                      isActive: item.isActive,
                    })
                  }
                  disabled={!mayConfigure}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>{t('saThresholds.list.edit')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addBtn, !mayConfigure && styles.btnDisabled]}
          onPress={onAddThreshold}
          disabled={!mayConfigure}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>{t('saThresholds.list.add')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CONTROL_HEIGHT = 44;
const CARD_BUTTON_HEIGHT = 38;

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
    height: CONTROL_HEIGHT,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
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
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    paddingVertical: adminSpacing.xl,
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
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
  },
  conditionText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  reasonText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  metaText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  deactivateBtn: {
    flex: 1,
    height: CARD_BUTTON_HEIGHT,
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
    height: CARD_BUTTON_HEIGHT,
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
