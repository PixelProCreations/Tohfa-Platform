import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';

export interface CustomerAccountSettingsScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BookOpenSvg = ({ color = '#1A2E1A', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentScrollSvg = ({ color = '#1A2E1A', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CustomerAccountSettingsScreen: React.FC<CustomerAccountSettingsScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER (EXACT FIGMA: (<-) Account Settings) ──────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color="#1A2E1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>
      </View>
      <View style={styles.headerBottomDivider} />

      {/* ── SETTINGS ROWS ────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Row 1: Privacy Policy */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate?.('CustomerPrivacyPolicy')}
          style={styles.rowItem}
          accessibilityLabel="Privacy Policy"
        >
          <View style={styles.iconWrap}>
            <BookOpenSvg color="#1A2E1A" size={22} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
            <Text style={styles.rowSubtitle}>Read more about how we handle data</Text>
          </View>
          <ChevronRightSvg color="#1A2E1A" size={18} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        {/* Row 2: Terms and condition */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate?.('CustomerTerms')}
          style={styles.rowItem}
          accessibilityLabel="Terms and condition"
        >
          <View style={styles.iconWrap}>
            <DocumentScrollSvg color="#1A2E1A" size={22} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Terms and condition</Text>
            <Text style={styles.rowSubtitle}>Know the rules for using our service.</Text>
          </View>
          <ChevronRightSvg color="#1A2E1A" size={18} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    fontWeight: '400',
  },
  headerBottomDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  content: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  iconWrap: {
    width: 32,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2E1A',
    fontFamily: customerFonts.semibold,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: customerFonts.regular,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
});

