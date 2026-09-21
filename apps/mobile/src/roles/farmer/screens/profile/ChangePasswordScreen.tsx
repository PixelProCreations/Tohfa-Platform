import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.greenDeep1 }: { size?: number; color?: string }) {
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

function EyeIcon({ size = 20, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function EyeOffIcon({ size = 20, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M1 1l22 22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 15, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Types & Props ────────────────────────────────────────────────────────────

interface ChangePasswordScreenProps {
  onBack: () => void;
  onSuccess?: (() => void) | undefined;
}

export function ChangePasswordScreen({ onBack, onSuccess }: ChangePasswordScreenProps): React.JSX.Element {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAtLeast8 = newPassword.length >= 8;

  const handleSaveChanges = () => {
    if (!currentPassword) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New password and confirm password do not match.');
      return;
    }

    Alert.alert('Success', 'Your password has been changed successfully.', [
      {
        text: 'OK',
        onPress: () => {
          if (onSuccess) {
            onSuccess();
          } else {
            onBack();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.weatherCloudWhite} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.greenDeep1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Password change</Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Subtitle / Explanatory Note ── */}
          <Text style={styles.subText}>
            Your current password confirms it's really you — required even for a full session.
          </Text>

          {/* ── Field 1: Current password ── */}
          <Text style={styles.fieldLabel}>Current password</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={P.twGray400}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowCurrent(!showCurrent)}
              activeOpacity={0.7}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeIcon size={20} color={P.twGray400} /> : <EyeOffIcon size={20} color={P.twGray400} />}
            </TouchableOpacity>
          </View>

          {/* ── Field 2: New password ── */}
          <Text style={styles.fieldLabel}>New password</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter at least 8 characters"
              placeholderTextColor={P.twGray400}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNew(!showNew)}
              activeOpacity={0.7}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeIcon size={20} color={P.twGray400} /> : <EyeOffIcon size={20} color={P.twGray400} />}
            </TouchableOpacity>
          </View>

          {/* Requirement indicator */}
          <View style={styles.requirementRow}>
            <CheckCircleIcon size={16} color={isAtLeast8 ? colors.brandGreen : P.twGray400} />
            <Text
              style={[
                styles.requirementText,
                isAtLeast8 ? styles.requirementTextActive : styles.requirementTextInactive,
              ]}
            >
              At least 8 characters
            </Text>
          </View>

          {/* ── Field 3: Confirm new password ── */}
          <Text style={styles.fieldLabel}>Confirm new password</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={P.twGray400}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              activeOpacity={0.7}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeIcon size={20} color={P.twGray400} /> : <EyeOffIcon size={20} color={P.twGray400} />}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Bottom Save Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveChanges}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={styles.saveBtnText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: P.weatherCloudWhite,
    borderBottomWidth: 1,
    borderBottomColor: P.tanTint1,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: P.nearBlackDark2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  subText: {
    fontSize: 13,
    lineHeight: 18.5,
    color: P.greyMid1,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
    marginTop: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  requirementTextActive: {
    color: colors.brandGreen,
  },
  requirementTextInactive: {
    color: P.twGray400,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 20,
    backgroundColor: P.weatherCloudWhite,
    borderTopWidth: 1,
    borderTopColor: P.tanTint1,
  },
  saveBtn: {
    backgroundColor: P.greenDeep2,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: P.weatherCloudWhite,
  },
});
