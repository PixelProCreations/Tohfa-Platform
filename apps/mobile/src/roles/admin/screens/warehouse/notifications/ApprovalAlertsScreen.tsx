// Design id: M13-S03
/**
 * Approval / Exception Alerts — warehouse-level problems requiring attention.
 *
 * Was SubWarehouseApprovalAlertsScreen (one warehouse; KPI grid, All /
 * Approvals / Exceptions / Snoozed chips, Open Related Record / Snooze /
 * Dismiss bar) and absorbs the Main AlertsAndActionCenterScreen (alerts across
 * the warehouses; All / Unread / Resolved and All Priority / Critical / All
 * Warehouses chips).
 *
 * Scope: a Sub scope lists its own warehouse's open alerts behind a locked
 * pill; the Main view (scope.warehouseId undefined) gets the all-warehouses
 * selector and, ported scope-conditionally from the Main twin, the status
 * (All / Unread / Resolved) and priority (All Priority / Critical) chips and a
 * per-card warehouse label. The server applies the real filter (CLAUDE.md 2.1).
 *
 * Gates (FINAL_LIST #23, NO CODE spec gap): was shown with
 * notification.own.view, which is `all` for every role in docs/rbac.json, so
 * the client check carried no information and only denied the screen while
 * /auth/me had not loaded; it is dropped (the server filters the alerts).
 * Approve / Review, Snooze and Dismiss have no rbac code (there is no
 * expense-approve code), so the screen is read-only: those buttons are not
 * rendered (SPEC_GAPS W4k-2). "Open record" only navigates, and only when the
 * record's own view code passes (canOpenAlertRecord).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  KpiRow,
  PermissionNote,
  ScopeHeader,
  WalletScreen,
  inScope,
  isAllWarehouses,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { APPROVAL_ALERTS, NOTIFICATION_WAREHOUSES } from './fixtures';
import { AlertTriangleIcon, canOpenAlertRecord } from './NotificationParts';
import type { ApprovalAlertItem, WarehouseScope, WarehouseScreenBaseProps } from './types';

type KindFilter = 'All' | 'Approvals' | 'Exceptions';
type StatusFilter = 'All' | 'Unread' | 'Resolved';
type PriorityFilter = 'All Priority' | 'Critical';

const KIND_FILTERS: readonly KindFilter[] = ['All', 'Approvals', 'Exceptions'];
const STATUS_FILTERS: readonly StatusFilter[] = ['All', 'Unread', 'Resolved'];
const PRIORITY_FILTERS: readonly PriorityFilter[] = ['All Priority', 'Critical'];

export interface ApprovalAlertsScreenProps extends WarehouseScreenBaseProps {
  /** Alert rows; defaults to the mock queue (SPEC_GAPS W4k-1). */
  alerts?: readonly ApprovalAlertItem[] | undefined;
  /** Warehouses for the Main selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Opens the alert's related record (outside this module). */
  onOpenRecord?: ((alert: ApprovalAlertItem) => void) | undefined;
}

function matchesKind(alert: ApprovalAlertItem, kind: KindFilter): boolean {
  if (kind === 'Approvals') return alert.kind === 'approval';
  if (kind === 'Exceptions') return alert.kind === 'exception';
  return true;
}

function matchesStatus(alert: ApprovalAlertItem, status: StatusFilter): boolean {
  if (status === 'Unread') return !alert.isRead && alert.status === 'open';
  if (status === 'Resolved') return alert.status === 'resolved';
  return true;
}

