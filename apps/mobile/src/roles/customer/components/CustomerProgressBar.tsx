import React from 'react';
import { View, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { customerColors, customerType, customerSpacing } from '../theme';

export interface CustomerProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const CustomerProgressBar: React.FC<CustomerProgressBarProps> = ({
  currentStep,
  totalSteps = 3,
  stepLabel,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {stepLabel && <Text style={styles.label}>{stepLabel}</Text>}
      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          return (
            <View
              key={index}
              style={[
                styles.stepSegment,
                {
                  backgroundColor: isCompleted
                    ? customerColors.brand
                    : customerColors.borderDecorative,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: customerSpacing[12],
  },
  label: {
    ...customerType.meta,
    color: customerColors.secondary,
    marginBottom: customerSpacing[8],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
    width: '100%',
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});

