/**
 * Audit inspection step 12 — Farmer Rating (design 90). UI ONLY.
 *
 * The 10 rating categories (docs/openapi.yaml RatingCategoryCode) as expandable cards; one is open at
 * a time and holds a 1–10 score radio group plus optional notes. The overall rating is the live SUM of
 * the category scores — no weights, penalties or thresholds (BR-06 / BR-04). Until all 10 are rated
 * the pill says "Pending"; then it shows "n / 100" with the BR-04b tier label (AUDIT_TIER_BANDS, a
 * display copy of rating_tier_config — integrated screens use the API's resolved `tier`).
 *
 * Submit is blocked (aria-disabled, still focusable so it can explain why) until all 10 categories are
 * rated; then it marks the audit completed (in memory) and navigates to the inspection overview. Save Draft never validates. Nothing is stored.
 *
 * This step has its own footer (note strip + Save Draft + Submit Farmer Rating), so it does not use
 * AuditStepShellComponent; its header reuses the shell's classes so the two look the same.
 *
 * Route: AUDIT_ROUTES.step(id, 12). Reads `:id` (AUDIT_ROUTE_PARAMS.id), default AUD-2026-0042.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { formatAuditDate } from './audit-format';
import { AuditCompletionService } from './audit-completion.service';
import { AUDIT_ROUTES, AUDIT_ROUTE_PARAMS } from './audit-nav';
import { auditToneClass } from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_STEP_FORM_STYLES } from './audit-step-7-form.styles';
import { AUDIT_STEP_12_STRINGS as T } from './audit-step-12-rating.strings';
import {
  AUDIT_RATING_CARD_ORDER,
  AUDIT_RATING_INITIAL_OPEN,
  AUDIT_SCORE_SCALE,
  AUDIT_STEP_DEFAULT_ID,
  mockPreviousOverall,
} from './audit-steps-7-12.mock';
import { AUDIT_INSPECTION_SECTIONS, AUDIT_RATING_CATEGORIES, AUDIT_TIER_BANDS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditRatingCategory, AuditRatingCategoryCode } from './audit.types';

const STEP = 12;

type ScoreMap = Readonly<Partial<Record<AuditRatingCategoryCode, number>>>;
type NotesMap = Readonly<Partial<Record<AuditRatingCategoryCode, string>>>;

@Component({
  selector: 'tohfa-audit-step-12-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEP_FORM_STYLES,
    `
      .header {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
      }
      .info-card {
        padding: var(--space-14) var(--space-18);
      }
      .info-card .audit-summary {
        justify-content: space-between;
      }
      .info-value,
      .cat-heading {
        margin: 0;
      }
      .info-card .audit-summary-item {
        flex: 1 1 calc(var(--space-32) * 4);
      }
      .overall {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr);
        align-items: center;
        gap: var(--space-16) var(--space-32);
        padding: var(--space-14) var(--space-18);
        border: 1px solid var(--ok-bd);
        border-radius: var(--r-card);
        background: var(--ok-bg);
      }
      .overall-label {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-6);
      }
      .overall-kicker {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        font-size: var(--fs-badge);
        font-weight: var(--fw-xbold);
        letter-spacing: 0.04em;
        color: var(--ok);
      }
      .overall-kicker .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .overall-pill {
        display: inline-flex;
        align-items: center;
        padding: var(--space-4) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--ok);
        color: var(--tohfa-neutral-white);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .overall-count {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding-left: var(--space-16);
        border-left: 1px solid var(--ok-bd);
      }
      .overall-count strong {
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .overall-count span {
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .overall-note {
        display: flex;
        align-items: flex-start;
        gap: var(--space-6);
        margin: 0;
        padding-left: var(--space-16);
        border-left: 1px solid var(--ok-bd);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .overall-note .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .cat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
        gap: var(--space-12) var(--space-14);
      }
      .cat {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border: var(--border-card);
        border-radius: var(--r-nav-item);
        background: var(--tohfa-surface);
      }
      .cat.is-open {
        border-color: var(--tohfa-amber);
      }
      .cat-toggle {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-12) var(--space-14);
        border: none;
        border-radius: var(--r-nav-item);
        background: none;
        color: var(--tohfa-ink);
        font-family: var(--font);
        text-align: left;
        cursor: pointer;
      }
      .cat:not(.is-open) .cat-toggle {
        flex: 1;
      }
      .cat-toggle:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .cat-icon {
        font-size: var(--icon-btn);
        color: var(--tohfa-brown);
      }
      .cat-name {
        flex: 1;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .cat-score {
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .cat-chevron {
        font-size: var(--icon-chevron);
        color: var(--tohfa-slate);
      }
      .cat-panel {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        padding: 0 var(--space-14) var(--space-14);
      }
      .score-row {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: var(--space-6);
      }
      .score-row .audit-choice {
        min-width: 0;
        padding: var(--space-4);
      }
      .cat-panel textarea.audit-control {
        min-height: calc(var(--space-32) * 2);
      }
      .footer-strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10);
        padding: var(--space-12) var(--space-16);
        border: 1px solid var(--tohfa-amber-border);
        border-radius: var(--r-card);
        background: var(--tohfa-amber-tint);
      }
      .footer-note {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin: 0 auto 0 0;
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--tohfa-brown);
      }
      .footer-note .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .submit-btn[aria-disabled='true'] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .submit-btn .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .status-row {
        display: flex;
        justify-content: flex-end;
      }
      .status-error {
        margin: 0;
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--err);
      }
      @media (max-width: 900px) {
        .overall {
          grid-template-columns: minmax(0, 1fr);
        }
        .overall-count,
        .overall-note {
          padding-left: 0;
          border-left: none;
        }
        .cat-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 640px) {
        .score-row {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
      }
    `,
  ],
  template: `
    <header class="header">
      <span class="audit-title-tile" aria-hidden="true">
        <span class="material-symbols-outlined">{{ sectionIcon }}</span>
      </span>
      <div>
        <h1 class="audit-title">{{ sectionTitle }}</h1>
        <p class="audit-meta-row">
          <span>{{ S.shellSubtitle(audit().id, audit().farmerName) }}</span>
          <span class="audit-step-pill">{{ T.STEP_PILL }}</span>
        </p>
      </div>
    </header>

    <section class="audit-card info-card" [attr.aria-label]="T.INFO_LABEL">
      <dl class="audit-summary">
        <div class="audit-summary-item" *ngFor="let item of infoItems()">
          <span class="material-symbols-outlined audit-summary-icon" aria-hidden="true">{{ item.icon }}</span>
          <div>
            <dt class="audit-summary-label">{{ item.label }}</dt>
            <dd class="audit-summary-value info-value">{{ item.value }}</dd>
          </div>
        </div>
      </dl>
    </section>

    <section class="overall" aria-labelledby="s12-overall-label">
      <div class="overall-label">
        <span class="overall-kicker" id="s12-overall-label">
          <span class="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
          {{ T.OVERALL_LABEL }}
        </span>
        <span class="overall-pill" aria-live="polite">{{ overallText() }}</span>
      </div>
      <div class="overall-count">
        <strong aria-live="polite">{{ T.ratedCount(ratedCount(), categories.length) }}</strong>
        <span *ngIf="previous !== null">{{ T.previousOverall(previous, maxTotal) }}</span>
      </div>
      <p class="overall-note">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        {{ T.OVERALL_NOTE }}
      </p>
    </section>

    <h2 class="audit-section-title">{{ T.CATEGORIES_HEADING }}</h2>

    <div class="cat-grid">
      <section class="cat" *ngFor="let c of categories" [class.is-open]="openCode() === c.code">
        <h3 class="cat-heading">
          <button
            type="button"
            class="cat-toggle"
            [id]="'s12-' + c.code + '-toggle'"
            [attr.aria-expanded]="openCode() === c.code"
            [attr.aria-controls]="'s12-' + c.code + '-panel'"
            (click)="toggle(c.code)"
          >
            <span class="material-symbols-outlined cat-icon" aria-hidden="true">{{ c.icon }}</span>
            <span class="cat-name">{{ c.label }}</span>
            <span *ngIf="scoreOf(c.code) as score; else notAssessed" class="cat-score">
              {{ T.scoreBadge(score, c.maxScore) }}
            </span>
            <ng-template #notAssessed>
              <span [class]="neutralBadge">{{ T.NOT_ASSESSED }}</span>
            </ng-template>
            <span class="material-symbols-outlined cat-chevron" aria-hidden="true">{{
              openCode() === c.code ? 'expand_less' : 'expand_more'
            }}</span>
          </button>
        </h3>
        <div
          class="cat-panel"
          *ngIf="openCode() === c.code"
          [id]="'s12-' + c.code + '-panel'"
          role="region"
          [attr.aria-labelledby]="'s12-' + c.code + '-toggle'"
        >
          <div class="score-row" role="radiogroup" [attr.aria-label]="T.scoreGroupLabel(c.label)">
            <button
              *ngFor="let n of scale"
              type="button"
              role="radio"
              class="audit-choice"
              [id]="'s12-' + c.code + '-score-' + n"
              [attr.aria-checked]="scoreOf(c.code) === n"
              [attr.aria-label]="T.scoreAria(n, c.maxScore)"
              [tabindex]="tabStop(c.code) === n ? 0 : -1"
              (click)="setScore(c.code, n)"
              (keydown)="onScoreKey($event, c.code, n)"
            >
              {{ n }}
            </button>
          </div>
          <label class="sr-only" [for]="'s12-' + c.code + '-notes'">{{ T.notesLabel(c.label) }}</label>
          <textarea
            class="audit-control"
            [id]="'s12-' + c.code + '-notes'"
            [placeholder]="T.NOTES_PLACEHOLDER"
            [value]="notes()[c.code] ?? ''"
            (input)="setNotes(c.code, $event)"
          ></textarea>
        </div>
      </section>
    </div>

    <div class="footer-strip">
      <p class="footer-note" *ngIf="!complete()">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        {{ T.FOOTER_NOTE }}
      </p>
      <button type="button" class="tohfa-btn audit-btn audit-btn-outline" (click)="onDraft()">
        {{ T.SAVE_DRAFT }}
      </button>
      <button
        type="button"
        class="tohfa-btn tohfa-btn-primary audit-btn submit-btn"
        [attr.aria-disabled]="complete() ? null : 'true'"
        [attr.aria-describedby]="complete() ? null : 's12-submit-why'"
        (click)="onSubmit()"
      >
        {{ T.SUBMIT }}
        <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      </button>
      <span class="sr-only" id="s12-submit-why">{{ T.FOOTER_NOTE }}</span>
    </div>

    <div class="status-row">
      <p class="status-error" role="alert" *ngIf="error() !== ''">{{ error() }}</p>
      <p class="audit-footer-status" role="status" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class AuditStep12RatingComponent {
  readonly S = S;
  readonly T = T;
  readonly scale = AUDIT_SCORE_SCALE;
  readonly neutralBadge = auditToneClass('neutral', true);

  private readonly section = AUDIT_INSPECTION_SECTIONS.find((s) => s.step === STEP);
  readonly sectionTitle = this.section?.title ?? S.SECTION_12;
  readonly sectionIcon = this.section?.icon ?? 'star';

  /** Design 90 order; every code resolves (AUDIT_RATING_CATEGORIES holds all ten). */
  readonly categories: readonly AuditRatingCategory[] = AUDIT_RATING_CARD_ORDER.map((code) =>
    AUDIT_RATING_CATEGORIES.find((c) => c.code === code),
  ).filter((c): c is AuditRatingCategory => c !== undefined);
  readonly maxTotal = this.categories.reduce((sum, c) => sum + c.maxScore, 0);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly completion = inject(AuditCompletionService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly auditId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) || AUDIT_STEP_DEFAULT_ID)),
    { initialValue: AUDIT_STEP_DEFAULT_ID },
  );
  readonly audit = computed(() => mockAuditById(this.auditId()));
  get previous(): number | null {
    return mockPreviousOverall(this.audit().id);
  }

  readonly infoItems = computed(() => {
    const a = this.audit();
    return [
      { icon: 'event_note', label: T.INFO_AUDIT_ID, value: a.id },
      { icon: 'calendar_today', label: T.INFO_AUDIT_DATE, value: formatAuditDate(a.scheduledAt) },
      { icon: 'person', label: T.INFO_FARMER, value: a.farmerName },
      { icon: 'badge', label: T.INFO_FARMER_ID, value: a.farmerCode },
      { icon: 'eco', label: T.INFO_FARM, value: T.farmWithLocation(a.farmName, a.location) },
    ];
  });

  readonly openCode = signal<AuditRatingCategoryCode | null>(AUDIT_RATING_INITIAL_OPEN);
  readonly scores = signal<ScoreMap>({});
  readonly notes = signal<NotesMap>({});
  readonly status = signal('');
  readonly error = signal('');

  readonly ratedCount = computed(() => this.categories.filter((c) => this.scores()[c.code] !== undefined).length);
  readonly complete = computed(() => this.ratedCount() === this.categories.length);
  /** BR-06: a plain sum, no weights. */
  readonly total = computed(() => this.categories.reduce((sum, c) => sum + (this.scores()[c.code] ?? 0), 0));

  readonly overallText = computed(() => {
    if (!this.complete()) return T.OVERALL_PENDING;
    const total = this.total();
    const value = T.overallValue(total, this.maxTotal);
    const band = AUDIT_TIER_BANDS.find((b) => total >= b.minScore && total <= b.maxScore);
    return band === undefined ? value : T.overallWithTier(value, band.label);
  });

  scoreOf(code: AuditRatingCategoryCode): number | null {
    return this.scores()[code] ?? null;
  }

  /** Roving tabindex: the checked radio, or the first one when none is checked. */
  tabStop(code: AuditRatingCategoryCode): number {
    return this.scoreOf(code) ?? this.scale[0] ?? 1;
  }

  toggle(code: AuditRatingCategoryCode): void {
    this.openCode.set(this.openCode() === code ? null : code);
  }

  setScore(code: AuditRatingCategoryCode, n: number): void {
    this.scores.update((s) => ({ ...s, [code]: n }));
    this.status.set('');
    if (this.complete()) this.error.set('');
  }

  onScoreKey(event: KeyboardEvent, code: AuditRatingCategoryCode, n: number): void {
    const i = this.scale.indexOf(n);
    let next: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = this.scale[(i + 1) % this.scale.length];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = this.scale[(i - 1 + this.scale.length) % this.scale.length];
    else if (event.key === 'Home') next = this.scale[0];
    else if (event.key === 'End') next = this.scale[this.scale.length - 1];
    else if (event.key === ' ' || event.key === 'Enter') next = n;
    if (next === undefined) return;
    event.preventDefault();
    this.setScore(code, next);
    this.focus(`s12-${code}-score-${next}`);
  }

  setNotes(code: AuditRatingCategoryCode, event: Event): void {
    const v = (event.target as HTMLTextAreaElement).value;
    this.notes.update((m) => ({ ...m, [code]: v }));
  }

  onDraft(): void {
    this.error.set('');
    this.status.set(S.SHELL_DRAFT_SAVED_DEMO);
  }

  onSubmit(): void {
    if (!this.complete()) {
      this.status.set('');
      this.error.set(T.submitBlocked(this.categories.length - this.ratedCount()));
      const firstUnrated = this.categories.find((c) => this.scores()[c.code] === undefined);
      if (firstUnrated !== undefined) {
        this.openCode.set(firstUnrated.code);
        this.focus(`s12-${firstUnrated.code}-toggle`);
      }
      return;
    }
    this.error.set('');
    this.status.set('');
    this.completion.markCompleted(this.audit().id);
    void this.router.navigateByUrl(AUDIT_ROUTES.inspection(this.audit().id));
  }

  private focus(id: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }
}
