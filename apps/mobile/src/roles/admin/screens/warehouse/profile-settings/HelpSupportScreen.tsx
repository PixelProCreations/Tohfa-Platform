/**
 * Help & Support for the Main and Sub warehouse admins (FINAL_LIST #79).
 *
 * Was SubWarehouseHelpSupportScreen, which also drew the report-issue form
 * and the "request submitted" page inline. Those are now the shared
 * storage-ops ReportIssueScreen / IssueSubmittedScreen ('support' mode, W4
 * storage-ops part B); this screen hands a report request to its host
 * (`onReportIssue`) instead of importing another area.
 *
 * Live (plan phase 8, BR-82): GET /admin/help in the admin's language gives
 * the PUBLISHED articles, the categories that have one, and the contact card.
 * Content is admin-managed and nothing is seeded, so a fresh system shows the
 * empty state. A contact channel the Super Admin / TOHFA Admin has not set is
 * null and its card is hidden: no phone number or address is invented.
 * Categories are the server's text, so the chips show them as sent (the
 * design's fixed eight-tile icon grid had nothing to key on and is gone).
 *
 * Gates (docs/rbac.json):
 *   - Articles, search, categories and contact cards: help.article.view (`all`
 *     for every admin role; the server enforces it).
 *   - "Report an Issue" (the CTA and each article's link): only with
 *     support.ticket.create_own, `none` for MAIN_WH_ADMIN and SUB_WH_ADMIN, so
 *     it is hidden. Admin support tickets are not built (BR-82).
 *   - The "My Support Requests" list is hidden: there is no endpoint for an
 *     admin's own support requests (BR-82: admin support tickets are NOT built;
 *     support.ticket.view_all covers customer tickets, Customers area).
 */
