import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  customerFonts,
  customerSpacing,
} from '../theme';
import { deleteCustomerAccount } from '../api/profile';
import { logout } from '../api/auth';
import { mapProblem } from '../api/problem';
import { ApiError } from '../../../shell/api/client';
import { t } from '../../../i18n/customer';

export interface CustomerAccountSettingsScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  /** Called after the account was deleted and the session cleaned up. Falls back to onNavigate('SignOut'). */
  onAccountDeleted?: () => void;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BookOpenSvg = ({ color = '#1A2E1A', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentScrollSvg = ({ color = '#1A2E1A', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashSvg = ({ color = '#B42318', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


/** BR-160: maps a failed account deletion to user-facing text. */
export function deleteAccountErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.is('CONFLICT')) {
    const reason = err.meta['reason'];
    if (reason === 'WALLET_NOT_EMPTY') return t('customer.account.settings.walletNotEmpty');
    if (reason === 'OPEN_ORDERS') return t('customer.account.settings.openOrders');
  }
  return mapProblem(err).message;
}

export const CustomerAccountSettingsScreen: React.FC<CustomerAccountSettingsScreenProps> = ({
  onNavigate,
  onBack,
  onAccountDeleted,
}) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCustomerAccount();
    } catch (err) {
      setDeleteError(deleteAccountErrorMessage(err));
      setDeleting(false);
      return;
    }
    try {
      await logout();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      if (onAccountDeleted) onAccountDeleted();
      else onNavigate?.('SignOut');
    }
  };
  const insets = useSafeAreaInsets();
  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER (EXACT FIGMA: (<-) Account Settings) ──────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel={t('customer.account.settings.back')}
          >
            <BackArrowSvg color="#1A2E1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.account.settings.title')}</Text>
        </View>
      </View>
      <View style={styles.headerBottomDivider} />

      {/* ── SETTINGS ROWS ────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Row 1: Privacy Policy */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate?.('CustomerPrivacyPolicy')}
          style={styles.rowItem}
          accessibilityLabel={t('customer.account.settings.privacy')}
        >
          <View style={styles.iconWrap}>
            <BookOpenSvg color="#1A2E1A" size={22} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>{t('customer.account.settings.privacy')}</Text>
            <Text style={styles.rowSubtitle}>{t('customer.account.settings.privacySub')}</Text>
          </View>
          <ChevronRightSvg color="#1A2E1A" size={18} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        {/* Row 2: Terms and condition */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate?.('CustomerTerms')}
          style={styles.rowItem}
          accessibilityLabel={t('customer.account.settings.terms')}
        >
          <View style={styles.iconWrap}>
            <DocumentScrollSvg color="#1A2E1A" size={22} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>{t('customer.account.settings.terms')}</Text>
            <Text style={styles.rowSubtitle}>{t('customer.account.settings.termsSub')}</Text>
          </View>
          <ChevronRightSvg color="#1A2E1A" size={18} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        {/* Row 3: Delete account (BR-160) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setDeleteError(null);
            setConfirmOpen(true);
          }}
          style={styles.rowItem}
          accessibilityLabel={t('customer.account.settings.delete')}
        >
          <View style={styles.iconWrap}>
            <TrashSvg color="#B42318" size={22} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.rowTitle, styles.dangerText]}>{t('customer.account.settings.delete')}</Text>
            <Text style={styles.rowSubtitle}>{t('customer.account.settings.deleteSub')}</Text>
          </View>
          <ChevronRightSvg color="#B42318" size={18} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => { if (!deleting) setConfirmOpen(false); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('customer.account.settings.deleteTitle')}</Text>
            <Text style={styles.modalBody}>
              {t('customer.account.settings.deleteBody')}
            </Text>
            {deleteError ? <Text style={styles.modalError}>{deleteError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={deleting}
                onPress={() => setConfirmOpen(false)}
                style={[styles.modalBtn, styles.modalCancel]}
                accessibilityLabel={t('customer.account.settings.cancel')}
              >
                <Text style={styles.modalCancelText}>{t('customer.account.settings.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={deleting}
                onPress={() => void confirmDelete()}
                style={[styles.modalBtn, styles.modalDelete]}
                accessibilityLabel={t('customer.account.settings.deleteConfirm')}
              >
                {deleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalDeleteText}>{t('customer.account.settings.deleteConfirm')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    fontWeight: '400',
  },
  headerBottomDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  content: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  iconWrap: {
    width: 32,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2E1A',
    fontFamily: customerFonts.semibold,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: customerFonts.regular,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  dangerText: {
    color: '#B42318',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    fontFamily: customerFonts.regular,
  },
  modalError: {
    fontSize: 13,
    lineHeight: 19,
    color: '#B42318',
    fontFamily: customerFonts.regular,
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancel: {
    borderWidth: 1.2,
    borderColor: '#1A2E1A',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
    fontFamily: customerFonts.semibold,
  },
  modalDelete: {
    backgroundColor: '#B42318',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: customerFonts.semibold,
  },
});
