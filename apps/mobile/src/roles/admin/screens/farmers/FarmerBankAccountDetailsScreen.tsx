import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { type Can } from '../../permissions/can';
import { useFarmerBankAccounts, useFarmerDocuments } from '../../api/farmerHooks';
import type { FarmerDocumentVerificationStatus } from '../../api/farmers';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { t, type TranslationKey } from '../../i18n';

export type AdminRoleCategory = 'SUPER_ADMIN' | 'TOHFA_ADMIN' | 'FARMER_ADMIN' | 'WAREHOUSE_ADMIN';

export function resolveAdminRoleCategory(role?: string): AdminRoleCategory {
  const r = (role || '').toUpperCase();
  if (r.includes('SUPER')) return 'SUPER_ADMIN';
  if (r.includes('FARMER')) return 'FARMER_ADMIN';
  if (
    r.includes('WAREHOUSE') ||
    r.includes('MWA') ||
    r.includes('SWA') ||
    r.includes('MAIN') ||
    r.includes('SUB') ||
    r.includes('MW') ||
    r.includes('SW') ||
    r.includes('WH')
  ) {
    return 'WAREHOUSE_ADMIN';
  }
  return 'TOHFA_ADMIN';
}

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BankBuildingIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdCardIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h2M15 12h2M7 16h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CodeIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m16 18 6-6-6-6M8 6l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PinIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function FileTextIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarEventIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function AdminBadgeIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15l-2 5 4-2 4 2-2-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface FarmerBankAccountDetailsScreenProps {
  farmerName?: string | undefined;
  /** The farmer's UUID: the API is addressed by it. */
  farmerId?: string | undefined;
  /** The TOHFA farmer code, shown under "Farmer ID" (a UUID never is). */
  farmerCode?: string | undefined;
  warehouseId?: string | undefined;
  role?: string | undefined;
  can?: Can | undefined;
  onBack: () => void;
}

const DOC_STATUS_KEYS: Record<FarmerDocumentVerificationStatus, TranslationKey> = {
  UNVERIFIED: 'wiringFarmers.doc.status.UNVERIFIED',
  VERIFIED: 'wiringFarmers.doc.status.VERIFIED',
  REJECTED: 'wiringFarmers.doc.status.REJECTED',
};

/**
 * One farmer's payout destination (GET /admin/farmers/{id}/bank-accounts,
 * farmer.bank_account.view) and bank proof document (GET .../documents).
 *
 * BR-53: only the last four digits exist, and until tokenisation is decided
 * these accounts are display-only and are NOT payout destinations, so the
 * "Payout Usage" card makes no claim that payouts use them. Account type,
 * account status, "verified on/by" and the last payout have no source and are
 * dashed. Without the permission nothing is fetched (fail closed).
 */
