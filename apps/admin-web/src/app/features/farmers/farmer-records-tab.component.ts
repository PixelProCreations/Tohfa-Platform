/**
 * Farmers Management → Farmer Details → Farmer Records tab.
 *
 * UI ONLY. The API has no farmer-records endpoints yet, so every sub-tab runs on placeholder data
 * (`farmer-records.mock.ts` and the per-sub-tab mocks); nothing here calls the API. This component
 * owns the sub-tab pills and the Diary list (search is local). "Add Diary Entry" and each card's
 * "Edit" swap the Diary list for `tohfa-farmer-diary-edit` in place; a saved draft is applied to the
 * in-memory list only. Plant & Crops, Livestock and Assets render their own self-contained tabs
 * (`tohfa-farmer-crops-tab`, `-livestock-tab`, `-assets-tab`), which manage their own edit views and
 * dialogs. The Diary filter button remains inert (no design yet).
 *
 * When the tab is integrated, the contract goes into docs/openapi.yaml, the route gets its own
 * `requirePermission` code in docs/rbac.json, and this component swaps the mock for a service call.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, computed, inject, signal } from '@angular/core';
import { FarmerAssetsTabComponent } from './farmer-assets-tab.component';
import { FarmerCropsTabComponent } from './farmer-crops-tab.component';
import { DIARY_CATEGORIES, DIARY_CROPS, DIARY_PLOTS } from './farmer-diary-edit.mock';
import { FarmerDiaryEditComponent, type FarmerDiaryEditDraft } from './farmer-diary-edit.component';
import { FarmerLivestockTabComponent } from './farmer-livestock-tab.component';
import { FARMER_DIARY_MOCK, type FarmerDiaryEntry } from './farmer-records.mock';
import { FARMER_RECORDS_STRINGS as S } from './farmer-records-tab.strings';

type SubTab = 'diary' | 'crops' | 'livestock' | 'assets';

const SUB_TABS: readonly { readonly id: SubTab; readonly label: string }[] = [
  { id: 'diary', label: S.SUB_TAB_DIARY },
  { id: 'crops', label: S.SUB_TAB_CROPS },
  { id: 'livestock', label: S.SUB_TAB_LIVESTOCK },
  { id: 'assets', label: S.SUB_TAB_ASSETS },
];

let nextRecordsId = 0;

@Component({
  selector: 'tohfa-farmer-records-tab',
  standalone: true,
  imports: [CommonModule, FarmerDiaryEditComponent, FarmerCropsTabComponent, FarmerLivestockTabComponent, FarmerAssetsTabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .page {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Page head ---------- */
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-16);
      }
      .head-text {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        column-gap: var(--space-12);
        align-items: center;
      }
      .head-icon {
        grid-row: 1 / span 2;
        font-size: var(--icon-dialog-close);
        color: var(--tohfa-amber);
      }
      .title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .subtitle {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .btn-add {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-10) var(--space-24);
        font-size: var(--fs-cell);
      }

      /* ---------- Sub-tabs (same recipe as the page tab pills, heavier label as in the design) ---------- */
      .sub-tab {
        min-height: calc(var(--space-18) * 2);
        padding: var(--space-8) var(--space-18);
        border-radius: var(--r-md);
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
      }
      .sub-tab:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      /* ---------- Search bar ---------- */
      .search {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: var(--space-16);
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
        pointer-events: none;
      }
      .search .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        padding-left: calc(var(--space-16) + var(--space-28));
        padding-right: calc(var(--space-16) + var(--space-28));
        border-radius: var(--r-md);
      }
      .filter-btn {
        position: absolute;
        right: var(--space-8);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-6);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .filter-btn .icon {
        font-size: var(--icon-nav);
      }
      .filter-btn:hover {
        color: var(--tohfa-ink);
      }
      .filter-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .count {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Diary entries ---------- */
      .entries {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .entry {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-16);
        padding: var(--space-24) var(--space-18);
      }
      .thumb {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-28) * 2);
        height: calc(var(--space-28) * 2);
        border: 1px solid var(--neutral-status-bd);
        border-radius: var(--r-sm);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
      }
      .thumb .icon {
        font-size: var(--icon-dialog-close);
      }
      .entry-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        min-width: 0;
      }
      .entry-title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .entry-title .tohfa-badge {
        border-color: transparent;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-6) var(--space-18);
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .meta li {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }
      .meta .icon {
        font-size: var(--icon-row-action);
      }
      .meta .muted {
        color: var(--tohfa-muted);
      }
      .added-by {
        margin: 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .btn-edit {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-8) var(--space-18);
        font-size: var(--fs-cell);
      }
      .btn-edit .icon {
        font-size: var(--icon-row-action);
      }

      /* ---------- Empty states ---------- */
      .empty {
        margin: 0;
        padding: var(--space-24);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
        text-align: center;
      }
      @media (max-width: 720px) {
        .head {
          flex-wrap: wrap;
        }
        .entry {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .entry .btn-edit {
          grid-column: 1 / -1;
          justify-self: end;
        }
      }
    `,
  ],
  template: `
    <div class="page">
      <div class="head">
        <div class="head-text">
          <span class="material-symbols-outlined head-icon" aria-hidden="true">assignment</span>
          <h2 class="title">{{ S.TITLE }}</h2>
          <p class="subtitle">{{ S.SUBTITLE }}</p>
        </div>
        <button
          *ngIf="subTab() === 'diary' && !editing()"
          type="button"
          class="tohfa-btn tohfa-btn-primary btn-add"
          (click)="openEditor(null)"
        >
          <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD_DIARY_ENTRY }}
        </button>
      </div>

      <div class="tohfa-tabs" role="tablist" [attr.aria-label]="S.SUB_TABS_LABEL" (keydown)="onSubTabKey($event)">
        <button
          *ngFor="let t of subTabs"
          type="button"
          role="tab"
          class="tohfa-tab-pill sub-tab"
          [id]="ids.tab + t.id"
          [class.active]="subTab() === t.id"
          [attr.aria-selected]="subTab() === t.id"
          [attr.aria-controls]="ids.panel + t.id"
          [tabindex]="subTab() === t.id ? 0 : -1"
          (click)="selectSubTab(t.id)"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Diary: editor (Add / Edit) -->
      <div
        *ngIf="subTab() === 'diary' && editing(); else diaryList"
        role="tabpanel"
        [id]="ids.panel + 'diary'"
        [attr.aria-labelledby]="ids.tab + 'diary'"
      >
        <tohfa-farmer-diary-edit [entry]="editEntry()" [farmerName]="farmerName" (back)="closeEditor()" (saved)="applyDraft($event)" />
      </div>

      <!-- Diary: list -->
      <ng-template #diaryList>
      <div
        *ngIf="subTab() === 'diary'; else otherTabs"
        class="page"
        role="tabpanel"
        [id]="ids.panel + 'diary'"
        [attr.aria-labelledby]="ids.tab + 'diary'"
      >
        <div class="search" role="search">
          <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
          <input
            type="search"
            class="tohfa-input"
            [attr.aria-label]="S.SEARCH_LABEL"
            [placeholder]="S.SEARCH_PLACEHOLDER"
            [value]="query()"
            (input)="query.set(valueOf($event))"
          />
          <!-- Inert: there is no design for the diary filters yet. -->
          <button type="button" class="filter-btn" [attr.aria-label]="S.FILTERS_LABEL">
            <span class="material-symbols-outlined icon" aria-hidden="true">tune</span>
          </button>
        </div>

        <p class="count" aria-live="polite">{{ S.entryCount(visibleEntries().length) }}</p>

        <ul class="entries" *ngIf="visibleEntries().length > 0; else noEntries">
          <li class="tohfa-card entry" *ngFor="let e of visibleEntries(); trackBy: trackEntry">
            <span class="thumb" role="img" [attr.aria-label]="S.PHOTO_ALT">
              <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
            </span>

            <div class="entry-body">
              <h3 class="entry-title">
                <span>{{ S.entryTitle(e.category, e.activity) }}</span>
                <span *ngIf="e.onBehalf; else ownBadge" class="tohfa-badge tohfa-badge-sm tohfa-badge-amber-tint">{{ S.BADGE_ON_BEHALF }}</span>
                <ng-template #ownBadge>
                  <span class="tohfa-badge tohfa-badge-sm tohfa-badge-success">{{ S.BADGE_FARMER_OWN }}</span>
                </ng-template>
              </h3>

              <ul class="meta" [attr.aria-label]="S.ENTRY_META_LABEL">
                <li>
                  <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>
                  <time [attr.datetime]="e.date">{{ e.date | date: 'd MMM y' }}</time>
                </li>
                <li>
                  <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ S.plot(e.plot.name, e.plot.areaAcres) }}
                </li>
                <li>
                  <span class="material-symbols-outlined icon" aria-hidden="true">schedule</span>{{ S.minutes(e.durationMinutes) }}
                </li>
                <li [class.muted]="!e.linkedCrop">
                  <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{
                    e.linkedCrop ? S.linkedCrop(e.linkedCrop) : S.NO_LINKED_CROP
                  }}
                </li>
              </ul>

              <ul class="meta">
                <li [class.muted]="!e.workforce">
                  <span class="material-symbols-outlined icon" aria-hidden="true">groups</span>{{
                    e.workforce ? S.workforce(e.workforce.workers, e.workforce.hoursEach) : S.NO_WORKFORCE
                  }}
                </li>
                <li [class.muted]="e.photoCount === 0">
                  <span class="material-symbols-outlined icon" aria-hidden="true">photo_library</span>{{ S.photos(e.photoCount) }}
                </li>
              </ul>

              <p class="added-by">{{ S.addedBy(e.addedBy, e.onBehalf) }}</p>
            </div>

            <button
              type="button"
              class="tohfa-btn tohfa-btn-outline-amber btn-edit"
              (click)="openEditor(e)" [attr.data-entry-id]="e.id"
              [attr.aria-label]="S.editEntryLabel(S.entryTitle(e.category, e.activity))"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT }}
            </button>
          </li>
        </ul>

        <ng-template #noEntries>
          <p class="tohfa-card empty">{{ entries().length === 0 ? S.NO_ENTRIES : S.NO_MATCHES }}</p>
        </ng-template>
      </div>

      </ng-template>

      <!-- Plant & Crops, Livestock, Assets: self-contained tabs. -->
      <ng-template #otherTabs>
        <div role="tabpanel" [id]="ids.panel + subTab()" [attr.aria-labelledby]="ids.tab + subTab()" [ngSwitch]="subTab()">
          <tohfa-farmer-crops-tab *ngSwitchCase="'crops'" [farmerName]="farmerName" [farmerCode]="farmerCode" />
          <tohfa-farmer-livestock-tab *ngSwitchCase="'livestock'" [farmerName]="farmerName" [farmerCode]="farmerCode" />
          <tohfa-farmer-assets-tab *ngSwitchCase="'assets'" [farmerName]="farmerName" [farmerCode]="farmerCode" />
        </div>
      </ng-template>
    </div>
  `,
})
export class FarmerRecordsTabComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The farmer whose records are shown. Not rendered by the Diary design; kept for parity with the other tabs and for the future API call. */
  @Input() farmerName = '';
  /** The farmer's TOHFA Farmer ID (shown in the header chip); passed through to the self-contained sub-tabs. */
  @Input() farmerCode = '';

  readonly S = S;
  readonly subTabs = SUB_TABS;

  /** Unique per instance: the page's own tab pills already use `tab-*` / `panel-*` ids. */
  readonly ids = (() => {
    const p = `farmer-records-${nextRecordsId++}`;
    return { tab: `${p}-tab-`, panel: `${p}-panel-` };
  })();

  readonly subTab = signal<SubTab>('diary');
  readonly query = signal('');
  readonly entries = signal<readonly FarmerDiaryEntry[]>(FARMER_DIARY_MOCK);
  /** True while the Add / Edit editor replaces the Diary list. */
  readonly editing = signal(false);
  /** The entry being edited; null in Add mode. */
  readonly editEntry = signal<FarmerDiaryEntry | null>(null);

  private readonly cdr = inject(ChangeDetectorRef);
  /** Which control opened the editor: an entry id, or null for the Add button. */
  private openerEntryId: string | null = null;
  /** Local id counter for entries added in this session (no API yet). */
  private nextEntryNo = 1;

  /** Client-side convenience filter over title, linked crop and plot. */
  readonly visibleEntries = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.entries();
    return this.entries().filter((e) =>
      [S.entryTitle(e.category, e.activity), e.linkedCrop ?? '', S.plot(e.plot.name, e.plot.areaAcres)].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  });

  selectSubTab(id: SubTab): void {
    this.subTab.set(id);
    this.editing.set(false);
  }

  openEditor(entry: FarmerDiaryEntry | null): void {
    this.openerEntryId = entry ? entry.id : null;
    this.editEntry.set(entry);
    this.editing.set(true);
  }

  closeEditor(): void {
    this.editing.set(false);
    this.editEntry.set(null);
    const id = this.openerEntryId;
    this.openerEntryId = null;
    // Render the list first (OnPush), then focus the control that opened the editor: its card's
    // Edit button, or the Add button when the entry was just added / the card is gone.
    this.cdr.detectChanges();
    const root = this.host.nativeElement;
    const target =
      (id && root.querySelector<HTMLElement>(`.btn-edit[data-entry-id="${CSS.escape(id)}"]`)) || root.querySelector<HTMLElement>('.btn-add');
    target?.focus();
  }

  /** Applies the editor's draft to the in-memory list only; there is no API yet. */
  applyDraft(draft: FarmerDiaryEditDraft): void {
    const category = DIARY_CATEGORIES.find((c) => c.key === draft.categoryKey);
    const activity = category?.activities.find((a) => a.key === draft.activityKey);
    const plot = DIARY_PLOTS.find((p) => p.id === draft.plotId);
    const crop = draft.linkedCropId ? DIARY_CROPS.find((c) => c.id === draft.linkedCropId) : undefined;
    const hours = draft.workers.map((w) => Number(w.hours)).filter((h) => Number.isFinite(h));
    const workforce =
      hours.length > 0
        ? { workers: hours.length, hoursEach: Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 100) / 100 }
        : null;

    const apply = (e: FarmerDiaryEntry): FarmerDiaryEntry => ({
      ...e,
      date: draft.date,
      category: category?.label ?? e.category,
      activity: activity?.label ?? e.activity,
      plot: plot ? { name: plot.name, areaAcres: plot.areaAcres } : e.plot,
      durationMinutes: draft.minutes,
      linkedCrop: crop?.name ?? null,
      workforce,
      photoCount: draft.photoCount,
    });

    if (draft.entryId) {
      this.entries.update((list) => list.map((e) => (e.id === draft.entryId ? apply(e) : e)));
    } else {
      const blank: FarmerDiaryEntry = {
        id: `diary-new-${this.nextEntryNo++}`,
        category: '',
        activity: '',
        date: draft.date,
        plot: { name: '', areaAcres: 0 },
        durationMinutes: draft.minutes,
        linkedCrop: null,
        workforce: null,
        photoCount: 0,
        addedBy: S.ADDED_BY_SELF,
        onBehalf: true,
      };
      this.entries.update((list) => [apply(blank), ...list]);
    }
    this.closeEditor();
  }

  trackEntry(_: number, e: FarmerDiaryEntry): string {
    return e.id;
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Roving tabindex with arrow / Home / End keys, as in the page's own tab pills. */
  onSubTabKey(event: KeyboardEvent): void {
    const index = this.subTabs.findIndex((t) => t.id === this.subTab());
    const last = this.subTabs.length - 1;
    let next: number;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    const id = this.subTabs[next]!.id;
    this.selectSubTab(id);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.tab}${id}`)?.focus());
  }
}
