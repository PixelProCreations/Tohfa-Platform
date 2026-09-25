import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';
import { formatErrorMessage } from '../../../../shell/api/client';
import {
  getMyFarmerProfile,
  updateMyFarmerProfile,
  maskAadhaar,
  maskMobile,
  type FarmerProfile,
} from '../../api/farmer';

// ──────────────────────────────────────────────────────────────────────────
// SVG Icons
// ──────────────────────────────────────────────────────────────────────────

function ChevronLeft({ size = 20, color = P.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ size = 18, color = P.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UserIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PhoneIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-1.09a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68a2 2 0 0 1 1.72 2.03z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhonePlusIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-1.09a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68a2 2 0 0 1 1.72 2.03z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="19" y1="1" x2="19" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MailIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M2 8l10 7 10-7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21c3-.25 9-2 12-7 2.5-4 1-10 0-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.82 19.34C8 18 15 16 22 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

/**
 * Only the fields `FarmerProfileUpdate` (docs/openapi.yaml) actually accepts.
 * `aadhaar`/`mobile` are deliberately absent -- BR-33 locks them server-side,
 * and the server itself never accepts them in a PATCH body. `altMobile`,
 * `email` and `farmingType` are ALSO absent: `FarmerProfile` has no such
 * fields at all (checked against docs/openapi.yaml's `FarmerProfile` /
 * `FarmerProfileUpdate` schemas, not just this app's copy of the type) --
 * there is nowhere on the server for an edit to those three to go. That is a
 * specification gap (root CLAUDE.md §1), not a client bug, so those three
 * rows below are rendered read-only instead of wired to fake state.
 */
interface PersonalData {
  fullName: string;
  /** Display format `DD Mon YYYY`, matching `farmer.profile.dobPlaceholder`. */
  dob: string;
  gender: string;
  address: string;
  /** Digits only, e.g. "14" -- maps to `FarmerProfile.farmingExperienceYears`. */
  yearsInOrganic: string;
}

export interface PersonalDetailsScreenProps {
  onBack: () => void;
  /**
   * Historically this screen seeded every field from this prop, and the prop
   * was never actually passed by any call site -- that mismatch is what let
   * this screen ship showing hardcoded demo data instead of the signed-in
   * farmer's own. The screen now always fetches its own copy of the profile
   * via `getMyFarmerProfile()` on mount and does not read from this prop.
   * Kept in the signature only so an existing call site's prop, if any,
   * still type-checks.
   */
  initialData?: Partial<PersonalData> | undefined;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * `FarmerProfile.dob` (docs/openapi.yaml) is an ISO `YYYY-MM-DD` date. Built
 * from the string's parts, not `Date`, so a farmer's date of birth never
 * shifts by a day across timezones the way `new Date(iso)` combined with
 * locale formatting can.
 */
function formatDobDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return iso;
  return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
}

/**
 * Inverse of `formatDobDisplay`. DOB feeds the same KYC record Aadhaar does
 * (root CLAUDE.md §2.5 / BR-33 neighbourhood), so a typed value this can't
 * losslessly round-trip back to `YYYY-MM-DD` is treated as invalid and
 * blocks the save with a message, rather than being guessed at or dropped
 * silently.
 */
function parseDobInput(text: string): string | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [, dStr, moStr, yStr] = m;
  if (!dStr || !moStr || !yStr) return null;
  const monthIdx = MONTHS.findIndex((mo) => mo.toLowerCase() === moStr.toLowerCase());
  if (monthIdx < 0) return null;
  const day = Number(dStr);
  if (day < 1 || day > 31) return null;
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yStr}-${mm}-${dd}`;
}

/** `FarmerProfile.gender` display, title-cased for the same free-text field
 * the farmer edits (`normalizeGenderInput` below is the inverse). */
function genderToDisplay(gender: FarmerProfile['gender']): string {
  if (gender === 'MALE') return 'Male';
  if (gender === 'FEMALE') return 'Female';
  if (gender === 'OTHER') return 'Other';
  return '';
}

/**
 * `FarmerProfileUpdate.gender` only accepts the exact enum `MALE`/`FEMALE`/
 * `OTHER` (docs/openapi.yaml). Rather than guess at anything that doesn't
 * match one of those three (or their single-letter shorthand), this returns
 * `null` and the caller blocks the save -- silently mapping an unrecognised
 * typo to `OTHER` would misrecord the farmer's own answer.
 */
function normalizeGenderInput(raw: string): 'MALE' | 'FEMALE' | 'OTHER' | null {
  const v = raw.trim().toUpperCase();
  if (v === 'MALE' || v === 'M') return 'MALE';
  if (v === 'FEMALE' || v === 'F') return 'FEMALE';
  if (v === 'OTHER' || v === 'O') return 'OTHER';
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────────────────────────────

export function PersonalDetailsScreen({
  onBack,
}: PersonalDetailsScreenProps): React.JSX.Element {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<PersonalData>({
    fullName: '',
    dob: '',
    gender: '',
    address: '',
    yearsInOrganic: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getMyFarmerProfile();
      setProfile(res);
    } catch (err) {
      setLoadError(formatErrorMessage(err, t('error.generic')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const data: PersonalData = {
    fullName: profile?.fullName ?? '',
    dob: formatDobDisplay(profile?.dob),
    gender: genderToDisplay(profile?.gender),
    address: profile?.address ?? '',
    yearsInOrganic:
      profile?.farmingExperienceYears != null
        ? `${profile.farmingExperienceYears} ${profile.farmingExperienceYears === 1 ? 'year' : 'years'}`
        : '',
  };

  const aadhaarDisplay = maskAadhaar(profile?.aadhaarLast4);
  const mobileDisplay = maskMobile(profile?.mobile);
  const notProvidedText = t('farmer.profile.personal.notProvided');

  const startEdit = () => {
    if (!profile) return;
    setDraft({
      fullName: profile.fullName ?? '',
      dob: formatDobDisplay(profile.dob),
      gender: genderToDisplay(profile.gender),
      address: profile.address ?? '',
      yearsInOrganic: profile.farmingExperienceYears != null ? String(profile.farmingExperienceYears) : '',
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const invalidField = (labelKey: Parameters<typeof t>[0]) => {
    Alert.alert(t(labelKey), t('farmer.profile.personal.invalidFormat'));
  };

  const saveEdit = async () => {
    const fullName = draft.fullName.trim();
    if (fullName.length < 2) {
      invalidField('farmer.profile.fullName');
      return;
    }

    let dob: string | undefined;
    if (draft.dob.trim()) {
      const parsed = parseDobInput(draft.dob);
      if (!parsed) {
        invalidField('farmer.profile.dob');
        return;
      }
      dob = parsed;
    }

    let gender: 'MALE' | 'FEMALE' | 'OTHER' | undefined;
    if (draft.gender.trim()) {
      const normalized = normalizeGenderInput(draft.gender);
      if (!normalized) {
        invalidField('farmer.profile.personal.genderLabel');
        return;
      }
      gender = normalized;
    }

    let farmingExperienceYears: number | undefined;
    if (draft.yearsInOrganic.trim()) {
      const n = Number(draft.yearsInOrganic.trim());
      if (!Number.isInteger(n) || n < 0 || n > 90) {
        invalidField('farmer.profile.yearsInOrganicLabel');
        return;
      }
      farmingExperienceYears = n;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateMyFarmerProfile({
        fullName,
        address: draft.address.trim(),
        ...(dob !== undefined ? { dob } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(farmingExperienceYears !== undefined ? { farmingExperienceYears } : {}),
      });
      // Reflect what the server actually stored, not the local draft --
      // matches the pattern in ZonesScreen/FieldContextScreen's save handlers.
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(formatErrorMessage(err, t('error.generic')));
    } finally {
      setSaving(false);
    }
  };

  // ── Field helpers ──
  const field = (
    key: keyof PersonalData,
    placeholder: string,
    opts?: { keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; maxLength?: number },
  ) =>
    isEditing ? (
      <TextInput
        style={[styles.editInput, opts?.multiline && { minHeight: 52 }]}
        value={draft[key]}
        onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
        placeholder={placeholder}
        keyboardType={opts?.keyboardType ?? 'default'}
        autoCapitalize={opts?.autoCapitalize ?? 'sentences'}
        multiline={opts?.multiline}
        textAlignVertical={opts?.multiline ? 'top' : 'center'}
        maxLength={opts?.maxLength}
      />
    ) : (
      <Text style={styles.detailValue}>{data[key] || notProvidedText}</Text>
    );

  const editBtnDisabled = saving || loading || !!loadError || !profile;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('farmer.profile.personal.a11yBack')} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('farmer.profile.personal.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.profile.personal.subtitle')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.editBtn, editBtnDisabled && !isEditing ? styles.editBtnDisabled : null]}
          onPress={isEditing ? () => void saveEdit() : startEdit}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? t('farmer.common.save') : t('farmer.common.edit')}
          activeOpacity={0.7}
          disabled={editBtnDisabled}
        >
          {isEditing ? (
            saving ? (
              <ActivityIndicator size="small" color={P.primary} />
            ) : (
              <Text style={styles.editBtnSaveText}>{t('farmer.common.save')}</Text>
            )
          ) : (
            <PencilIcon />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={P.primary} />
          <Text style={styles.loadingText}>{t('farmer.common.loading')}</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerFill}>
          <Text style={styles.loadErrorText}>{loadError}</Text>
          <TouchableOpacity onPress={() => void loadProfile()} activeOpacity={0.7} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t('farmer.common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Profile Hero ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports -- RN's bundler special-cases require() for static image assets; there is no ESM equivalent. */}
            <Image source={require('../../assets/farmer-kumar.jpg')} style={styles.avatar} resizeMode="cover" />
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8} accessibilityLabel={t('farmer.profile.a11y.editPhoto')}>
              <CameraIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{data.fullName || notProvidedText}</Text>
          {data.address ? (
            <Text style={styles.heroSub}>{t('farmer.profile.personal.heroRole', { location: data.address })}</Text>
          ) : null}
        </View>

        {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

        {/* ── IDENTITY ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('farmer.profile.personal.sectionIdentity')}</Text>

          {/* Full Name */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><UserIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.fullName')}</Text>
              {field('fullName', t('farmer.profile.fullName'), { autoCapitalize: 'words', maxLength: 120 })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* DOB + Gender (side by side) */}
          <View style={styles.detailRowSplit}>
            <View style={[styles.splitCell, { borderRightWidth: 1, borderRightColor: P.twGray100 }]}>
              <View style={styles.detailIcon}><CalendarIcon /></View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('farmer.profile.dob')}</Text>
                {field('dob', t('farmer.profile.dobPlaceholder'))}
              </View>
            </View>
            <View style={styles.splitCell}>
              <View style={[styles.detailIcon, { marginLeft: 12 }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="8" cy="7" r="3.5" stroke={P.twGray400} strokeWidth="2" />
                  <Path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="17" cy="7" r="3.5" stroke={P.twGray400} strokeWidth="2" />
                  <Path d="M13 20c0-3.3 2.7-6 4-6" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('farmer.profile.personal.genderLabel')}</Text>
                {field('gender', t('farmer.profile.personal.genderPlaceholder'))}
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Aadhaar – locked server-side (BR-33) */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><CardIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.aadhaar')}</Text>
              <Text style={styles.detailValue}>{aadhaarDisplay}</Text>
            </View>
            <View style={styles.lockedBadge}>
              <Icon name="lock" size={11} color={P.twGray500} style={styles.lockedBadgeIcon} />
              <Text style={styles.lockedBadgeText}>{t('farmer.profile.personal.locked')}</Text>
            </View>
          </View>
        </View>

        {/* ── CONTACT ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('farmer.profile.personal.sectionContact')}</Text>

          {/* Mobile – locked server-side (BR-33), not editable */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><PhoneIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.mobileNumber')}</Text>
              <Text style={styles.detailValue}>{mobileDisplay}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ {t('farmer.profile.personal.verified')}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Alternate Mobile — no `FarmerProfile` field exists for this at all
              (docs/openapi.yaml); spec gap, not a locked field, so it is shown
              but never editable. See the PersonalData docblock above. */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><PhonePlusIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.altMobile')}</Text>
              <Text style={styles.detailValue}>{notProvidedText}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Email — same spec gap as Alternate Mobile above. */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><MailIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.email')}</Text>
              <Text style={styles.detailValue}>{notProvidedText}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Address */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><HomeIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.addressLabel')}</Text>
              {field('address', t('farmer.profile.farmLocationPlaceholder'), { multiline: true, maxLength: 300 })}
            </View>
          </View>
        </View>

        {/* ── FARMING BACKGROUND ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('farmer.profile.personal.sectionFarmingBackground')}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><TrendingUpIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.yearsInOrganicLabel')}</Text>
              {field('yearsInOrganic', t('farmer.profile.personal.yearsInOrganicPlaceholder'), { keyboardType: 'numeric' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Type of Farming — same spec gap as Alternate Mobile/Email above:
              collected once at registration (docs/openapi.yaml step2 `farm.typeOfFarming`)
              but not persisted to any field `FarmerProfile` returns, so there is
              nothing to fetch or save here post-registration. */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><LeafIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.typeOfFarming')}</Text>
              <Text style={styles.detailValue}>{notProvidedText}</Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <Pressable style={styles.cancelBtn} onPress={cancelEdit} disabled={saving}>
            <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.paleStoneBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, paddingLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: P.ink, lineHeight: 22 },
  headerSubtitle: { fontSize: 12, color: P.twGray500, marginTop: 1 },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: P.twEmerald100,
    backgroundColor: P.twGreen50,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnDisabled: { opacity: 0.5 },
  editBtnSaveText: { fontSize: 13, fontWeight: '700', color: P.primary },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 13, color: P.twGray500 },
  loadErrorText: { fontSize: 14, color: P.red600, textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: P.twGreen50, borderWidth: 1, borderColor: P.twEmerald100,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: P.primary },
  saveErrorText: {
    fontSize: 13, color: P.red600, fontWeight: '600',
    marginHorizontal: 16, marginTop: 12,
  },

  scrollContent: { paddingBottom: 32 },

  profileHero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: P.white,
  },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: P.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: P.white,
  },
  heroName: { fontSize: 22, fontWeight: '700', color: P.twGray900 },
  heroSub: { fontSize: 13, color: P.twGray500, marginTop: 2 },

  sectionCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    marginHorizontal: 16, marginTop: 16,
    paddingBottom: 4,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: P.stoneMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },

  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  detailRowLast: { paddingBottom: 14 },
  detailRowSplit: { flexDirection: 'row', paddingVertical: 4, alignItems: 'center' },
  splitCell: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  detailIcon: { marginRight: 12, width: 20, alignItems: 'center', justifyContent: 'center' },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: P.twGray400, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: P.twGray900, lineHeight: 21 },
  rowDivider: { height: 1, backgroundColor: P.twGray100, marginHorizontal: 16 },

  editInput: {
    fontSize: 15, fontWeight: '600', color: P.twGray900,
    borderBottomWidth: 1.5, borderBottomColor: P.twGreen500,
    paddingVertical: 2, paddingHorizontal: 0,
    textAlignVertical: 'top',
  },

  lockedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.twGray100, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    gap: 4, marginLeft: 8,
  },
  lockedBadgeIcon: { fontSize: 11 },
  lockedBadgeText: { fontSize: 11, fontWeight: '600', color: P.twGray500 },

  verifiedBadge: {
    backgroundColor: P.twGreen100, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    marginLeft: 8,
  },
  verifiedBadgeText: { fontSize: 12, fontWeight: '700', color: P.twGreen600 },

  cancelBtn: {
    marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: P.twGray200,
    alignItems: 'center', backgroundColor: P.white,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: P.twGray500 },
});
