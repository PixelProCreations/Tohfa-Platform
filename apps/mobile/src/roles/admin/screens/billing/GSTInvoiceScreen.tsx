import React from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Brand warm orange
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#666666',
  border: '#EEDCD3',
  orangeDeep: '#7A2E14',
  orangeBorder: '#F0562A',
  redProhibited: '#E24B4A',
  redBoxBg: '#FEF4F4', // Soft blush background matching left design
  redBoxBorder: '#FDE8E6',
  noteCardBg: '#FDF4ED', // Warm peach tint matching left design
  noteCardBorder: '#F6DFD1',
  noteText: '#85361A', // Rich warm brown matching left design
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProhibitedCircleIcon({ size = 36, color = PALETTE.redProhibited }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.1" />
      <Path d="M5.2 5.2l13.6 13.6" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    </Svg>
  );
}

export interface GSTInvoiceScreenProps {
  onBack?: () => void;
  onViewExisting?: () => void;
  onPreviewAuthorized?: () => void;
}

export function GSTInvoiceScreen({
  onBack,
  onViewExisting,
  onPreviewAuthorized,
}: GSTInvoiceScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>GST Invoice</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Restricted Notice Card */}
        <View style={styles.restrictedCard}>
          <View style={styles.iconWrap}>
            <ProhibitedCircleIcon size={36} />
          </View>
          <Text style={styles.restrictedTitle}>GST Invoice Generation Restricted</Text>
          <Text style={styles.restrictedBody}>
            GST invoice generation for B2B / HORECA transactions is restricted for your role.{'\n'}
            Please contact an authorized admin.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  restrictedCard: {
    backgroundColor: PALETTE.redBoxBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.redBoxBorder,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    marginBottom: 12,
  },
  restrictedTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.redProhibited,
    textAlign: 'center',
    marginBottom: 8,
  },
  restrictedBody: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  noteCard: {
    backgroundColor: PALETTE.noteCardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.noteCardBorder,
    padding: 14,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.noteText,
    lineHeight: 16.5,
  },
  actionBtnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.orangeBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    textAlign: 'center',
  },
  actionBtnTextSecondary: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    textAlign: 'center',
  },
});
