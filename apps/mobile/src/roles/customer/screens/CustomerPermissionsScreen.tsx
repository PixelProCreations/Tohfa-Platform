import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import permissionsHeroCrate from '../assets/images/permissions_hero_crate.jpg';

interface CustomerPermissionsScreenProps {
  onNavigate: (
    screen: 'CustomerAddAddress' | 'CustomerMain',
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

const CyanBellSvg = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke="#38BDF8"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Exact Figma Teardrop Location Pin with Circular Inner Cutout
const CyanLocationPinHeaderSvg = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      fill="#38BDF8"
    />
    <Circle cx={12} cy={9} r={3} fill="#334155" />
  </Svg>
);

const PreciseMapGraphic = ({ isSelected }: { isSelected: boolean }) => (
  <View style={[styles.locationCircleOuter, isSelected && styles.locationCircleActive]}>
    <Svg width={72} height={72} viewBox="0 0 76 76">
      <Circle cx={38} cy={38} r={38} fill="#1E293B" />
      <Path d="M0 25h76M0 50h76M25 0v76M50 0v76" stroke="#334155" strokeWidth={1} />
      <Path d="M10 0l56 76M0 20l76 56M0 56l56-56" stroke="#374151" strokeWidth={0.8} />
      <Circle cx={20} cy={22} r={3} fill="#FB923C" />
      <Circle cx={58} cy={54} r={3} fill="#38BDF8" />
      <Circle cx={54} cy={20} r={2.5} fill="#FACC15" />
      <Circle cx={38} cy={38} r={14} fill="rgba(56, 189, 248, 0.25)" />
      <Circle cx={38} cy={38} r={8} fill="rgba(56, 189, 248, 0.45)" />
      <Path
        d="M38 28c-3.3 0-6 2.7-6 6 0 4.5 6 11 6 11s6-6.5 6-11c0-3.3-2.7-6-6-6z"
        fill="#38BDF8"
      />
      <Circle cx={38} cy={34} r={2.2} fill="#FFFFFF" />
    </Svg>
    {isSelected && (
      <View style={styles.selectedCheckBadge}>
        <Text style={styles.selectedCheckIcon}>✓</Text>
      </View>
    )}
  </View>
);

const ApproximateMapGraphic = ({ isSelected }: { isSelected: boolean }) => (
  <View style={[styles.locationCircleOuter, isSelected && styles.locationCircleActive]}>
    <Svg width={72} height={72} viewBox="0 0 76 76">
      <Circle cx={38} cy={38} r={38} fill="#1E293B" />
      <Path d="M0 30h76M0 54h76M22 0v76M54 0v76" stroke="#334155" strokeWidth={1} />
      <Path d="M5 10l66 66M0 45l45-45" stroke="#374151" strokeWidth={0.8} />
      <Path
        d="M10 65C22 55 28 35 45 25C54 19 66 18 74 16"
        stroke="#FBBF24"
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M6 35C24 38 42 48 58 68"
        stroke="#38BDF8"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M44 14l5-3 5 3v5c0 3.5-3 6.5-5 7.5c-2-1-5-4-5-7.5v-5z"
        fill="#3B82F6"
      />
      <Circle cx={49} cy={18} r={1.5} fill="#FFFFFF" />
    </Svg>
    {isSelected && (
      <View style={styles.selectedCheckBadge}>
        <Text style={styles.selectedCheckIcon}>✓</Text>
      </View>
    )}
  </View>
);

const DarkPinSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
      stroke="#1F2937"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={9} r={2.5} stroke="#1F2937" strokeWidth={1.8} />
  </Svg>
);

