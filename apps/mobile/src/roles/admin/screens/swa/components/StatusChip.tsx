import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SWA_COLORS, SWA_TYPOGRAPHY } from '../constants';

type StatusType = 
  | 'success' | 'warning' | 'error' | 'info' 
  | 'active' | 'completed' | 'pending' | 'awaiting'
  | 'confirmed' | 'ready' | 'cancelled' | 'rejected';

interface StatusChipProps {
  status: string;
  type?: StatusType;
}

export function StatusChip({ status, type }: StatusChipProps) {
  const getColors = () => {
    switch (type) {
      case 'success':
      case 'completed':
      case 'active':
      case 'confirmed':
        return {
          bg: SWA_COLORS.successLight,
          text: SWA_COLORS.success,
        };
      case 'warning':
      case 'awaiting':
      case 'pending':
        return {
          bg: SWA_COLORS.warningLight,
          text: SWA_COLORS.warning,
        };
      case 'error':
      case 'cancelled':
      case 'rejected':
        return {
          bg: SWA_COLORS.errorLight,
          text: SWA_COLORS.error,
        };
      case 'info':
      case 'ready':
        return {
          bg: SWA_COLORS.infoLight,
          text: SWA_COLORS.info,
        };
      default:
        return {
          bg: SWA_COLORS.surfaceBeige,
          text: SWA_COLORS.primaryBrown,
        };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: SWA_TYPOGRAPHY.fontWeight.semibold,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
  },
});
