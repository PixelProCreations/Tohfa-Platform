/**
 * Audit Management → Audit Details & Farmer Records (design 76). UI ONLY.
 *
 * Route: `/audits/:id` (AUDIT_ROUTES.detail). Reads `:id` (AUDIT_ROUTE_PARAMS.id) and falls back to
 * AUD-2026-0058 (design 76) when the param is missing, so the screen never errors.
 *
 * Data: `mockAuditById(id)` (audit.mock.ts) for the audit / farmer / farm, `mockAuditDetailExtras(id)`
 * (audit-detail.mock.ts) for documents, checklist, certifications, previous audits and the timeline.
 * When integrated: `GET /admin/audits/{id}`, `GET /admin/farmers/{id}`, `/documents`,
 * `/admin/certifications?farmerId=` — see the mock file headers.
 *
 * Layout switch: this template is the UPCOMING layout (design 76) and is also used for unknown ids.
 * Every other status renders <tohfa-audit-detail-full> (design 94, audit-detail-full.component.ts)
 * instead — see `auditDetailUsesFullLayout` in audit-detail-full.mock.ts.
 *
 * Links: tab "Inspection & Findings" → AUDIT_ROUTES.findings(id); "Start Audit" →
 * AUDIT_ROUTES.inspection(id); "Open farmer profile" → /farmers (the farmers list — the audit mock has
 * no farmer UUID to deep-link with). Inert (no design): "Edit audit schedule".
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuditDetailFullComponent } from './audit-detail-full.component';
import { auditDetailUsesFullLayout } from './audit-detail-full.mock';
import { AUDIT_DETAIL_STRINGS as D } from './audit-detail.strings';
import {
  AUDIT_PROFILE_STATUS_TONE,
  AUDIT_RECORD_STATUS_TONE,
  mockAuditDetailExtras,
  type AuditChecklistKind,
  type AuditDetailDocumentKind,
  type AuditFarmerProfileStatus,
  type AuditRecordStatus,
  type AuditTimelineEntry,
} from './audit-detail.mock';
import { formatAuditDate, formatAuditDateTime24 } from './audit-format';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import {
  AUDIT_TYPE_LABEL,
  auditStatusLabel,
  auditStatusPillClass,
  auditToneClass,
} from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';

/** Design 76's audit, used when the route carries no id. */
export const AUDIT_DETAIL_DEFAULT_ID = 'AUD-2026-0058';

const DOCUMENT_LABEL: Readonly<Record<AuditDetailDocumentKind, string>> = {
  IDENTITY_PROOF: D.DOC_IDENTITY_PROOF,
  ADDRESS_PROOF: D.DOC_ADDRESS_PROOF,
  LAND_OWNERSHIP_PROOF: D.DOC_LAND_OWNERSHIP_PROOF,
  FMB_SKETCH: D.DOC_FMB_SKETCH,
  SOIL_REPORT: D.DOC_SOIL_REPORT,
};

const CHECKLIST_LABEL: Readonly<Record<AuditChecklistKind, string>> = {
  FARMER_PROFILE: D.CHECK_FARMER_PROFILE,
  FARM_DETAILS: D.CHECK_FARM_DETAILS,
  FMB_SKETCH: D.CHECK_FMB_SKETCH,
  LAND_OWNERSHIP_PROOF: D.CHECK_LAND_OWNERSHIP_PROOF,
  CERTIFICATIONS: D.CHECK_CERTIFICATIONS,
  SOIL_REPORT: D.CHECK_SOIL_REPORT,
};

const RECORD_STATUS_LABEL: Readonly<Record<AuditRecordStatus, string>> = {
  SUBMITTED: D.RECORD_SUBMITTED,
  NOT_SUBMITTED: D.RECORD_NOT_SUBMITTED,
};

const PROFILE_STATUS_LABEL: Readonly<Record<AuditFarmerProfileStatus, string>> = {
  ACTIVE: D.PROFILE_ACTIVE,
  PENDING: D.PROFILE_PENDING,
  DISABLED: D.PROFILE_DISABLED,
};

