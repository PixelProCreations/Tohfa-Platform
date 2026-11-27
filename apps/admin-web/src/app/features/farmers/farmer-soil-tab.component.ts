/**
 * Farmers Management → Farmer Details → Soil tab (SA-M3-S03). Renders only the tab panel body;
 * the page header and tab pills belong to farmer-detail.component.ts.
 *
 * Data, from docs/openapi.yaml:
 * - GET /v1/admin/farmers/{id} (`farmer.profile.view_all`): the plots' `soilType`, shown as the
 *   Soil Type row. The parent may pass the already-loaded `farmer` to avoid a second request.
 *
 * Spec gap — everything else on this tab. Soil test records (pH, EC, organic carbon, N/P/K, test
 * dates, their BR-40 labels) exist only behind `/farms/{farmId}/plots/{plotId}/soil-tests*`, gated
 * by `farmer.soil.manage_own`, which every admin role holds as `none` in docs/rbac.json. There is
 * no admin read, no soil health score, no texture field and no recommendation source. So those
 * boxes render "—" / an empty state, never invented values, and no status pill is computed here:
 * classification bands are server-side `system_config` (BR-40), never a client literal, and
 * recommendation text is automated advice, which BR-38 holds back.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  computed,
  inject,
  signal,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { RbacService } from '../../core/rbac.service';
import { DataTableComponent, type Column } from '../../shared/data-table/data-table.component';
import { FARMER_SOIL_TAB_STRINGS as S } from './farmer-soil-tab.strings';
import { FarmersService, type AdminFarmerDetail } from './farmers.service';

/** Geometry of the score ring, in SVG user units (viewBox 0 0 100 100). */
const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface NutrientTile {
  symbol: string;
  name: string;
}

