import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import Svg, { Path } from 'react-native-svg';
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

function LockSmallIcon({ size = 13, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7h18M16 4.5v5M3 12h18M8 9.5v5M3 17h18M14 14.5v5"
        stroke={color}
        strokeWidth="2.2"
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
        {(showWarehouse || warehouseLocked) && warehouseName ? (
          <View style={styles.warehousePill}>
            <LockSmallIcon size={13} color={adminColors.onBrand} />
            <Text style={styles.warehousePillText}>{warehouseName}</Text>
          </View>
        ) : null}

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
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
