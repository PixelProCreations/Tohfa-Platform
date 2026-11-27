/**
 * Audit Management → Audit Inspection & Findings (design 77). UI ONLY.
 *
 * Route: `/audits/:id/findings` (AUDIT_ROUTES.findings). Reads `:id` (AUDIT_ROUTE_PARAMS.id) and falls
 * back to AUD-2026-0034 (design 77) when the param is missing, so the screen never errors.
 *
 * Data: `mockAuditById(id)` (audit.mock.ts) and `mockAuditFindingsSheet(id)` (audit-findings.mock.ts,
 * shaped like docs/openapi.yaml `AuditDetail.categoryScores` / `findings`). Every summary number is
 * computed from the sheet — total = direct sum of scored categories (BR-04 / BR-06, max 100), counts by
 * severity mirror `AuditFindingCounts`, and the compliance tier is shown only for a COMPLETED audit
 * with all 10 categories scored (`AuditTier` is null before completion; bands from AUDIT_TIER_BANDS,
 * BR-04b — integrated screens read them from rating_tier_config, never from a literal).
 *
 * Links: tab "Details & Farmer Records" → AUDIT_ROUTES.detail(id); "Start Audit" →
 * AUDIT_ROUTES.inspection(id). Inert (no design): "Edit audit schedule".
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import { AUDIT_DETAIL_STRINGS as D } from './audit-detail.strings';
import { mockAuditFindingsSheet } from './audit-findings.mock';
import { AUDIT_FINDINGS_STRINGS as F } from './audit-findings.strings';
import { formatAuditDate, formatAuditDateTime24 } from './audit-format';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import {
  AUDIT_SEVERITY_META,
  AUDIT_TYPE_LABEL,
  auditStatusLabel,
  auditStatusPillClass,
  auditToneClass,
} from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_RATING_CATEGORIES, AUDIT_TIER_BANDS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditRatingCategoryCode } from './audit.types';

/** Design 77's audit, used when the route carries no id. */
export const AUDIT_FINDINGS_DEFAULT_ID = 'AUD-2026-0034';

/** Max total score: 10 categories x 10 (BR-04). Derived from the categories, not a literal. */
const MAX_TOTAL = AUDIT_RATING_CATEGORIES.reduce((sum, c) => sum + c.maxScore, 0);

interface InfoItem {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
}

interface CategoryRowView {
  readonly index: number;
  readonly category: string;
  readonly scoreText: string;
  readonly scored: boolean;
  readonly remarks: string;
  readonly evidence: string;
}

interface FindingView {
  readonly id: string;
  readonly severityLabel: string;
  readonly severityClass: string;
  readonly category: string | null;
  readonly description: string;
  readonly due: string | null;
}

