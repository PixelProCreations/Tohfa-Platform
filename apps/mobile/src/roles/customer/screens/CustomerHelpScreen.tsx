import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';
import { groupHelpArticles, searchHelpGroups, useHelpArticles } from '../api/help';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

export interface CustomerHelpScreenProps {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onBack?: (() => void) | undefined;
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

// ── CATEGORY ICONS (by name; admin-managed categories fall back to the leaf) ────

function categoryIcon(category: string, color: string): React.ReactNode {
  const c = category.toLowerCase();
  if (/order|deliver/.test(c)) return <PackageOutlineSvg color={color} />;
  if (/pay|wallet|money/.test(c)) return <WalletOutlineSvg color={color} />;
  if (/return|refund/.test(c)) return <ReturnOutlineSvg color={color} />;
  if (/account|profile|login/.test(c)) return <UserOutlineSvg color={color} />;
  return <LeafOutlineSvg color={color} />;
}

export const CustomerHelpScreen: React.FC<CustomerHelpScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const query = useHelpArticles();

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);
  // undefined = default (first category and its first question open, as in Figma)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => (query.data ? groupHelpArticles(query.data) : []), [query.data]);
  const filtered = useMemo(() => searchHelpGroups(groups, searchQuery), [groups, searchQuery]);
  const searching = searchQuery.trim().length > 0;
  const contact = query.data?.contact;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER (EXACT FIGMA: (<-) Help & FAQs) ─────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel={t('customer.account.help.back')}
          >
            <BackArrowSvg color="#1A2E1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.account.help.title')}</Text>
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
            placeholder={t('customer.account.help.searchPlaceholder')}
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel={t('customer.account.help.searchA11y')}
          />
          <SearchSvg color="#6B7280" size={20} />
        </View>

        {query.isLoading ? (
          <ActivityIndicator accessibilityLabel={t('customer.account.help.loadingA11y')} style={{ marginTop: 32 }} />
        ) : query.isError ? (
          <View style={{ alignItems: 'center', marginTop: 32, gap: 8 }} accessibilityRole="alert">
            <Text style={styles.answerText}>{mapProblem(query.error).message}</Text>
            <TouchableOpacity onPress={() => void query.refetch()} accessibilityLabel={t('customer.account.help.retryA11y')}>
              <Text style={{ color: customerColors.brand, fontWeight: '700' }}>{t('customer.account.help.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={[styles.answerText, { textAlign: 'center', marginTop: 32 }]}>
            {searching ? t('customer.account.help.noMatch') : t('customer.account.help.noArticles')}
          </Text>
        ) : (
          /* ── FAQ CATEGORIES ACCORDION ──────────────────────────────────────── */
          <View style={styles.accordionContainer}>
            {filtered.map((group, groupIndex) => {
              const isCategoryExpanded = searching || (expandedCategories[group.category] ?? groupIndex === 0);

              return (
                <View key={group.category} style={styles.categoryBlock}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setExpandedCategories((prev) => ({ ...prev, [group.category]: !isCategoryExpanded }))
                    }
                    style={styles.categoryHeaderRow}
                    accessibilityLabel={group.category}
                  >
                    <View style={styles.categoryIconWrap}>{categoryIcon(group.category, customerColors.brand)}</View>
                    <Text style={styles.categoryTitle}>{group.category}</Text>
                    {isCategoryExpanded ? (
                      <ChevronDownSvg color="#1A2E1A" size={18} />
                    ) : (
                      <ChevronRightSvg color="#1A2E1A" size={18} />
                    )}
                  </TouchableOpacity>

                  {isCategoryExpanded && (
                    <View style={styles.questionsContainer}>
                      {group.articles.map((item, itemIndex) => {
                        const isQuestionExpanded =
                          searching || (expandedQuestions[item.id] ?? (groupIndex === 0 && itemIndex === 0));
                        const label = `${itemIndex + 1}. ${item.title}`;

                        return (
                          <View key={item.id} style={styles.questionBlock}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => setExpandedQuestions((prev) => ({ ...prev, [item.id]: !isQuestionExpanded }))}
                              style={styles.questionHeaderRow}
                              accessibilityLabel={label}
                            >
                              <Text style={styles.questionText}>{label}</Text>
                              {isQuestionExpanded ? (
                                <ChevronDownSvg color="#1A2E1A" size={16} />
                              ) : (
                                <ChevronUpSvg color="#1A2E1A" size={16} />
                              )}
                            </TouchableOpacity>

                            {isQuestionExpanded && (
                              <View style={styles.answerWrap}>
                                <Text style={styles.answerText}>{item.body}</Text>
                              </View>
                            )}
                            <View style={styles.questionDivider} />
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.categoryDivider} />
                </View>
              );
            })}
          </View>
        )}

        {/* ── STILL NEED HELP? ──────────────────────────────────────────────── */}
        <View style={{ marginTop: 20, gap: 6 }}>
          <Text style={styles.categoryTitle}>{t('customer.account.help.stillNeedHelp')}</Text>
          {contact?.phone ? <Text style={styles.answerText}>{t('customer.account.help.call', { phone: contact.phone })}</Text> : null}
          {contact?.email ? <Text style={styles.answerText}>{t('customer.account.help.email', { email: contact.email })}</Text> : null}
          <TouchableOpacity onPress={() => onNavigate?.('ContactSupport')} accessibilityLabel={t('customer.account.help.contactSupport')}>
            <Text style={{ color: customerColors.brand, fontWeight: '700' }}>{t('customer.account.help.contactSupport')}</Text>
          </TouchableOpacity>
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
