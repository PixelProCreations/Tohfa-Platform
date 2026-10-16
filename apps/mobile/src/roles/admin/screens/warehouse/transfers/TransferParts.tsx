/**
 * Building blocks shared by the transfer screens, on the admin theme. The
 * frame, cards, chips and buttons come from wallet-cashtopup/WalletParts like
 * the other warehouse areas; this file adds the transfer icons and the
 * transfer row. Permission codes, status labels/tones and the scope rule live
 * in ./mappers.ts (pure, tested) and are re-exported here for the screens.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatAdminDay } from '../../../utils/datetime';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { StatusBadge } from '../wallet-cashtopup/WalletParts';
import type { TransferListItem } from './types';

export { TRANSFER_CODES } from './mappers';

/** 'Kotagiri → Coonoor' */
export function transferRouteLabel(transfer: { sourceName: string; destinationName: string }): string {
  return t('transfers.route', { from: transfer.sourceName, to: transfer.destinationName });
}

interface IconProps {
  size?: number;
  color?: string;
}

export function TruckIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function RouteArrowIcon({ size = 16, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowDownRouteIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12l7 7 7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TransferArrowsIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DispatchIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlayCircleIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Polygon points="10,8 16.5,12 10,16" fill={color} />
    </Svg>
  );
}

export function TransferChevronIcon({ size = 16, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** One transfer card: route, number + value, status and the day it was raised. */
export function TransferRow({ transfer, onPress }: { transfer: TransferListItem; onPress?: (() => void) | undefined }) {
  const content = (
    <>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <TruckIcon />
        </View>
        <View style={styles.textCol}>
          <View style={styles.routeRow}>
            <Text style={styles.whName}>{transfer.sourceName}</Text>
            <RouteArrowIcon />
            <Text style={styles.whName}>{transfer.destinationName}</Text>
          </View>
          <Text style={styles.meta}>
            {t('transfers.row.meta', { code: transfer.code, value: formatPaise(transfer.totalValuePaise) })}
          </Text>
        </View>
        {onPress ? <TransferChevronIcon /> : null}
      </View>
      <View style={styles.bottomRow}>
        <StatusBadge label={transfer.statusLabel} tone={transfer.statusTone} />
        {transfer.hasDiscrepancy ? <StatusBadge label={t('transfers.row.discrepancy')} tone="danger" /> : null}
        <Text style={styles.eta}>{formatAdminDay(transfer.createdAt)}</Text>
      </View>
    </>
  );
  if (onPress === undefined) return <View style={styles.card}>{content}</View>;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('transfers.row.a11y', { code: transfer.code, route: transferRouteLabel(transfer) })}
    >
      {content}
    </TouchableOpacity>
  );
}

const ICON_BOX = 38;

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  whName: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  eta: { ...adminType.rowMeta, color: adminColors.muted },
});
