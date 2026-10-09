/**
 * Building blocks shared by the warehouse account screens (design module M16,
 * part A): Settings hub, profile, notification settings, security, session &
 * security, help & support and about.
 *
 * The frame (orange header, cards, field grid, badges, buttons) is the wallet
 * area's WalletParts, already on the admin theme. This file adds what the
 * account screens share: the rbac codes they check, the menu row the hub and
 * Security screens list, the confirmation dialog (logout, save profile, end
 * session), the signed-out state and the icons.
 *
 * `can` only decides what is worth rendering; the server re-checks every code
 * (CLAUDE.md 2.1).
 */
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { WalletButton } from '../wallet-cashtopup/WalletParts';

/** docs/rbac.json codes the account screens check (each one exists there). */
export const PROFILE_CODES = {
  /** Own profile (GET /auth/me). `all` for both warehouse roles: viewable with login. */
  principalView: 'auth.principal.view_own',
  /** Change own password. `all` for every role: the change-password state is never hidden. */
  passwordChange: 'auth.password.change_own',
  /** Log out own session. `all` for every role. */
  sessionRevoke: 'auth.session.revoke_own',
  /** Ending OTHER sessions is SUPER_ADMIN only: never offered on these screens. */
  sessionTerminateOther: 'auth.session.terminate_other',
  /** Own notifications and their preferences. `all` for both warehouse roles. */
  notificationView: 'notification.own.view',
  /** Raise a support ticket. `none` for MAIN_WH_ADMIN and SUB_WH_ADMIN today. */
  ticketCreate: 'support.ticket.create_own',
  /** Support ticket list. `view` for both warehouse roles. */
  ticketViewAll: 'support.ticket.view_all',
} as const;

/**
 * Minimum new-password length. The Sub inline form accepted 6 characters, but
 * the HTTP contract for every password the server sets is 10 to 128
 * (docs/openapi.yaml: RegisterRequest.password and /auth/reset-password
 * newPassword, minLength 10). There is no change-password endpoint yet
 * (SPEC_GAPS W4l-1); when one is added it should carry the same bound.
 */
export const PASSWORD_MIN_LENGTH = 10;

// ─── Icons ───────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

export function UserIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function KeyIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="4" stroke={color} strokeWidth="2" />
      <Circle cx="7" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="17" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

export function DeviceIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="13" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M5 18h7M8.5 14v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="15" y="8" width="7" height="11" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function HelpCircleIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AboutIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 20, color = adminColors.danger.text }: IconProps) {
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

export function ChevronRightIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BlockIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SaveIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LeafIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 3.5c0 0-1 9-8 15 -2.5 2-6 3.5-10 3.5 0 0 1-9 8-15 2.5-2 6-3.5 10-3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2.5 22c4.5-3.5 9-8 11.5-12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Menu rows ───────────────────────────────────────────────────────────────

/** White card holding menu rows separated by hairlines. */
export function MenuCard({ children }: { children: React.ReactNode }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.menuCard}>
      {rows.map((row, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <View style={styles.menuDivider} /> : null}
          {row}
        </React.Fragment>
      ))}
    </View>
  );
}

/** One tappable row: icon chip, title + subtitle, chevron (the Settings hub and Security designs). */
export function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | undefined;
  onPress: () => void;
  danger?: boolean | undefined;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={title}>
      <View style={[styles.iconChip, danger && styles.iconChipDanger]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {danger ? null : <ChevronRightIcon />}
    </TouchableOpacity>
  );
}

/** Label on the left, status pill or link on the right (Security's login rows, About's status rows). */
export function StatusRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      {right}
    </View>
  );
}

/** A small coloured dot before a status word ("Active", "Not Enabled"). */
export function StatusDot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

/** Outlined destructive button (Logout Current Session, Logout). */
export function DangerOutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.dangerOutline} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <Text style={styles.dangerOutlineText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Confirmation ────────────────────────────────────────────────────────────

/**
 * Centered confirmation card (logout, save profile, end session). Same pattern
 * as the notifications ConfirmDialog: no translucent scrim token exists, so the
 * backdrop is the solid canvas and the card is raised with adminShadow.lg.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
  icon,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {icon ? <View style={[styles.modalIcon, destructive && styles.modalIconDanger]}>{icon}</View> : null}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <WalletButton label="Cancel" variant="neutral" flex onPress={onCancel} />
            {destructive ? (
              <TouchableOpacity style={styles.dangerFilled} onPress={onConfirm} activeOpacity={0.85} accessibilityRole="button">
                <Text style={styles.dangerFilledText}>{confirmLabel}</Text>
              </TouchableOpacity>
            ) : (
              <WalletButton label={confirmLabel} flex onPress={onConfirm} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Signed out ──────────────────────────────────────────────────────────────

/**
 * The absorbed MainWarehouseSignedOutScreen: what a host without its own login
 * route shows after Logout. Hosts that pass `onLogout` navigate to their login
 * screen instead and never see this.
 */
export function SignedOutView() {
  return (
    <View style={styles.signedOutRoot}>
      <View style={styles.signedOutHeader}>
        <LeafIcon size={18} />
        <Text style={styles.signedOutHeaderTitle}>Signed Out</Text>
      </View>
      <View style={styles.signedOutBody}>
        <View style={styles.signedOutCircle}>
          <LeafIcon size={32} color={adminColors.brand} />
        </View>
        <Text style={styles.signedOutTitle}>TOHFA Admin Login</Text>
        <Text style={styles.signedOutText}>You've been signed out. Sign in again to continue.</Text>
      </View>
    </View>
  );
}

// Icon chip and dialog icon diameters: icon sizes, not spacing.
const ICON_CHIP = 40;
const MODAL_ICON = 52;
const SIGNED_OUT_CIRCLE = 72;
const DOT = 7;

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  menuDivider: { height: 1, backgroundColor: adminColors.border, marginLeft: adminSpacing.lg },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.md,
  },
  iconChip: {
    width: ICON_CHIP,
    height: ICON_CHIP,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipDanger: { backgroundColor: adminColors.danger.bg },
  menuText: { flex: 1 },
  menuTitle: { ...adminType.rowTitle, color: adminColors.ink },
  menuTitleDanger: { color: adminColors.danger.text },
  menuSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  statusLabel: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  dot: { width: DOT, height: DOT, borderRadius: adminRadius.full },

  dangerOutline: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerOutlineText: { ...adminType.sectionHead, color: adminColors.danger.text },
  dangerFilled: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerFilledText: { ...adminType.sectionHead, color: adminColors.onBrand },

  // Was a translucent black overlay; no translucent token, so a solid canvas scrim with the card raised by adminShadow.lg.
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalIcon: {
    width: MODAL_ICON,
    height: MODAL_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  modalIconDanger: { backgroundColor: adminColors.danger.bg },
  modalTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  modalMessage: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  modalActions: { flexDirection: 'row', alignSelf: 'stretch', gap: adminSpacing.sm },

  signedOutRoot: { flex: 1, backgroundColor: adminColors.canvas },
  signedOutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  signedOutHeaderTitle: { ...adminType.title, color: adminColors.onBrand },
  signedOutBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: adminSpacing.xl },
  signedOutCircle: {
    width: SIGNED_OUT_CIRCLE,
    height: SIGNED_OUT_CIRCLE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  signedOutTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  signedOutText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.sm },
});

/** Shared layout for the account screens' scroll content and section spacing. */
export const profileLayout = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xxl,
  },
  gap: { height: adminSpacing.md },
});
