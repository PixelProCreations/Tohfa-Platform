import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { setLocale, t, type Locale } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import { logout } from '../../api/auth';
import { formatErrorMessage } from '../../../../shell/api/client';
import {
  getMyFarmerProfile,
  maskMobile,
  updateMyFarmerProfile,
  type FarmerProfile,
} from '../../api/farmer';
import { getFarms } from '../../api/farms';
import {
  getMyNotificationPreferences,
  updateNotificationPreference,
  type NotificationCategory,
} from '../../api/notificationPreferences';

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

/**
 * Same two-letter initials convention used across the farmer app's other
 * avatar badges (e.g. WorkforceScreen/PayrollScreen's `initialsOf`) -- kept
 * local to this file rather than shared because each of those copies is
 * already an independent, un-deduplicated local helper, not a package export.
 */
function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

function CustomToggleSwitch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
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
  onNavigateToAboutSupport?: (() => void) | undefined;
  onSignOut: () => void;
}

export function SettingsScreen({
  onBack,
  onNavigateToProfile,
  onNavigateToChangePassword,
  onNavigateToAboutSupport,
  onSignOut,
}: SettingsScreenProps): React.JSX.Element {
  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');

  // Real farmer identity for the profile banner card (BR-36: GET /farmers/me),
  // plus the signed-in farmer's primary farm name/location (GET /farms) --
  // same two calls and same "find isPrimary, else first" rule ProfileScreen.tsx
  // uses to derive its own farm name/location display.
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [primaryFarmName, setPrimaryFarmName] = useState('');
  const [primaryFarmLocation, setPrimaryFarmLocation] = useState('');
  const [profileCardLoading, setProfileCardLoading] = useState(true);
  const [profileCardError, setProfileCardError] = useState<string | null>(null);

  const loadProfileCard = useCallback(async () => {
    setProfileCardLoading(true);
    setProfileCardError(null);
    try {
      const [profileRes, farms] = await Promise.all([getMyFarmerProfile(), getFarms()]);
      setFarmerProfile(profileRes);
      setSelectedLocale(profileRes.preferredLocale ?? 'en');
      setLocale(profileRes.preferredLocale ?? 'en');
      const primary = farms.find((f) => f.isPrimary) ?? farms[0] ?? null;
      setPrimaryFarmName(primary?.name ?? '');
      setPrimaryFarmLocation(primary ? (primary.village ? `${primary.village}, ${primary.district}` : primary.district) : '');
    } catch (err) {
      setProfileCardError(formatErrorMessage(err, t('error.generic')));
    } finally {
      setProfileCardLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfileCard();
  }, [loadProfileCard]);

  // Interactive modal states
  const [activeModal, setActiveModal] = useState<
    'notifications' | 'data' | 'password' | 'support' | null
  >(null);

  // Notification category preferences (BR-48: GET/PATCH /notification-preferences).
  // Initial values mirror the server default (no stored row = enabled) until
  // the real values load; the toggles stay disabled while loading.
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifFarm, setNotifFarm] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);
  const [notifPayroll, setNotifPayroll] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(true);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(true);
  const [notifPrefsError, setNotifPrefsError] = useState<string | null>(null);

  const applyNotifPreference = useCallback((category: NotificationCategory, enabled: boolean) => {
    switch (category) {
      case 'WEATHER':
        setNotifWeather(enabled);
        break;
      case 'FARM':
        setNotifFarm(enabled);
        break;
      case 'MARKETING':
        setNotifMarket(enabled);
        break;
      case 'PAYROLL':
        setNotifPayroll(enabled);
        break;
      case 'COMMUNITY':
        setNotifCommunity(enabled);
        break;
    }
  }, []);

  const loadNotifPreferences = useCallback(async () => {
    setNotifPrefsLoading(true);
    setNotifPrefsError(null);
    try {
      const prefs = await getMyNotificationPreferences();
      for (const pref of prefs) applyNotifPreference(pref.category, pref.enabled);
    } catch (err) {
      setNotifPrefsError(formatErrorMessage(err, t('farmer.profile.settings.notifLoadFailed')));
    } finally {
      setNotifPrefsLoading(false);
    }
  }, [applyNotifPreference]);

  // Load once so the landing card's "N of 5" pill is real before the sheet is
  // opened, then refresh every time the sheet opens.
  useEffect(() => {
    void loadNotifPreferences();
  }, [loadNotifPreferences]);

  useEffect(() => {
    if (activeModal === 'notifications') void loadNotifPreferences();
  }, [activeModal, loadNotifPreferences]);

  // Optimistic: flip immediately, persist, and roll back with an alert if the
  // save fails so the switch never shows a state the server does not hold.
  const handleNotifToggle = (category: NotificationCategory, enabled: boolean) => {
    applyNotifPreference(category, enabled);
    updateNotificationPreference(category, enabled)
      .then((saved) => applyNotifPreference(saved.category, saved.enabled))
      .catch((err: unknown) => {
        applyNotifPreference(category, !enabled);
        Alert.alert(
          t('farmer.profile.settings.notifSaveFailedTitle'),
          formatErrorMessage(err, t('error.generic')),
        );
      });
  };

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const activeNotifCount = [
    notifWeather,
    notifFarm,
    notifMarket,
    notifPayroll,
    notifCommunity,
  ].filter(Boolean).length;

  const notProvidedText = t('farmer.profile.personal.notProvided');
  const profileDisplayName = farmerProfile?.fullName || notProvidedText;
  const profileFarmLine =
    primaryFarmName && primaryFarmLocation
      ? `${primaryFarmName} · ${primaryFarmLocation}`
      : primaryFarmName || primaryFarmLocation || notProvidedText;
  const profileMetaLine = `${farmerProfile?.tohfaFarmerId || notProvidedText} · ${maskMobile(farmerProfile?.mobile)}`;

  // Optimistic: flip immediately (instant UI feedback, no separate save step),
  // persist, and roll back with an alert if the save fails -- same shape as
  // handleNotifToggle above, so the toggle never shows a locale the server
  // does not hold.
  const handleSwitchLanguage = (lang: Locale) => {
    const previous = selectedLocale;
    setSelectedLocale(lang);
    setLocale(lang);
    updateMyFarmerProfile({ preferredLocale: lang })
      .then((saved) => {
        setSelectedLocale(saved.preferredLocale ?? lang);
        setLocale(saved.preferredLocale ?? lang);
      })
      .catch((err: unknown) => {
        setSelectedLocale(previous);
        setLocale(previous);
        Alert.alert(
          t('farmer.profile.settings.languageSaveFailedTitle'),
          formatErrorMessage(err, t('error.generic')),
        );
      });
  };

  const handleSignOut = () => {
    Alert.alert(
      t('farmer.common.signOut'),
      t('farmer.profile.settings.signOutConfirmMessage'),
      [
        { text: t('farmer.common.cancel'), style: 'cancel' },
        {
          text: t('farmer.common.signOut'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await logout();
              onSignOut();
            })();
          },
        },
      ],
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('farmer.profile.settings.clearCacheAlertTitle'),
      t('farmer.profile.settings.clearCacheAlertMessage'),
      [{ text: t('farmer.common.ok'), onPress: () => setActiveModal(null) }]
    );
  };

  const handleChangePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert(
        t('farmer.profile.settings.requiredFieldsTitle'),
        t('farmer.profile.settings.requiredFieldsMessage'),
      );
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert(
        t('farmer.profile.settings.passwordMismatchTitle'),
        t('farmer.profile.settings.passwordMismatchMessage'),
      );
      return;
    }
    Alert.alert(
      t('farmer.profile.settings.passwordChangeSuccessTitle'),
      t('farmer.profile.settings.passwordChangeSuccessMessage'),
      [
        {
          text: t('farmer.common.ok'),
          onPress: () => {
            setCurrentPass('');
            setNewPass('');
            setConfirmPass('');
            setActiveModal(null);
          },
        },
      ],
    );
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
          accessibilityLabel={t('farmer.common.back')}
        >
          <ArrowBackIcon size={18} color={P.greenDeep1} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{t('farmer.profile.settings.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.profile.settings.headerSubtitle')}</Text>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Farmer Profile Banner Card ──
            Real identity, farm name/location (from the farmer's primary farm,
            same rule ProfileScreen.tsx uses) and masked mobile from GET
            /farmers/me + GET /farms -- not the one fake identity every
            farmer used to see here regardless of who was signed in. */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.88}
          onPress={onNavigateToProfile}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.profile.settings.viewProfileA11y')}
          disabled={profileCardLoading}
        >
          {profileCardLoading ? (
            <>
              <Skeleton width={46} height={46} borderRadius={23} style={styles.profileSkeletonAvatar} />
              <View style={styles.profileInfo}>
                <Skeleton width="55%" height={16} borderRadius={4} style={styles.profileSkeletonLine} />
                <Skeleton width="75%" height={13} borderRadius={4} style={styles.profileSkeletonLine} />
                <Skeleton width="45%" height={13} borderRadius={4} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initialsOf(profileDisplayName)}</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileDisplayName}</Text>
                <Text style={styles.profileFarm}>{profileFarmLine}</Text>
                <Text style={styles.profileMeta}>{profileMetaLine}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </>
          )}
        </TouchableOpacity>

        {/* Profile Helper Caption / Load Error */}
        {profileCardError ? (
          <TouchableOpacity
            onPress={() => void loadProfileCard()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.retry')}
          >
            <Text style={styles.profileErrorText}>{profileCardError}</Text>
            <Text style={styles.profileRetryText}>{t('farmer.common.retry')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.profileCaption}>
            {t('farmer.profile.settings.viewProfileCaption')}
          </Text>
        )}

        {/* ── SECTION 1: PREFERENCES ── */}
        <Text style={styles.sectionHeaderTitle}>{t('farmer.profile.settings.sectionPreferences')}</Text>

        {/* Language Card */}
        <View style={styles.settingCard}>
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <TranslateIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{t('farmer.profile.settings.language')}</Text>
            <Text style={styles.settingSubtitle}>{t('farmer.profile.settings.languageHint')}</Text>
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
                {t('farmer.profile.settings.langTa')}
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
                {t('farmer.profile.settings.langEn')}
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
          accessibilityLabel={t('farmer.profile.settings.notificationsA11y')}
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <BellIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{t('farmer.profile.settings.notifications')}</Text>
            <Text style={styles.settingSubtitle}>
              {t('farmer.profile.settings.notificationsSummary')}
            </Text>
          </View>

          <View style={styles.rightActionRow}>
            <Text style={styles.statusPillGreen}>
              {t('farmer.profile.settings.notificationsOf5', { count: activeNotifCount })}
            </Text>
            <ChevronRightIcon size={18} color={P.twGray400} />
          </View>
        </TouchableOpacity>

        {/* Data & Storage Card */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('data')}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.profile.settings.dataStorageA11y')}
        >
          <View style={[styles.iconBox, { backgroundColor: P.sky100 }]}>
            <DataStorageIcon size={22} color={P.sky600} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{t('farmer.profile.settings.dataStorage')}</Text>
            <Text style={styles.settingSubtitle}>
              {t('farmer.profile.settings.dataStorageSummary')}
            </Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── SECTION 2: SECURITY ── */}
        <Text style={styles.sectionHeaderTitle}>{t('farmer.profile.settings.sectionSecurity')}</Text>

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
          accessibilityLabel={t('farmer.profile.settings.changePasswordA11y')}
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <LockPasswordIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{t('farmer.profile.settings.changePassword')}</Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── SECTION 3: SUPPORT ── */}
        <Text style={styles.sectionHeaderTitle}>{t('farmer.profile.settings.sectionSupport')}</Text>

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
          accessibilityLabel={t('farmer.profile.settings.aboutSupportA11y')}
        >
          <View style={[styles.iconBox, { backgroundColor: P.lightGreen }]}>
            <HelpSupportIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{t('farmer.profile.settings.aboutSupport')}</Text>
            <Text style={styles.settingSubtitle}>
              {t('farmer.profile.settings.aboutSupportSummary')}
            </Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── SECTION 4: ACCOUNT ── */}
        <Text style={styles.sectionHeaderTitle}>{t('farmer.profile.settings.sectionAccount')}</Text>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.signOut')}
        >
          <View style={[styles.iconBox, { backgroundColor: P.twRed100 }]}>
            <SignOutIcon size={22} color={P.twRed600} />
          </View>

          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: P.twRed600 }]}>{t('farmer.common.signOut')}</Text>
            <Text style={styles.settingSubtitle}>{t('farmer.profile.settings.signOutSubtitle')}</Text>
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
              <Text style={styles.notifSheetTitle}>{t('farmer.profile.settings.notifications')}</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.profile.settings.closeNotificationsA11y')}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Disclaimer Info Banner */}
            <View style={styles.notifAlertCard}>
              <InfoCircleIcon size={18} color={colors.brandGreen} />
              <Text style={styles.notifAlertText}>
                {t('farmer.profile.settings.notifDisclaimer')}
              </Text>
            </View>

            {/* Load Error */}
            {notifPrefsError ? (
              <TouchableOpacity
                onPress={() => void loadNotifPreferences()}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.common.retry')}
              >
                <Text style={styles.profileErrorText}>{notifPrefsError}</Text>
                <Text style={styles.profileRetryText}>{t('farmer.common.retry')}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Category Count Heading */}
            {notifPrefsLoading ? (
              <Skeleton width="45%" height={14} borderRadius={4} style={styles.profileSkeletonLine} />
            ) : (
              <Text style={styles.notifCountHeader}>
                {t('farmer.profile.settings.notificationsCountOn', { count: activeNotifCount })}
              </Text>
            )}

            {/* 1. Weather alerts */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.blueTint1 }]}>
                <CloudRainIcon size={22} color={P.twBlue600} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>{t('farmer.profile.settings.notifWeatherTitle')}</Text>
                <Text style={styles.notifSub}>{t('farmer.profile.settings.notifWeatherSub')}</Text>
              </View>
              <CustomToggleSwitch
                value={notifWeather}
                onValueChange={(next) => handleNotifToggle('WEATHER', next)}
                disabled={notifPrefsLoading}
                accessibilityLabel={t('farmer.profile.settings.notifWeatherToggleA11y')}
              />
            </View>

            {/* 2. Farm reminders */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.greenTint4 }]}>
                <LeafOutlineIcon size={22} color={colors.brandGreen} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>{t('farmer.profile.settings.notifFarmTitle')}</Text>
                <Text style={styles.notifSub}>{t('farmer.profile.settings.notifFarmSub')}</Text>
              </View>
              <CustomToggleSwitch
                value={notifFarm}
                onValueChange={(next) => handleNotifToggle('FARM', next)}
                disabled={notifPrefsLoading}
                accessibilityLabel={t('farmer.profile.settings.notifFarmToggleA11y')}
              />
            </View>

            {/* 3. Marketing updates */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.violetTint2 }]}>
                <PriceTagIcon size={22} color={P.twViolet600} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>{t('farmer.profile.settings.notifMarketTitle')}</Text>
                <Text style={styles.notifSub}>{t('farmer.profile.settings.notifMarketSub')}</Text>
              </View>
              <CustomToggleSwitch
                value={notifMarket}
                onValueChange={(next) => handleNotifToggle('MARKETING', next)}
                disabled={notifPrefsLoading}
                accessibilityLabel={t('farmer.profile.settings.notifMarketToggleA11y')}
              />
            </View>

            {/* 4. Payroll & workforce */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.tanTint10 }]}>
                <UsersGroupIcon size={22} color={P.brownDeep2} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>{t('farmer.profile.settings.notifPayrollTitle')}</Text>
                <Text style={styles.notifSub}>{t('farmer.profile.settings.notifPayrollSub')}</Text>
              </View>
              <CustomToggleSwitch
                value={notifPayroll}
                onValueChange={(next) => handleNotifToggle('PAYROLL', next)}
                disabled={notifPrefsLoading}
                accessibilityLabel={t('farmer.profile.settings.notifPayrollToggleA11y')}
              />
            </View>

            {/* 5. Community */}
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBox, { backgroundColor: P.tanTint6 }]}>
                <CommunityChatIcon size={22} color={P.twStone500} />
              </View>
              <View style={styles.notifTextCol}>
                <Text style={styles.notifTitle}>{t('farmer.profile.settings.notifCommunityTitle')}</Text>
                <Text style={styles.notifSub}>{t('farmer.profile.settings.notifCommunitySub')}</Text>
              </View>
              <CustomToggleSwitch
                value={notifCommunity}
                onValueChange={(next) => handleNotifToggle('COMMUNITY', next)}
                disabled={notifPrefsLoading}
                accessibilityLabel={t('farmer.profile.settings.notifCommunityToggleA11y')}
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
              <Text style={styles.modalTitle}>{t('farmer.profile.settings.dataModalTitle')}</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.storageInfoBox}>
              <Text style={styles.storageValue}>24.6 MB</Text>
              <Text style={styles.storageLabel}>{t('farmer.profile.settings.cachedMediaLabel')}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalDangerBtn}
              onPress={handleClearCache}
            >
              <Text style={styles.modalDangerBtnText}>{t('farmer.profile.settings.clearCacheButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal visible={activeModal === 'password'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.settings.changePassword')}</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('farmer.profile.settings.currentPasswordLabel')}</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder={t('farmer.profile.settings.currentPasswordPlaceholder')}
              placeholderTextColor={P.twGray400}
              value={currentPass}
              onChangeText={setCurrentPass}
            />

            <Text style={styles.inputLabel}>{t('farmer.profile.settings.newPasswordLabel')}</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder={t('farmer.profile.settings.newPasswordPlaceholder')}
              placeholderTextColor={P.twGray400}
              value={newPass}
              onChangeText={setNewPass}
            />

            <Text style={styles.inputLabel}>{t('farmer.profile.settings.confirmNewPasswordLabel')}</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder={t('farmer.profile.settings.confirmNewPasswordPlaceholder')}
              placeholderTextColor={P.twGray400}
              value={confirmPass}
              onChangeText={setConfirmPass}
            />

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalPrimaryBtnText}>{t('farmer.profile.settings.updatePasswordButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ABOUT & SUPPORT MODAL ── */}
      <Modal visible={activeModal === 'support'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.settings.aboutSupport')}</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color={P.twGray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>{t('farmer.profile.settings.appVersion')}</Text>
              <Text style={styles.supportValue}>v0.1.0-alpha (Build 2026.07)</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>{t('farmer.profile.settings.farmerHelplineLabel')}</Text>
              <Text style={styles.supportValue}>+91 1800-425-TOHFA (Toll Free)</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>{t('farmer.profile.settings.whatsappFieldDeskLabel')}</Text>
              <Text style={styles.supportValue}>+91 98420 55031</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>{t('farmer.profile.settings.supportEmailLabel')}</Text>
              <Text style={styles.supportValue}>farmer.support@tohfa.org</Text>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalPrimaryBtnText}>{t('farmer.common.close')}</Text>
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
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.bodyLarge,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  profileFarm: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.greyMid1,
  },
  profileMeta: {
    fontSize: typography.bodySmall,
    color: P.greyMid2,
    marginTop: 2,
  },
  profileCaption: {
    fontSize: typography.bodySmall,
    color: P.greyMid2,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileSkeletonAvatar: {
    marginRight: 14,
  },
  profileSkeletonLine: {
    marginBottom: 6,
  },
  profileErrorText: {
    fontSize: typography.bodySmall,
    color: P.twRed600,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  profileRetryText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.greenDeep1,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Section Headers
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.bodySmall,
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
    fontSize: typography.bodySmall,
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
    fontSize: typography.bodyLarge,
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
    fontSize: typography.title,
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
    fontSize: typography.bodySmall,
    lineHeight: 16.5,
    color: P.greenDeep9,
    fontWeight: '500',
  },
  notifCountHeader: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlackDark2,
  },
  notifSub: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textDark,
  },
  switchSub: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.body,
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
    fontSize: typography.headline,
    fontWeight: '800',
    color: P.sky600,
    marginBottom: 4,
  },
  storageLabel: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.body,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: typography.bodySmall,
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
    fontSize: typography.body,
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
    fontSize: typography.body,
    color: P.greyMid1,
    fontWeight: '500',
  },
  supportValue: {
    fontSize: typography.body,
    color: colors.textDark,
    fontWeight: '700',
  },
});