export function FarmerBankAccountDetailsScreen({
  farmerName,
  farmerId,
  farmerCode,
  warehouseId,
  role,
  can,
  onBack,
}: FarmerBankAccountDetailsScreenProps): React.JSX.Element {
  const roleCategory = resolveAdminRoleCategory(role);

  const isSuperAdmin = roleCategory === 'SUPER_ADMIN';
  const isTohfaAdmin = roleCategory === 'TOHFA_ADMIN';
  const isFarmerAdmin = roleCategory === 'FARMER_ADMIN';

  const showBankProofCard = isSuperAdmin || isTohfaAdmin || isFarmerAdmin;
  const canDownloadBankProof = isSuperAdmin || isTohfaAdmin;

  const canViewBank = can?.('farmer.bank_account.view') ?? false;
  const bankQuery = useFarmerBankAccounts(warehouseId, farmerId, { enabled: canViewBank });
  const docsQuery = useFarmerDocuments(warehouseId, farmerId);

  const primaryAccount = React.useMemo(() => {
    const list = bankQuery.destinations ?? [];
    return list.find((d) => d.isDefault) ?? list[0];
  }, [bankQuery.destinations]);

  // Only the bank proof is the passbook / cancelled cheque; a certificate is not.
  const bankDoc = React.useMemo(
    () => (docsQuery.documents ?? []).find((d) => d.docType === 'BANK_PROOF'),
    [docsQuery.documents],
  );

  const displayName = primaryAccount?.accountHolderName ?? farmerName ?? ADMIN_NO_VALUE;
  const displayId = farmerCode ?? ADMIN_NO_VALUE;
  const displayBankName = primaryAccount?.bankName ?? ADMIN_NO_VALUE;
  const displayAccountNumber =
    primaryAccount !== undefined && primaryAccount.accountNumberLast4 !== null
      ? t('wiringFarmers.bank.accountMasked', { last4: primaryAccount.accountNumberLast4 })
      : primaryAccount?.upiVpa ?? ADMIN_NO_VALUE;
  const displayIfsc = primaryAccount?.ifsc ?? ADMIN_NO_VALUE;
  const displayBranch = primaryAccount?.branchName ?? ADMIN_NO_VALUE;
  // The API says BANK or UPI; whether a bank account is savings or current is not sent.
  const displayAccountType = primaryAccount?.kind === 'UPI' ? t('wiringFarmers.bank.kind.UPI') : ADMIN_NO_VALUE;
  const isVerified = primaryAccount?.isVerified === true;
  const readUrl = bankDoc?.readUrl ?? null;

  const openDocument = () => {
    if (readUrl === null) return;
    Linking.openURL(readUrl).catch(() => {
      Alert.alert(t('wiringFarmers.bank.doc.openFailed.title'), t('wiringFarmers.bank.doc.openFailed.message'));
    });
  };

  const renderAccountCards = () => {
    if (farmerId === undefined || !canViewBank) {
      return <AdminEmptyState title={t('wiringFarmers.bank.notLoaded')} />;
    }
    if (bankQuery.isLoading) return <AdminLoadingState />;
    if (bankQuery.error) return <AdminErrorState error={bankQuery.error} onRetry={bankQuery.refresh} />;
    return (
      <>
        {/* 1. Bank Brand Card */}
        <View style={styles.bankOverviewCard}>
          <View style={styles.bankLogoRow}>
            <BankBuildingIcon size={32} color={adminColors.brand} />
            <Text style={styles.bankNameText}>{displayBankName}</Text>
          </View>
          <View style={styles.badgesRow}>
            {isVerified && (
              <View style={styles.bankVerifiedBadge}>
                <Text style={styles.bankVerifiedBadgeText}>{t('wiringFarmers.bank.bankVerified')}</Text>
              </View>
            )}
            {primaryAccount?.isDefault === true && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>{t('wiringFarmers.bank.primary')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Account Details Table Card */}
        <View style={styles.card}>
          <DetailRow icon={<UserIcon />} label={t('wiringFarmers.bank.holder')} value={displayName} />
          <DetailRow icon={<IdCardIcon />} label={t('wiringFarmers.bank.farmerId')} value={displayId} />
          <DetailRow icon={<BankBuildingIcon />} label={t('wiringFarmers.bank.accountNumber')} value={displayAccountNumber} />
          <DetailRow icon={<CodeIcon />} label={t('wiringFarmers.bank.ifsc')} value={displayIfsc} />
          <DetailRow icon={<PinIcon />} label={t('wiringFarmers.bank.branch')} value={displayBranch} />
          <DetailRow icon={<CardIcon />} label={t('wiringFarmers.bank.accountType')} value={displayAccountType} />
          <DetailRow
            icon={<FileTextIcon />}
            label={t('wiringFarmers.bank.accountStatus')}
            customValue={
              <View style={styles.statusDotRow}>
                <View style={[styles.activeDot, styles.inactiveDot]} />
                <Text style={[styles.activeDotText, styles.inactiveDotText]}>{ADMIN_NO_VALUE}</Text>
              </View>
            }
          />
          <DetailRow
            icon={<ShieldCheckIcon />}
            label={t('wiringFarmers.bank.verificationStatus')}
            customValue={
              primaryAccount === undefined ? (
                <Text style={styles.detailValue}>{ADMIN_NO_VALUE}</Text>
              ) : (
                <View style={isVerified ? styles.verifiedStatusBadge : styles.unverifiedBadge}>
                  <Text style={isVerified ? styles.verifiedStatusText : styles.unverifiedText}>
                    {isVerified ? t('wiringFarmers.bank.verified') : t('wiringFarmers.bank.unverified')}
                  </Text>
                </View>
              )
            }
          />
          <DetailRow icon={<CalendarEventIcon />} label={t('wiringFarmers.bank.verifiedOn')} value={ADMIN_NO_VALUE} />
          <DetailRow icon={<AdminBadgeIcon />} label={t('wiringFarmers.bank.verifiedBy')} value={ADMIN_NO_VALUE} isLast />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('wiringFarmers.bank.title')}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderAccountCards()}

        {/* 3. Bank Passbook / Cancelled Cheque Card (Hidden for Warehouse Admin) */}
        {showBankProofCard && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <FileTextIcon size={18} color={adminColors.brand} />
              <Text style={styles.cardTitle}>{t('wiringFarmers.bank.proofTitle')}</Text>
            </View>

            <View style={styles.pdfTile}>
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <View style={styles.pdfMeta}>
                {/* The API sends no file name. */}
                <Text style={styles.pdfNameText}>{ADMIN_NO_VALUE}</Text>
                <Text style={styles.pdfSizeText}>
                  {bankDoc ? t(DOC_STATUS_KEYS[bankDoc.verificationStatus]) : ADMIN_NO_VALUE}
                </Text>
              </View>
            </View>

            {/* Actions: Super & TOHFA have View + Download; Farmer Admin has View only. Both open the signed readUrl. */}
            <View style={styles.docActionsRow}>
              <TouchableOpacity
                style={[styles.outlineBtn, !canDownloadBankProof && styles.outlineBtnFull, readUrl === null && styles.actionUnavailable]}
                onPress={openDocument}
                disabled={readUrl === null}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ disabled: readUrl === null }}
              >
                <EyeIcon size={16} color={adminColors.brand} />
                <Text style={styles.outlineBtnText}>{t('wiringFarmers.bank.viewDocument')}</Text>
              </TouchableOpacity>

              {canDownloadBankProof && (
                <TouchableOpacity
                  style={[styles.outlineBtn, readUrl === null && styles.actionUnavailable]}
                  onPress={openDocument}
                  disabled={readUrl === null}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: readUrl === null }}
                >
                  <DownloadIcon size={16} color={adminColors.brand} />
                  <Text style={styles.outlineBtnText}>{t('wiringFarmers.bank.download')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 4. Payout Usage Card. BR-53: these accounts are not payout destinations yet, so no usage claim. */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <BankBuildingIcon size={18} color={adminColors.brand} />
            <Text style={styles.cardTitle}>{t('wiringFarmers.bank.payoutUsageTitle')}</Text>
          </View>

          <View style={styles.payoutUsageBanner}>
            <Text style={styles.payoutUsageTitle}>{ADMIN_NO_VALUE}</Text>
            <Text style={styles.payoutUsageSub}>{t('wiringFarmers.bank.lastPayout', { value: ADMIN_NO_VALUE })}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  customValue,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  customValue?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <View style={styles.detailLabelRow}>
        <View style={styles.detailIconBox}>{icon}</View>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      {customValue ? (
        customValue
      ) : (
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    height: 54,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    fontWeight: '700',
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  bankOverviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  bankLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  bankNameText: {
    ...adminType.title,
    fontWeight: '700',
    color: adminColors.ink,
    marginLeft: adminSpacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
  },
  bankVerifiedBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  bankVerifiedBadgeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
  },
  primaryBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  primaryBadgeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brand,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  cardTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginLeft: adminSpacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.xs,
  },
  detailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
  },
  detailValue: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'right',
    maxWidth: '55%',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.text,
    marginRight: adminSpacing.xs,
  },
  inactiveDot: {
    backgroundColor: adminColors.muted,
  },
  activeDotText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.success.text,
  },
  inactiveDotText: {
    color: adminColors.muted,
  },
  verifiedStatusBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  verifiedStatusText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
  },
  unverifiedBadge: {
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  unverifiedText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  pdfTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    padding: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pdfBadge: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  pdfBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: 0.5,
  },
  pdfMeta: {
    flex: 1,
  },
  pdfNameText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  pdfSizeText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  outlineBtn: {
    flex: 1,
    height: 42,
    borderRadius: adminRadius.sm,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  outlineBtnFull: {
    flex: 1,
  },
  outlineBtnText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brand,
    marginLeft: adminSpacing.xs,
  },
  payoutUsageBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  payoutUsageTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  payoutUsageSub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  actionUnavailable: {
    opacity: 0.5,
  },
});
