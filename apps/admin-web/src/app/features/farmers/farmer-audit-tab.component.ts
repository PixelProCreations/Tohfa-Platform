/**
 * Farmers Management → Farmer Details → Audit tab.
 *
 * UI ONLY. There is no audit endpoint wired yet, so every value comes from `farmer-audit.mock.ts`.
 * When the API lands, the mock import is replaced by a service call and the route gets its
 * `requirePermission` code from docs/rbac.json.
 *
 * "View Details" on a corrective action is deliberately inert: the approved design has no detail
 * screen or dialog for it yet, so the button renders but performs no action.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, inject } from '@angular/core';
import { FARMER_AUDIT_MOCK, type AuditStatusMock, type CertificationStatusMock } from './farmer-audit.mock';
import { FARMER_AUDIT_STRINGS as S } from './farmer-audit-tab.strings';

type Tone = 'tohfa-badge-success' | 'tohfa-badge-warning' | 'tohfa-badge-danger';

const CERTIFICATION_TONE: Record<CertificationStatusMock, Tone> = {
  VALID: 'tohfa-badge-success',
  EXPIRING: 'tohfa-badge-warning',
  EXPIRED: 'tohfa-badge-danger',
};

const AUDIT_STATUS_TONE: Record<AuditStatusMock, Tone> = {
  PASSED: 'tohfa-badge-success',
  CORRECTIVE_ACTION_REQUIRED: 'tohfa-badge-warning',
  FAILED: 'tohfa-badge-danger',
};

/** The audit-ID pill in Audit Overview is red whenever the audit did not pass outright (per design). */
const LATEST_AUDIT_TONE: Record<AuditStatusMock, Tone> = {
  PASSED: 'tohfa-badge-success',
  CORRECTIVE_ACTION_REQUIRED: 'tohfa-badge-danger',
  FAILED: 'tohfa-badge-danger',
};

let nextAuditId = 0;

