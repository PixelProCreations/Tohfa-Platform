import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import Svg, { Path, Rect } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { SWAGradient } from './SWAGradient';

interface SWAHeaderProps {
  title: string;
  subtitle?: string | undefined;
  icon?: string | undefined;
  onBack?: (() => void) | undefined;
  onNotification?: (() => void) | undefined;
  showNotification?: boolean | undefined;
  showWarehouse?: boolean | undefined;
  warehouseLocked?: boolean | undefined;
  warehouseName?: string | undefined;
  rightAction?: React.ReactNode | undefined;
  showFilter?: boolean | undefined;
  onFilterPress?: (() => void) | undefined;
  badge?: React.ReactNode | undefined;
  colors?: [string, string] | undefined;
  bottomContent?: React.ReactNode | undefined;
  paddingTop?: number | undefined;
}

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function LockSmallIcon({ size = 12, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SWAHeader({
  title,
  subtitle,
  icon,
  onBack,
  onNotification,
  showNotification = false,
  showWarehouse = false,
  warehouseLocked = false,
  warehouseName,
  rightAction,
  showFilter = false,
  onFilterPress,
  badge,
  colors,
  bottomContent,
  paddingTop,
}: SWAHeaderProps) {
  const isDetailSubtitle = Boolean(subtitle && !showWarehouse);

  return (
    <SWAGradient
      colors={colors || [adminColors.brand, adminColors.brand]}
    >
      <View style={[styles.container, paddingTop !== undefined && { paddingTop }]}>
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            )}

            {icon && (
              <Icon
                name={icon}
                size={20}
                color={adminColors.onBrand}
                style={styles.titleIcon}
              />
            )}

            <View style={styles.titleWrapper}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {isDetailSubtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
              )}
            </View>
          </View>

          <View style={styles.rightActions}>
            {badge ? (
              <View style={styles.badgeWrapper}>{badge}</View>
            ) : showFilter ? (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={onFilterPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FilterSlidersIcon size={18} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : rightAction ? (
              <View style={styles.rightAction}>{rightAction}</View>
            ) : (showNotification || onNotification) ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onNotification}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="notifications" size={20} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* The warehouse comes from the caller's scope; no name (Main, all warehouses) = no pill. */}
        {(() => {
          const effectiveName = warehouseName || (warehouseLocked ? 'Coonoor Warehouse' : undefined);
          if (!(showWarehouse || warehouseLocked) || !effectiveName) return null;
          const cleanName = effectiveName.replace(/\s*·\s*(Active|Assigned Warehouse)$/, '');
          const finalWhName = cleanName.includes('Warehouse') ? cleanName : `${cleanName} Warehouse`;
          return (
            <View style={styles.warehousePill}>
              <LockSmallIcon size={12} color={adminColors.onBrand} />
              <Text style={styles.warehousePillText}>
                {`${finalWhName} · Assigned Warehouse`}
              </Text>
            </View>
          );
        })()}

        {bottomContent}
      </View>
    </SWAGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    marginRight: 0,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  subtitle: {
    ...adminType.body,
    color: adminColors.onBrand,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 8,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
  rightAction: {
    alignItems: 'flex-end',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.headerPill.bg,
    borderWidth: 1,
    borderColor: adminColors.headerPill.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: adminSpacing.sm,
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
