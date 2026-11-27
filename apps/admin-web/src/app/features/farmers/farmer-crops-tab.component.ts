/**
 * Farmer Records → Plant & Crops sub-tab content (everything below the sub-tab pills, which the
 * Farmer Records tab draws).
 *
 * UI ONLY. The admin API has no write endpoints for a farmer's crops, so the list renders the
 * placeholder dataset in `farmer-crops.mock.ts` and every action changes local state only:
 *   - Edit opens the Edit Crop page in place of the list (back arrow / Cancel / Save return to it).
 *   - Update Stage opens the Update Crop Growth Stage dialog and advances the crop's stage.
 *   - Record Harvest opens the Record Harvest dialog and closes the crop as Harvested.
 * "Plant a crop" and the filter button are deliberately inert — there are no designs for them yet.
 * Search filters locally, for convenience only.
 *
 * When the tab is integrated, the contracts go into docs/openapi.yaml, every route gets its own
 * `requirePermission` code in docs/rbac.json, and this component swaps the mock for service calls.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { FarmerCropsEditComponent, type EditCropResult } from './farmer-crops-edit.component';
import { FarmerCropsHarvestDialogComponent, type HarvestResult } from './farmer-crops-harvest-dialog.component';
import { CROP_STATUS_META, addDays, formatCropDay, stageSegments, type StageSegmentState } from './farmer-crops-shared';
import { FarmerCropsStageDialogComponent, type StageUpdateResult } from './farmer-crops-stage-dialog.component';
import { CROP_GRADE_OPTIONS, CROP_STAGES, FARMER_CROPS_MOCK, type FarmerCropRecordMock } from './farmer-crops.mock';
import { FARMER_CROPS_STRINGS as S } from './farmer-crops-tab.strings';

type DialogState = { kind: 'harvest' | 'stage'; cropId: string } | null;

let nextCropsId = 0;

@Component({
  selector: 'tohfa-farmer-crops-tab',
  standalone: true,
  imports: [CommonModule, FarmerCropsEditComponent, FarmerCropsHarvestDialogComponent, FarmerCropsStageDialogComponent],
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

      /* ---------- Head ---------- */
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
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
      .tools {
        display: flex;
        flex: 1;
        justify-content: flex-end;
        align-items: center;
        gap: var(--space-12);
      }
      .search {
        position: relative;
        display: flex;
        flex: 0 1 calc(var(--space-32) * 12);
        align-items: center;
        min-width: 0;
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
        border-radius: var(--r-md);
      }
      .filter-btn {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        min-width: var(--tohfa-min-touch-target);
        min-height: var(--tohfa-min-touch-target);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .filter-btn:hover {
        color: var(--tohfa-ink);
      }
      .filter-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .btn-add {
        flex: none;
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .count {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Crop cards ---------- */
      .crops {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .crop {
        padding: var(--space-16) var(--space-18);
      }
      .row {
        display: grid;
        grid-template-columns: auto minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-16);
      }
      .thumb {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-32) * 2);
        height: calc(var(--space-32) * 2);
        border: 1px solid var(--neutral-status-bd);
        border-radius: var(--r-sm);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
      }
      .thumb .icon {
        font-size: var(--icon-dialog-close);
      }
      .ident {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        min-width: 0;
      }
      .name {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .name .tohfa-badge {
        border-color: transparent;
      }
      .line {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .sep {
        margin: 0 var(--space-6);
      }
      .col-label {
        margin: 0 0 var(--space-4);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .col-value {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .bar {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: var(--space-4);
        max-width: calc(var(--space-32) * 11);
      }
      .seg {
        height: var(--space-6);
        border-radius: var(--r-pill);
        background: var(--neutral-status-bg);
      }
      .seg.done {
        background: var(--ok);
      }
      .seg.current {
        background: var(--tohfa-amber);
      }
      .muted-cap {
        margin: 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .harvested-status {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        color: var(--ok);
      }
      .chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: var(--tohfa-min-touch-target);
        min-height: var(--tohfa-min-touch-target);
        padding: 0;
        border: none;
        border-radius: var(--r-sm);
        background: none;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .chevron:hover {
        color: var(--tohfa-ink);
      }
      .chevron:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .chevron .icon {
        font-size: var(--icon-chevron);
      }

      /* ---------- Expanded detail ---------- */
      .detail {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-14);
        margin-top: var(--space-14);
        padding-top: var(--space-14);
        border-top: var(--border-divider);
      }
      .facts {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin: 0;
        font-size: var(--fs-dense);
      }
      .facts div {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
      }
      .facts dt {
        font-weight: var(--fw-bold);
      }
      .facts dd {
        margin: 0 0 0 var(--space-4);
        color: var(--tohfa-slate);
      }
      /* Visual "|" between the pairs on one line; dl groups may only hold dt / dd. */
      .facts dd:not(:last-child)::after {
        content: '|';
        margin: 0 var(--space-6);
        color: var(--tohfa-slate);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
      }
      .actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .btn-harvest {
        padding: var(--space-8) var(--space-18);
        border: none;
        background: var(--ok);
        color: var(--tohfa-neutral-white);
        font-size: var(--fs-dense);
      }
      .btn-harvest:hover {
        opacity: 0.9;
      }
      .closed {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-muted);
      }

      .empty {
        margin: 0;
        padding: var(--space-24);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
        text-align: center;
      }

      @media (max-width: 980px) {
        .row {
          grid-template-columns: auto minmax(0, 1fr) auto;
        }
        .stage,
        .right {
          grid-column: 2 / 3;
        }
        .chevron {
          grid-row: 1;
          grid-column: 3;
        }
      }
      @media (max-width: 720px) {
        .tools {
          flex-wrap: wrap;
          justify-content: flex-start;
        }
        .search {
          flex-basis: 100%;
        }
      }
    `,
  ],
  template: `
    <tohfa-farmer-crops-edit
      *ngIf="editingCrop() as ec; else listView"
      [crop]="ec"
      (cancelled)="closeEdit()"
      (saved)="saveEdit($event)"
    ></tohfa-farmer-crops-edit>

    <ng-template #listView>
      <div class="page">
        <div class="head">
          <div class="head-text">
            <span class="material-symbols-outlined head-icon" aria-hidden="true">eco</span>
            <h2 class="title">{{ S.TITLE }}</h2>
            <p class="subtitle">{{ S.SUBTITLE }}</p>
          </div>
          <div class="tools">
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
            </div>
            <!-- Inert: there is no design for the crop filters yet. -->
            <button type="button" class="filter-btn" [attr.aria-label]="S.FILTERS_LABEL" [title]="S.FILTERS_LABEL">
              <span class="material-symbols-outlined icon" aria-hidden="true">tune</span>
            </button>
            <!-- Inert: there is no design for the Plant a crop form yet. -->
            <button type="button" class="tohfa-btn tohfa-btn-primary-l btn-add">
              <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_PLANT_CROP }}
            </button>
          </div>
        </div>

        <p class="count" aria-live="polite">{{ S.cropCount(visibleCrops().length) }}</p>

        <ul class="crops" *ngIf="visibleCrops().length > 0; else noCrops">
          <li class="tohfa-card crop" *ngFor="let c of visibleCrops(); trackBy: trackCrop">
            <ng-container *ngIf="{ open: expandedId() === c.id, harvested: c.status === 'HARVESTED' } as v">
              <div class="row">
                <span class="thumb" role="img" [attr.aria-label]="S.PHOTO_ALT">
                  <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
                </span>

                <div class="ident">
                  <h3 class="name">
                    <span>{{ c.name }}</span>
                    <span class="tohfa-badge tohfa-badge-sm" [ngClass]="statusMeta[c.status].badge">{{ S.STATUS_LABEL[c.status] }}</span>
                  </h3>
                  <ng-container *ngIf="v.open && !v.harvested; else collapsedMeta">
                    <p class="line">{{ S.cropIdLine(c.displayId) }}<span class="sep" aria-hidden="true">|</span>{{ c.plot }}</p>
                    <p class="line">{{ S.acres(c.areaAcres) }}</p>
                  </ng-container>
                  <ng-template #collapsedMeta>
                    <p class="line">{{ c.zone }}<span class="sep" aria-hidden="true">|</span>{{ c.plot }}</p>
                    <p class="line">{{ S.planted(day(c.plantedOn)) }}</p>
                  </ng-template>
                </div>

                <div class="stage">
                  <ng-container *ngIf="v.harvested; else growth">
                    <p class="col-label">{{ S.HARVESTED_ON }}</p>
                    <p class="col-value">{{ c.harvestedOn ? day(c.harvestedOn) : S.NO_DATE }}</p>
                    <p class="line" *ngIf="c.yieldKg !== null">{{ S.yieldKg(c.yieldKg) }}</p>
                  </ng-container>
                  <ng-template #growth>
                    <p class="col-label">{{ S.GROWTH_STAGE }}</p>
                    <p class="col-value">{{ v.open ? stageName(c) : stageSummary(c) }}</p>
                    <div class="bar" role="img" [attr.aria-label]="S.segmentsLabel(reached(c), stages.length)">
                      <span class="seg" *ngFor="let s of segments(c)" [ngClass]="s"></span>
                    </div>
                  </ng-template>
                </div>

                <div class="right">
                  <ng-container *ngIf="v.harvested; else expected">
                    <p class="line">{{ S.gradeLine(gradeShort(c)) }}</p>
                    <p class="harvested-status">
                      <span class="material-symbols-outlined icon" aria-hidden="true">check_circle</span>{{ S.STATUS_HARVESTED }}
                    </p>
                  </ng-container>
                  <ng-template #expected>
                    <ng-container *ngIf="v.open; else expectedCollapsed">
                      <p class="line">{{ S.planted(day(c.plantedOn)) }}</p>
                      <p class="line">{{ c.expectedHarvestOn ? day(c.expectedHarvestOn) : S.NO_DATE }}</p>
                    </ng-container>
                    <ng-template #expectedCollapsed>
                      <p class="col-label">{{ S.EXPECTED_HARVEST }}</p>
                      <p class="col-value">{{ c.expectedHarvestOn ? day(c.expectedHarvestOn) : S.NO_DATE }}</p>
                      <p class="muted-cap" *ngIf="c.expectedHarvestOn">{{ S.CALCULATED }}</p>
                    </ng-template>
                  </ng-template>
                </div>

                <button
                  type="button"
                  class="chevron"
                  [attr.aria-expanded]="v.open"
                  [attr.aria-controls]="ids.detail + c.id"
                  [attr.aria-label]="S.expandLabel(c.name, v.open)"
                  (click)="toggle(c.id)"
                >
                  <span class="material-symbols-outlined icon" aria-hidden="true">{{ v.open ? 'expand_less' : 'expand_more' }}</span>
                </button>
              </div>

              <div class="detail" *ngIf="v.open" [id]="ids.detail + c.id">
                <dl class="facts" [attr.aria-label]="S.CROP_DETAILS_LABEL">
                  <div>
                    <dt>{{ S.SEED_SOURCE }}</dt>
                    <dd>{{ c.seedSource }}</dd>
                    <dt>{{ S.GRADE }}</dt>
                    <dd>{{ gradeShort(c) }}</dd>
                  </div>
                  <div>
                    <dt>{{ S.HARVEST }}</dt>
                    <dd>{{ c.harvestedOn && c.yieldKg !== null ? S.harvestedSummary(c.yieldKg, day(c.harvestedOn)) : S.NOT_HARVESTED }}</dd>
                    <dt>{{ S.SOURCE }}</dt>
                    <dd>{{ c.addedBy }}</dd>
                  </div>
                </dl>

                <div class="actions" *ngIf="!v.harvested; else closedNote">
                  <button
                    type="button"
                    class="tohfa-btn tohfa-btn-outline-amber"
                    [id]="ids.edit + c.id"
                    [attr.aria-label]="S.editLabel(c.name)"
                    (click)="openEdit(c.id)"
                  >
                    <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT }}
                  </button>
                  <button
                    type="button"
                    class="tohfa-btn tohfa-btn-outline-amber"
                    [attr.aria-label]="S.updateStageLabel(c.name)"
                    (click)="dialog.set({ kind: 'stage', cropId: c.id })"
                  >
                    <span class="material-symbols-outlined icon" aria-hidden="true">sync</span>{{ S.BTN_UPDATE_STAGE }}
                  </button>
                  <button
                    type="button"
                    class="tohfa-btn btn-harvest"
                    [attr.aria-label]="S.recordHarvestLabel(c.name)"
                    (click)="dialog.set({ kind: 'harvest', cropId: c.id })"
                  >
                    <span class="material-symbols-outlined icon" aria-hidden="true">agriculture</span>{{ S.BTN_RECORD_HARVEST }}
                  </button>
                </div>
                <ng-template #closedNote>
                  <p class="closed">{{ S.HARVESTED_CLOSED }}</p>
                </ng-template>
              </div>
            </ng-container>
          </li>
        </ul>

        <ng-template #noCrops>
          <p class="tohfa-card empty">{{ crops().length === 0 ? S.NO_CROPS : S.NO_MATCHES }}</p>
        </ng-template>
      </div>
    </ng-template>

    <tohfa-farmer-crops-harvest-dialog
      *ngIf="dialogCrop('harvest') as hc"
      [crop]="hc"
      [farmerName]="farmerName"
      [farmerCode]="farmerCode"
      (dismissed)="dialog.set(null)"
      (confirmed)="recordHarvest(hc.id, $event)"
    ></tohfa-farmer-crops-harvest-dialog>

    <tohfa-farmer-crops-stage-dialog
      *ngIf="dialogCrop('stage') as sc"
      [crop]="sc"
      (dismissed)="dialog.set(null)"
      (confirmed)="updateStage(sc.id, $event)"
    ></tohfa-farmer-crops-stage-dialog>
  `,
})
export class FarmerCropsTabComponent {
  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Shown in the Record Harvest dialog's "Editing for …" banner. */
  @Input() farmerName = '';
  /** Farmer code (e.g. FMR-00124), shown next to the name in the same banner. */
  @Input() farmerCode = '';

  readonly S = S;
  readonly stages = CROP_STAGES;
  readonly statusMeta = CROP_STATUS_META;

  readonly ids = (() => {
    const p = `farmer-crops-${nextCropsId++}`;
    return { detail: `${p}-detail-`, edit: `${p}-edit-` };
  })();

  readonly crops = signal<readonly FarmerCropRecordMock[]>(FARMER_CROPS_MOCK);
  readonly query = signal('');
  /** One card open at a time, as in the design (which opens Carrot - Nantes). */
  readonly expandedId = signal<string | null>('crop-2');
  readonly editingId = signal<string | null>(null);
  readonly dialog = signal<DialogState>(null);

  readonly editingCrop = computed(() => this.crops().find((c) => c.id === this.editingId()) ?? null);

  /** Client-side convenience filter over name, zone, plot, crop ID, status and stage. */
  readonly visibleCrops = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.crops();
    return this.crops().filter((c) =>
      [c.name, c.zone, c.plot, c.displayId, S.STATUS_LABEL[c.status], this.stageName(c)].some((f) => f.toLowerCase().includes(q)),
    );
  });

  trackCrop(_: number, c: FarmerCropRecordMock): string {
    return c.id;
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  day(iso: string): string {
    return formatCropDay(iso, this.locale);
  }

  stageName(c: FarmerCropRecordMock): string {
    const def = c.stageIndex === null ? undefined : CROP_STAGES[c.stageIndex];
    return def ? S.STAGE_LABEL[def.code] : S.NO_STAGE;
  }

  /** "5 of 7 – Flowering" */
  stageSummary(c: FarmerCropRecordMock): string {
    return c.stageIndex === null ? S.NO_STAGE : S.stageOf(c.stageIndex + 1, CROP_STAGES.length, this.stageName(c));
  }

  segments(c: FarmerCropRecordMock): StageSegmentState[] {
    return stageSegments(c);
  }

  reached(c: FarmerCropRecordMock): number {
    return c.stageIndex === null ? 0 : c.stageIndex + 1;
  }

  gradeShort(c: FarmerCropRecordMock): string {
    return CROP_GRADE_OPTIONS.find((g) => g.value === c.grade)?.short ?? S.NO_DATE;
  }

  toggle(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  dialogCrop(kind: 'harvest' | 'stage'): FarmerCropRecordMock | null {
    const d = this.dialog();
    if (!d || d.kind !== kind) return null;
    return this.crops().find((c) => c.id === d.cropId) ?? null;
  }

  openEdit(id: string): void {
    this.editingId.set(id);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('tohfa-farmer-crops-edit [data-autofocus]')?.focus());
  }

  closeEdit(): void {
    const id = this.editingId();
    this.editingId.set(null);
    // Return focus to the Edit button the page was opened from.
    if (id) setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.edit}${id}`)?.focus());
  }

  saveEdit(result: EditCropResult): void {
    const id = this.editingId();
    if (id) this.patch(id, (c) => ({ ...c, name: result.name, master: result.master }));
    this.closeEdit();
  }

  recordHarvest(id: string, r: HarvestResult): void {
    const last = CROP_STAGES.length - 1;
    this.patch(id, (c) => {
      const stageDates = [...c.stageDates];
      stageDates[last] = stageDates[last] ?? r.harvestedOn;
      return {
        ...c,
        status: 'HARVESTED',
        stageIndex: last,
        stageDates,
        harvestedOn: r.harvestedOn,
        yieldKg: r.yieldKg,
        grade: r.grade ?? c.grade,
        harvestSource: r.source,
        harvestNotes: r.notes,
      };
    });
    this.dialog.set(null);
  }

  /**
   * Advances the stage. The expected-harvest estimate is re-derived from the placeholder data only:
   * the new stage's completion date plus the crop's typical days for the stages before Harvest.
   */
  updateStage(id: string, r: StageUpdateResult): void {
    const last = CROP_STAGES.length - 1;
    this.patch(id, (c) => {
      const stageDates = [...c.stageDates];
      stageDates[r.stageIndex] = r.stageDate;
      const remaining = c.master.stageDays.slice(r.stageIndex + 1, last).reduce((sum, d) => sum + d, 0);
      const expectedHarvestOn = r.stageIndex === last ? r.stageDate : addDays(r.completionDate, remaining);
      return { ...c, stageIndex: r.stageIndex, stageDates, expectedHarvestOn };
    });
    this.dialog.set(null);
  }

  private patch(id: string, fn: (c: FarmerCropRecordMock) => FarmerCropRecordMock): void {
    this.crops.update((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  }
}
