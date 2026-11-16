/**
 * The pure half of the Tohfa Admin Home tab (./TohfaHomeScreen.tsx): what the
 * KPI cards and quick actions are, which docs/rbac.json code and which
 * callback prop each tap target needs, and the greeting/date text.
 *
 * Data (owner decision 2026-11-11): the backend has no Home summary endpoint
 * yet, so every figure is TOHFA_HOME_DASH and every list is an empty state.
 * The design's numbers, names and dates were fixtures and are not carried
 * over. When a summary endpoint lands, feed real values in through the card
 * definitions here; nothing else needs to change.
 *
 * Gating (owner decision 2026-11-11: copy the design exactly, wire later):
 *   - visibility is decided by rbac alone. A control with a docs/rbac.json
 *     code shows only when `can` grants it; a missing `can` grants nothing.
 *     A control with no fitting code (no `code` on its gate) always shows.
 *   - pressing calls the host callback when one is passed. With no callback
 *     yet, the control looks identical and pressing shows the i18n
 *     "Not available yet" note; it never fakes a success.
 * This only decides what is worth rendering; every destination is authorised
 * again by the server (root CLAUDE.md 2.1).
 *
 * No React and no react-native import, so it runs in plain-Node vitest.
 */
import type { Can } from '../../permissions/can';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay, istWeekday } from '../../utils/datetime';

/** Shown for every figure that has no backend source yet. */
export const TOHFA_HOME_DASH = '—';

/** Every callback prop the Home screen accepts, named after what it opens. */
export type TohfaHomeCallback =
  | 'onOpenNotifications'
  | 'onOpenProfile'
  | 'onOpenPendingApplications'
  | 'onOpenFarmers'
  | 'onOpenAudits'
  | 'onOpenProduceCalendar'
  | 'onOpenPurchaseOrders'
  | 'onOpenFinance'
  | 'onOpenInventory'
  | 'onOpenSupport'
  | 'onOpenStaff'
  | 'onCreateStaff'
  | 'onOpenReceiving'
  | 'onOpenListingApproval'
  | 'onOpenTransfers'
  | 'onOpenPricing'
  | 'onOpenCashTopUp'
  | 'onOpenPayouts'
  | 'onOpenInvoices'
  | 'onCreateChannelOrder'
  | 'onOpenSalesFinanceOverview'
  | 'onOpenWorkQueue'
  | 'onOpenOperationsOverview'
  | 'onOpenSearchFilter'
  | 'onRefresh';

export type TohfaHomeCallbacks = Partial<Record<TohfaHomeCallback, () => void>>;

export interface TohfaHomeGate {
  callback: TohfaHomeCallback;
  /** The docs/rbac.json code. Undefined when no code fits: the control is never hidden. */
  code?: string | undefined;
}

/** Whether a control is drawn: always without a code, else only when `can` grants it. */
export function tohfaControlVisible(gate: TohfaHomeGate, can: Can | undefined): boolean {
  if (gate.code === undefined) return true;
  if (!can) return false;
  return can(gate.code);
}

/**
 * The press handler for a gate: undefined when the control is hidden, the
 * host callback when passed, otherwise `onUnavailable` (the "Not available
 * yet" note) so an unwired control still looks and behaves like the design.
 */
export function gatedHandler(
  gate: TohfaHomeGate | undefined,
  can: Can | undefined,
  callbacks: TohfaHomeCallbacks,
  onUnavailable: () => void,
): (() => void) | undefined {
  if (!gate || !tohfaControlVisible(gate, can)) return undefined;
  const fn = callbacks[gate.callback];
  return typeof fn === 'function' ? fn : onUnavailable;
}

// ─── KPI cards ───────────────────────────────────────────────────────────────

export type TohfaKpiIcon = 'orders' | 'pickup' | 'clipboard' | 'box' | 'truck' | 'sales' | 'alert' | 'cash' | 'users';
export type TohfaKpiTone = 'default' | 'danger';

