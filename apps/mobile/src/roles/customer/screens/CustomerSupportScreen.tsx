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
  customerRadius,
  customerSpacing,
} from '../theme';
import { useSupportTickets, formatSupportDateTime, type SupportTab, type TicketStatus } from '../api/support';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

export interface CustomerSupportScreenProps {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onBack?: (() => void) | undefined;
}

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
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

const HeadsetSvg = ({ color = '#2E7D32', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 18v-6a9 9 0 0118 0v6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightSvg = ({ color = '#2E7D32', size = 12 }: { color?: string; size?: number }) => (
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

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const tickets = (query.data?.pages ?? []).flatMap((pg) => pg.items);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await query.refetch();
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
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.support.title')}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate?.('ContactSupport')}
          accessibilityLabel={t('customer.support.newRequest')}
          style={{ marginLeft: 'auto' }}
        >
          <Text style={{ color: customerColors.brand, fontWeight: '700', fontSize: 13 }}>{t('customer.support.newRequestCta')}</Text>
        </TouchableOpacity>
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
          {TABS.map(tab => {
            const isActive = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                onPress={() => setSelectedTab(tab.id)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                accessibilityLabel={t('customer.support.tabA11y', { label: t(`customer.support.tab.${tab.labelKey}`) })}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {t(`customer.support.tab.${tab.labelKey}`)}
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
          <Text style={[styles.ticketBodyText, { textAlign: 'center', marginTop: 32 }]}>
            {t('customer.support.empty')}
          </Text>
        ) : (
          <View style={styles.ticketList}>
            {tickets.map(ticket => (
              <TouchableOpacity
                key={ticket.id}
                activeOpacity={0.8}
                onPress={() => onNavigate?.('TrackSupportRequest', { ticketId: ticket.id })}
                style={styles.ticketCard}
                accessibilityLabel={t('customer.support.requestA11y', { number: ticket.ticketNumber })}
              >
                <View style={styles.ticketHeaderRow}>
                  <Text style={styles.ticketNumberText}>{ticket.ticketNumber}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{STATUS_LABEL_KEY[ticket.status] ? t(`customer.support.tab.${STATUS_LABEL_KEY[ticket.status]}`) : ticket.status}</Text>
                    <ChevronRightSvg size={11} color={customerColors.brand} />
                  </View>
                </View>

                <View style={styles.ticketBodyRow}>
                  <HeadsetSvg size={15} color={customerColors.brand} />
                  <Text style={styles.ticketBodyText}>{ticket.subject}</Text>
                </View>

                <Text style={styles.ticketDateText}>{formatSupportDateTime(ticket.createdAt)}</Text>
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
                  <Text style={{ color: customerColors.brand, fontWeight: '700' }}>{t('customer.support.loadMore')}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  tabPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: customerRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabPillActive: {
    backgroundColor: '#E9F7E9',
    borderColor: customerColors.brand,
  },
  tabPillText: {
    fontSize: 11,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  tabPillTextActive: {
    color: customerColors.brand,
    fontWeight: '600',
    fontFamily: customerFonts.semibold,
  },
  ticketList: {
    gap: 14,
  },
  ticketCard: {
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.heading,
    fontFamily: customerFonts.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF8EE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: customerRadius.pill,
  },
  statusBadgeText: {
    fontSize: 11,
    color: customerColors.brand,
    fontWeight: '500',
    fontFamily: customerFonts.regular,
  },
  ticketBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ticketBodyText: {
    fontSize: 12,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  ticketDateText: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
});

