import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  customerColors,
  customerType,
  customerRadius,
  customerSpacing,
  CUSTOMER_HEADER_HEIGHT,
} from '../theme';

export interface CustomerHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backAccessibilityLabel?: string;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
  style,
  backAccessibilityLabel = 'Go back',
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {onBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleWrap}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {rightElement && <View style={styles.rightContainer}>{rightElement}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: CUSTOMER_HEADER_HEIGHT,
    paddingHorizontal: customerSpacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.canvas,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: customerRadius.action,
    borderWidth: 1.5,
    borderColor: customerColors.borderDecorative,
    backgroundColor: customerColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: customerSpacing[12],
  },
  backArrow: {
    fontSize: customerType.title.fontSize,
    color: customerColors.brand,
    fontWeight: '700',
    marginTop: -2,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...customerType.title,
    color: customerColors.heading,
  },
  subtitle: {
    ...customerType.support,
    color: customerColors.secondary,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: customerSpacing[12],
  },
});