export interface TohfaKpiDef {
  id: string;
  titleKey: TranslationKey;
  /** Only the design subtitles that carry no figure survive; the rest were fixture counts. */
  subtitleKey?: TranslationKey;
  icon: TohfaKpiIcon;
  /** The design's tone, used only once the card has a real figure. */
  designTone: TohfaKpiTone;
  /** What the card opens. A card is always drawn; it is pressable only when its gate is visible. */
  gate: TohfaHomeGate;
}

const gate = (callback: TohfaHomeCallback, code?: string): TohfaHomeGate => ({ callback, code });

/** Design order: the first six show collapsed, all eleven expanded. */
export const TOHFA_KPI_CARDS: readonly TohfaKpiDef[] = [
  { id: 'farmerApplications', titleKey: 'tohfaHome.kpi.farmerApplications', icon: 'orders', designTone: 'default', gate: gate('onOpenPendingApplications', 'farmer.application.view') },
  { id: 'activeFarmers', titleKey: 'tohfaHome.kpi.activeFarmers', icon: 'pickup', designTone: 'default', gate: gate('onOpenFarmers', 'farmer.profile.view_all') },
  { id: 'audits', titleKey: 'tohfaHome.kpi.audits', subtitleKey: 'tohfaHome.kpi.audits.subtitle', icon: 'clipboard', designTone: 'default', gate: gate('onOpenAudits', 'audit.view') },
  { id: 'openExceptions', titleKey: 'tohfaHome.kpi.openExceptions', subtitleKey: 'tohfaHome.kpi.openExceptions.subtitle', icon: 'box', designTone: 'danger', gate: gate('onOpenWorkQueue') },
  { id: 'produceActivity', titleKey: 'tohfaHome.kpi.produceActivity', icon: 'truck', designTone: 'default', gate: gate('onOpenProduceCalendar', 'produce.calendar.view_consolidated') },
  { id: 'purchaseActivity', titleKey: 'tohfaHome.kpi.purchaseActivity', icon: 'box', designTone: 'default', gate: gate('onOpenPurchaseOrders', 'purchase.order.view') },
  { id: 'salesOrders', titleKey: 'tohfaHome.kpi.salesOrders', icon: 'sales', designTone: 'default', gate: gate('onOpenFinance', 'finance.sales_income.view') },
  { id: 'warehouseExceptions', titleKey: 'tohfaHome.kpi.warehouseExceptions', icon: 'alert', designTone: 'danger', gate: gate('onOpenInventory', 'warehouse.all.view') },
  { id: 'financeAttention', titleKey: 'tohfaHome.kpi.financeAttention', icon: 'cash', designTone: 'danger', gate: gate('onOpenFinance', 'finance.sales_income.view') },
  { id: 'customerSupport', titleKey: 'tohfaHome.kpi.customerSupport', icon: 'pickup', designTone: 'default', gate: gate('onOpenSupport', 'support.ticket.view_all') },
  { id: 'staffOperations', titleKey: 'tohfaHome.kpi.staffOperations', icon: 'users', designTone: 'default', gate: gate('onOpenStaff', 'admin.staff.list_view') },
];

/** The design shows this many cards (and actions) before "Show more". */
export const TOHFA_HOME_COLLAPSED_COUNT = 6;

export interface TohfaKpiView {
  id: string;
  title: string;
  value: string;
  subtitle: string | undefined;
  icon: TohfaKpiIcon;
  tone: TohfaKpiTone;
  onPress: (() => void) | undefined;
}

/**
 * The cards to draw. The design's red tone flagged a real exception count;
 * painting '—' red would claim an exception nobody measured, so an unsourced
 * card draws in the default tone.
 */
export function tohfaKpiViews(
  can: Can | undefined,
  callbacks: TohfaHomeCallbacks,
  expanded: boolean,
  onUnavailable: () => void,
): TohfaKpiView[] {
  const defs = expanded ? TOHFA_KPI_CARDS : TOHFA_KPI_CARDS.slice(0, TOHFA_HOME_COLLAPSED_COUNT);
  return defs.map((def) => {
    const value = TOHFA_HOME_DASH;
    return {
      id: def.id,
      title: t(def.titleKey),
      value,
      subtitle: def.subtitleKey ? t(def.subtitleKey) : undefined,
      icon: def.icon,
      tone: value === TOHFA_HOME_DASH ? 'default' : def.designTone,
      onPress: gatedHandler(def.gate, can, callbacks, onUnavailable),
    };
  });
}

