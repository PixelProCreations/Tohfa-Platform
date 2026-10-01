import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { SWA_COLORS, SWA_TYPOGRAPHY } from '../constants';

type BannerType = 'info' | 'warning' | 'error' | 'success';

interface InfoBannerProps {
  type: BannerType;
  message: string;
  icon?: string;
}

export function InfoBanner({ type, message, icon }: InfoBannerProps) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: SWA_COLORS.successLight,
          color: SWA_COLORS.success,
          icon: icon || 'check_circle',
        };
      case 'warning':
        return {
          bg: SWA_COLORS.warningLight,
          color: SWA_COLORS.warning,
          icon: icon || 'warning',
        };
      case 'error':
        return {
          bg: SWA_COLORS.errorLight,
          color: SWA_COLORS.error,
          icon: icon || 'error',
        };
      case 'info':
      default:
        return {
          bg: SWA_COLORS.infoLight,
          color: SWA_COLORS.info,
          icon: icon || 'info',
        };
    }
  };

  const style = getStyles();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Icon name={style.icon} size={16} color={style.color} />
      <Text style={[styles.message, { color: style.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  message: {
    flex: 1,
    marginLeft: 10,
    fontSize: 11,
    fontWeight: SWA_TYPOGRAPHY.fontWeight.medium,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    lineHeight: 16,
  },
});
