/**
 * Help & Support for the Main and Sub warehouse admins (FINAL_LIST #79).
 *
 * Was SubWarehouseHelpSupportScreen, which also drew the report-issue form
 * and the "request submitted" page inline. Those are now the shared
 * storage-ops ReportIssueScreen / IssueSubmittedScreen ('support' mode, W4
 * storage-ops part B); this screen hands a report request to its host
 * (`onReportIssue`, which opens StorageFlow on ReportIssue) instead of
 * importing another area.
 *
 * Gates (docs/rbac.json):
 *   - FAQs, search, categories and contact cards: open to every signed-in admin.
 *   - "Report an Issue" (the primary CTA and each FAQ's "Report an issue" link):
 *     only with support.ticket.create_own, which is `none` for MAIN_WH_ADMIN
 *     and SUB_WH_ADMIN today, so it is effectively hidden (SPEC_GAPS W4l-5).
 *   - "My Support Requests" list: only with support.ticket.view_all (`view`
 *     for both warehouse roles).
 */
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { EmptyState, SearchBar, SectionTitle, StatusBadge, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { FAQ_ITEMS, SUPPORT_CONTACT, SUPPORT_TICKETS } from './fixtures';
import { ChevronRightIcon, HelpCircleIcon, PROFILE_CODES, profileLayout } from './ProfileParts';
import type { FaqCategory, FaqItem, SupportTicketItem, WarehouseScreenBaseProps } from './types';

export interface HelpSupportScreenProps extends WarehouseScreenBaseProps {
  faqs?: readonly FaqItem[] | undefined;
  tickets?: readonly SupportTicketItem[] | undefined;
  /**
   * Open the host's report-issue form for a category. Offered only when
   * can('support.ticket.create_own') also passes.
   */
  onReportIssue?: ((category: FaqCategory) => void) | undefined;
}

interface IconProps {
  color: string;
}

function GettingStartedIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19l7-7 3 3-7 7-3-3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 2l7.586 7.586" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="11" cy="11" r="1.5" fill={color} />
    </Svg>
  );
}

function WarehouseIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V10l9-6 9 6v11H3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6a3 3 0 0 1 6 0v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BagIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BoxIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function DocumentIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 7h6M9 11h6M9 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
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

function TicketIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13 5v2M13 11v2M13 17v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

const CATEGORIES: readonly { id: FaqCategory; shortLabel: string; Icon: (props: IconProps) => React.JSX.Element }[] = [
  { id: 'Getting Started', shortLabel: 'Start', Icon: GettingStartedIcon },
  { id: 'Warehouse Operations', shortLabel: 'Operations', Icon: WarehouseIcon },
  { id: 'Orders', shortLabel: 'Orders', Icon: BagIcon },
  { id: 'Inventory', shortLabel: 'Inventory', Icon: BoxIcon },
  { id: 'Billing', shortLabel: 'Billing', Icon: InvoiceIcon },
  { id: 'Wallet', shortLabel: 'Wallet', Icon: WalletIcon },
  { id: 'Reports', shortLabel: 'Reports', Icon: DocumentIcon },
  { id: 'Account & Security', shortLabel: 'Security', Icon: ShieldIcon },
];

const TICKET_TONE = { Open: 'warning', 'Under Review': 'warning', Resolved: 'success' } as const;

