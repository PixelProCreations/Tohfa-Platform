/**
 * Audit Management → dashboard (design 74). UI ONLY.
 *
 * KPI values, calendar events and the selected day's audits are placeholder data (audit.mock.ts).
 * When integrated, the calendar month comes from `GET /admin/audits` filtered by date (listAudits)
 * and the KPIs from a summary endpoint that docs/openapi.yaml does not define yet (spec gap).
 *
 * Interactive locally: month navigation (only October 2026 has events; other months render an empty
 * grid), day selection by click or arrow keys, and the selected-day table. "View" links go to the
 * audit detail route (AUDIT_ROUTES.detail). Quick actions: "View Audit Schedule" →
 * AUDIT_ROUTES.schedule, "View Audit History" → '/audits/history', "Report History" →
 * '/audits/reports/history', and "Generate Audit Report" opens AuditGenerateReportDialogComponent
 * (design 97); generating closes it and navigates to AUDIT_ROUTES.reportsConfig (UI only, nothing is requested).
 *
 * Inert by design (no designs exist for them): the header search / notifications / refresh buttons
 * and "Reschedule".
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import { AUDIT_DASHBOARD_STRINGS as D } from './audit-dashboard.strings';
import { AuditGenerateReportDialogComponent } from './audit-generate-report-dialog.component';
import {
  auditIsoDay,
  formatAuditDate,
  formatAuditDateLong,
  formatAuditDateTime24,
  formatAuditMonth,
  parseAuditDate,
} from './audit-format';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_STATUS_META, AUDIT_TYPE_LABEL, auditStatusPillClass } from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import {
  AUDIT_CALENDAR_EVENTS,
  AUDIT_DASHBOARD_INITIAL_DAY,
  AUDIT_DASHBOARD_INITIAL_MONTH0,
  AUDIT_DASHBOARD_INITIAL_YEAR,
  AUDIT_DASHBOARD_KPI_VALUES,
  AUDIT_NOTIFICATION_COUNT,
} from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditCalendarEvent, AuditKpi, AuditTone } from './audit.types';

/** One dot / check under a day number. */
interface DayMarker {
  readonly tone: AuditTone;
  /** Completed audits render as a check glyph instead of a dot (design 74). */
  readonly done: boolean;
}

interface CalendarCell {
  readonly iso: string;
  readonly day: number;
  readonly count: number;
  readonly markers: readonly DayMarker[];
  readonly label: string;
}

/** A week row: 7 slots, `null` for days outside the month. */
type CalendarWeek = readonly (CalendarCell | null)[];

/** A quick-action tile either navigates (`link`) or opens a dialog (`dialog`). */
type QuickAction =
  | { readonly kind: 'link'; readonly label: string; readonly icon: string; readonly link: string }
  | { readonly kind: 'dialog'; readonly label: string; readonly icon: string; readonly dialog: 'generateReport' };

/**
 * Routes registered alongside the Audit History and Report History screens. Literal here because
 * those screens own audit-nav.ts additions; switch to AUDIT_ROUTES once they are exported there.
 */
const AUDIT_HISTORY_ROUTE = '/audits/history';
const AUDIT_REPORT_HISTORY_ROUTE = '/audits/reports/history';

/** Arrow-key day offsets for the calendar grid. */
const KEY_OFFSETS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/** At most this many markers under a day number; the aria-label still carries the full count. */
const MAX_MARKERS = 3;

