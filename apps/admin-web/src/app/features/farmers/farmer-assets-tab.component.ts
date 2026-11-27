/**
 * Farmers Management → Farmer Details → Farmer Records → Assets (SA-M3-S13).
 *
 * UI ONLY. Renders the placeholder dataset in `farmer-assets.mock.ts`; search filters it locally, and
 * the Record Service / Edit / Retire modals change local state only. The sub-tab pills (Diary, Plant &
 * Crops, Livestock, Assets) belong to the parent Farmer Records tab, not to this component.
 * "Register Asset" and the filter button are deliberately inert — there is no design for either yet.
 *
 * Overdue is computed against the fixed `ASSETS_REFERENCE_DATE`, not the real clock, so the
 * placeholder renders as designed. When the tab is integrated the API's computed `status` replaces it,
 * the contract goes into docs/openapi.yaml, and each action gets its own `requirePermission` code in
 * docs/rbac.json.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { FarmerAssetsEditDialogComponent, type AssetEditResult } from './farmer-assets-edit-dialog.component';
import { FarmerAssetsRetireDialogComponent, type AssetRetireResult } from './farmer-assets-retire-dialog.component';
import { FarmerAssetsServiceDialogComponent, type AssetServiceResult } from './farmer-assets-service-dialog.component';
import { formatIsoDate, toAssetView, type AssetView } from './farmer-assets-shared';
import {
  ASSETS_DEFAULT_FARMER,
  ASSETS_REFERENCE_DATE,
  FARMER_ASSETS_MOCK,
  type FarmerAssetMock,
} from './farmer-assets.mock';
import { FARMER_ASSETS_STRINGS as S } from './farmer-assets-tab.strings';

type DialogKind = 'service' | 'edit' | 'retire';

let nextAssetsId = 0;

@Component({
  selector: 'tohfa-farmer-assets-tab',
  standalone: true,
  imports: [CommonModule, FarmerAssetsServiceDialogComponent, FarmerAssetsEditDialogComponent, FarmerAssetsRetireDialogComponent],
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

      /* ---------- Search bar (same recipe as the Diary sub-tab) ---------- */
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

      /* ---------- Asset cards ---------- */
      .assets {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .asset {
        display: grid;
        grid-template-columns: auto minmax(0, 1.3fr) minmax(0, 2fr) minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-16);
        padding: var(--space-16) var(--space-16);
      }
      .thumb {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-28) * 3);
        height: calc(var(--space-32) * 2);
        border: 1px solid var(--neutral-status-bd);
        border-radius: var(--r-md);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
      }
      .thumb .icon {
        font-size: var(--icon-dialog-hero);
      }
      .name {
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .code {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6);
        margin-top: var(--space-10);
      }
      .pills .tohfa-badge {
        border-color: transparent;
      }
      .dates {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14) var(--space-16);
        margin: 0;
      }
      .kv dt {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .kv dt .icon {
        font-size: var(--icon-row-action);
      }
      .kv dd {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .kv dd.overdue {
        color: var(--err);
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
        min-width: calc(var(--space-32) * 4);
      }
      .actions .tohfa-btn {
        min-height: calc(var(--space-16) * 2);
        padding: var(--space-6) var(--space-14);
        border-radius: var(--r-sm);
        font-size: var(--fs-dense);
      }
      .actions .icon {
        font-size: var(--icon-row-action);
      }
      .btn-outline-danger {
        border: 1px solid var(--err);
        background: transparent;
        color: var(--err);
      }
      .btn-outline-danger:hover:not(:disabled) {
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
        .asset {
          grid-template-columns: auto minmax(0, 1fr) auto;
        }
        .dates,
        .source {
          grid-column: 2 / span 1;
        }
        .actions {
          grid-column: 3;
          grid-row: 1 / span 3;
        }
      }
      @media (max-width: 640px) {
        .head {
          flex-wrap: wrap;
        }
        .asset {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .dates,
        .source,
        .actions {
          grid-column: 1 / -1;
          grid-row: auto;
        }
      }
    `,
  ],
  template: `
    <div class="page">
      <div class="head">
        <div class="head-text">
          <span class="material-symbols-outlined head-icon" aria-hidden="true">handyman</span>
          <h2 class="title">{{ S.TITLE }}</h2>
          <p class="subtitle">{{ S.SUBTITLE }}</p>
        </div>
        <!-- Inert: there is no design for the Register Asset form yet. -->
        <button type="button" class="tohfa-btn tohfa-btn-primary btn-add" [title]="S.REGISTER_NOT_AVAILABLE">
          <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_REGISTER }}
        </button>
      </div>

      <div class="search" role="search">
        <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
        <input
          type="search"
          class="tohfa-input"
          [id]="ids.search"
          [attr.aria-label]="S.SEARCH_LABEL"
          [placeholder]="S.SEARCH_PLACEHOLDER"
          [value]="query()"
          (input)="query.set(valueOf($event))"
        />
        <!-- Inert: there is no design for the asset filters yet. -->
        <button type="button" class="filter-btn" [attr.aria-label]="S.FILTERS_LABEL">
          <span class="material-symbols-outlined icon" aria-hidden="true">tune</span>
        </button>
      </div>

      <p class="count" aria-live="polite">{{ S.assetCount(visible().length) }}</p>

      <ul class="assets" *ngIf="visible().length > 0; else noAssets">
        <li class="tohfa-card asset" *ngFor="let v of visible(); trackBy: trackAsset">
          <span class="thumb" role="img" [attr.aria-label]="S.ASSET_PHOTO">
            <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
          </span>

          <div>
            <h3 class="name">{{ v.asset.name }}</h3>
            <p class="code">{{ S.codeLine(v.asset.code, v.categoryLabel) }}</p>
            <div class="pills">
              <span class="tohfa-badge tohfa-badge-success">{{ S.PILL_ACTIVE }}</span>
              <span class="tohfa-badge tohfa-badge-danger" *ngIf="v.overdue">{{ S.PILL_OVERDUE }}</span>
            </div>
          </div>

          <dl class="dates" [attr.aria-label]="S.ASSET_DETAILS">
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span>{{ S.PURCHASED }}</dt>
              <dd><time [attr.datetime]="v.asset.purchasedOn">{{ date(v.asset.purchasedOn) }}</time></dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span>{{ S.LAST_SERVICE }}</dt>
              <dd>
                <time *ngIf="v.asset.lastServicedOn as d; else notServiced" [attr.datetime]="d">{{ date(d) }}</time>
                <ng-template #notServiced>{{ S.NOT_SERVICED }}</ng-template>
              </dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">autorenew</span>{{ S.SERVICE_EVERY }}</dt>
              <dd>{{ S.days(v.asset.serviceIntervalDays) }}</dd>
            </div>
            <div class="kv">
              <dt><span class="material-symbols-outlined icon" aria-hidden="true">event_upcoming</span>{{ S.NEXT_SERVICE_DUE }}</dt>
              <dd [class.overdue]="v.overdue">
                <time [attr.datetime]="v.nextServiceDueOn">{{ date(v.nextServiceDueOn) }}</time>
              </dd>
            </div>
          </dl>

          <dl class="source kv">
            <dt><span class="material-symbols-outlined icon" aria-hidden="true">person</span>{{ S.SOURCE }}</dt>
            <dd>{{ v.sourceLabel }}</dd>
          </dl>

          <div class="actions">
            <button
              type="button"
              class="tohfa-btn tohfa-btn-outline-amber"
              [attr.aria-label]="S.recordServiceFor(v.asset.name)"
              (click)="open('service', v.asset.code)"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">build</span>{{ S.BTN_RECORD_SERVICE }}
            </button>
            <button
              type="button"
              class="tohfa-btn tohfa-btn-outline-amber"
              [attr.aria-label]="S.editFor(v.asset.name)"
              (click)="open('edit', v.asset.code)"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT }}
            </button>
            <button
              type="button"
              class="tohfa-btn btn-outline-danger"
              [attr.aria-label]="S.retireFor(v.asset.name)"
              (click)="open('retire', v.asset.code)"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.BTN_RETIRE }}
            </button>
          </div>
        </li>
      </ul>

      <ng-template #noAssets>
        <p class="tohfa-card empty">{{ assets().length === 0 ? S.NO_ASSETS : S.NO_MATCHES }}</p>
      </ng-template>
    </div>

    <ng-container *ngIf="dialogView() as d">
      <tohfa-farmer-assets-service-dialog
        *ngIf="d.kind === 'service'"
        [view]="d.view"
        [farmerName]="bannerName()"
        [farmerCode]="bannerCode()"
        [referenceDate]="referenceDate"
        (dismissed)="close()"
        (confirmed)="onService($event)"
      />
      <tohfa-farmer-assets-edit-dialog
        *ngIf="d.kind === 'edit'"
        [view]="d.view"
        [farmerName]="bannerName()"
        [farmerCode]="bannerCode()"
        (dismissed)="close()"
        (confirmed)="onEdit($event)"
      />
      <tohfa-farmer-assets-retire-dialog
        *ngIf="d.kind === 'retire'"
        [view]="d.view"
        [farmerName]="bannerName()"
        [farmerCode]="bannerCode()"
        (dismissed)="close()"
        (confirmed)="onRetire($event)"
      />
    </ng-container>
  `,
})
export class FarmerAssetsTabComponent {
  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Shown in the modal banners; falls back to the design's farmer when not given. */
  @Input() set farmerName(value: string | null | undefined) {
    this.name.set(value ?? '');
  }
  @Input() set farmerCode(value: string | null | undefined) {
    this.code.set(value ?? '');
  }

  readonly S = S;
  readonly referenceDate = ASSETS_REFERENCE_DATE;
  readonly ids = { search: `farmer-assets-${nextAssetsId++}-search` };

  private readonly name = signal('');
  private readonly code = signal('');
  readonly bannerName = computed(() => this.name() || ASSETS_DEFAULT_FARMER.name);
  /** Only fall back to the design's code when the name fell back too, so a real name never pairs with a fake code. */
  readonly bannerCode = computed(() => (this.name() ? this.code() : this.code() || ASSETS_DEFAULT_FARMER.code));

  readonly query = signal('');
  readonly assets = signal<readonly FarmerAssetMock[]>(FARMER_ASSETS_MOCK);
  private readonly dialog = signal<{ kind: DialogKind; code: string } | null>(null);

  readonly views = computed(() => this.assets().map((a) => toAssetView(a, this.referenceDate)));

  /** Client-side convenience filter over name, asset ID, asset type and category. */
  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.views();
    return this.views().filter((v) =>
      [v.asset.name, v.asset.code, v.typeLabel, v.categoryLabel].some((f) => f.toLowerCase().includes(q)),
    );
  });

  readonly dialogView = computed(() => {
    const d = this.dialog();
    if (!d) return null;
    const view = this.views().find((v) => v.asset.code === d.code);
    return view ? { kind: d.kind, view } : null;
  });

  date(iso: string): string {
    return formatIsoDate(iso, this.locale);
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  trackAsset(_: number, v: AssetView): string {
    return v.asset.code;
  }

  open(kind: DialogKind, code: string): void {
    this.dialog.set({ kind, code });
  }

  close(): void {
    this.dialog.set(null);
  }

  /** Moves the last service date; next service due is derived from it in `toAssetView`. */
  onService(r: AssetServiceResult): void {
    this.patch(r.assetCode, { lastServicedOn: r.serviceDate });
    this.close();
  }

  onEdit(r: AssetEditResult): void {
    this.patch(r.assetCode, { typeCode: r.typeCode, category: r.category, source: r.source });
    this.close();
  }

  onRetire(r: AssetRetireResult): void {
    this.assets.update((list) => list.filter((a) => a.code !== r.assetCode));
    this.close();
    // The Retire button that opened the modal is gone with its card, so focus goes to the search box.
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.search}`)?.focus());
  }

  private patch(code: string, changes: Partial<FarmerAssetMock>): void {
    this.assets.update((list) => list.map((a) => (a.code === code ? { ...a, ...changes } : a)));
  }
}
