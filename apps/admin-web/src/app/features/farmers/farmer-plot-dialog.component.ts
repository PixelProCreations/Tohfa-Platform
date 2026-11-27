/**
 * Add New Plot / Edit Plot dialog (SA-M3-S02d, opened from "Farm FMB & Zones on Map").
 *
 * The fields are the farmer application's step-3 `location` (label, areaAcres, optional GPS pin and
 * optional FMB boundary) plus `soilType`, the plot attribute the farm stores as `plots.soil_type`.
 * The design's Land Shape, Main Crop and Plot Location / Notes have no field in any schema (spec
 * gap), so they are rendered disabled with a "Not available yet" tooltip rather than collected and
 * silently dropped.
 *
 * Boundary points are entered the way the mobile registration's manual entry works: one point is a
 * pin, three or more outline a boundary. The polygon is stored closed and in GeoJSON `[lng, lat]`
 * order, and the pin is set to its centroid, exactly as step 3 expects.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FARMER_ADD_STRINGS as S } from './farmer-add.strings';
import {
  PLOT_LIMITS,
  centroidOf,
  closedPolygon,
  openRing,
  pointLabel,
  type DraftPlot,
  type LngLat,
} from './farmer-add.model';

interface PointRow {
  lat: string;
  lng: string;
}

type PlotField = 'label' | 'area' | 'points';

const DECIMAL = /^-?\d+(\.\d+)?$/;

@Component({
  selector: 'tohfa-farmer-plot-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .dialog {
        display: flex;
        flex-direction: column;
        max-width: 720px;
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
      .close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .body {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-16) var(--space-16);
        padding: var(--space-20) var(--space-24);
        overflow-y: auto;
      }
      .full {
        grid-column: 1 / -1;
      }
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .tohfa-label {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .tohfa-label .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-amber);
      }
      .optional {
        color: var(--tohfa-muted);
        font-weight: var(--fw-semi);
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--fs-body);
      }
      .tohfa-input.invalid {
        border-color: var(--err);
      }
      .tohfa-input[readonly] {
        background: var(--tohfa-page);
        color: var(--tohfa-ink);
        font-family: var(--tohfa-font-mono);
      }
      .tohfa-input[readonly]:focus {
        border-color: var(--tohfa-border);
        box-shadow: none;
      }
      .tohfa-input:disabled {
        cursor: not-allowed;
      }
      select.tohfa-input {
        appearance: none;
        cursor: pointer;
      }
      .with-trail {
        padding-right: var(--space-32);
      }
      .with-lead {
        padding-left: var(--space-32);
      }
      .trail,
      .lead {
        position: absolute;
        font-size: var(--icon-input);
        color: var(--tohfa-muted);
        pointer-events: none;
      }
      .trail {
        right: var(--space-12);
      }
      .lead {
        left: var(--space-12);
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-32) * 3);
        resize: vertical;
      }
      .counter {
        align-self: flex-end;
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .field-error {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }
      .boundary-links {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-18);
      }
      .link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .link .icon {
        font-size: var(--icon-row-action);
      }
      .link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .hint {
        margin: 0 0 var(--space-10);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .point {
        display: grid;
        grid-template-columns: var(--space-24) minmax(0, 1fr) minmax(0, 1fr) var(--space-32);
        align-items: center;
        gap: var(--space-10);
        margin-bottom: var(--space-8);
      }
      .point-label {
        font-weight: var(--fw-bold);
        font-size: var(--fs-dense);
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--err);
        cursor: pointer;
      }
      .icon-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .foot {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-12);
        padding: var(--space-16) var(--space-24);
        border-top: var(--border-divider);
      }
      .foot .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .foot .icon {
        font-size: var(--icon-btn);
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="closed.emit()">
      <form
        class="tohfa-dialog dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plot-dialog-title"
        aria-describedby="plot-dialog-subtitle"
        novalidate
        tohfaDialogFocus
        (dialogClose)="closed.emit()"
        (click)="$event.stopPropagation()"
        (ngSubmit)="submit()"
      >
        <header class="head">
          <span class="hero" aria-hidden="true"><span class="material-symbols-outlined icon">stacks</span></span>
          <div class="head-text">
            <h2 class="title" id="plot-dialog-title">{{ plot ? S.PLOT_EDIT_TITLE : S.PLOT_ADD_TITLE }}</h2>
            <p class="subtitle" id="plot-dialog-subtitle">{{ S.PLOT_SUBTITLE }}</p>
          </div>
          <button type="button" class="close" [attr.aria-label]="S.CLOSE" [title]="S.CLOSE" (click)="closed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="body">
          <div class="field">
            <label class="tohfa-label tohfa-label-required" for="pd-name">
              <span class="material-symbols-outlined icon" aria-hidden="true">sell</span>{{ S.PLOT_NAME }}
            </label>
            <input
              id="pd-name"
              name="label"
              class="tohfa-input"
              data-autofocus
              [class.invalid]="errors()['label']"
              [maxLength]="limits.labelMax"
              [placeholder]="S.PLOT_NAME_PLACEHOLDER"
              autocomplete="off"
              [(ngModel)]="label"
            />
            <p class="field-error" *ngIf="errors()['label'] as e">{{ e }}</p>
          </div>
          <div class="field">
            <label class="tohfa-label" for="pd-id">
              <span class="material-symbols-outlined icon" aria-hidden="true">tag</span>{{ S.PLOT_ID }}
            </label>
            <div class="control" [title]="S.PLOT_ID_LOCKED">
              <input id="pd-id" class="tohfa-input with-trail" [value]="plotId" readonly />
              <span class="material-symbols-outlined trail" aria-hidden="true">lock</span>
            </div>
          </div>

          <div class="field">
            <label class="tohfa-label tohfa-label-required" for="pd-area">
              <span class="material-symbols-outlined icon" aria-hidden="true">straighten</span>{{ S.PLOT_AREA }}
            </label>
            <input
              id="pd-area"
              name="area"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              class="tohfa-input"
              [class.invalid]="errors()['area']"
              [placeholder]="S.PLOT_AREA_PLACEHOLDER"
              [(ngModel)]="area"
            />
            <p class="field-error" *ngIf="errors()['area'] as e">{{ e }}</p>
          </div>
          <div class="field">
            <label class="tohfa-label" for="pd-shape">
              <span class="material-symbols-outlined icon" aria-hidden="true">polyline</span>{{ S.LAND_SHAPE }}
            </label>
            <div class="control" [title]="S.NO_SPEC_FIELD">
              <select id="pd-shape" class="tohfa-input with-trail" disabled>
                <option>{{ S.LAND_SHAPE_PLACEHOLDER }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
          </div>

          <div class="field">
            <label class="tohfa-label" for="pd-crop">
              <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.MAIN_CROP }}
            </label>
            <div class="control" [title]="S.NO_SPEC_FIELD">
              <span class="material-symbols-outlined lead" aria-hidden="true">search</span>
              <input id="pd-crop" class="tohfa-input with-lead" [placeholder]="S.MAIN_CROP_PLACEHOLDER" disabled />
            </div>
          </div>
          <div class="field">
            <label class="tohfa-label" for="pd-soil">
              <span class="material-symbols-outlined icon" aria-hidden="true">layers</span>{{ S.SOIL_TYPE }}
            </label>
            <div class="control">
              <select id="pd-soil" name="soilType" class="tohfa-input with-trail" [(ngModel)]="soilType">
                <option value="">{{ S.SOIL_TYPE_PLACEHOLDER }}</option>
                <option *ngFor="let o of S.SOIL_OPTIONS" [value]="o">{{ o }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
          </div>

          <div class="field full">
            <label class="tohfa-label" for="pd-notes">
              <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ S.PLOT_NOTES }}
              <span class="optional">{{ S.OPTIONAL }}</span>
            </label>
            <textarea
              id="pd-notes"
              class="tohfa-input"
              [placeholder]="S.PLOT_NOTES_PLACEHOLDER"
              [maxLength]="limits.notesMax"
              disabled
              [title]="S.NO_SPEC_FIELD"
            ></textarea>
            <span class="counter">{{ S.counter(0, limits.notesMax) }}</span>
          </div>

          <div class="full">
            <div class="boundary-links">
              <button
                type="button"
                class="link"
                [attr.aria-expanded]="showBoundary()"
                aria-controls="pd-boundary"
                (click)="toggleBoundary()"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>
                {{ showBoundary() ? S.BOUNDARY_HIDE : (points.length > 0 ? S.BOUNDARY_ENTER : S.BOUNDARY_LATER) }}
              </button>
            </div>
            <div id="pd-boundary" *ngIf="showBoundary()">
              <p class="hint">{{ S.BOUNDARY_HELP }}</p>
              <div class="point" *ngFor="let p of points; let i = index">
                <span class="point-label">{{ letter(i) }}</span>
                <input
                  class="tohfa-input"
                  [id]="'pd-lat-' + i"
                  [name]="'lat' + i"
                  inputmode="decimal"
                  [attr.aria-label]="S.LATITUDE + ' ' + letter(i)"
                  [placeholder]="S.LATITUDE_PLACEHOLDER"
                  [(ngModel)]="p.lat"
                />
                <input
                  class="tohfa-input"
                  [id]="'pd-lng-' + i"
                  [name]="'lng' + i"
                  inputmode="decimal"
                  [attr.aria-label]="S.LONGITUDE + ' ' + letter(i)"
                  [placeholder]="S.LONGITUDE_PLACEHOLDER"
                  [(ngModel)]="p.lng"
                />
                <button
                  type="button"
                  class="icon-btn"
                  [attr.aria-label]="S.removePoint(letter(i))"
                  [title]="S.removePoint(letter(i))"
                  (click)="removePoint(i)"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
              <button type="button" class="link" (click)="addPoint()">
                <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.ADD_POINT }}
              </button>
              <p class="field-error" *ngIf="errors()['points'] as e" role="alert">{{ e }}</p>
            </div>
          </div>
        </div>

        <footer class="foot">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="closed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="submit" class="tohfa-btn tohfa-btn-primary-l">
            <span class="material-symbols-outlined icon" aria-hidden="true">check</span>{{ S.BTN_SAVE_PLOT }}
          </button>
        </footer>
      </form>
    </div>
  `,
})
export class FarmerPlotDialogComponent implements OnInit {
  /** The plot being edited, or null to add one. */
  @Input() plot: DraftPlot | null = null;
  /** The id a new plot will get. */
  @Input() nextId = '';
  @Output() readonly saved = new EventEmitter<DraftPlot>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly S = S;
  readonly limits = PLOT_LIMITS;
  readonly errors = signal<Partial<Record<PlotField, string>>>({});
  readonly showBoundary = signal(false);

  plotId = '';
  label = '';
  area: number | string | null = null;
  soilType = '';
  points: PointRow[] = [];

  ngOnInit(): void {
    const p = this.plot;
    this.plotId = p?.id ?? this.nextId;
    if (!p) return;
    this.label = p.label;
    this.area = p.areaAcres;
    this.soilType = p.soilType ?? '';
    const ring = openRing(p);
    const coords: LngLat[] =
      ring.length > 0 ? ring : p.latitude !== null && p.longitude !== null ? [[p.longitude, p.latitude]] : [];
    this.points = coords.map(([lng, lat]) => ({ lat: String(lat), lng: String(lng) }));
  }

  letter(index: number): string {
    return pointLabel(index);
  }

  toggleBoundary(): void {
    this.showBoundary.update((v) => !v);
    if (this.showBoundary() && this.points.length === 0) this.addPoint();
  }

  addPoint(): void {
    this.points = [...this.points, { lat: '', lng: '' }];
  }

  removePoint(index: number): void {
    this.points = this.points.filter((_, i) => i !== index);
  }

  submit(): void {
    const e: Partial<Record<PlotField, string>> = {};
    const label = this.label.trim();
    if (label === '') e.label = S.ERR_REQUIRED;
    else if (label.length > PLOT_LIMITS.labelMax) e.label = S.errMax(PLOT_LIMITS.labelMax);

    const area = Number(this.area);
    if (this.area === null || this.area === '' || !Number.isFinite(area) || area <= 0 || area >= PLOT_LIMITS.maxAcres) {
      e.area = S.ERR_AREA;
    }

    // Rows left wholly blank are ignored; a half-filled row is an error.
    const filled = this.points.filter((p) => p.lat.trim() !== '' || p.lng.trim() !== '');
    const coords: LngLat[] = [];
    for (const p of filled) {
      const lat = p.lat.trim();
      const lng = p.lng.trim();
      if (!DECIMAL.test(lat) || Math.abs(Number(lat)) > 90) {
        e.points = S.ERR_LAT;
        break;
      }
      if (!DECIMAL.test(lng) || Math.abs(Number(lng)) > 180) {
        e.points = S.ERR_LNG;
        break;
      }
      coords.push([Number(lng), Number(lat)]);
    }
    if (!e.points && coords.length === 2) e.points = S.ERR_POINTS;

    this.errors.set(e);
    if (e.points) this.showBoundary.set(true);
    if (Object.keys(e).length > 0) return;

    const polygon = coords.length >= PLOT_LIMITS.minBoundaryPoints ? closedPolygon(coords) : null;
    const pin = polygon ? centroidOf(coords) : (coords[0] ?? null);
    this.saved.emit({
      id: this.plotId,
      label,
      areaAcres: area,
      soilType: this.soilType === '' ? null : this.soilType,
      latitude: pin ? pin[1] : null,
      longitude: pin ? pin[0] : null,
      fmbPolygon: polygon,
    });
  }
}
