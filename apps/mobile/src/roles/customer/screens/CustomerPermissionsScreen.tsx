/**
 * Permissions primer (Figma 46:34312; the 46:34342 / 46:34379 dialogs are the
 * real OS prompts now). BR-160/BR-171.
 *
 *  - Notifications: shared push service (registers the FCM token with the API).
 *  - Location: OS location permission (precise/approximate is chosen in the OS dialog).
 *  - Denied / blocked never stop onboarding: skip always works, a denied
 *    location falls back to manual address entry.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { ArrowRightFigmaIcon } from '../components';
import { CustomerDeliveryAddressModal, type AddressSaveResult } from '../components/CustomerDeliveryAddressModal';
import { ServiceAreaRequestModal, prefillFromAddress } from '../components/ServiceAreaRequestFlow';
import type { CustomerAddress } from '../api/addresses';
import {
  openAppSettings,
  requestLocationPermission,
  requestNotificationPermission,
  type PermissionOutcome,
} from '../utils/deviceLocation';
import permissionsHeroCrate from '../assets/images/permissions_hero_crate.jpg';
import { t, type TranslationKey } from '../../../i18n/customer';

interface CustomerPermissionsScreenProps {
  onNavigate: (
    screen: 'CustomerAddAddress' | 'CustomerLoadingMarket' | 'CustomerMain',
    params?: { addressSource?: 'current' | 'manual' }
  ) => void;
}

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const GreenBellIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GreenPinIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={9} r={2.5} stroke="#2E7D32" strokeWidth={1.8} />
  </Svg>
);

const STATUS_TEXT: Record<PermissionOutcome, TranslationKey> = {
  granted: 'customer.account.permissions.granted',
  denied: 'customer.account.permissions.denied',
  blocked: 'customer.account.permissions.blocked',
  unavailable: 'customer.account.permissions.unavailable',
};

export const CustomerPermissionsScreen: React.FC<CustomerPermissionsScreenProps> = ({ onNavigate }) => {
  const [modalStep, setModalStep] = useState<'none' | 'delivery' | 'addAddress'>('none');
  const [requesting, setRequesting] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<PermissionOutcome | null>(null);
  const [locationStatus, setLocationStatus] = useState<PermissionOutcome | null>(null);
  const [unservedAddress, setUnservedAddress] = useState<CustomerAddress | null>(null);
  const skipped = useRef(false);

  const handleNext = async () => {
    if (requesting) return;
    setRequesting(true);
    skipped.current = false;
    try {
      // Real OS prompts, one after the other; a "no" never blocks onboarding.
      setNotificationStatus(await requestNotificationPermission());
      if (skipped.current) return;
      setLocationStatus(await requestLocationPermission(true));
      if (skipped.current) return;
      setModalStep('delivery');
    } finally {
      setRequesting(false);
    }
  };

  const handleSkip = () => {
    skipped.current = true;
    setModalStep('none');
    onNavigate('CustomerLoadingMarket');
  };

  const handleDeliveryChoice = (source: 'current' | 'manual' = 'manual') => {
    setModalStep('none');
    // Without location permission "current location" falls back to manual entry.
    const effective = source === 'current' && locationStatus !== null && locationStatus !== 'granted' ? 'manual' : source;
    onNavigate('CustomerAddAddress', { addressSource: effective });
  };

  const handleSaveAddress = (address: CustomerAddress, result: AddressSaveResult) => {
    setModalStep('none');
    if (result.serviceable === false) {
      setUnservedAddress(address);
      return;
    }
    onNavigate('CustomerLoadingMarket');
  };

  const statusLine = (status: PermissionOutcome | null, testID: string) =>
    status === null ? null : (
      <View style={styles.permissionStatusRow}>
        <Text testID={testID} style={[styles.permissionStatus, status === 'granted' && styles.permissionStatusOn]}>
          {t(STATUS_TEXT[status])}
        </Text>
        {status === 'blocked' ? (
          <TouchableOpacity onPress={openAppSettings} accessibilityRole="button" testID={`${testID}-settings`}>
            <Text style={styles.permissionSettingsLink}>{t('customer.account.permissions.openSettings')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Edge-to-edge pure white, status bar hidden */}
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={true} />

      {/* ── TOP BAR: (X) ON LEFT, SKIP ON RIGHT ───────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.closeCircleButton}
          accessibilityRole="button"
          accessibilityLabel={t('customer.account.permissions.close')}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="permissions-skip"
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel={t('customer.account.permissions.skip')}
        >
          <Text style={styles.skipText}>{t('customer.account.permissions.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── HERO VISUAL (FROM FIGMA) ─────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <Image source={permissionsHeroCrate} style={styles.heroImage} resizeMode="contain" />
        </View>

        {/* ── CONTENT SECTION ──────────────────────────────────────────────── */}
        <View style={styles.textSection}>
          <Text style={styles.preTitle}>{t('customer.account.permissions.preTitle')}</Text>
          <Text style={styles.title}>{t('customer.account.permissions.title')}</Text>
          <Text style={styles.subtitle}>
            {t('customer.account.permissions.subtitle')}
          </Text>

          {/* Option 1: Stay in the loop */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <GreenBellIcon />
            </View>
            <View style={styles.permissionTextWrap}>
              <Text style={styles.permissionTitle}>{t('customer.account.permissions.notifTitle')}</Text>
              <Text style={styles.permissionDesc}>
                {t('customer.account.permissions.notifBody')}
              </Text>
              {statusLine(notificationStatus, 'notification-status')}
            </View>
          </View>

          {/* Thin divider line */}
          <View style={styles.divider} />

          {/* Option 2: Find what's nearby */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <GreenPinIcon />
            </View>
            <View style={styles.permissionTextWrap}>
              <Text style={styles.permissionTitle}>{t('customer.account.permissions.locTitle')}</Text>
              <Text style={styles.permissionDesc}>
                {t('customer.account.permissions.locBody')}
              </Text>
              {statusLine(locationStatus, 'location-status')}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── FLOATING BOTTOM-RIGHT CIRCULAR ACTION BUTTON ─────────────────── */}
      <TouchableOpacity
        testID="permissions-next"
        activeOpacity={0.8}
        onPress={() => void handleNext()}
        disabled={requesting}
        style={[styles.floatingNextButton, customerShadow.raised]}
        accessibilityRole="button"
        accessibilityLabel={t('customer.account.permissions.continueA11y')}
        accessibilityState={{ busy: requesting }}
      >
        {requesting ? <ActivityIndicator color="#FFFFFF" /> : <ArrowRightFigmaIcon size={24} color="#FFFFFF" />}
      </TouchableOpacity>

      {/* ── WHERE SHOULD WE DELIVER / ADD ADDRESS MODALS ── */}
      <CustomerDeliveryAddressModal
        visible={modalStep === 'delivery' || modalStep === 'addAddress'}
        initialStep={modalStep === 'addAddress' ? 'addAddress' : 'delivery'}
        onClose={() => setModalStep('none')}
        onUseCurrentLocation={() => handleDeliveryChoice('current')}
        onSelectManualLocation={() => handleDeliveryChoice('manual')}
        onSaveAddress={handleSaveAddress}
      />

      {/* ── UNSERVED AREA -> REQUEST AREA (Figma 46:34706 / 46:34925 / 46:35103) ── */}
      <ServiceAreaRequestModal
        visible={unservedAddress !== null}
        initialStep="unserved"
        prefill={prefillFromAddress(unservedAddress ?? undefined)}
        onClose={() => {
          setUnservedAddress(null);
          onNavigate('CustomerLoadingMarket');
        }}
        onContinue={() => {
          setUnservedAddress(null);
          onNavigate('CustomerLoadingMarket');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  permissionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  permissionStatus: {
    fontFamily: customerFonts.regular,
    fontSize: 11.5,
    color: '#B45309',
  },
  permissionStatusOn: {
    color: '#2E7D32',
  },
  permissionSettingsLink: {
    fontFamily: customerFonts.semibold,
    fontSize: 11.5,
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing[24],
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  closeCircleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontFamily: customerFonts.semibold,
    fontSize: 15,
    color: customerColors.body,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroWrap: {
    width: '100%',
    height: 230,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textSection: {
    paddingHorizontal: customerSpacing[24],
    paddingTop: 14,
  },
  preTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontFamily: customerFonts.editorial,
    fontSize: 26,
    lineHeight: 33,
    color: customerColors.brand,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginBottom: 20,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  permissionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionTextWrap: {
    flex: 1,
  },
  permissionTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 2,
  },
  permissionDesc: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
    width: '100%',
  },
  floatingNextButton: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },

  // ── MODAL DIALOG STYLES ──────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notificationDialogCard: {
    width: 300,
    backgroundColor: '#334155',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  locationDialogCard: {
    width: 300,
    backgroundColor: '#334155',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  cyanIconCircle: {
    marginBottom: 12,
  },
  dialogTitle: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  dialogTitleBold: {
    fontFamily: customerFonts.bold,
    color: '#FFFFFF',
  },
  dialogPrimaryBtn: {
    width: '100%',
    backgroundColor: '#BAE6FD',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    color: '#0F172A',
    letterSpacing: 0.5,
  },

  // Location selector (Precise vs Approximate)
  locationSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
    width: '100%',
  },
  locationChoiceWrap: {
    alignItems: 'center',
  },
  locationCircleOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#475569',
    marginBottom: 6,
    position: 'relative',
  },
  locationCircleActive: {
    borderColor: '#38BDF8',
    borderWidth: 2.5,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectedCheckIcon: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
  },
  radarCrossV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#334155',
  },
  radarRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  radarDotCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadGrid: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  roadLine1: {
    position: 'absolute',
    top: 22,
    left: 4,
    right: 8,
    height: 3,
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '15deg' }],
  },
  roadLine2: {
    position: 'absolute',
    bottom: 18,
    left: 10,
    right: 4,
    height: 2.5,
    backgroundColor: '#38BDF8',
    transform: [{ rotate: '-10deg' }],
  },
  roadLine3: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 34,
    width: 2.5,
    backgroundColor: '#94A3B8',
  },
  locationChoiceLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#94A3B8',
  },
  locationChoiceLabelActive: {
    color: '#F8FAFC',
    fontFamily: customerFonts.semibold,
  },

  // ── WHERE SHOULD WE DELIVER DIALOG (300 x 216 Hug) ───────────────────────
  deliverySheetCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    position: 'relative',
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sheetCloseText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  deliverySheetTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  deliverySheetSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  manualLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  locationPinCircleGreen: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationPinCircleWhite: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliveryTextWrap: {
    flex: 1,
  },
  deliveryOptionTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  deliveryOptionDesc: {
    fontFamily: customerFonts.regular,
    fontSize: 10.5,
    lineHeight: 14,
    color: '#6B7280',
  },
  chevronIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    marginLeft: 6,
  },
});
