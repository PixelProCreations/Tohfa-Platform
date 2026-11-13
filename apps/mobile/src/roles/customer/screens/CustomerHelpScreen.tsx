import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';

export interface CustomerHelpScreenProps {
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

const SearchSvg = ({ color = '#6B7280', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.8} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
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

const ChevronDownSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronUpSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 15l-6-6-6 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Green Outline Category Icons matching Figma exactly
const PackageOutlineSvg = ({ color = '#2E7D32', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.29 7L12 12.01L20.71 7M12 22.08V12"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletOutlineSvg = ({ color = '#2E7D32', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const ReturnOutlineSvg = ({ color = '#2E7D32', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 14l-4-4 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 10h11a4 4 0 014 4v2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LeafOutlineSvg = ({ color = '#2E7D32', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M2 21c0-3 1.85-5.36 5.08-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const UserOutlineSvg = ({ color = '#2E7D32', size = 22 }: { color?: string | undefined; size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
    <Path
      d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ── FAQ DATA SPEC (EXACT FIGMA SCREENS) ────────────────────────────────────────

interface FaqItem {
  id: string;
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: (color?: string) => React.ReactNode;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'orders_delivery',
    title: 'Orders & Delivery',
    icon: (color) => <PackageOutlineSvg color={color || '#2E7D32'} size={22} />,
    items: [
      {
        id: 'od_1',
        q: '1. How can I track my order?',
        a: 'You can track your order from My Orders. Select your order to view its current status, estimated delivery details and order updates.',
      },
      {
        id: 'od_2',
        q: '2. How do I know if my order is confirmed?',
        a: 'Once your order is successfully placed, you will receive an order confirmation with your Order ID and payment details.',
      },
      {
        id: 'od_3',
        q: '3. Can I change my delivery address after placing an order?',
        a: 'Address changes may be possible before your order is processed. Contact our support team as soon as possible to check whether the address can be updated.',
      },
      {
        id: 'od_4',
        q: '4. How can I check my estimated delivery date?',
        a: 'Open My Orders, select your order and check the estimated delivery information. Delivery timelines depend on your location and product availability.',
      },
      {
        id: 'od_5',
        q: '5. Can I cancel my order?',
        a: 'You can request cancellation from the order details page if your order is still eligible for cancellation. Once processing or dispatch has started, cancellation may not be available.',
      },
    ],
  },
  {
    id: 'payments_wallet',
    title: 'Payments & Wallet',
    icon: (color) => <WalletOutlineSvg color={color || '#2E7D32'} size={22} />,
    items: [
      {
        id: 'pw_1',
        q: '1. How can I add money to my TOHFA Wallet?',
        a: 'Go to My Wallet, tap Add Money, enter the amount and complete the payment.',
      },
      {
        id: 'pw_2',
        q: '2. Which payment methods are supported?',
        a: 'You can pay using the payment options available at checkout, such as UPI, cards and net banking.',
      },
      {
        id: 'pw_3',
        q: '3. How can I check my wallet transaction history?',
        a: 'Open My Wallet and select Transaction History to view all credits, debits and refunds.',
      },
      {
        id: 'pw_4',
        q: '4. How long does a refund take to reach my wallet?',
        a: 'Eligible refunds are credited according to the refund policy. Check your wallet for the updated balance.',
      },
      {
        id: 'pw_5',
        q: '5. What should I do if money is deducted but my order fails?',
        a: 'Check your transaction history first. If the amount is not refunded, contact TOHFA Support with your payment details.',
      },
    ],
  },
  {
    id: 'returns_refunds',
    title: 'Returns & Refunds',
    icon: (color) => <ReturnOutlineSvg color={color || '#2E7D32'} size={22} />,
    items: [
      {
        id: 'rr_1',
        q: '1. How can I return a product?',
        a: 'Go to My Orders, select the order and tap Return Order to submit a request.',
      },
      {
        id: 'rr_2',
        q: '2. Which products are eligible for return?',
        a: "Only products that meet TOHFA Market's return policy are eligible for return or replacement.",
      },
      {
        id: 'rr_3',
        q: '3. How can I check my return request status?',
        a: 'Open your order and tap Track Request to view the latest return status.',
      },
      {
        id: 'rr_4',
        q: '4. How long does it take to receive a refund?',
        a: 'Refund processing time depends on the payment method and return approval status.',
      },
      {
        id: 'rr_5',
        q: '5. What should I do if I receive damaged or poor-quality products?',
        a: 'Raise a return request through My Orders and upload clear photos as evidence.',
      },
    ],
  },
  {
    id: 'products_quality',
    title: 'Products & Quality',
    icon: (color) => <LeafOutlineSvg color={color || '#2E7D32'} size={22} />,
    items: [
      {
        id: 'pq_1',
        q: '1. How can I check product details?',
        a: 'Select a product to view its description, origin, price, quantity and freshness details.',
      },
      {
        id: 'pq_2',
        q: '2. Are TOHFA Market products sourced from local farmers?',
        a: 'Yes, products are sourced from participating farmers across the Nilgiris region.',
      },
      {
        id: 'pq_3',
        q: '3. How can I identify organic products?',
        a: 'Check the product details for available organic and quality certifications or labels.',
      },
      {
        id: 'pq_4',
        q: '4. What should I do if I receive a poor-quality product?',
        a: 'Go to My Orders, select the product and raise a Product Support or Return Request.',
      },
      {
        id: 'pq_5',
        q: '5. How can I check product availability?',
        a: 'Product availability is updated based on farmer supply and your delivery or pickup location.',
      },
    ],
  },
  {
    id: 'account_profile',
    title: 'Account & Profile',
    icon: (color) => <UserOutlineSvg color={color || '#2E7D32'} size={22} />,
    items: [
      {
        id: 'ap_1',
        q: '1. How can I update my profile details?',
        a: 'Go to My Profile, select Edit Profile, update your details and tap Save Changes.',
      },
      {
        id: 'ap_2',
        q: '2. How can I change my registered email address?',
        a: 'Open Edit Profile, select your email address, enter the new email and complete OTP verification.',
      },
      {
        id: 'ap_3',
        q: '3. How can I update my delivery address?',
        a: 'Go to My Addresses, select Add New Address or edit an existing address and save it.',
      },
      {
        id: 'ap_4',
        q: '4. How can I change my profile picture?',
        a: 'Open Edit Profile, tap the profile photo icon and upload or capture a new picture.',
      },
      {
        id: 'ap_5',
        q: '5. How can I delete or deactivate my account?',
        a: 'Contact TOHFA Support to request account deactivation or deletion and follow the verification process.',
      },
    ],
  },
];

export const CustomerHelpScreen: React.FC<CustomerHelpScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // By default in Figma Image 1, "Orders & Delivery" is open
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    orders_delivery: true,
  });
  // In Image 1, question 1 of Orders & Delivery is open with its answer
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({
    od_1: true,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Filter categories and questions when searching
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQ_CATEGORIES;

    return FAQ_CATEGORIES.map((cat) => {
      const catMatch = cat.title.toLowerCase().includes(q);
      const matchedItems = cat.items.filter(
        (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
      );

      if (catMatch || matchedItems.length > 0) {
        return {
          ...cat,
          items: catMatch ? cat.items : matchedItems,
        };
      }
      return null;
    }).filter(Boolean) as FaqCategory[];
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER (EXACT FIGMA: (<-) Help & FAQs) ─────────────────────────── */}
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
          <Text style={styles.headerTitle}>Help & FAQs</Text>
        </View>
      </View>
      <View style={styles.headerBottomDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SEARCH BAR (PILL INPUT WITH SEARCH ICON ON RIGHT) ─────────────── */}
        <View style={[styles.searchBox, customerShadow.subtle]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <SearchSvg color="#6B7280" size={20} />
        </View>

        {/* ── FAQ CATEGORIES ACCORDION ────────────────────────────────────────── */}
        <View style={styles.accordionContainer}>
          {filteredCategories.map((category) => {
            // When user searches, auto-expand categories
            const isCategoryExpanded =
              searchQuery.trim().length > 0 || !!expandedCategories[category.id];

            return (
              <View key={category.id} style={styles.categoryBlock}>
                {/* Category Header Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleCategory(category.id)}
                  style={styles.categoryHeaderRow}
                  accessibilityLabel={category.title}
                >
                  <View style={styles.categoryIconWrap}>
                    {category.icon(customerColors.brand)}
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  {isCategoryExpanded ? (
                    <ChevronDownSvg color="#1A2E1A" size={18} />
                  ) : (
                    <ChevronRightSvg color="#1A2E1A" size={18} />
                  )}
                </TouchableOpacity>

                {/* Expanded Questions for this category */}
                {isCategoryExpanded && (
                  <View style={styles.questionsContainer}>
                    {category.items.map((item) => {
                      const isQuestionExpanded =
                        searchQuery.trim().length > 0 || !!expandedQuestions[item.id];

                      return (
                        <View key={item.id} style={styles.questionBlock}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleQuestion(item.id)}
                            style={styles.questionHeaderRow}
                            accessibilityLabel={item.q}
                          >
                            <Text style={styles.questionText}>{item.q}</Text>
                            {isQuestionExpanded ? (
                              <ChevronDownSvg color="#1A2E1A" size={16} />
                            ) : (
                              <ChevronUpSvg color="#1A2E1A" size={16} />
                            )}
                          </TouchableOpacity>

                          {/* Answer text */}
                          {isQuestionExpanded && (
                            <View style={styles.answerWrap}>
                              <Text style={styles.answerText}>{item.a}</Text>
                            </View>
                          )}
                          <View style={styles.questionDivider} />
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Category Bottom Divider */}
                <View style={styles.categoryDivider} />
              </View>
            );
          })}
        </View>

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
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: customerRadius.pill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A2E1A',
    fontFamily: customerFonts.regular,
    paddingVertical: 0,
  },
  accordionContainer: {
    width: '100%',
  },
  categoryBlock: {
    width: '100%',
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  categoryIconWrap: {
    width: 28,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#1A2E1A',
    fontFamily: customerFonts.semibold,
  },
  questionsContainer: {
    paddingLeft: 4,
    paddingRight: 2,
    paddingBottom: 4,
  },
  questionBlock: {
    paddingVertical: 6,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A2E1A',
    lineHeight: 19,
    fontFamily: customerFonts.semibold,
  },
  answerWrap: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  answerText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
    fontFamily: customerFonts.regular,
  },
  questionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginTop: 6,
  },
  categoryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});
