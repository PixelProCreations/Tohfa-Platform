import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { SWAGradient } from './SWAGradient';
import { SWA_COLORS, SWA_TYPOGRAPHY } from '../constants';

interface SWAHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onBack?: () => void;
  onNotification?: () => void;
  showNotification?: boolean;
  showWarehouse?: boolean;
  warehouseLocked?: boolean;
  warehouseName?: string;
  rightAction?: React.ReactNode;
  showFilter?: boolean;
  onFilterPress?: () => void;
  badge?: React.ReactNode;
}

function FilterSlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
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
  warehouseName = 'Coonoor Warehouse',
  rightAction,
  showFilter = false,
  onFilterPress,
  badge,
}: SWAHeaderProps) {
  // If there's a subtitle or badge alongside onBack (like ProductStockDetail), align title to left
  const isDetailHeader = Boolean(subtitle && (badge || onBack));

  return (
    <SWAGradient
      colors={[SWA_COLORS.screenGradientStart, SWA_COLORS.screenGradientEnd]}
    >
      <View style={styles.container}>
        <View style={styles.topRow}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow_back" size={24} color={SWA_COLORS.textWhite} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          {isDetailHeader ? (
            <View style={styles.detailTitleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.detailSubtitle}>{subtitle}</Text>}
            </View>
          ) : (
            <View style={styles.titleContainer}>
              {icon && (
                <Icon
                  name={icon}
                  size={20}
                  color={SWA_COLORS.textWhite}
                  style={styles.titleIcon}
                />
              )}
              <Text style={styles.title}>{title}</Text>
            </View>
          )}

          <View style={styles.rightActions}>
            {badge ? (
              <View style={styles.badgeWrapper}>{badge}</View>
            ) : showFilter ? (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={onFilterPress}
                activeOpacity={0.7}
              >
                <FilterSlidersIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : rightAction ? (
              <View style={styles.rightAction}>{rightAction}</View>
            ) : (showNotification || onNotification) ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onNotification}
                activeOpacity={0.7}
              >
                <Icon name="notifications" size={20} color={SWA_COLORS.textWhite} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>
        </View>

        {!isDetailHeader && subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {(showWarehouse || warehouseLocked) && (
          <View style={styles.warehouseRow}>
            <Icon name="lock" size={13} color={SWA_COLORS.textWhite} />
            <Text style={styles.warehouseText}>{warehouseName}</Text>
          </View>
        )}
      </View>
    </SWAGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 44, // Status bar height
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  detailTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: SWA_COLORS.textWhite,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
  },
  detailSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    marginTop: 1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: SWA_TYPOGRAPHY.fontWeight.medium,
    color: SWA_COLORS.textWhite,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    textAlign: 'center',
    marginTop: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 36,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'center',
  },
  warehouseText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '600',
    color: SWA_COLORS.textWhite,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
  },
});
