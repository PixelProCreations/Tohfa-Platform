/**
 * The design's Listing Approval Queue (origin/tofhafarmfin-rbac
 * screens/dashboard/ListingApprovalQueueScreen.tsx, "Screen 44"), on the live
 * GET /admin/listings queue. Same look: round back button, title, "N listings
 * awaiting review", grade tabs, cards with Approve / Counter / Reject.
 *
 * Live, not fixtures: rows come from useListingQueue (PENDING_APPROVAL only).
 * The grade tabs filter the rows loaded so far (the API has no grade filter);
 * scrolling near the end loads the next page.
 *
 * Writes: Approve sends at once (as the design's card did) with the host's
 * warehouse as the purchase-order destination; Reject and Counter open a sheet
 * for the fields the spec requires. A success toast is raised only from the
 * write's onDone (after the server answered); a failure shows its
 * adminErrorKey string.
 *
 * Not in the design and added only as required states: loading, error (tap to
 * retry), empty, no access, and the action error banner.
 */
import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, TouchableOpacity, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Icon, SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../api/errors';
import type { ListingQueueRow } from '../../api/listings';
import { useApproveListing, useListingQueue, useRejectListing, useSendCounterOffer } from '../../api/listingsHooks';
import type { ToastData } from '../../components/TohfaToast';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminSpacing } from '../../theme';
import { CounterSheet, RejectSheet } from './ListingActionSheets';
import { ListingQueueCard } from './ListingQueueCard';
import { approvedToast, counterSentToast, gradeLabel, rejectedToast } from './listingsLabels';
import { approveBody, filterByGrade, GRADE_TABS, listingAccess, type GradeTab } from './listingsLogic';
import { styles } from './listingsStyles';

/** How close to the bottom (px) a scroll must get before the next page loads. Layout only. */
const LOAD_MORE_EDGE = adminSpacing.modalGap * 2;

export interface ListingApprovalQueueScreenProps {
  can: Can;
  onBack: () => void;
  warehouseId?: string | undefined;
  showToast: (toast: ToastData) => void;
}

type Sheet = { kind: 'reject'; row: ListingQueueRow } | { kind: 'counter'; row: ListingQueueRow } | null;

function errorText(err: unknown): string | null {
  return err === null || err === undefined ? null : t(adminErrorKey(err));
}

export function ListingApprovalQueueScreen({ can, onBack, warehouseId, showToast }: ListingApprovalQueueScreenProps) {
  const access = listingAccess(can);
  const [grade, setGrade] = useState<GradeTab>('ALL');
  const [sheet, setSheet] = useState<Sheet>(null);

  const list = useListingQueue(warehouseId, { enabled: access.view });
  const approve = useApproveListing({ enabled: access.approve });
  const reject = useRejectListing({ enabled: access.reject });
  const counter = useSendCounterOffer({ enabled: access.counter });
  const busy = approve.isPending || reject.isPending || counter.isPending;
  const destination = approveBody(warehouseId);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet !== null) setSheet(null);
      else onBack();
      return true;
    });
    return () => sub.remove();
  }, [sheet, onBack]);

  const rows = access.view ? filterByGrade(list.items, grade) : [];

  const onApprove = (row: ListingQueueRow) => {
    if (destination === null || busy) return;
    approve.run(row.id, destination, () => {
      approve.finish();
      showToast(approvedToast(row.cropName));
    });
  };

  const openSheet = (next: Exclude<Sheet, null>) => {
    if (busy) return;
    (next.kind === 'reject' ? reject : counter).finish();
    setSheet(next);
  };

  const closeSheet = () => {
    if (sheet?.kind === 'reject') reject.finish();
    if (sheet?.kind === 'counter') counter.finish();
    setSheet(null);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (list.hasMore && layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_EDGE) list.loadMore();
  };

  const approveError = errorText(approve.error);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('listingsAdmin.back')}
          testID="listingsAdmin.back"
        >
          <Icon name="chevron_right" size={20} color={adminColors.ink} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={200}
        testID="listingsAdmin.scroll"
      >
        <Text style={styles.title}>{t('listingsAdmin.title')}</Text>
        <Text style={styles.subtitle}>
          {rows.length === 1 ? t('listingsAdmin.subtitle.one') : t('listingsAdmin.subtitle.other', { count: rows.length })}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer} style={styles.tabsScroll}>
          {GRADE_TABS.map((tab) => {
            const isActive = grade === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setGrade(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                testID={`listingsAdmin.tab.${tab}`}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{gradeLabel(tab)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {approveError === null ? null : (
          <View style={styles.errorBanner} testID="listingsAdmin.actionError">
            <Text style={styles.errorText}>{approveError}</Text>
          </View>
        )}

        <QueueBody
          viewAllowed={access.view}
          isLoading={list.isLoading}
          error={list.error}
          isEmpty={rows.length === 0}
          onRetry={list.refresh}
        >
          <View style={styles.listingList}>
            {rows.map((row) => (
              <ListingQueueCard
                key={row.id}
                row={row}
                access={access}
                canApprove={destination !== null}
                busy={busy}
                onApprove={onApprove}
                onCounter={(r) => openSheet({ kind: 'counter', row: r })}
                onReject={(r) => openSheet({ kind: 'reject', row: r })}
              />
            ))}
          </View>
        </QueueBody>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {sheet?.kind === 'reject' ? (
        <RejectSheet
          row={sheet.row}
          isPending={reject.isPending}
          errorText={errorText(reject.error)}
          onCancel={closeSheet}
          onConfirm={(body) =>
            reject.run(sheet.row.id, body, () => {
              reject.finish();
              setSheet(null);
              showToast(rejectedToast(sheet.row.cropName));
            })
          }
        />
      ) : null}

      {sheet?.kind === 'counter' ? (
        <CounterSheet
          row={sheet.row}
          isPending={counter.isPending}
          errorText={errorText(counter.error)}
          onCancel={closeSheet}
          onConfirm={(body) =>
            counter.run(sheet.row.id, body, () => {
              counter.finish();
              setSheet(null);
              showToast(counterSentToast(sheet.row.cropName));
            })
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

interface QueueBodyProps {
  viewAllowed: boolean;
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  onRetry: () => void;
  children: React.ReactNode;
}

function QueueBody({ viewAllowed, isLoading, error, isEmpty, onRetry, children }: QueueBodyProps) {
  if (!viewAllowed) return <StateBox text={t('listingsAdmin.state.noAccess')} />;
  if (isLoading) return <StateBox text={t('listingsAdmin.state.loading')} />;
  if (error !== null && error !== undefined && isEmpty) {
    return (
      <TouchableOpacity onPress={onRetry} activeOpacity={0.7} accessibilityRole="button" testID="listingsAdmin.state.retry">
        <StateBox text={t(adminErrorKey(error))} hint={t('listingsAdmin.state.retry')} />
      </TouchableOpacity>
    );
  }
  if (isEmpty) return <StateBox text={t('listingsAdmin.state.empty')} />;
  return <>{children}</>;
}

function StateBox({ text, hint }: { text: string; hint?: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateText}>{text}</Text>
      {hint === undefined ? null : <Text style={styles.stateRetry}>{hint}</Text>}
    </View>
  );
}
