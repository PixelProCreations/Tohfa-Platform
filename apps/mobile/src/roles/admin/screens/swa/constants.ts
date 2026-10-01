// SWA Design System - Extracted from HTML prototype
// DO NOT modify these values - they match the uploaded HTML exactly

export const SWA_COLORS = {
  // Primary Colors
  primaryBrown: '#8B4513',
  primaryOrange: '#E85226',
  darkOrange: '#D97C22',
  
  // Text Colors
  textPrimary: '#1D2420',
  textSecondary: '#5C6B63',
  textMuted: '#7A726C',
  textWhite: '#FFFFFF',
  
  // Background Colors
  appBackground: '#F4F1EA',
  screenBackground: '#F4F1EA',
  cardBackground: '#FFFFFF',
  surfaceBeige: '#F5E6D3',
  background: '#F4F1EA', // Warm cream matching reference design
  surface: '#FFFFFF', // Alias for cardBackground
  
  // Border Colors
  border: '#E8E2D8',
  
  // Status Colors
  success: '#1E8E5A',
  successLight: '#E6F5ED',
  warning: '#C98A02',
  warningLight: '#FDF3DC',
  error: '#E24B4A',
  errorLight: '#FCE9E9',
  info: '#2C6FB0',
  infoLight: '#E7F0F9',
  darkGreen: '#04342C',
  
  // Phone Frame
  phoneFrame: '#000000',
  
  // Gradients (as strings for use in styles)
  headerGradientStart: '#E85226',
  headerGradientEnd: '#E85226',
  screenGradientStart: '#E85226',
  screenGradientEnd: '#E85226',
  
  // Transparent
  whiteTransparent: 'rgba(255, 255, 255, 0.18)',
} as const;

export const SWA_TYPOGRAPHY = {
  // Font Family
  fontFamily: 'Poppins',
  
  // Font Sizes
  fontSize: {
    largeHeading: 24,
    heading: 16,
    sectionTitle: 12.5,
    body: 11,
    small: 10,
    metadata: 9.5,
    navigation: 9,
    button: 12.5,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Shortcuts for common text styles
  heading: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400' as const,
  },
} as const;

export const SWA_SPACING = {
  // Screen Dimensions
  screenWidth: 390,
  screenHeight: 844,
  
  // Phone Frame
  frameRadius: 46,
  framePadding: 14,
  innerRadius: 34,
  
  // Notch
  notchWidth: 120,
  notchHeight: 26,
  notchRadius: 16,
  
  // Status Bar
  statusBarHeight: 44,
  statusBarPadding: 22,
  
  // Header
  headerPadding: 14,
  
  // Content Padding
  contentPadding: 16,
  
  // Card Spacing
  cardRadius: 12,
  cardPadding: 14,
  
  // Button Spacing
  buttonRadius: 12,
  buttonPadding: 13,
  
  // Bottom Navigation
  bottomNavPadding: 8,
  bottomNavHeight: 60,
  
  // Generic spacing shortcuts
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const SWA_ICONS = {
  size: {
    small: 18,
    medium: 20,
    large: 22,
    xlarge: 24,
  },
} as const;

export const SWA_SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Warehouse constant
export const WAREHOUSE_NAME = 'Coonoor Warehouse';
export const WAREHOUSE_ID = 'WH-COO-001';
export const WAREHOUSE_TYPE = 'Sub Warehouse';
