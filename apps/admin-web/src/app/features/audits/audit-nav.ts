/**
 * Route paths for the Audit Management module. Every screen links through these so the paths live in
 * one place. They are NOT registered yet: app.routes.ts still maps 'audits' to the placeholder, and a
 * later wiring step registers these routes (dashboard, schedule, detail, inspection, findings and the
 * 12 step screens). Until then the links resolve to the app's fallback route.
 *
 *   AUDIT_ROUTES.dashboard              '/audits'
 *   AUDIT_ROUTES.schedule               '/audits/schedule'
 *   AUDIT_ROUTES.detail(id)             '/audits/AUD-2026-0042'
 *   AUDIT_ROUTES.inspection(id)         '/audits/AUD-2026-0042/inspection'
 *   AUDIT_ROUTES.findings(id)           '/audits/AUD-2026-0042/findings'
 *   AUDIT_ROUTES.step(id, n)            '/audits/AUD-2026-0042/inspection/step/3'   (n = 1..12)
 *
 * Route registration note for the wiring step: 'schedule' must be declared before ':id' so it is not
 * captured as an audit id.
 */
export const AUDIT_ROUTES = {
  dashboard: '/audits',
  schedule: '/audits/schedule',
  detail: (id: string): string => `/audits/${encodeURIComponent(id)}`,
  inspection: (id: string): string => `/audits/${encodeURIComponent(id)}/inspection`,
  findings: (id: string): string => `/audits/${encodeURIComponent(id)}/findings`,
  step: (id: string, n: number): string =>
    `/audits/${encodeURIComponent(id)}/inspection/step/${n}`,
  /** Audit History (design 96). Registered before ':id'. */
  history: '/audits/history',
  /** Report History (design 99). Registered before 'reports/:id'. */
  reportHistory: '/audits/reports/history',
  /** Report Details (design 100) for a report id from the Report History rows. */
  reportDetail: (id: string): string => `/audits/reports/${encodeURIComponent(id)}`,
  /** Audit Reports & Tier Configuration (design 98): page + auto-opened dialog. */
  reportsConfig: '/audits/reports',
} as const;

/** Route param names the wiring step should use (`:id`, `:step`). */
export const AUDIT_ROUTE_PARAMS = {
  id: 'id',
  step: 'step',
} as const;
