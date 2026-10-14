/**
 * Return History — the closed returns, on GET /admin/returns (plan phase 10).
 *
 * The queue's layout with the closed statuses as chips (Refunded, Rejected,
 * Bank Refund Pending; the server filters by one status at a time, so there
 * is no "All closed"). A row opens the same live detail as the queue, which
 * offers nothing on a closed return (BR-61: once a return leaves APPROVED
 * there is no path back).
 *
 * Hidden, because the API cannot back them: the KPI tiles, the search, the
 * customer name on a row and the Main all-warehouses selector.
 */
// Design id: M10-S10
import React from 'react';

import { t } from '../../../i18n';
import { ReturnsIssuesScreen, type ReturnsIssuesScreenProps } from './ReturnsIssuesScreen';

export type ReturnHistoryScreenProps = Omit<ReturnsIssuesScreenProps, 'title' | 'emptyTitle' | 'onNavigateToHistory' | 'showTabs'>;

export function ReturnHistoryScreen(props: ReturnHistoryScreenProps) {
  return <ReturnsIssuesScreen {...props} title={t('returns.history.title')} emptyTitle={t('returns.history.empty')} />;
}
