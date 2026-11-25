/**
 * Tohfa Admin Work Queue tab, ported from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "WORK QUEUE TAB (M1-S03
 * · Work Queue)"): brand header with back, a search bar with the filter
 * trigger, a pending count, and one card per task (title + status badge,
 * person, reference, detail, created / due line, outlined action button).
 *
 * Data is live: GET /admin/tasks for the cards and GET /admin/tasks/summary
 * for the count (BR-77), gated by task.own.view (no request without it; the
 * server checks again). Every card comes from the API; the design's three
 * sample tasks, its "6 pending · 3 blocked / exception" line and its sample
 * warehouses / assignees are not shown. See ./workQueueLogic.ts for what the
 * API does not carry and how the design's fields map onto it.
 *
 * Action: one outlined button per card, as in the design. Its label is the
 * action the task supports (Open Order / Review Receipt / Review Return) and
 * it calls the host's open-callback for that type. The flows open at their
 * list: none takes a task's record id from here yet. With no callback the
 * button stays drawn but disabled. The design has no Mark as Done control, so
 * none is drawn.
 *
 * Changes from the design, and why: the search placeholder reads "Search
 * tasks" (the design's "Search common or scientific name" was copied from the
 * produce screen: a design copy error to flag to the owner); the count line
 * keeps "blocked / exception" but shows "—" for it (no such state to count);
 * "Load more" appears when the server has another page.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Can } from '../../permissions/can';
import { t, type TranslationKey } from '../../i18n';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';
import { BackArrowIcon, FilterSlidersIcon, SearchIcon, WORK_QUEUE_ICON } from './workQueueIcons';
import { WorkQueueFilterSheet } from './WorkQueueFilterSheet';
import {
  DEFAULT_WORK_QUEUE_FILTERS,
  apiTaskTypeFor,
  applyWorkQueueFilters,
  type WorkQueueCard,
  type WorkQueueCardStatus,
  type WorkQueueDestination,
  type WorkQueueFilters,
} from './workQueueLogic';
import { workQueueStyles as styles } from './workQueueStyles';
import { useWorkQueueSummary, useWorkQueueTasks } from './useWorkQueueData';

/** docs/rbac.json codes this screen checks. */
export const WORK_QUEUE_CODES = {
  view: 'task.own.view',
  warehouses: 'warehouse.all.view',
} as const;

export interface WorkQueueScreenProps {
  can: Can;
  onBack: () => void;
  /** Open the orders module (ORDER_PACK / ORDER_DISPATCH / ORDER_PICKUP_OTP tasks). */
  onOpenOrders?: (() => void) | undefined;
  /** Open receiving (GOODS_RECEIPT_QC tasks). */
  onOpenReceiving?: (() => void) | undefined;
  /** Open returns (RETURN_INSPECTION / RETURN_APPROVAL tasks). */
  onOpenReturns?: (() => void) | undefined;
}

const STATUS_BADGE: Record<WorkQueueCardStatus, TranslationKey> = {
  pending: 'workQueue.status.pending',
  overdue: 'workQueue.status.overdue',
  done: 'workQueue.status.done',
};

const OPEN_LABEL: Record<WorkQueueDestination, TranslationKey> = {
  orders: 'workQueue.action.openOrder',
  receiving: 'workQueue.action.openReceipt',
  returns: 'workQueue.action.openReturn',
};

function badgeStyles(status: WorkQueueCardStatus) {
  if (status === 'overdue') return [styles.badgeDanger, styles.badgeTextDanger] as const;
  if (status === 'done') return [styles.badgeSuccess, styles.badgeTextSuccess] as const;
  return [styles.badgeWarning, styles.badgeTextWarning] as const;
}

interface TaskCardProps {
  card: WorkQueueCard;
  onOpen: (() => void) | undefined;
}