export function ApprovalAlertsScreen({
  scope,
  can,
  onBack,
  alerts = APPROVAL_ALERTS,
  warehouseOptions = NOTIFICATION_WAREHOUSES,
  onOpenRecord,
}: ApprovalAlertsScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<KindFilter>('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [priority, setPriority] = useState<PriorityFilter>('All Priority');

  // Sub saw only open alerts; Main's status chips can bring resolved ones in.
  const scoped = useMemo(
    () => alerts.filter((a) => inScope(scope, a.warehouseId, warehouseId) && (isMain || a.status === 'open')),
    [alerts, scope, warehouseId, isMain],
  );
  const open = scoped.filter((a) => a.status === 'open');

  const visible = scoped.filter(
    (a) =>
      matchesKind(a, kind) &&
      (!isMain || matchesStatus(a, status)) &&
      (!isMain || priority === 'All Priority' || a.critical),
  );

  const openRecord = (alert: ApprovalAlertItem) => {
    if (onOpenRecord !== undefined && canOpenAlertRecord(can, alert.record)) onOpenRecord(alert);
  };

  return (
    <WalletScreen
      title="Approval / Exception Alerts"
      subtitle="Warehouse-level problems requiring attention"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={warehouseId}
          onSelectWarehouse={setWarehouseId}
        />
      }
    >
      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.content]} showsVerticalScrollIndicator={false}>
        <View>
          <KpiRow
            items={[
              { value: String(open.length), label: 'ALL ALERTS' },
              { value: String(open.filter((a) => a.kind === 'approval').length), label: 'APPROVAL' },
            ]}
          />
          <KpiRow
            items={[
              { value: String(open.filter((a) => a.kind === 'exception').length), label: 'EXCEPTIONS' },
              { value: String(open.filter((a) => a.critical).length), label: 'CRITICAL', tone: 'danger' },
            ]}
          />
        </View>

        <ChipGroup options={KIND_FILTERS} value={kind} onChange={setKind} />
        {isMain ? (
          <>
            <ChipGroup options={STATUS_FILTERS} value={status} onChange={setStatus} />
            <ChipGroup options={PRIORITY_FILTERS} value={priority} onChange={setPriority} />
          </>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState title="No alerts in this category." />
        ) : (
          visible.map((alert) => {
            const canOpen = onOpenRecord !== undefined && canOpenAlertRecord(can, alert.record);
            const accent = alert.critical
              ? adminColors.danger.border
              : alert.kind === 'approval'
                ? adminColors.brand
                : adminColors.warning.border;
            const tone = alert.critical ? adminColors.danger : adminColors.warning;
            return (
              <TouchableOpacity
                key={alert.id}
                style={[styles.card, { borderLeftColor: accent }]}
                onPress={() => openRecord(alert)}
                disabled={!canOpen}
                activeOpacity={0.8}
                accessibilityRole={canOpen ? 'button' : undefined}
              >
                <View style={[styles.iconSquare, { backgroundColor: tone.bg }]}>
                  <AlertTriangleIcon size={18} color={tone.text} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{alert.title}</Text>
                  <Text style={styles.cardMeta}>{alert.reference}</Text>
                  <Text style={styles.cardDetail}>
                    {alert.detail} · {alert.timestamp}
                  </Text>
                  {isMain && alert.warehouseName ? <Text style={styles.cardMeta}>{alert.warehouseName}</Text> : null}
                  {alert.status === 'resolved' ? <Text style={styles.resolved}>Resolved</Text> : null}
                  {canOpen ? <Text style={styles.openLink}>Open record →</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <PermissionNote>Approve, snooze and dismiss are not available: no permission covers them yet.</PermissionNote>
      </ScrollView>
    </WalletScreen>
  );
}

// Icon tile size: an icon size, not spacing.
const ICON_SQUARE = 32;

const styles = StyleSheet.create({
  content: { gap: adminSpacing.md, paddingTop: adminSpacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  iconSquare: {
    width: ICON_SQUARE,
    height: ICON_SQUARE,
    borderRadius: adminRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  cardDetail: { ...adminType.rowMeta, color: adminColors.ink, marginTop: adminSpacing.xs },
  resolved: { ...adminType.caption, color: adminColors.success.text, marginTop: adminSpacing.xs },
  openLink: { ...adminType.rowTitle, color: adminColors.brandDeep, marginTop: adminSpacing.sm },
});
