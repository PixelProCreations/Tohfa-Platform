/**
 * Audit inspection step 4 — Certification Verification (design 82). UI ONLY.
 *
 * Left: one accordion panel per certification on the farmer's profile (audit-steps-1-6.mock.ts;
 * PGS Organic and NPOP for AUD-2026-0042, the first expanded). Each panel shows the profile record as
 * a blue info note, the locked certification type, certification status, the certificate on file
 * ("View" is inert — no document viewer), a local upload drop zone, certified / renewal dates, the
 * required "Document Verification" and notes. Right: a "Verification Summary" table whose status pill
 * follows the local Document Verification choice, and the amber note.
 *
 * The inspection records observations only; it never declares a certificate valid or expired (BR-01
 * expiry is the nightly sweep's job, BR-02b keeps VERIFIED for a named admin on the certification
 * itself). Save & Next validates locally (one required field per certification — a collapsed panel
 * with an error is expanded) and goes to step 5. Save as Draft only shows the demo message.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AUDIT_ROUTES } from './audit-nav';
import { auditToneClass } from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AuditStepFileDropComponent } from './audit-step-1-6-file-drop.component';
import {
  AUDIT_STEP_DEFAULT_AUDIT_ID,
  AUDIT_STEP_NOTES_MAX,
  AUDIT_STEPS_1_6_STYLES,
  auditStepFocusFirstInvalid,
  auditStepOptionLabel,
  auditStepRouteId,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';
import { AUDIT_STEP4_STRINGS as T } from './audit-step-4-certification.strings';
import { AuditStepShellComponent } from './audit-step-shell.component';
import {
  AUDIT_STEP4_CERT_STATUS_OPTIONS,
  AUDIT_STEP4_DOC_VERIFICATION_OPTIONS,
  mockAuditStepExtras,
  type AuditStepCertification,
} from './audit-steps-1-6.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditDetailRecord, AuditTone } from './audit.types';

const STEP = 4;

interface CertForm {
  readonly cert: AuditStepCertification;
  /** Prefix for this panel's element ids ("s4-c0"). */
  readonly key: string;
  certStatus: string;
  certifiedDate: string;
  renewalDate: string;
  docVerification: string;
  notes: string;
}

/** Pill tone for a Document Verification value (verification_status enum). */
const DOC_TONE: Readonly<Record<string, AuditTone>> = {
  VERIFIED: 'success',
  REJECTED: 'danger',
};

function formsFor(certs: readonly AuditStepCertification[]): CertForm[] {
  return certs.map((cert, i) => ({
    cert,
    key: `s4-c${i}`,
    certStatus: '',
    certifiedDate: '',
    renewalDate: '',
    docVerification: '',
    notes: '',
  }));
}