interface LabelledPill {
  readonly label: string;
  readonly pillLabel: string;
  readonly pillClass: string;
}

interface TimelineView {
  readonly when: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'tohfa-audit-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditDetailFullComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .head-left {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
      }
      .head-pills {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-8);
      }
      .head-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-12) var(--space-20);
        margin: 0;
      }
      .head-meta-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-6);
      }
      .head-meta-item .material-symbols-outlined {
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
      }
      .head-meta-label {
        margin: 0;
        font-size: var(--fs-badge-s);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
        text-transform: uppercase;
      }
      .head-meta-value {
        margin: 0;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
      }
      .detail-cols {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-14);
        align-items: start;
      }
      .detail-col {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
      }
      .stack {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-4);
      }
      .card-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        margin-top: var(--space-12);
        color: var(--tohfa-brown);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        text-decoration: none;
        border-radius: var(--r-xs);
      }
      .card-link:hover {
        color: var(--tohfa-brown-deep);
      }
      .card-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .card-link .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .row-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .row-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        padding: var(--space-10) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
      }
      .row-list li:first-child {
        padding-top: 0;
      }
      .row-list li:last-child {
        padding-bottom: 0;
        border-bottom: none;
      }
      .row-sub {
        display: block;
        font-size: var(--fs-cap);
        font-weight: var(--fw-medium);
        color: var(--tohfa-slate);
      }
      .timeline {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }
      .timeline li {
        position: relative;
        padding-left: var(--space-18);
      }
      .timeline li::before {
        content: '';
        position: absolute;
        left: 0;
        top: var(--space-4);
        width: var(--space-8);
        height: var(--space-8);
        border-radius: var(--r-circle);
        background: var(--tohfa-amber);
      }
      .timeline-when {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .timeline-title {
        display: block;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
      }
      .timeline-desc {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .inert {
        cursor: default;
      }
      @media (max-width: 1200px) {
        .detail-cols {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .detail-cols {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    @if (useFullLayout()) {
    <tohfa-audit-detail-full [auditId]="auditId()" />
    } @else {
    <header class="audit-page-header">
      <div class="head-left">
        <div class="audit-title-row">
          <span class="audit-title-tile" aria-hidden="true">
            <span class="material-symbols-outlined">assignment</span>
          </span>
          <h1 class="audit-title">{{ D.TITLE }}</h1>
        </div>
        <div class="head-pills">
          <span class="tohfa-badge tohfa-badge-info">{{ audit().id }}</span>
          <span [class]="statusPill()">{{ statusLabel() }}</span>
        </div>
      </div>

      <dl class="head-meta" [attr.aria-label]="D.HEADER_META_REGION">
        <div class="head-meta-item">
          <span class="material-symbols-outlined" aria-hidden="true">person</span>
          <div>
            <dt class="head-meta-label">{{ D.META_FARMER }}</dt>
            <dd class="head-meta-value">{{ audit().farmerName }}</dd>
          </div>
        </div>
        <div class="head-meta-item">
          <span class="material-symbols-outlined" aria-hidden="true">landscape</span>
          <div>
            <dt class="head-meta-label">{{ D.META_FARM }}</dt>
            <dd class="head-meta-value">{{ audit().farmName }}</dd>
          </div>
        </div>
        <div class="head-meta-item">
          <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
          <div>
            <dt class="head-meta-label">{{ D.META_SCHEDULED }}</dt>
            <dd class="head-meta-value">{{ scheduled() }}</dd>
          </div>
        </div>
        <div class="head-meta-item">
          <span class="material-symbols-outlined" aria-hidden="true">description</span>
          <div>
            <dt class="head-meta-label">{{ D.META_AUDIT_TYPE }}</dt>
            <dd class="head-meta-value">{{ typeLabel() }}</dd>
          </div>
        </div>
      </dl>
    </header>

    <nav class="tabs" [attr.aria-label]="D.TABS_LABEL">
      <a
        class="tohfa-btn tohfa-btn-primary audit-btn"
        aria-current="page"
        [routerLink]="routes.detail(audit().id)"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ D.TAB_DETAILS }}
      </a>
      <a class="tohfa-btn audit-btn-outline audit-btn" [routerLink]="routes.findings(audit().id)">
        <span class="material-symbols-outlined icon" aria-hidden="true">fact_check</span>{{ D.TAB_FINDINGS }}
      </a>
    </nav>

    <div class="detail-cols">
      <!-- Column 1 -->
      <div class="detail-col">
        <section class="audit-card" aria-labelledby="ad-info">
          <h2 class="audit-card-head" id="ad-info">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>{{ D.CARD_AUDIT_INFO }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.AUDIT_ID }}</dt>
                <dd class="audit-kv-value">{{ audit().id }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.STATUS }}</dt>
                <dd class="audit-kv-value"><span [class]="statusPillDense()">{{ statusLabel() }}</span></dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.AUDIT_TYPE }}</dt>
                <dd class="audit-kv-value">{{ typeLabel() }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.SCHEDULED_DATE }}</dt>
                <dd class="audit-kv-value">{{ scheduled() }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.ASSIGNED_AUDITOR }}</dt>
                <dd class="audit-kv-value">{{ audit().auditorName }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.AUDIT_PURPOSE }}</dt>
                <dd class="audit-kv-value">{{ audit().purpose ?? S.DASH }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.DURATION }}</dt>
                <dd class="audit-kv-value">{{ duration() }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.SUPPORTING_PARTICIPANTS }}</dt>
                <dd class="audit-kv-value">{{ participants() }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.LAST_UPDATED }}</dt>
                <dd class="audit-kv-value">{{ lastUpdated() }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <!-- Column 2 -->
      <div class="detail-col">
        <section class="audit-card" aria-labelledby="ad-farmer">
          <h2 class="audit-card-head" id="ad-farmer">
            <span class="material-symbols-outlined" aria-hidden="true">person</span>{{ D.CARD_FARMER_PROFILE }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.FARMER_NAME }}</dt>
                <dd class="audit-kv-value">{{ audit().farmerName }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.FARMER_ID }}</dt>
                <dd class="audit-kv-value">{{ audit().farmerCode }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.FARMING_TYPE }}</dt>
                <dd class="audit-kv-value">{{ audit().farmingType ?? S.DASH }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.ZONE }}</dt>
                <dd class="audit-kv-value">{{ audit().zone }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.REGISTERED }}</dt>
                <dd class="audit-kv-value">{{ registered() }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.CONTACT }}</dt>
                <dd class="audit-kv-value">{{ audit().phone ?? S.DASH }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.PROFILE_STATUS }}</dt>
                <dd class="audit-kv-value">
                  <span [class]="profilePill().pillClass">{{ profilePill().pillLabel }}</span>
                </dd>
              </div>
            </dl>
            <a class="card-link" routerLink="/farmers">
              <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>{{ D.OPEN_FARMER_PROFILE }}
            </a>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="ad-certs">
          <h2 class="audit-card-head" id="ad-certs">
            <span class="material-symbols-outlined" aria-hidden="true">verified</span>{{ D.CARD_CERTIFICATIONS }}
          </h2>
          <div class="audit-card-body">
            <ul class="row-list" *ngIf="extras().certifications.length > 0; else noCerts">
              <li *ngFor="let c of extras().certifications">
                <span>
                  {{ c.name }}
                  <span class="row-sub">{{ D.CERT_VALID_UNTIL }} {{ date(c.validUntil) }}</span>
                </span>
              </li>
            </ul>
            <ng-template #noCerts>
              <div class="audit-empty">
                <span class="material-symbols-outlined audit-empty-icon" aria-hidden="true">description</span>
                <p class="audit-empty-title">{{ D.CERTIFICATIONS_EMPTY }}</p>
                <p class="audit-empty-hint">{{ D.CERTIFICATIONS_EMPTY_HINT }}</p>
              </div>
            </ng-template>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="ad-previous">
          <h2 class="audit-card-head" id="ad-previous">
            <span class="material-symbols-outlined" aria-hidden="true">history</span>{{ D.CARD_PREVIOUS_AUDITS }}
          </h2>
          <div class="audit-card-body">
            <ul class="row-list" *ngIf="extras().previousAudits.length > 0; else noPrevious">
              <li *ngFor="let p of extras().previousAudits">
                <span>
                  {{ p.id }}
                  <span class="row-sub">{{ date(p.completedOn) }}</span>
                </span>
                <span>{{ D.previousScore(p.totalScore) }}</span>
              </li>
            </ul>
            <ng-template #noPrevious>
              <div class="audit-empty">
                <span class="material-symbols-outlined audit-empty-icon" aria-hidden="true">description</span>
                <p class="audit-empty-title">{{ D.PREVIOUS_EMPTY }}</p>
                <p class="audit-empty-hint">{{ D.PREVIOUS_EMPTY_HINT }}</p>
              </div>
            </ng-template>
          </div>
        </section>
      </div>

      <!-- Column 3 -->
      <div class="detail-col">
        <section class="audit-card" aria-labelledby="ad-farm">
          <h2 class="audit-card-head" id="ad-farm">
            <span class="material-symbols-outlined" aria-hidden="true">landscape</span>{{ D.CARD_FARM_LAND }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.FARM_NAME }}</dt>
                <dd class="audit-kv-value">{{ audit().farmName }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.FARM_LOCATION }}</dt>
                <dd class="audit-kv-value">{{ audit().location }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.FARM_AREA }}</dt>
                <dd class="audit-kv-value">{{ area() }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.PLOT_COUNT }}</dt>
                <dd class="audit-kv-value">{{ audit().plotIds.length }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ D.PLOT_IDS }}</dt>
                <dd class="audit-kv-value">
                  <span class="stack" *ngIf="audit().plotIds.length > 0; else noPlots">
                    <span *ngFor="let p of audit().plotIds">{{ p }}</span>
                  </span>
                  <ng-template #noPlots>{{ S.DASH }}</ng-template>
                </dd>
              </div>
              <div class="audit-kv-row" *ngFor="let r of landRows()">
                <dt class="audit-kv-label">{{ r.label }}</dt>
                <dd class="audit-kv-value"><span [class]="r.pillClass">{{ r.pillLabel }}</span></dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="ad-docs">
          <h2 class="audit-card-head" id="ad-docs">
            <span class="material-symbols-outlined" aria-hidden="true">folder</span>{{ D.CARD_DOCUMENTS }}
          </h2>
          <div class="audit-card-body">
            <ul class="row-list">
              <li *ngFor="let d of documents()">
                <span>{{ d.label }}</span>
                <span [class]="d.pillClass">{{ d.pillLabel }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- Column 4 -->
      <div class="detail-col">
        <section class="audit-card" aria-labelledby="ad-checklist">
          <h2 class="audit-card-head" id="ad-checklist">
            <span class="material-symbols-outlined" aria-hidden="true">checklist</span>{{ D.CARD_CHECKLIST }}
          </h2>
          <div class="audit-card-body">
            <ul class="row-list">
              <li *ngFor="let c of checklist()">
                <span>{{ c.label }}</span>
                <span [class]="c.pillClass">{{ c.pillLabel }}</span>
              </li>
            </ul>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="ad-timeline">
          <h2 class="audit-card-head" id="ad-timeline">
            <span class="material-symbols-outlined" aria-hidden="true">timeline</span>{{ D.CARD_TIMELINE }}
          </h2>
          <div class="audit-card-body">
            <ol class="timeline" *ngIf="timeline().length > 0; else noTimeline">
              <li *ngFor="let t of timeline()">
                <span class="timeline-when">{{ t.when }}</span>
                <span class="timeline-title">{{ t.title }}</span>
                <span class="timeline-desc">{{ t.description }}</span>
              </li>
            </ol>
            <ng-template #noTimeline>
              <p class="audit-empty-hint">{{ D.TIMELINE_EMPTY }}</p>
            </ng-template>
          </div>
        </section>
      </div>
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
    }
  `,
})
export class AuditDetailComponent {
  readonly S = S;
  readonly D = D;
  readonly routes = AUDIT_ROUTES;

  private readonly route = inject(ActivatedRoute);

  /** The audit id from `:id`, or design 76's audit. */
  readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_DETAIL_DEFAULT_ID)),
    {
      initialValue:
        this.route.snapshot.paramMap.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_DETAIL_DEFAULT_ID,
    },
  );

  /** UPCOMING / unknown ids keep this layout (design 76); every other status → design 94. */
  readonly useFullLayout = computed(() => auditDetailUsesFullLayout(this.auditId()));

  readonly audit = computed(() => mockAuditById(this.auditId()));
  readonly extras = computed(() => mockAuditDetailExtras(this.auditId()));

  readonly statusLabel = computed(() => auditStatusLabel(this.audit().status));
  readonly statusPill = computed(() => auditStatusPillClass(this.audit().status));
  readonly statusPillDense = computed(() => auditStatusPillClass(this.audit().status, true));
  readonly typeLabel = computed(() => AUDIT_TYPE_LABEL[this.audit().type]);
  readonly scheduled = computed(() => formatAuditDateTime24(this.audit().scheduledAt));

  readonly duration = computed(() => {
    const m = this.audit().durationMinutes;
    return m === null ? S.DASH : S.minutes(m);
  });

  readonly participants = computed(() => {
    const p = this.audit().supportingParticipants;
    return p.length === 0 ? S.NONE : p.join(', ');
  });

  readonly lastUpdated = computed(() => {
    const a = this.audit();
    return a.lastUpdatedAt === null
      ? S.DASH
      : D.lastUpdated(formatAuditDateTime24(a.lastUpdatedAt), a.lastUpdatedBy);
  });

  readonly registered = computed(() => {
    const r = this.extras().registeredOn;
    return r === null ? S.DASH : formatAuditDate(r);
  });

  readonly area = computed(() => {
    const a = this.audit().areaAcres;
    return a === null ? S.DASH : D.acres(a);
  });

  readonly profilePill = computed<LabelledPill>(() => {
    const s = this.extras().profileStatus;
    return {
      label: D.PROFILE_STATUS,
      pillLabel: PROFILE_STATUS_LABEL[s],
      pillClass: auditToneClass(AUDIT_PROFILE_STATUS_TONE[s], true),
    };
  });

  readonly landRows = computed<readonly LabelledPill[]>(() => {
    const e = this.extras();
    return [recordPill(D.FMB_SKETCH, e.fmbSketch), recordPill(D.LAND_OWNERSHIP_PROOF, e.landOwnershipProof)];
  });

  readonly documents = computed<readonly LabelledPill[]>(() =>
    this.extras().documents.map((d) => recordPill(DOCUMENT_LABEL[d.kind], d.status)),
  );

  readonly checklist = computed<readonly LabelledPill[]>(() =>
    this.extras().checklist.map((c) => recordPill(CHECKLIST_LABEL[c.kind], c.status)),
  );

  readonly timeline = computed<readonly TimelineView[]>(() =>
    this.extras().timeline.map((t) => this.timelineView(t)),
  );

  date(iso: string): string {
    return formatAuditDate(iso);
  }

  private timelineView(t: AuditTimelineEntry): TimelineView {
    const when = formatAuditDateTime24(t.at);
    switch (t.kind) {
      case 'FARMER_REGISTERED':
        return { when, title: D.EVENT_FARMER_REGISTERED, description: D.EVENT_FARMER_REGISTERED_DESC };
      case 'FARM_PROFILE_CREATED':
        return { when, title: D.EVENT_FARM_PROFILE_CREATED, description: D.EVENT_FARM_PROFILE_CREATED_DESC };
      case 'AUDIT_SCHEDULED':
        return {
          when,
          title: D.EVENT_AUDIT_SCHEDULED,
          description: D.eventAuditScheduledDesc(t.actor ?? S.DASH, this.scheduled()),
        };
    }
  }
}

function recordPill(label: string, status: AuditRecordStatus): LabelledPill {
  return {
    label,
    pillLabel: RECORD_STATUS_LABEL[status],
    pillClass: auditToneClass(AUDIT_RECORD_STATUS_TONE[status], true),
  };
}
