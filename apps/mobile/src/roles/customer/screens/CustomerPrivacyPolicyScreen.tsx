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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
      </View>
      <View style={styles.headerBottomDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.documentMainTitle}>Privacy Policy</Text>

        <View style={styles.metadataRow}>
          <Text style={styles.brandTitle}>TOHFA Market</Text>
          <Text style={styles.lastUpdatedText}>Last Updated: 12/11/2026</Text>
        </View>

        {/* Section 1 */}
        <Text style={styles.sectionHeader}>1. Introduction</Text>
        <Text style={styles.subHeader}>Welcome to TOHFA Market.</Text>
        <Text style={styles.bodyParagraph}>
          TOHFA Market is a farmer-first marketplace by the Nilgiris Horticulture Organic Farmers Association (TOHFA), connecting customers with fresh agricultural products from participating farmers.
        </Text>
        <Text style={styles.bodyParagraph}>
          We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, process and share your information when you use the TOHFA Market mobile application, website and related services.
        </Text>
        <Text style={styles.bodyParagraph}>
          By using TOHFA Market, you acknowledge that you have read and understood this Privacy Policy.
        </Text>

        {/* Section 2 */}
        <Text style={styles.sectionHeader}>2. Information We Collect</Text>
        <Text style={styles.bodyParagraph}>
          We may collect the following categories of information when you use our application.
        </Text>

        <Text style={styles.subSectionHeader}>2.1 Personal Information</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Full name</Text>
          <Text style={styles.bulletItem}>•  Mobile number</Text>
          <Text style={styles.bulletItem}>•  Email address</Text>
          <Text style={styles.bulletItem}>•  Date of birth</Text>
          <Text style={styles.bulletItem}>•  Gender, if provided</Text>
          <Text style={styles.bulletItem}>•  Profile photograph, if uploaded</Text>
        </View>

        <Text style={styles.subSectionHeader}>2.2 Address Information</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  House number and street address</Text>
          <Text style={styles.bulletItem}>•  City, town and district</Text>
          <Text style={styles.bulletItem}>•  State and PIN code</Text>
          <Text style={styles.bulletItem}>•  Saved delivery addresses</Text>
          <Text style={styles.bulletItem}>•  Preferred delivery location</Text>
        </View>

        <Text style={styles.subSectionHeader}>2.3 Location Information</Text>
        <Text style={styles.bodyParagraph}>
          With your permission, we may collect your device location to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Identify your delivery location.</Text>
          <Text style={styles.bulletItem}>•  Show available products and services in your area.</Text>
          <Text style={styles.bulletItem}>•  Help you select or confirm an address on the map.</Text>
          <Text style={styles.bulletItem}>•  Improve delivery and location-based services.</Text>
        </View>
        <Text style={styles.bodyParagraph}>
          You can manage location permissions through your device settings. You may also enter your address manually where this option is available.
        </Text>

        <Text style={styles.subSectionHeader}>2.4 Order and Transaction Information</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Products viewed and purchased</Text>
          <Text style={styles.bulletItem}>•  Shopping cart and wishlist details</Text>
          <Text style={styles.bulletItem}>•  Order history and order status</Text>
          <Text style={styles.bulletItem}>•  Delivery and pickup details</Text>
          <Text style={styles.bulletItem}>•  Refund and return requests</Text>
          <Text style={styles.bulletItem}>•  Wallet balance and transaction history</Text>
          <Text style={styles.bulletItem}>•  Payment status and transaction references</Text>
        </View>

        <Text style={styles.subSectionHeader}>2.5 Device and Technical Information</Text>
        <Text style={styles.bodyParagraph}>
          We may collect certain technical information, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Device type and operating system</Text>
          <Text style={styles.bulletItem}>•  Application version</Text>
          <Text style={styles.bulletItem}>•  Device identifiers</Text>
          <Text style={styles.bulletItem}>•  IP address</Text>
          <Text style={styles.bulletItem}>•  App usage and diagnostic information</Text>
          <Text style={styles.bulletItem}>•  Crash reports and performance information</Text>
        </View>

        <Text style={styles.subSectionHeader}>2.6 Communication Information</Text>
        <Text style={styles.bodyParagraph}>
          When you contact our support team, we may collect:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Support messages and enquiries</Text>
          <Text style={styles.bulletItem}>•  Feedback and product reviews</Text>
          <Text style={styles.bulletItem}>•  Uploaded photographs or attachments</Text>
          <Text style={styles.bulletItem}>•  Communication history related to your requests</Text>
        </View>

        {/* Section 3 */}
        <Text style={styles.sectionHeader}>3. How We Use Your Information</Text>
        <Text style={styles.bodyParagraph}>We use your information to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Create and manage your customer account.</Text>
          <Text style={styles.bulletItem}>•  Verify your mobile number and email address.</Text>
          <Text style={styles.bulletItem}>•  Process orders and payments.</Text>
          <Text style={styles.bulletItem}>•  Manage delivery and pickup services.</Text>
          <Text style={styles.bulletItem}>•  Provide order tracking and notifications.</Text>
          <Text style={styles.bulletItem}>•  Manage returns, refunds and customer support.</Text>
          <Text style={styles.bulletItem}>•  Maintain your wallet and transaction records.</Text>
          <Text style={styles.bulletItem}>•  Personalise product recommendations and shopping preferences.</Text>
          <Text style={styles.bulletItem}>•  Inform you about offers, discounts and seasonal products, subject to your preferences.</Text>
          <Text style={styles.bulletItem}>•  Improve application functionality and user experience.</Text>
          <Text style={styles.bulletItem}>•  Detect suspicious activities and prevent fraud.</Text>
          <Text style={styles.bulletItem}>•  Comply with applicable legal and regulatory requirements.</Text>
        </View>

        {/* Section 4 */}
        <Text style={styles.sectionHeader}>4. Payment Information</Text>
        <Text style={styles.bodyParagraph}>
          TOHFA Market may support different payment methods, depending on availability.
        </Text>
        <Text style={styles.bodyParagraph}>
          Payments may be processed through authorised third-party payment service providers.
        </Text>
        <Text style={styles.bodyParagraph}>
          We may receive payment confirmation, transaction references and payment status information. Your complete card details, UPI PIN, banking passwords and other sensitive payment credentials should be handled by the authorised payment provider and not stored by TOHFA Market unless explicitly required and lawfully permitted.
        </Text>

        {/* Section 5 */}
        <Text style={styles.sectionHeader}>5. Sharing of Information</Text>
        <Text style={styles.bodyParagraph}>
          We do not sell your personal information to third parties.
        </Text>
        <Text style={styles.bodyParagraph}>
          We may share relevant information with the following parties when necessary to provide our services:
        </Text>

        <Text style={styles.subSectionHeader}>5.1 Farmers and Suppliers</Text>
        <Text style={styles.bodyParagraph}>
          Relevant order information may be shared with participating farmers or suppliers to fulfil customer orders.
        </Text>

        <Text style={styles.subSectionHeader}>5.2 Delivery and Logistics Partners</Text>
        <Text style={styles.bodyParagraph}>
          Your name, contact number and delivery address may be shared with delivery partners to complete deliveries
        </Text>

        <Text style={styles.subSectionHeader}>5.3 Payment Service Providers</Text>
        <Text style={styles.bodyParagraph}>
          Necessary transaction information may be shared with payment providers to process payments, refunds and wallet transactions.
        </Text>

        <Text style={styles.subSectionHeader}>5.4 Technology and Service Providers</Text>
        <Text style={styles.bodyParagraph}>
          We may work with authorised service providers for hosting, application maintenance, analytics, communication and technical support.
        </Text>

        <Text style={styles.subSectionHeader}>5.5 Legal and Regulatory Authorities</Text>
        <Text style={styles.bodyParagraph}>
          We may disclose information when required by applicable law, legal processes or valid government requests.
        </Text>
        <Text style={styles.bodyParagraph}>
          Any sharing of personal information will be limited to what is necessary for the relevant purpose and subject to appropriate safeguards.
        </Text>

        {/* Section 6 */}
        <Text style={styles.sectionHeader}>6. Notifications and Communication Preferences</Text>
        <Text style={styles.bodyParagraph}>TOHFA Market may send notifications regarding:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Order confirmations and updates.</Text>
          <Text style={styles.bulletItem}>•  Delivery and pickup information.</Text>
          <Text style={styles.bulletItem}>•  Payment and refund updates.</Text>
          <Text style={styles.bulletItem}>•  Offers and discounts.</Text>
          <Text style={styles.bulletItem}>•  New and seasonal products.</Text>
          <Text style={styles.bulletItem}>•  Important account-related announcements.</Text>
        </View>
        <Text style={styles.bodyParagraph}>
          You can manage available notification preferences through the My Preferences section of the application or your device settings. Essential service-related communications may still be sent when necessary to fulfil your orders or maintain your account.
        </Text>

        {/* Section 7 */}
        <Text style={styles.sectionHeader}>7. Data Storage and Security</Text>
        <Text style={styles.bodyParagraph}>
          We take reasonable technical and organisational measures to protect your personal information against unauthorised access, disclosure, alteration, loss or misuse.
        </Text>
        <Text style={styles.bodyParagraph}>These measures may include:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Secure access controls.</Text>
          <Text style={styles.bulletItem}>•  Authentication and verification procedures.</Text>
          <Text style={styles.bulletItem}>•  Data encryption where appropriate.</Text>
          <Text style={styles.bulletItem}>•  Restricted access to authorised personnel.</Text>
          <Text style={styles.bulletItem}>•  Monitoring and security practices.</Text>
        </View>
        <Text style={styles.bodyParagraph}>
          However, no electronic storage or transmission method can be guaranteed to be completely secure.
        </Text>

        {/* Section 8 */}
        <Text style={styles.sectionHeader}>8. Data Retention</Text>
        <Text style={styles.bodyParagraph}>
          We retain your personal information only for as long as necessary to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>•  Provide our services.</Text>
          <Text style={styles.bulletItem}>•  Maintain your account and order history.</Text>
          <Text style={styles.bulletItem}>•  Process payments, returns and refunds.</Text>
          <Text style={styles.bulletItem}>•  Resolve customer complaints and disputes.</Text>
          <Text style={styles.bulletItem}>•  Meet legal, accounting and regulatory obligations.</Text>
        </View>
        <Text style={styles.bodyParagraph}>
          When information is no longer required, it will be deleted or anonymised in accordance with applicable laws and our data retention practices.
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
  subSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
    fontFamily: customerFonts.bold,
    marginTop: 14,
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

