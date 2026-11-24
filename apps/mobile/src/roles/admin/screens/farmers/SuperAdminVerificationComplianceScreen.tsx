import React, { useEffect, useMemo, useState } from 'react';
import {
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
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  FilterSlidersIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { type Can } from '../../permissions/can';
import { useCertificationList } from '../../api/certificationHooks';
import type { FarmerRowView } from '../../api/farmerTypes';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import {
  certificationFields,
  toComplianceFarmer,
  type ComplianceFarmer,
  type ComplianceTone,
} from './complianceMappers';

export type { ComplianceFarmer } from './complianceMappers';

export interface SuperAdminVerificationComplianceScreenProps {
  can?: Can | undefined;
  role?: string | undefined;
  /** The live farmer rows (useFarmerList). Empty is an empty state, never a fixture. */
  farmers: readonly FarmerRowView[];
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  /** More farmers exist than are loaded: the count says "loaded". */
  hasMore?: boolean | undefined;
  /** The caller's warehouse, part of every query key (BR-30). */
  warehouseId?: string | undefined;
  onBack: () => void;
  onViewCompliance?: (farmer: ComplianceFarmer) => void;
  onViewCertificate?: (farmer: ComplianceFarmer) => void;
  onViewRatingDetails?: (farmer: ComplianceFarmer) => void;
  onViewAuditRecord?: (farmer: ComplianceFarmer) => void;
  onViewHistory?: (farmer: ComplianceFarmer) => void;
}

interface ComplianceActions {
  canViewCompliance: boolean;
  canViewCertificate: boolean;
  canViewRatingDetails: boolean;
  canViewAuditRecord: boolean;
  canViewHistory: boolean;
}

function toneStyle(tone: ComplianceTone) {
  if (tone === 'success') return styles.verifiedText;
  if (tone === 'danger') return styles.dangerText;
  return undefined;
}

interface ComplianceCardProps extends ComplianceActions {
  row: FarmerRowView;
  warehouseId: string | undefined;
  /** certification.view: without it no certificate is asked for and its fields are dashes. */
  readCertifications: boolean;
  onViewCompliance?: ((farmer: ComplianceFarmer) => void) | undefined;
  onViewCertificate?: ((farmer: ComplianceFarmer) => void) | undefined;
  onViewRatingDetails?: ((farmer: ComplianceFarmer) => void) | undefined;
  onViewAuditRecord?: ((farmer: ComplianceFarmer) => void) | undefined;
  onViewHistory?: ((farmer: ComplianceFarmer) => void) | undefined;
}

/**
 * One farmer's card. It owns the certificate read for its farmer (a hook per
 * card, filtered by farmerId) because GET /admin/certifications is paged across
 * all farmers: one shared page would say "no certificate" for a farmer whose
 * record sits on page two.
 */
function ComplianceFarmerCard({
  row,
  warehouseId,
  readCertifications,
  canViewCompliance,
  canViewCertificate,
  canViewRatingDetails,
  canViewAuditRecord,
  canViewHistory,
  onViewCompliance,
  onViewCertificate,
  onViewRatingDetails,
  onViewAuditRecord,
  onViewHistory,
}: ComplianceCardProps): React.JSX.Element {
  const certs = useCertificationList(warehouseId, { farmerId: row.id }, { enabled: readCertifications });
  const { hasMore, loadMore, items } = certs;
  // A farmer holds a handful of certificates: read them all, so "no certificate" and "the current one" are true.
  useEffect(() => {
    if (readCertifications && hasMore) loadMore();
  }, [readCertifications, hasMore, loadMore, items.length]);

  const f = toComplianceFarmer(
    row,
    certificationFields(
      {
        enabled: readCertifications,
        isLoading: certs.isLoading || hasMore,
        error: certs.error,
        items,
      },
      new Date(),
    ),
  );

  return (
    <View style={styles.complianceCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.farmerName}>{f.name}</Text>
          <Text style={styles.farmerSubtitle}>{f.farmerId}</Text>
        </View>
        {f.badge ? (
          <View style={styles.exceptionBadge}>
            <Text style={styles.exceptionBadgeText}>{f.badge}</Text>
          </View>
        ) : null}
      </View>

      {/* 2-Column Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.farmerId')}</Text>
            <Text style={styles.infoValue}>{f.farmerId}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.zone')}</Text>
            <Text style={styles.infoValue}>{f.zone}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.kyc')}</Text>
            <Text style={[styles.infoValue, toneStyle(f.kycTone)]}>{f.kycStatus}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.certType')}</Text>
            <Text style={styles.infoValue}>{f.certificationType}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.certExpiry')}</Text>
            <Text style={styles.infoValue}>{f.certExpiry}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.certStatus')}</Text>
            <Text style={[styles.infoValue, toneStyle(f.certTone)]}>{f.certStatus}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.audit')}</Text>
            <Text style={styles.infoValue}>{f.auditStatus}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.ratingScore')}</Text>
            <Text style={styles.infoValue}>{f.ratingScore}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.ratingTier')}</Text>
            <Text style={styles.infoValue}>{f.ratingTier}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{t('superAdmin.compliance.label.lastUpdated')}</Text>
            <Text style={styles.infoValue}>{f.lastUpdated}</Text>
          </View>
        </View>
      </View>

      {/* Primary View Compliance Button */}
      {canViewCompliance && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onViewCompliance?.(f)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{t('superAdmin.compliance.viewCompliance')}</Text>
        </TouchableOpacity>
      )}

      {/* 2x2 Grid of Actions */}
      <View style={styles.actionGrid}>
        {(canViewCertificate || canViewRatingDetails) && (
          <View style={styles.actionRow}>
            {canViewCertificate && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onViewCertificate?.(f)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{t('superAdmin.compliance.viewCertificate')}</Text>
              </TouchableOpacity>
            )}
            {canViewRatingDetails && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onViewRatingDetails?.(f)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{t('superAdmin.compliance.viewRatingDetails')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {(canViewAuditRecord || canViewHistory) && (
          <View style={styles.actionRow}>
            {canViewAuditRecord && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onViewAuditRecord?.(f)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{t('superAdmin.compliance.viewAuditRecord')}</Text>
              </TouchableOpacity>
            )}
            {canViewHistory && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onViewHistory?.(f)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{t('superAdmin.compliance.viewHistory')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export function SuperAdminVerificationComplianceScreen({
  can,
  role,
  farmers,
  isLoading = false,
  error,
  onRetry,
  hasMore = false,
  warehouseId,
  onBack,
  onViewCompliance,
  onViewCertificate,
  onViewRatingDetails,
  onViewAuditRecord,
  onViewHistory,
}: SuperAdminVerificationComplianceScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canViewCompliance =
    isSuperAdmin || (can ? can('certification.view') || can('farmer.document.verify') : true);
  const canViewCertificate =
    isSuperAdmin || (can ? can('certification.view') || can('farmer.document.verify') : true);
  const canViewRatingDetails = isSuperAdmin || (can ? can('farmer.rating.view') : true);
  const canViewAuditRecord = isSuperAdmin || (can ? can('audit.view') : true);
  const canViewHistory = isSuperAdmin || (can ? can('audit.view') : true);
  // Fail closed: the certificate list is asked for only with the code that permits it.
  const readCertifications = isSuperAdmin || (can ? can('certification.view') : false);

  const viewState = queryViewState({ isLoading, error, itemCount: farmers.length });

  const filteredFarmers = useMemo(() => {
    if (!searchQuery.trim()) return farmers;
    const q = searchQuery.toLowerCase().trim();
    return farmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.farmerCode.toLowerCase().includes(q) ||
        (f.zoneName ?? '').toLowerCase().includes(q) ||
        t(`farmersList.kyc.${f.kycStatus}`).toLowerCase().includes(q),
    );
  }, [searchQuery, farmers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Orange Header matching design: left-aligned with back arrow preceding title */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('superAdmin.compliance.back')}
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('superAdmin.compliance.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrap}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('superAdmin.compliance.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('superAdmin.compliance.filter')}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {viewState === 'loading' && <AdminLoadingState />}
        {viewState === 'error' && <AdminErrorState error={error} onRetry={onRetry} />}
        {viewState === 'empty' && <AdminEmptyState title={t('farmersList.empty.farmers')} />}
        {viewState === 'ready' && filteredFarmers.length === 0 && (
          <AdminEmptyState title={t('farmersList.empty.farmersFiltered')} />
        )}

        {viewState === 'ready' && filteredFarmers.length > 0 && (
          <>
            {/* Results Counter: of the farmers loaded, not of a fixed number */}
            <Text style={styles.resultsCount}>
              {t(hasMore ? 'superAdmin.farmersManagement.farmersCountLoaded' : 'superAdmin.farmersManagement.farmersCount', {
                current: filteredFarmers.length,
                total: farmers.length,
              })}
            </Text>

            {/* Farmer Cards List matching Image 2 Screen 2 */}
            <View style={styles.cardList}>
              {filteredFarmers.map((row) => (
                <ComplianceFarmerCard
                  key={row.id}
                  row={row}
                  warehouseId={warehouseId}
                  readCertifications={readCertifications}
                  canViewCompliance={canViewCompliance}
                  canViewCertificate={canViewCertificate}
                  canViewRatingDetails={canViewRatingDetails}
                  canViewAuditRecord={canViewAuditRecord}
                  canViewHistory={canViewHistory}
                  onViewCompliance={onViewCompliance}
                  onViewCertificate={onViewCertificate}
                  onViewRatingDetails={onViewRatingDetails}
                  onViewAuditRecord={onViewAuditRecord}
                  onViewHistory={onViewHistory}
                />
              ))}
            </View>
          </>
        )}
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
    textAlign: 'left',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
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
    marginBottom: adminSpacing.md,
  },
  cardList: {
    gap: adminSpacing.md,
  },
  complianceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: adminSpacing.sm,
  },
  farmerName: {
    ...adminType.title,
    color: adminColors.ink,
  },
  farmerSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  exceptionBadge: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
  },
  exceptionBadgeText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '600',
    fontSize: 11,
  },
  infoGrid: {
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  infoValue: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  verifiedText: {
    color: adminColors.success.text,
  },
  dangerText: {
    color: adminColors.danger.text,
  },
  primaryButton: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  primaryButtonText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  actionGrid: {
    gap: adminSpacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  secondaryButtonText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
});
