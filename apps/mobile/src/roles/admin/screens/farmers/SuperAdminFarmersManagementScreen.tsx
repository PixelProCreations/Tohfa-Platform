import React, { useMemo, useState } from 'react';
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
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  DocumentTextIcon,
  FilterSlidersIcon,
  LocationPinIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '../../components/AdminIcons';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { type Can } from '../../permissions/can';
import { t } from '../../i18n';
import {
  DEMO_ALL_FARMERS,
  type FarmerListItem,
} from './AdminAllFarmersScreen';

export interface SuperAdminFarmersManagementScreenProps {
  can?: Can | undefined;
  role?: string | undefined;
  onBack?: (() => void) | undefined;
  onSelectFarmer: (farmer: FarmerListItem) => void;
  onOpenAllFarmers?: ((statusFilter?: 'All' | 'Active' | 'Inactive', showFilter?: boolean) => void) | undefined;
  onOpenSubscriptionOverview?: (() => void) | undefined;
  onOpenApprovalInbox?: (() => void) | undefined;
  onOpenFarmRecords?: () => void;
  onOpenVerificationCompliance?: () => void;
  onOpenApplications?: () => void;
  onAddFarmer?: () => void;
}

const ZONE_DISTRIBUTION = [
  { name: 'Zone 1', count: 702, ratio: 0.85 },
  { name: 'Zone 2', count: 611, ratio: 0.74 },
  { name: 'Zone 3', count: 489, ratio: 0.59 },
  { name: 'Zone 4', count: 684, ratio: 0.82 },
];