export function HelpSupportScreen({
  can,
  onBack,
  faqs = FAQ_ITEMS,
  tickets = SUPPORT_TICKETS,
  onReportIssue,
}: HelpSupportScreenProps) {
  const [category, setCategory] = useState<FaqCategory | null>(null);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(faqs[0]?.id ?? null);

  // Display only: the server enforces support.ticket.* again.
  const reportIssue = can(PROFILE_CODES.ticketCreate) ? onReportIssue : undefined;
  const showTickets = can(PROFILE_CODES.ticketViewAll);

  const visibleFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (faq) =>
        (category === null || faq.category === category) &&
        (q === '' ||
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.category.toLowerCase().includes(q)),
    );
  }, [faqs, category, query]);

  const toggleCategory = (next: FaqCategory) => {
    if (category === next) {
      setCategory(null);
      return;
    }
    setCategory(next);
    const first = faqs.find((faq) => faq.category === next);
    if (first) setExpandedId(first.id);
  };

  return (
    <WalletScreen title="Help & Support" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search FAQs, topics, or issues..." />
        </View>

        <SectionTitle
          right={
            category !== null ? (
              <TouchableOpacity onPress={() => setCategory(null)} accessibilityRole="button">
                <Text style={styles.link}>Show All ({faqs.length})</Text>
              </TouchableOpacity>
            ) : undefined
          }
        >
          HELP CATEGORIES
        </SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <CategoryChip label="All Topics" count={faqs.length} active={category === null} onPress={() => setCategory(null)} />
          {CATEGORIES.map(({ id, shortLabel, Icon }) => (
            <CategoryChip
              key={id}
              label={shortLabel}
              count={faqs.filter((faq) => faq.category === id).length}
              active={category === id}
              icon={<Icon color={category === id ? adminColors.onBrand : adminColors.brandDeep} />}
              onPress={() => toggleCategory(id)}
            />
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {CATEGORIES.map(({ id, Icon }) => {
            const active = category === id;
            return (
              <TouchableOpacity
                key={`grid-${id}`}
                style={[styles.gridTile, active && styles.gridTileActive]}
                onPress={() => toggleCategory(id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.gridIcon, active && styles.gridIconActive]}>
                  <Icon color={active ? adminColors.brand : adminColors.brandDeep} />
                </View>
                <Text style={[styles.gridLabel, active && styles.gridLabelActive]} numberOfLines={1}>
                  {id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionTitle right={<StatusBadge label={`${visibleFaqs.length} Questions`} tone="brandSoft" />}>
          {category ? `${category.toUpperCase()} FAQS` : 'FREQUENTLY ASKED QUESTIONS'}
        </SectionTitle>
        {visibleFaqs.length === 0 ? (
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
            {visibleFaqs.map((faq) => {
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
                        <TouchableOpacity style={styles.faqReport} onPress={() => reportIssue(faq.category)} accessibilityRole="button">
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

        <SectionTitle>NEED MORE HELP?</SectionTitle>
        <View style={styles.contactGrid}>
          <ContactCard
            icon={<PhoneIcon color={adminColors.brand} />}
            title="Call Helpline"
            value={SUPPORT_CONTACT.phone}
            badge={SUPPORT_CONTACT.phoneHours}
            onPress={() => Alert.alert('Customer Support', `Calling TOHFA Warehouse Helpdesk:\n${SUPPORT_CONTACT.phone}`)}
          />
          <ContactCard
            icon={<MailIcon color={adminColors.brand} />}
            title="Email Support"
            value={SUPPORT_CONTACT.email}
            badge={SUPPORT_CONTACT.emailHours}
            onPress={() => Alert.alert('Email Support', `Drafting email to:\n${SUPPORT_CONTACT.email}`)}
          />
        </View>

        {reportIssue ? (
          <View style={styles.reportButton}>
            <WalletButton
              label="Report an Issue"
              icon={<HelpCircleIcon color={adminColors.onBrand} />}
              onPress={() => reportIssue(category ?? 'Warehouse Operations')}
            />
          </View>
        ) : null}

        {showTickets ? (
          <>
            <SectionTitle right={<Text style={styles.meta}>{tickets.length} Active Ticket{tickets.length === 1 ? '' : 's'}</Text>}>
              MY SUPPORT REQUESTS
            </SectionTitle>
            {tickets.length === 0 ? (
              <EmptyState title="No support requests." />
            ) : (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() =>
                    Alert.alert(`Ticket ${ticket.id}`, `Subject: ${ticket.subject}\nStatus: ${ticket.status}\nOpened: ${ticket.openedOn}`)
                  }
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.ticketIcon}>
                    <TicketIcon color={adminColors.brand} />
                  </View>
                  <View style={styles.ticketText}>
                    <Text style={styles.ticketTitle}>{ticket.subject}</Text>
                    <Text style={styles.meta}>
                      {ticket.id} · {ticket.openedOn} · {ticket.category}
                    </Text>
                  </View>
                  <StatusBadge label={ticket.status} tone={TICKET_TONE[ticket.status]} />
                  <ChevronRightIcon />
                </TouchableOpacity>
              ))
            )}
          </>
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
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  badge: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactCard} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.meta}>{value}</Text>
      <View style={styles.contactBadge}>
        <Text style={styles.contactBadgeText}>{badge}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Icon circle diameters: icon sizes, not spacing.
const GRID_ICON = 32;
const FAQ_CHEVRON = 28;
const CONTACT_ICON = 36;
const TICKET_ICON = 40;

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

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  gridTile: {
    width: '23%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  gridTileActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  gridIcon: {
    width: GRID_ICON,
    height: GRID_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconActive: { backgroundColor: adminColors.card },
  gridLabel: { ...adminType.caption, color: adminColors.ink, textAlign: 'center' },
  gridLabelActive: { color: adminColors.brand },

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
  contactBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.xs,
    marginTop: adminSpacing.xs,
  },
  contactBadgeText: { ...adminType.caption, color: adminColors.brandDeep },

  reportButton: { marginTop: adminSpacing.lg },

  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  ticketIcon: {
    width: TICKET_ICON,
    height: TICKET_ICON,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketText: { flex: 1 },
  ticketTitle: { ...adminType.rowTitle, color: adminColors.ink },
});
