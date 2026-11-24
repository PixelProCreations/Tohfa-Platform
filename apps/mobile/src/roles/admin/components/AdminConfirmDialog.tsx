import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../theme';

function DefaultCheckIcon({ size = 24, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DefaultAlertIcon({ size = 24, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path d="M12 8v5M12 16v.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function DefaultInfoIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export interface AdminConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  onConfirm: () => void;
  onCancel?: (() => void) | undefined;
  destructive?: boolean | undefined;
  variant?: 'brand' | 'success' | 'danger' | 'info' | undefined;
  icon?: React.ReactNode | undefined;
  hideCancel?: boolean | undefined;
}

export function AdminConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  variant = 'brand',
  icon,
  hideCancel = false,
}: AdminConfirmDialogProps) {
  const isDanger = destructive || variant === 'danger';
  const isSuccess = variant === 'success';
  const isInfo = variant === 'info';

  const defaultIcon = isDanger ? (
    <DefaultAlertIcon size={24} color={adminColors.danger.text} />
  ) : isSuccess ? (
    <DefaultCheckIcon size={24} color={adminColors.success.text} />
  ) : isInfo ? (
    <DefaultInfoIcon size={24} color={adminColors.info.text} />
  ) : (
    <DefaultInfoIcon size={24} color={adminColors.brand} />
  );

  const iconBgStyle = isDanger
    ? styles.iconBgDanger
    : isSuccess
    ? styles.iconBgSuccess
    : isInfo
    ? styles.iconBgInfo
    : styles.iconBgBrand;

  const showCancelButton = !hideCancel && typeof onCancel === 'function';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel ?? onConfirm}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconBadge, iconBgStyle]}>
            {icon ?? defaultIcon}
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalActions}>
            {showCancelButton && onCancel ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                isDanger && styles.confirmButtonDanger,
                isSuccess && styles.confirmButtonSuccess,
                !showCancelButton && styles.confirmButtonFull,
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Re-export alias for drop-in compatibility with ProfileParts ConfirmDialog
export const ConfirmDialog = AdminConfirmDialog;

const MODAL_ICON_SIZE = 52;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalIconBadge: {
    width: MODAL_ICON_SIZE,
    height: MODAL_ICON_SIZE,
    borderRadius: MODAL_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  iconBgBrand: {
    backgroundColor: adminColors.brandTint,
  },
  iconBgDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  iconBgSuccess: {
    backgroundColor: adminColors.success.bg,
  },
  iconBgInfo: {
    backgroundColor: adminColors.info.bg,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },
  modalMessage: {
    ...adminType.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    columnGap: adminSpacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonFull: {
    flex: undefined,
    width: '100%',
  },
  confirmButtonDanger: {
    backgroundColor: adminColors.danger.text,
  },
  confirmButtonSuccess: {
    backgroundColor: adminColors.brand,
  },
  confirmButtonText: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
