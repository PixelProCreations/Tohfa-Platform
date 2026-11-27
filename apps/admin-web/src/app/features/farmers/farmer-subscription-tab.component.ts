/**
 * Farmers Management → Farmer Details → Subscription tab.
 *
 * UI ONLY. There is no subscription endpoint wired yet, so every value comes from
 * `farmer-subscription.mock.ts` and every action (Extend, Waive) changes local state only — nothing
 * is persisted and no permission is checked. When the API lands, the mock import is replaced by a
 * service call, each action gains its `requirePermission` code from docs/rbac.json, and the
 * money-moving Waive gets an Idempotency-Key (root CLAUDE.md §2.4).
 *
 * Dates are ISO calendar strings (yyyy-mm-dd) and the arithmetic is done in UTC so a timezone
 * offset can never move the expiry by a day. Amounts are `Money` strings formatted through the
 * shared helper, never floats.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, ViewChild, computed, inject, signal, type ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format as formatMoney } from '@tohfa/shared-types';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FARMER_SUBSCRIPTION_MOCK, type SubscriptionPlanMock } from './farmer-subscription.mock';
import { FARMER_SUBSCRIPTION_STRINGS as S } from './farmer-subscription-tab.strings';

type ExtendDays = 30 | 90 | 365;
type WaiveScope = 'CURRENT_RENEWAL' | 'FULL_PLAN';

interface SuccessRow {
  icon: string;
  label: string;
  value: string;
}

interface SuccessDialog {
  kind: 'extend' | 'waive';
  title: string;
  subtitle: string;
  rows: SuccessRow[];
  /** Applied to local state when the dialog closes (Okay, X, Escape or backdrop). */
  newPeriodEnd: string | null;
}

const EXTEND_OPTIONS: ReadonlyArray<{ days: ExtendDays; label: string }> = [
  { days: 30, label: S.DURATION_30 },
  { days: 90, label: S.DURATION_90 },
  { days: 365, label: S.DURATION_365 },
];