export const CustomerPermissionsScreen: React.FC<CustomerPermissionsScreenProps> = ({ onNavigate }) => {
  const [modalStep, setModalStep] = useState<'none' | 'notification' | 'location' | 'delivery'>('none');
  const [locationType, setLocationType] = useState<'precise' | 'approximate'>('precise');

  const handleNext = () => {
    setModalStep('notification');
  };

  const handleSkip = () => {
    onNavigate('CustomerMain');
  };

  const handleNotificationChoice = () => {
    setModalStep('location');
  };

  const handleLocationChoice = () => {
    setModalStep('delivery');
  };

  const handleDeliveryChoice = (source: 'current' | 'manual' = 'manual') => {
    setModalStep('none');
    onNavigate('CustomerAddAddress', { addressSource: source });
  };

  return (
    <View style={styles.container}>
      {/* Edge-to-edge pure white, status bar hidden */}
      <StatusBar hidden={true} />

      {/* ── TOP BAR: (X) ON LEFT, SKIP ON RIGHT ───────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.closeCircleButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── HERO VISUAL (FROM FIGMA) ─────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <Image source={permissionsHeroCrate} style={styles.heroImage} resizeMode="contain" />
        </View>

        {/* ── CONTENT SECTION ──────────────────────────────────────────────── */}
        <View style={styles.textSection}>
          <Text style={styles.preTitle}>MAKE IT YOURS</Text>
          <Text style={styles.title}>A fresher experience starts here</Text>
          <Text style={styles.subtitle}>
            Turn on a few helpful settings to make shopping with TOHFA Market easier.
          </Text>

          {/* Option 1: Stay in the loop */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <GreenBellIcon />
            </View>
            <View style={styles.permissionTextWrap}>
              <Text style={styles.permissionTitle}>Stay in the loop</Text>
              <Text style={styles.permissionDesc}>
                Get alerts about fresh arrivals, order updates and special offers.
              </Text>
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
              <Text style={styles.permissionTitle}>Find what's nearby</Text>
              <Text style={styles.permissionDesc}>
                See produce available around your area and estimated delivery options.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── FLOATING BOTTOM-RIGHT CIRCULAR ACTION BUTTON ─────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleNext}
        style={[styles.floatingNextButton, customerShadow.raised]}
        accessibilityRole="button"
        accessibilityLabel="Continue to permissions"
      >
        <ArrowRightFigmaIcon size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── MODAL 1: NOTIFICATION PERMISSION (300 x 222 Hug) ─────────────── */}
      <Modal visible={modalStep === 'notification'} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.notificationDialogCard}>
            {/* Cyan Bell Icon */}
            <View style={styles.cyanIconCircle}>
              <CyanBellSvg />
            </View>

            <Text style={styles.dialogTitle}>
              Allow <Text style={styles.dialogTitleBold}>TOHFA Market</Text> to send you notification?
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNotificationChoice}
              style={styles.dialogPrimaryBtn}
            >
              <Text style={styles.dialogBtnText}>CONTINUE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNotificationChoice}
              style={[styles.dialogPrimaryBtn, { marginTop: 10 }]}
            >
              <Text style={styles.dialogBtnText}>DON'T ALLOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: LOCATION PERMISSION (300 x 412 Hug - EXACT FIGMA SPEC) ── */}
      <Modal visible={modalStep === 'location'} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.locationDialogCard}>
            {/* Exact Cyan Location Pin with Inner Cutout */}
            <View style={styles.cyanIconCircle}>
              <CyanLocationPinHeaderSvg />
            </View>

            <Text style={styles.dialogTitle}>
              Allow <Text style={styles.dialogTitleBold}>TOHFA Market</Text> to access this device's location?
            </Text>

            {/* Precise vs Approximate visual selector */}
            <View style={styles.locationSelectorRow}>
              {/* Precise option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLocationType('precise')}
                style={styles.locationChoiceWrap}
              >
                <PreciseMapGraphic isSelected={locationType === 'precise'} />
                <Text
                  style={[
                    styles.locationChoiceLabel,
                    locationType === 'precise' && styles.locationChoiceLabelActive,
                  ]}
                >
                  Precise
                </Text>
              </TouchableOpacity>

              {/* Approximate option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLocationType('approximate')}
                style={styles.locationChoiceWrap}
              >
                <ApproximateMapGraphic isSelected={locationType === 'approximate'} />
                <Text
                  style={[
                    styles.locationChoiceLabel,
                    locationType === 'approximate' && styles.locationChoiceLabelActive,
                  ]}
                >
                  Approximate
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLocationChoice}
              style={styles.dialogPrimaryBtn}
            >
              <Text style={styles.dialogBtnText}>WHILE USING THE APP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLocationChoice}
              style={[styles.dialogPrimaryBtn, { marginTop: 10 }]}
            >
              <Text style={styles.dialogBtnText}>ONLY THIS TIME</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLocationChoice}
              style={[styles.dialogPrimaryBtn, { marginTop: 10 }]}
            >
              <Text style={styles.dialogBtnText}>DON'T ALLOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: WHERE SHOULD WE DELIVER (300 x 216 Hug) ─────────────── */}
      <Modal visible={modalStep === 'delivery'} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.deliverySheetCard}>
            {/* Top Right Floating Close Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDeliveryChoice('manual')}
              style={styles.sheetCloseBtn}
            >
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.deliverySheetTitle}>Where should we deliver?</Text>
            <Text style={styles.deliverySheetSubtitle}>
              Choose your location to discover fresh produce available near you.
            </Text>

            {/* Option 1: Use my current location (Green Tinted) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleDeliveryChoice('current')}
              style={styles.currentLocationCard}
            >
              <View style={styles.locationPinCircleGreen}>
                <DarkPinSvg />
              </View>
              <View style={styles.deliveryTextWrap}>
                <Text style={styles.deliveryOptionTitle}>Use my current location</Text>
                <Text style={styles.deliveryOptionDesc}>
                  Find nearby products and check delivery availability for your area.
                </Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Option 2: Select location manually (White Bordered) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleDeliveryChoice('manual')}
              style={styles.manualLocationCard}
            >
              <View style={styles.locationPinCircleWhite}>
                <DarkPinSvg />
              </View>
              <View style={styles.deliveryTextWrap}>
                <Text style={styles.deliveryOptionTitle}>Select location manually</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
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
