import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { SWAGradient } from './SWAGradient';
import { SWA_COLORS } from '../constants';

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
  colors?: [string, string];
  bottomContent?: React.ReactNode;
  paddingTop?: number;
}

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function LockSmallIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function FilterSlidersIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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
  colors,
  bottomContent,
  paddingTop,
}: SWAHeaderProps) {
  const isDetailSubtitle = Boolean(subtitle && !showWarehouse);

  return (
    <SWAGradient
      colors={colors || ['#F0562A', '#F0562A']}
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
                <BackArrowIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {icon && (
              <Icon
                name={icon}
                size={20}
                color={SWA_COLORS.textWhite}
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
                <FilterSlidersIcon size={18} color="#FFFFFF" />
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
                <Icon name="notifications" size={20} color={SWA_COLORS.textWhite} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {(showWarehouse || warehouseLocked) && (
          <View style={styles.warehousePill}>
            <LockSmallIcon size={13} color="#FFFFFF" />
            <Text style={styles.warehousePillText}>{warehouseName}</Text>
          </View>
        )}

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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Poppins',
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
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    gap: 6,
  },
  warehousePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
