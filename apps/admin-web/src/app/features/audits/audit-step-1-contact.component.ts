/**
 * Audit inspection step 1 — Farmer Contact Verification (design 79). UI ONLY.
 *
 * Left: the farmer's contact details, read only (the profile is never edited from an audit; the
 * "here" correction link is inert — no design for the correction flow). Right: Preferred Contact
 * Method, Contact Verification Status (required) and notes, held as local state only.
 *
 * Primary ("Save", as design 79 labels it) validates locally and goes to step 2. Save as Draft
 * needs no validation and only shows the shell's demo message. When integrated these answers need
 * an audit-section endpoint that docs/openapi.yaml does not define yet (spec gap — see
 * audit-steps-1-6.mock.ts).
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_STEP1_STRINGS as T } from './audit-step-1-contact.strings';
import {
  AUDIT_STEP_DEFAULT_AUDIT_ID,
  AUDIT_STEP_NOTES_MAX,
  AUDIT_STEPS_1_6_STYLES,
  auditStepFocusFirstInvalid,
  auditStepRouteId,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';
import { AuditStepShellComponent } from './audit-step-shell.component';
import {
  AUDIT_STEP1_CONTACT_METHOD_OPTIONS,
  AUDIT_STEP1_CONTACT_STATUS_OPTIONS,
} from './audit-steps-1-6.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditDetailRecord } from './audit.types';

const STEP = 1;

interface Step1Form {
  contactMethod: string;
  contactStatus: string;
  notes: string;
}

type Step1ErrorKey = 'contactStatus';

function emptyForm(): Step1Form {
  return { contactMethod: '', contactStatus: '', notes: '' };
}

@Component({
  selector: 'tohfa-audit-step-1-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, AuditStepShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [AUDIT_SHARED_STYLES, AUDIT_STEPS_1_6_STYLES],
  template: `
    <tohfa-audit-step-shell
      [title]="S.SECTION_1"
      icon="verified_user"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="T.STEP_PILL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE"
      [showDraft]="false"
      (primary)="onSave()"
    >
      <div class="step-error-summary" role="alert" *ngIf="errorList().length > 0">
        {{ C.errorSummaryAnnounce(errorList().length) }}
        <ul>
          <li *ngFor="let e of errorList()">
            <a [href]="'#' + e.id" (click)="focusField($event, e.id)">{{ e.message }}</a>
          </li>
        </ul>
      </div>

      <div class="step-cols">
        <section class="audit-card step-card" aria-labelledby="s1-contact-head">
          <h2 class="audit-card-head" id="s1-contact-head">
            <span class="material-symbols-outlined" aria-hidden="true">person</span>
            {{ T.CARD_CONTACT }}
          </h2>
          <div class="step-card-body">
            <div class="audit-field">
              <label class="audit-label" for="s1-name">
                {{ T.FARMER_NAME }}
                <span class="material-symbols-outlined step-lock" [attr.aria-label]="C.LOCKED" role="img">lock</span>
              </label>
              <input id="s1-name" class="audit-control" type="text" readonly [value]="audit().farmerName" />
            </div>
            <div class="audit-field">
              <label class="audit-label" for="s1-id">
                {{ T.FARMER_ID }}
                <span class="material-symbols-outlined step-lock" [attr.aria-label]="C.LOCKED" role="img">lock</span>
              </label>
              <input id="s1-id" class="audit-control" type="text" readonly [value]="audit().farmerCode" />
            </div>
            <div class="audit-field">
              <label class="audit-label" for="s1-phone">
                {{ T.PHONE }}
                <span class="material-symbols-outlined step-lock" [attr.aria-label]="C.LOCKED" role="img">lock</span>
              </label>
              <input
                id="s1-phone"
                class="audit-control"
                type="text"
                readonly
                [value]="audit().phone ?? S.DASH"
                aria-describedby="s1-phone-note"
              />
              <p class="audit-note-warn" id="s1-phone-note">
                <span class="material-symbols-outlined" aria-hidden="true">info</span>
                <span>
                  {{ T.CORRECTION_NOTE }}
                  <button
                    type="button"
                    class="step-inline-link"
                    aria-disabled="true"
                    [attr.aria-label]="T.CORRECTION_LINK_LABEL"
                    [title]="C.NOT_AVAILABLE_YET"
                  >{{ T.CORRECTION_LINK }}</button>
                </span>
              </p>
            </div>
            <div class="audit-field">
              <label class="audit-label" for="s1-address">
                {{ T.ADDRESS }}
                <span class="material-symbols-outlined step-lock" [attr.aria-label]="C.LOCKED" role="img">lock</span>
              </label>
              <input
                id="s1-address"
                class="audit-control"
                type="text"
                readonly
                [value]="audit().address ?? S.DASH"
                aria-describedby="s1-address-note"
              />
              <p class="audit-note-warn" id="s1-address-note">
                <span class="material-symbols-outlined" aria-hidden="true">info</span>
                <span>
                  {{ T.CORRECTION_NOTE }}
                  <button
                    type="button"
                    class="step-inline-link"
                    aria-disabled="true"
                    [attr.aria-label]="T.CORRECTION_LINK_LABEL"
                    [title]="C.NOT_AVAILABLE_YET"
                  >{{ T.CORRECTION_LINK }}</button>
                </span>
              </p>
            </div>
          </div>
        </section>

        <section class="audit-card step-card" aria-labelledby="s1-verify-head">
          <h2 class="audit-card-head" id="s1-verify-head">
            <span class="material-symbols-outlined" aria-hidden="true">fact_check</span>
            {{ T.CARD_VERIFICATION }}
          </h2>
          <div class="step-card-body">
            <div class="audit-field">
              <label class="audit-label" for="s1-method">{{ T.CONTACT_METHOD }}</label>
              <div class="audit-select-wrap">
                <select
                  id="s1-method"
                  class="audit-control"
                  [class.is-placeholder]="form.contactMethod === ''"
                  [(ngModel)]="form.contactMethod"
                >
                  <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let o of contactMethodOptions" [value]="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
            <div class="audit-field">
              <label class="audit-label required" for="s1-status">{{ T.CONTACT_STATUS }}</label>
              <div class="audit-select-wrap">
                <select
                  id="s1-status"
                  class="audit-control"
                  required
                  aria-required="true"
                  [class.is-placeholder]="form.contactStatus === ''"
                  [attr.aria-invalid]="errors().contactStatus ? 'true' : null"
                  [attr.aria-describedby]="errors().contactStatus ? 's1-status-error' : null"
                  [(ngModel)]="form.contactStatus"
                  (ngModelChange)="revalidate()"
                >
                  <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let o of contactStatusOptions" [value]="o.value">{{ o.label }}</option>
                </select>
              </div>
              <p class="audit-field-error" id="s1-status-error" *ngIf="errors().contactStatus">
                {{ errors().contactStatus }}
              </p>
            </div>
            <div class="audit-field">
              <label class="audit-label" for="s1-notes">{{ T.NOTES }}</label>
              <textarea
                id="s1-notes"
                class="audit-control"
                [maxLength]="notesMax"
                aria-describedby="s1-notes-count"
                [(ngModel)]="form.notes"
              ></textarea>
              <p class="audit-counter" id="s1-notes-count" [attr.aria-label]="C.counterLabel(form.notes.length, notesMax)">
                {{ C.counter(form.notes.length, notesMax) }}
              </p>
            </div>
          </div>
        </section>
      </div>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep1ContactComponent {
  readonly S = S;
  readonly T = T;
  readonly C = C;
  readonly routes = AUDIT_ROUTES;
  readonly notesMax = AUDIT_STEP_NOTES_MAX;
  readonly contactMethodOptions = AUDIT_STEP1_CONTACT_METHOD_OPTIONS;
  readonly contactStatusOptions = AUDIT_STEP1_CONTACT_STATUS_OPTIONS;

  @ViewChild(AuditStepShellComponent) private shell?: AuditStepShellComponent;

  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly audit = signal<AuditDetailRecord>(mockAuditById(AUDIT_STEP_DEFAULT_AUDIT_ID));
  form: Step1Form = emptyForm();
  readonly errors = signal<Partial<Record<Step1ErrorKey, string>>>({});
  readonly errorList = signal<readonly { id: string; message: string }[]>([]);
  private submitted = false;

  constructor() {
    auditStepRouteId((id) => {
      this.audit.set(mockAuditById(id));
      this.form = emptyForm();
      this.submitted = false;
      this.setErrors({});
    });
  }

  private validate(): Partial<Record<Step1ErrorKey, string>> {
    const errors: Partial<Record<Step1ErrorKey, string>> = {};
    if (this.form.contactStatus === '') errors.contactStatus = T.ERROR_CONTACT_STATUS;
    return errors;
  }

  private setErrors(errors: Partial<Record<Step1ErrorKey, string>>): void {
    this.errors.set(errors);
    const list: { id: string; message: string }[] = [];
    if (errors.contactStatus) list.push({ id: 's1-status', message: errors.contactStatus });
    this.errorList.set(list);
  }

  revalidate(): void {
    if (this.submitted) this.setErrors(this.validate());
  }

  focusField(event: Event, id: string): void {
    event.preventDefault();
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }

  onSave(): void {
    this.submitted = true;
    const errors = this.validate();
    this.setErrors(errors);
    if (Object.keys(errors).length > 0) {
      // The shell already announced "Saved"; withdraw it. The role="alert" summary above announces
      // the missing fields instead.
      this.shell?.clearStatus();
      auditStepFocusFirstInvalid(this.host.nativeElement);
      return;
    }
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, STEP + 1));
  }
}
