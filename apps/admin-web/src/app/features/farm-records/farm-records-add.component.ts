/**
 * Farmers Management → Farm Records → Add Farm Records (Diary / Plant / Crops / Livestock / Assets).
 *
 * UI ONLY. Each tab is its own form component; none of them calls an API (there are no admin on-behalf
 * farm-record write endpoints in docs/openapi.yaml). The tab panels stay mounted and are only hidden, so
 * switching tabs keeps what the admin typed in each form.
 *
 * Form contract used by every tab: no inputs; outputs `(cancel)` — the form has already confirmed any
 * unsaved changes, the shell leaves to the list — and `(saved)` — the form validated, showed its own
 * "Saved (demo — not stored)" status and cleared itself; the shell has nothing to persist.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FarmRecordsAssetFormComponent } from './farm-records-asset-form.component';
import { FarmRecordsCropFormComponent } from './farm-records-crop-form.component';
import { FarmRecordsDiaryFormComponent } from './farm-records-diary-form.component';
import { FarmRecordsLivestockFormComponent } from './farm-records-livestock-form.component';
import { FarmRecordsPlantFormComponent } from './farm-records-plant-form.component';
import { FARM_RECORDS_STRINGS as S } from './farm-records.strings';

export type FarmRecordsTab = 'diary' | 'plant' | 'crops' | 'livestock' | 'assets';

interface TabDef {
  readonly id: FarmRecordsTab;
  readonly label: string;
  readonly subtitle: string;
}

const TABS: readonly TabDef[] = [
  { id: 'diary', label: S.TAB_DIARY, subtitle: S.SUBTITLE_DIARY },
  { id: 'plant', label: S.TAB_PLANT, subtitle: S.SUBTITLE_PLANT },
  { id: 'crops', label: S.TAB_CROPS, subtitle: S.SUBTITLE_CROPS },
  { id: 'livestock', label: S.TAB_LIVESTOCK, subtitle: S.SUBTITLE_LIVESTOCK },
  { id: 'assets', label: S.TAB_ASSETS, subtitle: S.SUBTITLE_ASSETS },
];

/** Where Cancel / Back return to. */
const LIST_ROUTE = ['/farmers', 'farm-records'];

@Component({
  selector: 'tohfa-farm-records-add',
  standalone: true,
  imports: [
    CommonModule,
    FarmRecordsDiaryFormComponent,
    FarmRecordsPlantFormComponent,
    FarmRecordsCropFormComponent,
    FarmRecordsLivestockFormComponent,
    FarmRecordsAssetFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .title {
        margin: 0;
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .subtitle {
        margin: var(--space-6) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .tab {
        min-height: calc(var(--space-20) * 2);
        padding-left: var(--space-18);
        padding-right: var(--space-18);
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
      }
      .tab.active {
        color: var(--tohfa-neutral-white);
      }
      .tab:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
    `,
  ],
  template: `
    <header>
      <h1 class="title">{{ S.ADD_TITLE }}</h1>
      <p class="subtitle">{{ current().subtitle }}</p>
    </header>

    <div
      class="tohfa-tabs"
      role="tablist"
      [attr.aria-label]="S.TABS_LABEL"
      (keydown)="onTabKey($event)"
    >
      <button
        *ngFor="let t of tabs"
        type="button"
        role="tab"
        class="tohfa-tab-pill tab"
        [id]="ids.tab + t.id"
        [class.active]="tab() === t.id"
        [attr.aria-selected]="tab() === t.id"
        [attr.aria-controls]="ids.panel + t.id"
        [tabindex]="tab() === t.id ? 0 : -1"
        (click)="tab.set(t.id)"
      >
        {{ t.label }}
      </button>
    </div>

    <div
      role="tabpanel"
      [id]="ids.panel + 'diary'"
      [attr.aria-labelledby]="ids.tab + 'diary'"
      [hidden]="tab() !== 'diary'"
    >
      <tohfa-farm-records-diary-form (cancel)="onCancel()" (saved)="onSaved()" />
    </div>

    <div
      role="tabpanel"
      [id]="ids.panel + 'plant'"
      [attr.aria-labelledby]="ids.tab + 'plant'"
      [hidden]="tab() !== 'plant'"
    >
      <tohfa-farm-records-plant-form (cancel)="onCancel()" (saved)="onSaved()" />
    </div>

    <div
      role="tabpanel"
      [id]="ids.panel + 'crops'"
      [attr.aria-labelledby]="ids.tab + 'crops'"
      [hidden]="tab() !== 'crops'"
    >
      <tohfa-farm-records-crop-form (cancel)="onCancel()" (saved)="onSaved()" />
    </div>

    <div
      role="tabpanel"
      [id]="ids.panel + 'livestock'"
      [attr.aria-labelledby]="ids.tab + 'livestock'"
      [hidden]="tab() !== 'livestock'"
    >
      <tohfa-farm-records-livestock-form (cancel)="onCancel()" (saved)="onSaved()" />
    </div>

    <div
      role="tabpanel"
      [id]="ids.panel + 'assets'"
      [attr.aria-labelledby]="ids.tab + 'assets'"
      [hidden]="tab() !== 'assets'"
    >
      <tohfa-farm-records-asset-form (cancel)="onCancel()" (saved)="onSaved()" />
    </div>
  `,
})
export class FarmRecordsAddComponent {
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly S = S;
  readonly tabs = TABS;
  readonly ids = { tab: 'fr-add-tab-', panel: 'fr-add-panel-' };

  readonly tab = signal<FarmRecordsTab>('diary');
  readonly current = computed(() => TABS.find((t) => t.id === this.tab()) ?? TABS[0]!);

  /** The form has already confirmed discarding any unsaved changes. */
  onCancel(): void {
    void this.router.navigate(LIST_ROUTE);
  }

  /**
   * UI-only: each form announces its own "Saved (demo — not stored)" status and clears itself, so the
   * shell has nothing to do. When integrated, this is where a saved record would refresh the list.
   */
  onSaved(): void {
    // Intentionally empty in UI-only mode.
  }

  /** Roving tabindex with arrow / Home / End keys, as in the Farmer Records sub-tabs. */
  onTabKey(event: KeyboardEvent): void {
    const index = TABS.findIndex((t) => t.id === this.tab());
    const last = TABS.length - 1;
    let next: number;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    const id = TABS[next]!.id;
    this.tab.set(id);
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.tab}${id}`)?.focus(),
    );
  }
}
