/**
 * Audit inspection step 9 — Farmer Admin Assessment (design 87). UI ONLY.
 *
 * One card: Overall Assessment (required), Recommendation, Strengths Observed, Supporting Remarks,
 * Follow-up Required, and the read-only "Official Audit Score" ("Not scored yet" — the score is the
 * sum of step 12's category ratings, BR-06, so it is never typed here).
 *
 * Save & Next validates Overall Assessment and navigates to step 10. Save as Draft does not validate.
 *
 * Route: AUDIT_ROUTES.step(id, 9). Reads `:id` (AUDIT_ROUTE_PARAMS.id), default AUD-2026-0042.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AuditStepShellComponent } from './audit-step-shell.component';
import { AUDIT_STEP_FORM_STYLES } from './audit-step-7-form.styles';
import { AUDIT_STEP_9_STRINGS as T } from './audit-step-9-assessment.strings';
import {
  AUDIT_ASSESSMENT_RECOMMENDATION_OPTIONS,
  AUDIT_FOLLOW_UP_REQUIRED_OPTIONS,
  AUDIT_OVERALL_ASSESSMENT_OPTIONS,
  AUDIT_STEP_DEFAULT_ID,
} from './audit-steps-7-12.mock';
import { AUDIT_INSPECTION_SECTIONS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';

interface AssessmentState {
  readonly overall: string;
  readonly recommendation: string;
  readonly strengths: string;
  readonly remarks: string;
  readonly followUp: string;
}

const STEP = 9;

@Component({
  selector: 'tohfa-audit-step-9-assessment',
  standalone: true,
  imports: [CommonModule, AuditStepShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [AUDIT_SHARED_STYLES, AUDIT_STEP_FORM_STYLES],
  template: `
    <tohfa-audit-step-shell
      [title]="sectionTitle"
      [icon]="sectionIcon"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="T.STEP_PILL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE_NEXT"
      primaryIcon="arrow_forward"
      [autoAnnounce]="false"
      [statusMessage]="status()"
      (draft)="onDraft()"
      (primary)="onSaveNext()"
    >
      <div class="step-error-summary" role="alert" *ngIf="overallInvalid()">
        <p class="step-error-title">
          <span class="material-symbols-outlined" aria-hidden="true">error</span>
          {{ T.errorSummary(1) }}
        </p>
        <ul class="step-error-list">
          <li>
            <button type="button" class="step-error-link" (click)="focusField('s9-overall')">
              {{ T.ERROR_OVERALL_REQUIRED }}
            </button>
          </li>
        </ul>
      </div>

      <section class="audit-card" aria-labelledby="s9-head">
        <h2 class="audit-card-head" id="s9-head">
          <span class="material-symbols-outlined" aria-hidden="true">groups</span>
          {{ T.CARD_TITLE }}
        </h2>
        <div class="audit-card-body">
          <div class="audit-form-grid">
            <div class="audit-field">
              <label class="audit-label required" for="s9-overall">{{ T.LABEL_OVERALL }}</label>
              <div class="audit-select-wrap">
                <select
                  id="s9-overall"
                  class="audit-control"
                  aria-required="true"
                  [class.is-placeholder]="state().overall === ''"
                  [value]="state().overall"
                  [attr.aria-invalid]="overallInvalid() ? 'true' : null"
                  [attr.aria-describedby]="overallInvalid() ? 's9-overall-error' : null"
                  (change)="patch({ overall: value($event) })"
                >
                  <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                  <option *ngFor="let o of overallOptions" [value]="o.value" [selected]="o.value === state().overall">
                    {{ o.label }}
                  </option>
                </select>
              </div>
              <p class="audit-field-error" id="s9-overall-error" *ngIf="overallInvalid()">
                {{ T.ERROR_OVERALL_REQUIRED }}
              </p>
            </div>

            <div class="audit-field">
              <label class="audit-label" for="s9-recommendation">{{ T.LABEL_RECOMMENDATION }}</label>
              <div class="audit-select-wrap">
                <select
                  id="s9-recommendation"
                  class="audit-control"
                  [class.is-placeholder]="state().recommendation === ''"
                  [value]="state().recommendation"
                  (change)="patch({ recommendation: value($event) })"
                >
                  <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                  <option
                    *ngFor="let o of recommendationOptions"
                    [value]="o.value"
                    [selected]="o.value === state().recommendation"
                  >
                    {{ o.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="audit-field">
              <label class="audit-label" for="s9-strengths">{{ T.LABEL_STRENGTHS }}</label>
              <textarea
                id="s9-strengths"
                class="audit-control"
                [placeholder]="T.PLACEHOLDER_STRENGTHS"
                [value]="state().strengths"
                (input)="patch({ strengths: value($event) })"
              ></textarea>
            </div>

            <div class="audit-field">
              <label class="audit-label" for="s9-remarks">{{ T.LABEL_REMARKS }}</label>
              <textarea
                id="s9-remarks"
                class="audit-control"
                [placeholder]="T.PLACEHOLDER_REMARKS"
                [value]="state().remarks"
                (input)="patch({ remarks: value($event) })"
              ></textarea>
            </div>

            <div class="audit-field">
              <label class="audit-label" for="s9-follow-up">{{ T.LABEL_FOLLOW_UP }}</label>
              <div class="audit-select-wrap">
                <select
                  id="s9-follow-up"
                  class="audit-control"
                  [class.is-placeholder]="state().followUp === ''"
                  [value]="state().followUp"
                  (change)="patch({ followUp: value($event) })"
                >
                  <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                  <option *ngFor="let o of followUpOptions" [value]="o.value" [selected]="o.value === state().followUp">
                    {{ o.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="audit-field">
              <label class="audit-label" for="s9-score">
                {{ T.LABEL_SCORE }}
                <span class="material-symbols-outlined audit-label-lock" aria-hidden="true">lock</span>
              </label>
              <input
                id="s9-score"
                class="audit-control"
                type="text"
                readonly
                aria-describedby="s9-score-hint"
                [value]="T.SCORE_NOT_SCORED"
              />
              <span class="sr-only" id="s9-score-hint">{{ T.SCORE_LOCKED_HINT }}</span>
            </div>
          </div>
        </div>
      </section>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep9AssessmentComponent {
  readonly S = S;
  readonly T = T;
  readonly routes = AUDIT_ROUTES;
  readonly overallOptions = AUDIT_OVERALL_ASSESSMENT_OPTIONS;
  readonly recommendationOptions = AUDIT_ASSESSMENT_RECOMMENDATION_OPTIONS;
  readonly followUpOptions = AUDIT_FOLLOW_UP_REQUIRED_OPTIONS;

  private readonly section = AUDIT_INSPECTION_SECTIONS.find((s) => s.step === STEP);
  readonly sectionTitle = this.section?.title ?? S.SECTION_9;
  readonly sectionIcon = this.section?.icon ?? 'assignment_ind';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_STEP_DEFAULT_ID)),
    { initialValue: AUDIT_STEP_DEFAULT_ID },
  );
  readonly audit = computed(() => mockAuditById(this.auditId()));

  readonly state = signal<AssessmentState>({
    overall: '',
    recommendation: '',
    strengths: '',
    remarks: '',
    followUp: '',
  });
  readonly showErrors = signal(false);
  readonly status = signal('');
  readonly overallInvalid = computed(() => this.showErrors() && this.state().overall === '');

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  patch(change: Partial<AssessmentState>): void {
    this.state.update((s) => ({ ...s, ...change }));
  }

  onDraft(): void {
    this.status.set(S.SHELL_DRAFT_SAVED_DEMO);
  }

  onSaveNext(): void {
    this.showErrors.set(true);
    if (this.state().overall === '') {
      this.status.set('');
      this.focusField('s9-overall');
      return;
    }
    this.status.set(S.SHELL_SAVED_DEMO);
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, STEP + 1));
  }

  focusField(id: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }
}
