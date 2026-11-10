import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../theme';

export type AdminDomainStatus =
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'IN_TRANSIT'
  | 'FLAGGED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DRAFT'
  | 'INACTIVE'
  | string;

export interface AdminStatusBadgeProps {
  status?: AdminDomainStatus | undefined;
  label?: string | undefined;
  tone?: 'default' | 'success' | 'warning' | 'info' | 'danger' | string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  textStyle?: StyleProp<TextStyle> | undefined;
  size?: ('sm' | 'md') | undefined;
}

function resolveStatusColors(
  status?: string,
  tone?: string,
): { bg: string; text: string; border: string } {
  if (tone === 'success') {
    return {
      bg: adminColors.success.bg,
      text: adminColors.success.text,
      border: adminColors.success.border,
    };
  }
  if (tone === 'warning') {
    return {
      bg: adminColors.warning.bg,
      text: adminColors.warning.text,
      border: adminColors.warning.border,
    };
  }
  if (tone === 'danger') {
    return {
      bg: adminColors.danger.bg,
      text: adminColors.danger.text,
      border: adminColors.danger.border,
    };
  }
  if (tone === 'info') {
    return {
      bg: adminColors.info.bg,
      text: adminColors.info.text,
      border: adminColors.info.border,
    };
  }
  const raw = typeof status === 'string' ? status : '';
  const norm = raw.toUpperCase().replace(/\s+/g, '_');
  switch (norm) {
    case 'APPROVED':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'VERIFIED':
    case 'PAID':
    case 'RECORDED':
    case 'PUBLISHED':
      return {
        bg: adminColors.success.bg,
        text: adminColors.success.text,
        border: adminColors.success.border,
      };
    case 'INFO':
    case 'ESCALATED':
    case 'HIGH_VALUE':
    case 'AWAITING_SA_APPROVAL':
      return {
        bg: adminColors.info.bg,
        text: adminColors.info.text,
        border: adminColors.info.border,
      };
    case 'PENDING':
    case 'PENDING_REVIEW':
    case 'UNDER_REVIEW':
    case 'IN_PROGRESS':
    case 'IN_TRANSIT':
    case 'SCHEDULED':
      return {
        bg: adminColors.warning.bg,
        text: adminColors.warning.text,
        border: adminColors.warning.border,
      };
    case 'FLAGGED':
    case 'DISPUTED':
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
    case 'SUSPENDED':
      return {
        bg: adminColors.danger.bg,
        text: adminColors.danger.text,
        border: adminColors.danger.border,
      };
    case 'DRAFT':
    case 'INACTIVE':
    default:
      return {
        bg: adminColors.canvas,
        text: adminColors.muted,
        border: adminColors.border,
      };
  }
}

export function AdminStatusBadge({
  status,
  label,
  tone,
  style,
  textStyle,
  size = 'md',
}: AdminStatusBadgeProps) {
  const effectiveStatus = typeof status === 'string' ? status : (typeof label === 'string' ? label : '');
  const colors = resolveStatusColors(effectiveStatus, tone);
  const displayLabel = label ?? (typeof status === 'string' ? status.replace(/_/g, ' ') : '');

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colors.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: adminRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: adminSpacing.xs + 2,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
  },
  text: {
    textTransform: 'capitalize',
  },
  textSm: {
    ...adminType.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  textMd: {
    ...adminType.caption,
    fontSize: 12,
    lineHeight: 16,
  },
});
