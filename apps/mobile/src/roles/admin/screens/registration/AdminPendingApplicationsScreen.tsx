/**
 * Pending Applications: the farmer application review queue
 * (GET /admin/farmer-applications, farmer.application.list_pending).
 *
 * Look: team design (origin/Superadmin-main AdminPendingApplicationsScreen) —
 * 44pt back card, large brown title, search, scrolling filter chips with the
 * custom scroll bar, avatar cards with a status badge, dashed footer. Every
 * size, gap and radius below is the design's own number, expressed through the
 * admin tokens. Where the API has no value the figure is an em-dash:
 *   - The design's "All (9)", "Docs Complete (6)" and "Awaiting KYC (3)" chips
 *     are drawn with an em-dash count (the API has no totals). Docs Complete and
 *     Awaiting KYC have no data source, so they are drawn disabled
 *     (DESIGN-ONLY). Ooty / Kotagiri / Coonoor narrow the loaded rows by their
 *     location text (zone scoping proper is the server's job). The server's
 *     review statuses (PENDING_FILTERS) follow as extra chips.
 *   - The title count and the "N more below" footer carry em-dashes; the real
 *     Load more stays beneath the list.
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
import { tokens } from '@tohfa/design-tokens';
import Svg, { Path } from 'react-native-svg';
import pinIconAsset from '../../assets/images/pin.png';
import { useApplicationList } from '../../api/farmerHooks';
import type { ApplicationRowView } from '../../api/farmerTypes';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { ChevronBackIcon } from './applications/ApplicationParts';
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
  type ApplicationTone,
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

/**
 * One point. The design sets several values one or a few points off a token
 * (15, 27, 9, 7, 46, ...); they are written as token ± steps of this so no
 * bare number lands in a style.
 */
const PT = adminSpacing.xs / 4;

/** The design's scroll-bar arrows are text glyphs, not icons. */
const ARROW_LEFT = '◀';
const ARROW_RIGHT = '▶';

/** The design's own chips, drawn before the server's review statuses. */
type DesignFilter = 'DOCS' | 'KYC' | 'OOTY' | 'KOTAGIRI' | 'COONOOR';
type ScreenFilter = PendingFilter | DesignFilter;
const DESIGN_FILTERS: readonly DesignFilter[] = ['DOCS', 'KYC', 'OOTY', 'KOTAGIRI', 'COONOOR'];
/** Design chips with no data source at all: drawn, never selectable. */
const UNAVAILABLE_FILTERS: ReadonlySet<ScreenFilter> = new Set<ScreenFilter>(['DOCS', 'KYC']);
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
    <Svg width={adminSpacing.input} height={adminSpacing.input} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
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

/** The design's back button: a 44pt white card, 1.5 stroke, chevron. */
function BackCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('farmerApps.back')}
      testID="farmerApps.back"
    >
      <ChevronBackIcon color={adminColors.ink} />
    </TouchableOpacity>
  );
}

/** The design's card badge: 12/700 on a soft tone, 12×6 padding, radius 14. */
function CardBadge({ label, tone }: { label: string; tone: ApplicationTone }) {
  return (
    <View style={[styles.badge, { backgroundColor: adminColors[tone].bg }]}>
      <Text style={[styles.badgeText, { color: adminColors[tone].text }]}>{label}</Text>
    </View>
  );
}

