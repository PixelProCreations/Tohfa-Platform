import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P, typography } from '../../theme';
import { ApiError, formatErrorMessage } from '../../../../shell/api/client';
import { t } from '../../../../i18n/farmer';
import {
  getMyUpiPreference,
  setMyUpiPreference,
  type FarmerUpiPreference,
  type SetFarmerUpiInput,
} from '../../api/payoutDestinations';

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12l5 5L20 6"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

export interface UpiIdScreenProps {
  onBack?: () => void;
  onSaveSuccess?: () => void;
}

export function UpiIdScreen({
  onBack,
  onSaveSuccess,
}: UpiIdScreenProps): React.JSX.Element {
  // The saved UPI id comes from GET /farmers/me/upi. A 404 there means none is registered yet,
  // which is a normal empty state, not an error.
  const [saved, setSaved] = useState<FarmerUpiPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [upiId, setUpiId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  // `isDefault` is sent only if the farmer touched the switch: omitting it lets the server make
  // a first-ever payout destination the default and keeps the flag on an existing one (BR-53i).
  const [defaultTouched, setDefaultTouched] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadUpi = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const pref = await getMyUpiPreference();
      setSaved(pref);
      if (pref !== null) {
        setUpiId(pref.upiVpa);
        setIsDefault(pref.isDefault);
      }
    } catch (err) {
      if (err instanceof ApiError && err.problem.status === 404) {
        setSaved(null);
      } else {
        setLoadError(formatErrorMessage(err, t('farmer.payment.loadFailed')));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUpi();
  }, [loadUpi]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const handleSave = async () => {
    if (saving) return;
    setSaveError(null);

    const upiVpa = upiId.trim();
    if (!upiVpa) {
      setSaveError(t('farmer.payment.upi.required'));
      return;
    }

    setSaving(true);
    try {
      const body: SetFarmerUpiInput = {
        upiVpa,
        ...(defaultTouched ? { isDefault } : {}),
      };
      const result = await setMyUpiPreference(body);

      // Success only after a real 2xx.
      setSaved(result);
      setUpiId(result.upiVpa);
      setIsDefault(result.isDefault);
      setDefaultTouched(false);
      Alert.alert(
        'UPI ID Saved',
        'Your UPI ID has been submitted for manual admin verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSaveSuccess) onSaveSuccess();
              else if (onBack) onBack();
            },
          },
        ]
      );
    } catch (err) {
      // Stay on the form with the typed value intact.
      setSaveError(formatErrorMessage(err, t('farmer.payment.upi.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>UPI ID</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingRow} accessibilityLabel={t('farmer.payment.loading')}>
            <ActivityIndicator size="small" color={P.forestGreen} />
          </View>
        ) : null}
        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{loadError}</Text>
            <TouchableOpacity
              onPress={() => void loadUpi()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.payment.retry')}
            >
              <Text style={styles.errorRetryText}>{t('farmer.payment.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {saveError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{saveError}</Text>
          </View>
        ) : null}

        {/* Status Pill: the server's isVerified, never assumed */}
        <View style={styles.statusRow}>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>
              {!saved
                ? t('farmer.payment.status.notAdded')
                : saved.isVerified
                  ? 'Verified'
                  : 'Pending Verification'}
            </Text>
          </View>
        </View>

        {/* Input */}
        <View style={styles.formContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              UPI ID <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={setUpiId}
              editable={!saving}
              placeholder="e.g. yourname@okhdfcbank"
              placeholderTextColor={P.twGray400}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Info note */}
          <View style={styles.infoNote}>
            <View style={styles.infoIconBox}>
              <InfoCircleIcon size={16} color={P.twGray500} />
            </View>
            <Text style={styles.infoText}>
              Entered manually. TOHFA Admin verifies this before it can be used for a payout.
            </Text>
          </View>

          {/* Default Payout Toggle */}
          <View style={styles.toggleCard}>
            <Text style={styles.toggleLabel}>Set as default payout method</Text>
            <Switch
              value={isDefault}
              onValueChange={(value) => {
                setIsDefault(value);
                setDefaultTouched(true);
              }}
              disabled={saving}
              trackColor={{ false: P.twGray300, true: P.forestGreen }}
              thumbColor={P.white}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          disabled={saving}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (saving || loading || !!loadError) && styles.saveBtnBusy]}
          onPress={() => void handleSave()}
          disabled={saving || loading || !!loadError}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Save Changes"
          accessibilityState={{ disabled: saving || loading || !!loadError, busy: saving }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <CheckmarkIcon size={16} color={P.white} />
          )}
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  statusRow: {
    marginBottom: 16,
  },
  pendingPill: {
    alignSelf: 'flex-start',
    backgroundColor: P.twAmber100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twAmber900,
  },
  loadingRow: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorBannerText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  errorRetryText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  requiredStar: {
    color: P.twRed600,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    fontSize: typography.body,
    color: P.twGray900,
    fontWeight: '500',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    paddingRight: 8,
  },
  infoIconBox: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 17,
    color: P.twGray500,
    fontWeight: '400',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.twGray50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    backgroundColor: P.white,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray700,
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnBusy: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
});