function TaskCard({ card, onOpen }: TaskCardProps) {
  const [badgeBg, badgeText] = badgeStyles(card.status);
  return (
    <View testID={`workQueue.card.${card.itemKey}`} style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <View style={[styles.badge, badgeBg]}>
          <Text style={[styles.badgeText, badgeText]}>{t(STATUS_BADGE[card.status])}</Text>
        </View>
      </View>
      {card.person !== null ? <Text style={styles.personName}>{card.person}</Text> : null}
      {card.code !== null ? <Text style={styles.taskCode}>{card.code}</Text> : null}
      {card.detail !== null ? <Text style={styles.taskDetail}>{card.detail}</Text> : null}
      <Text style={styles.taskCreated}>{card.createdLine}</Text>
      <TouchableOpacity
        testID={`workQueue.card.${card.itemKey}.open`}
        style={[styles.actionButton, onOpen === undefined && styles.actionButtonDisabled]}
        onPress={onOpen}
        disabled={onOpen === undefined}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ disabled: onOpen === undefined }}
      >
        <Text style={styles.actionText}>{t(OPEN_LABEL[card.destination])}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function WorkQueueScreen({ can, onBack, onOpenOrders, onOpenReceiving, onOpenReturns }: WorkQueueScreenProps) {
  const allowed = can(WORK_QUEUE_CODES.view);
  const canPickWarehouse = allowed && can(WORK_QUEUE_CODES.warehouses);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<WorkQueueFilters>(DEFAULT_WORK_QUEUE_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const apiType = apiTaskTypeFor(filters.type);
  // A design category with no task source asks for nothing.
  const sourced = apiType !== null;
  const warehouseId = canPickWarehouse ? filters.warehouseId : undefined;

  const list = useWorkQueueTasks(
    { type: apiType ?? undefined, warehouseId },
    allowed && sourced,
  );
  const summary = useWorkQueueSummary(warehouseId, allowed);
  const warehouses = useWarehouseOptions({ enabled: canPickWarehouse });

  const cards = useMemo(
    () => (sourced ? applyWorkQueueFilters(list.items, filters, search, new Date()) : []),
    [sourced, list.items, filters, search],
  );

  const openFor: Record<WorkQueueDestination, (() => void) | undefined> = {
    orders: onOpenOrders,
    receiving: onOpenReceiving,
    returns: onOpenReturns,
  };

  const renderBody = (): React.ReactNode => {
    if (!allowed) {
      return <AdminEmptyState title={t('workQueue.noAccess.title')} subtitle={t('workQueue.noAccess.subtitle')} />;
    }
    if (sourced && list.isLoading) return <AdminLoadingState />;
    if (sourced && list.error !== null && list.error !== undefined && list.items.length === 0) {
      return <AdminErrorState error={list.error} onRetry={list.refresh} />;
    }
    if (cards.length === 0) {
      return <AdminEmptyState title={t('workQueue.empty.title')} subtitle={t('workQueue.empty.subtitle')} />;
    }
    return (
      <View style={styles.taskList}>
        {cards.map((card) => (
          <TaskCard
            key={card.itemKey}
            card={card}
            onOpen={openFor[card.destination]}
          />
        ))}
        {list.hasMore ? (
          <TouchableOpacity testID="workQueue.loadMore" style={styles.loadMore} onPress={list.loadMore} accessibilityRole="button">
            <Text style={styles.loadMoreText}>{t('workQueue.loadMore')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBanner}>
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="workQueueGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={adminColors.brand} />
                <Stop offset="1" stopColor={adminColors.brand} stopOpacity={0.94} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#workQueueGrad)" />
          </Svg>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              testID="workQueue.back"
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('workQueue.back')}
            >
              <BackArrowIcon size={WORK_QUEUE_ICON.back} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} accessibilityRole="header">
              {t('workQueue.title')}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {allowed ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <SearchIcon size={WORK_QUEUE_ICON.search} color={adminColors.muted} />
              <TextInput
                testID="workQueue.search"
                style={styles.searchInput}
                placeholder={t('workQueue.search.placeholder')}
                placeholderTextColor={adminColors.placeholder}
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity
                testID="workQueue.filterOpen"
                onPress={() => setSheetOpen(true)}
                activeOpacity={0.7}
                style={styles.filterTrigger}
                accessibilityRole="button"
                accessibilityLabel={t('workQueue.search.filter')}
              >
                <FilterSlidersIcon size={WORK_QUEUE_ICON.search} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <Text testID="workQueue.count" style={styles.countText}>
              {t('workQueue.count.line', {
                pending: summary.data !== undefined ? summary.data.open : t('workQueue.count.none'),
                blocked: t('workQueue.count.none'),
              })}
            </Text>
          </View>
        ) : null}

        {renderBody()}

        <View style={styles.bottomGap} />
      </ScrollView>

      {allowed ? (
        <WorkQueueFilterSheet
          visible={sheetOpen}
          filters={filters}
          warehouses={warehouses.options}
          showWarehouse={canPickWarehouse}
          onApply={(next) => {
            setFilters(next);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </>
  );
}
