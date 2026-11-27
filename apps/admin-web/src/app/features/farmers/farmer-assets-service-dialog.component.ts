/**
 * Farmer Records → Assets → "Record Service" modal (SA-M3-S13, design 49).
 *
 * UI ONLY. Validates locally and emits the service record; the Assets tab then moves the asset's last
 * service date and recomputes its next service due date. The attachment zone opens the local file
 * chooser (or accepts a drop) and only keeps the file's name — nothing is uploaded. The spec has no
 * service-record endpoint yet; when it does, this becomes a POST guarded by its rbac.json permission and
 * recorded in audit_log, and the cost is sent as integer paise.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FarmerAssetsSummaryComponent } from './farmer-assets-summary.component';
import { ASSET_DIALOG_STYLES, type AssetView } from './farmer-assets-shared';
import { ASSET_LIMITS, ASSET_SERVICE_TYPES, ASSETS_REFERENCE_DATE } from './farmer-assets.mock';
import { FARMER_ASSETS_STRINGS as S } from './farmer-assets-tab.strings';

export interface AssetServiceResult {
  readonly assetCode: string;
  /** ISO date (yyyy-MM-dd). */
  readonly serviceDate: string;
  readonly serviceType: string;
  readonly provider: string;
  /** Whole rupees as a digit string, or '' when not given. Never a float. */
  readonly costRupees: string;
  readonly notes: string;
  /** Local file name only; nothing is uploaded. */
  readonly attachmentName: string | null;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-assets-service-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective, FarmerAssetsSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ASSET_DIALOG_STYLES,
    `
      .drop {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        width: 100%;
        padding: var(--space-24) var(--space-16);
        border: 1px dashed var(--tohfa-amber-border);
        border-radius: var(--r-md);
        background: var(--tohfa-page);
        color: var(--tohfa-ink);
        font-family: var(--font);
        text-align: center;
        cursor: pointer;
      }
      .drop.over {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber-tint);
      }
      .drop:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .drop .cloud {
        font-size: var(--icon-dialog-close);
        color: var(--tohfa-amber);
        margin-bottom: var(--space-4);
      }
      .drop strong {
        font-size: var(--fs-body);
        font-weight: var(--fw-xbold);
      }
      .drop .hint {
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .drop .types {
        font-size: var(--fs-badge);
        color: var(--tohfa-muted);
      }
      .file-input {
        display: none;
      }
      .file {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin-top: var(--space-8);
        padding: var(--space-8) var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-sm);
        font-size: var(--fs-dense);
      }
      .file span:nth-child(2) {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-x {
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--err);
        cursor: pointer;
      }
      .file-x:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog ad ad-wide"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="ad-head">
          <span class="material-symbols-outlined ad-head-icon" aria-hidden="true">build</span>
          <h2 class="ad-title" [id]="ids.title">{{ S.SERVICE_TITLE }}</h2>
          <button type="button" class="ad-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="ad-body">
          <p class="ad-banner">
            <span class="material-symbols-outlined icon" aria-hidden="true">person_add</span>{{ S.addingFor(farmerName, farmerCode) }}
          </p>

          <tohfa-farmer-assets-summary [view]="view" />

          <div class="grid2">
            <div class="field">
              <label class="field-label" [for]="ids.date">{{ S.SERVICE_DATE }} <span class="req" aria-hidden="true">*</span></label>
              <div class="control">
                <input
                  type="date"
                  class="tohfa-input"
                  [id]="ids.date"
                  required
                  aria-required="true"
                  data-autofocus
                  [max]="referenceDate"
                  [class.invalid]="err('date')"
                  [attr.aria-invalid]="err('date') ? 'true' : null"
                  [attr.aria-describedby]="err('date') ? ids.date + '-err' : null"
                  [ngModel]="date()"
                  (ngModelChange)="date.set($event ?? '')"
                />
                <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
              </div>
              <p class="field-error" *ngIf="err('date') as e" [id]="ids.date + '-err'">{{ e }}</p>
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.type">{{ S.SERVICE_TYPE }} <span class="req" aria-hidden="true">*</span></label>
              <div class="control">
                <select
                  class="tohfa-input"
                  [id]="ids.type"
                  required
                  aria-required="true"
                  [class.invalid]="err('type')"
                  [attr.aria-invalid]="err('type') ? 'true' : null"
                  [attr.aria-describedby]="err('type') ? ids.type + '-err' : null"
                  [ngModel]="type()"
                  (ngModelChange)="type.set($event ?? '')"
                >
                  <option value="" disabled>{{ S.SERVICE_TYPE_PLACEHOLDER }}</option>
                  <option *ngFor="let t of serviceTypes" [value]="t.code">{{ t.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <p class="field-error" *ngIf="err('type') as e" [id]="ids.type + '-err'">{{ e }}</p>
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.provider">{{ S.SERVICE_PROVIDER }}</label>
              <input
                type="text"
                class="tohfa-input"
                autocomplete="off"
                [id]="ids.provider"
                [attr.maxlength]="limits.providerMax"
                [placeholder]="S.SERVICE_PROVIDER_PLACEHOLDER"
                [ngModel]="provider()"
                (ngModelChange)="provider.set($event ?? '')"
              />
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.cost">{{ S.SERVICE_COST }}</label>
              <div class="control">
                <span class="lead" aria-hidden="true">{{ S.SERVICE_COST_PREFIX }}</span>
                <input
                  type="text"
                  inputmode="numeric"
                  class="tohfa-input with-lead"
                  autocomplete="off"
                  [id]="ids.cost"
                  [attr.maxlength]="limits.costMaxChars"
                  [placeholder]="S.SERVICE_COST_PLACEHOLDER"
                  [ngModel]="cost()"
                  (ngModelChange)="cost.set(digitsOnly($event))"
                />
              </div>
            </div>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.notes">{{ S.SERVICE_NOTES }}</label>
            <textarea
              class="tohfa-input"
              rows="3"
              [id]="ids.notes"
              [attr.maxlength]="limits.serviceNotesMax"
              [attr.aria-describedby]="ids.notes + '-counter'"
              [placeholder]="S.SERVICE_NOTES_PLACEHOLDER"
              [ngModel]="notes()"
              (ngModelChange)="notes.set(($event ?? '').slice(0, limits.serviceNotesMax))"
            ></textarea>
            <span
              class="counter"
              [id]="ids.notes + '-counter'"
              [attr.aria-label]="S.counterAria(notes().length, limits.serviceNotesMax)"
              >{{ S.counter(notes().length, limits.serviceNotesMax) }}</span
            >
          </div>

          <div class="field">
            <span class="field-label" [id]="ids.attach">{{ S.ATTACHMENT }}</span>
            <!-- Local file chooser / drop only: the name is kept, nothing is uploaded. -->
            <input
              #fileInput
              type="file"
              class="file-input"
              tabindex="-1"
              aria-hidden="true"
              [accept]="limits.attachmentAccept"
              (change)="onFileInput($event)"
            />
            <button
              type="button"
              class="drop"
              [class.over]="dragOver()"
              [attr.aria-labelledby]="ids.attach + ' ' + ids.attach + '-title'"
              [attr.aria-describedby]="ids.attach + '-hint'"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (dragleave)="dragOver.set(false)"
              (drop)="onDrop($event)"
            >
              <span class="material-symbols-outlined cloud" aria-hidden="true">cloud_upload</span>
              <strong [id]="ids.attach + '-title'">{{ S.ATTACHMENT_TITLE }}</strong>
              <span [id]="ids.attach + '-hint'">
                <span class="hint">{{ S.ATTACHMENT_HINT }}</span><br />
                <span class="types">{{ S.ATTACHMENT_TYPES }}</span>
              </span>
            </button>
            <div class="file" *ngIf="fileName() as f">
              <span class="material-symbols-outlined icon" aria-hidden="true">description</span>
              <span aria-live="polite">{{ S.attachmentChosen(f) }}</span>
              <button type="button" class="file-x" [attr.aria-label]="S.ATTACHMENT_REMOVE" [title]="S.ATTACHMENT_REMOVE" (click)="clearFile(fileInput)">
                <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
              </button>
            </div>
            <p class="field-error" *ngIf="fileError() as e" role="alert">{{ e }}</p>
          </div>

          <p class="note">
            <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ S.SERVICE_NOTE }}
          </p>
        </div>

        <footer class="ad-foot">
          <button type="button" class="tohfa-btn btn-cancel-ok" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="submit()">{{ S.BTN_CONFIRM_SERVICE }}</button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerAssetsServiceDialogComponent implements OnInit {
  @Input({ required: true }) view!: AssetView;
  @Input() farmerName = '';
  @Input() farmerCode = '';
  /** "Today" for the default service date and the no-future check. */
  @Input() referenceDate: string = ASSETS_REFERENCE_DATE;
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<AssetServiceResult>();

  readonly S = S;
  readonly limits = ASSET_LIMITS;
  readonly serviceTypes = ASSET_SERVICE_TYPES;

  private readonly uid = nextId++;
  readonly ids = {
    title: `as-title-${this.uid}`,
    date: `as-date-${this.uid}`,
    type: `as-type-${this.uid}`,
    provider: `as-provider-${this.uid}`,
    cost: `as-cost-${this.uid}`,
    notes: `as-notes-${this.uid}`,
    attach: `as-attach-${this.uid}`,
  };

  readonly date = signal('');
  readonly type = signal(ASSET_SERVICE_TYPES[0]?.code ?? '');
  readonly provider = signal('');
  readonly cost = signal('');
  readonly notes = signal('');
  readonly fileName = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);
  readonly dragOver = signal(false);
  readonly submitted = signal(false);

  private readonly errors = computed(() => {
    const e: { date?: string; type?: string } = {};
    if (!this.date()) e.date = S.ERR_REQUIRED;
    else if (this.date() > this.referenceDate) e.date = S.ERR_SERVICE_DATE_FUTURE;
    if (!this.type()) e.type = S.ERR_REQUIRED;
    return e;
  });

  ngOnInit(): void {
    this.date.set(this.referenceDate);
  }

  err(key: 'date' | 'type'): string | null {
    return this.submitted() ? (this.errors()[key] ?? null) : null;
  }

  digitsOnly(value: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  onFileInput(event: Event): void {
    this.takeFile((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.takeFile(event.dataTransfer?.files?.[0] ?? null);
  }

  clearFile(input: HTMLInputElement): void {
    input.value = '';
    this.fileName.set(null);
    this.fileError.set(null);
  }

  submit(): void {
    this.submitted.set(true);
    const e = this.errors();
    if (e.date || e.type) return;
    this.confirmed.emit({
      assetCode: this.view.asset.code,
      serviceDate: this.date(),
      serviceType: this.type(),
      provider: this.provider().trim(),
      costRupees: this.cost(),
      notes: this.notes().trim(),
      attachmentName: this.fileName(),
    });
  }

  private takeFile(file: File | null): void {
    if (!file) return;
    const types: readonly string[] = ASSET_LIMITS.attachmentTypes;
    if (!types.includes(file.type)) {
      this.fileError.set(S.ATTACHMENT_ERR_TYPE);
      return;
    }
    if (file.size > ASSET_LIMITS.attachmentMaxBytes) {
      this.fileError.set(S.ATTACHMENT_ERR_SIZE);
      return;
    }
    this.fileError.set(null);
    this.fileName.set(file.name);
  }
}
