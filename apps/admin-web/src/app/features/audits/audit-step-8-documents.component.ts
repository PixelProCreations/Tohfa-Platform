/**
 * Audit inspection step 8 — Documents & Findings (design 86). UI ONLY.
 *
 * Left: the farmer's documents already on file (View / Download are inert — no file exists in this
 * demo) and the "Add evidence" form. Right: the evidence file drop zone with verification fields, the
 * Evidence Summary, and "+ Add Evidence", which validates the evidence fields (Evidence Category,
 * Related Inspection Section, Observation) and appends the current evidence to a local list that the
 * summary counts. Nothing is stored or uploaded.
 *
 * Save & Next validates the step-level required field (Missing Document Reason) and navigates to step
 * 9; evidence still being typed but not added is not required. Save as Draft does not validate.
 *
 * Route: AUDIT_ROUTES.step(id, 8). Reads `:id` (AUDIT_ROUTE_PARAMS.id), default AUD-2026-0042.
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
import { AUDIT_STEP_8_STRINGS as T } from './audit-step-8-documents.strings';
import {
  AUDIT_EVIDENCE_CATEGORY_OPTIONS,
  AUDIT_EVIDENCE_VERIFICATION_OPTIONS,
  AUDIT_EXISTING_DOCUMENTS,
  AUDIT_FOLLOW_UP_RECOMMENDATION_OPTIONS,
  AUDIT_MISSING_DOCUMENT_REASON_OPTIONS,
  AUDIT_OBSERVATION_MAX_LENGTH,
  AUDIT_RELATED_SECTION_OPTIONS,
  AUDIT_STEP_DEFAULT_ID,
  type AuditSelectOption,
} from './audit-steps-7-12.mock';
import { AUDIT_INSPECTION_SECTIONS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';

interface EvidenceDraft {
  readonly category: string;
  /** Free text of the search-select; must equal a section title. */
  readonly sectionText: string;
  readonly observation: string;
  readonly followUp: string;
  readonly recommendationNotes: string;
  readonly fileName: string | null;
  readonly fileSize: number | null;
  readonly verification: string;
  readonly notes: string;
}

interface EvidenceItem {
  readonly key: number;
  readonly categoryLabel: string;
  readonly sectionLabel: string;
  readonly fileName: string | null;
}

interface FieldError {
  readonly fieldId: string;
  readonly message: string;
}

const STEP = 8;

const EMPTY_DRAFT: EvidenceDraft = {
  category: '',
  sectionText: '',
  observation: '',
  followUp: '',
  recommendationNotes: '',
  fileName: null,
  fileSize: null,
  verification: '',
  notes: '',
};

