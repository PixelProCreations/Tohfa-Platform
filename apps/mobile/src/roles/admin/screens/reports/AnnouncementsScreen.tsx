import { adminColors } from '../../theme';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { useAdminQuery } from '../../api/hooks';
import { listAdminAnnouncements } from '../../api/announcements';
import { useCreateAdminAnnouncement } from '../../api/announcementsHooks';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';

const PALETTE = {
  pageBg:           adminColors.canvas,
  cardBg:           adminColors.card,
  textHeading:      adminColors.brandDeep,
  textPrimary:      adminColors.ink,
  textSecondary:    adminColors.muted,
  textMuted:        adminColors.muted,
  border:           adminColors.border,
  buttonBorder:     adminColors.border,
  orangePrimary:    adminColors.brand,
  systemTagBg:      adminColors.info.bg,
  systemTagText:    adminColors.info.text,
  warehouseTagBg:   adminColors.warning.bg,
  warehouseTagText: adminColors.warning.text,
  // Additional for StyleSheet surfaces and SVG icons
  shadow:           adminColors.shadow,
  iconStroke:       adminColors.ink,
  tabBg:            adminColors.canvas,
  onBrand:          adminColors.onBrand,
  inputBg:          adminColors.canvas,
  inputBorder:      adminColors.border,
};

export interface AnnouncementItem {
  id: string;
  tag: string;
  scopeType: 'system' | 'warehouse';
  title: string;
  desc: string;
  sender: string;
  timeAgo: string;
  recipientsCount: string;
}

export interface AnnouncementsScreenProps {
  onBack: () => void;
}

