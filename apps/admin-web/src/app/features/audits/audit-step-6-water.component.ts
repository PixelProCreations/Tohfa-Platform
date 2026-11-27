/**
 * Audit inspection step 6 — Water Sources & Water pH Testing (design 84). UI ONLY.
 *
 * One "Water Source N" band + card per source: water source (type-ahead over a native <datalist>),
 * use purpose, source type, verification, location, condition, test date and testing method, with
 * the amber "record each source separately" note beside the first. Design 84 draws one source;
 * "Add another water source" appends more locally (and later ones can be removed).
 *
 * Design 84 marks no field as required, so Save & Next has nothing to validate and goes straight to
 * step 7. (Design 78's section card says "1 required field left" — a design inconsistency, flagged.)
 * Save as Draft only shows the demo message. When integrated, answers go to an audit-section
 * endpoint that docs/openapi.yaml does not define yet (spec gap — see audit-steps-1-6.mock.ts).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import {
  AUDIT_STEP_DEFAULT_AUDIT_ID,
  AUDIT_STEPS_1_6_STYLES,
  auditStepRouteId,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';
import { AUDIT_STEP6_STRINGS as T } from './audit-step-6-water.strings';
import { AuditStepShellComponent } from './audit-step-shell.component';
import {
  AUDIT_STEP6_CONDITION_OPTIONS,
  AUDIT_STEP6_SOURCE_TYPE_OPTIONS,
  AUDIT_STEP6_TEST_METHOD_OPTIONS,
  AUDIT_STEP6_USE_PURPOSE_OPTIONS,
  AUDIT_STEP6_VERIFICATION_OPTIONS,
  AUDIT_STEP_WATER_SOURCE_OPTIONS,
} from './audit-steps-1-6.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditDetailRecord } from './audit.types';

const STEP = 6;

interface WaterSourceForm {
  /** Prefix for this source's element ids ("s6-w0"); stable across removals. */
  readonly key: string;
  source: string;
  usePurpose: string;
  sourceType: string;
  verification: string;
  location: string;
  condition: string;
  testDate: string;
  testMethod: string;
}