@Component({
  selector: 'tohfa-farmer-soil-tab',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
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
      .icon {
        font-size: var(--icon-btn);
      }
      .muted {
        color: var(--tohfa-muted);
      }
      .error {
        margin: 0;
      }

      /* ---------- Summary tiles ---------- */
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-14);
      }
      .stat {
        display: flex;
        align-items: center;
        gap: var(--space-14);
        padding: var(--space-16) var(--space-18);
      }
      .stat-chip {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .stat-val {
        font-size: var(--fs-title-login);
        font-weight: var(--fw-bold);
        line-height: 1.2;
      }
      .stat-label {
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Grid & cards ---------- */
      .row {
        display: grid;
        gap: var(--space-14);
        align-items: stretch;
      }
      .row-overview {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
      }
      .row-history {
        grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
      }
      .card-head {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin-bottom: var(--space-14);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }
      .card-sub {
        font-size: var(--fs-cap);
        font-weight: var(--fw-medium);
        color: var(--tohfa-muted);
      }

      /* ---------- Soil Health Overview ---------- */
      .overview {
        display: flex;
        align-items: center;
        gap: var(--space-24);
      }
      .ring {
        position: relative;
        flex: none;
        width: 112px;
        height: 112px;
      }
      .ring svg {
        display: block;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      .ring-track {
        fill: none;
        stroke: var(--tohfa-divider);
      }
      .ring-arc {
        fill: none;
        stroke: var(--ok);
        stroke-linecap: round;
      }
      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        text-align: center;
      }
      .ring-score {
        font-size: var(--fs-title-login);
        font-weight: var(--fw-bold);
        line-height: 1;
      }
      .ring-score small {
        font-size: var(--fs-cap);
        font-weight: var(--fw-medium);
        color: var(--tohfa-muted);
      }
      .ring-label {
        font-size: var(--fs-badge);
        color: var(--tohfa-slate);
      }
      .kv {
        flex: 1 1 auto;
        min-width: 0;
        margin: 0;
      }
      .kv-row {
        display: flex;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-7) 0;
        font-size: var(--fs-cell);
      }
      .kv-row dt {
        color: var(--tohfa-slate);
      }
      .kv-row dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
      }

      /* ---------- Nutrient tiles ---------- */
      .nutrients {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-10);
      }
      .nutrient {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-14) var(--space-10);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        background: var(--tohfa-page);
        text-align: center;
      }
      .nutrient-symbol {
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .nutrient-name {
        font-size: var(--fs-badge);
        color: var(--tohfa-slate);
      }
      .nutrient-val {
        margin-top: var(--space-6);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }

      /* ---------- Recommendations ---------- */
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-24) var(--space-12);
        border: 1px dashed var(--tohfa-border);
        border-radius: var(--r-md);
        background: var(--tohfa-page);
        text-align: center;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .empty .icon {
        font-size: var(--icon-dialog-hero);
        color: var(--tohfa-muted);
      }
      .empty-title {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
      }

      @media (max-width: 1100px) {
        .stats,
        .nutrients {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .row-overview,
        .row-history {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <p class="tohfa-banner tohfa-banner-danger error" *ngIf="!canView()" role="alert">{{ S.NO_ACCESS }}</p>
    <p class="tohfa-banner tohfa-banner-info" *ngIf="state() === 'loading'" role="status">{{ S.LOADING }}</p>
    <ng-container *ngIf="state() === 'error'">
      <p class="tohfa-banner tohfa-banner-danger error" role="alert">{{ S.LOAD_ERROR }}</p>
      <div>
        <button type="button" class="tohfa-btn tohfa-btn-secondary" (click)="load()">{{ S.RETRY }}</button>
      </div>
    </ng-container>

    <!-- Summary tiles: soil test records have no admin API, so every count and date is "—". -->
    <section class="stats">
      <div class="tohfa-card stat" [title]="S.NO_ADMIN_SOIL_API">
        <span class="stat-chip"><span class="material-symbols-outlined icon" aria-hidden="true">layers</span></span>
        <div>
          <div class="stat-val muted">{{ S.EMPTY_VALUE }}</div>
          <div class="stat-label">{{ S.STAT_SOIL_RECORDS }}</div>
        </div>
      </div>
      <div class="tohfa-card stat" [title]="S.NO_ADMIN_SOIL_API">
        <span class="stat-chip"><span class="material-symbols-outlined icon" aria-hidden="true">science</span></span>
        <div>
          <div class="stat-val muted">{{ S.EMPTY_VALUE }}</div>
          <div class="stat-label">{{ S.STAT_TESTS_COMPLETED }}</div>
        </div>
      </div>
      <div class="tohfa-card stat" [title]="S.NO_ADMIN_SOIL_API">
        <span class="stat-chip"><span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span></span>
        <div>
          <div class="stat-val muted">{{ S.EMPTY_VALUE }}</div>
          <div class="stat-label">{{ S.STAT_LAST_TEST }}</div>
        </div>
      </div>
      <!-- The design's green tint signals a server-classified "good" result; with none it stays neutral. -->
      <div class="tohfa-card stat" [title]="S.NO_ADMIN_SOIL_API">
        <span class="stat-chip"><span class="material-symbols-outlined icon" aria-hidden="true">eco</span></span>
        <div>
          <div class="stat-val muted">{{ S.EMPTY_VALUE }}</div>
          <div class="stat-label">{{ S.STAT_OVERALL_HEALTH }}</div>
        </div>
      </div>
    </section>

    <section class="row row-overview">
      <!-- Soil Health Overview -->
      <section class="tohfa-card">
        <div class="card-head">
          <h2 class="card-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">landscape</span>{{ S.OVERVIEW_TITLE }}
          </h2>
        </div>
        <div class="overview">
          <div class="ring" role="img" [attr.aria-label]="S.SCORE_ARIA_EMPTY" [title]="S.NO_ADMIN_SOIL_API">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle class="ring-track" cx="50" cy="50" [attr.r]="ringRadius" stroke-width="10" />
              <!-- Drawn only when the API reports a score; there is none to draw today. -->
              <circle
                *ngIf="score() !== null"
                class="ring-arc"
                cx="50"
                cy="50"
                [attr.r]="ringRadius"
                stroke-width="10"
                [attr.stroke-dasharray]="ringCircumference"
                [attr.stroke-dashoffset]="ringOffset()"
              />
            </svg>
            <div class="ring-center">
              <span class="ring-score" [class.muted]="score() === null">
                {{ score() ?? S.EMPTY_VALUE }} <small>{{ S.SCORE_OUT_OF }}</small>
              </span>
              <span class="ring-label">{{ S.SCORE_LABEL }}</span>
            </div>
          </div>

          <dl class="kv">
            <div class="kv-row">
              <dt>{{ S.SOIL_TYPE }}</dt>
              <dd [title]="S.SOIL_TYPE_HINT">
                <ng-container *ngIf="soilTypes().length > 0; else noSoilType">{{ soilTypes().join(', ') }}</ng-container>
                <ng-template #noSoilType>
                  <span class="muted">{{ state() === 'ready' ? S.SOIL_TYPE_NONE : S.EMPTY_VALUE }}</span>
                </ng-template>
              </dd>
            </div>
            <div class="kv-row">
              <dt>{{ S.TEXTURE }}</dt>
              <dd class="muted" [title]="S.NOT_AVAILABLE_YET">{{ S.EMPTY_VALUE }}</dd>
            </div>
            <div class="kv-row">
              <dt>{{ S.PH_LATEST }}</dt>
              <dd class="muted" [title]="S.NO_ADMIN_SOIL_API">{{ S.EMPTY_VALUE }}</dd>
            </div>
            <div class="kv-row">
              <dt>{{ S.ORGANIC_CARBON }}</dt>
              <dd class="muted" [title]="S.NO_ADMIN_SOIL_API">{{ S.EMPTY_VALUE }}</dd>
            </div>
            <div class="kv-row">
              <dt>{{ S.EC }}</dt>
              <dd class="muted" [title]="S.NO_ADMIN_SOIL_API">{{ S.EMPTY_VALUE }}</dd>
            </div>
            <div class="kv-row">
              <dt>{{ S.LAST_TESTED_ON }}</dt>
              <dd class="muted" [title]="S.NO_ADMIN_SOIL_API">{{ S.EMPTY_VALUE }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Soil Nutrient Levels (Latest Test) -->
      <section class="tohfa-card">
        <div class="card-head">
          <h2 class="card-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">biotech</span>{{ S.NUTRIENTS_TITLE }}
          </h2>
          <span class="card-sub">{{ S.NUTRIENTS_SUBTITLE }}</span>
        </div>
        <div class="nutrients">
          <div class="nutrient" *ngFor="let n of nutrients" [title]="S.NO_ADMIN_SOIL_API">
            <span class="nutrient-symbol">{{ n.symbol }}</span>
            <span class="nutrient-name">{{ n.name }}</span>
            <span class="nutrient-val muted">{{ S.EMPTY_VALUE }}</span>
          </div>
        </div>
      </section>
    </section>

    <section class="row row-history">
      <!-- Soil Test History -->
      <section class="tohfa-card">
        <div class="card-head">
          <h2 class="card-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">science</span>{{ S.HISTORY_TITLE }}
          </h2>
        </div>
        <tohfa-data-table [embedded]="true" [columns]="historyColumns" [rows]="historyRows" [emptyMessage]="S.HISTORY_EMPTY" />
      </section>

      <!-- Soil Recommendations -->
      <section class="tohfa-card">
        <div class="card-head">
          <h2 class="card-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">potted_plant</span>{{ S.RECOMMENDATIONS_TITLE }}
          </h2>
        </div>
        <div class="empty">
          <span class="material-symbols-outlined icon" aria-hidden="true">tips_and_updates</span>
          <span class="empty-title">{{ S.RECOMMENDATIONS_EMPTY_TITLE }}</span>
          <span>{{ S.RECOMMENDATIONS_EMPTY_BODY }}</span>
        </div>
      </section>
    </section>
  `,
})
export class FarmerSoilTabComponent implements OnChanges {
  private readonly service = inject(FarmersService);
  private readonly rbac = inject(RbacService);
  private readonly destroyRef = inject(DestroyRef);

  /** The farmer whose soil is shown (`AdminFarmerDetail.id`). */
  @Input({ required: true }) farmerId = '';
  /** Optional: the profile the parent already loaded, so this tab does not fetch it again. */
  @Input() farmer: AdminFarmerDetail | null = null;

  readonly S = S;
  readonly ringRadius = RING_RADIUS;
  readonly ringCircumference = RING_CIRCUMFERENCE;

  readonly nutrients: readonly NutrientTile[] = [
    { symbol: S.NUTRIENT_N, name: S.NUTRIENT_N_NAME },
    { symbol: S.NUTRIENT_P, name: S.NUTRIENT_P_NAME },
    { symbol: S.NUTRIENT_K, name: S.NUTRIENT_K_NAME },
    { symbol: S.NUTRIENT_OC, name: S.NUTRIENT_OC_NAME },
  ];

  /** Mirrors the fields of docs/openapi.yaml `SoilTestRecord` the design's table shows. */
  readonly historyColumns: readonly Column[] = [
    { key: 'id', header: S.COL_TEST_ID },
    { key: 'testDate', header: S.COL_DATE },
    { key: 'ph', header: S.COL_PH },
    { key: 'ecDsPerM', header: S.COL_EC },
    { key: 'organicCarbonPct', header: S.COL_ORG_CARBON },
    { key: 'nitrogenKgPerHa', header: S.COL_N },
    { key: 'phosphorusKgPerHa', header: S.COL_P },
    { key: 'potassiumKgPerHa', header: S.COL_K },
    { key: 'health', header: S.COL_HEALTH },
  ];
  /** Always empty: no admin endpoint returns soil test records (spec gap). */
  readonly historyRows: readonly never[] = [];

  // UI courtesy only; the API re-checks `farmer.profile.view_all` and answers 404 out of scope.
  readonly canView = computed(() => this.rbac.can('farmer.profile.view_all'));

  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly profile = signal<AdminFarmerDetail | null>(null);
  private request: Subscription | null = null;

  /** No API returns a soil health score (spec gap), so this is always null today. */
  readonly score = signal<number | null>(null);
  readonly ringOffset = computed(() => {
    const s = this.score();
    return s === null ? RING_CIRCUMFERENCE : RING_CIRCUMFERENCE * (1 - Math.min(Math.max(s, 0), 100) / 100);
  });

  /** Distinct, non-blank `AdminFarmerPlot.soilType` values across every land location. */
  readonly soilTypes = computed(() => {
    const seen = new Set<string>();
    for (const location of this.profile()?.landLocations ?? []) {
      for (const plot of location.plots) {
        const type = plot.soilType?.trim();
        if (type) seen.add(type);
      }
    }
    return [...seen];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['farmer'] && this.farmer !== null) {
      this.request?.unsubscribe();
      this.profile.set(this.farmer);
      this.state.set('ready');
      return;
    }
    if (changes['farmerId'] && this.farmer === null) this.load();
  }

  load(): void {
    this.request?.unsubscribe();
    this.profile.set(null);
    if (!this.canView() || this.farmerId === '') {
      this.state.set('idle');
      return;
    }
    this.state.set('loading');
    this.request = this.service
      .get(this.farmerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (f) => {
          this.profile.set(f);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }
}