// ─── Quick actions ───────────────────────────────────────────────────────────

export type TohfaActionIcon =
  | 'userSearch'
  | 'calendar'
  | 'groupUsers'
  | 'receiveGoods'
  | 'produceList'
  | 'transfer'
  | 'tag'
  | 'cashTopUp'
  | 'receipt'
  | 'bag'
  | 'cutlery';

export interface TohfaActionDef {
  id: string;
  labelKey: TranslationKey;
  icon: TohfaActionIcon;
  gate: TohfaHomeGate;
}

/** Design order. "Add Warehouse" is left out: the owner does not want it (BR-23b). */
export const TOHFA_QUICK_ACTIONS: readonly TohfaActionDef[] = [
  { id: 'reviewApplications', labelKey: 'tohfaHome.action.reviewApplications', icon: 'userSearch', gate: gate('onOpenPendingApplications', 'farmer.application.view') },
  { id: 'auditCalendar', labelKey: 'tohfaHome.action.auditCalendar', icon: 'calendar', gate: gate('onOpenAudits', 'audit.view') },
  { id: 'createStaff', labelKey: 'tohfaHome.action.createStaff', icon: 'groupUsers', gate: gate('onCreateStaff', 'admin.staff.manage') },
  { id: 'receiveGoods', labelKey: 'tohfaHome.action.receiveGoods', icon: 'receiveGoods', gate: gate('onOpenReceiving', 'inventory.goods_receipt.record') },
  { id: 'produceList', labelKey: 'tohfaHome.action.produceList', icon: 'produceList', gate: gate('onOpenListingApproval', 'listing.queue.view_pending') },
  { id: 'transferStock', labelKey: 'tohfaHome.action.transferStock', icon: 'transfer', gate: gate('onOpenTransfers', 'transfer.inter_warehouse.view') },
  { id: 'retailPrices', labelKey: 'tohfaHome.action.retailPrices', icon: 'tag', gate: gate('onOpenPricing', 'pricing.retail_price.view') },
  { id: 'cashTopUp', labelKey: 'tohfaHome.action.cashTopUp', icon: 'cashTopUp', gate: gate('onOpenCashTopUp', 'wallet.cash_topup.process') },
  { id: 'purchasesPayouts', labelKey: 'tohfaHome.action.purchasesPayouts', icon: 'receipt', gate: gate('onOpenPayouts', 'payout.dues.view') },
  { id: 'salesInvoices', labelKey: 'tohfaHome.action.salesInvoices', icon: 'bag', gate: gate('onOpenInvoices', 'invoice.generate') },
  { id: 'channelOrder', labelKey: 'tohfaHome.action.channelOrder', icon: 'cutlery', gate: gate('onCreateChannelOrder', 'sales.sale.create') },
];

export interface TohfaActionView {
  id: string;
  label: string;
  icon: TohfaActionIcon;
  onPress: () => void;
}

/** The actions this user's rbac codes allow, in design order; unwired ones press to the note. */
export function visibleTohfaActions(
  can: Can | undefined,
  callbacks: TohfaHomeCallbacks,
  onUnavailable: () => void,
): TohfaActionView[] {
  const out: TohfaActionView[] = [];
  for (const def of TOHFA_QUICK_ACTIONS) {
    const onPress = gatedHandler(def.gate, can, callbacks, onUnavailable);
    if (onPress) out.push({ id: def.id, label: t(def.labelKey), icon: def.icon, onPress });
  }
  return out;
}

// ─── Other tap targets ───────────────────────────────────────────────────────

export const TOHFA_HEADER_GATES = {
  notifications: gate('onOpenNotifications', 'notification.own.view'),
  profile: gate('onOpenProfile', 'auth.principal.view_own'),
} as const;