@Component({
  selector: 'tohfa-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DataTableComponent,
    DataTableCellDirective,
    AuditGenerateReportDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      /* ---------- Calendar ---------- */
      .cal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-14);
      }
      .cal-month {
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-amber);
      }
      .cal-nav {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-14) * 2);
        height: calc(var(--space-14) * 2);
        padding: 0;
        border: none;
        border-radius: var(--r-sm);
        background: none;
        color: var(--tohfa-amber);
        cursor: pointer;
      }
      .cal-nav:hover {
        background: var(--tohfa-amber-tint);
      }
      .cal-nav:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .cal-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
      }
      .cal-row {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: var(--space-8);
      }
      .cal-weekday {
        padding-bottom: var(--space-4);
        text-align: center;
        font-size: var(--fs-badge);
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .cal-day {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        width: 100%;
        min-height: calc(var(--space-20) * 3);
        padding: var(--space-6);
        border: var(--border-card);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .cal-day:hover:not(.selected) {
        background: var(--tohfa-page);
      }
      .cal-day:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .cal-day.selected {
        background: var(--tohfa-amber);
        border-color: var(--tohfa-amber);
        color: var(--tohfa-neutral-white);
      }
      .cal-markers {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        min-height: var(--space-10);
      }
      .cal-dot {
        width: var(--space-4);
        height: var(--space-4);
        border-radius: var(--r-circle);
        background: currentColor;
      }
      .cal-check {
        font-size: var(--icon-row-action);
        color: var(--tohfa-muted);
      }
      .cal-day.selected .cal-dot,
      .cal-day.selected .cal-check {
        color: var(--tohfa-neutral-white);
      }
      .cal-legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-14);
        margin: var(--space-14) 0 0;
        padding: 0;
        list-style: none;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .cal-legend li {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }

      /* ---------- Quick actions ---------- */
      .qa-grid {
        display: grid;
        margin-top: var(--space-14);
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-12);
      }
      .qa-tile {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        min-height: calc(var(--space-28) * 3);
        padding: var(--space-14);
        border: var(--border-card);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        text-align: center;
        text-decoration: none;
        cursor: pointer;
      }
      .qa-tile:hover {
        background: var(--tohfa-page);
      }
      .qa-tile:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .qa-tile .material-symbols-outlined {
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }

      .nowrap {
        white-space: nowrap;
      }

      @media (max-width: 900px) {
        .qa-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div>
        <div class="audit-title-row">
          <span class="material-symbols-outlined audit-title-icon" aria-hidden="true">shield</span>
          <h1 class="audit-title">{{ D.TITLE }}</h1>
        </div>
        <p class="audit-subtitle">{{ D.SUBTITLE }}</p>
      </div>
      <!-- Inert: no designs for search, notifications or refresh. -->
      <div class="audit-header-actions">
        <button
          type="button"
          class="audit-icon-btn"
          aria-disabled="true"
          [title]="S.NOT_AVAILABLE_YET"
          [attr.aria-label]="D.ACTION_SEARCH"
        >
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
        </button>
        <button
          type="button"
          class="audit-icon-btn"
          aria-disabled="true"
          [title]="S.NOT_AVAILABLE_YET"
          [attr.aria-label]="D.notificationsLabel(notificationCount)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">notifications</span>
          <span class="audit-icon-btn-badge" aria-hidden="true">{{ notificationCount }}</span>
        </button>
        <button
          type="button"
          class="audit-icon-btn"
          aria-disabled="true"
          [title]="S.NOT_AVAILABLE_YET"
          [attr.aria-label]="D.ACTION_REFRESH"
        >
          <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
        </button>
      </div>
    </header>

    <section class="audit-kpis" [attr.aria-label]="D.KPI_REGION">
      <div class="tohfa-kpi-card audit-kpi" *ngFor="let kpi of kpis">
        <div class="audit-kpi-top">
          <span class="audit-kpi-value">{{ kpi.value }}</span>
          <span
            class="material-symbols-outlined audit-kpi-icon tone-fg-{{ kpi.tone }}"
            aria-hidden="true"
            >{{ kpi.icon }}</span
          >
        </div>
        <span class="audit-kpi-label">{{ kpi.label }}</span>
      </div>
    </section>

    <section class="tohfa-card" [attr.aria-label]="D.CALENDAR_REGION">
      <div class="cal-head">
        <button type="button" class="cal-nav" [attr.aria-label]="D.PREV_MONTH" (click)="shiftMonth(-1)">
          <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
        </button>
        <h2 class="cal-month" aria-live="polite">{{ monthLabel() }}</h2>
        <button type="button" class="cal-nav" [attr.aria-label]="D.NEXT_MONTH" (click)="shiftMonth(1)">
          <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </button>
      </div>

      <div class="cal-grid" role="grid" [attr.aria-label]="monthLabel()">
        <div class="cal-row" role="row">
          <span
            class="cal-weekday"
            role="columnheader"
            *ngFor="let w of weekdays; let i = index"
            [attr.aria-label]="weekdaysLong[i]"
            >{{ w }}</span
          >
        </div>
        <div class="cal-row" role="row" *ngFor="let week of weeks()">
          <div role="gridcell" *ngFor="let cell of week" [attr.aria-selected]="cell ? cell.iso === selected() : null">
            <button
              *ngIf="cell"
              type="button"
              class="cal-day"
              [class.selected]="cell.iso === selected()"
              [attr.data-date]="cell.iso"
              [attr.tabindex]="cell.iso === focusDay() ? 0 : -1"
              [attr.aria-label]="cell.label"
              (click)="select(cell.iso)"
              (keydown)="onDayKey($event, cell.iso)"
            >
              <span>{{ cell.day }}</span>
              <span class="cal-markers" aria-hidden="true">
                <ng-container *ngFor="let m of cell.markers">
                  <span *ngIf="m.done; else dot" class="material-symbols-outlined cal-check">check_circle</span>
                  <ng-template #dot><span class="cal-dot tone-fg-{{ m.tone }}"></span></ng-template>
                </ng-container>
              </span>
            </button>
          </div>
        </div>
      </div>

      <ul class="cal-legend" [attr.aria-label]="D.LEGEND_LABEL">
        <li><span class="cal-dot tone-fg-info" aria-hidden="true"></span>{{ D.LEGEND_SCHEDULED }}</li>
        <li><span class="cal-dot tone-fg-warning" aria-hidden="true"></span>{{ D.LEGEND_IN_PROGRESS }}</li>
        <li><span class="cal-dot tone-fg-purple" aria-hidden="true"></span>{{ D.LEGEND_REVIEW }}</li>
        <li><span class="cal-dot tone-fg-danger" aria-hidden="true"></span>{{ D.LEGEND_OVERDUE }}</li>
        <li>
          <span class="material-symbols-outlined cal-check" aria-hidden="true">check_circle</span
          >{{ D.LEGEND_COMPLETED }}
        </li>
      </ul>
    </section>

    <section class="tohfa-card" aria-labelledby="audit-day-title">
      <h2 class="audit-card-title" id="audit-day-title" aria-live="polite">{{ selectedLabel() }}</h2>

      <div class="audit-table-wrap" *ngIf="dayRows().length > 0; else dayEmpty">
        <tohfa-data-table
          [columns]="columns"
          [rows]="dayRows()"
          [total]="dayRows().length"
          [page]="1"
          [pageSize]="dayRows().length"
          [emptyMessage]="D.DAY_EMPTY"
        >
          <ng-template tohfaCell="auditId" let-row>
            <span class="audit-two-line-main">{{ row.auditId }}</span>
          </ng-template>
          <ng-template tohfaCell="farmer" let-row>
            <span class="audit-two-line">
              <span class="audit-two-line-main">{{ D.farmerWithCode(row.farmerName, row.farmerCode) }}</span>
              <span class="audit-two-line-sub">{{ row.farmLabel }}</span>
            </span>
          </ng-template>
          <ng-template tohfaCell="type" let-row>{{ typeLabel(row) }}</ng-template>
          <ng-template tohfaCell="scheduledAt" let-row>{{ scheduledLabel(row) }}</ng-template>
          <ng-template tohfaCell="status" let-row>
            <span [class]="pillClass(row)">{{ statusLabel(row) }}</span>
          </ng-template>
          <ng-template tohfaCell="actions" let-row>
            <span class="audit-actions nowrap">
              <a class="audit-action" [routerLink]="detailLink(row)" [attr.aria-label]="D.viewAudit(row.auditId)">{{
                D.ACTION_VIEW
              }}</a>
              <span class="audit-action-sep" aria-hidden="true">-</span>
              <!-- Inert: no reschedule design yet. -->
              <button
                type="button"
                class="audit-action accent is-inert"
                aria-disabled="true"
                [title]="S.NO_DESIGN_YET"
                [attr.aria-label]="D.rescheduleAudit(row.auditId)"
              >
                {{ D.ACTION_RESCHEDULE }}
              </button>
            </span>
          </ng-template>
        </tohfa-data-table>
      </div>
      <ng-template #dayEmpty>
        <div class="audit-empty">
          <span class="material-symbols-outlined audit-empty-icon" aria-hidden="true">event_available</span>
          <p class="audit-empty-title">{{ D.DAY_EMPTY }}</p>
          <p class="audit-empty-hint">{{ D.DAY_EMPTY_HINT }}</p>
        </div>
      </ng-template>
    </section>

    <section class="tohfa-card" aria-labelledby="audit-qa-title">
      <h2 class="audit-section-title" id="audit-qa-title">{{ D.QUICK_ACTIONS }}</h2>
      <div class="qa-grid">
        <ng-container *ngFor="let qa of quickActions">
          <a *ngIf="qa.kind === 'link'; else dialogTile" class="qa-tile" [routerLink]="qa.link">
            <span class="material-symbols-outlined" aria-hidden="true">{{ qa.icon }}</span>
            {{ qa.label }}
          </a>
          <ng-template #dialogTile>
            <button type="button" class="qa-tile" aria-haspopup="dialog" (click)="openReportDialog()">
              <span class="material-symbols-outlined" aria-hidden="true">{{ qa.icon }}</span>
              {{ qa.label }}
            </button>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <tohfa-audit-generate-report-dialog
      *ngIf="reportDialogOpen()"
      (closed)="reportDialogOpen.set(false)"
      (generated)="onReportGenerated()"
    ></tohfa-audit-generate-report-dialog>
  `,
})
export class AuditDashboardComponent {
  readonly S = S;
  readonly D = D;
  readonly weekdays = S.WEEKDAYS_NARROW;
  readonly weekdaysLong = S.WEEKDAYS_LONG;
  readonly notificationCount = AUDIT_NOTIFICATION_COUNT;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  readonly kpis: readonly AuditKpi[] = [
    { key: 'upcoming', label: D.KPI_UPCOMING, value: AUDIT_DASHBOARD_KPI_VALUES.upcoming, icon: 'calendar_month', tone: 'amber' },
    { key: 'inProgress', label: D.KPI_IN_PROGRESS, value: AUDIT_DASHBOARD_KPI_VALUES.inProgress, icon: 'history', tone: 'amber' },
    { key: 'pendingReview', label: D.KPI_PENDING_REVIEW, value: AUDIT_DASHBOARD_KPI_VALUES.pendingReview, icon: 'description', tone: 'amber' },
    { key: 'completed', label: D.KPI_COMPLETED, value: AUDIT_DASHBOARD_KPI_VALUES.completed, icon: 'check_circle', tone: 'success' },
    { key: 'correctiveActions', label: D.KPI_CORRECTIVE_ACTIONS, value: AUDIT_DASHBOARD_KPI_VALUES.correctiveActionsOpen, icon: 'build', tone: 'amber' },
    { key: 'complianceAlerts', label: D.KPI_COMPLIANCE_ALERTS, value: AUDIT_DASHBOARD_KPI_VALUES.complianceAlerts, icon: 'warning', tone: 'danger' },
  ];

  readonly quickActions: readonly QuickAction[] = [
    { kind: 'link', label: D.QA_SCHEDULE, icon: 'calendar_month', link: AUDIT_ROUTES.schedule },
    { kind: 'link', label: D.QA_HISTORY, icon: 'history', link: AUDIT_HISTORY_ROUTE },
    { kind: 'dialog', label: D.QA_REPORT, icon: 'description', dialog: 'generateReport' },
    { kind: 'link', label: D.QA_REPORT_HISTORY, icon: 'history', link: AUDIT_REPORT_HISTORY_ROUTE },
  ];

  readonly reportDialogOpen = signal(false);

  readonly columns: readonly Column[] = [
    { key: 'index', header: D.COL_INDEX },
    { key: 'auditId', header: D.COL_AUDIT_ID },
    { key: 'farmer', header: D.COL_FARMER_FARM },
    { key: 'zoneLabel', header: D.COL_ZONE },
    { key: 'type', header: D.COL_TYPE },
    { key: 'scheduledAt', header: D.COL_SCHEDULED },
    { key: 'auditorName', header: D.COL_AUDITOR },
    { key: 'status', header: D.COL_STATUS },
    { key: 'actions', header: D.COL_ACTIONS },
  ];

  readonly viewYear = signal(AUDIT_DASHBOARD_INITIAL_YEAR);
  /** 0-based month. */
  readonly viewMonth = signal(AUDIT_DASHBOARD_INITIAL_MONTH0);
  readonly selected = signal(AUDIT_DASHBOARD_INITIAL_DAY);

  readonly monthLabel = computed(() => formatAuditMonth(this.viewYear(), this.viewMonth()));

  /** Events grouped by calendar day. */
  private readonly eventsByDay: ReadonlyMap<string, readonly AuditCalendarEvent[]> = (() => {
    const map = new Map<string, AuditCalendarEvent[]>();
    for (const e of AUDIT_CALENDAR_EVENTS) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  })();

  readonly weeks = computed<readonly CalendarWeek[]>(() => {
    const year = this.viewYear();
    const month0 = this.viewMonth();
    const selected = this.selected();
    const daysInMonth = parseAuditDate(auditIsoDay(year, month0 + 1, 0)).getUTCDate();
    // Monday-first offset of the 1st.
    const lead = (parseAuditDate(auditIsoDay(year, month0, 1)).getUTCDay() + 6) % 7;

    const slots: (CalendarCell | null)[] = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = auditIsoDay(year, month0, day);
      const events = this.eventsByDay.get(iso) ?? [];
      slots.push({
        iso,
        day,
        count: events.length,
        markers: events.slice(0, MAX_MARKERS).map((e) => ({
          tone: AUDIT_STATUS_META[e.status].tone,
          done: e.status === 'COMPLETED',
        })),
        label: D.dayLabel(formatAuditDateLong(iso), events.length, iso === selected),
      });
    }
    while (slots.length % 7 !== 0) slots.push(null);

    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < slots.length; i += 7) weeks.push(slots.slice(i, i + 7));
    return weeks;
  });

  /** The one day button that is in the tab order (roving tabindex). */
  readonly focusDay = computed(() => {
    const sel = this.selected();
    const first = auditIsoDay(this.viewYear(), this.viewMonth(), 1);
    return sel.slice(0, 7) === first.slice(0, 7) ? sel : first;
  });

  readonly selectedLabel = computed(() => formatAuditDate(this.selected()));

  readonly dayRows = computed<readonly Row[]>(() =>
    (this.eventsByDay.get(this.selected()) ?? []).map((e, i) => ({
      ...e,
      index: i + 1,
      farmer: null,
      actions: null,
    })),
  );

  openReportDialog(): void {
    this.reportDialogOpen.set(true);
  }

  /** UI only: nothing is requested. Closes the dialog and opens Audit Reports & Tier Configuration. */
  onReportGenerated(): void {
    this.reportDialogOpen.set(false);
    void this.router.navigateByUrl(AUDIT_ROUTES.reportsConfig);
  }

  shiftMonth(delta: number): void {
    const d = parseAuditDate(auditIsoDay(this.viewYear(), this.viewMonth() + delta, 1));
    this.viewYear.set(d.getUTCFullYear());
    this.viewMonth.set(d.getUTCMonth());
  }

  select(iso: string): void {
    this.selected.set(iso);
  }

  onDayKey(event: KeyboardEvent, iso: string): void {
    const offset = KEY_OFFSETS[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const current = parseAuditDate(iso);
    const next = auditIsoDay(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate() + offset,
    );
    const nextDate = parseAuditDate(next);
    this.viewYear.set(nextDate.getUTCFullYear());
    this.viewMonth.set(nextDate.getUTCMonth());
    this.selected.set(next);
    // Move focus once the grid has re-rendered (the target may be in a different month).
    setTimeout(() => {
      this.host.nativeElement.querySelector<HTMLButtonElement>(`button[data-date="${next}"]`)?.focus();
    });
  }

  private eventOf(row: Row): AuditCalendarEvent {
    return row as unknown as AuditCalendarEvent;
  }

  typeLabel(row: Row): string {
    return AUDIT_TYPE_LABEL[this.eventOf(row).type];
  }

  scheduledLabel(row: Row): string {
    return formatAuditDateTime24(this.eventOf(row).scheduledAt);
  }

  pillClass(row: Row): string {
    return auditStatusPillClass(this.eventOf(row).status, true);
  }

  statusLabel(row: Row): string {
    return AUDIT_STATUS_META[this.eventOf(row).status].label;
  }

  detailLink(row: Row): string {
    return AUDIT_ROUTES.detail(this.eventOf(row).auditId);
  }
}