import React, { useMemo, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { EmptyState, SearchBar, SectionTitle, StatusBadge, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { HelpCircleIcon, PROFILE_CODES, profileLayout } from './ProfileParts';
import type { FaqCategory, HelpArticleView, HelpView, WarehouseScreenBaseProps } from './types';

export interface HelpSupportScreenProps extends WarehouseScreenBaseProps {
  /** The live help (GET /admin/help); undefined until it loads. */
  help?: HelpView | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /**
   * Open the host's report-issue form. Offered only when
   * can('support.ticket.create_own') also passes.
   */
  onReportIssue?: ((category: FaqCategory) => void) | undefined;
}

interface IconProps {
  color: string;
}

function PhoneIcon({ color }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MailIcon({ color }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronIcon({ up, color }: { up: boolean; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d={up ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** What "Report an Issue" opens on: the host form takes one of the design's categories. */
const REPORT_CATEGORY: FaqCategory = 'Warehouse Operations';

function call(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => Alert.alert(t('profile.help.callTitle'), phone));
}

function email(address: string) {
  Linking.openURL(`mailto:${address}`).catch(() => Alert.alert(t('profile.help.emailTitle'), address));
}

export function HelpSupportScreen({
  can,
  onBack,
  help,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onReportIssue,
}: HelpSupportScreenProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const articles: readonly HelpArticleView[] = help?.articles ?? [];
  const categories: readonly string[] = help?.categories ?? [];
  // support.ticket.create_own is `none` for both warehouse roles: no report path is offered.
  const reportIssue = can(PROFILE_CODES.ticketCreate) && onReportIssue ? () => onReportIssue(REPORT_CATEGORY) : undefined;

  const visibleArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(
      (article) =>
        (category === null || article.category === category) &&
        (q === '' ||
          article.question.toLowerCase().includes(q) ||
          article.answer.toLowerCase().includes(q) ||
          article.category.toLowerCase().includes(q)),
    );
  }, [articles, category, query]);

  const state = help !== undefined ? 'ready' : queryViewState({ isLoading, error, itemCount: 0 });
  if (state !== 'ready' || help === undefined) {
    return (
      <WalletScreen title="Help & Support" onBack={onBack}>
        {state === 'loading' ? <AdminLoadingState /> : <AdminErrorState error={error} onRetry={onRetry} />}
      </WalletScreen>
    );
  }

  const { phone, email: mailbox } = help.contact;

  return (
    <WalletScreen title="Help & Support" onBack={onBack}>
      <ScrollView
        contentContainerStyle={profileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
      >
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search FAQs, topics, or issues..." />
        </View>

        {categories.length > 0 ? (
          <>
            <SectionTitle
              right={
                category !== null ? (
                  <TouchableOpacity onPress={() => setCategory(null)} accessibilityRole="button">
                    <Text style={styles.link}>{t('profile.help.showAll', { count: articles.length })}</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              HELP CATEGORIES
            </SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              <CategoryChip label="All Topics" count={articles.length} active={category === null} onPress={() => setCategory(null)} />
              {categories.map((name) => (
                <CategoryChip
                  key={name}
                  label={name}
                  count={articles.filter((article) => article.category === name).length}
                  active={category === name}
                  onPress={() => setCategory(category === name ? null : name)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <SectionTitle right={<StatusBadge label={t('profile.help.questionCount', { count: visibleArticles.length })} tone="brandSoft" />}>
          {category !== null ? t('profile.help.categoryTitle', { category: category.toUpperCase() }) : 'FREQUENTLY ASKED QUESTIONS'}
        </SectionTitle>
        {articles.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState title={t('profile.help.empty')} />
          </View>
        ) : visibleArticles.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState title="No matching questions found." />
            <TouchableOpacity
              onPress={() => {
                setCategory(null);
                setQuery('');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Reset Search & Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.faqList}>
            {visibleArticles.map((faq) => {
              const expanded = expandedId === faq.id;
              return (
                <View key={faq.id} style={[styles.faqCard, expanded && styles.faqCardExpanded]}>
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => setExpandedId(expanded ? null : faq.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <View style={styles.faqQuestionWrap}>
                      {category === null ? <StatusBadge label={faq.category} tone="brandSoft" /> : null}
                      <Text style={[styles.faqQuestion, expanded && styles.faqQuestionActive]}>{faq.question}</Text>
                    </View>
                    <View style={[styles.faqChevron, expanded && styles.faqChevronActive]}>
                      <ChevronIcon up={expanded} color={expanded ? adminColors.brand : adminColors.muted} />
                    </View>
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      {reportIssue ? (
                        <TouchableOpacity style={styles.faqReport} onPress={reportIssue} accessibilityRole="button">
                          <Text style={styles.link}>Need help with this? Report an issue →</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {phone !== null || mailbox !== null ? (
          <>
            <SectionTitle>NEED MORE HELP?</SectionTitle>
            <View style={styles.contactGrid}>
              {phone !== null ? (
                <ContactCard icon={<PhoneIcon color={adminColors.brand} />} title="Call Helpline" value={phone} onPress={() => call(phone)} />
              ) : null}
              {mailbox !== null ? (
                <ContactCard icon={<MailIcon color={adminColors.brand} />} title="Email Support" value={mailbox} onPress={() => email(mailbox)} />
              ) : null}
            </View>
          </>
        ) : null}

        {reportIssue ? (
          <View style={styles.reportButton}>
            <WalletButton label="Report an Issue" icon={<HelpCircleIcon color={adminColors.onBrand} />} onPress={reportIssue} />
          </View>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

function CategoryChip({
  label,
  count,
  active,
  icon,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  icon?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      {/* Active count badge was 25% translucent white on orange; nearest solid token is brandDeep. */}
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ContactCard({
  icon,
  title,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactCard} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.meta}>{value}</Text>
    </TouchableOpacity>
  );
}

// Icon circle diameters: icon sizes, not spacing.
const FAQ_CHEVRON = 28;
const CONTACT_ICON = 36;

const styles = StyleSheet.create({
  searchWrap: { marginTop: adminSpacing.sm },
  link: { ...adminType.caption, color: adminColors.brand },
  meta: { ...adminType.rowMeta, color: adminColors.muted },

  chipScroll: { gap: adminSpacing.sm, paddingVertical: adminSpacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  chipActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  chipText: { ...adminType.rowTitle, color: adminColors.ink },
  chipTextActive: { color: adminColors.onBrand },
  chipBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.xs,
  },
  chipBadgeActive: { backgroundColor: adminColors.brandDeep },
  chipBadgeText: { ...adminType.caption, color: adminColors.muted },
  chipBadgeTextActive: { color: adminColors.onBrand },

  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    paddingBottom: adminSpacing.lg,
  },
  faqList: { gap: adminSpacing.sm },
  faqCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  faqCardExpanded: { borderColor: adminColors.brandSoft.border },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  faqQuestionWrap: { flex: 1, gap: adminSpacing.xs },
  faqQuestion: { ...adminType.rowTitle, color: adminColors.ink },
  faqQuestionActive: { color: adminColors.brand },
  faqChevron: {
    width: FAQ_CHEVRON,
    height: FAQ_CHEVRON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqChevronActive: { backgroundColor: adminColors.brandTint },
  faqAnswerBox: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  faqAnswer: { ...adminType.body, color: adminColors.muted },
  faqReport: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },

  contactGrid: { flexDirection: 'row', gap: adminSpacing.sm },
  contactCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
  },
  contactIcon: {
    width: CONTACT_ICON,
    height: CONTACT_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs,
  },
  contactTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: 2 },

  reportButton: { marginTop: adminSpacing.lg },

});
