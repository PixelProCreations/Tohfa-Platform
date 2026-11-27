/**
 * Audit Management → Audit Inspection overview (design 78). UI ONLY.
 *
 * Route: `/audits/:id/inspection` (AUDIT_ROUTES.inspection). Reads `:id` (AUDIT_ROUTE_PARAMS.id) and
 * falls back to AUD-2026-0042 (design 78) when the param is missing, so the screen never errors.
 *
 * The 12 section cards come from `mockInspectionSectionsForAudit(id)` (audit-inspection.mock.ts). Progress (ring,
 * bar, "n of 12 sections complete", "n required fields are still missing") is COMPUTED from the
 * sections' `status` and `requiredFieldsLeft`, never from a constant. Nothing persists: the step
 * screens do not write back, so every visit starts from the mock state.
 *
 * Links: each section card → AUDIT_ROUTES.step(id, n); "Start Audit" → step 1. "Save Draft" only
 * announces a demo confirmation (nothing is stored). When integrated, starting is
 * `POST /admin/audits/{id}/start` (SCHEDULED → IN_PROGRESS) — docs/openapi.yaml.
 *
 * Completed variant (design 93) is DERIVED, not switched: when every section's status is COMPLETED
 * (`allComplete()`), the header drops its status pill and uses the icon tile, the progress card becomes
 * the green "n of n sections completed" banner, each card reads "Completed · All required fields
 * filled", and the footer offers "Review & Submit" instead of Save Draft / Start Audit. Which audits
 * have all sections complete is decided by audit-inspection.mock.ts (audits whose status is COMPLETED,
 * e.g. AUD-2026-0049 / AUD-2026-0059). "Review & Submit" opens a success popup; closing it navigates to the audit schedule list.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuditSubmitSuccessDialogComponent } from './audit-submit-success-dialog.component';
import { AuditCompletionService } from './audit-completion.service';
import { formatAuditDate } from './audit-format';
import { AUDIT_INSPECTION_STRINGS as I } from './audit-inspection.strings';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import {
  AUDIT_SECTION_STATUS_META,
  AUDIT_TYPE_LABEL_LONG,
  auditStatusLabel,
  auditStatusPillClass,
  auditToneClass,
} from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { mockInspectionSectionsForAudit } from './audit-inspection.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditInspectionSection } from './audit.types';

/** Design 78's audit, used when the route carries no id. */
export const AUDIT_INSPECTION_DEFAULT_ID = 'AUD-2026-0042';

interface InfoItem {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
}

interface SectionView {
  readonly step: number;
  readonly title: string;
  readonly hint: string;
  readonly statusLabel: string;
  readonly statusClass: string;
  readonly done: boolean;
  readonly link: string;
  readonly aria: string;
}