function labelOf(options: readonly AuditSelectOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

@Component({
  selector: 'tohfa-audit-step-8-documents',
  standalone: true,
  imports: [CommonModule, AuditStepShellComponent, AuditStepFilePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEP_FORM_STYLES,
    `
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
      }
      .doc-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .doc-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-10) var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-sm);
      }
      .doc-name {
        display: flex;
        align-items: flex-start;
        gap: var(--space-8);
      }
      .doc-name .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-brown);
      }
      .doc-title {
        display: block;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .doc-sub {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .doc-actions {
        display: flex;
        gap: var(--space-8);
      }
      .doc-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        min-height: calc(var(--space-16) * 2);
        padding: var(--space-4) var(--space-10);
        border: 1px solid var(--tohfa-amber);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        cursor: default;
      }
      .doc-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .doc-btn .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .summary-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
      }
      .summary-text {
        display: flex;
        align-items: flex-start;
        gap: var(--space-8);
      }
      .summary-text .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-brown);
      }
      .summary-title {
        display: block;
        margin: 0;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .summary-sub {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .evidence-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
        margin: var(--space-12) 0 0;
        padding: 0;
        list-style: none;
      }
      .evidence-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-8);
        padding: var(--space-8) var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-sm);
        font-size: var(--fs-dense);
      }
      .evidence-main {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        min-width: 0;
      }
      .evidence-main strong {
        font-weight: var(--fw-bold);
      }
      .evidence-main span {
        color: var(--tohfa-slate);
        font-size: var(--fs-cap);
        overflow-wrap: anywhere;
      }
      .add-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        border: 1px solid var(--tohfa-amber);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-page);
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .add-btn:hover {
        background: var(--tohfa-amber-tint);
      }
      .add-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .add-btn .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="T.TITLE"
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
      <div class="step-error-summary" role="alert" *ngIf="activeErrors().length > 0">
        <p class="step-error-title">
          <span class="material-symbols-outlined" aria-hidden="true">error</span>
          {{ errorMode() === 'add' ? T.addErrorSummary(activeErrors().length) : T.saveErrorSummary(activeErrors().length) }}
        </p>
        <ul class="step-error-list">
          <li *ngFor="let e of activeErrors()">
            <button type="button" class="step-error-link" (click)="focusField(e.fieldId)">{{ e.message }}</button>
          </li>
        </ul>
      </div>

      <div class="audit-grid-2">
        <!-- Left column -->
        <div class="col">
          <section class="audit-card" aria-labelledby="s8-existing-head">
            <h2 class="audit-card-head" id="s8-existing-head">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>
              {{ T.CARD_EXISTING }}
            </h2>
            <div class="audit-card-body">
              <ul class="doc-list">
                <li class="doc-row" *ngFor="let d of documents">
                  <span class="doc-name">
                    <span class="material-symbols-outlined" aria-hidden="true">draft</span>
                    <span>
                      <span class="doc-title">{{ d.name }}</span>
                      <span class="doc-sub">{{ T.ON_FILE }}</span>
                    </span>
                  </span>
                  <span class="doc-actions">
                    <button type="button" class="doc-btn" aria-disabled="true" [attr.aria-label]="T.viewAria(d.name)">
                      <span class="material-symbols-outlined" aria-hidden="true">visibility</span>{{ T.VIEW }}
                    </button>
                    <button type="button" class="doc-btn" aria-disabled="true" [attr.aria-label]="T.downloadAria(d.name)">
                      <span class="material-symbols-outlined" aria-hidden="true">download</span>{{ T.DOWNLOAD }}
                    </button>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section class="audit-card" aria-labelledby="s8-add-head">
            <h2 class="audit-card-head" id="s8-add-head">
              <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
              {{ T.CARD_ADD }}
            </h2>
            <div class="audit-card-body">
              <div class="audit-form-grid">
                <div class="audit-field">
                  <label class="audit-label required" for="s8-category">{{ T.LABEL_CATEGORY }}</label>
                  <div class="audit-select-wrap">
                    <select
                      id="s8-category"
                      class="audit-control"
                      aria-required="true"
                      [class.is-placeholder]="draft().category === ''"
                      [value]="draft().category"
                      [attr.aria-invalid]="invalid('s8-category') ? 'true' : null"
                      [attr.aria-describedby]="invalid('s8-category') ? 's8-category-error' : null"
                      (change)="patch({ category: value($event) })"
                    >
                      <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                      <option *ngFor="let o of categoryOptions" [value]="o.value" [selected]="o.value === draft().category">
                        {{ o.label }}
                      </option>
                    </select>
                  </div>
                  <p class="audit-field-error" id="s8-category-error" *ngIf="invalid('s8-category')">
                    {{ T.ERROR_CATEGORY_REQUIRED }}
                  </p>
                </div>

                <div class="audit-field">
                  <label class="audit-label required" for="s8-section">{{ T.LABEL_SECTION }}</label>
                  <div class="audit-input-icon-wrap">
                    <input
                      id="s8-section"
                      class="audit-control"
                      type="text"
                      autocomplete="off"
                      list="s8-section-options"
                      aria-required="true"
                      [placeholder]="T.PLACEHOLDER_SELECT"
                      [value]="draft().sectionText"
                      [attr.aria-invalid]="invalid('s8-section') ? 'true' : null"
                      [attr.aria-describedby]="invalid('s8-section') ? 's8-section-error' : null"
                      (input)="patch({ sectionText: value($event) })"
                    />
                    <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                  </div>
                  <datalist id="s8-section-options">
                    <option *ngFor="let o of sectionOptions" [value]="o.label"></option>
                  </datalist>
                  <p class="audit-field-error" id="s8-section-error" *ngIf="invalid('s8-section')">
                    {{ T.ERROR_SECTION_REQUIRED }}
                  </p>
                </div>

                <div class="audit-field span-2">
                  <label class="audit-label required" for="s8-observation">{{ T.LABEL_OBSERVATION }}</label>
                  <textarea
                    id="s8-observation"
                    class="audit-control"
                    aria-required="true"
                    [attr.maxlength]="observationMax"
                    [placeholder]="T.PLACEHOLDER_OBSERVATION"
                    [value]="draft().observation"
                    [attr.aria-invalid]="invalid('s8-observation') ? 'true' : null"
                    [attr.aria-describedby]="invalid('s8-observation') ? 's8-observation-error' : null"
                    (input)="patch({ observation: value($event) })"
                  ></textarea>
                  <p class="audit-field-error" id="s8-observation-error" *ngIf="invalid('s8-observation')">
                    {{ T.ERROR_OBSERVATION_REQUIRED }}
                  </p>
                </div>

                <div class="audit-field span-2">
                  <label class="audit-label" for="s8-follow-up">{{ T.LABEL_FOLLOW_UP }}</label>
                  <div class="audit-select-wrap">
                    <select
                      id="s8-follow-up"
                      class="audit-control"
                      [class.is-placeholder]="draft().followUp === ''"
                      [value]="draft().followUp"
                      (change)="patch({ followUp: value($event) })"
                    >
                      <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                      <option *ngFor="let o of followUpOptions" [value]="o.value" [selected]="o.value === draft().followUp">
                        {{ o.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="audit-field span-2">
                  <label class="audit-label" for="s8-rec-notes">{{ T.LABEL_RECOMMENDATION_NOTES }}</label>
                  <textarea
                    id="s8-rec-notes"
                    class="audit-control"
                    [attr.maxlength]="observationMax"
                    [placeholder]="T.PLACEHOLDER_RECOMMENDATION_NOTES"
                    [value]="draft().recommendationNotes"
                    (input)="patch({ recommendationNotes: value($event) })"
                  ></textarea>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right column -->
        <div class="col">
          <section class="audit-card" aria-labelledby="s8-file-head">
            <h2 class="audit-card-head" id="s8-file-head">
              <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
              {{ T.CARD_FILE }}
            </h2>
            <div class="audit-card-body stack">
              <div class="audit-field">
                <span class="audit-label" id="s8-file-label">{{ T.LABEL_FILE }}</span>
                <tohfa-audit-step-file-picker
                  variant="dropzone"
                  inputId="s8-file"
                  [title]="T.DROP_TITLE"
                  [hint]="T.DROP_HINT"
                  [formats]="T.DROP_FORMATS"
                  [ariaLabel]="T.LABEL_FILE + ': ' + T.DROP_TITLE + '. ' + T.DROP_FORMATS"
                  [fileName]="draft().fileName"
                  [fileSize]="draft().fileSize"
                  (picked)="onPicked($event)"
                  (removed)="patch({ fileName: null, fileSize: null })"
                />
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s8-verification">{{ T.LABEL_VERIFICATION }}</label>
                <div class="audit-select-wrap">
                  <select
                    id="s8-verification"
                    class="audit-control"
                    [class.is-placeholder]="draft().verification === ''"
                    [value]="draft().verification"
                    (change)="patch({ verification: value($event) })"
                  >
                    <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                    <option *ngFor="let o of verificationOptions" [value]="o.value" [selected]="o.value === draft().verification">
                      {{ o.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="audit-field">
                <label class="audit-label required" for="s8-missing-reason">{{ T.LABEL_MISSING_REASON }}</label>
                <div class="audit-select-wrap">
                  <select
                    id="s8-missing-reason"
                    class="audit-control"
                    aria-required="true"
                    [class.is-placeholder]="missingReason() === ''"
                    [value]="missingReason()"
                    [attr.aria-invalid]="invalid('s8-missing-reason') ? 'true' : null"
                    [attr.aria-describedby]="invalid('s8-missing-reason') ? 's8-missing-reason-error' : null"
                    (change)="missingReason.set(value($event))"
                  >
                    <option value="">{{ T.PLACEHOLDER_SELECT }}</option>
                    <option *ngFor="let o of missingReasonOptions" [value]="o.value" [selected]="o.value === missingReason()">
                      {{ o.label }}
                    </option>
                  </select>
                </div>
                <p class="audit-field-error" id="s8-missing-reason-error" *ngIf="invalid('s8-missing-reason')">
                  {{ T.ERROR_MISSING_REASON_REQUIRED }}
                </p>
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s8-notes">{{ T.LABEL_NOTES }}</label>
                <textarea
                  id="s8-notes"
                  class="audit-control"
                  [placeholder]="T.PLACEHOLDER_NOTES"
                  [value]="draft().notes"
                  (input)="patch({ notes: value($event) })"
                ></textarea>
              </div>
            </div>
          </section>

          <section class="audit-card" aria-labelledby="s8-summary-head">
            <div class="audit-card-body">
              <div class="summary-card">
                <div class="summary-text">
                  <span class="material-symbols-outlined" aria-hidden="true">attach_file</span>
                  <div>
                    <h2 class="summary-title" id="s8-summary-head">{{ T.CARD_SUMMARY }}</h2>
                    <span class="summary-sub" aria-live="polite">{{ T.summaryCount(fileCount()) }}</span>
                  </div>
                </div>
                <span [class]="fileCount() === 0 ? 'tohfa-badge tohfa-badge-neutral' : 'tohfa-badge tohfa-badge-success'">
                  {{ fileCount() === 0 ? T.SUMMARY_EMPTY : T.summaryPill(fileCount()) }}
                </span>
              </div>
              <ul class="evidence-list" *ngIf="evidence().length > 0">
                <li class="evidence-item" *ngFor="let item of evidence()">
                  <span class="evidence-main">
                    <strong>{{ item.categoryLabel }} {{ S.SEPARATOR_DOT }} {{ item.sectionLabel }}</strong>
                    <span>{{ item.fileName ?? T.NO_FILE }}</span>
                  </span>
                  <button
                    type="button"
                    class="doc-btn"
                    [attr.aria-label]="T.removeEvidenceAria(item.categoryLabel, item.sectionLabel)"
                    (click)="removeEvidence(item.key)"
                  >
                    {{ T.REMOVE_EVIDENCE }}
                  </button>
                </li>
              </ul>
            </div>
          </section>

          <button type="button" class="add-btn" (click)="onAddEvidence()">
            <span class="material-symbols-outlined" aria-hidden="true">add</span>
            {{ T.ADD_EVIDENCE }}
          </button>
        </div>
      </div>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep8DocumentsComponent {
  readonly S = S;
  readonly T = T;
  readonly routes = AUDIT_ROUTES;
  readonly documents = AUDIT_EXISTING_DOCUMENTS;
  readonly categoryOptions = AUDIT_EVIDENCE_CATEGORY_OPTIONS;
  readonly sectionOptions = AUDIT_RELATED_SECTION_OPTIONS;
  readonly followUpOptions = AUDIT_FOLLOW_UP_RECOMMENDATION_OPTIONS;
  readonly verificationOptions = AUDIT_EVIDENCE_VERIFICATION_OPTIONS;
  readonly missingReasonOptions = AUDIT_MISSING_DOCUMENT_REASON_OPTIONS;
  readonly observationMax = AUDIT_OBSERVATION_MAX_LENGTH;
  readonly sectionIcon = AUDIT_INSPECTION_SECTIONS.find((s) => s.step === STEP)?.icon ?? 'description';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_STEP_DEFAULT_ID)),
    { initialValue: AUDIT_STEP_DEFAULT_ID },
  );
  readonly audit = computed(() => mockAuditById(this.auditId()));

  readonly draft = signal<EvidenceDraft>(EMPTY_DRAFT);
  /** Step-level field, kept when evidence is added. */
  readonly missingReason = signal('');
  readonly evidence = signal<EvidenceItem[]>([]);
  readonly fileCount = computed(() => this.evidence().filter((e) => e.fileName !== null).length);
  readonly status = signal('');

  /** Which validation the user last asked for; errors stay live until that set is clean. */
  readonly errorMode = signal<'none' | 'add' | 'save'>('none');
  private nextKey = 1;

  private readonly addErrors = computed<FieldError[]>(() => {
    const d = this.draft();
    const out: FieldError[] = [];
    if (d.category === '') out.push({ fieldId: 's8-category', message: T.ERROR_CATEGORY_REQUIRED });
    if (this.sectionValue(d.sectionText) === null) out.push({ fieldId: 's8-section', message: T.ERROR_SECTION_REQUIRED });
    if (d.observation.trim() === '') out.push({ fieldId: 's8-observation', message: T.ERROR_OBSERVATION_REQUIRED });
    return out;
  });

  private readonly saveErrors = computed<FieldError[]>(() =>
    this.missingReason() === ''
      ? [{ fieldId: 's8-missing-reason', message: T.ERROR_MISSING_REASON_REQUIRED }]
      : [],
  );

  readonly activeErrors = computed<FieldError[]>(() => {
    const mode = this.errorMode();
    if (mode === 'add') return this.addErrors();
    if (mode === 'save') return this.saveErrors();
    return [];
  });

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  patch(change: Partial<EvidenceDraft>): void {
    this.draft.update((d) => ({ ...d, ...change }));
  }

  onPicked(file: AuditPickedFile): void {
    this.patch({ fileName: file.name, fileSize: file.size });
  }

  invalid(fieldId: string): boolean {
    return this.activeErrors().some((e) => e.fieldId === fieldId);
  }

  onAddEvidence(): void {
    this.errorMode.set('add');
    const first = this.addErrors()[0];
    if (first !== undefined) {
      this.status.set('');
      this.focusField(first.fieldId);
      return;
    }
    const d = this.draft();
    const section = this.sectionValue(d.sectionText) ?? '';
    this.evidence.update((list) => [
      ...list,
      {
        key: this.nextKey++,
        categoryLabel: labelOf(this.categoryOptions, d.category),
        sectionLabel: labelOf(this.sectionOptions, section),
        fileName: d.fileName,
      },
    ]);
    this.draft.set(EMPTY_DRAFT);
    this.errorMode.set('none');
    this.status.set(T.EVIDENCE_ADDED);
  }

  removeEvidence(key: number): void {
    this.evidence.update((list) => list.filter((e) => e.key !== key));
    this.status.set(T.EVIDENCE_REMOVED);
  }

  onDraft(): void {
    this.status.set(S.SHELL_DRAFT_SAVED_DEMO);
  }

  onSaveNext(): void {
    this.errorMode.set('save');
    const first = this.saveErrors()[0];
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

  /** The search-select's typed text → section value, or null if it names no section. */
  private sectionValue(text: string): string | null {
    const t = text.trim();
    return this.sectionOptions.find((o) => o.label === t)?.value ?? null;
  }
}
