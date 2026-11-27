/**
 * Farmers Management → Farmer Details → Farmer Records → Livestock sub-tab (SA-M3-S12…S12h).
 *
 * Renders the content below the parent's sub-tab pills: the livestock list (search, cards), the
 * five-step Edit Livestock Record stepper, the saved modal, the Log Production modal and the End
 * record modal.
 *
 * UI ONLY. The dataset is `farmer-livestock.mock.ts`; edits, logged production and ended records
 * live in local state and are lost on reload. "Register animal" and the filter button are
 * deliberately inert — there are no designs for them yet. The only admin livestock API today is the
 * read-only GET /admin/farmers/{farmerId}/livestock/animals (`admin.livestock.view_all`); when
 * this tab is integrated, the write routes go into docs/openapi.yaml first, each with its own
 * `requirePermission` code in docs/rbac.json and an audit_log row.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { FarmerLivestockEditComponent } from './farmer-livestock-edit.component';
import { FarmerLivestockEndDialogComponent } from './farmer-livestock-end-dialog.component';
import { FarmerLivestockLogDialogComponent, type LivestockLogEvent } from './farmer-livestock-log-dialog.component';
import { FarmerLivestockSavedDialogComponent } from './farmer-livestock-saved-dialog.component';
import {
  FARMER_LIVESTOCK_MOCK,
  PRODUCTION_TYPE_OPTIONS,
  type LivestockAnimal,
  type LivestockEndEvent,
  type LivestockRecordDraft,
} from './farmer-livestock.mock';
import {
  LIVESTOCK_SHARED_STYLES,
  animalTitle,
  formatLivestockDate,
  livestockTypeLabel,
  optionLabel,
  productionUnit,
} from './farmer-livestock-shared';
import { FARMER_LIVESTOCK_STRINGS as S } from './farmer-livestock-tab.strings';

type View = 'list' | 'edit';

/** Number of stepper sections a save covers (Basic, Feed, Production, Breeding, Health). */
const SECTION_COUNT = S.STEPS.length;

let nextLivestockId = 0;