@Component({
  selector: 'tohfa-farmer-audit-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Tab heading ---------- */
      .tab-head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
        margin-bottom: var(--space-16);
      }
      .tab-head > .icon {
        margin-top: var(--space-4);
        font-size: var(--icon-dialog-close);
        color: var(--tohfa-amber);
      }
      .tab-title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .tab-sub {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Cards ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-16);
        margin-bottom: var(--space-16);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-10);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }

      dl {
        margin: 0;
      }
      .kv {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-6) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-cell);
      }
      .kv:last-child {
        border-bottom: none;
      }
      .kv dt {
        display: inline-flex;
        align-items: center;
        gap: var(--space-10);
        font-weight: var(--fw-medium);
      }
      .kv dt .icon {
        color: var(--tohfa-brown);
      }
      .kv dt .icon.warn {
        color: var(--warn);
      }
      .kv dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
        overflow-wrap: anywhere;
      }

      /* ---------- Corrective actions ---------- */
      .actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .action-row {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        padding: var(--space-14) var(--space-16);
        border: 1px solid var(--err-bd);
        border-radius: var(--r-md);
        background: var(--err-bg);
      }
      .action-num {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: var(--space-24);
        height: var(--space-24);
        border-radius: var(--r-circle);
        background: var(--err);
        color: var(--tohfa-surface);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .action-title {
        flex: 1;
        margin: 0;
        font-size: var(--fs-body);
        font-weight: var(--fw-bold);
        color: var(--err);
      }
      .btn-view {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-8) var(--space-16);
        background: var(--tohfa-surface);
        font-size: var(--fs-cell);
      }
      .empty {
        margin: 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }

      @media (max-width: 900px) {
        .grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <section [attr.aria-label]="S.regionLabel(farmerName)">
      <header class="tab-head">
        <span class="material-symbols-outlined icon" aria-hidden="true">assignment</span>
        <div>
          <h2 class="tab-title">{{ S.TITLE }}</h2>
          <p class="tab-sub">{{ S.SUBTITLE }}</p>
        </div>
      </header>

      <div class="grid">
        <!-- ================= Audit Summary ================= -->
        <section class="tohfa-card" [attr.aria-labelledby]="ids.summary">
          <h3 class="card-title" [id]="ids.summary">
            <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ S.SUMMARY_TITLE }}
          </h3>
          <dl>
            <div class="kv">
              <dt>{{ S.SUMMARY_CERTIFICATION }}</dt>
              <dd>
                <span class="tohfa-badge tohfa-badge-lg" [ngClass]="certificationTone">{{ certificationLabel }}</span>
              </dd>
            </div>
            <div class="kv">
              <dt>{{ S.SUMMARY_EXPIRY }}</dt>
              <dd>{{ certificationExpiry }}</dd>
            </div>
            <div class="kv">
              <dt>{{ S.SUMMARY_LATEST_AUDIT }}</dt>
              <dd>{{ S.latestAudit(audit.latestAuditId, auditStatusLabel) }}</dd>
            </div>
            <div class="kv">
              <dt>{{ S.SUMMARY_NEXT_AUDIT }}</dt>
              <dd>{{ nextAudit }}</dd>
            </div>
            <div class="kv">
              <dt>{{ S.SUMMARY_OPEN_ACTIONS }}</dt>
              <dd>{{ openActions.length }}</dd>
            </div>
          </dl>
        </section>

        <!-- ================= Audit Overview ================= -->
        <section class="tohfa-card" [attr.aria-labelledby]="ids.overview">
          <h3 class="card-title" [id]="ids.overview">
            <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.OVERVIEW_TITLE }}
          </h3>
          <dl>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.OVERVIEW_LATEST_AUDIT }}</dt>
              <dd>
                <span class="tohfa-badge tohfa-badge-lg" [ngClass]="latestAuditTone">{{ audit.latestAuditId }}</span>
              </dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon warn" aria-hidden="true">error</span>{{ S.OVERVIEW_AUDIT_STATUS }}</dt>
              <dd>
                <span class="tohfa-badge tohfa-badge-lg" [ngClass]="auditStatusTone">{{ auditStatusLabel }}</span>
              </dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">event</span>{{ S.OVERVIEW_NEXT_AUDIT }}</dt>
              <dd>{{ nextAudit }}</dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">workspace_premium</span>{{ S.OVERVIEW_CERTIFICATION }}</dt>
              <dd>
                <span class="tohfa-badge tohfa-badge-lg" [ngClass]="certificationTone">
                  {{ S.certificationOn(certificationLabel, certificationExpiry) }}
                </span>
              </dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">check_box</span>{{ S.OVERVIEW_OPEN_ACTIONS }}</dt>
              <dd>{{ openActions.length }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- ================= Corrective Actions ================= -->
      <section class="tohfa-card" [attr.aria-labelledby]="ids.actions">
        <h3 class="card-title" [id]="ids.actions">
          <span class="material-symbols-outlined icon" aria-hidden="true">track_changes</span>{{ S.ACTIONS_TITLE }}
        </h3>
        <ol class="actions" *ngIf="openActions.length > 0; else noActions">
          <li class="action-row" *ngFor="let a of openActions; let i = index">
            <span class="action-num" aria-hidden="true">{{ i + 1 }}</span>
            <p class="action-title">{{ a.title }}</p>
            <!-- Inert on purpose: no design exists yet for the corrective-action detail view. -->
            <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-view" [attr.aria-label]="S.viewDetailsLabel(a.title)">
              <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.BTN_VIEW_DETAILS }}
            </button>
          </li>
        </ol>
        <ng-template #noActions>
          <p class="empty">{{ S.ACTIONS_EMPTY }}</p>
        </ng-template>
      </section>
    </section>
  `,
})
export class FarmerAuditTabComponent {
  private readonly locale = inject(LOCALE_ID);

  /** Display name used for the tab region's accessible label. */
  @Input() farmerName = 'the farmer';

  readonly S = S;
  readonly audit = FARMER_AUDIT_MOCK;

  private readonly uid = nextAuditId++;
  readonly ids = {
    summary: `audit-summary-${this.uid}`,
    overview: `audit-overview-${this.uid}`,
    actions: `audit-actions-${this.uid}`,
  };

  readonly openActions = this.audit.correctiveActions.filter((a) => a.status === 'OPEN');
  readonly certificationLabel = S.CERTIFICATION_LABEL[this.audit.certificationStatus];
  readonly certificationTone = CERTIFICATION_TONE[this.audit.certificationStatus];
  readonly auditStatusLabel = S.AUDIT_STATUS_LABEL[this.audit.latestAuditStatus];
  readonly auditStatusTone = AUDIT_STATUS_TONE[this.audit.latestAuditStatus];
  readonly latestAuditTone = LATEST_AUDIT_TONE[this.audit.latestAuditStatus];
  readonly certificationExpiry = this.date(this.audit.certificationExpiry);
  readonly nextAudit = this.date(this.audit.nextAuditDate);

  private date(isoDate: string): string {
    return formatDate(isoDate, 'dd MMM y', this.locale);
  }
}
