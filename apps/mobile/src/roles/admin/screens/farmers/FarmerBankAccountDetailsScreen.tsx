import React, { useState } from 'react';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  Alert,
  Platform,
  Pressable,
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
import { type Can } from '../../permissions/can';

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

function BackArrowWhiteIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HdfcLogoIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect width="32" height="32" rx="4" fill="#004C8F" />
      <Rect x="4" y="4" width="24" height="24" rx="2" fill="#FFFFFF" />
      <Rect x="12" y="6" width="8" height="20" fill="#ED1C24" />
      <Rect x="6" y="12" width="20" height="8" fill="#ED1C24" />
      <Rect x="12" y="12" width="8" height="8" fill="#004C8F" />
    </Svg>
  );
}

function UserIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdCardIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h2M15 12h2M7 16h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BankBuildingIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CodeIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m16 18 6-6-6-6M8 6l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PinIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function FileTextIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarEventIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function AdminBadgeIcon({ size = 16, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15l-2 5 4-2 4 2-2-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeIcon({ size = 16, color = '#D9480F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ size = 16, color = '#D9480F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface FarmerBankAccountDetailsScreenProps {
  farmerName?: string | undefined;
  farmerId?: string | undefined;
  role?: string | undefined;
  can?: Can | undefined;
  onBack: () => void;
}

export function FarmerBankAccountDetailsScreen({
  farmerName = ADMIN_NO_VALUE,
  farmerId = ADMIN_NO_VALUE,
  role,
  can: _can,
  onBack,
}: FarmerBankAccountDetailsScreenProps): React.JSX.Element {
  const roleCategory = resolveAdminRoleCategory(role);

  const isSuperAdmin = roleCategory === 'SUPER_ADMIN';
  const isTohfaAdmin = roleCategory === 'TOHFA_ADMIN';
  const isFarmerAdmin = roleCategory === 'FARMER_ADMIN';
  const isWarehouseAdmin = roleCategory === 'WAREHOUSE_ADMIN';

  // Bank Proof (Passbook / Cancelled Cheque PDF card):
  // - Super Admin: View + Download
  // - TOHFA Admin: View + Download
  // - Farmer Admin: View Document ONLY (no download button) (Matching FA Image)
  // - Warehouse Admin (Main & Sub): Hidden completely (Matching MWA, SWA Image)
  const showBankProofCard = isSuperAdmin || isTohfaAdmin || isFarmerAdmin;
  const canDownloadBankProof = isSuperAdmin || isTohfaAdmin;
  // Payout Usage card is visible for all roles (SA, TA, FA, MWA, SWA).
  const showPayoutUsageCard = true;

  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  const handleViewDocument = () => {
    Alert.alert('View Document', 'Displaying Ramesh_Kumar_Bank_Proof.pdf');
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Downloading Ramesh_Kumar_Bank_Proof.pdf');
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
        <Text style={styles.headerTitle}>Bank Account Details</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Bank Brand Card */}
        <View style={styles.bankOverviewCard}>
          <View style={styles.bankLogoRow}>
            <HdfcLogoIcon size={34} />
            <Text style={styles.bankNameText}>HDFC Bank</Text>
          </View>
          <View style={styles.badgesRow}>
            <View style={styles.bankVerifiedBadge}>
              <Text style={styles.bankVerifiedBadgeText}>✓ Bank Verified</Text>
            </View>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>★ Primary Payout Account</Text>
            </View>
          </View>
        </View>

        {/* 2. Account Details Table Card */}
        <View style={styles.card}>
          <DetailRow icon={<UserIcon />} label="Account Holder" value={farmerName} />
          <DetailRow icon={<IdCardIcon />} label="Farmer ID" value={farmerId} />
          <DetailRow icon={<BankBuildingIcon />} label="Account Number" value="•••• •••• 4821" />
          <DetailRow icon={<CodeIcon />} label="IFSC Code" value="IDIB000C123" />
          <DetailRow icon={<PinIcon />} label="Branch" value="Coonoor" />
          <DetailRow icon={<CardIcon />} label="Account Type" value="Savings" />
          <DetailRow
            icon={<FileTextIcon />}
            label="Account Status"
            customValue={
              <View style={styles.statusDotRow}>
                <View style={styles.activeDot} />
                <Text style={styles.activeDotText}>Active</Text>
              </View>
            }
          />
          <DetailRow
            icon={<ShieldCheckIcon />}
            label="Verification Status"
            customValue={
              <View style={styles.verifiedStatusBadge}>
                <Text style={styles.verifiedStatusText}>✓ Verified</Text>
              </View>
            }
          />
          <DetailRow icon={<CalendarEventIcon />} label="Verified On" value="14 Oct 2026" />
          <DetailRow icon={<AdminBadgeIcon />} label="Verified By" value="TOHFA Admin" isLast />
        </View>

        {/* 3. Bank Passbook / Cancelled Cheque Card (Hidden for Warehouse Admin) */}
        {showBankProofCard && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <FileTextIcon size={18} color="#D9480F" />
              <Text style={styles.cardTitle}>Bank Passbook / Cancelled Cheque</Text>
            </View>

            <View style={styles.pdfTile}>
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <View style={styles.pdfMeta}>
                <Text style={styles.pdfNameText}>Ramesh_Kumar_Bank_Proof.pdf</Text>
                <Text style={styles.pdfSizeText}>PDF · 1.8 MB</Text>
              </View>
            </View>

            {/* Actions: Super & TOHFA have View + Download; Farmer Admin has View only */}
            <View style={styles.docActionsRow}>
              <TouchableOpacity
                style={[styles.outlineBtn, !canDownloadBankProof && styles.outlineBtnFull]}
                onPress={handleViewDocument}
                activeOpacity={0.7}
              >
                <EyeIcon size={16} color="#D9480F" />
                <Text style={styles.outlineBtnText}>View Document</Text>
              </TouchableOpacity>

              {canDownloadBankProof && (
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={handleDownload}
                  activeOpacity={0.7}
                >
                  <DownloadIcon size={16} color="#D9480F" />
                  <Text style={styles.outlineBtnText}>Download</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 4. Payout Usage Card (Hidden for Farmer Admin) */}
        {showPayoutUsageCard && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <BankBuildingIcon size={18} color="#D9480F" />
              <Text style={styles.cardTitle}>Payout Usage</Text>
            </View>

            <View style={styles.payoutUsageBanner}>
              <Text style={styles.payoutUsageTitle}>✓ Used for farmer payouts</Text>
              <Text style={styles.payoutUsageSub}>Last payout: PAY-0006 · ₹7,200 · 02 Nov 2026</Text>
            </View>
          </View>
        )}

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
    backgroundColor: '#D9480F',
  },
  header: {
    height: 54,
    backgroundColor: '#D9480F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bankOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  bankLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bankNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankVerifiedBadge: {
    backgroundColor: '#E6F4EA',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#CEEAD6',
  },
  bankVerifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#137333',
  },
  primaryBadge: {
    backgroundColor: '#FFF4EB',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFE0C2',
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D9480F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
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
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
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
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  activeDotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  verifiedStatusBadge: {
    backgroundColor: '#E6F4EA',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#137333',
  },
  pdfTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE0C2',
  },
  pdfBadge: {
    backgroundColor: '#E03131',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginRight: 10,
  },
  pdfBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pdfMeta: {
    flex: 1,
  },
  pdfNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  pdfSizeText: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineBtnFull: {
    flex: 1,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D9480F',
    marginLeft: 6,
  },
  payoutUsageBanner: {
    backgroundColor: '#E6F7EF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CEEAD6',
  },
  payoutUsageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D6832',
    marginBottom: 4,
  },
  payoutUsageSub: {
    fontSize: 12,
    color: '#5A6860',
  },
});