@Component({
  selector: 'tohfa-audit-step-4-certification',
  standalone: true,
  imports: [CommonModule, FormsModule, AuditStepShellComponent, AuditStepFileDropComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEPS_1_6_STYLES,
    `
      .cert-layout {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: var(--space-16);
        align-items: start;
      }
      .cert-panel {
        overflow: hidden;
      }
      .cert-heading {
        margin: 0;
        font: inherit;
      }
      .cert-body[hidden] {
        display: none;
      }
      .cert-toggle {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        width: 100%;
        padding: var(--space-12) var(--space-16);
        border: none;
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        text-align: left;
        cursor: pointer;
      }
      .cert-toggle[aria-expanded='true'] {
        background: var(--tohfa-amber-tint);
      }
      .cert-toggle:focus-visible {
        outline: none;
        box-shadow: inset var(--tohfa-focus-ring);
      }
      .cert-icon {
        color: var(--tohfa-amber);
      }
      .cert-head-text {
        flex: 1;
        min-width: 0;
      }
      .cert-name {
        display: block;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .cert-sub {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .cert-chevron {
        color: var(--tohfa-slate);
      }
      .cert-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        padding: var(--space-14) var(--space-16) var(--space-16);
      }
      .cert-cols {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
        min-width: 0;
      }
      .summary-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-dense);
      }
      .summary-table th {
        padding: var(--space-10) var(--space-10);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-ink);
        font-size: var(--fs-badge);
        font-weight: var(--fw-bold);
        text-align: left;
      }
      .summary-table td {
        padding: var(--space-12) var(--space-10);
        border-bottom: var(--border-divider);
        vertical-align: middle;
      }
      .summary-table tr:last-child td {
        border-bottom: none;
      }
      .summary-cert {
        font-weight: var(--fw-bold);
      }
      .summary-head {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        padding: var(--space-14) var(--space-16);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .summary-head .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-slate);
      }
      .summary-body {
        padding: 0 var(--space-16) var(--space-16);
      }
      .note-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        padding: var(--space-14) var(--space-16);
        border: 1px solid var(--warn-bd);
        border-radius: var(--r-card);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .note-title {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .note-title .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .note-text {
        margin: 0;
        font-size: var(--fs-cap);
        line-height: 1.5;
      }
      @media (max-width: 1100px) {
        .cert-layout {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="S.SECTION_4"
      icon="verified_user"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="T.STEP_PILL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE_NEXT"
      primaryIcon="arrow_forward"
      (primary)="onSaveNext()"
    >
      <div class="step-error-summary" role="alert" *ngIf="errorList().length > 0">
        {{ C.errorSummaryAnnounce(errorList().length) }}
        <ul>
          <li *ngFor="let e of errorList()">
            <a [href]="'#' + e.id" (click)="focusField($event, e.id)">{{ e.message }}</a>
          </li>
        </ul>
      </div>

      <div class="cert-layout">
        <div class="cert-cols">
          <div class="audit-card" *ngIf="certs.length === 0">
            <div class="audit-empty">
              <span class="material-symbols-outlined audit-empty-icon" aria-hidden="true">workspace_premium</span>
              <p class="audit-empty-title">{{ T.NO_CERTS_TITLE }}</p>
              <p class="audit-empty-hint">{{ T.NO_CERTS_HINT }}</p>
            </div>
          </div>

          <section class="audit-card cert-panel" *ngFor="let c of certs; let i = index">
            <h2 class="cert-heading">
            <button
              type="button"
              class="cert-toggle"
              [id]="c.key + '-toggle'"
              [attr.aria-expanded]="isOpen(i)"
              [attr.aria-controls]="c.key + '-body'"
              (click)="toggle(i)"
            >
              <span class="material-symbols-outlined cert-icon" aria-hidden="true">verified</span>
              <span class="cert-head-text">
                <span class="cert-name">{{ c.cert.label }}</span>
                <span class="cert-sub">{{ T.certSubline(c.cert.profileStatus, c.cert.certifiedOn, c.cert.renewalOn) }}</span>
              </span>
              <span class="material-symbols-outlined cert-chevron" aria-hidden="true">{{
                isOpen(i) ? 'expand_less' : 'expand_more'
              }}</span>
            </button>
            </h2>

            <!-- [hidden], not *ngIf: a collapsed panel keeps its chosen file and inputs. -->
            <div class="cert-body" [id]="c.key + '-body'" [hidden]="!isOpen(i)">
              <p class="step-note-info">
                <span class="material-symbols-outlined" aria-hidden="true">info</span>
                <span>{{ T.recordedOnProfile(c.cert.profileStatus, c.cert.certifiedOn, c.cert.renewalOn) }}</span>
              </p>

              <div class="audit-form-grid">
                <div class="audit-field">
                  <label class="audit-label" [for]="c.key + '-type'">
                    {{ T.CERT_TYPE }}
                    <span class="material-symbols-outlined step-lock" role="img" [attr.aria-label]="C.LOCKED">lock</span>
                  </label>
                  <input class="audit-control" type="text" readonly [id]="c.key + '-type'" [value]="c.cert.label" />
                </div>
                <div class="audit-field">
                  <label class="audit-label" [for]="c.key + '-status'">{{ T.CERT_STATUS }}</label>
                  <div class="audit-select-wrap">
                    <select
                      class="audit-control"
                      [id]="c.key + '-status'"
                      [class.is-placeholder]="c.certStatus === ''"
                      [(ngModel)]="c.certStatus"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of certStatusOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                </div>

                <div class="audit-field">
                  <span class="audit-label">{{ T.CERT_DOCUMENT }}</span>
                  <div class="step-doc-row" *ngIf="c.cert.documentName !== null; else noDoc">
                    <span class="step-doc-name">
                      <span class="material-symbols-outlined" aria-hidden="true">description</span>
                      <span class="step-doc-title">{{ c.cert.documentName }}</span>
                    </span>
                    <button
                      type="button"
                      class="step-view-btn"
                      aria-disabled="true"
                      [attr.aria-label]="T.viewDocLabel(c.cert.documentName)"
                      [title]="C.NOT_AVAILABLE_YET"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                      {{ C.VIEW }}
                    </button>
                  </div>
                  <ng-template #noDoc>
                    <p class="audit-helper">{{ T.CERT_DOCUMENT_NONE }}</p>
                  </ng-template>
                </div>
                <div class="audit-field">
                  <label class="audit-label" [for]="c.key + '-upload'">{{ T.UPLOAD_CERT }}</label>
                  <tohfa-audit-step-file-drop [inputId]="c.key + '-upload'" [hint]="C.DROP_HINT_SHORT"></tohfa-audit-step-file-drop>
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="c.key + '-certified'">{{ T.CERTIFIED_DATE }}</label>
                  <input class="audit-control" type="date" [id]="c.key + '-certified'" [(ngModel)]="c.certifiedDate" />
                </div>
                <div class="audit-field">
                  <label class="audit-label" [for]="c.key + '-renewal'">{{ T.RENEWAL_DATE }}</label>
                  <input class="audit-control" type="date" [id]="c.key + '-renewal'" [(ngModel)]="c.renewalDate" />
                </div>

                <div class="audit-field">
                  <label class="audit-label required" [for]="c.key + '-doc'">{{ T.DOC_VERIFICATION }}</label>
                  <div class="audit-select-wrap">
                    <select
                      class="audit-control"
                      required
                      aria-required="true"
                      [id]="c.key + '-doc'"
                      [class.is-placeholder]="c.docVerification === ''"
                      [attr.aria-invalid]="errors()[c.key + '-doc'] ? 'true' : null"
                      [attr.aria-describedby]="errors()[c.key + '-doc'] ? c.key + '-doc-error' : null"
                      [(ngModel)]="c.docVerification"
                      (ngModelChange)="onDocChange()"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of docOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <p class="audit-field-error" [id]="c.key + '-doc-error'" *ngIf="errors()[c.key + '-doc']">
                    {{ errors()[c.key + '-doc'] }}
                  </p>
                </div>
                <div class="audit-field">
                  <label class="audit-label" [for]="c.key + '-notes'">{{ T.VERIFICATION_NOTES }}</label>
                  <textarea
                    class="audit-control"
                    [id]="c.key + '-notes'"
                    [placeholder]="C.NOTES_PLACEHOLDER"
                    [maxLength]="notesMax"
                    [attr.aria-describedby]="c.key + '-notes-count'"
                    [(ngModel)]="c.notes"
                  ></textarea>
                  <p
                    class="audit-counter"
                    [id]="c.key + '-notes-count'"
                    [attr.aria-label]="C.counterLabel(c.notes.length, notesMax)"
                  >
                    {{ C.counter(c.notes.length, notesMax) }}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="cert-cols">
          <section class="audit-card" aria-labelledby="s4-summary-head">
            <h2 class="summary-head" id="s4-summary-head">
              <span class="material-symbols-outlined" aria-hidden="true">fact_check</span>
              {{ T.SUMMARY_TITLE }}
            </h2>
            <div class="summary-body">
              <table class="summary-table">
                <thead>
                  <tr>
                    <th scope="col">{{ T.SUMMARY_COL_CERT }}</th>
                    <th scope="col">{{ T.SUMMARY_COL_PROFILE }}</th>
                    <th scope="col">{{ T.SUMMARY_COL_STATUS }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of summary()">
                    <th scope="row" class="summary-cert">{{ row.label }}</th>
                    <td>{{ row.profile }}</td>
                    <td><span [class]="row.pillClass">{{ row.status }}</span></td>
                  </tr>
                  <tr *ngIf="summary().length === 0">
                    <td colspan="3">{{ T.NO_CERTS_TITLE }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <aside class="note-card" aria-labelledby="s4-note-title">
            <h2 class="note-title" id="s4-note-title">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              {{ T.NOTE_TITLE }}
            </h2>
            <p class="note-text">{{ T.NOTE_TEXT }}</p>
          </aside>
        </div>
      </div>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep4CertificationComponent {
  readonly S = S;
  readonly T = T;
  readonly C = C;
  readonly routes = AUDIT_ROUTES;
  readonly notesMax = AUDIT_STEP_NOTES_MAX;
  readonly certStatusOptions = AUDIT_STEP4_CERT_STATUS_OPTIONS;
  readonly docOptions = AUDIT_STEP4_DOC_VERIFICATION_OPTIONS;

  @ViewChild(AuditStepShellComponent) private shell?: AuditStepShellComponent;

  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly audit = signal<AuditDetailRecord>(mockAuditById(AUDIT_STEP_DEFAULT_AUDIT_ID));
  certs: CertForm[] = [];
  /** Indexes of expanded panels (design 82: the first is open). */
  private readonly open = signal<ReadonlySet<number>>(new Set([0]));
  /** Document Verification values, mirrored into a signal so the summary table updates (OnPush). */
  private readonly docValues = signal<readonly string[]>([]);
  readonly errors = signal<Readonly<Record<string, string>>>({});
  readonly errorList = computed(() =>
    Object.entries(this.errors()).map(([id, message]) => ({ id, message })),
  );
  private submitted = false;

  private readonly certsSnapshot = signal<readonly AuditStepCertification[]>([]);

  readonly summary = computed(() => {
    const values = this.docValues();
    return this.certsSnapshot().map((cert, i) => {
      const value = values[i] ?? '';
      const label = value === '' || value === 'UNVERIFIED' ? T.NOT_YET_VERIFIED : auditStepOptionLabel(AUDIT_STEP4_DOC_VERIFICATION_OPTIONS, value);
      return {
        label: cert.label,
        profile: T.summaryProfile(cert.profileStatus, cert.certifiedOn, cert.renewalOn),
        status: label,
        pillClass: auditToneClass(DOC_TONE[value] ?? 'neutral', true),
      };
    });
  });

  constructor() {
    auditStepRouteId((id) => {
      const audit = mockAuditById(id);
      const certs = mockAuditStepExtras(audit.id, audit.plotIds).certifications;
      this.audit.set(audit);
      this.certs = formsFor(certs);
      this.certsSnapshot.set(certs);
      this.docValues.set(certs.map(() => ''));
      this.open.set(new Set([0]));
      this.submitted = false;
      this.errors.set({});
    });
  }

  isOpen(i: number): boolean {
    return this.open().has(i);
  }

  toggle(i: number): void {
    const next = new Set(this.open());
    if (next.has(i)) next.delete(i);
    else next.add(i);
    this.open.set(next);
  }

  onDocChange(): void {
    this.docValues.set(this.certs.map((c) => c.docVerification));
    if (this.submitted) this.errors.set(this.validate());
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const c of this.certs) {
      if (c.docVerification === '') errors[`${c.key}-doc`] = T.errorDocVerification(c.cert.label);
    }
    return errors;
  }

  focusField(event: Event, id: string): void {
    event.preventDefault();
    this.expandPanelOf(id);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus());
  }

  /** Opens the panel holding control `id` ("s4-c1-doc" → panel 1). */
  private expandPanelOf(id: string): void {
    const index = this.certs.findIndex((c) => id.startsWith(`${c.key}-`));
    if (index >= 0 && !this.isOpen(index)) this.toggle(index);
  }

  onSaveNext(): void {
    this.submitted = true;
    const errors = this.validate();
    this.errors.set(errors);
    const ids = Object.keys(errors);
    if (ids.length > 0) {
      // A required field can sit in a collapsed panel: open every panel that has an error.
      ids.forEach((id) => this.expandPanelOf(id));
      // The shell already announced "Saved"; withdraw it — the role="alert" summary speaks instead.
      this.shell?.clearStatus();
      auditStepFocusFirstInvalid(this.host.nativeElement);
      return;
    }
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, STEP + 1));
  }
}
