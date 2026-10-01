import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { SWA_COLORS, SWA_TYPOGRAPHY } from '../constants';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  onPress?: () => void;
}

export function StatCard({ 
  icon, 
  value, 
  label, 
  iconColor = SWA_COLORS.primaryOrange,
  iconBg = SWA_COLORS.surfaceBeige,
  onPress 
}: StatCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: SWA_COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SWA_COLORS.border,
    padding: 14,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: SWA_TYPOGRAPHY.fontWeight.extrabold,
    color: SWA_COLORS.textPrimary,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
  },
  label: {
    fontSize: 10,
    fontWeight: SWA_TYPOGRAPHY.fontWeight.medium,
    color: SWA_COLORS.textSecondary,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    textAlign: 'center',
    marginTop: 4,
  },
});