@Component({
  selector: 'tohfa-audit-step-6-water',
  standalone: true,
  imports: [CommonModule, FormsModule, AuditStepShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEPS_1_6_STYLES,
    `
      .source-band {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-8);
        margin: 0;
        padding: var(--space-12) var(--space-16);
        border-radius: var(--r-card);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .source-band-title {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font: inherit;
      }
      .source-band .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .source-layout {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: var(--space-16);
        align-items: start;
      }
      .source-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14) var(--space-18);
        align-items: start;
      }
      .info-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        padding: var(--space-16);
        border: 1px solid var(--warn-bd);
        border-radius: var(--r-card);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .info-card .material-symbols-outlined {
        color: var(--tohfa-amber);
        font-size: var(--icon-btn);
      }
      .info-card p {
        margin: 0;
        font-size: var(--fs-cap);
        line-height: 1.5;
      }
      .icon-select select.audit-control {
        appearance: none;
        cursor: pointer;
      }
      .remove-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        min-height: calc(var(--space-16) * 2);
        padding: var(--space-4) var(--space-10);
        border: var(--border-card);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        cursor: pointer;
      }
      .remove-btn:focus-visible,
      .add-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .add-row {
        display: flex;
      }
      .add-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }
      @media (max-width: 1100px) {
        .source-layout {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 640px) {
        .source-fields {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="T.TITLE"
      icon="water_drop"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="T.STEP_PILL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE_NEXT"
      primaryIcon="arrow_forward"
      (primary)="onSaveNext()"
    >
      <section
        class="step-fields"
        *ngFor="let w of sources(); let i = index; trackBy: trackByKey"
        [attr.aria-labelledby]="w.key + '-title'"
      >
        <div class="source-band">
          <h2 class="source-band-title" [id]="w.key + '-title'">
            <span class="material-symbols-outlined" aria-hidden="true">water_drop</span>
            {{ T.sourceBand(i + 1) }}
          </h2>
          <button
            *ngIf="i > 0"
            type="button"
            class="remove-btn"
            [attr.aria-label]="T.removeSource(i + 1)"
            (click)="removeSource(i)"
          >
            <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>
            {{ T.REMOVE }}
          </button>
        </div>

        <div class="source-layout">
          <div class="audit-card audit-card-body">
            <div class="source-fields">
              <div class="step-fields">
                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-source'">{{ T.WATER_SOURCE }}</label>
                  <div class="audit-input-icon-wrap">
                    <input
                      class="audit-control"
                      type="text"
                      autocomplete="off"
                      [id]="w.key + '-source'"
                      [attr.list]="w.key + '-source-list'"
                      [placeholder]="C.SELECT_PLACEHOLDER"
                      [(ngModel)]="w.source"
                    />
                    <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                  </div>
                  <datalist [id]="w.key + '-source-list'">
                    <option *ngFor="let o of waterSourceOptions" [value]="o.label"></option>
                  </datalist>
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-type'">{{ T.SOURCE_TYPE }}</label>
                  <div class="audit-select-wrap">
                    <select
                      class="audit-control"
                      [id]="w.key + '-type'"
                      [class.is-placeholder]="w.sourceType === ''"
                      [(ngModel)]="w.sourceType"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of sourceTypeOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-location'">{{ T.LOCATION }}</label>
                  <input
                    class="audit-control"
                    type="text"
                    [id]="w.key + '-location'"
                    [placeholder]="T.LOCATION_PLACEHOLDER"
                    [(ngModel)]="w.location"
                  />
                </div>
              </div>

              <div class="step-fields">
                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-purpose'">{{ T.USE_PURPOSE }}</label>
                  <div class="audit-input-icon-wrap icon-select">
                    <select
                      class="audit-control"
                      [id]="w.key + '-purpose'"
                      [class.is-placeholder]="w.usePurpose === ''"
                      [(ngModel)]="w.usePurpose"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of usePurposeOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                    <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">tune</span>
                  </div>
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-verification'">{{ T.VERIFICATION }}</label>
                  <div class="audit-select-wrap">
                    <select
                      class="audit-control"
                      [id]="w.key + '-verification'"
                      [class.is-placeholder]="w.verification === ''"
                      [(ngModel)]="w.verification"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of verificationOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-condition'">{{ T.CONDITION }}</label>
                  <div class="audit-select-wrap">
                    <select
                      class="audit-control"
                      [id]="w.key + '-condition'"
                      [class.is-placeholder]="w.condition === ''"
                      [(ngModel)]="w.condition"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of conditionOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-date'">{{ T.TEST_DATE }}</label>
                  <input class="audit-control" type="date" [id]="w.key + '-date'" [(ngModel)]="w.testDate" />
                </div>

                <div class="audit-field">
                  <label class="audit-label" [for]="w.key + '-method'">{{ T.TEST_METHOD }}</label>
                  <div class="audit-select-wrap">
                    <select
                      class="audit-control"
                      [id]="w.key + '-method'"
                      [class.is-placeholder]="w.testMethod === ''"
                      [(ngModel)]="w.testMethod"
                    >
                      <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let o of testMethodOptions" [value]="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside class="info-card" *ngIf="i === 0">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            <p>{{ T.INFO_TEXT }}</p>
          </aside>
        </div>
      </section>

      <div class="add-row">
        <button type="button" class="tohfa-btn audit-btn audit-btn-outline add-btn" (click)="addSource()">
          <span class="material-symbols-outlined icon" aria-hidden="true">add</span>
          {{ T.ADD_SOURCE }}
        </button>
      </div>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep6WaterComponent {
  readonly S = S;
  readonly T = T;
  readonly C = C;
  readonly routes = AUDIT_ROUTES;
  readonly waterSourceOptions = AUDIT_STEP_WATER_SOURCE_OPTIONS;
  readonly usePurposeOptions = AUDIT_STEP6_USE_PURPOSE_OPTIONS;
  readonly sourceTypeOptions = AUDIT_STEP6_SOURCE_TYPE_OPTIONS;
  readonly verificationOptions = AUDIT_STEP6_VERIFICATION_OPTIONS;
  readonly conditionOptions = AUDIT_STEP6_CONDITION_OPTIONS;
  readonly testMethodOptions = AUDIT_STEP6_TEST_METHOD_OPTIONS;

  @ViewChild(AuditStepShellComponent) private shell?: AuditStepShellComponent;

  private readonly router = inject(Router);

  readonly audit = signal<AuditDetailRecord>(mockAuditById(AUDIT_STEP_DEFAULT_AUDIT_ID));
  readonly sources = signal<WaterSourceForm[]>([]);
  private nextKey = 0;

  constructor() {
    auditStepRouteId((id) => {
      this.audit.set(mockAuditById(id));
      this.nextKey = 0;
      this.sources.set([this.newSource()]);
    });
  }

  trackByKey(_: number, w: WaterSourceForm): string {
    return w.key;
  }

  private newSource(): WaterSourceForm {
    const key = `s6-w${this.nextKey++}`;
    return {
      key,
      source: '',
      usePurpose: '',
      sourceType: '',
      verification: '',
      location: '',
      condition: '',
      testDate: '',
      testMethod: '',
    };
  }

  addSource(): void {
    const added = this.newSource();
    this.sources.set([...this.sources(), added]);
    this.shell?.announce(T.sourceAdded(this.sources().length));
    // Move focus to the new source's first field.
    setTimeout(() => document.getElementById(`${added.key}-source`)?.focus());
  }

  removeSource(index: number): void {
    this.sources.set(this.sources().filter((_, i) => i !== index));
    this.shell?.announce(T.sourceRemoved(index + 1));
  }

  onSaveNext(): void {
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, STEP + 1));
  }
}