@Component({
  selector: 'tohfa-farmer-livestock-tab',
  standalone: true,
  imports: [CommonModule, FarmerLivestockEditComponent, FarmerLivestockEndDialogComponent, FarmerLivestockLogDialogComponent, FarmerLivestockSavedDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    LIVESTOCK_SHARED_STYLES,
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

      /* ---------- Head ---------- */
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

      /* ---------- Search ---------- */
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

      /* ---------- Cards ---------- */
      .animals {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .animal {
        display: grid;
        grid-template-columns: auto minmax(0, 1.5fr) minmax(0, 0.9fr) minmax(0, 1.3fr) auto;
        align-items: center;
        gap: var(--space-16);
        padding: var(--space-18);
      }
      .animal.ended {
        background: var(--tohfa-page);
      }
      .ident {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        min-width: 0;
      }
      .animal-title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .animal-title:focus {
        outline: none;
      }
      .meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
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
      .facts {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        margin: 0;
        font-size: var(--fs-dense);
      }
      .facts dt {
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .facts dd {
        margin: 0;
        font-weight: var(--fw-xbold);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--space-8);
      }
      .actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-8) var(--space-14);
        border-radius: var(--tohfa-radius-button);
        font-size: var(--fs-dense);
      }
      .actions .icon {
        font-size: var(--icon-row-action);
      }
      .btn-end {
        border: 1px solid var(--err);
        background: var(--tohfa-surface);
        color: var(--err);
      }
      .btn-end:hover {
        background: var(--err-bg);
      }

      .empty {
        margin: 0;
        padding: var(--space-24);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
        text-align: center;
      }

      @media (max-width: 1100px) {
        .animal {
          grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
        }
        .ident {
          grid-column: 2 / -1;
        }
        .facts:first-of-type {
          grid-column: 2;
        }
        .actions {
          grid-column: 1 / -1;
        }
      }
      @media (max-width: 720px) {
        .head {
          flex-wrap: wrap;
        }
        .animal {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .ident,
        .facts,
        .facts:first-of-type {
          grid-column: 2;
        }
      }
    `,
  ],
  template: `
    <ng-container *ngIf="view() === 'list'; else editView">
      <div class="page">
        <div class="head">
          <div class="head-text">
            <span class="material-symbols-outlined head-icon" aria-hidden="true">pets</span>
            <h2 class="title" [id]="ids.heading" tabindex="-1">{{ S.TITLE }}</h2>
            <p class="subtitle">{{ S.SUBTITLE }}</p>
          </div>
          <!-- Inert: there is no design for the Register animal form yet. -->
          <button type="button" class="tohfa-btn tohfa-btn-primary btn-add">
            <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_REGISTER }}
          </button>
        </div>

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
          <!-- Inert: there is no design for the livestock filters yet. -->
          <button type="button" class="filter-btn" [attr.aria-label]="S.FILTERS_LABEL" [title]="S.FILTERS_LABEL">
            <span class="material-symbols-outlined icon" aria-hidden="true">tune</span>
          </button>
        </div>

        <p class="count" aria-live="polite">{{ S.count(visibleAnimals().length) }}</p>

        <ul class="animals" *ngIf="visibleAnimals().length > 0; else noAnimals">
          <li class="tohfa-card animal" *ngFor="let a of visibleAnimals(); trackBy: trackAnimal" [class.ended]="a.status === 'ENDED'">
            <span class="thumb" role="img" [attr.aria-label]="a.record.hasPhoto ? S.PHOTO_ALT : S.NO_PHOTO">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ a.record.hasPhoto ? 'image' : 'hide_image' }}</span>
            </span>

            <div class="ident">
              <h3 class="animal-title" [id]="ids.card + a.id" tabindex="-1">
                <span>{{ title(a) }}</span>
                <span
                  class="tohfa-badge tohfa-badge-sm status-pill"
                  [ngClass]="a.status === 'ACTIVE' ? 'tohfa-badge-success' : 'tohfa-badge-neutral'"
                  >{{ a.status === 'ACTIVE' ? S.STATUS_ACTIVE : S.STATUS_ENDED }}</span
                >
              </h3>
              <ul class="meta">
                <li><span class="material-symbols-outlined icon" aria-hidden="true">tag</span>{{ S.animalIdLine(a.animalId) }}</li>
                <li>
                  <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>
                  <time [attr.datetime]="a.record.acquiredOn">{{ S.acquiredLine(date(a.record.acquiredOn)) }}</time>
                </li>
              </ul>
            </div>

            <dl class="facts">
              <dt>{{ S.COL_BREED }}</dt>
              <dd>{{ a.record.breed || S.DASH }}</dd>
              <dt>{{ S.COL_PRODUCTION_LOGS }}</dt>
              <dd>{{ a.productionLogCount }}</dd>
            </dl>

            <dl class="facts">
              <dt>{{ S.COL_LATEST }}</dt>
              <dd>{{ latest(a) }}</dd>
              <dt>{{ S.COL_SOURCE }}</dt>
              <dd>{{ a.addedByFarmer ? S.SOURCE_FARMER : S.SOURCE_ADMIN }}</dd>
            </dl>

            <div class="actions" *ngIf="a.status === 'ACTIVE'">
              <button
                type="button"
                class="tohfa-btn tohfa-btn-outline-amber"
                [attr.aria-label]="S.actionLabel(S.BTN_LOG_PRODUCTION, title(a))"
                (click)="logTarget.set(a)"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">bar_chart</span>{{ S.BTN_LOG_PRODUCTION }}
              </button>
              <button
                type="button"
                class="tohfa-btn tohfa-btn-outline-amber"
                [attr.aria-label]="S.actionLabel(S.BTN_EDIT, title(a))"
                (click)="openEdit(a)"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT }}
              </button>
              <button
                type="button"
                class="tohfa-btn btn-end"
                [attr.aria-label]="S.actionLabel(S.BTN_END_RECORD, title(a))"
                (click)="endTarget.set(a)"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.BTN_END_RECORD }}
              </button>
            </div>
          </li>
        </ul>

        <ng-template #noAnimals>
          <p class="tohfa-card empty">{{ animals().length === 0 ? S.NO_ANIMALS : S.NO_MATCHES }}</p>
        </ng-template>
      </div>
    </ng-container>

    <ng-template #editView>
      <tohfa-farmer-livestock-edit
        *ngIf="editing() as a"
        [animal]="a"
        (cancelled)="closeEdit(a.id)"
        (saved)="onSaved(a.id, $event)"
      ></tohfa-farmer-livestock-edit>
    </ng-template>

    <tohfa-farmer-livestock-saved-dialog
      *ngIf="savedAnimal() as s"
      [animalTitle]="title(s)"
      [livestockId]="s.record.livestockId"
      [sections]="sectionCount"
      (viewRecord)="closeSaved(s.id)"
      (closed)="closeSaved(s.id)"
    ></tohfa-farmer-livestock-saved-dialog>

    <tohfa-farmer-livestock-log-dialog
      *ngIf="logTarget() as l"
      [animalLabel]="logLabel(l)"
      [livestockType]="l.record.livestockType"
      [farmerName]="farmerName"
      [farmerCode]="farmerCode"
      (dismissed)="logTarget.set(null)"
      (confirmed)="onLogged(l.id, $event)"
    ></tohfa-farmer-livestock-log-dialog>

    <tohfa-farmer-livestock-end-dialog
      *ngIf="endTarget() as e"
      [animalLabel]="shortLabel(e)"
      [farmerName]="farmerName"
      [farmerCode]="farmerCode"
      (dismissed)="endTarget.set(null)"
      (confirmed)="onEnded(e.id, $event)"
    ></tohfa-farmer-livestock-end-dialog>
  `,
})
export class FarmerLivestockTabComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly locale = inject(LOCALE_ID);

  /** Shown in the End record modal's "Editing for …" banner. */
  @Input() farmerName = '';
  /** Farmer code, e.g. "FMR-00124", shown beside the name in the same banner. */
  @Input() farmerCode = '';

  readonly S = S;
  readonly sectionCount = SECTION_COUNT;

  private readonly uid = nextLivestockId++;
  readonly ids = { heading: `lv-${this.uid}-heading`, card: `lv-${this.uid}-card-` };

  readonly view = signal<View>('list');
  readonly query = signal('');
  readonly animals = signal<readonly LivestockAnimal[]>(FARMER_LIVESTOCK_MOCK);
  readonly editing = signal<LivestockAnimal | null>(null);
  readonly savedAnimal = signal<LivestockAnimal | null>(null);
  readonly endTarget = signal<LivestockAnimal | null>(null);
  readonly logTarget = signal<LivestockAnimal | null>(null);

  /** Client-side convenience filter over the title, animal ID, tag and breed. */
  readonly visibleAnimals = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.animals();
    return this.animals().filter((a) =>
      [this.title(a), a.animalId, a.record.tag, a.record.breed].some((field) => field.toLowerCase().includes(q)),
    );
  });

  trackAnimal(_: number, a: LivestockAnimal): string {
    return a.id;
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  title(a: LivestockAnimal): string {
    return animalTitle(a.record);
  }

  shortLabel(a: LivestockAnimal): string {
    return S.animalShort(livestockTypeLabel(a.record.livestockType), a.record.livestockId);
  }

  date(iso: string): string {
    return iso ? formatLivestockDate(iso, this.locale) : S.DASH;
  }

  /** "12 litres of milk, 27 Oct 2026" */
  latest(a: LivestockAnimal): string {
    const l = a.latest;
    if (!l) return S.NO_PRODUCTION;
    const amount = S.productionAmount(String(l.quantity), productionUnit(l.product), optionLabel(PRODUCTION_TYPE_OPTIONS, l.product));
    return S.latestLine(amount, this.date(l.date));
  }

  openEdit(a: LivestockAnimal): void {
    this.editing.set(a);
    this.view.set('edit');
  }

  closeEdit(id: string): void {
    this.editing.set(null);
    this.view.set('list');
    this.focusCard(id);
  }

  onSaved(id: string, record: LivestockRecordDraft): void {
    const updated = this.replace(id, (a) => ({ ...a, record }));
    this.savedAnimal.set(updated);
  }

  closeSaved(id: string): void {
    this.savedAnimal.set(null);
    this.closeEdit(id);
  }

  logLabel(a: LivestockAnimal): string {
    return S.logAnimal(livestockTypeLabel(a.record.livestockType), a.record.livestockId, a.record.name.trim());
  }

  /** Local update only; the dialog returns focus to the Log Production button that opened it. */
  onLogged(id: string, entry: LivestockLogEvent): void {
    this.replace(id, (a) => ({
      ...a,
      productionLogCount: a.productionLogCount + 1,
      // The dialog only emits /^[1-9]\d{0,9}$/, so this is an exact integer, never a float parse.
      latest: { product: entry.product, quantity: Number(entry.quantity), date: entry.date },
    }));
    this.logTarget.set(null);
  }

  onEnded(id: string, event: LivestockEndEvent): void {
    this.replace(id, (a) => ({ ...a, status: 'ENDED', ended: event }));
    this.endTarget.set(null);
    // The End Record button that opened the modal is gone once the animal is ended.
    this.focusCard(id);
  }

  private replace(id: string, change: (a: LivestockAnimal) => LivestockAnimal): LivestockAnimal | null {
    let result: LivestockAnimal | null = null;
    this.animals.update((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        result = change(a);
        return result;
      }),
    );
    return result;
  }

  /** Runs after the dialog's own focus return, so the card heading wins. */
  private focusCard(id: string): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.card}${id}`)?.focus());
  }
}
