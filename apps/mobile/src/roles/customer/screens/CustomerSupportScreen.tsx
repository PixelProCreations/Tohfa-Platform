import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
} from '../theme';
import { TicketSvg } from '../components/ContactSupportIcons';
import { useSupportTickets, formatSupportDateTime, type SupportTab, type TicketStatus } from '../api/support';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

export interface CustomerSupportScreenProps {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onBack?: (() => void) | undefined;
}

const BackArrowSvg = ({ color = customerColors.neutral.neutral900, size = 18 }: { color?: string; size?: number }) => (
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

const ChevronRightSvg = ({ color = customerColors.neutral.neutral500, size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TABS: Array<{ id: SupportTab; labelKey: 'all' | 'open' | 'inReview' | 'resolved' | 'cancelled' }> = [
  { id: 'ALL', labelKey: 'all' },
  { id: 'OPEN', labelKey: 'open' },
  { id: 'IN_REVIEW', labelKey: 'inReview' },
  { id: 'RESOLVED', labelKey: 'resolved' },
  { id: 'CANCELLED', labelKey: 'cancelled' },
];

const STATUS_LABEL_KEY: Record<TicketStatus, 'open' | 'inReview' | 'resolved' | 'cancelled'> = {
  OPEN: 'open',
  IN_PROGRESS: 'inReview',
  RESOLVED: 'resolved',
  CLOSED: 'resolved',
  CANCELLED: 'cancelled',
};

export const CustomerSupportScreen: React.FC<CustomerSupportScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<SupportTab>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const query = useSupportTickets(selectedTab);
  const allQuery = useSupportTickets('ALL');

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const tickets = (query.data?.pages ?? []).flatMap((pg) => pg.items);
  const allTickets = (allQuery.data?.pages ?? []).flatMap((pg) => pg.items);
  const sourceTickets = allTickets.length > 0 ? allTickets : tickets;

  const totalCount = allQuery.data?.pages[0]?.total ?? sourceTickets.length;
  const openCount = sourceTickets.filter((t) => t.status === 'OPEN').length;
  const inReviewCount = sourceTickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = sourceTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const cancelledCount = sourceTickets.filter((t) => t.status === 'CANCELLED').length;

  const getTabCount = (tabId: SupportTab): number => {
    switch (tabId) {
      case 'ALL':
        return totalCount;
      case 'OPEN':
        return openCount;
      case 'IN_REVIEW':
        return inReviewCount;
      case 'RESOLVED':
        return resolvedCount;
      case 'CANCELLED':
        return cancelledCount;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([query.refetch(), allQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel={t('customer.support.back')}
          >
            <BackArrowSvg color={customerColors.neutral.neutral900} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.support.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* ── FILTER PILL TABS ────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((tab) => {
            const isActive = selectedTab === tab.id;
            const count = getTabCount(tab.id);
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                onPress={() => setSelectedTab(tab.id)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                accessibilityLabel={t('customer.support.tabA11y', { label: t(`customer.support.tab.${tab.labelKey}`) })}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {`${t(`customer.support.tab.${tab.labelKey}`)} (${count})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── TICKETS LIST ────────────────────────────────────────────────────── */}
        {query.isLoading ? (
          <ActivityIndicator accessibilityLabel={t('customer.support.loading')} style={{ marginTop: 32 }} />
        ) : query.isError && tickets.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 32, gap: 8 }} accessibilityRole="alert">
            <Text style={styles.ticketBodyText}>{mapProblem(query.error).message}</Text>
            <TouchableOpacity onPress={() => void query.refetch()} accessibilityLabel={t('customer.support.retryA11y')}>
              <Text style={{ color: customerColors.brand, fontWeight: '700' }}>{t('customer.support.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : tickets.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <Text style={[styles.ticketBodyText, { textAlign: 'center' }]}>
              {t('customer.support.empty')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate?.('ContactSupport', { mode: 'create' })}
              style={styles.newRequestButton}
              accessibilityLabel={t('customer.support.newRequest')}
            >
              <Text style={styles.newRequestButtonText}>{t('customer.support.newRequestCta')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ticketList}>
            {tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                activeOpacity={0.8}
                onPress={() => onNavigate?.('TrackSupportRequest', { ticketId: ticket.id })}
                style={styles.ticketCard}
                accessibilityLabel={t('customer.support.requestA11y', { number: ticket.ticketNumber })}
              >
                <View style={styles.ticketCardRow}>
                  {/* Left Green Ticket Voucher Outline Icon */}
                  <View style={styles.ticketIconBox}>
                    <TicketSvg color={customerColors.palette.green.bright} size={24} />
                  </View>

                  {/* Middle Details */}
                  <View style={styles.ticketInfoColumn}>
                    <Text style={styles.ticketNumberText}>{ticket.ticketNumber}</Text>
                    <Text style={styles.ticketSubjectText} numberOfLines={1}>
                      {ticket.subject}
                    </Text>
                    <Text style={styles.ticketDateText}>
                      {formatSupportDateTime(ticket.createdAt)}
                    </Text>
                  </View>

                  {/* Right Status Badge & Chevron */}
                  <View style={styles.ticketRightGroup}>
                    <View
                      style={[
                        styles.statusBadge,
                        ticket.status === 'OPEN' ? styles.statusBadgeOpen : styles.statusBadgeOther,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          ticket.status === 'OPEN' ? styles.statusTextOpen : styles.statusTextOther,
                        ]}
                      >
                        {STATUS_LABEL_KEY[ticket.status]
                          ? t(`customer.support.tab.${STATUS_LABEL_KEY[ticket.status]}`)
                          : ticket.status}
                      </Text>
                    </View>
                    <ChevronRightSvg size={14} color={customerColors.neutral.neutral500} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {query.hasNextPage ? (
              <TouchableOpacity
                onPress={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                accessibilityLabel={t('customer.support.loadMoreA11y')}
                style={{ alignItems: 'center', paddingVertical: 12 }}
              >
                {query.isFetchingNextPage ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={{ color: customerColors.brand, fontWeight: '700' }}>
                    {t('customer.support.loadMore')}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customerColors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: customerColors.white,
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral300,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral900,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 24,
    color: customerColors.neutral.neutral900,
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  tabPill: {
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral400,
    backgroundColor: customerColors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  tabPillActive: {
    backgroundColor: customerColors.palette.green.dew,
    borderColor: customerColors.palette.green.bright,
  },
  tabPillText: {
    fontSize: 12,
    color: customerColors.neutral.neutral900,
    fontFamily: customerFonts.semibold,
    fontWeight: '500',
  },
  tabPillTextActive: {
    color: customerColors.shared.success,
    fontWeight: '600',
    fontFamily: customerFonts.semibold,
  },
  ticketList: {
    gap: 0,
  },
  ticketCard: {
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral100,
    paddingVertical: 14,
  },
  ticketCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIconBox: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketInfoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  ticketNumberText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
    fontFamily: customerFonts.bold,
  },
  ticketSubjectText: {
    fontSize: 12,
    color: customerColors.neutral.neutral600,
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  ticketDateText: {
    fontSize: 11,
    color: customerColors.neutral.neutral500,
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  ticketRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeOpen: {
    backgroundColor: customerColors.palette.green.dew,
  },
  statusBadgeOther: {
    backgroundColor: customerColors.neutral.neutral100,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '500',
    fontFamily: customerFonts.semibold,
  },
  statusTextOpen: {
    color: customerColors.shared.success,
  },
  statusTextOther: {
    color: customerColors.neutral.neutral600,
  },
  ticketBodyText: {
    fontSize: 13,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  newRequestButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: customerColors.primary,
  },
  newRequestButtonText: {
    color: customerColors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});


