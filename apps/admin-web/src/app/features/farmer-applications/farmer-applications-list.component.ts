/**
 * Farmers Management → Farmer Applications (design SA-M3-S016). Also served at `/approvals`.
 *
 * UI-ONLY, by explicit request: this screen makes NO API calls. Every number and row comes from
 * `farmer-applications-list.mock.ts` and search, filters and paging all run client-side on it.
 * Replace the mock with listFarmerApplications (GET /v1/admin/farmer-applications) when integrating;
 * until then the client-side filtering here is demo behaviour and must not be mistaken for the
 * scope enforcement the API does.
 *
 * Review links go to /farmer-applications/<application code>. The detail screen is API-backed, so
 * until it is integrated these mock ids show its not-found / error state.
 *
 * Differences from the shared data-table: it pages with prev / current / next only and cannot show
 * "1 2 3 … 36", so the footer and pager are drawn here (same classes and look) and the shared
 * table is used for the rows only, with its own footer suppressed.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataTableCellDirective, DataTableComponent, type Column, type Row } from '../../shared/data-table/data-table.component';
import { FARMER_APPLICATIONS_LIST_STRINGS as S } from './farmer-applications-list.strings';
import {
  MOCK_APPLICATIONS,
  MOCK_KPIS,
  MOCK_TOTAL_APPLICATIONS,
  MOCK_ZONES,
  type MockApplication,
  type MockApplicationStatus,
  type MockDocumentStatus,
  type MockKpi,
} from './farmer-applications-list.mock';

/** Badge tones; each maps to a `.tohfa-badge-*` class in theme.css. */
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

interface StatusBadge {
  label: string;
  tone: Tone;
  icon: string;
}

interface Kpi {
  label: string;
  value: number;
  icon: string;
  tone: Tone;
}

interface WorkflowStep {
  label: string;
  description: string;
  icon: string;
  tone: Tone;
}

/** A pager slot: a page number, or `null` for the "…" gap. */
type PagerItem = number | null;

const PAGE_SIZE = 9;

const STATUS_BADGE: Record<MockApplicationStatus, StatusBadge> = {
  PENDING_REVIEW: { label: S.STATUS_PENDING_REVIEW, tone: 'warning', icon: 'hourglass_empty' },
  REQUEST_DOCUMENT: { label: S.STATUS_REQUEST_DOCUMENT, tone: 'info', icon: 'description' },
  APPROVED: { label: S.STATUS_APPROVED, tone: 'success', icon: 'check' },
  AUDIT_SCHEDULED: { label: S.STATUS_AUDIT_SCHEDULED, tone: 'purple', icon: 'calendar_month' },
  AUDIT_IN_PROGRESS: { label: S.STATUS_AUDIT_IN_PROGRESS, tone: 'purple', icon: 'search' },
  AUDIT_COMPLETED: { label: S.STATUS_AUDIT_COMPLETED, tone: 'neutral', icon: 'task_alt' },
  FINAL_APPROVED: { label: S.STATUS_FINAL_APPROVED, tone: 'success', icon: 'task_alt' },
  REJECTED: { label: S.STATUS_REJECTED, tone: 'danger', icon: 'cancel' },
  ON_HOLD: { label: S.STATUS_ON_HOLD, tone: 'neutral', icon: 'pause_circle' },
};

const KPI_PRESENTATION: Record<MockKpi['key'], { label: string; icon: string; tone: Tone }> = {
  TOTAL: { label: S.KPI_TOTAL, icon: 'description', tone: 'warning' },
  PENDING_REVIEW: { label: S.KPI_PENDING_REVIEW, icon: 'hourglass_empty', tone: 'warning' },
  REQUEST_DOCUMENT: { label: S.KPI_REQUEST_DOCUMENT, icon: 'upload_file', tone: 'warning' },
  APPROVED: { label: S.KPI_APPROVED, icon: 'check_circle', tone: 'success' },
  AUDIT_SCHEDULED: { label: S.KPI_AUDIT_SCHEDULED, icon: 'calendar_month', tone: 'purple' },
  REJECTED: { label: S.KPI_REJECTED, icon: 'cancel', tone: 'danger' },
};

