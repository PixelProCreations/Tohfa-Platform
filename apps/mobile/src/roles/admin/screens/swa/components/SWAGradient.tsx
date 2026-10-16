import React from 'react';
import { StyleSheet, View } from 'react-native';
import { adminColors } from '../../../theme';

interface ColorGradientProps {
  colors?: [string, string] | string[];
  /** Number of stacked bands; 20 reads visually identical to a true gradient. */
  bands?: number;
  children?: React.ReactNode;
}

/**
 * Pure React Native gradient approximation using stacked translucent bands.
 * Matches linear-gradient(180deg, color1, color2) from CSS.
 * No Expo dependencies required.
 */
export const SWAGradient: React.FC<ColorGradientProps> = ({ 
  colors = [adminColors.brand, adminColors.brandDeep], 
  bands = 20,
  children 
}) => {
  const effectiveColors = colors && colors.length >= 2 ? colors : [adminColors.brand, adminColors.brandDeep];

  // Parse hex colors to RGB
  const parseColor = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.substr(0, 2), 16),
      parseInt(clean.substr(2, 2), 16),
      parseInt(clean.substr(4, 2), 16),
    ];
  };

  const startRGB = parseColor(effectiveColors[0]!);
  const endRGB = parseColor(effectiveColors[1]!);

  // Generate intermediate colors
  const bandColors = Array.from({ length: bands }, (_, i) => {
    const t = i / (bands - 1);
    const r = Math.round(startRGB[0] + t * (endRGB[0] - startRGB[0]));
    const g = Math.round(startRGB[1] + t * (endRGB[1] - startRGB[1]));
    const b = Math.round(startRGB[2] + t * (endRGB[2] - startRGB[2]));
    return `rgb(${r}, ${g}, ${b})`;
  });

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {bandColors.map((color, i) => (
          <View key={i} style={[styles.band, { backgroundColor: color }]} />
        ))}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  band: {
    flex: 1,
  },
});
