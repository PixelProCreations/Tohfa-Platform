/**
 * Add Farm Records → Assets tab ("Asset Records" card).
 *
 * UI ONLY. There is no admin (on-behalf) farm-asset write endpoint, so Save validates locally, shows a
 * "Saved (demo — not stored)" status, emits the draft through `saved` and clears the form. Option lists
 * are reused from the Farmer Records assets tab (../farmers/farmer-assets.mock.ts), which cites which are
 * spec values (category) and which are design-only (type, source). The "+ Add" buttons are inert: their
 * add-option dialogs have no design yet.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ASSET_CATEGORIES, ASSET_SOURCES, ASSET_TYPES, type AssetCategoryCode, type AssetSourceCode } from '../farmers/farmer-assets.mock';
import { FARM_RECORDS_FORM_STYLES } from './farm-records-add.styles';
import { FARM_RECORDS_STRINGS as S } from './farm-records.strings';

/** What `saved` emits. */
export interface FarmRecordsAssetDraft {
  readonly typeCode: string;
  readonly category: AssetCategoryCode;
  readonly source: AssetSourceCode;
}

type FieldKey = 'type' | 'category' | 'source';

let nextId = 0;

@Component({
  selector: 'tohfa-farm-records-asset-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [FARM_RECORDS_FORM_STYLES],
  template: `
    <form class="tohfa-card card" novalidate [attr.aria-labelledby]="ids.title" (ngSubmit)="save()">
      <h2 class="card-head tinted" [id]="ids.title">
        <span class="material-symbols-outlined icon" aria-hidden="true">agriculture</span>{{ S.ASSET_CARD }}
      </h2>

      <div class="card-body single">
        <div class="field" *ngFor="let f of fields">
          <label class="field-label" [for]="f.id">{{ f.label }} <span class="req" aria-hidden="true">*</span></label>
          <div class="row">
            <div class="control">
              <select
                class="tohfa-input"
                [name]="f.key"
                [id]="f.id"
                required
                aria-required="true"
                [class.placeholder]="!value(f.key)"
                [class.invalid]="err(f.key)"
                [attr.aria-invalid]="err(f.key) ? 'true' : null"
                [attr.aria-describedby]="err(f.key) ? f.id + '-err' : null"
                [ngModel]="value(f.key)"
                (ngModelChange)="setValue(f.key, $event)"
              >
                <option value="" disabled>{{ f.placeholder }}</option>
                <option *ngFor="let o of f.options" [value]="o.code">{{ o.label }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
            <!-- Inert: the add-option dialog has no design yet. -->
            <button type="button" class="tohfa-btn tohfa-btn-outline-amber add-btn" aria-disabled="true" [title]="S.ADD_OPTION_NOT_AVAILABLE">
              <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD }}
            </button>
          </div>
          <p class="field-error" *ngIf="err(f.key) as e" [id]="f.id + '-err'">{{ e }}</p>
        </div>
      </div>
    </form>

    <div class="foot split">
      <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="onCancel()">{{ S.BTN_BACK }}</button>
      <p class="form-error" *ngIf="submitted() && hasErrors()" role="alert">{{ S.ERR_FORM }}</p>
      <p class="status" role="status">{{ savedMessage() }}</p>
      <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">{{ S.BTN_SAVE_ASSET }}</button>
    </div>
  `,
})
export class FarmRecordsAssetFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Back was confirmed (or the form was clean); the host leaves the screen. */
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<FarmRecordsAssetDraft>();

  readonly S = S;

  private readonly uid = nextId++;
  readonly ids = { title: `fra-title-${this.uid}` };

  readonly fields: readonly {
    key: FieldKey;
    id: string;
    label: string;
    placeholder: string;
    options: readonly { code: string; label: string }[];
  }[] = [
    { key: 'type', id: `fra-type-${this.uid}`, label: S.ASSET_TYPE, placeholder: S.ASSET_TYPE_PLACEHOLDER, options: ASSET_TYPES },
    { key: 'category', id: `fra-category-${this.uid}`, label: S.ASSET_CATEGORY, placeholder: S.ASSET_CATEGORY_PLACEHOLDER, options: ASSET_CATEGORIES },
    { key: 'source', id: `fra-source-${this.uid}`, label: S.ASSET_SOURCE, placeholder: S.ASSET_SOURCE_PLACEHOLDER, options: ASSET_SOURCES },
  ];

  private readonly values = signal<Record<FieldKey, string>>({ type: '', category: '', source: '' });
  readonly submitted = signal(false);
  readonly savedMessage = signal('');

  private readonly fieldErrors = computed<Partial<Record<FieldKey, string>>>(() => {
    const v = this.values();
    const errors: Partial<Record<FieldKey, string>> = {};
    for (const key of ['type', 'category', 'source'] as const) if (!v[key]) errors[key] = S.ERR_REQUIRED;
    return errors;
  });

  readonly hasErrors = computed(() => Object.keys(this.fieldErrors()).length > 0);

  value(key: FieldKey): string {
    return this.values()[key];
  }

  setValue(key: FieldKey, value: string | null): void {
    this.values.update((v) => ({ ...v, [key]: value ?? '' }));
  }

  err(key: FieldKey): string | null {
    return this.submitted() ? (this.fieldErrors()[key] ?? null) : null;
  }

  isDirty(): boolean {
    return Object.values(this.values()).some((v) => v !== '');
  }

  onCancel(): void {
    if (this.isDirty() && !window.confirm(S.LEAVE_CONFIRM)) return;
    this.cancel.emit();
  }

  save(): void {
    this.savedMessage.set('');
    this.submitted.set(true);
    if (this.hasErrors()) {
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const v = this.values();
    this.saved.emit({
      typeCode: v.type,
      category: v.category as AssetCategoryCode,
      source: v.source as AssetSourceCode,
    });
    this.submitted.set(false);
    this.values.set({ type: '', category: '', source: '' });
    this.savedMessage.set(S.SAVED_DEMO);
  }
}
