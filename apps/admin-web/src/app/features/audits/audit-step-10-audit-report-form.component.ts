/**
 * Shared body of inspection steps 10 "Schedule Upcoming Audit" (design 88) and 11 "Add External
 * Audit" (design 89). UI ONLY. The two designs are the same form; they differ in the title, the step
 * pill, the information card's heading and the card layout:
 *
 *   INTERNAL (88)  left: Farmer & Farm Details, Audit Report Upload
 *                  right: Internal Audit Information, Additional Details
 *   EXTERNAL (89)  left: Farmer & Farm Details, External Audit Information
 *                  right: Audit Report Upload, Additional Details
 *
 * Farmer & Farm Details are read-only and come from mockAuditById(id) (+ mockFarmCount). The upload
 * opens the local file chooser only. "Save" validates the four required fields (organization and the
 * three dates; the expiry and next-audit dates must fall after the audit date) and, when valid,
 * navigates to the next step (INTERNAL step 10 -> step 11 Add External Audit; EXTERNAL step 11 ->
 * step 12 Farmer Rating) via AUDIT_ROUTES.step. Nothing is stored. Save as Draft does not validate
 * and does not navigate; it shows "Draft saved (demo — not stored)".
 *
 * Not routed directly: AuditStep10ScheduleComponent / AuditStep11ExternalComponent wrap it.
 * Reads `:id` (AUDIT_ROUTE_PARAMS.id), default AUD-2026-0042.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AuditStepShellComponent } from './audit-step-shell.component';
import { type AuditPickedFile, AuditStepFilePickerComponent } from './audit-step-7-file-picker.component';
import { AUDIT_STEP_FORM_STYLES } from './audit-step-7-form.styles';
import { AUDIT_STEP_10_STRINGS as T } from './audit-step-10-audit-report.strings';
import { AUDIT_REMARKS_MAX_LENGTH, AUDIT_STEP_DEFAULT_ID, mockFarmCount, mockStep10FarmSummary } from './audit-steps-7-12.mock';
import { AUDIT_INSPECTION_SECTIONS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditType } from './audit.types';

interface ReportFormState {
  readonly organization: string;
  readonly auditDate: string;
  readonly expiryDate: string;
  readonly nextDate: string;
  readonly fileName: string | null;
  readonly fileSize: number | null;
  readonly remarks: string;
}

type FieldId = 'org' | 'audit-date' | 'expiry-date' | 'next-date';

interface FieldError {
  readonly field: FieldId;
  readonly message: string;
}

@Component({
  selector: 'tohfa-audit-step-audit-report-form',
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
      .date-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-16) var(--space-12);
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
      }
      @media (max-width: 640px) {
        .date-row {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="isExternal ? T.TITLE_EXTERNAL : T.TITLE_INTERNAL"
      [icon]="icon"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="isExternal ? T.STEP_PILL_EXTERNAL : T.STEP_PILL_INTERNAL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE"
      [autoAnnounce]="false"
      [statusMessage]="status()"
      (draft)="onDraft()"
      (primary)="onSave()"
    >
      <div class="step-error-summary" role="alert" *ngIf="showErrors() && errors().length > 0">
        <p class="step-error-title">
          <span class="material-symbols-outlined" aria-hidden="true">error</span>
          {{ T.errorSummary(errors().length) }}
        </p>
        <ul class="step-error-list">
          <li *ngFor="let e of errors()">
            <button type="button" class="step-error-link" (click)="focusField(e.field)">{{ e.message }}</button>
          </li>
        </ul>
      </div>

      <div class="audit-grid-2">
        <div class="col">
          <ng-container *ngTemplateOutlet="farmCard"></ng-container>
          <ng-container *ngTemplateOutlet="isExternal ? infoCard : uploadCard"></ng-container>
        </div>
        <div class="col">
          <ng-container *ngTemplateOutlet="isExternal ? uploadCard : infoCard"></ng-container>
          <ng-container *ngTemplateOutlet="additionalCard"></ng-container>
        </div>
      </div>
    </tohfa-audit-step-shell>

    <!-- Farmer & Farm Details (read-only) -->
    <ng-template #farmCard>
      <section class="audit-card" [attr.aria-labelledby]="prefix + '-farm-head'">
        <h2 class="audit-card-head" [id]="prefix + '-farm-head'">
          <span class="material-symbols-outlined" aria-hidden="true">eco</span>
          {{ T.CARD_FARM }}
        </h2>
        <div class="audit-card-body">
          <div class="audit-form-grid">
            <div class="audit-field" *ngFor="let f of farmFields()">
              <label class="audit-label" [for]="prefix + '-' + f.key">
                {{ f.label }}
                <span class="material-symbols-outlined audit-label-lock" aria-hidden="true">lock</span>
                <span class="sr-only">{{ T.LOCKED }}</span>
              </label>
              <input class="audit-control" type="text" readonly [id]="prefix + '-' + f.key" [value]="f.value" />
            </div>
          </div>
        </div>
      </section>
    </ng-template>

    <!-- Internal / External Audit Information -->
    <ng-template #infoCard>
      <section class="audit-card" [attr.aria-labelledby]="prefix + '-info-head'">
        <h2 class="audit-card-head" [id]="prefix + '-info-head'">
          <span class="material-symbols-outlined" aria-hidden="true">assignment</span>
          {{ isExternal ? T.CARD_INFO_EXTERNAL : T.CARD_INFO_INTERNAL }}
        </h2>
        <div class="audit-card-body stack">
          <div class="audit-field">
            <label class="audit-label required" [for]="fid('org')">{{ T.LABEL_ORG }}</label>
            <input
              class="audit-control"
              type="text"
              autocomplete="organization"
              aria-required="true"
              [id]="fid('org')"
              [placeholder]="T.PLACEHOLDER_ORG"
              [value]="state().organization"
              [attr.aria-invalid]="errorFor('org') ? 'true' : null"
              [attr.aria-describedby]="errorFor('org') ? fid('org') + '-error' : null"
              (input)="patch({ organization: value($event) })"
            />
            <p class="audit-field-error" [id]="fid('org') + '-error'" *ngIf="errorFor('org') as msg">{{ msg }}</p>
          </div>

          <div class="date-row">
            <ng-container
              *ngTemplateOutlet="dateField; context: { field: 'audit-date', label: T.LABEL_AUDIT_DATE, hint: T.HINT_AUDIT_DATE, value: state().auditDate }"
            ></ng-container>
            <ng-container
              *ngTemplateOutlet="dateField; context: { field: 'expiry-date', label: T.LABEL_EXPIRY_DATE, hint: T.HINT_EXPIRY_DATE, value: state().expiryDate }"
            ></ng-container>
          </div>
          <ng-container
            *ngTemplateOutlet="dateField; context: { field: 'next-date', label: T.LABEL_NEXT_DATE, hint: T.HINT_NEXT_DATE, value: state().nextDate }"
          ></ng-container>
        </div>
      </section>
    </ng-template>

    <ng-template #dateField let-field="field" let-label="label" let-hint="hint" let-value="value">
      <div class="audit-field">
        <label class="audit-label required" [for]="fid(field)">{{ label }}</label>
        <div class="step-icon-left">
          <span class="material-symbols-outlined step-icon-left-glyph" aria-hidden="true">calendar_month</span>
          <input
            class="audit-control"
            type="date"
            aria-required="true"
            [id]="fid(field)"
            [placeholder]="hint"
            [value]="value"
            [attr.aria-invalid]="errorFor(field) ? 'true' : null"
            [attr.aria-describedby]="errorFor(field) ? fid(field) + '-error' : null"
            (input)="onDate(field, $event)"
            (change)="onDate(field, $event)"
          />
        </div>
        <p class="audit-field-error" [id]="fid(field) + '-error'" *ngIf="errorFor(field) as msg">{{ msg }}</p>
      </div>
    </ng-template>

    <!-- Audit Report Upload -->
    <ng-template #uploadCard>
      <section class="audit-card" [attr.aria-labelledby]="prefix + '-upload-head'">
        <h2 class="audit-card-head" [id]="prefix + '-upload-head'">
          <span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span>
          {{ T.CARD_UPLOAD }}
        </h2>
        <div class="audit-card-body">
          <tohfa-audit-step-file-picker
            variant="row"
            [inputId]="prefix + '-report'"
            [title]="T.UPLOAD_TITLE"
            [hint]="T.UPLOAD_HINT"
            [fileName]="state().fileName"
            [fileSize]="state().fileSize"
            (picked)="onPicked($event)"
            (removed)="patch({ fileName: null, fileSize: null })"
          />
        </div>
      </section>
    </ng-template>

    <!-- Additional Details -->
    <ng-template #additionalCard>
      <section class="audit-card" [attr.aria-labelledby]="prefix + '-additional-head'">
        <h2 class="audit-card-head" [id]="prefix + '-additional-head'">
          <span class="material-symbols-outlined" aria-hidden="true">notes</span>
          {{ T.CARD_ADDITIONAL }}
        </h2>
        <div class="audit-card-body">
          <div class="audit-field">
            <label class="audit-label" [for]="prefix + '-remarks'">{{ T.LABEL_REMARKS }}</label>
            <textarea
              class="audit-control"
              [id]="prefix + '-remarks'"
              [attr.maxlength]="remarksMax"
              [attr.aria-describedby]="prefix + '-remarks-count'"
              [placeholder]="T.PLACEHOLDER_REMARKS"
              [value]="state().remarks"
              (input)="patch({ remarks: value($event) })"
            ></textarea>
            <div class="step-count-row">
              <p class="audit-counter" [id]="prefix + '-remarks-count'">
                {{ T.counter(state().remarks.length, remarksMax) }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </ng-template>
  `,
})
export class AuditStepAuditReportFormComponent {
  readonly S = S;
  readonly T = T;
  readonly routes = AUDIT_ROUTES;
  readonly remarksMax = AUDIT_REMARKS_MAX_LENGTH;

  /** INTERNAL = step 10 (design 88), EXTERNAL = step 11 (design 89). */
  @Input() auditType: AuditType = 'INTERNAL';

  get isExternal(): boolean {
    return this.auditType === 'EXTERNAL';
  }
  /** Element-id prefix, so ids stay unique per variant. */
  get prefix(): string {
    return this.isExternal ? 's11' : 's10';
  }
  get icon(): string {
    const step = this.isExternal ? 11 : 10;
    return AUDIT_INSPECTION_SECTIONS.find((s) => s.step === step)?.icon ?? 'event';
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_STEP_DEFAULT_ID)),
    { initialValue: AUDIT_STEP_DEFAULT_ID },
  );
  readonly audit = computed(() => mockAuditById(this.auditId()));

  readonly farmFields = computed(() => {
    const a = this.audit();
    const farms = mockFarmCount(a.id);
    const summary = mockStep10FarmSummary(a.id);
    const farmerCode = summary?.farmerCode ?? a.farmerCode;
    const areaAcres = summary?.areaAcres ?? a.areaAcres;
    return [
      { key: 'farmer-id', label: T.LABEL_FARMER_ID, value: farmerCode },
      { key: 'farmer-name', label: T.LABEL_FARMER_NAME, value: a.farmerName },
      { key: 'zone', label: T.LABEL_ZONE, value: a.zone },
      { key: 'farms', label: T.LABEL_FARMS, value: farms === null ? S.DASH : String(farms) },
      { key: 'area', label: T.LABEL_TOTAL_AREA, value: areaAcres === null ? S.DASH : T.acres(areaAcres) },
    ];
  });

  readonly state = signal<ReportFormState>({
    organization: '',
    auditDate: '',
    expiryDate: '',
    nextDate: '',
    fileName: null,
    fileSize: null,
    remarks: '',
  });
  readonly showErrors = signal(false);
  readonly status = signal('');

  readonly errors = computed<FieldError[]>(() => {
    const s = this.state();
    const out: FieldError[] = [];
    if (s.organization.trim() === '') out.push({ field: 'org', message: T.ERROR_ORG_REQUIRED });
    if (s.auditDate === '') out.push({ field: 'audit-date', message: T.ERROR_AUDIT_DATE_REQUIRED });
    // YYYY-MM-DD strings compare correctly as text; no Date / clock involved.
    if (s.expiryDate === '') out.push({ field: 'expiry-date', message: T.ERROR_EXPIRY_DATE_REQUIRED });
    else if (s.auditDate !== '' && s.expiryDate <= s.auditDate)
      out.push({ field: 'expiry-date', message: T.ERROR_EXPIRY_BEFORE_AUDIT });
    if (s.nextDate === '') out.push({ field: 'next-date', message: T.ERROR_NEXT_DATE_REQUIRED });
    else if (s.auditDate !== '' && s.nextDate <= s.auditDate)
      out.push({ field: 'next-date', message: T.ERROR_NEXT_BEFORE_AUDIT });
    return out;
  });

  fid(field: FieldId): string {
    return `${this.prefix}-${field}`;
  }

  errorFor(field: FieldId): string | null {
    if (!this.showErrors()) return null;
    return this.errors().find((e) => e.field === field)?.message ?? null;
  }

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  patch(change: Partial<ReportFormState>): void {
    this.state.update((s) => ({ ...s, ...change }));
  }

  onDate(field: FieldId, event: Event): void {
    const v = this.value(event);
    if (field === 'audit-date') this.patch({ auditDate: v });
    else if (field === 'expiry-date') this.patch({ expiryDate: v });
    else if (field === 'next-date') this.patch({ nextDate: v });
  }

  onPicked(file: AuditPickedFile): void {
    this.patch({ fileName: file.name, fileSize: file.size });
  }

  onDraft(): void {
    this.status.set(S.SHELL_DRAFT_SAVED_DEMO);
  }

  onSave(): void {
    this.showErrors.set(true);
    const first = this.errors()[0];
    if (first !== undefined) {
      this.status.set('');
      this.focusField(first.field);
      return;
    }
    this.status.set('');
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, this.isExternal ? 12 : 11));
  }

  focusField(field: FieldId): void {
    this.host.nativeElement.querySelector<HTMLElement>(`#${this.fid(field)}`)?.focus();
  }
}