/** yyyy-mm-dd + n days, computed in UTC. */
function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both yyyy-mm-dd). */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-subscription-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Tab heading ---------- */
      .tab-head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
        margin-bottom: var(--space-16);
      }
      .tab-head > .icon {
        margin-top: var(--space-4);
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }
      .tab-title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .tab-sub {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Grid of cards ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-16);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-14);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }

      dl {
        margin: 0;
      }
      .kv {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-10) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-cell);
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
        overflow-wrap: anywhere;
      }

      /* ---------- Forms ---------- */
      .group-label {
        display: block;
        margin: 0 0 var(--space-8);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .req {
        color: var(--err);
      }
      .segments {
        display: grid;
        grid-auto-columns: minmax(0, 1fr);
        grid-auto-flow: column;
        gap: var(--space-8);
        margin-bottom: var(--space-16);
      }
      .segment {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-8) var(--space-12);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .segment:hover {
        background: var(--tohfa-page);
      }
      .segment[aria-pressed='true'] {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .segment:focus-visible,
      .close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .field {
        margin-bottom: var(--space-16);
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--r-md);
      }
      .with-trail {
        padding-right: var(--space-32);
      }
      .trail {
        position: absolute;
        right: var(--space-12);
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
        pointer-events: none;
      }
      input[type='date']::-webkit-calendar-picker-indicator {
        position: absolute;
        right: var(--space-10);
        opacity: 0;
        cursor: pointer;
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-28) * 3);
        resize: vertical;
      }
      .action {
        width: 100%;
        min-height: calc(var(--tohfa-min-touch-target) + var(--space-4));
        font-size: var(--fs-button-l);
      }
      .btn-waive {
        border: 1px solid var(--err);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        color: var(--err);
      }
      .btn-waive:hover:not(:disabled) {
        background: var(--err-bg);
      }

      /* ---------- Success dialog ---------- */
      .dialog {
        position: relative;
        max-width: calc(var(--space-32) * 20);
        width: calc(100vw - var(--space-32) * 2);
        text-align: center;
      }
      .close {
        position: absolute;
        top: var(--space-20);
        right: var(--space-20);
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
      .hero {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-32) * 2);
        height: calc(var(--space-32) * 2);
        margin-bottom: var(--space-16);
        border-radius: var(--r-circle);
        background: var(--ok-bg);
        color: var(--ok);
      }
      .hero .icon {
        font-size: var(--icon-dialog-hero);
      }
      .dlg-title {
        margin: 0 0 var(--space-8);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
        line-height: 1.2;
      }
      .dlg-sub {
        margin: 0 0 var(--space-20);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .summary {
        margin-bottom: var(--space-20);
        padding: var(--space-10) var(--space-20);
        border: var(--border-card);
        border-radius: var(--r-card);
        text-align: left;
      }
      .summary .kv {
        align-items: flex-start;
        border-bottom: none;
        padding: var(--space-6) 0;
      }
      .summary dt {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: var(--space-8);
        font-weight: var(--fw-semi);
      }
      .summary dt .icon {
        color: var(--tohfa-brown);
      }
      .summary dd {
        max-width: 60%;
      }

      @media (max-width: 900px) {
        .grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <header class="tab-head">
      <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>
      <div>
        <h2 class="tab-title">{{ S.TITLE }}</h2>
        <p class="tab-sub">{{ S.SUBTITLE }}</p>
      </div>
    </header>

    <div class="grid">
      <!-- ================= Current Plan ================= -->
      <section class="tohfa-card" [attr.aria-labelledby]="ids.plan">
        <h3 class="card-title" [id]="ids.plan">
          <span class="material-symbols-outlined icon" aria-hidden="true">receipt_long</span>{{ S.CURRENT_PLAN_TITLE }}
        </h3>
        <dl>
          <div class="kv">
            <dt>{{ S.PLAN }}</dt>
            <dd>{{ plan().planName }}</dd>
          </div>
          <div class="kv">
            <dt>{{ S.STATUS }}</dt>
            <dd>
              <span class="tohfa-badge tohfa-badge-sm" [ngClass]="plan().status === 'ACTIVE' ? 'tohfa-badge-success' : 'tohfa-badge-neutral'">
                {{ S.STATUS_LABEL[plan().status] }}
              </span>
            </dd>
          </div>
          <div class="kv">
            <dt>{{ S.PERIOD }}</dt>
            <dd>{{ periodText() }}</dd>
          </div>
          <div class="kv">
            <dt>{{ S.AMOUNT }}</dt>
            <dd>{{ S.amountPer(amountText(), plan().billingCycle) }}</dd>
          </div>
        </dl>
      </section>

      <!-- ================= Free-tier Limits ================= -->
      <section class="tohfa-card" [attr.aria-labelledby]="ids.free">
        <h3 class="card-title" [id]="ids.free">
          <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.FREE_TIER_TITLE }}
        </h3>
        <dl>
          <div class="kv">
            <dt>{{ S.FREE_LISTINGS }}</dt>
            <dd>{{ S.usedOf(freeTier.listingsUsed, freeTier.listingsLimit) }}</dd>
          </div>
          <div class="kv">
            <dt>{{ S.FREE_STORAGE }}</dt>
            <dd>{{ S.usedOf(freeTier.storageDaysUsed, freeTier.storageDaysLimit) }}</dd>
          </div>
          <div class="kv">
            <dt>{{ S.RESETS }}</dt>
            <dd>{{ date(freeTier.resetsOn) }}</dd>
          </div>
        </dl>
      </section>

      <!-- ================= Extend Subscription ================= -->
      <section class="tohfa-card" [attr.aria-labelledby]="ids.extend">
        <h3 class="card-title" [id]="ids.extend">
          <span class="material-symbols-outlined icon" aria-hidden="true">schedule</span>{{ S.EXTEND_TITLE }}
        </h3>

        <span class="group-label" [id]="ids.extendBy">{{ S.EXTEND_BY }}</span>
        <div class="segments" role="group" [attr.aria-labelledby]="ids.extendBy">
          <button
            *ngFor="let o of extendOptions"
            type="button"
            class="segment"
            [attr.aria-pressed]="extendDays() === o.days"
            (click)="selectDuration(o.days)"
          >
            {{ o.label }}
          </button>
        </div>

        <div class="field">
          <label class="group-label" [for]="ids.expiry">{{ S.NEW_EXPIRY }} <span class="req">{{ S.REQUIRED_PAREN }}</span></label>
          <div class="control">
            <input
              [id]="ids.expiry"
              type="date"
              class="tohfa-input with-trail"
              required
              aria-required="true"
              [min]="minExpiry()"
              [ngModel]="newExpiry()"
              (ngModelChange)="newExpiry.set($event)"
            />
            <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
          </div>
        </div>

        <div class="field">
          <label class="group-label" [for]="ids.extendReason">{{ S.REASON }} <span class="req" aria-hidden="true">*</span></label>
          <textarea
            #extendReasonInput
            [id]="ids.extendReason"
            class="tohfa-input"
            rows="3"
            required
            aria-required="true"
            [ngModel]="extendReason()"
            (ngModelChange)="extendReason.set($event)"
          ></textarea>
        </div>

        <button type="button" class="tohfa-btn tohfa-btn-primary action" [disabled]="!canExtend()" (click)="extend()">
          {{ S.BTN_EXTEND }}
        </button>
      </section>

      <!-- ================= Waive Fee ================= -->
      <section class="tohfa-card" [attr.aria-labelledby]="ids.waive">
        <h3 class="card-title" [id]="ids.waive">
          <span class="material-symbols-outlined icon" aria-hidden="true">shield</span>{{ S.WAIVE_TITLE }}
        </h3>

        <span class="group-label" [id]="ids.waiveScope">{{ S.WAIVE }}</span>
        <div class="segments" role="group" [attr.aria-labelledby]="ids.waiveScope">
          <button type="button" class="segment" [attr.aria-pressed]="waiveScope() === 'CURRENT_RENEWAL'" (click)="waiveScope.set('CURRENT_RENEWAL')">
            {{ currentRenewalLabel() }}
          </button>
          <button type="button" class="segment" [attr.aria-pressed]="waiveScope() === 'FULL_PLAN'" (click)="waiveScope.set('FULL_PLAN')">
            {{ S.WAIVE_FULL_PLAN }}
          </button>
        </div>

        <div class="field">
          <label class="group-label" [for]="ids.waiveReason">{{ S.REASON }} <span class="req" aria-hidden="true">*</span></label>
          <textarea
            #waiveReasonInput
            [id]="ids.waiveReason"
            class="tohfa-input"
            rows="3"
            required
            aria-required="true"
            [ngModel]="waiveReason()"
            (ngModelChange)="waiveReason.set($event)"
          ></textarea>
        </div>

        <button type="button" class="tohfa-btn btn-waive action" [disabled]="!canWaive()" (click)="waive()">
          {{ S.BTN_WAIVE }}
        </button>
      </section>
    </div>

    <!-- ================= Success dialog (Extend / Waive) ================= -->
    <div class="tohfa-dialog-scrim" *ngIf="dialog() as d" (click)="closeDialog()">
      <div
        class="tohfa-dialog dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.dlgTitle"
        [attr.aria-describedby]="ids.dlgSub"
        tohfaDialogFocus
        (dialogClose)="closeDialog()"
        (click)="$event.stopPropagation()"
      >
        <button type="button" class="close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="closeDialog()">
          <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
        </button>
        <span class="hero" aria-hidden="true"><span class="material-symbols-outlined icon">check_circle</span></span>
        <h2 class="dlg-title" [id]="ids.dlgTitle">{{ d.title }}</h2>
        <p class="dlg-sub" [id]="ids.dlgSub">{{ d.subtitle }}</p>
        <dl class="summary">
          <div class="kv" *ngFor="let r of d.rows">
            <dt><span class="material-symbols-outlined icon" aria-hidden="true">{{ r.icon }}</span>{{ r.label }}</dt>
            <dd>{{ r.value }}</dd>
          </div>
        </dl>
        <button type="button" class="tohfa-btn tohfa-btn-primary action" data-autofocus (click)="closeDialog()">
          <span class="material-symbols-outlined icon" aria-hidden="true">check</span>{{ S.BTN_OKAY }}
        </button>
      </div>
    </div>
  `,
})
export class FarmerSubscriptionTabComponent {
  private readonly locale = inject(LOCALE_ID);

  @ViewChild('extendReasonInput') private extendReasonInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('waiveReasonInput') private waiveReasonInput?: ElementRef<HTMLTextAreaElement>;

  /** Display name used in the success dialog subtitle. */
  @Input() farmerName = 'the farmer';

  readonly S = S;
  readonly extendOptions = EXTEND_OPTIONS;
  readonly freeTier = FARMER_SUBSCRIPTION_MOCK.freeTier;

  private readonly uid = nextId++;
  readonly ids = {
    plan: `sub-plan-${this.uid}`,
    free: `sub-free-${this.uid}`,
    extend: `sub-extend-${this.uid}`,
    extendBy: `sub-extend-by-${this.uid}`,
    expiry: `sub-expiry-${this.uid}`,
    extendReason: `sub-extend-reason-${this.uid}`,
    waive: `sub-waive-${this.uid}`,
    waiveScope: `sub-waive-scope-${this.uid}`,
    waiveReason: `sub-waive-reason-${this.uid}`,
    dlgTitle: `sub-dlg-title-${this.uid}`,
    dlgSub: `sub-dlg-sub-${this.uid}`,
  };

  // ---------- State (local only) ----------
  readonly plan = signal<SubscriptionPlanMock>({ ...FARMER_SUBSCRIPTION_MOCK.plan });
  readonly extendDays = signal<ExtendDays>(30);
  readonly newExpiry = signal<string>(addDays(FARMER_SUBSCRIPTION_MOCK.plan.periodEnd, 30));
  readonly extendReason = signal('');
  readonly waiveScope = signal<WaiveScope>('CURRENT_RENEWAL');
  readonly waiveReason = signal('');
  readonly dialog = signal<SuccessDialog | null>(null);

  // ---------- Derived ----------
  readonly amountText = computed(() => formatMoney(this.plan().amount));
  readonly periodText = computed(() => S.period(this.date(this.plan().periodStart), this.date(this.plan().periodEnd)));
  readonly currentRenewalLabel = computed(() => S.waiveCurrentRenewal(this.amountText()));
  readonly minExpiry = computed(() => addDays(this.plan().periodEnd, 1));
  readonly canExtend = computed(() => {
    const expiry = this.newExpiry();
    return expiry !== '' && expiry > this.plan().periodEnd && this.extendReason().trim() !== '';
  });
  readonly canWaive = computed(() => this.waiveReason().trim() !== '');

  date(isoDate: string): string {
    return formatDate(isoDate, 'd MMM y', this.locale);
  }

  selectDuration(days: ExtendDays): void {
    this.extendDays.set(days);
    this.newExpiry.set(addDays(this.plan().periodEnd, days));
  }

  extend(): void {
    if (!this.canExtend()) return;
    const expiry = this.newExpiry();
    // The date stays editable, so report the real gap rather than the selected button.
    const gap = daysBetween(this.plan().periodEnd, expiry);
    this.dialog.set({
      kind: 'extend',
      title: S.EXTEND_SUCCESS_TITLE,
      subtitle: S.extendSuccessSubtitle(this.farmerName),
      rows: [
        { icon: 'calendar_today', label: S.PLAN, value: this.plan().planName },
        { icon: 'schedule', label: S.EXTENDED_BY, value: gap === 365 ? S.DURATION_365 : S.days(gap) },
        { icon: 'event', label: S.NEW_EXPIRY_DATE, value: this.date(expiry) },
        { icon: 'description', label: S.REASON, value: this.extendReason().trim() },
      ],
      newPeriodEnd: expiry,
    });
  }

  waive(): void {
    if (!this.canWaive()) return;
    this.dialog.set({
      kind: 'waive',
      title: S.WAIVE_SUCCESS_TITLE,
      subtitle: S.waiveSuccessSubtitle(this.farmerName),
      rows: [
        { icon: 'calendar_today', label: S.PLAN, value: this.plan().planName },
        { icon: 'shield', label: S.WAIVED, value: this.waiveScope() === 'CURRENT_RENEWAL' ? this.currentRenewalLabel() : S.WAIVE_FULL_PLAN },
        { icon: 'description', label: S.REASON, value: this.waiveReason().trim() },
      ],
      newPeriodEnd: null,
    });
  }

  /** The action already "succeeded" when the dialog opened, so every way of closing applies it. */
  closeDialog(): void {
    const d = this.dialog();
    if (!d) return;
    this.dialog.set(null);
    if (d.kind === 'extend' && d.newPeriodEnd !== null) {
      const end = d.newPeriodEnd;
      this.plan.update((p) => ({ ...p, periodEnd: end }));
      this.extendReason.set('');
      this.newExpiry.set(addDays(end, this.extendDays()));
    } else if (d.kind === 'waive') {
      this.waiveReason.set('');
    }
    // Clearing the reason disables the button that opened the dialog, so the focus the dialog
    // directive returns to it would be lost; move it to the (now empty) reason field instead.
    const target = d.kind === 'extend' ? this.extendReasonInput : this.waiveReasonInput;
    setTimeout(() => target?.nativeElement.focus());
  }
}