export function SuperAdminFarmersManagementScreen({
  can: _can,
  role: _role,
  onBack,
  onSelectFarmer,
  onOpenAllFarmers,
  onOpenSubscriptionOverview,
  onOpenApprovalInbox,
  onOpenFarmRecords,
  onOpenVerificationCompliance,
  onOpenApplications,
  onAddFarmer,
}: SuperAdminFarmersManagementScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFarmers = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_ALL_FARMERS;
    const q = searchQuery.toLowerCase().trim();
    return DEMO_ALL_FARMERS.filter((f) => {
      const name = f.name?.toLowerCase() ?? '';
      const code = (f.code ?? f.farmerId ?? '').toLowerCase();
      const crops = (f.primaryCrops ?? f.crops ?? '').toLowerCase();
      const loc = (f.location ?? f.zone ?? '').toLowerCase();
      return name.includes(q) || code.includes(q) || crops.includes(q) || loc.includes(q);
    });
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header matching exact design: left-aligned with back arrow preceding title */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('superAdmin.farmersManagement.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Summary Cards Grid matching Image 2 Screen 1 */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            value="214"
            title={t('superAdmin.farmersManagement.totalFarmers')}
            icon="users"
            onPress={() => onOpenAllFarmers?.('All')}
          />
          <OverviewDashboardCard
            value="9"
            title={t('superAdmin.farmersManagement.pendingApplications')}
            icon="clipboard"
            onPress={onOpenApplications}
          />
          <OverviewDashboardCard
            value="196"
            title={t('superAdmin.farmersManagement.activeFarmers')}
            icon="users"
            onPress={() => onOpenAllFarmers?.('Active')}
          />
          <OverviewDashboardCard
            value="9"
            title={t('superAdmin.farmersManagement.deactivated')}
            icon="alert"
            tone="danger"
            onPress={() => onOpenAllFarmers?.('Inactive')}
          />
          <OverviewDashboardCard
            value="6"
            title={t('superAdmin.farmersManagement.expiredCerts')}
            icon="clipboard"
            tone="warning"
            onPress={onOpenVerificationCompliance}
          />
          <OverviewDashboardCard
            value="6"
            title={t('superAdmin.farmersManagement.expiredCerts')}
            icon="clipboard"
            tone="warning"
            onPress={onOpenVerificationCompliance}
          />
          <OverviewDashboardCard
            value="47"
            title={t('superAdmin.farmersManagement.pendingApplications')}
            icon="clipboard"
            onPress={onOpenApplications}
          />
          <OverviewDashboardCard
            value="38"
            title={t('superAdmin.farmersManagement.expiredCertifications')}
            icon="clipboard"
            tone="danger"
            onPress={onOpenVerificationCompliance}
          />
          <OverviewDashboardCard
            value="1,904"
            title={t('superAdmin.farmersManagement.subscriptionOverview')}
            icon="users"
            onPress={onOpenSubscriptionOverview}
          />
          <OverviewDashboardCard
            value="13"
            title={t('superAdmin.farmersManagement.approvalInbox')}
            icon="clipboard"
            onPress={onOpenApprovalInbox ?? onOpenApplications}
          />
        </OverviewCardsGrid>

        {/* Farmers by Zone matching design */}
        <View style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <LocationPinIcon size={18} color={adminColors.brand} />
            <Text style={styles.zoneHeaderTitle}>
              {t('superAdmin.farmersManagement.farmersByZone')}
            </Text>
          </View>
          <View style={styles.zoneList}>
            {ZONE_DISTRIBUTION.map((z) => (
              <View key={z.name} style={styles.zoneRow}>
                <Text style={styles.zoneName}>{z.name}</Text>
                <View style={styles.zoneBarTrack}>
                  <View
                    style={[
                      styles.zoneBarFill,
                      { width: `${Math.round(z.ratio * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.zoneCount}>{z.count}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.zoneFooter}
            onPress={() => onOpenAllFarmers?.('All', true)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.zoneFooterText}>
              {t('superAdmin.farmersManagement.viewZones')} →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Section: 2x2 grid with 4 cards matching exact design */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>
            {t('superAdmin.farmersManagement.quickAccess')}
          </Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={onOpenFarmRecords}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.quickAccessIconWrap}>
                <DocumentTextIcon size={22} color={adminColors.brand} />
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={2}>
                {t('superAdmin.farmersManagement.farmRecords')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={onOpenVerificationCompliance}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.quickAccessIconWrap}>
                <ShieldCheckIcon size={22} color={adminColors.brand} />
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={2}>
                {t('superAdmin.farmersManagement.verificationCompliance')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => (onOpenAllFarmers ? onOpenAllFarmers('All') : onOpenApplications?.())}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.quickAccessIconWrap}>
                <UsersIcon size={22} color={adminColors.brand} />
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={2}>
                {t('superAdmin.farmersManagement.farmersApplications')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={onAddFarmer ?? onOpenApplications}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.quickAccessIconWrap}>
                <PlusIcon size={22} color={adminColors.brand} />
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={2}>
                {t('superAdmin.farmersManagement.addFarmer')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrap}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('superAdmin.farmersManagement.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => onOpenAllFarmers?.('All', true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Results Counter */}
        <Text style={styles.resultsCount}>
          {t('superAdmin.farmersManagement.farmersCount', {
            current: filteredFarmers.length,
            total: DEMO_ALL_FARMERS.length,
          })}
        </Text>

        {/* Farmer Cards List matching exact design */}
        <View style={styles.farmerList}>
          {filteredFarmers.map((f) => {
            const farmerCode = f.code ?? f.farmerId ?? f.id;
            const farmerLocation = ((f.location ?? f.zone ?? 'Coonoor') as string).split(',')[0];
            const farmingType = f.farmingType ?? 'Natural';
            const kycStatus = f.kycVerifiedText ?? f.kycStatus ?? 'KYC Verified';
            const ratingNum = f.rating != null ? Number(f.rating) : NaN;
            const ratingScore = Number.isFinite(ratingNum) ? ratingNum.toFixed(1) : '3.0';
            const isActive = f.status === 'ACTIVE';
            const certState =
              f.certStatus === 'Expired' || f.hasExpiredCert
                ? 'Expired'
                : f.certStatus === 'Pending'
                ? 'Pending'
                : 'Verified';
            const certPillStyle =
              certState === 'Expired'
                ? styles.expiredOutlinedPill
                : certState === 'Pending'
                ? styles.pendingOutlinedPill
                : styles.verifiedOutlinedPill;
            const certTextStyle =
              certState === 'Expired'
                ? styles.expiredOutlinedPillText
                : certState === 'Pending'
                ? styles.pendingOutlinedPillText
                : styles.verifiedOutlinedPillText;
            const certLabel =
              certState === 'Expired'
                ? 'Certification expired'
                : certState === 'Pending'
                ? 'Cert pending'
                : 'Certified';

            return (
              <TouchableOpacity
                key={f.id}
                style={styles.farmerCard}
                onPress={() => onSelectFarmer(f)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.farmerCardHeader}>
                  <Text style={styles.farmerName}>{f.name}</Text>
                  <View
                    style={
                      isActive
                        ? styles.statusPillActive
                        : styles.statusPillDisabled
                    }
                  >
                    <Text
                      style={
                        isActive
                          ? styles.statusPillActiveText
                          : styles.statusPillDisabledText
                      }
                    >
                      {isActive ? 'Active' : 'Disabled'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.farmerMeta}>
                  {farmerCode} · {farmerLocation} · {farmingType}
                </Text>

                <View style={styles.farmerCardBottomRow}>
                  <Text style={styles.farmerRatingText}>
                    {kycStatus} · ★ {ratingScore}
                  </Text>
                  <View style={certPillStyle}>
                    <Text style={certTextStyle}>{certLabel}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  zoneCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  zoneHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  zoneList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  zoneName: {
    ...adminType.caption,
    color: adminColors.muted,
    width: 50,
  },
  zoneBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    overflow: 'hidden',
  },
  zoneBarFill: {
    height: '100%',
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
  },
  zoneCount: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    width: 36,
    textAlign: 'right',
  },
  zoneFooter: {
    alignSelf: 'flex-start',
    paddingTop: adminSpacing.xs,
  },
  zoneFooterText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '600',
  },
  quickAccessSection: {
    marginBottom: adminSpacing.lg,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
  },
  quickAccessCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
    minHeight: 104,
  },
  quickAccessIconWrap: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs,
  },
  quickAccessLabel: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 44,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsCount: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  farmerList: {
    gap: adminSpacing.sm,
  },
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  farmerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  farmerName: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
  statusPillActive: {
    borderWidth: 1,
    borderColor: adminColors.success.border,
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  statusPillActiveText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '600',
    fontSize: 11,
  },
  statusPillDisabled: {
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  statusPillDisabledText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  farmerMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: adminSpacing.sm,
  },
  farmerCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerRatingText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  expiredOutlinedPill: {
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    backgroundColor: adminColors.card,
  },
  expiredOutlinedPillText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '600',
    fontSize: 11,
  },
  pendingOutlinedPill: {
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    backgroundColor: adminColors.warning.bg,
  },
  pendingOutlinedPillText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontWeight: '600',
    fontSize: 11,
  },
  verifiedOutlinedPill: {
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    backgroundColor: adminColors.success.bg,
  },
  verifiedOutlinedPillText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '600',
    fontSize: 11,
  },
});