@Component({
  selector: 'tohfa-audit-inspection',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditSubmitSuccessDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .info-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: var(--space-16);
        margin: 0;
      }
      .info-grid dt,
      .info-grid dd {
        margin: 0;
      }
      .progress {
        display: flex;
        align-items: center;
        gap: var(--space-16);
      }
      .progress-main {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--space-4);
        min-width: 0;
      }
      .progress-title {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .progress-hint {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .progress-pct {
        flex: none;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .sections {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-12);
      }
      .section-card {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--space-12);
        height: 100%;
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-12) var(--space-14);
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
        color: var(--tohfa-ink);
        text-decoration: none;
        transition: border-color 0.15s ease;
      }
      .section-card:hover {
        border-color: var(--tohfa-amber);
      }
      .section-card:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .section-text {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--space-4);
        min-width: 0;
      }
      .section-title {
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .section-hint {
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      /* ---- Completed variant (design 93) ---- */
      .done-banner {
        background: var(--ok-bg);
        border-color: var(--ok-bd);
      }
      .done-icon {
        flex: none;
        font-size: var(--icon-dialog-close);
        color: var(--ok);
      }
      .done-banner .progress-title {
        color: var(--ok);
      }
      .done-banner .progress-hint {
        margin: 0;
      }
      .done-banner .progress-main {
        flex: 0 1 auto;
      }
      .done-bar {
        flex: 1;
        min-width: 0;
      }
      .done-bar .audit-progress-fill {
        background: var(--ok);
      }
      .done-banner .progress-pct {
        color: var(--ok);
      }
      .done-pill {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-6) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--ok);
        color: var(--tohfa-neutral-white);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .done-pill .material-symbols-outlined,
      .section-check {
        font-size: var(--icon-btn);
      }
      .section-check {
        flex: none;
        color: var(--ok);
      }
      @media (max-width: 1200px) {
        .info-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 900px) {
        .sections {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 640px) {
        .info-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .done-body {
          flex-wrap: wrap;
        }
        .done-bar {
          flex-basis: 100%;
          order: 1;
        }
      }
    `,
  ],
  template: `
    <header class="audit-page-header" *ngIf="!allComplete(); else completedHeader">
      <div>
        <div class="audit-title-row">
          <span class="material-symbols-outlined audit-title-icon" aria-hidden="true">shield</span>
          <h1 class="audit-title">{{ I.TITLE }}</h1>
        </div>
        <p class="audit-meta-row">
          <span>{{ S.shellSubtitle(audit().id, audit().farmerName) }}</span>
          <span [class]="statusPill()">{{ statusLabel() }}</span>
        </p>
      </div>
    </header>
    <ng-template #completedHeader>
      <header class="audit-page-header">
        <div class="audit-title-row">
          <span class="audit-title-tile" aria-hidden="true">
            <span class="material-symbols-outlined">fact_check</span>
          </span>
          <div>
            <h1 class="audit-title">{{ I.TITLE }}</h1>
            <p class="audit-meta-row">{{ S.shellSubtitle(audit().id, audit().farmerName) }}</p>
          </div>
        </div>
      </header>
    </ng-template>

    <section class="audit-card" [attr.aria-label]="I.INFO_REGION">
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

    <section
      class="audit-card done-banner"
      [attr.aria-label]="I.PROGRESS_REGION"
      *ngIf="allComplete(); else inProgressCard"
    >
      <div class="audit-card-body progress done-body">
        <span class="material-symbols-outlined done-icon" aria-hidden="true">check_circle</span>
        <div class="progress-main">
          <p class="progress-title">{{ I.sectionsCompleted(completedCount(), sections().length) }}</p>
          <p class="progress-hint">{{ I.requiredRemaining(requiredMissing()) }}</p>
        </div>
        <div
          class="audit-progress done-bar"
          role="progressbar"
          [attr.aria-label]="I.PROGRESS_BAR_LABEL"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuenow]="percent()"
          [attr.aria-valuetext]="I.sectionsCompleted(completedCount(), sections().length)"
        >
          <div class="audit-progress-fill" [style.width.%]="percent()"></div>
        </div>
        <span class="progress-pct" aria-hidden="true">{{ I.percent(percent()) }}</span>
        <span class="done-pill">
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          {{ I.COMPLETED_PILL }}
        </span>
      </div>
    </section>

    <ng-template #inProgressCard>
    <section class="audit-card" [attr.aria-label]="I.PROGRESS_REGION">
      <div class="audit-card-body progress">
        <span class="audit-ring" [style.--audit-ring-pct]="percent()" aria-hidden="true">
          <span class="audit-ring-label">{{ I.percent(percent()) }}</span>
        </span>
        <div class="progress-main">
          <p class="progress-title">{{ I.sectionsComplete(completedCount(), sections().length) }}</p>
          <p class="progress-hint">{{ I.requiredMissing(requiredMissing()) }}</p>
          <div
            class="audit-progress"
            role="progressbar"
            [attr.aria-label]="I.PROGRESS_BAR_LABEL"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="percent()"
            [attr.aria-valuetext]="I.sectionsComplete(completedCount(), sections().length)"
          >
            <div class="audit-progress-fill" [style.width.%]="percent()"></div>
          </div>
        </div>
        <span class="progress-pct" aria-hidden="true">{{ I.percent(percent()) }}</span>
      </div>
    </section>
    </ng-template>

    <section aria-labelledby="ai-sections">
      <h2 class="audit-section-title" id="ai-sections">{{ I.SECTIONS_TITLE }}</h2>
      <ul class="sections">
        <li *ngFor="let s of sectionViews(); trackBy: trackStep">
          <a class="section-card" [routerLink]="s.link" [attr.aria-label]="s.aria">
            <span
              class="audit-step-num"
              [class.is-done]="s.done && !allComplete()"
              aria-hidden="true"
              >{{ s.step }}</span
            >
            <span class="section-text" aria-hidden="true">
              <span class="section-title">{{ s.title }}</span>
              <span class="section-hint">{{ s.hint }}</span>
            </span>
            <span
              *ngIf="allComplete()"
              class="material-symbols-outlined section-check"
              aria-hidden="true"
              >check_circle</span
            >
            <span [class]="s.statusClass" aria-hidden="true">{{ s.statusLabel }}</span>
          </a>
        </li>
      </ul>
    </section>

    <div class="audit-footer" role="group" [attr.aria-label]="I.FOOTER_LABEL">
      <p class="audit-footer-status" aria-live="polite">{{ statusMessage() }}</p>
      <ng-container *ngIf="!allComplete(); else completedActions">
        <button type="button" class="tohfa-btn audit-btn-outline audit-btn" (click)="saveDraft()">
          {{ I.SAVE_DRAFT }}
        </button>
        <a class="tohfa-btn tohfa-btn-primary audit-btn" [routerLink]="routes.step(audit().id, firstStep())">
          {{ I.START_AUDIT }}
        </a>
      </ng-container>
      <ng-template #completedActions>
        <button type="button" class="tohfa-btn tohfa-btn-primary audit-btn" (click)="reviewAndSubmit()">
          <span class="material-symbols-outlined icon" aria-hidden="true">check_circle</span>
          {{ I.REVIEW_SUBMIT }}
          <span class="material-symbols-outlined icon" aria-hidden="true">arrow_forward</span>
        </button>
      </ng-template>
    </div>

    <tohfa-audit-submit-success-dialog
      *ngIf="submitOpen()"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      (closed)="closeSubmitDialog()"
    />
  `,
})
export class AuditInspectionComponent {
  readonly S = S;
  readonly I = I;
  readonly routes = AUDIT_ROUTES;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** The audit id from `:id`, or design 78's audit. */
  readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_INSPECTION_DEFAULT_ID)),
    {
      initialValue:
        this.route.snapshot.paramMap.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_INSPECTION_DEFAULT_ID,
    },
  );

  private readonly completion = inject(AuditCompletionService);

  readonly audit = computed(() => mockAuditById(this.auditId()));

  /**
   * Non-persisted section state for this audit (design 78: all Not Started; design 93: all
   * Completed for audits whose status is COMPLETED — see audit-inspection.mock.ts).
   */
  readonly sections = computed<readonly AuditInspectionSection[]>(() =>
    mockInspectionSectionsForAudit(this.audit().id, this.completion.isCompleted(this.audit().id)),
  );

  /** Design 93's completed variant: derived from the data, never from a flag. */
  readonly allComplete = computed(() => {
    const all = this.sections();
    return all.length > 0 && all.every((s) => s.status === 'COMPLETED');
  });

  readonly statusMessage = signal('');

  readonly statusLabel = computed(() => auditStatusLabel(this.audit().status));
  readonly statusPill = computed(() => auditStatusPillClass(this.audit().status, true));

  readonly infoItems = computed<readonly InfoItem[]>(() => {
    const a = this.audit();
    return [
      { icon: 'description', label: I.AUDIT_ID, value: a.id },
      { icon: 'category', label: I.TYPE, value: AUDIT_TYPE_LABEL_LONG[a.type] },
      { icon: 'person', label: I.FARMER, value: a.farmerName },
      { icon: 'eco', label: I.FARM, value: a.farmName },
      { icon: 'calendar_month', label: I.DATE, value: formatAuditDate(a.scheduledAt) },
      { icon: 'badge', label: I.AUDITOR, value: a.auditorName },
    ];
  });

  readonly completedCount = computed(
    () => this.sections().filter((s) => s.status === 'COMPLETED').length,
  );

  /** Whole percent of sections complete (0 when there are none). */
  readonly percent = computed(() => {
    const total = this.sections().length;
    return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
  });

  /** Required fields still missing across every section that is not complete. */
  readonly requiredMissing = computed(() =>
    this.sections().reduce(
      (sum, s) => sum + (s.status === 'COMPLETED' ? 0 : (s.requiredFieldsLeft ?? 0)),
      0,
    ),
  );

  /** "Start Audit" opens the first section that is not complete (step 1 in design 78). */
  readonly firstStep = computed(
    () => this.sections().find((s) => s.status !== 'COMPLETED')?.step ?? 1,
  );

  readonly sectionViews = computed<readonly SectionView[]>(() => {
    const id = this.audit().id;
    const allComplete = this.allComplete();
    return this.sections().map((s) => {
      const meta = AUDIT_SECTION_STATUS_META[s.status];
      const hint = allComplete
        ? I.SECTION_COMPLETED_HINT
        : s.requiredFieldsLeft !== null
          ? S.requiredFieldsLeft(s.requiredFieldsLeft)
          : (s.description ?? S.SECTION_NOT_STARTED_HINT);
      return {
        step: s.step,
        title: s.title,
        hint,
        statusLabel: meta.label,
        statusClass: auditToneClass(meta.tone, true),
        done: s.status === 'COMPLETED',
        link: AUDIT_ROUTES.step(id, s.step),
        aria: I.sectionAria(s.step, s.title, meta.label, hint),
      };
    });
  });

  trackStep(_index: number, s: SectionView): number {
    return s.step;
  }

  /** Demo only: nothing is stored. */
  saveDraft(): void {
    this.statusMessage.set(S.SHELL_DRAFT_SAVED_DEMO);
  }

  /** Success popup visibility (design 93 follow-up). */
  readonly submitOpen = signal(false);

  /** Demo only (design 93): nothing is submitted; opens the success popup. */
  reviewAndSubmit(): void {
    this.submitOpen.set(true);
  }

  /** OK / Escape / backdrop: close the popup and go to Audit Schedule & Assignment. */
  closeSubmitDialog(): void {
    this.submitOpen.set(false);
    void this.router.navigateByUrl(AUDIT_ROUTES.schedule);
  }
}