function ApplicationCard({ row, onPress }: { row: ApplicationRowView; onPress: () => void }) {
  const location = rowLocation(row);
  const submitted = submittedLabel(row.submittedAt);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress} accessibilityRole="button" testID={`farmerApps.card.${row.id}`}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{row.initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{row.name === '' ? t('farmerApps.notAvailable') : row.name}</Text>
        <View style={styles.locationRow}>
          <Image source={pinIconAsset} style={styles.pinImage} resizeMode="contain" />
          <Text style={styles.locationText}>{location === '' ? submitted : `${location} · ${submitted}`}</Text>
        </View>
      </View>
      <CardBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />
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
  const rows = zoneText !== undefined ? searched.filter((r) => rowLocation(r).toLowerCase().includes(zoneText)) : searched;
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: pending.length });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      <View style={styles.header}>
        <BackCard onPress={onBack} />
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
                const pillStyle = [styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive];
                const textStyle = [styles.filterPillText, active ? styles.filterPillTextActive : styles.filterPillTextInactive];
                if (UNAVAILABLE_FILTERS.has(f)) {
                  return (
                    // DESIGN-ONLY: no endpoint yet (the API reports neither document completeness nor KYC state per application).
                    <TouchableOpacity
                      key={f}
                      disabled
                      style={[...pillStyle, styles.unavailable]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: true, selected: false }}
                      testID={`farmerApps.filter.${f}`}
                    >
                      <Text style={textStyle}>{screenFilterLabel(f, noValue)}</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    activeOpacity={0.8}
                    style={pillStyle}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`farmerApps.filter.${f}`}
                  >
                    <Text style={textStyle}>{screenFilterLabel(f, noValue)}</Text>
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
                <Text style={styles.scrollArrow}>{ARROW_LEFT}</Text>
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
                <Text style={styles.scrollArrow}>{ARROW_RIGHT}</Text>
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
  backButton: {
    width: tokens.size.minTouchTarget,
    height: tokens.size.minTouchTarget,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
    // design shadowRadius 3: the token's blur taken as-is (rnShadow halves it).
    shadowRadius: tokens.shadow.adminSm.blur,
  },
  container: { flex: 1 },
  content: {
    paddingHorizontal: adminSpacing.input,
    paddingTop: adminSpacing.md,
  },
  title: {
    // design 27: no token.
    fontSize: tokens.typeStyle.h1.size - PT,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xsSm,
    letterSpacing: -0.4,
  },
  subtitle: {
    // design 13.5 / 19: no token.
    fontSize: adminType.body.fontSize + PT / 2,
    lineHeight: adminType.body.lineHeight + PT,
    color: adminColors.muted,
    // design 18: no token.
    marginBottom: adminSpacing.lg + adminSpacing.xs / 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.mdLg,
    height: ADMIN_BUTTON_HEIGHT,
    marginBottom: adminSpacing.mdLg,
  },
  searchIcon: { marginRight: adminSpacing.smMd },
  searchInput: {
    flex: 1,
    // design 15: no token.
    fontSize: tokens.typeStyle.body.size + PT,
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
  filterPill: {
    paddingHorizontal: adminSpacing.lg,
    // design 9: no token.
    paddingVertical: adminSpacing.sm + PT,
    // design 22: no token.
    borderRadius: adminSpacing.input + adminSpacing.xs / 2,
    borderWidth: 1,
  },
  filterPillActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  filterPillInactive: { backgroundColor: adminColors.card, borderColor: adminColors.border },
  filterPillText: {
    fontSize: adminType.body.fontSize,
    fontWeight: '600',
  },
  filterPillTextActive: { color: adminColors.onBrand },
  filterPillTextInactive: { color: adminColors.ink },
  /** A DESIGN-ONLY control: drawn as designed but visibly not available. */
  unavailable: { opacity: 0.45 },
  scrollBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xsSm,
    marginBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.xs,
  },
  scrollArrow: {
    // design 9: no token.
    fontSize: adminType.caption.fontSize - PT,
    color: adminColors.muted,
    // design 5: no token.
    marginHorizontal: adminSpacing.xs + PT,
  },
  scrollTrack: {
    flex: 1,
    // design 7: no token.
    height: adminSpacing.xsSm + PT,
    borderRadius: tokens.radius.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollThumb: {
    position: 'absolute',
    top: 0,
    // design 7: no token.
    height: adminSpacing.xsSm + PT,
    backgroundColor: adminColors.muted,
    borderRadius: tokens.radius.xs,
  },
  listSection: { gap: adminSpacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    // design 18: no token.
    borderRadius: adminRadius.xl + adminSpacing.xs / 2,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.lg,
    // design shadow 0 2 5 / 0.03, elevation 2: no token.
    shadowColor: adminColors.shadow,
    shadowOffset: { ...adminShadow.sm.shadowOffset, height: adminSpacing.xs / 2 },
    shadowOpacity: 0.03,
    shadowRadius: adminSpacing.xs + PT,
    elevation: 2,
  },
  avatarCircle: {
    // design 46: no token.
    width: ADMIN_BUTTON_HEIGHT - adminSpacing.xs / 2,
    height: ADMIN_BUTTON_HEIGHT - adminSpacing.xs / 2,
    borderRadius: (ADMIN_BUTTON_HEIGHT - adminSpacing.xs / 2) / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.mdLg,
  },
  avatarText: {
    fontSize: tokens.typeStyle.body.size,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  cardInfo: { flex: 1 },
  cardName: {
    // design 15: no token.
    fontSize: tokens.typeStyle.body.size + PT,
    fontWeight: '700',
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
    fontSize: tokens.typeStyle.small.size,
    color: adminColors.muted,
    flexShrink: 1,
  },
  badge: {
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xsSm,
  },
  badgeText: {
    fontSize: tokens.typeStyle.small.size,
    fontWeight: '700',
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
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    // design 24: no radius token.
    borderRadius: adminSpacing.xl,
    // design 18: no token.
    paddingVertical: adminSpacing.lg + adminSpacing.xs / 2,
    paddingHorizontal: adminSpacing.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  dashedFooterText: {
    fontSize: tokens.typeStyle.body.size,
    lineHeight: tokens.typeStyle.body.lineHeight,
    fontWeight: '400',
    color: adminColors.muted,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  // design 36: no token.
  bottomSpacer: { height: adminSpacing.xxl + adminSpacing.xs },
});