/** First, last, the current page and its neighbours (plus 1-2-3 near the start), with gaps as null. */
function buildPager(page: number, last: number): PagerItem[] {
  const wanted = new Set<number>([1, last, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((n) => wanted.add(n));
  const pages = [...wanted].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const items: PagerItem[] = [];
  pages.forEach((n, i) => {
    if (i > 0 && n - (pages[i - 1] as number) > 1) items.push(null);
    items.push(n);
  });
  return items;
}

@Component({
  selector: 'tohfa-farmer-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Page header ---------- */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-16);
      }
      .page-title {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-page);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .breadcrumb a {
        color: inherit;
        text-decoration: none;
      }
      .breadcrumb a:hover {
        color: var(--tohfa-amber);
      }
      .tohfa-btn-secondary {
        color: var(--tohfa-ink);
      }

      /* ---------- KPI row ---------- */
      .kpis {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: var(--space-14);
      }
      .kpi-top {
        display: flex;
        align-items: center;
        gap: var(--space-8);
      }
      .kpi-card .tohfa-kpi-label {
        font-size: var(--fs-dense);
        color: var(--tohfa-ink);
      }
      .kpi-card .tohfa-kpi-val {
        margin: var(--space-14) 0 var(--space-4);
      }
      .kpi-icon {
        font-size: var(--icon-kpi-chip);
      }

      /* Tone colours: text-only (KPI icons) and tinted circles (workflow). */
      .fg-success {
        color: var(--ok);
      }
      .fg-warning {
        color: var(--warn);
      }
      .fg-danger {
        color: var(--err);
      }
      .fg-info {
        color: var(--info);
      }
      .fg-purple {
        color: var(--purple);
      }
      .fg-neutral {
        color: var(--neutral-status);
      }
      .bg-success {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .bg-warning {
        background: var(--warn-bg);
        color: var(--warn);
      }
      .bg-danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .bg-info {
        background: var(--info-bg);
        color: var(--info);
      }
      .bg-purple {
        background: var(--purple-bg);
        color: var(--purple);
      }
      .bg-neutral {
        background: var(--neutral-status-bg);
        color: var(--neutral-status);
      }

      /* ---------- Filters ---------- */
      .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10);
      }
      .search {
        position: relative;
        flex: 1 1 260px;
      }
      .search .icon {
        position: absolute;
        left: var(--space-14);
        top: 50%;
        transform: translateY(-50%);
        color: var(--tohfa-muted);
        font-size: var(--icon-input);
        pointer-events: none;
      }
      .search .tohfa-input {
        padding: var(--space-10) var(--space-14) var(--space-10) 38px;
        border-radius: var(--r-md);
      }
      .filter-pill {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-10) var(--space-12) var(--space-10) var(--space-14);
        background: var(--tohfa-surface);
        border: var(--border-input);
        border-radius: var(--r-md);
        font-size: var(--fs-cell);
        font-weight: var(--fw-semi);
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .filter-pill:focus-within {
        border-color: var(--tohfa-amber);
        box-shadow: var(--tohfa-focus-ring);
      }
      .filter-pill select {
        appearance: none;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        padding: 0;
        outline: none;
        cursor: inherit;
      }
      .filter-pill .icon {
        font-size: var(--icon-chevron);
        color: var(--tohfa-slate);
      }
      .reset {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        color: var(--tohfa-ink);
      }
      .reset .icon {
        font-size: var(--icon-chevron);
      }

      /* ---------- Table cells ---------- */
      .strong {
        font-weight: var(--fw-bold);
      }
      .pill {
        gap: var(--space-4);
      }
      .pill .icon {
        font-size: var(--fs-cell);
      }
      .review {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
        text-decoration: none;
        border-radius: var(--r-xs);
      }
      .review .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
      }
      .review:hover,
      .review:hover .icon {
        color: var(--tohfa-amber);
      }
      .review:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      /* One frame around the shared table (rows) plus this component's footer. */
      .table-wrap {
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
        overflow: hidden;
      }
      .table-wrap ::ng-deep .table-card {
        border: none;
        border-radius: 0;
      }
      /* Footer + pager: same look as shared/data-table. */
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-16);
        border-top: var(--border-divider);
        background: var(--tohfa-surface);
      }
      .range {
        color: var(--tohfa-slate);
        font-size: var(--fs-dense);
      }
      .pager {
        display: flex;
        align-items: center;
        gap: var(--space-6);
      }
      .pager .gap {
        color: var(--tohfa-muted);
        font-size: var(--fs-dense);
      }
      .pager button {
        box-sizing: border-box;
        min-width: 30px;
        height: 30px;
        padding: 0 var(--space-12);
        line-height: 1;
        border: var(--border-card);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-surface);
        color: var(--tohfa-slate);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-medium);
        cursor: pointer;
      }
      .pager button:hover:not([disabled]):not(.active) {
        background: var(--tohfa-page);
        color: var(--tohfa-ink);
      }
      .pager button.active {
        background: var(--tohfa-amber);
        border-color: var(--tohfa-amber);
        color: var(--tohfa-neutral-white);
        font-weight: var(--fw-bold);
      }
      .pager button[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pager button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      /* ---------- Workflow card ---------- */
      .wf-title {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin: 0 0 var(--space-18);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-brown);
      }
      .wf-title .icon {
        font-size: var(--icon-chevron);
        color: var(--tohfa-slate);
      }
      .workflow {
        display: flex;
        align-items: flex-start;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .wf-step {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-6);
        text-align: center;
        min-width: 0;
      }
      .wf-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--r-circle);
        margin-bottom: var(--space-4);
      }
      .wf-circle .icon {
        font-size: var(--icon-nav);
      }
      .wf-label {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .wf-desc {
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .wf-arrow {
        flex: 0 0 auto;
        padding-top: var(--space-8);
        color: var(--tohfa-muted);
      }
      .wf-arrow .icon {
        font-size: var(--icon-chevron);
      }

      @media (max-width: 1200px) {
        .kpis {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .workflow {
          flex-wrap: wrap;
          row-gap: var(--space-18);
        }
        .wf-step {
          flex: 0 0 22%;
        }
        .wf-arrow {
          display: none;
        }
      }
      @media (max-width: 640px) {
        .kpis {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .page-header {
          flex-direction: column;
        }
        .wf-step {
          flex: 0 0 45%;
        }
      }
    `,
  ],
  template: `
    <!-- Page header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ S.TITLE }}</h1>
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/dashboard">{{ S.BREADCRUMB_DASHBOARD }}</a>
          <span>/</span>
          <span>{{ S.BREADCRUMB_MODULE }}</span>
          <span>/</span>
          <span>{{ S.BREADCRUMB_CURRENT }}</span>
        </nav>
      </div>
      <button type="button" class="tohfa-btn tohfa-btn-secondary" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
        <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_EXPORT }}
      </button>
    </header>

    <!-- KPI cards (mock values) -->
    <section class="kpis">
      <div class="tohfa-kpi-card kpi-card" *ngFor="let kpi of kpis">
        <div class="kpi-top">
          <span class="material-symbols-outlined kpi-icon fg-{{ kpi.tone }}" aria-hidden="true">{{ kpi.icon }}</span>
          <span class="tohfa-kpi-label">{{ kpi.label }}</span>
        </div>
        <div class="tohfa-kpi-val">{{ kpi.value }}</div>
      </div>
    </section>

    <!-- Filters -->
    <section class="tohfa-card filters">
      <label class="search">
        <span class="material-symbols-outlined icon" aria-hidden="true">search</span>
        <input
          class="tohfa-input"
          type="search"
          maxlength="100"
          [placeholder]="S.SEARCH_PLACEHOLDER"
          [attr.aria-label]="S.SEARCH_PLACEHOLDER"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
        />
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_APPLICATION_STATUS }}</span>
        <select [ngModel]="status()" (ngModelChange)="setStatus($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
        </select>
        <span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_DOCUMENT_STATUS }}</span>
        <select [ngModel]="docStatus()" (ngModelChange)="setDocStatus($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option value="COMPLETE">{{ S.DOC_COMPLETE }}</option>
          <option value="INCOMPLETE">{{ S.DOC_INCOMPLETE }}</option>
        </select>
        <span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_ZONE }}</span>
        <select [ngModel]="zone()" (ngModelChange)="setZone($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option *ngFor="let z of zones" [value]="z">{{ z }}</option>
        </select>
        <span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
      </label>

      <button type="button" class="tohfa-btn tohfa-btn-secondary reset" (click)="resetFilters()">
        <span class="material-symbols-outlined icon" aria-hidden="true">refresh</span>{{ S.BTN_RESET }}
      </button>
    </section>

    <!-- Applications table. The shared table renders rows only (its footer stays hidden because
         total <= pageSize and no footerLabel is passed); the footer below has the ellipsis pager. -->
    <div class="table-wrap">
      <tohfa-data-table
        [columns]="columns"
        [rows]="rows()"
        [total]="rows().length"
        [page]="1"
        [pageSize]="pageSize"
        [emptyMessage]="emptyMessage()"
      >
        <ng-template tohfaCell="applicationCode" let-row>
          <span class="strong">{{ row.applicationCode }}</span>
        </ng-template>
        <ng-template tohfaCell="submittedAt" let-row>{{ row.submittedAt | date: 'dd MMM yyyy' : 'UTC' }}</ng-template>
        <ng-template tohfaCell="documentStatus" let-row>
          <span
            class="tohfa-badge pill"
            [class.tohfa-badge-success]="row.documentStatus === 'COMPLETE'"
            [class.tohfa-badge-danger]="row.documentStatus !== 'COMPLETE'"
          >
            <span class="material-symbols-outlined icon" aria-hidden="true">{{
              row.documentStatus === 'COMPLETE' ? 'check_circle' : 'cancel'
            }}</span
            >{{ row.documentStatus === 'COMPLETE' ? S.DOC_COMPLETE : S.DOC_INCOMPLETE }}
          </span>
        </ng-template>
        <ng-template tohfaCell="status" let-row>
          <span class="tohfa-badge tohfa-badge-{{ statusBadge(row).tone }} pill">
            <span class="material-symbols-outlined icon" aria-hidden="true">{{ statusBadge(row).icon }}</span
            >{{ statusBadge(row).label }}
          </span>
        </ng-template>
        <ng-template tohfaCell="actions" let-row>
          <a class="review" [routerLink]="['/farmer-applications', row.applicationCode]">
            <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.ACTION_REVIEW }}
          </a>
        </ng-template>
      </tohfa-data-table>

      <div class="footer" *ngIf="footerLabel() !== '' || pagerItems().length > 0">
        <span class="range">{{ footerLabel() }}</span>
        <div class="pager" *ngIf="pagerItems().length > 0">
          <button type="button" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">{{ S.PREV }}</button>
          <ng-container *ngFor="let item of pagerItems()">
            <span class="gap" *ngIf="item === null" aria-hidden="true">…</span>
            <button
              type="button"
              *ngIf="item !== null"
              [class.active]="item === page()"
              [attr.aria-current]="item === page() ? 'page' : null"
              (click)="goToPage(item)"
            >
              {{ item }}
            </button>
          </ng-container>
          <button type="button" [disabled]="page() >= lastPage()" (click)="goToPage(page() + 1)">{{ S.NEXT }}</button>
        </div>
      </div>
    </div>

    <!-- Workflow (static, informational) -->
    <section class="tohfa-card">
      <h2 class="wf-title">
        {{ S.WORKFLOW_TITLE }}
        <span class="material-symbols-outlined icon" [title]="S.WORKFLOW_INFO" [attr.aria-label]="S.WORKFLOW_INFO">info</span>
      </h2>
      <ol class="workflow">
        <ng-container *ngFor="let step of workflow; let last = last">
          <li class="wf-step">
            <span class="wf-circle bg-{{ step.tone }}">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ step.icon }}</span>
            </span>
            <span class="wf-label">{{ step.label }}</span>
            <span class="wf-desc">{{ step.description }}</span>
          </li>
          <li class="wf-arrow" *ngIf="!last" aria-hidden="true">
            <span class="material-symbols-outlined icon">arrow_forward</span>
          </li>
        </ng-container>
      </ol>
    </section>
  `,
})
export class FarmerApplicationsListComponent {
  readonly S = S;
  readonly pageSize = PAGE_SIZE;

  readonly kpis: readonly Kpi[] = MOCK_KPIS.map((k) => ({ ...KPI_PRESENTATION[k.key], value: k.value }));

  readonly workflow: readonly WorkflowStep[] = [
    { label: S.WF_PENDING_REVIEW, description: S.WF_PENDING_REVIEW_DESC, icon: 'hourglass_empty', tone: 'warning' },
    { label: S.WF_REQUEST_DOCUMENT, description: S.WF_REQUEST_DOCUMENT_DESC, icon: 'upload_file', tone: 'info' },
    { label: S.WF_APPROVED, description: S.WF_APPROVED_DESC, icon: 'check', tone: 'success' },
    { label: S.WF_AUDIT_SCHEDULED, description: S.WF_AUDIT_SCHEDULED_DESC, icon: 'calendar_month', tone: 'purple' },
    { label: S.WF_AUDIT_IN_PROGRESS, description: S.WF_AUDIT_IN_PROGRESS_DESC, icon: 'search', tone: 'purple' },
    { label: S.WF_AUDIT_COMPLETED, description: S.WF_AUDIT_COMPLETED_DESC, icon: 'task_alt', tone: 'neutral' },
    { label: S.WF_FINAL_APPROVED, description: S.WF_FINAL_APPROVED_DESC, icon: 'task_alt', tone: 'success' },
    { label: S.WF_REJECTED, description: S.WF_REJECTED_DESC, icon: 'cancel', tone: 'danger' },
  ];

  readonly columns: readonly Column[] = [
    { key: 'applicationCode', header: S.COL_APPLICATION_ID },
    { key: 'name', header: S.COL_APPLICANT_NAME },
    { key: 'mobile', header: S.COL_MOBILE },
    { key: 'zone', header: S.COL_ZONE },
    { key: 'farmingMethod', header: S.COL_FARMING_METHOD },
    { key: 'submittedAt', header: S.COL_SUBMITTED },
    { key: 'documentStatus', header: S.COL_DOCUMENT_STATUS },
    { key: 'status', header: S.COL_APPLICATION_STATUS },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  readonly statusOptions = (Object.keys(STATUS_BADGE) as MockApplicationStatus[]).map((value) => ({
    value,
    label: STATUS_BADGE[value].label,
  }));
  readonly zones = MOCK_ZONES;

  readonly search = signal('');
  readonly status = signal<MockApplicationStatus | ''>('');
  readonly docStatus = signal<MockDocumentStatus | ''>('');
  readonly zone = signal('');
  readonly page = signal(1);

  readonly filterActive = computed(
    () => this.search().trim() !== '' || this.status() !== '' || this.docStatus() !== '' || this.zone() !== '',
  );

  /** Mock rows matching the filters; with none active, the whole mock set (the 2 demo pages). */
  private readonly matching = computed<readonly MockApplication[]>(() => {
    const q = this.search().trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const status = this.status();
    const doc = this.docStatus();
    const zone = this.zone();
    return MOCK_APPLICATIONS.filter((a) => {
      if (status !== '' && a.status !== status) return false;
      if (doc !== '' && a.documentStatus !== doc) return false;
      if (zone !== '' && a.zone !== zone) return false;
      if (q === '') return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.applicationCode.toLowerCase().includes(q) ||
        (qDigits !== '' && a.mobile.replace(/\s/g, '').includes(qDigits))
      );
    });
  });

  /** Unfiltered the pager covers the design's 324 applications; filtered, only the matching mock rows. */
  private readonly totalCount = computed(() => (this.filterActive() ? this.matching().length : MOCK_TOTAL_APPLICATIONS));
  readonly lastPage = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));

  readonly rows = computed<Array<MockApplication & { actions: null }>>(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.matching()
      .slice(start, start + PAGE_SIZE)
      .map((a) => ({ ...a, actions: null }));
  });

  readonly pagerItems = computed<PagerItem[]>(() => (this.lastPage() > 1 ? buildPager(this.page(), this.lastPage()) : []));

  readonly footerLabel = computed(() => {
    if (this.filterActive()) {
      const count = this.matching().length;
      return count === 0 ? '' : S.showingMatching(this.rows().length, count);
    }
    const first = (this.page() - 1) * PAGE_SIZE + 1;
    return S.showing(first, Math.min(this.page() * PAGE_SIZE, MOCK_TOTAL_APPLICATIONS), MOCK_TOTAL_APPLICATIONS);
  });

  readonly emptyMessage = computed(() => (this.filterActive() ? S.EMPTY : S.EMPTY_DEMO_PAGE));

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  setStatus(value: MockApplicationStatus | ''): void {
    this.status.set(value);
    this.page.set(1);
  }

  setDocStatus(value: MockDocumentStatus | ''): void {
    this.docStatus.set(value);
    this.page.set(1);
  }

  setZone(value: string): void {
    this.zone.set(value);
    this.page.set(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.docStatus.set('');
    this.zone.set('');
    this.page.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage() || page === this.page()) return;
    this.page.set(page);
  }

  statusBadge(row: Row): StatusBadge {
    return STATUS_BADGE[(row as MockApplication).status];
  }
}
