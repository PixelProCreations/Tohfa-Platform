/**
 * Audit inspection step 7 — Farm Practices Checklist (design 85). UI ONLY.
 *
 * Four section cards (Farm Documentation, Organic Practices, Crop Management, Input Usage), each with a
 * required Inspection Result, Notes, an "Evidence (existing)" search-select over the farmer's documents
 * on file, and a local file chooser. All state is local; nothing is stored or uploaded.
 *
 * Save & Next validates the four Inspection Results (and that any typed evidence matches a document on
 * file), then navigates to step 8. Save as Draft does not validate.
 *
 * Route: AUDIT_ROUTES.step(id, 7). Reads `:id` (AUDIT_ROUTE_PARAMS.id), default AUD-2026-0042.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AuditStepShellComponent } from './audit-step-shell.component';
import { type AuditPickedFile, AuditStepFilePickerComponent } from './audit-step-7-file-picker.component';
import { AUDIT_STEP_FORM_STYLES } from './audit-step-7-form.styles';
import { AUDIT_STEP_7_STRINGS as T } from './audit-step-7-practices.strings';
import {
  AUDIT_EXISTING_DOCUMENTS,
  AUDIT_INSPECTION_RESULT_OPTIONS,
  AUDIT_PRACTICE_SECTIONS,
  AUDIT_STEP_DEFAULT_ID,
  type AuditPracticeSectionKey,
} from './audit-steps-7-12.mock';
import { AUDIT_INSPECTION_SECTIONS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';

interface PracticeState {
  readonly result: string;
  readonly notes: string;
  readonly evidence: string;
  readonly fileName: string | null;
  readonly fileSize: number | null;
}

interface FieldError {
  readonly fieldId: string;
  readonly message: string;
}

const STEP = 7;

function emptyState(): Record<AuditPracticeSectionKey, PracticeState> {
  const blank: PracticeState = { result: '', notes: '', evidence: '', fileName: null, fileSize: null };
  return {
    FARM_DOCUMENTATION: blank,
    ORGANIC_PRACTICES: blank,
    CROP_MANAGEMENT: blank,
    INPUT_USAGE: blank,
  };
}

@Component({
  selector: 'tohfa-audit-step-7-practices',
  standalone: true,
  imports: [CommonModule, AuditStepShellComponent, AuditStepFilePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEP_FORM_STYLES,
    `
      .practice-grid {
        align-items: stretch;
      }
      .practice-grid .audit-card {
        display: flex;
        flex-direction: column;
      }
      .practice-head {
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .practice-fields {
        align-items: start;
      }
      .practice-fields textarea.audit-control {
        min-height: calc(var(--space-32) * 2 + var(--space-12));
      }
    `,
  ],
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
      <div class="step-error-summary" role="alert" *ngIf="showErrors() && errors().length > 0">
        <p class="step-error-title">
          <span class="material-symbols-outlined" aria-hidden="true">error</span>
          {{ T.errorSummary(errors().length) }}
        </p>
        <ul class="step-error-list">
          <li *ngFor="let e of errors()">
            <button type="button" class="step-error-link" (click)="focusField(e.fieldId)">{{ e.message }}</button>
          </li>
        </ul>
      </div>

      <div class="audit-grid-2 practice-grid">
        <section
          class="audit-card"
          *ngFor="let sec of sections"
          [attr.aria-labelledby]="'s7-' + sec.key + '-head'"
        >
          <h2 class="audit-card-head practice-head" [id]="'s7-' + sec.key + '-head'">
            <span class="material-symbols-outlined" aria-hidden="true">{{ sec.icon }}</span>
            {{ sec.title }}
          </h2>
          <div class="audit-card-body">
            <div class="audit-form-grid practice-fields">
              <div class="audit-field">
                <label class="audit-label required" [for]="'s7-' + sec.key + '-result'">{{ T.LABEL_RESULT }}</label>
                <div class="audit-select-wrap">
                  <select
                    class="audit-control"
                    [id]="'s7-' + sec.key + '-result'"
                    [class.is-placeholder]="state()[sec.key].result === ''"
                    [value]="state()[sec.key].result"
                    [attr.aria-label]="T.fieldAria(sec.name, T.LABEL_RESULT)"
                    aria-required="true"
                    [attr.aria-invalid]="resultInvalid(sec.key) ? 'true' : null"
                    [attr.aria-describedby]="resultInvalid(sec.key) ? 's7-' + sec.key + '-result-error' : null"
                    (change)="patch(sec.key, { result: value($event) })"
                  >
                    <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                    <option
                      *ngFor="let o of resultOptions"
                      [value]="o.value"
                      [selected]="o.value === state()[sec.key].result"
                    >
                      {{ o.label }}
                    </option>
                  </select>
                </div>
                <p
                  class="audit-field-error"
                  *ngIf="resultInvalid(sec.key)"
                  [id]="'s7-' + sec.key + '-result-error'"
                >
                  {{ T.ERROR_RESULT_REQUIRED }}
                </p>
              </div>

              <div class="audit-field">
                <label class="audit-label" [for]="'s7-' + sec.key + '-notes'">{{ T.LABEL_NOTES }}</label>
                <textarea
                  class="audit-control"
                  [id]="'s7-' + sec.key + '-notes'"
                  [attr.aria-label]="T.fieldAria(sec.name, T.LABEL_NOTES)"
                  [placeholder]="T.PLACEHOLDER_NOTES"
                  [value]="state()[sec.key].notes"
                  (input)="patch(sec.key, { notes: value($event) })"
                ></textarea>
              </div>

              <div class="audit-field">
                <label class="audit-label" [for]="'s7-' + sec.key + '-evidence'">{{ T.LABEL_EVIDENCE_EXISTING }}</label>
                <div class="audit-input-icon-wrap">
                  <input
                    class="audit-control"
                    type="text"
                    autocomplete="off"
                    [id]="'s7-' + sec.key + '-evidence'"
                    [attr.list]="'s7-evidence-options'"
                    [attr.aria-label]="T.fieldAria(sec.name, T.LABEL_EVIDENCE_EXISTING)"
                    [placeholder]="T.PLACEHOLDER_EVIDENCE"
                    [value]="state()[sec.key].evidence"
                    [attr.aria-invalid]="evidenceInvalid(sec.key) ? 'true' : null"
                    [attr.aria-describedby]="evidenceInvalid(sec.key) ? 's7-' + sec.key + '-evidence-error' : null"
                    (input)="patch(sec.key, { evidence: value($event) })"
                  />
                  <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                </div>
                <p
                  class="audit-field-error"
                  *ngIf="evidenceInvalid(sec.key)"
                  [id]="'s7-' + sec.key + '-evidence-error'"
                >
                  {{ T.ERROR_EVIDENCE_UNKNOWN }}
                </p>
              </div>

              <div class="audit-field">
                <span class="audit-label" [id]="'s7-' + sec.key + '-upload-label'">{{ T.LABEL_UPLOAD }}</span>
                <tohfa-audit-step-file-picker
                  variant="button"
                  [inputId]="'s7-' + sec.key + '-upload'"
                  [title]="T.UPLOAD_BUTTON"
                  [ariaLabel]="T.fieldAria(sec.name, T.LABEL_UPLOAD)"
                  [fileName]="state()[sec.key].fileName"
                  [fileSize]="state()[sec.key].fileSize"
                  (picked)="onPicked(sec.key, $event)"
                  (removed)="patch(sec.key, { fileName: null, fileSize: null })"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <datalist id="s7-evidence-options">
        <option *ngFor="let d of documents" [value]="d.name"></option>
      </datalist>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep7PracticesComponent {
  readonly S = S;
  readonly T = T;
  readonly routes = AUDIT_ROUTES;
  readonly sections = AUDIT_PRACTICE_SECTIONS;
  readonly resultOptions = AUDIT_INSPECTION_RESULT_OPTIONS;
  readonly documents = AUDIT_EXISTING_DOCUMENTS;

  private readonly section = AUDIT_INSPECTION_SECTIONS.find((s) => s.step === STEP);
  readonly sectionTitle = this.section?.title ?? S.SECTION_7;
  readonly sectionIcon = this.section?.icon ?? 'checklist';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_STEP_DEFAULT_ID)),
    { initialValue: AUDIT_STEP_DEFAULT_ID },
  );
  readonly audit = computed(() => mockAuditById(this.auditId()));

  readonly state = signal(emptyState());
  /** Errors are shown only after the first Save & Next, then update live as fields are fixed. */
  readonly showErrors = signal(false);
  readonly status = signal('');

  readonly errors = computed<FieldError[]>(() => {
    const st = this.state();
    const out: FieldError[] = [];
    for (const sec of this.sections) {
      if (st[sec.key].result === '') {
        out.push({ fieldId: `s7-${sec.key}-result`, message: T.errorLine(sec.name, T.ERROR_RESULT_REQUIRED) });
      }
      if (!this.evidenceKnown(st[sec.key].evidence)) {
        out.push({ fieldId: `s7-${sec.key}-evidence`, message: T.errorLine(sec.name, T.ERROR_EVIDENCE_UNKNOWN) });
      }
    }
    return out;
  });

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  patch(key: AuditPracticeSectionKey, change: Partial<PracticeState>): void {
    this.state.update((st) => ({ ...st, [key]: { ...st[key], ...change } }));
  }

  onPicked(key: AuditPracticeSectionKey, file: AuditPickedFile): void {
    this.patch(key, { fileName: file.name, fileSize: file.size });
  }

  resultInvalid(key: AuditPracticeSectionKey): boolean {
    return this.showErrors() && this.state()[key].result === '';
  }

  evidenceInvalid(key: AuditPracticeSectionKey): boolean {
    return this.showErrors() && !this.evidenceKnown(this.state()[key].evidence);
  }

  onDraft(): void {
    this.status.set(S.SHELL_DRAFT_SAVED_DEMO);
  }

  onSaveNext(): void {
    this.showErrors.set(true);
    const first = this.errors()[0];
    if (first !== undefined) {
      this.status.set('');
      this.focusField(first.fieldId);
      return;
    }
    this.status.set(S.SHELL_SAVED_DEMO);
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, STEP + 1));
  }

  focusField(id: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }

  /** Optional field: empty is fine, otherwise it must name a document on file. */
  private evidenceKnown(text: string): boolean {
    const t = text.trim();
    return t === '' || this.documents.some((d) => d.name === t);
  }
}
