/**
 * FMB sketch: draws the draft's plot boundaries (step-3 `fmbPolygon`) and GPS pins as SVG.
 *
 * Used twice: as the compact preview in the "Farm FMB & Zones on Map" card and as the large sketch
 * in the FMB Details & Sketch dialog. It draws only real coordinates from the draft — never a demo
 * shape — and shows an empty state when no plot has a position yet.
 *
 * Projection: equirectangular around the mean latitude (x = lng · cos φ, y = −lat), fitted to the
 * view box. That is accurate to well under a percent across a farm, which is all a sketch needs.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { FARMER_ADD_STRINGS as S } from './farmer-add.strings';
import { centroidOf, formatAcres, openRing, type DraftPlot, type LngLat } from './farmer-add.model';

interface ShapeView {
  id: string;
  points: string;
  labelX: number;
  labelY: number;
  area: string;
  selected: boolean;
}

interface PinView {
  id: string;
  x: number;
  y: number;
  area: string;
  selected: boolean;
}

const VIEW = { full: { w: 720, h: 320, pad: 36 }, compact: { w: 200, h: 120, pad: 14 } } as const;
const ZOOM_STEP = 1.25;
const ZOOM_MIN = 1;
const ZOOM_MAX = 6;

@Component({
  selector: 'tohfa-fmb-sketch',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        border-radius: var(--r-sm);
        background: var(--ok-bg);
        overflow: hidden;
        font-family: var(--font);
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .shape {
        fill: var(--ok-bd);
        fill-opacity: 0.75;
        stroke: var(--ok);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
      }
      .shape.alt {
        fill: var(--info-bd);
        stroke: var(--info);
      }
      .shape.selected {
        stroke-width: 3;
        fill-opacity: 0.95;
      }
      .pin {
        fill: var(--tohfa-amber);
        stroke: var(--tohfa-surface);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
      }
      .label-id {
        fill: var(--tohfa-ink);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
        text-anchor: middle;
      }
      .label-area {
        fill: var(--tohfa-slate);
        font-size: var(--fs-cap);
        text-anchor: middle;
      }
      .north {
        position: absolute;
        top: var(--space-12);
        right: var(--space-16);
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--tohfa-ink);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        line-height: 1;
      }
      .north .icon {
        font-size: var(--icon-nav);
      }
      .zoom {
        position: absolute;
        right: var(--space-12);
        bottom: var(--space-12);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .zoom button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--space-28);
        height: var(--space-28);
        padding: 0;
        border: var(--border-card);
        border-radius: var(--r-xs);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .zoom button:disabled {
        color: var(--tohfa-disabled-fg);
        cursor: not-allowed;
      }
      .zoom button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .zoom .icon {
        font-size: var(--icon-row-action);
      }
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        height: 100%;
        padding: var(--space-16);
        text-align: center;
        color: var(--tohfa-slate);
        font-size: var(--fs-cap);
      }
      .empty .icon {
        font-size: var(--icon-dialog-hero);
        color: var(--ok);
      }
      .empty strong {
        color: var(--tohfa-ink);
        font-size: var(--fs-body);
      }
    `,
  ],
  template: `
    <ng-container *ngIf="hasGeometry(); else empty">
      <svg
        [attr.viewBox]="viewBox()"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        [attr.aria-label]="S.SKETCH_LABEL"
      >
        <polygon
          *ngFor="let s of shapes(); let i = index"
          class="shape"
          [class.alt]="i % 2 === 1"
          [class.selected]="s.selected"
          [attr.points]="s.points"
        ></polygon>
        <circle *ngFor="let p of pins()" class="pin" [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="compact ? 4 : 7"></circle>
        <ng-container *ngIf="!compact">
          <ng-container *ngFor="let s of shapes()">
            <text class="label-id" [attr.x]="s.labelX" [attr.y]="s.labelY">{{ s.id }}</text>
            <text class="label-area" [attr.x]="s.labelX" [attr.y]="s.labelY + 18">{{ S.plotLabelArea(s.area) }}</text>
          </ng-container>
          <ng-container *ngFor="let p of pins()">
            <text class="label-id" [attr.x]="p.x" [attr.y]="p.y - 14">{{ p.id }}</text>
          </ng-container>
        </ng-container>
      </svg>
      <ng-container *ngIf="!compact">
        <span class="north" aria-hidden="true">
          {{ S.NORTH }}<span class="material-symbols-outlined icon">navigation</span>
        </span>
        <div class="zoom">
          <button type="button" [disabled]="zoom() >= zoomMax" [title]="S.ZOOM_IN" [attr.aria-label]="S.ZOOM_IN" (click)="zoomBy(zoomStep)">
            <span class="material-symbols-outlined icon" aria-hidden="true">add</span>
          </button>
          <button type="button" [disabled]="zoom() <= zoomMin" [title]="S.ZOOM_OUT" [attr.aria-label]="S.ZOOM_OUT" (click)="zoomBy(1 / zoomStep)">
            <span class="material-symbols-outlined icon" aria-hidden="true">remove</span>
          </button>
          <button type="button" [disabled]="zoom() === zoomMin" [title]="S.ZOOM_RESET" [attr.aria-label]="S.ZOOM_RESET" (click)="zoom.set(zoomMin)">
            <span class="material-symbols-outlined icon" aria-hidden="true">center_focus_strong</span>
          </button>
        </div>
      </ng-container>
    </ng-container>
    <ng-template #empty>
      <div class="empty" *ngIf="!compact">
        <span class="material-symbols-outlined icon" aria-hidden="true">map</span>
        <strong>{{ S.SKETCH_EMPTY_TITLE }}</strong>
        <span>{{ S.SKETCH_EMPTY_BODY }}</span>
      </div>
    </ng-template>
  `,
})
export class FmbSketchComponent {
  readonly S = S;
  readonly zoomStep = ZOOM_STEP;
  readonly zoomMin = ZOOM_MIN;
  readonly zoomMax = ZOOM_MAX;

  private readonly plotsIn = signal<readonly DraftPlot[]>([]);
  private readonly selectedIn = signal<string | null>(null);
  private readonly compactIn = signal(false);
  readonly zoom = signal(ZOOM_MIN);

  @Input() set plots(value: readonly DraftPlot[]) {
    this.plotsIn.set(value);
  }
  @Input() set selectedId(value: string | null) {
    this.selectedIn.set(value);
  }
  @Input() set compact(value: boolean) {
    this.compactIn.set(value);
  }
  get compact(): boolean {
    return this.compactIn();
  }

  private readonly box = computed(() => (this.compactIn() ? VIEW.compact : VIEW.full));

  /** Every recorded position, polygons first. */
  private readonly positions = computed<LngLat[]>(() =>
    this.plotsIn().flatMap((p) => {
      const ring = openRing(p);
      if (ring.length > 0) return ring;
      return p.latitude !== null && p.longitude !== null ? [[p.longitude, p.latitude] as LngLat] : [];
    }),
  );

  readonly hasGeometry = computed(() => this.positions().length > 0);

  /** Maps `[lng, lat]` to view-box pixels. */
  private readonly project = computed(() => {
    const pts = this.positions();
    const { w, h, pad } = this.box();
    if (pts.length === 0) return (_: LngLat): [number, number] => [w / 2, h / 2];
    const meanLat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const k = Math.cos((meanLat * Math.PI) / 180);
    const xs = pts.map((p) => p[0] * k);
    const ys = pts.map((p) => -p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    // A lone pin (zero span) is centred rather than divided by zero.
    const spanX = Math.max(maxX - minX, Number.EPSILON);
    const spanY = Math.max(maxY - minY, Number.EPSILON);
    const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
    const offX = (w - spanX * scale) / 2;
    const offY = (h - spanY * scale) / 2;
    const single = maxX - minX === 0 && maxY - minY === 0;
    return (p: LngLat): [number, number] =>
      single ? [w / 2, h / 2] : [offX + (p[0] * k - minX) * scale, offY + (-p[1] - minY) * scale];
  });

  readonly shapes = computed<ShapeView[]>(() => {
    const project = this.project();
    return this.plotsIn()
      .map((plot) => ({ plot, ring: openRing(plot) }))
      .filter(({ ring }) => ring.length >= 3)
      .map(({ plot, ring }) => {
        const [cx, cy] = project(centroidOf(ring));
        return {
          id: plot.id,
          points: ring.map((p) => project(p).join(',')).join(' '),
          labelX: cx,
          labelY: cy,
          area: formatAcres(plot.areaAcres),
          selected: plot.id === this.selectedIn(),
        };
      });
  });

  readonly pins = computed<PinView[]>(() => {
    const project = this.project();
    return this.plotsIn()
      .filter((p) => openRing(p).length < 3 && p.latitude !== null && p.longitude !== null)
      .map((plot) => {
        const [x, y] = project([plot.longitude!, plot.latitude!]);
        return { id: plot.id, x, y, area: formatAcres(plot.areaAcres), selected: plot.id === this.selectedIn() };
      });
  });

  /** Zoom shrinks the view box around its centre. */
  readonly viewBox = computed(() => {
    const { w, h } = this.box();
    const z = this.zoom();
    const vw = w / z;
    const vh = h / z;
    return `${(w - vw) / 2} ${(h - vh) / 2} ${vw} ${vh}`;
  });

  zoomBy(factor: number): void {
    this.zoom.update((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor)));
  }
}
