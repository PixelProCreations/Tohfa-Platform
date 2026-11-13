import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  customerColors,
  customerType,
  customerRadius,
  customerSpacing,
} from '../theme';

export type CustomerAlertTone = 'info' | 'error' | 'warning' | 'success';

export interface CustomerAlertProps {
  tone?: CustomerAlertTone;
  title: string;
  description?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export const CustomerAlert: React.FC<CustomerAlertProps> = ({
  tone = 'info',
  title,
  description,
  icon,
  style,
}) => {
  const getToneStyle = () => {
    switch (tone) {
      case 'error':
        return {
          bg: customerColors.status.error.bg,
          color: customerColors.status.error.text,
          border: customerColors.status.error.border,
          defaultIcon: '!',
        };
      case 'warning':
        return {
          bg: customerColors.status.warning.bg,
          color: customerColors.status.warning.text,
          border: customerColors.status.warning.border,
          defaultIcon: '!',
        };
      case 'success':
        return {
          bg: customerColors.status.success.bg,
          color: customerColors.status.success.text,
          border: customerColors.status.success.border,
          defaultIcon: '✓',
        };
      case 'info':
      default:
        return {
          bg: customerColors.status.info.bg,
          color: customerColors.status.info.text,
          border: customerColors.status.info.border,
          defaultIcon: 'i',
        };
    }
  };

  const currentTone = getToneStyle();

  return (
    <View
      style={[
        styles.alert,
        {
          backgroundColor: currentTone.bg,
          borderColor: currentTone.border,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      <View style={[styles.iconWrap, { borderColor: currentTone.color }]}>
        <Text style={[styles.iconText, { color: currentTone.color }]}>
          {icon || currentTone.defaultIcon}
        </Text>
      </View>

      <View style={styles.contentWrap}>
        <Text style={[styles.title, { color: currentTone.color }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: customerColors.body }]}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  alert: {
    padding: customerSpacing[12],
    borderRadius: customerRadius.input,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: customerSpacing[12],
    marginVertical: customerSpacing[8],
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentWrap: {
    flex: 1,
  },
  title: {
    ...customerType.control,
    fontSize: 14,
    marginBottom: 2,
  },
  description: {
    ...customerType.support,
    fontSize: 13,
    lineHeight: 18,
  },
});

