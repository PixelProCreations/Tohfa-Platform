/**
 * Farmer Records → Assets → "Edit Asset" modal (SA-M3-S13, design 50).
 *
 * UI ONLY. Emits the new Asset Type, Category and Source; the Assets tab updates the card locally.
 * Spec note: the farmer-facing API does not allow `category` to change after creation
 * (farm-assets.schema.ts update body omits it) and has no type / source fields; the design's editable
 * fields are kept here and the conflict is to be resolved when the admin contract is written.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FarmerAssetsSummaryComponent } from './farmer-assets-summary.component';
import { ASSET_DIALOG_STYLES, type AssetView } from './farmer-assets-shared';
import { ASSET_CATEGORIES, ASSET_SOURCES, ASSET_TYPES, type AssetCategoryCode, type AssetSourceCode } from './farmer-assets.mock';
import { FARMER_ASSETS_STRINGS as S } from './farmer-assets-tab.strings';

export interface AssetEditResult {
  readonly assetCode: string;
  readonly typeCode: string;
  readonly category: AssetCategoryCode;
  readonly source: AssetSourceCode;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-assets-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective, FarmerAssetsSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [ASSET_DIALOG_STYLES],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog ad ad-narrow"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="ad-head">
          <span class="material-symbols-outlined ad-head-icon" aria-hidden="true">edit</span>
          <h2 class="ad-title" [id]="ids.title">{{ S.EDIT_TITLE }}</h2>
          <button type="button" class="ad-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="ad-body">
          <p class="ad-banner">
            <span class="material-symbols-outlined icon" aria-hidden="true">person</span>{{ S.editingAssetFor(farmerName, farmerCode) }}
          </p>

          <tohfa-farmer-assets-summary [view]="view" [compact]="true" />

          <div class="field">
            <label class="field-label" [for]="ids.type">{{ S.ASSET_TYPE }} <span class="req" aria-hidden="true">*</span></label>
            <div class="control">
              <select
                class="tohfa-input"
                [id]="ids.type"
                required
                aria-required="true"
                data-autofocus
                [class.invalid]="submitted() && !type()"
                [attr.aria-invalid]="submitted() && !type() ? 'true' : null"
                [ngModel]="type()"
                (ngModelChange)="type.set($event ?? '')"
              >
                <option value="" disabled>{{ S.SELECT_PLACEHOLDER }}</option>
                <option *ngFor="let t of types" [value]="t.code">{{ t.label }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
            <p class="field-error" *ngIf="submitted() && !type()">{{ S.ERR_REQUIRED }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.category">{{ S.CATEGORY }} <span class="req" aria-hidden="true">*</span></label>
            <div class="control">
              <select
                class="tohfa-input"
                [id]="ids.category"
                required
                aria-required="true"
                [ngModel]="category()"
                (ngModelChange)="category.set($event)"
              >
                <option *ngFor="let c of categories" [ngValue]="c.code">{{ c.label }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.source">{{ S.SOURCE_FIELD }} <span class="req" aria-hidden="true">*</span></label>
            <div class="control">
              <select
                class="tohfa-input"
                [id]="ids.source"
                required
                aria-required="true"
                [ngModel]="source()"
                (ngModelChange)="source.set($event)"
              >
                <option *ngFor="let s of sources" [ngValue]="s.code">{{ s.label }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
          </div>

          <p class="note">
            <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ S.ASSET_ID_NOTE }}
          </p>
        </div>

        <footer class="ad-foot">
          <button type="button" class="tohfa-btn btn-cancel-ok" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="submit()">{{ S.BTN_SAVE }}</button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerAssetsEditDialogComponent implements OnInit {
  @Input({ required: true }) view!: AssetView;
  @Input() farmerName = '';
  @Input() farmerCode = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<AssetEditResult>();

  readonly S = S;
  readonly types = ASSET_TYPES;
  readonly categories = ASSET_CATEGORIES;
  readonly sources = ASSET_SOURCES;

  private readonly uid = nextId++;
  readonly ids = {
    title: `ae-title-${this.uid}`,
    type: `ae-type-${this.uid}`,
    category: `ae-category-${this.uid}`,
    source: `ae-source-${this.uid}`,
  };

  readonly type = signal('');
  readonly category = signal<AssetCategoryCode>('TOOL');
  readonly source = signal<AssetSourceCode>('FARMER');
  readonly submitted = signal(false);

  ngOnInit(): void {
    this.type.set(this.view.asset.typeCode);
    this.category.set(this.view.asset.category);
    this.source.set(this.view.asset.source);
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.type()) return;
    this.confirmed.emit({
      assetCode: this.view.asset.code,
      typeCode: this.type(),
      category: this.category(),
      source: this.source(),
    });
  }
}
