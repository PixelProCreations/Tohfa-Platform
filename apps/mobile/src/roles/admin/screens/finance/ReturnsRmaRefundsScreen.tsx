/**
 * Accounts & Finance > Returns, RMA & Refunds. The design's list (HEAD port of
 * origin/Superadmin-main), fed by the live returns queue (GET /admin/returns).
 * Every one of the six docs/openapi.yaml ReturnStatus values has its own label
 * (financeReturnView): APPROVED is "Approved", never "Refunded"; only REFUNDED
 * is. A tap opens ReturnsRmaDetailScreen with the return's id, which reads
 * GET /admin/returns/{id} itself (useReturn) instead of rebuilding it here.
 */
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';
import { financeReturnView, ReturnsRmaDetailScreen } from './ReturnsRmaDetailScreen';
import { useReturnList } from '../warehouse/returns-rma/useReturnsData';
import type { ReturnRowView } from '../warehouse/returns-rma/types';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export { financeReturnView };

/** Kept for the finance barrel (screens/finance/index.ts): one row of the live queue. */
export type ReturnListItem = ReturnRowView;

export interface ReturnsRmaRefundsScreenProps {
  can?: ((permission: string) => boolean) | undefined;
  onBack: () => void;
}

export function ReturnsRmaRefundsScreen({ can, onBack }: ReturnsRmaRefundsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const list = useReturnList(undefined, undefined);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return list.items;
    const q = searchQuery.toLowerCase().trim();
    return list.items.filter(
      (item: ReturnRowView) =>
        item.reference.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q) ||
        item.created.toLowerCase().includes(q) ||
        t(financeReturnView(item.status).labelKey).toLowerCase().includes(q),
    );
  }, [list.items, searchQuery]);

  // R4: counts of loaded rows are totals only once every page is in.
  const complete = !list.hasMore;
  const countText = complete ? String(list.items.length) : ADMIN_NO_VALUE;
  const pendingText = complete ? String(list.items.filter((r) => r.status === 'PENDING').length) : ADMIN_NO_VALUE;

  if (selectedReturnId !== null) {
    return <ReturnsRmaDetailScreen returnId={selectedReturnId} can={can} onBack={() => setSelectedReturnId(null)} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns, RMA & Refunds</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Counter Line ── */}
        <Text style={styles.counterText}>{t('wiringPayouts.returns.counter', { count: countText, pending: pendingText })}</Text>

        {/* ── Cards List ── */}
        {list.isLoading ? (
          <AdminLoadingState label={t('wiringPayouts.returns.loading')} />
        ) : list.error && list.items.length === 0 ? (
          <AdminErrorState error={list.error} onRetry={list.refresh} />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState
            title={t('wiringPayouts.returns.empty.title')}
            subtitle={t(searchQuery ? 'wiringPayouts.returns.empty.search' : 'wiringPayouts.returns.empty.subtitle')}
          />
        ) : (
          filteredItems.map((item) => {
            const view = financeReturnView(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.returnCard}
                onPress={() => setSelectedReturnId(item.id)}
                activeOpacity={0.8}
                testID={`returnsRma.open.${item.id}`}
              >
                <View style={styles.cardHeaderRow}>
                  {/* The order is only a uuid on the summary, so the title carries the return reference alone (R9). */}
                  <Text style={styles.cardTitle}>{item.reference}</Text>
                  <View style={[styles.statusBadge, view.tone === 'amber' ? styles.badgeAmber : view.tone === 'green' ? styles.badgeGreen : styles.badgeRed]}>
                    <Text
                      style={[styles.badgeText, view.tone === 'amber' ? styles.badgeTextAmber : view.tone === 'green' ? styles.badgeTextGreen : styles.badgeTextRed]}
                      testID={`returnsRma.status.${item.id}`}
                    >
                      {t(view.labelKey)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardSubtitle}>{item.reason || ADMIN_NO_VALUE}</Text>
                <Text style={styles.cardSubtitle2}>{item.created || ADMIN_NO_VALUE}</Text>

                {/* Action Text */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setSelectedReturnId(item.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={styles.actionBtnText}>
                    {t(view.closed ? 'wiringPayouts.returns.action.details' : 'wiringPayouts.returns.action.review')}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...adminType.caption,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 10,
  },
  returnCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeText: {
    ...adminType.caption,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  cardSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  cardSubtitle2: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
});