export const TOHFA_SALES_GATE = gate('onOpenSalesFinanceOverview', 'sales.dashboard.view');
export const TOHFA_FINANCE_GATE = gate('onOpenFinance', 'finance.sales_income.view');
/** No rbac.json code covers an operations overview: the link and card always show. */
export const TOHFA_OPS_GATE = gate('onOpenOperationsOverview');
/** Refresh and the search filter open no gated data of their own: always shown. */
export const TOHFA_REFRESH_GATE = gate('onRefresh');
export const TOHFA_SEARCH_FILTER_GATE = gate('onOpenSearchFilter');

// ─── Date range chip ─────────────────────────────────────────────────────────

/** The design's "Select Time Period" options, in its order. */
export const TOHFA_DATE_RANGES = ['7d', '30d', '90d', 'month', 'quarter'] as const;
export type TohfaDateRange = (typeof TOHFA_DATE_RANGES)[number];
/** The design's initial chip label is "30 days". */
export const TOHFA_DEFAULT_DATE_RANGE: TohfaDateRange = '30d';

export function tohfaDateRangeLabel(range: TohfaDateRange): string {
  return t(`tohfaHome.dateRange.${range}` as TranslationKey);
}

/**
 * Every callback-driven tap target with the testID it renders under.
 * `kind: 'kpi'` targets are cards that always draw and only become
 * pressable; the rest render only when visible (see tohfaControlVisible).
 * The test drives the gating from this list.
 */
export interface TohfaHomeControl extends TohfaHomeGate {
  /** The tap target's testID, or for a KPI card (which takes no testID) the card's id. */
  testID: string;
  kind: 'button' | 'kpi';
}

export const TOHFA_HOME_CONTROLS: readonly TohfaHomeControl[] = [
  { testID: 'home.header.notifications', kind: 'button', ...TOHFA_HEADER_GATES.notifications },
  { testID: 'home.header.profile', kind: 'button', ...TOHFA_HEADER_GATES.profile },
  { testID: 'home.refresh', kind: 'button', ...TOHFA_REFRESH_GATE },
  { testID: 'home.search.filter', kind: 'button', ...TOHFA_SEARCH_FILTER_GATE },
  ...TOHFA_KPI_CARDS.map((d) => ({ testID: d.id, kind: 'kpi' as const, ...d.gate })),
  ...TOHFA_QUICK_ACTIONS.map((d) => ({ testID: `home.action.${d.id}`, kind: 'button' as const, ...d.gate })),
  { testID: 'home.ops.open', kind: 'button', ...TOHFA_OPS_GATE },
  { testID: 'home.ops.card', kind: 'button', ...TOHFA_OPS_GATE },
  { testID: 'home.sales.open', kind: 'button', ...TOHFA_SALES_GATE },
  { testID: 'home.sales.card', kind: 'button', ...TOHFA_SALES_GATE },
  { testID: 'home.finance.card', kind: 'button', ...TOHFA_FINANCE_GATE },
];

// ─── Greeting and dates ──────────────────────────────────────────────────────

/** The design greets by first name. No name means no name: there is no fallback identity. */
export function tohfaGreeting(fullName: string | null | undefined): string {
  const first = (fullName ?? '').trim().split(/\s+/)[0] ?? '';
  return first ? t('tohfaHome.greeting.named', { name: first }) : t('tohfaHome.greeting.anonymous');
}

function weekdayKey(now: Date, short: boolean): TranslationKey {
  const day = istWeekday(now);
  return (short ? `tohfaHome.weekdayShort.${day}` : `tohfaHome.weekday.${day}`) as TranslationKey;
}

/** Header line, e.g. "Wednesday, 11 Nov 2026" (IST, from the device clock). */
export function tohfaHeaderDate(now: Date): string {
  return t('tohfaHome.header.date', { weekday: t(weekdayKey(now, false)), day: formatAdminDay(now) });
}

/** Greeting-card stamp, e.g. "Wed, 11 Nov 2026 · IST". */
export function tohfaDateStamp(now: Date): string {
  return t('tohfaHome.greeting.dateStamp', { weekday: t(weekdayKey(now, true)), day: formatAdminDay(now) });
}
