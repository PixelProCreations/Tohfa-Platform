/**
 * GST Invoice Generation screen for warehouse admins.
 *
 * This screen shows a restriction notice. Although scope and can are accepted
 * for uniformity with other warehouse screens, docs/rbac.json defines
 * 'invoice.gst.generate' with scope 'none' for both MAIN_WH_ADMIN and
 * SUB_WH_ADMIN, meaning no warehouse admin can ever generate a GST invoice in
 * the current design. A real form only exists for SUPER_ADMIN/TOHFA_ADMIN and
 * is not yet designed. No form is rendered here. The server re-checks all
 * permissions (CLAUDE.md 2.1).
 */
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

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ProhibitedCircleIcon({ size = 48, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.1" />
      <Path d="M5.2 5.2l13.6 13.6" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface GSTInvoiceScreenProps extends WarehouseScreenBaseProps {
  /**
   * Hosts pass these intentionally; they are not wired. The server already
   * prevents GST invoice generation for warehouse admins via rbac.json, and no
   * form exists to preview or authorize. They are kept for API uniformity with
   * other warehouse screens.
   */
  onViewExisting?: (() => void) | undefined;
  onPreviewAuthorized?: (() => void) | undefined;
}

export function GSTInvoiceScreen({
  // scope and can are accepted for uniformity; destructure only what we use
  // to keep eslint happy (no unused-var errors).
  onBack,
  onViewExisting, // intentionally unused
  onPreviewAuthorized, // intentionally unused
}: GSTInvoiceScreenProps): React.JSX.Element {
  // Suppress unused warnings; these props exist for API consistency
  void onViewExisting;
  void onPreviewAuthorized;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>GST Invoice</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Restricted Notice Card ─── */}
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
    backgroundColor: adminColors.brand,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    marginRight: adminSpacing.md,
    padding: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xxxl,
  },
  restrictedCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xxxl,
    alignItems: 'center',
    ...adminShadow.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  restrictedTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  restrictedBody: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: adminSpacing.md,
  },
});
