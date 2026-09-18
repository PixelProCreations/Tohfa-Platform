import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { setLocale, type Locale } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';
import { logout } from '../../api/auth';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.greenDeep1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TranslateIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 8h10M10 5v3M8 8c0 4-2 7.5-5 9M13 17c-2-2.5-3.5-5.5-4-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 19l4-9 4 9M16.5 16h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DataStorageIcon({ size = 22, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6c0-1.657 3.582-3 8-3s8 1.343 8 3M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockPasswordIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2.5" stroke={color} strokeWidth="2" />
      <Path
        d="M8 11V7a4 4 0 1 1 8 0v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

function MobilePhoneIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="2" width="12" height="20" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M11 18h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HelpSupportIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 19, color = P.greenDeep8 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloudRainIcon({ size = 22, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.5 16H9a5 5 0 1 1 4.5-7.2A3.5 3.5 0 0 1 19 12.5c0 1.93-1.57 3.5-3.5 3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 18.5l-1 3M13.5 18.5l-1 3M17.5 18.5l-1 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LeafOutlineIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 4.5c-4.5-.5-11 2-13.5 8s.5 9 3.5 9c6 0 11.5-6.5 12-13.5-0.5-2-1-3-2-3.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 14.5l5-5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PriceTagIcon({ size = 22, color = P.twViolet600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 12.5l-6.5 6.5a2 2 0 0 1-2.83 0L3.5 12.33V3.5h8.83l7.17 7.17a2 2 0 0 1 0 2.83Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="8" r="1.5" fill={color} />
    </Svg>
  );
}

function UsersGroupIcon({ size = 22, color = P.brownDeep2 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 19v-1.5a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3V19"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="11" cy="9" r="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M18 19v-1a2.5 2.5 0 0 0-2-2.45M15.5 6.5a2.5 2.5 0 0 1 0 5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M4 19v-1a2.5 2.5 0 0 1 2-2.45M6.5 6.5a2.5 2.5 0 0 0 0 5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CommunityChatIcon({ size = 22, color = P.twStone500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 14h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 8H5a2 2 0 0 0-2 2v8l3.5-3.5H15a2 2 0 0 0 2-2v-2.5a2 2 0 0 0-2-2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SignOutIcon({ size = 20, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CustomToggleSwitch({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.customToggleTrack,
        value ? styles.customToggleTrackOn : styles.customToggleTrackOff,
      ]}
    >
      <View
        style={[
          styles.customToggleThumb,
          value ? styles.customToggleThumbOn : styles.customToggleThumbOff,
        ]}
      />
    </TouchableOpacity>
  );
}

// ── Types & Props ────────────────────────────────────────────────────────────

interface SettingsScreenProps {
  onBack: () => void;
  onNavigateToProfile?: (() => void) | undefined;
  onNavigateToChangePassword?: (() => void) | undefined;
  onNavigateToChangeMobile?: (() => void) | undefined;
  onNavigateToAboutSupport?: (() => void) | undefined;
  onSignOut: () => void;
}

export function SettingsScreen({
  onBack,
  onNavigateToProfile,
  onNavigateToChangePassword,
  onNavigateToChangeMobile,
  onNavigateToAboutSupport,
  onSignOut,
}: SettingsScreenProps): React.JSX.Element {
  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');

  // Interactive modal states
  const [activeModal, setActiveModal] = useState<
    'notifications' | 'data' | 'password' | 'mobile' | 'support' | null
  >(null);

  // Notifications State
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifFarm, setNotifFarm] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);
  const [notifPayroll, setNotifPayroll] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(false);

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Mobile State
  const [newMobile, setNewMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const activeNotifCount = [
    notifWeather,
    notifFarm,
    notifMarket,
    notifPayroll,
    notifCommunity,
  ].filter(Boolean).length;

  const handleSwitchLanguage = (lang: Locale) => {
    setSelectedLocale(lang);
    setLocale(lang);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of TOHFA?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            onSignOut();
          })();
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Local offline cached maps and media (24.6 MB) cleared successfully.',
      [{ text: 'OK', onPress: () => setActiveModal(null) }]
    );
  };

  const handleChangePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Required Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    Alert.alert('Success', 'Your password has been changed successfully.', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPass('');
          setNewPass('');
          setConfirmPass('');
          setActiveModal(null);
        },
      },
    ]);
  };

  const handleSendOtp = () => {
    if (newMobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP Sent', `A 6-digit verification code was sent to +91 ${newMobile}.`);
  };

  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code.');
      return;
    }
    Alert.alert('Mobile Number Updated', `Your registered number is now +91 ${newMobile}.`, [
      {
        text: 'OK',
        onPress: () => {
          setNewMobile('');
          setOtpCode('');
          setOtpSent(false);
          setActiveModal(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.weatherCloudWhite} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={18} color={P.greenDeep1} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Account, preferences & support</Text>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Farmer Profile Banner Card ── */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.88}
          onPress={onNavigateToProfile}
          accessibilityRole="button"
          accessibilityLabel="View farmer profile"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>SR</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Selvam R.</Text>
            <Text style={styles.profileFarm}>Green Terrace Farm · Kotagiri</Text>
            <Text style={styles.profileMeta}>TOHFA-04127 · +91 98420 55031</Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* Profile Helper Caption */}
        <Text style={styles.profileCaption}>
          Opens your profile — details are edited in Farmer Profile.
        </Text>

        {/* ── SECTION 1: PREFERENCES ── */}
        <Text style={styles.sectionHeaderTitle}>PREFERENCES</Text>

        {/* Language Card */}
        <View style={styles.settingCard}>
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <TranslateIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Language</Text>
            <Text style={styles.settingSubtitle}>Switches instantly</Text>
          </View>

          {/* Segmented Language Switcher */}
          <View style={styles.langSegmentedContainer}>
            <TouchableOpacity
              style={[
                styles.langSegment,
                selectedLocale === 'ta' && styles.langSegmentActive,
              ]}
              onPress={() => handleSwitchLanguage('ta')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.langSegmentText,
                  selectedLocale === 'ta' && styles.langSegmentTextActive,
                ]}
              >
                தமிழ்
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langSegment,
                selectedLocale === 'en' && styles.langSegmentActive,
              ]}
              onPress={() => handleSwitchLanguage('en')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.langSegmentText,
                  selectedLocale === 'en' && styles.langSegmentTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Card */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications settings"
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <BellIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingSubtitle}>
              Weather, farm, marketing, payroll on
            </Text>
          </View>

          <View style={styles.rightActionRow}>
            <Text style={styles.statusPillGreen}>{activeNotifCount} of 5</Text>
            <ChevronRightIcon size={18} color={P.twGray400} />
          </View>
        </TouchableOpacity>

        {/* Data & Storage Card */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('data')}
          accessibilityRole="button"
          accessibilityLabel="Data and storage settings"
        >
          <View style={[styles.iconBox, { backgroundColor: P.sky100 }]}>
            <DataStorageIcon size={22} color={P.sky600} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Data & storage</Text>
            <Text style={styles.settingSubtitle}>
              24.6 MB cached · synced 2h ago
            </Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── SECTION 2: SECURITY ── */}
        <Text style={styles.sectionHeaderTitle}>SECURITY</Text>

        {/* Change Password */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => {
            if (onNavigateToChangePassword) {
              onNavigateToChangePassword();
            } else {
              setActiveModal('password');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Change password"
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <LockPasswordIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Change password</Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* Change Mobile Number */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => {
            if (onNavigateToChangeMobile) {
              onNavigateToChangeMobile();
            } else {
              setActiveModal('mobile');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Change mobile number"
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <MobilePhoneIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Change mobile number</Text>
            <Text style={styles.settingSubtitle}>Verified by OTP</Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── SECTION 3: SUPPORT ── */}
        <Text style={styles.sectionHeaderTitle}>SUPPORT</Text>

        {/* About & Support */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => {
            if (onNavigateToAboutSupport) {
              onNavigateToAboutSupport();
            } else {
              setActiveModal('support');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="About and support"
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <HelpSupportIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>About & support</Text>
            <Text style={styles.settingSubtitle}>
              App info, help center, contact, feedback
            </Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── SECTION 4: ACCOUNT ── */}
        <Text style={styles.sectionHeaderTitle}>ACCOUNT</Text>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <View style={[styles.iconBox, { backgroundColor: P.twRed100 }]}>
            <SignOutIcon size={22} color={P.twRed600} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: P.twRed600 }]}>Sign out</Text>
            <Text style={styles.settingSubtitle}>Sign out of your TOHFA account</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── NOTIFICATIONS BOTTOM SHEET ── */}
      <Modal
        visible={activeModal === 'notifications'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setActiveModal(null)}
          />
          <View style={styles.notifModalCard}>
            {/* Sheet Handle */}
            <View style={styles.sheetDragHandle} />

            {/* Header */}
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifSheetTitle}>Notifications</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Disclaimer Info Banner */}
            <View style={styles.notifAlertCard}>
              <InfoCircleIcon size={18} color={colors.brandGreen} />
              <Text style={styles.notifAlertText}>
                Turning a category off only stops push alerts for it — reminders, badges and due-dates elsewhere stay untouched.
              </Text>
            </View>

            {/* Category Count Heading */}
            <Text style={styles.notifCountHeader}>
              {activeNotifCount} of 5 categories on
            </Text>

            {/* 1. Weather alerts */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.blueTint1 }]}>
                <CloudRainIcon size={22} color={P.twBlue600} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>Weather alerts</Text>
                <Text style={styles.notifSub}>Frost, heavy rain, heat wave warnings</Text>
              </View>
              <CustomToggleSwitch
                value={notifWeather}
                onValueChange={setNotifWeather}
                accessibilityLabel="Weather alerts toggle"
              />
            </View>

            {/* 2. Farm reminders */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.greenTint4 }]}>
                <LeafOutlineIcon size={22} color={colors.brandGreen} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>Farm reminders</Text>
                <Text style={styles.notifSub}>Fertigation, pest checks, vaccinations due</Text>
              </View>
              <CustomToggleSwitch
                value={notifFarm}
                onValueChange={setNotifFarm}
                accessibilityLabel="Farm reminders toggle"
              />
            </View>

            {/* 3. Marketing updates */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.violetTint2 }]}>
                <PriceTagIcon size={22} color={P.twViolet600} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>Marketing updates</Text>
                <Text style={styles.notifSub}>Counter-offers, listing status changes</Text>
              </View>
              <CustomToggleSwitch
                value={notifMarket}
                onValueChange={setNotifMarket}
                accessibilityLabel="Marketing updates toggle"
              />
            </View>

            {/* 4. Payroll & workforce */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.tanTint10 }]}>
                <UsersGroupIcon size={22} color={P.brownDeep2} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>Payroll & workforce</Text>
                <Text style={styles.notifSub}>Attendance reminders, pay-out confirmations</Text>
              </View>
              <CustomToggleSwitch
                value={notifPayroll}
                onValueChange={setNotifPayroll}
                accessibilityLabel="Payroll & workforce toggle"
              />
            </View>

            {/* 5. Community */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.tanTint6 }]}>
                <CommunityChatIcon size={22} color={P.twStone500} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>Community</Text>
                <Text style={styles.notifSub}>Learning Hub group posts and new content</Text>
              </View>
              <CustomToggleSwitch
                value={notifCommunity}
                onValueChange={setNotifCommunity}
                accessibilityLabel="Community toggle"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DATA & STORAGE MODAL ── */}
      <Modal visible={activeModal === 'data'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Data & Offline Cache</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.storageInfoBox}>
              <Text style={styles.storageValue}>24.6 MB</Text>
              <Text style={styles.storageLabel}>Cached Field Maps & Farm Diary Media</Text>
            </View>

            <TouchableOpacity
              style={styles.modalDangerBtn}
              onPress={handleClearCache}
            >
              <Text style={styles.modalDangerBtnText}>Clear Local Cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal visible={activeModal === 'password'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor={P.twGray400}
              value={currentPass}
              onChangeText={setCurrentPass}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder="Enter at least 6 characters"
              placeholderTextColor={P.twGray400}
              value={newPass}
              onChangeText={setNewPass}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor={P.twGray400}
              value={confirmPass}
              onChangeText={setConfirmPass}
            />

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalPrimaryBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE MOBILE MODAL ── */}
      <Modal visible={activeModal === 'mobile'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Mobile Number</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => {
                  setOtpSent(false);
                  setActiveModal(null);
                }}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Mobile Number (+91)</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="e.g. 9842055031"
              placeholderTextColor={P.twGray400}
              value={newMobile}
              onChangeText={setNewMobile}
              editable={!otpSent}
            />

            {otpSent && (
              <>
                <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
                <TextInput
                  style={styles.modalTextInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="Enter OTP code"
                  placeholderTextColor={P.twGray400}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {otpSent ? 'Verify & Update Number' : 'Send Verification OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ABOUT & SUPPORT MODAL ── */}
      <Modal visible={activeModal === 'support'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About & Support</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>App Version</Text>
              <Text style={styles.supportValue}>v0.1.0-alpha (Build 2026.07)</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>Farmer Helpline</Text>
              <Text style={styles.supportValue}>+91 1800-425-TOHFA (Toll Free)</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>WhatsApp Field Desk</Text>
              <Text style={styles.supportValue}>+91 98420 55031</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>Support Email</Text>
              <Text style={styles.supportValue}>farmer.support@tohfa.org</Text>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalPrimaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: P.weatherCloudWhite,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.greyMid1,
    marginTop: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: P.tanTint3,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  // Farmer Profile Banner Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.tanTint2,
    padding: 16,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: P.greenDeep1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: P.weatherCloudWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  profileFarm: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.greyMid1,
  },
  profileMeta: {
    fontSize: 11.5,
    color: P.greyMid2,
    marginTop: 2,
  },
  profileCaption: {
    fontSize: 11.5,
    color: P.greyMid2,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Section Headers
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: P.greyMid1,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 10,
  },

  // Setting Card Item
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.tanTint2,
    padding: 14,
    marginBottom: 10,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: P.greyMid1,
  },

  // Language Segmented Switcher
  langSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: P.tanTint1,
    borderRadius: 16,
    padding: 3,
  },
  langSegment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  langSegmentActive: {
    backgroundColor: P.weatherCloudWhite,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1.5,
  },
  langSegmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.twGray500,
  },
  langSegmentTextActive: {
    color: colors.textDark,
    fontWeight: '800',
  },

  // Right Action Row
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPillGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: P.greenDeep1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: P.weatherCloudWhite,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.tanTint3,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textDark,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifModalCard: {
    backgroundColor: P.weatherCloudWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetDragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: P.twGray300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notifSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.nearBlackDark4,
  },
  notifAlertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.greenTint2,
    borderColor: P.greenTint6,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
  },
  notifAlertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16.5,
    color: P.greenDeep9,
    fontWeight: '500',
  },
  notifCountHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.greenDeep10,
    marginBottom: 12,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notifIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notifTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlackDark2,
  },
  notifSub: {
    fontSize: 12,
    color: P.greyMid4,
    marginTop: 2,
  },
  customToggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  customToggleTrackOn: {
    backgroundColor: colors.brandGreen,
  },
  customToggleTrackOff: {
    backgroundColor: P.twGray300,
  },
  customToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: P.weatherCloudWhite,
    elevation: 2,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  customToggleThumbOn: {
    alignSelf: 'flex-end',
  },
  customToggleThumbOff: {
    alignSelf: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.creamTint3,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  switchSub: {
    fontSize: 12,
    color: P.greyMid1,
    marginTop: 2,
  },
  modalPrimaryBtn: {
    backgroundColor: P.greenDeep1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  modalPrimaryBtnText: {
    color: P.weatherCloudWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  storageInfoBox: {
    backgroundColor: P.twSky50,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: P.twSky200,
  },
  storageValue: {
    fontSize: 24,
    fontWeight: '800',
    color: P.sky600,
    marginBottom: 4,
  },
  storageLabel: {
    fontSize: 12.5,
    color: P.twSky700,
    fontWeight: '500',
  },
  modalDangerBtn: {
    backgroundColor: P.twRed100,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDangerBtnText: {
    color: P.twRed600,
    fontSize: 14,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 10,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: P.tanTint1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textDark,
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.tanTint3,
  },
  supportLabel: {
    fontSize: 13,
    color: P.greyMid1,
    fontWeight: '500',
  },
  supportValue: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: '700',
  },
});
