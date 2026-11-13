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
import Svg, { Path } from 'react-native-svg';
import {
  customerFonts,
  customerSpacing,
} from '../theme';

export interface CustomerTermsScreenProps {
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

export const CustomerTermsScreen: React.FC<CustomerTermsScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccountSettings'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color="#1A2E1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms and condition</Text>
        </View>
      </View>
      <View style={styles.headerBottomDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.documentMainTitle}>Terms & Conditions</Text>

        <View style={styles.metadataRow}>
          <Text style={styles.brandTitle}>TOHFA Market</Text>
          <Text style={styles.lastUpdatedText}>Last Updated: 12/11/2026</Text>
        </View>

        {/* Section 1 */}
        <Text style={styles.sectionHeader}>1. Introduction</Text>
        <Text style={styles.subHeader}>Welcome to TOHFA Market.</Text>
        <Text style={styles.bodyParagraph}>
          Welcome to TOHFA Market, a farmer-first marketplace operated by the Nilgiris Horticulture Organic Farmers Association (TOHFA).
        </Text>
        <Text style={styles.bodyParagraph}>
          These Terms & Conditions govern your access to and use of the TOHFA Market mobile application, website and related services.
        </Text>
        <Text style={styles.bodyParagraph}>
          By registering, accessing or using TOHFA Market, you agree to comply with these Terms & Conditions. If you do not agree with these terms, please do not use the application.
        </Text>

        {/* Section 2 */}
        <Text style={styles.sectionHeader}>2. Eligibility and Account Registration</Text>
        <Text style={styles.bodyParagraph}>To use TOHFA Market, you must:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Provide accurate and complete registration information.</Text>
          <Text style={styles.bulletItem}>•  Register using a valid mobile number and other requested details.</Text>
          <Text style={styles.bulletItem}>•  Complete the required verification process.</Text>
          <Text style={styles.bulletItem}>•  Keep your account information updated.</Text>
          <Text style={styles.bulletItem}>•  Be legally eligible to enter into a binding agreement under applicable laws.</Text>
        </View>
        <Text style={styles.bodyParagraph}>
          You are responsible for maintaining the confidentiality of your account credentials and for activities performed through your account.
        </Text>
        <Text style={styles.bodyParagraph}>
          Please notify TOHFA Market immediately if you suspect unauthorised access to your account.
        </Text>

        {/* Section 3 */}
        <Text style={styles.sectionHeader}>3. Account Information</Text>
        <Text style={styles.bodyParagraph}>
          You agree that all information provided during registration and while using the application is accurate and current.
        </Text>
        <Text style={styles.bodyParagraph}>
          You can update eligible personal information through the My Profile section.
        </Text>
        <Text style={styles.bodyParagraph}>
          TOHFA Market reserves the right to restrict or suspend accounts that contain misleading information, violate these terms or are involved in suspicious activities, subject to applicable laws.
        </Text>

        {/* Section 4 */}
        <Text style={styles.sectionHeader}>4. Products and Availability</Text>
        <Text style={styles.bodyParagraph}>
          TOHFA Market provides access to agricultural products and other items supplied by participating farmers and approved sellers.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Product availability depends on farmer supply and seasonal conditions.</Text>
          <Text style={styles.bulletItem}>•  Product images are for representation purposes and may differ slightly from the delivered product.</Text>
          <Text style={styles.bulletItem}>•  Product descriptions, weights, quantities and prices are displayed on the application.</Text>
          <Text style={styles.bulletItem}>•  Fresh agricultural products may naturally vary in size, shape, colour and appearance.</Text>
          <Text style={styles.bulletItem}>•  Products may become unavailable due to changes in stock or supply.</Text>
        </View>
        <Text style={styles.bodyParagraph}>
          TOHFA Market aims to provide accurate product information but cannot guarantee that every product will always be available.
        </Text>

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
  documentMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2E1A',
    fontFamily: customerFonts.bold,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2E1A',
    fontFamily: customerFonts.semibold,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: customerFonts.regular,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
    fontFamily: customerFonts.bold,
    marginTop: 20,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
    fontFamily: customerFonts.bold,
    marginBottom: 6,
  },
  bodyParagraph: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#6B7280',
    fontFamily: customerFonts.regular,
    marginBottom: 10,
  },
  bulletList: {
    paddingLeft: 4,
    marginBottom: 10,
  },
  bulletItem: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#6B7280',
    fontFamily: customerFonts.regular,
    marginBottom: 3,
  },
});