@Component({
  selector: 'tohfa-audit-findings',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .sep {
        color: var(--tohfa-muted);
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-16);
        margin: 0;
      }
      .info-grid dt,
      .info-grid dd {
        margin: 0;
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
      }
      .context {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-14) var(--space-28);
        border-left: var(--space-4) solid var(--tohfa-amber);
      }
      .context-title {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-brown);
      }
      .context dl {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-14) var(--space-28);
        margin: 0;
      }
      .context dt,
      .context dd {
        margin: 0;
      }
      .cat-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-8) var(--space-12);
      }
      .cat-head-title {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .cat-head-title .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-brown);
      }
      .cat-info {
        display: inline-flex;
        align-items: flex-start;
        gap: var(--space-4);
        margin: 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .cat-info .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .cat-name {
        font-weight: var(--fw-bold);
      }
      .muted {
        color: var(--tohfa-slate);
      }
      .evidence {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        color: var(--info);
        font-weight: var(--fw-semi);
      }
      .evidence .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .bottom {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
        gap: var(--space-14);
        align-items: stretch;
      }
      .findings-card {
        border-left: var(--space-4) solid var(--err);
      }
      .findings-card .audit-card-head {
        background: var(--tohfa-surface);
        color: var(--err);
      }
      .findings-card .audit-card-head .material-symbols-outlined {
        color: var(--err);
      }
      .findings-empty {
        margin: 0 0 var(--space-14);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .finding-list {
        list-style: none;
        margin: 0 0 var(--space-14);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
      }
      .finding-list li {
        display: flex;
        align-items: flex-start;
        gap: var(--space-10);
        font-size: var(--fs-dense);
      }
      .finding-sub {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-12);
      }
      .tile {
        display: flex;
        align-items: flex-start;
        gap: var(--space-10);
        padding: var(--space-14);
        border-radius: var(--r-md);
      }
      .tile .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .tile-label {
        display: block;
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
      }
      .tile-value {
        display: block;
        font-size: var(--fs-kpi);
        font-weight: var(--fw-xbold);
        line-height: 1;
        color: var(--tohfa-ink);
      }
      .summary-label {
        color: var(--tohfa-brown);
      }
      .inert {
        cursor: default;
      }
      @media (max-width: 1200px) {
        .info-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 900px) {
        .bottom {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 640px) {
        .info-grid,
        .tiles {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div class="audit-title-row">
        <span class="audit-title-tile" aria-hidden="true">
          <span class="material-symbols-outlined">fact_check</span>
        </span>
        <div>
          <h1 class="audit-title">{{ F.TITLE }}</h1>
          <p class="audit-meta-row">
            <span>{{ audit().id }}</span>
            <span class="sep" aria-hidden="true">|</span>
            <span>{{ audit().farmerName }}</span>
            <span class="sep" aria-hidden="true">|</span>
            <span [class]="statusPillDense()">{{ statusLabel() }}</span>
          </p>
        </div>
      </div>
    </header>

    <section class="audit-card" [attr.aria-label]="F.INFO_REGION">
      <div class="audit-card-body">
        <dl class="info-grid">
          <div class="audit-summary-item" *ngFor="let item of infoItems()">
            <span class="material-symbols-outlined audit-summary-icon" aria-hidden="true">{{ item.icon }}</span>
            <div>
              <dt class="audit-summary-label">{{ item.label }}</dt>
              <dd class="audit-summary-value">{{ item.value }}</dd>
            </div>
          </div>
        </dl>
      </div>
    </section>

    <nav class="tabs" [attr.aria-label]="D.TABS_LABEL">
      <a class="tohfa-btn audit-btn-outline audit-btn" [routerLink]="routes.detail(audit().id)">
        <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ D.TAB_DETAILS }}
      </a>
      <a
        class="tohfa-btn tohfa-btn-primary audit-btn"
        aria-current="page"
        [routerLink]="routes.findings(audit().id)"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">fact_check</span>{{ D.TAB_FINDINGS }}
      </a>
    </nav>

    <section class="audit-card" aria-labelledby="af-context">
      <div class="audit-card-body context">
        <h2 class="context-title" id="af-context">{{ F.CONTEXT_TITLE }}</h2>
        <dl>
          <div>
            <dt class="audit-summary-label">{{ F.CONTEXT_AUDIT }}</dt>
            <dd class="audit-summary-value">{{ audit().id }}</dd>
          </div>
          <div>
            <dt class="audit-summary-label">{{ F.CONTEXT_FARMER_FARM }}</dt>
            <dd class="audit-summary-value">{{ farmerAndFarm() }}</dd>
          </div>
          <div>
            <dt class="audit-summary-label">{{ F.CONTEXT_AUDIT_TYPE }}</dt>
            <dd class="audit-summary-value">{{ typeLabel() }}</dd>
          </div>
          <div>
            <dt class="audit-summary-label">{{ F.CONTEXT_AUDIT_DATE }}</dt>
            <dd class="audit-summary-value">{{ auditDate() }}</dd>
          </div>
          <div>
            <dt class="audit-summary-label">{{ F.CONTEXT_LEAD_AUDITOR }}</dt>
            <dd class="audit-summary-value">{{ audit().auditorName }}</dd>
          </div>
          <div>
            <dt class="audit-summary-label">{{ F.CONTEXT_STATUS }}</dt>
            <dd class="audit-summary-value"><span [class]="statusPillDense()">{{ statusLabel() }}</span></dd>
          </div>
        </dl>
      </div>
    </section>

    <section aria-labelledby="af-categories">
      <div class="cat-head">
        <h2 class="cat-head-title" id="af-categories">
          <span class="material-symbols-outlined" aria-hidden="true">grid_view</span>{{ F.CATEGORIES_TITLE }}
        </h2>
        <p class="cat-info">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>{{ F.CATEGORIES_INFO }}
        </p>
      </div>
      <div class="audit-table-wrap">
        <tohfa-data-table
          [columns]="columns"
          [rows]="categoryRows()"
          [total]="categoryRows().length"
          [page]="1"
          [pageSize]="categoryRows().length || 1"
          [emptyMessage]="F.CATEGORIES_EMPTY"
        >
          <ng-template tohfaCell="category" let-row><span class="cat-name">{{ row.category }}</span></ng-template>
          <ng-template tohfaCell="scoreText" let-row>
            <span [class]="scorePillClass(row)">{{ row.scoreText }}</span>
          </ng-template>
          <ng-template tohfaCell="remarks" let-row><span class="muted">{{ row.remarks }}</span></ng-template>
          <ng-template tohfaCell="evidence" let-row>
            <span class="evidence">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>{{ row.evidence }}
            </span>
          </ng-template>
        </tohfa-data-table>
      </div>
    </section>

    <div class="bottom">
      <section class="audit-card findings-card" aria-labelledby="af-findings">
        <h2 class="audit-card-head" id="af-findings">
          <span class="material-symbols-outlined" aria-hidden="true">flag</span>{{ F.FINDINGS_TITLE }}
        </h2>
        <div class="audit-card-body">
          <ul class="finding-list" *ngIf="findings().length > 0; else noFindings">
            <li *ngFor="let f of findings()">
              <span [class]="f.severityClass">{{ f.severityLabel }}</span>
              <span>
                {{ f.description }}
                <span class="finding-sub" *ngIf="f.category !== null">{{ f.category }}</span>
                <span class="finding-sub" *ngIf="f.due !== null">{{ f.due }}</span>
              </span>
            </li>
          </ul>
          <ng-template #noFindings>
            <p class="findings-empty">{{ F.FINDINGS_EMPTY }}</p>
          </ng-template>
          <div class="tiles">
            <div class="tile tone-bg-amber">
              <span class="material-symbols-outlined tone-fg-warning" aria-hidden="true">warning</span>
              <div>
                <span class="tile-label">{{ F.MAJOR_FINDINGS }}</span>
                <span class="tile-value">{{ majorCount() }}</span>
              </div>
            </div>
            <div class="tile tone-bg-neutral">
              <span class="material-symbols-outlined" aria-hidden="true">flag</span>
              <div>
                <span class="tile-label">{{ F.MINOR_FINDINGS }}</span>
                <span class="tile-value">{{ minorCount() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="audit-card" aria-labelledby="af-summary">
        <h2 class="audit-card-head" id="af-summary">
          <span class="material-symbols-outlined" aria-hidden="true">bar_chart</span>{{ F.SUMMARY_TITLE }}
        </h2>
        <div class="audit-card-body">
          <dl class="audit-kv">
            <div class="audit-kv-row">
              <dt class="audit-kv-label summary-label">{{ F.TOTAL_SCORE }}</dt>
              <dd class="audit-kv-value">{{ totalText() }}</dd>
            </div>
            <div class="audit-kv-row">
              <dt class="audit-kv-label summary-label">{{ F.CATEGORIES_SCORED }}</dt>
              <dd class="audit-kv-value">{{ scoredText() }}</dd>
            </div>
            <div class="audit-kv-row">
              <dt class="audit-kv-label summary-label">{{ F.MAJOR_FINDINGS }}</dt>
              <dd class="audit-kv-value">{{ majorCount() }}</dd>
            </div>
            <div class="audit-kv-row">
              <dt class="audit-kv-label summary-label">{{ F.MINOR_FINDINGS }}</dt>
              <dd class="audit-kv-value">{{ minorCount() }}</dd>
            </div>
            <div class="audit-kv-row">
              <dt class="audit-kv-label summary-label">{{ F.EVIDENCE_COUNT }}</dt>
              <dd class="audit-kv-value">{{ evidenceTotal() }}</dd>
            </div>
            <div class="audit-kv-row">
              <dt class="audit-kv-label summary-label">{{ F.COMPLIANCE_TIER }}</dt>
              <dd class="audit-kv-value">
                <span *ngIf="tier() as t; else afterFinalizing" [class]="t.pillClass">{{ t.label }}</span>
                <ng-template #afterFinalizing><span class="muted">{{ F.TIER_AFTER_FINALIZING }}</span></ng-template>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>

    <div class="audit-footer" role="group" [attr.aria-label]="D.FOOTER_LABEL">
      <!-- Inert: no design for editing a schedule yet. -->
      <button
        type="button"
        class="tohfa-btn audit-btn-outline audit-btn inert"
        aria-disabled="true"
        [title]="S.NO_DESIGN_YET"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ D.EDIT_SCHEDULE }}
      </button>
      <a class="tohfa-btn tohfa-btn-primary audit-btn" [routerLink]="routes.inspection(audit().id)">
        <span class="material-symbols-outlined icon" aria-hidden="true">play_arrow</span>{{ D.START_AUDIT }}
      </a>
    </div>
  `,
})
export class AuditFindingsComponent {
  readonly S = S;
  readonly D = D;
  readonly F = F;
  readonly routes = AUDIT_ROUTES;

  readonly columns: readonly Column[] = [
    { key: 'index', header: F.COL_INDEX },
    { key: 'category', header: F.COL_CATEGORY },
    { key: 'scoreText', header: F.COL_SCORE },
    { key: 'remarks', header: F.COL_REMARKS },
    { key: 'evidence', header: F.COL_EVIDENCE },
  ];

  private readonly route = inject(ActivatedRoute);

  /** The audit id from `:id`, or design 77's audit. */
  readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_FINDINGS_DEFAULT_ID)),
    {
      initialValue:
        this.route.snapshot.paramMap.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_FINDINGS_DEFAULT_ID,
    },
  );

  readonly audit = computed(() => mockAuditById(this.auditId()));
  readonly sheet = computed(() => mockAuditFindingsSheet(this.auditId()));

  readonly statusLabel = computed(() => auditStatusLabel(this.audit().status));
  readonly statusPillDense = computed(() => auditStatusPillClass(this.audit().status, true));
  readonly typeLabel = computed(() => AUDIT_TYPE_LABEL[this.audit().type]);
  readonly auditDate = computed(() => formatAuditDate(this.audit().scheduledAt));

  /** First plot id, else the farm code, else the farm name (design 77: "PLT-00177-1"). */
  private readonly farmRef = computed(() => {
    const a = this.audit();
    return a.plotIds[0] ?? a.farmCode ?? a.farmName;
  });

  readonly farmerAndFarm = computed(() => F.pair(this.audit().farmerName, this.farmRef()));

  readonly infoItems = computed<readonly InfoItem[]>(() => {
    const a = this.audit();
    return [
      { icon: 'tag', label: F.AUDIT_ID, value: a.id },
      { icon: 'category', label: F.AUDIT_TYPE, value: this.typeLabel() },
      { icon: 'calendar_month', label: F.SCHEDULED, value: formatAuditDateTime24(a.scheduledAt) },
      { icon: 'person', label: F.FARMER, value: F.pair(a.farmerName, a.farmerCode) },
      { icon: 'landscape', label: F.FARM_ZONE, value: F.pair(this.farmRef(), a.zone) },
      { icon: 'badge', label: F.ASSIGNED_AUDITOR, value: a.auditorName },
      {
        icon: 'groups',
        label: F.SUPPORTING_PARTICIPANTS,
        value: a.supportingParticipants.length === 0 ? S.NONE : a.supportingParticipants.join(', '),
      },
      { icon: 'target', label: F.AUDIT_PURPOSE, value: a.purpose ?? S.DASH },
      {
        icon: 'schedule',
        label: F.LAST_UPDATED,
        value:
          a.lastUpdatedAt === null
            ? S.DASH
            : F.lastUpdated(formatAuditDateTime24(a.lastUpdatedAt), a.lastUpdatedBy),
      },
    ];
  });

  readonly categoryRows = computed<readonly Row[]>(() =>
    this.sheet().categoryScores.map((c, i): Row => {
      const view: CategoryRowView = {
        index: i + 1,
        category: categoryShortLabel(c.categoryCode),
        scoreText: c.score === null ? F.NOT_SCORED : F.score(c.score, c.maxScore),
        scored: c.score !== null,
        remarks: c.remarks ?? S.DASH,
        evidence: c.evidenceCount === 0 ? F.NONE_ATTACHED : F.evidenceCount(c.evidenceCount),
      };
      return { ...view };
    }),
  );

  readonly scoredCount = computed(
    () => this.sheet().categoryScores.filter((c) => c.score !== null).length,
  );

  /** Direct sum of scored categories (BR-06). */
  readonly total = computed(() =>
    this.sheet().categoryScores.reduce((sum, c) => sum + (c.score ?? 0), 0),
  );

  readonly totalText = computed(() => F.totalScore(this.total(), MAX_TOTAL));
  readonly scoredText = computed(() =>
    F.categoriesScored(this.scoredCount(), this.sheet().categoryScores.length),
  );

  readonly majorCount = computed(
    () => this.sheet().findings.filter((f) => f.severity === 'MAJOR').length,
  );
  readonly minorCount = computed(
    () => this.sheet().findings.filter((f) => f.severity === 'MINOR').length,
  );
  readonly evidenceTotal = computed(() =>
    this.sheet().categoryScores.reduce((sum, c) => sum + c.evidenceCount, 0),
  );

  readonly findings = computed<readonly FindingView[]>(() =>
    this.sheet().findings.map((f) => ({
      id: f.id,
      severityLabel: AUDIT_SEVERITY_META[f.severity].label,
      severityClass: auditToneClass(AUDIT_SEVERITY_META[f.severity].tone, true),
      category: f.categoryCode === null ? null : categoryShortLabel(f.categoryCode),
      description: f.description,
      due: f.dueDate === null ? null : F.findingDue(formatAuditDate(f.dueDate)),
    })),
  );

  /** `AuditTier` is null until the audit is COMPLETED (docs/openapi.yaml); then BR-04b bands. */
  readonly tier = computed<{ readonly label: string; readonly pillClass: string } | null>(() => {
    if (this.audit().status !== 'COMPLETED') return null;
    if (this.scoredCount() !== this.sheet().categoryScores.length) return null;
    const total = this.total();
    const band = AUDIT_TIER_BANDS.find((b) => total >= b.minScore && total <= b.maxScore);
    return band === undefined ? null : { label: band.label, pillClass: auditToneClass(band.tone, true) };
  });

  scorePillClass(row: Row): string {
    return auditToneClass(row['scored'] === true ? 'success' : 'neutral', true);
  }
}

function categoryShortLabel(code: AuditRatingCategoryCode): string {
  return AUDIT_RATING_CATEGORIES.find((c) => c.code === code)?.shortLabel ?? code;
}
