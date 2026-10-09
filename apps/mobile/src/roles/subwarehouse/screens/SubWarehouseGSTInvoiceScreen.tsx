import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Warm Cream Canvas) ─────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  border:        '#E7E2D6',
  redProhibited: '#E24B4A',
  redCircleBg:   '#FEF2F2',
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────

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

function ProhibitedCircleIcon({ size = 48, color = PALETTE.redProhibited }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.1" />
      <Path d="M5.2 5.2l13.6 13.6" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseGSTInvoiceScreenProps {
  onBack?: (() => void) | undefined;
  onViewExisting?: (() => void) | undefined;
  onPreviewAuthorized?: (() => void) | undefined;
}

export function SubWarehouseGSTInvoiceScreen({
  onBack,
}: SubWarehouseGSTInvoiceScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <Text style={styles.headerTitle}>GST Invoice</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Restricted Notice Card (M9-S05) ─── */}
        <View style={styles.restrictedCard}>
          <View style={styles.iconWrap}>
            <ProhibitedCircleIcon size={48} />
          </View>
          <Text style={styles.restrictedTitle}>GST Invoice Generation Restricted</Text>
          <Text style={styles.restrictedBody}>
            GST invoice generation for B2B / HORECA transactions is restricted for your role.{'\n'}
            Please contact an authorized admin.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    paddingRight: 6,
    paddingVertical: 4,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  restrictedCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 20,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.redCircleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  restrictedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  restrictedBody: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
});
