import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  customerFonts,
  customerSpacing,
} from '../theme';
import { useLegal, parseMarkdown } from '../api/legal';
import { getLocale } from '../../../i18n/customer';
import { LegalMarkdown, LegalMeta, LegalLoading, LegalError } from '../components/LegalMarkdown';

export interface CustomerPrivacyPolicyScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

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

export const CustomerPrivacyPolicyScreen: React.FC<CustomerPrivacyPolicyScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const legal = useLegal('privacy-policy', getLocale());
  const blocks = React.useMemo(() => (legal.data ? parseMarkdown(legal.data.body) : []), [legal.data]);
  const insets = useSafeAreaInsets();
  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccountSettings'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color="#1A2E1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
      </View>
      <View style={styles.headerBottomDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {legal.isLoading ? (
          <LegalLoading />
        ) : legal.isError || !legal.data ? (
          <LegalError onRetry={() => void legal.refetch()} />
        ) : (
          <>
            <LegalMeta title={legal.data.title || 'Privacy Policy'} lastUpdated={legal.data.lastUpdated} />
            <LegalMarkdown blocks={blocks} />
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 20,
    paddingBottom: 40,
  },
});

