/**
 * Pending Applications: the farmer application review queue
 * (GET /admin/farmer-applications, farmer.application.list_pending).
 *
 * Look: team design (tofhafarmfin-rbac) — back card, title, search, scrolling
 * filter chips with the custom scroll bar, avatar cards with a status badge.
 * Everything the design has is drawn. Where the API has no value the figure is
 * an em-dash:
 *   - The design's "All (9)", "Docs Complete (6)" and "Awaiting KYC (3)" chips
 *     are drawn with an em-dash count (the API has no totals). Docs Complete and
 *     Awaiting KYC have no data source, so they match nothing; Ooty / Kotagiri /
 *     Coonoor narrow the loaded rows by their location text (zone scoping
 *     proper is the server's job). The server's review statuses follow as
 *     extra chips.
 *   - The title count and the "N more below" footer carry em-dashes; the real
 *     Load more stays beneath it.
 *   - The subtitle keeps the design's "oldest first" wording although the
 *     server lists newest first.
 *   - Drafts and decided applications are never listed (pendingRows).
 *
 * Access fails closed: without farmer.application.list_pending (or with no
 * `can` at all) nothing is requested and a permission notice is shown.
 */
import React, { useRef, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import pinIconAsset from '../../assets/images/pin.png';
import { useApplicationList } from '../../api/farmerHooks';
import type { ApplicationRowView } from '../../api/farmerTypes';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { BackButtonCard, partStyles, StatusBadge } from './applications/ApplicationParts';
import {
  applicationAccess,
  filterLabel,
  listStatusParam,
  PENDING_FILTERS,
  pendingRows,
  rowLocation,
  searchApplications,
  statusLabel,
  statusTone,
  submittedLabel,
  toPendingApplicationItem,
  type PendingApplicationItem,
  type PendingFilter,
} from './applications/applicationLogic';

export type { PendingApplicationItem } from './applications/applicationLogic';

export interface AdminPendingApplicationsScreenProps {
  onBack: () => void;
  /** Gets an item built from the tapped row; the review screen fetches by its `id`. */
  onSelectApplication: (item: PendingApplicationItem) => void;
  /** Permission check from /auth/me. Missing = deny everything. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only (BR-30); not a filter. */
  warehouseId?: string | undefined;
}

const THUMB_SHARE = 0.65;

/** The design's own chips, drawn before the server's review statuses. */
type DesignFilter = 'DOCS' | 'KYC' | 'OOTY' | 'KOTAGIRI' | 'COONOOR';
type ScreenFilter = PendingFilter | DesignFilter;
const DESIGN_FILTERS: readonly DesignFilter[] = ['DOCS', 'KYC', 'OOTY', 'KOTAGIRI', 'COONOOR'];
const ZONE_TEXT: Readonly<Partial<Record<DesignFilter, string>>> = { OOTY: 'ooty', KOTAGIRI: 'kotagiri', COONOOR: 'coonoor' };
const SCREEN_FILTERS: readonly ScreenFilter[] = ['ALL', ...DESIGN_FILTERS, ...PENDING_FILTERS.filter((f) => f !== 'ALL')];

function screenFilterLabel(filter: ScreenFilter, noValue: string): string {
  if (filter === 'ALL') return t('farmerApps.list.filter.ALLCOUNT', { count: noValue });
  if (filter === 'DOCS') return t('farmerApps.list.filter.DOCS', { count: noValue });
  if (filter === 'KYC') return t('farmerApps.list.filter.KYC', { count: noValue });
  if (filter === 'OOTY' || filter === 'KOTAGIRI' || filter === 'COONOOR') return t(`farmerApps.list.filter.${filter}` satisfies TranslationKey);
  return filterLabel(filter);
}

function SearchIcon() {
  return (
    <Svg width={adminSpacing.input} height={adminSpacing.input} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke={adminColors.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M21 21L16.65 16.65" stroke={adminColors.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScrollTriangle({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M16 5L7 12L16 19Z' : 'M8 5L17 12L8 19Z';
  return (
    <Svg width={adminSpacing.smMd} height={adminSpacing.smMd} viewBox="0 0 24 24">
      <Path d={d} fill={adminColors.muted} />
    </Svg>
  );
}

function ApplicationCard({ row, onPress }: { row: ApplicationRowView; onPress: () => void }) {
  const location = rowLocation(row);
  const submitted = submittedLabel(row.submittedAt);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress} accessibilityRole="button" testID={`farmerApps.card.${row.id}`}>
      <View style={partStyles.avatar}>
        <Text style={partStyles.avatarText}>{row.initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{row.name === '' ? t('farmerApps.notAvailable') : row.name}</Text>
        <View style={styles.locationRow}>
          <Image source={pinIconAsset} style={styles.pinImage} resizeMode="contain" />
          <Text style={styles.locationText}>{location === '' ? submitted : `${location} · ${submitted}`}</Text>
        </View>
      </View>
      <StatusBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />
    </TouchableOpacity>
  );
}

export const AdminPendingApplicationsScreen: React.FC<AdminPendingApplicationsScreenProps> = ({
  onBack,
  onSelectApplication,
  can,
  warehouseId,
}) => {
  const access = applicationAccess(can);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ScreenFilter>('ALL');
  const noValue = t('farmerApps.notAvailable');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const filterScrollRef = useRef<ScrollViewInstance>(null);

  const serverFilter: PendingFilter = (DESIGN_FILTERS as readonly string[]).includes(filter) ? 'ALL' : (filter as PendingFilter);
  const status = listStatusParam(serverFilter);
  const list = useApplicationList(warehouseId, status === undefined ? {} : { status }, { enabled: access.canList });

  const pending = pendingRows(list.items);
  const searched = searchApplications(pending, searchQuery);
  const zoneText = ZONE_TEXT[filter as DesignFilter];
  const rows =
    filter === 'DOCS' || filter === 'KYC'
      ? []
      : zoneText !== undefined
        ? searched.filter((r) => rowLocation(r).toLowerCase().includes(zoneText))
        : searched;
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: pending.length });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      <View style={styles.header}>
        <BackButtonCard onPress={onBack} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          access.canList ? <RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={adminColors.brand} /> : undefined
        }
      >
        <Text style={styles.title} accessibilityRole="header">
          {t('farmerApps.list.title')}
        </Text>

        {!access.canList ? (
          <AdminEmptyState title={t('farmerApps.list.denied')} />
        ) : (
          <>
            <Text style={styles.subtitle}>{t('farmerApps.list.subtitleCounted', { count: noValue })}</Text>

            <View style={styles.searchBox}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder={t('farmerApps.list.searchPlaceholder')}
                placeholderTextColor={adminColors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                testID="farmerApps.search"
              />
            </View>

            <ScrollView
              ref={filterScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
              onScroll={(e) => {
                const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                const maxOffset = contentSize.width - layoutMeasurement.width;
                if (maxOffset > 0) setScrollProgress(Math.min(1, Math.max(0, contentOffset.x / maxOffset)));
              }}
              scrollEventThrottle={16}
            >
              {SCREEN_FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    activeOpacity={0.8}
                    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`farmerApps.filter.${f}`}
                  >
                    <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>{screenFilterLabel(f, noValue)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.scrollBarRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: adminSpacing.sm, bottom: adminSpacing.sm, left: adminSpacing.sm, right: adminSpacing.sm }}
                onPress={() => filterScrollRef.current?.scrollTo({ x: 0, animated: true })}
                accessibilityRole="button"
                accessibilityLabel={t('farmerApps.list.scrollStart')}
              >
                <ScrollTriangle direction="left" />
              </TouchableOpacity>
              <View style={styles.scrollTrack} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
                <View
                  style={[
                    styles.scrollThumb,
                    {
                      width: trackWidth * THUMB_SHARE,
                      transform: [{ translateX: scrollProgress * trackWidth * (1 - THUMB_SHARE) }],
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: adminSpacing.sm, bottom: adminSpacing.sm, left: adminSpacing.sm, right: adminSpacing.sm }}
                onPress={() => filterScrollRef.current?.scrollToEnd({ animated: true })}
                accessibilityRole="button"
                accessibilityLabel={t('farmerApps.list.scrollEnd')}
              >
                <ScrollTriangle direction="right" />
              </TouchableOpacity>
            </View>

            {view === 'loading' ? (
              <AdminLoadingState />
            ) : view === 'error' ? (
              <AdminErrorState error={list.error} onRetry={list.refresh} />
            ) : view === 'empty' ? (
              <AdminEmptyState title={t('farmerApps.list.empty')} />
            ) : rows.length === 0 ? (
              <AdminEmptyState title={t('farmerApps.list.emptyFiltered')} />
            ) : (
              <View style={styles.listSection}>
                {rows.map((row) => (
                  <ApplicationCard key={row.id} row={row} onPress={() => onSelectApplication(toPendingApplicationItem(row))} />
                ))}
              </View>
            )}

            {list.hasMore && view !== 'loading' && view !== 'error' ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={list.loadMore}
                activeOpacity={0.8}
                accessibilityRole="button"
                testID="farmerApps.loadMore"
              >
                <Text style={styles.loadMoreText}>{t('farmerApps.list.loadMore')}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.dashedFooter}>
              <Text style={styles.dashedFooterText}>{t('farmerApps.list.footer', { more: noValue, total: noValue })}</Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    paddingHorizontal: adminSpacing.input,
    paddingTop: adminSpacing.mdLg,
    paddingBottom: adminSpacing.xs,
  },
  container: { flex: 1 },
  content: {
    paddingHorizontal: adminSpacing.input,
    paddingTop: adminSpacing.md,
  },
  title: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xsSm,
  },
  subtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.smMd,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.mdLg,
    height: ADMIN_BUTTON_HEIGHT,
    marginBottom: adminSpacing.mdLg,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    paddingRight: adminSpacing.md,
  },
  pill: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    borderWidth: 1,
  },
  pillActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  pillInactive: { backgroundColor: adminColors.card, borderColor: adminColors.border },
  pillText: { ...adminType.rowTitle },
  pillTextActive: { color: adminColors.onBrand },
  pillTextInactive: { color: adminColors.ink },
  scrollBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.xsSm,
    marginBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.xs,
  },
  scrollTrack: {
    flex: 1,
    height: adminSpacing.xsSm,
    borderRadius: adminRadius.full,
    overflow: 'hidden',
  },
  scrollThumb: {
    position: 'absolute',
    top: 0,
    height: adminSpacing.xsSm,
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.full,
  },
  listSection: { gap: adminSpacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardInfo: { flex: 1, marginRight: adminSpacing.sm },
  cardName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  pinImage: {
    width: adminSpacing.mdLg,
    height: adminSpacing.mdLg,
    marginRight: adminSpacing.xs,
  },
  locationText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    flexShrink: 1,
  },
  loadMore: {
    marginTop: adminSpacing.lg,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { ...adminType.rowTitle, color: adminColors.ink },
  dashedFooter: {
    marginTop: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  dashedFooterText: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
  bottomSpacer: { height: adminSpacing.largeSection },
});
