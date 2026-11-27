/**
 * FMB Details & Sketch dialog (SA-M3-S02d, opened by "View" in "Farm FMB & Zones on Map").
 *
 * Everything shown comes from the draft: the plots (application step-3 locations), the village
 * and the chosen zone. The farmer application captures no FMB number, survey number, record date
 * or FMB document, and no per-plot land shape or main crop, so those read "—" with a "Not
 * available yet" tooltip, and Download FMB is disabled. The sketch is drawn from the plots' real
 * boundary points, with an empty state when none were entered.
 *
 * The Plot-wise table carries View (select the plot in the sketch and coordinates), Edit and
 * Delete; Edit and Delete are handed back to the page, which owns the draft.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, computed, signal, type ElementRef } from '@angular/core';
import { DataTableCellDirective, DataTableComponent, type Column, type Row } from '../../shared/data-table/data-table.component';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FmbSketchComponent } from './farmer-fmb-sketch.component';
import { FARMER_ADD_STRINGS as S } from './farmer-add.strings';
import { formatAcres, openRing, pointLabel, type DraftPlot } from './farmer-add.model';

interface PlotRow extends Row {
  id: string;
  label: string;
  area: string;
  landShape: null;
  mainCrop: null;
  status: string;
  actions: string;
}

@Component({
  selector: 'tohfa-farmer-fmb-dialog',
  standalone: true,
  imports: [CommonModule, DataTableComponent, DataTableCellDirective, DialogFocusDirective, FmbSketchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .dialog {
        display: flex;
        flex-direction: column;
        max-width: 1200px;
        width: calc(100vw - var(--space-32) * 2);
        max-height: calc(100vh - var(--space-32) * 2);
        padding: 0;
        overflow: hidden;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-14);
        padding: var(--space-24) var(--space-24) var(--space-18);
        border-bottom: var(--border-divider);
      }
      .hero {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: calc(var(--space-20) * 2);
        height: calc(var(--space-20) * 2);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .hero .icon {
        font-size: var(--icon-nav);
      }
      .head-text {
        flex: 1;
      }
      .title {
        margin: 0 0 var(--space-4);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
      }
      .subtitle {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .close {
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .close .icon {
        font-size: var(--icon-dialog-close);
      }
      .close:focus-visible,
      .view-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        gap: var(--space-18);
        padding: var(--space-20) var(--space-24) var(--space-24);
        overflow-y: auto;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
        min-width: 0;
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-12);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }
      .card-sub {
        margin: calc(var(--space-8) * -1) 0 var(--space-10);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      dl {
        margin: 0;
      }
      .kv {
        display: flex;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-10) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-dense);
      }
      .kv:last-child {
        border-bottom: none;
      }
      .kv dt {
        color: var(--tohfa-slate);
      }
      .kv dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
      }
      .muted-value {
        color: var(--tohfa-muted);
        font-weight: var(--fw-regular);
      }
      .doc-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        color: var(--tohfa-muted);
        cursor: not-allowed;
      }
      .doc-link .icon,
      .view-link .icon {
        font-size: var(--icon-row-action);
      }
      table.coords {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-dense);
      }
      .coords th {
        padding: var(--space-8) 0;
        border-bottom: var(--border-card);
        color: var(--tohfa-muted);
        font-size: var(--fs-table-header);
        font-weight: var(--fw-xbold);
        text-align: left;
        text-transform: uppercase;
      }
      .coords td {
        padding: var(--space-12) 0;
        border-bottom: var(--border-divider);
      }
      .coords td:first-child {
        font-weight: var(--fw-bold);
      }
      .empty-note,
      .note {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
        line-height: 1.5;
      }
      .toolbar {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-10);
      }
      .toolbar .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .toolbar .icon {
        font-size: var(--icon-btn);
      }
      [aria-disabled='true'] {
        cursor: not-allowed;
      }
      .sketch-frame {
        display: flex;
        flex-direction: column;
        border: var(--border-card);
        border-radius: var(--r-card);
        overflow: hidden;
        background: var(--tohfa-surface);
      }
      .sketch-frame:fullscreen {
        border-radius: 0;
      }
      .sketch {
        height: calc(var(--space-32) * 10);
        border-radius: 0;
      }
      .sketch-frame:fullscreen .sketch {
        flex: 1;
        height: auto;
      }
      .sketch-foot {
        padding: var(--space-10) var(--space-14);
        border-top: var(--border-divider);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
        white-space: pre;
      }
      .strong {
        font-weight: var(--fw-bold);
      }
      .row-actions {
        display: inline-flex;
        gap: var(--space-12);
      }
      .view-link {
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        color: var(--info);
        cursor: pointer;
      }
      .view-link.brown {
        color: var(--tohfa-brown);
      }
      .view-link.danger {
        color: var(--err);
      }
      .view-link[aria-pressed='true'] {
        text-decoration: underline;
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="closed.emit()">
      <div
        class="tohfa-dialog dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fmb-dialog-title"
        aria-describedby="fmb-dialog-subtitle"
        tohfaDialogFocus
        (dialogClose)="closed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="head">
          <span class="hero" aria-hidden="true"><span class="material-symbols-outlined icon">menu_book</span></span>
          <div class="head-text">
            <h2 class="title" id="fmb-dialog-title">{{ S.FMB_TITLE }}</h2>
            <p class="subtitle" id="fmb-dialog-subtitle">{{ S.FMB_SUBTITLE }}</p>
          </div>
          <button type="button" class="close" data-autofocus [attr.aria-label]="S.CLOSE" [title]="S.CLOSE" (click)="closed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="body">
          <!-- ============ Left ============ -->
          <div class="col">
            <section class="tohfa-card" aria-labelledby="fmb-info-title">
              <h3 class="card-title" id="fmb-info-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">badge</span>{{ S.FMB_INFO }}
              </h3>
              <dl>
                <div class="kv">
                  <dt>{{ S.FMB_NUMBER }}</dt>
                  <dd class="muted-value" [title]="S.NOT_RECORDED_TIP">{{ S.NOT_RECORDED }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.SURVEY_NUMBER }}</dt>
                  <dd class="muted-value" [title]="S.NOT_RECORDED_TIP">{{ S.NOT_RECORDED }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.TOTAL_LAND_AREA }}</dt>
                  <dd>{{ S.acres(totalAcres()) }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.NUMBER_OF_PLOTS }}</dt>
                  <dd>{{ plotsIn().length }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.FMB_VILLAGE }}</dt>
                  <dd [class.muted-value]="!village">{{ village || S.NOT_RECORDED }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.FMB_ZONE }}</dt>
                  <dd [class.muted-value]="!zoneName">{{ zoneName || S.NOT_RECORDED }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.RECORD_DATE }}</dt>
                  <dd class="muted-value" [title]="S.NOT_RECORDED_TIP">{{ S.NOT_RECORDED }}</dd>
                </div>
                <div class="kv">
                  <dt>{{ S.FMB_DOCUMENT }}</dt>
                  <dd>
                    <span class="doc-link" aria-disabled="true" [title]="S.UPLOAD_NOT_AVAILABLE">
                      {{ S.NOT_RECORDED }}<span class="material-symbols-outlined icon" aria-hidden="true">download</span>
                    </span>
                  </dd>
                </div>
              </dl>
            </section>

            <section class="tohfa-card" aria-labelledby="fmb-coords-title">
              <h3 class="card-title" id="fmb-coords-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ S.BOUNDARY }}
              </h3>
              <p class="card-sub">
                {{ S.WGS84 }}<ng-container *ngIf="selected() as p"> · {{ S.boundaryOf(p.id) }}</ng-container>
              </p>
              <table class="coords" *ngIf="coordinates().length > 0; else noCoords">
                <thead>
                  <tr>
                    <th scope="col">{{ S.POINT }}</th>
                    <th scope="col">{{ S.LATITUDE_N }}</th>
                    <th scope="col">{{ S.LONGITUDE_E }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of coordinates()">
                    <td>{{ c.label }}</td>
                    <td>{{ S.degrees(c.lat) }}</td>
                    <td>{{ S.degrees(c.lng) }}</td>
                  </tr>
                </tbody>
              </table>
              <ng-template #noCoords><p class="empty-note">{{ S.NO_BOUNDARY }}</p></ng-template>
            </section>

            <section class="tohfa-card" aria-labelledby="fmb-notes-title">
              <h3 class="card-title" id="fmb-notes-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ S.NOTES }}
              </h3>
              <p class="note">{{ S.fmbNote(totalAcres(), plotsIn().length) }}</p>
            </section>
          </div>

          <!-- ============ Right ============ -->
          <div class="col">
            <div class="toolbar">
              <button type="button" class="tohfa-btn tohfa-btn-secondary" (click)="toggleFullscreen()">
                <span class="material-symbols-outlined icon" aria-hidden="true">fullscreen</span>{{ S.FULLSCREEN }}
              </button>
              <button type="button" class="tohfa-btn tohfa-btn-secondary" aria-disabled="true" [title]="S.UPLOAD_NOT_AVAILABLE">
                <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.DOWNLOAD_FMB }}
              </button>
              <button type="button" class="tohfa-btn tohfa-btn-primary" (click)="print()">
                <span class="material-symbols-outlined icon" aria-hidden="true">print</span>{{ S.PRINT }}
              </button>
            </div>

            <div class="sketch-frame" #sketchFrame>
              <tohfa-fmb-sketch class="sketch" [plots]="plotsIn()" [selectedId]="selectedId()"></tohfa-fmb-sketch>
              <div class="sketch-foot">{{ S.sketchFooter(S.NOT_RECORDED, S.NOT_RECORDED, totalAcres()) }}</div>
            </div>

            <section class="tohfa-card" aria-labelledby="fmb-plots-title">
              <h3 class="card-title" id="fmb-plots-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.PLOT_WISE }}
              </h3>
              <tohfa-data-table [embedded]="true" [columns]="columns" [rows]="rows()" [emptyMessage]="S.PLOTS_EMPTY">
                <ng-template tohfaCell="id" let-row><span class="strong">{{ row.id }}</span></ng-template>
                <ng-template tohfaCell="landShape" let-row>
                  <span class="muted-value" [title]="S.NO_SPEC_FIELD">{{ S.NOT_RECORDED }}</span>
                </ng-template>
                <ng-template tohfaCell="mainCrop" let-row>
                  <span class="muted-value" [title]="S.NO_SPEC_FIELD">{{ S.NOT_RECORDED }}</span>
                </ng-template>
                <ng-template tohfaCell="status" let-row>
                  <span class="tohfa-badge tohfa-badge-warning tohfa-badge-sm">{{ row.status }}</span>
                </ng-template>
                <ng-template tohfaCell="actions" let-row>
                  <span class="row-actions">
                    <button
                      type="button"
                      class="view-link"
                      [attr.aria-pressed]="row.id === selectedId()"
                      [attr.aria-label]="S.viewPlot(row.label)"
                      (click)="selectedId.set(row.id)"
                    >
                      {{ S.VIEW }}
                    </button>
                    <button type="button" class="view-link brown" [attr.aria-label]="S.editPlot(row.label)" (click)="emitFor(edit, row.id)">
                      {{ S.EDIT }}
                    </button>
                    <button type="button" class="view-link danger" [attr.aria-label]="S.deletePlot(row.label)" (click)="emitFor(remove, row.id)">
                      {{ S.DELETE }}
                    </button>
                  </span>
                </ng-template>
              </tohfa-data-table>
            </section>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FarmerFmbDialogComponent {
  @Input() set plots(value: readonly DraftPlot[]) {
    this.plotsIn.set(value);
    // Keep the selection valid when the page deletes the selected plot.
    if (!value.some((p) => p.id === this.selectedId())) this.selectedId.set(value[0]?.id ?? null);
  }
  @Input() set initialPlotId(value: string | null) {
    this.selectedId.set(value);
  }
  @Input() village = '';
  @Input() zoneName = '';
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly edit = new EventEmitter<DraftPlot>();
  @Output() readonly remove = new EventEmitter<DraftPlot>();

  @ViewChild('sketchFrame') private sketchFrame?: ElementRef<HTMLElement>;

  readonly S = S;
  readonly plotsIn = signal<readonly DraftPlot[]>([]);
  readonly selectedId = signal<string | null>(null);

  readonly columns: readonly Column[] = [
    { key: 'id', header: S.COL_PLOT_ID },
    { key: 'label', header: S.COL_PLOT_NAME },
    { key: 'area', header: S.COL_AREA },
    { key: 'landShape', header: S.COL_LAND_SHAPE },
    { key: 'mainCrop', header: S.COL_MAIN_CROP },
    { key: 'status', header: S.COL_STATUS },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  readonly selected = computed(() => this.plotsIn().find((p) => p.id === this.selectedId()) ?? null);

  readonly totalAcres = computed(() => formatAcres(this.plotsIn().reduce((sum, p) => sum + p.areaAcres, 0)));

  /** The selected plot's boundary points (or its single pin), lettered A, B, C … */
  readonly coordinates = computed(() => {
    const plot = this.selected();
    if (!plot) return [];
    const ring = openRing(plot);
    const points = ring.length > 0 ? ring : plot.latitude !== null && plot.longitude !== null ? [[plot.longitude, plot.latitude]] : [];
    return points.map(([lng, lat], i) => ({ label: pointLabel(i), lat: lat!, lng: lng! }));
  });

  readonly rows = computed<PlotRow[]>(() =>
    this.plotsIn().map((p) => ({
      id: p.id,
      label: p.label,
      area: formatAcres(p.areaAcres),
      landShape: null,
      mainCrop: null,
      status: S.STATUS_DRAFT,
      actions: '',
    })),
  );

  emitFor(emitter: EventEmitter<DraftPlot>, id: string): void {
    const plot = this.plotsIn().find((p) => p.id === id);
    if (plot) emitter.emit(plot);
  }

  toggleFullscreen(): void {
    const frame = this.sketchFrame?.nativeElement;
    if (!frame) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.requestFullscreen?.();
  }

  print(): void {
    window.print();
  }
}
