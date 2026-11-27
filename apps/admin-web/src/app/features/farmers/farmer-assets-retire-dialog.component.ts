/**
 * Farmer Records → Assets → "Retire Asset" modal (SA-M3-S13, design 51).
 *
 * UI ONLY. Emits the reason and remarks; the Assets tab removes the card locally. The farmer-facing spec
 * retires an asset with a body-less soft delete (`DELETE /farmers/me/farm-assets/{assetId}`), so the
 * reason list and remarks are design-only until the admin contract is written; that write must also
 * land in audit_log.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FarmerAssetsSummaryComponent } from './farmer-assets-summary.component';
import { ASSET_DIALOG_STYLES, type AssetView } from './farmer-assets-shared';
import { ASSET_LIMITS, ASSET_RETIRE_REASONS } from './farmer-assets.mock';
import { FARMER_ASSETS_STRINGS as S } from './farmer-assets-tab.strings';

export interface AssetRetireResult {
  readonly assetCode: string;
  readonly reason: string;
  readonly remarks: string;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-assets-retire-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective, FarmerAssetsSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [ASSET_DIALOG_STYLES],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog ad ad-wide"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        [attr.aria-describedby]="ids.sub"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="ad-head">
          <span class="material-symbols-outlined ad-head-icon danger" aria-hidden="true">delete</span>
          <h2 class="ad-title" [id]="ids.title">{{ S.RETIRE_TITLE }}</h2>
          <button type="button" class="ad-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
          <p class="ad-sub" [id]="ids.sub">{{ S.retireSubtitle(view.asset.name) }}</p>
        </header>

        <div class="ad-body">
          <p class="ad-banner">
            <span class="material-symbols-outlined icon" aria-hidden="true">person</span>{{ S.editingFor(farmerName, farmerCode) }}
          </p>

          <tohfa-farmer-assets-summary [view]="view" />

          <div class="field">
            <label class="field-label" [for]="ids.reason">{{ S.RETIRE_REASON }} <span class="req" aria-hidden="true">*</span></label>
            <div class="control">
              <select
                class="tohfa-input"
                [id]="ids.reason"
                required
                aria-required="true"
                data-autofocus
                [class.invalid]="reasonErr()"
                [attr.aria-invalid]="reasonErr() ? 'true' : null"
                [attr.aria-describedby]="reasonErr() ? ids.reason + '-err' : null"
                [ngModel]="reason()"
                (ngModelChange)="reason.set($event ?? '')"
              >
                <option value="" disabled>{{ S.RETIRE_REASON_PLACEHOLDER }}</option>
                <option *ngFor="let r of reasons" [value]="r.code">{{ r.label }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
            <p class="field-error" *ngIf="reasonErr()" [id]="ids.reason + '-err'">{{ S.ERR_REQUIRED }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.remarks">{{ S.RETIRE_REMARKS }} <span class="req" aria-hidden="true">*</span></label>
            <textarea
              class="tohfa-input"
              rows="3"
              [id]="ids.remarks"
              required
              aria-required="true"
              [attr.maxlength]="max"
              [class.invalid]="remarksErr()"
              [attr.aria-invalid]="remarksErr() ? 'true' : null"
              [attr.aria-describedby]="ids.remarks + '-counter' + (remarksErr() ? ' ' + ids.remarks + '-err' : '')"
              [placeholder]="S.RETIRE_REMARKS_PLACEHOLDER"
              [ngModel]="remarks()"
              (ngModelChange)="remarks.set(($event ?? '').slice(0, max))"
            ></textarea>
            <span class="counter" [id]="ids.remarks + '-counter'" [attr.aria-label]="S.counterAria(remarks().length, max)">{{
              S.counter(remarks().length, max)
            }}</span>
            <p class="field-error" *ngIf="remarksErr()" [id]="ids.remarks + '-err'">{{ S.ERR_REQUIRED }}</p>
          </div>

          <p class="note danger" role="note">
            <span class="material-symbols-outlined icon" aria-hidden="true">warning</span>{{ S.RETIRE_WARNING }}
          </p>
        </div>

        <footer class="ad-foot divided">
          <button type="button" class="tohfa-btn btn-cancel-amber" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" (click)="submit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.BTN_CONFIRM_RETIRE }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerAssetsRetireDialogComponent {
  @Input({ required: true }) view!: AssetView;
  @Input() farmerName = '';
  @Input() farmerCode = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<AssetRetireResult>();

  readonly S = S;
  readonly reasons = ASSET_RETIRE_REASONS;
  readonly max = ASSET_LIMITS.retireRemarksMax;

  private readonly uid = nextId++;
  readonly ids = {
    title: `ar-title-${this.uid}`,
    sub: `ar-sub-${this.uid}`,
    reason: `ar-reason-${this.uid}`,
    remarks: `ar-remarks-${this.uid}`,
  };

  readonly reason = signal('');
  readonly remarks = signal('');
  readonly submitted = signal(false);

  readonly reasonErr = computed(() => this.submitted() && !this.reason());
  readonly remarksErr = computed(() => this.submitted() && this.remarks().trim() === '');

  submit(): void {
    this.submitted.set(true);
    if (!this.reason() || this.remarks().trim() === '') return;
    this.confirmed.emit({ assetCode: this.view.asset.code, reason: this.reason(), remarks: this.remarks().trim() });
  }
}
