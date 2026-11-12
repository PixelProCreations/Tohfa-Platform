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
  FilterSlidersIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { type Can } from '../../permissions/can';
import { t } from '../../i18n';
import type { FarmerListItem } from './AdminAllFarmersScreen';

export interface SuperAdminVerificationComplianceScreenProps {
  can?: Can | undefined;
  role?: string | undefined;
  onBack: () => void;
  onViewCompliance?: (farmer: ComplianceFarmer) => void;
  onViewCertificate?: (farmer: ComplianceFarmer) => void;
  onViewRatingDetails?: (farmer: ComplianceFarmer) => void;
  onViewAuditRecord?: (farmer: ComplianceFarmer) => void;
  onViewHistory?: (farmer: ComplianceFarmer) => void;
}

export interface ComplianceFarmer {
  id: string;
  name: string;
  farmerId: string;
  zone: string;
  badge?: string;
  kycStatus: string;
  certificationType: string;
  certExpiry: string;
  certStatus: string;
  auditStatus: string;
  ratingScore: string;
  ratingTier: string;
  lastUpdated: string;
}

const DEMO_COMPLIANCE_FARMERS: ComplianceFarmer[] = [
  {
    id: '1',
    name: 'Ramesh Kumar',
    farmerId: 'FMR-00101',
    zone: 'Ooty',
    badge: 'Exception',
    kycStatus: 'Verified',
    certificationType: 'PGS-India',
    certExpiry: '15 Mar 2027',
    certStatus: 'Verified',
    auditStatus: 'Done this quarter',
    ratingScore: '82/100',
    ratingTier: 'Not configured',
    lastUpdated: '26 Oct 2026',
  },
  {
    id: '2',
    name: 'Selvi Murugan',
    farmerId: 'FMR-00102',
    zone: 'Coonoor',
    kycStatus: 'Verified',
    certificationType: 'NPOP',
    certExpiry: '15 Mar 2027',
    certStatus: 'Verified',
    auditStatus: 'Done this quarter',
    ratingScore: '69/100',
    ratingTier: 'Not configured',
    lastUpdated: '25 Oct 2026',
  },
  {
    id: '3',
    name: 'M. Anand',
    farmerId: 'FMR-00103',
    zone: 'Kotagiri',
    kycStatus: 'Verified',
    certificationType: 'PGS-India',
    certExpiry: '10 Nov 2026',
    certStatus: 'Verified',
    auditStatus: 'Pending',
    ratingScore: '90/100',
    ratingTier: 'Tier 1',
    lastUpdated: '20 Oct 2026',
  },
];

export function SuperAdminVerificationComplianceScreen({
  can,
  role,
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

  const filteredFarmers = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_COMPLIANCE_FARMERS;
    const q = searchQuery.toLowerCase().trim();
    return DEMO_COMPLIANCE_FARMERS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.farmerId.toLowerCase().includes(q) ||
        f.zone.toLowerCase().includes(q) ||
        f.certificationType.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Orange Header matching design: left-aligned with back arrow preceding title */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Results Counter */}
        <Text style={styles.resultsCount}>
          {t('superAdmin.farmersManagement.farmersCount', {
            current: filteredFarmers.length,
            total: DEMO_COMPLIANCE_FARMERS.length,
          })}
        </Text>

        {/* Farmer Cards List matching Image 2 Screen 2 */}
        <View style={styles.cardList}>
          {filteredFarmers.map((f) => (
            <View key={f.id} style={styles.complianceCard}>
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
                    <Text style={styles.infoLabel}>Farmer ID</Text>
                    <Text style={styles.infoValue}>{f.farmerId}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Zone</Text>
                    <Text style={styles.infoValue}>{f.zone}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>KYC status</Text>
                    <Text style={[styles.infoValue, styles.verifiedText]}>
                      {f.kycStatus}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Certification type</Text>
                    <Text style={styles.infoValue}>{f.certificationType}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Certificate expiry</Text>
                    <Text style={styles.infoValue}>{f.certExpiry}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Certification</Text>
                    <Text style={[styles.infoValue, styles.verifiedText]}>
                      {f.certStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Internal audit</Text>
                    <Text style={[styles.infoValue, styles.verifiedText]}>
                      {f.auditStatus}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Rating score</Text>
                    <Text style={styles.infoValue}>{f.ratingScore}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Rating tier</Text>
                    <Text style={styles.infoValue}>{f.ratingTier}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Last updated</Text>
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
                  <Text style={styles.primaryButtonText}>
                    {t('superAdmin.compliance.viewCompliance')}
                  </Text>
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
                        <Text style={styles.secondaryButtonText}>
                          {t('superAdmin.compliance.viewCertificate')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {canViewRatingDetails && (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => onViewRatingDetails?.(f)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                      >
                        <Text style={styles.secondaryButtonText}>
                          {t('superAdmin.compliance.viewRatingDetails')}
                        </Text>
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
                        <Text style={styles.secondaryButtonText}>
                          {t('superAdmin.compliance.viewAuditRecord')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {canViewHistory && (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => onViewHistory?.(f)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                      >
                        <Text style={styles.secondaryButtonText}>
                          {t('superAdmin.compliance.viewHistory')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}
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