export function AnnouncementsScreen({ onBack }: AnnouncementsScreenProps) {
  const [isCreating, setIsCreating] = useState(false);
  const announcementsQuery = useAdminQuery(
    ['admin', 'announcements', 'list'],
    (signal) => listAdminAnnouncements({ limit: 20 }, signal),
  );
  const createAnnouncementMutation = useCreateAdminAnnouncement();
  const { options: warehouseOptions } = useWarehouseOptions();

  // Form states
  const [formScope, setFormScope] = useState<'system' | 'warehouse'>('system');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const effectiveWarehouseId =
    selectedWarehouseId ?? warehouseOptions[0]?.warehouseId ?? undefined;
  const canSelectWarehouse = warehouseOptions.length > 0;

  const liveAnnouncements: AnnouncementItem[] = (announcementsQuery.data?.items ?? []).map((dto) => ({
    id: dto.id,
    tag: dto.target === 'SYSTEM_WIDE' ? 'System-wide' : `Warehouse · ${dto.warehouseId || ADMIN_NO_VALUE}`,
    scopeType: dto.target === 'SYSTEM_WIDE' ? 'system' : 'warehouse',
    title: dto.title,
    desc: dto.body,
    sender: dto.createdBy || ADMIN_NO_VALUE,
    timeAgo: dto.createdAt ? dto.createdAt.slice(0, 10) : ADMIN_NO_VALUE,
    recipientsCount: dto.target === 'SYSTEM_WIDE' ? 'Platform wide' : 'Warehouse staff',
  }));

  const announcements = liveAnnouncements;

  const handleCreateAnnouncement = async () => {
    if (!formTitle.trim() || !formDesc.trim()) {
      Alert.alert('Incomplete Form', 'Please provide a title and announcement message.');
      return;
    }
    if (formScope === 'warehouse' && !effectiveWarehouseId) {
      Alert.alert(
        t('wiringReports.announcements.broadcastFailedTitle'),
        t('wiringReports.announcements.warehouseUnavailable'),
      );
      return;
    }

    try {
      await createAnnouncementMutation.mutateAsync({
        target: formScope === 'system' ? 'SYSTEM_WIDE' : 'WAREHOUSE',
        ...(formScope === 'warehouse' && effectiveWarehouseId
          ? { warehouseId: effectiveWarehouseId }
          : {}),
        title: formTitle.trim(),
        body: formDesc.trim(),
      });
      void announcementsQuery.refetch();
      setFormTitle('');
      setFormDesc('');
      setIsCreating(false);
      Alert.alert(
        t('wiringReports.announcements.broadcastSuccessTitle'),
        t('wiringReports.announcements.broadcastSuccessBody'),
      );
    } catch (err: unknown) {
      Alert.alert(
        t('wiringReports.announcements.broadcastFailedTitle'),
        err instanceof Error ? err.message : t('wiringReports.announcements.broadcastFailedTitle'),
      );
    }
  };

  // ─── FULL REDIRECT PAGE: NEW ANNOUNCEMENT ────────────────────────────────
  if (isCreating) {
    return (
      <SafeAreaView style={styles.root}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsCreating(false)}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke={PALETTE.iconStroke}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>New Announcement</Text>
            <Text style={styles.pageSubtitle}>Broadcast instantly to portal participants</Text>
          </View>

          {/* Full Screen Form Container */}
          <View style={styles.fullFormContainer}>
            {/* Scope Switcher */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Announcement Scope</Text>
              <View style={styles.scopeTabs}>
                <TouchableOpacity
                  style={[
                    styles.scopeTab,
                    formScope === 'system' && styles.scopeTabActive,
                  ]}
                  onPress={() => {
                    setFormScope('system');
                  }}
                >
                  <Text
                    style={[
                      styles.scopeTabText,
                      formScope === 'system' && styles.scopeTabTextActive,
                    ]}
                  >
                    System-wide
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scopeTab,
                    formScope === 'warehouse' && styles.scopeTabActive,
                    !canSelectWarehouse && { opacity: 0.45 },
                  ]}
                  disabled={!canSelectWarehouse}
                  accessibilityState={{ disabled: !canSelectWarehouse }}
                  accessibilityHint={!canSelectWarehouse ? t('wiringReports.announcements.warehouseUnavailable') : undefined}
                  onPress={() => {
                    setFormScope('warehouse');
                  }}
                >
                  <Text
                    style={[
                      styles.scopeTabText,
                      formScope === 'warehouse' && styles.scopeTabTextActive,
                    ]}
                  >
                    Warehouse-specific
                  </Text>
                </TouchableOpacity>
              </View>
              {!canSelectWarehouse ? (
                <Text style={styles.pageSubtitle}>{t('wiringReports.announcements.warehouseUnavailable')}</Text>
              ) : null}
            </View>

            {formScope === 'warehouse' && warehouseOptions.length > 0 ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Warehouse</Text>
                <View style={styles.scopeTabs}>
                  {warehouseOptions.map((wh) => {
                    const selected = effectiveWarehouseId === wh.warehouseId;
                    return (
                      <TouchableOpacity
                        key={wh.warehouseId}
                        style={[styles.scopeTab, selected && styles.scopeTabActive]}
                        onPress={() => setSelectedWarehouseId(wh.warehouseId)}
                      >
                        <Text style={[styles.scopeTabText, selected && styles.scopeTabTextActive]}>
                          {wh.warehouseName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Target Audience (disabled — backend announcement contract has no audience field) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Audience Target</Text>
              <TextInput
                style={[styles.formInput, { opacity: 0.5 }]}
                value={ADMIN_NO_VALUE}
                editable={false}
                accessibilityState={{ disabled: true }}
                accessibilityHint={t('wiringReports.announcements.audienceUnavailable')}
              />
              <Text style={styles.pageSubtitle}>{t('wiringReports.announcements.audienceUnavailable')}</Text>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Fair price ceilings updated for September"
              />
            </View>

            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Announcement Message</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Write clear, actionable details for recipients..."
                multiline
                numberOfLines={5}
              />
            </View>
          </View>

          {/* Broadcast Action Button */}
          <TouchableOpacity
            style={styles.primaryNewBtn}
            onPress={handleCreateAnnouncement}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryNewBtnText}>Broadcast Announcement</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN SCREEN: ANNOUNCEMENTS LIST ────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar with Back and Plus Buttons */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke={PALETTE.iconStroke}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsCreating(true)}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke={PALETTE.iconStroke}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Announcements</Text>
          <Text style={styles.pageSubtitle}>Sent to farmers, customers, or staff</Text>
        </View>

        {/* Announcement Cards List */}
        {announcementsQuery.isPending ? (
          <AdminLoadingState />
        ) : announcementsQuery.error ? (
          <AdminErrorState error={announcementsQuery.error} onRetry={announcementsQuery.refetch} />
        ) : announcements.length === 0 ? (
          <AdminEmptyState />
        ) : (
        <View style={styles.cardsList}>
          {announcements.map((item) => {
            const isSystem = item.scopeType === 'system';
            return (
              <View key={item.id} style={styles.announcementCard}>
                {/* Tag Pill */}
                <View
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: isSystem ? PALETTE.systemTagBg : PALETTE.warehouseTagBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      {
                        color: isSystem ? PALETTE.systemTagText : PALETTE.warehouseTagText,
                      },
                    ]}
                  >
                    {item.tag}
                  </Text>
                </View>

                {/* Heading */}
                <Text style={styles.announcementTitle}>{item.title}</Text>

                {/* Description */}
                <Text style={styles.announcementDesc}>{item.desc}</Text>

                {/* Footer */}
                <Text style={styles.announcementFooter}>
                  Sent by {item.sender} · {item.timeAgo} · {item.recipientsCount}
                </Text>
              </View>
            );
          })}
        </View>
        )}

        {/* Bottom Primary Action Button: + New Announcement -> Redirects to Full Screen */}
        <TouchableOpacity
          style={styles.primaryNewBtn}
          onPress={() => setIsCreating(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryNewBtnText}>+ New Announcement</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: PALETTE.buttonBorder,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerBlock: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    fontWeight: '400',
  },
  cardsList: {
    gap: 16,
    marginBottom: 20,
  },
  announcementCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    padding: 18,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 16,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  announcementTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 6,
  },
  announcementDesc: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  announcementFooter: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    fontWeight: '400',
  },
  primaryNewBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orangePrimary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryNewBtnText: {
    color: PALETTE.onBrand,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fullFormContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  scopeTabs: {
    flexDirection: 'row',
    backgroundColor: PALETTE.tabBg,
    borderRadius: 12,
    padding: 3,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  scopeTabActive: {
    backgroundColor: PALETTE.cardBg,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  scopeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  scopeTabTextActive: {
    color: PALETTE.orangePrimary,
  },
  formInput: {
    backgroundColor: PALETTE.inputBg,
    borderWidth: 1.2,
    borderColor: PALETTE.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: PALETTE.textPrimary,
  },
  formTextArea: {
    height: 110,
    textAlignVertical: 'top',
  },
});
