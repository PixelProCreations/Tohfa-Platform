/**
 * Asset summary card shown at the top of the Record Service, Edit Asset and Retire Asset modals.
 * `full` shows the pills and the four service dates (Record Service, Retire); `compact` shows the
 * name, asset ID and Active pill only (Edit Asset). UI only; the thumbnail is a placeholder tile.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, inject } from '@angular/core';
import { formatIsoDate, type AssetView } from './farmer-assets-shared';
import { FARMER_ASSETS_STRINGS as S } from './farmer-assets-tab.strings';

@Component({
  selector: 'tohfa-farmer-assets-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .sum {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-16);
        padding: var(--space-16) var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-card);
        background: var(--tohfa-surface);
      }
      .thumb {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-32) * 2);
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
        margin-top: var(--space-8);
      }
      .tohfa-badge {
        border-color: transparent;
      }
      .dates {
        display: grid;
        grid-template-columns: repeat(2, auto);
        gap: var(--space-8) var(--space-18);
        margin: 0;
      }
      .dates dt {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .dates dt .icon {
        font-size: var(--icon-row-action);
      }
      .dates dd {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .dates dd.overdue {
        color: var(--err);
      }

      @media (max-width: 560px) {
        .sum {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .dates {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
  template: `
    <section class="sum" *ngIf="view as v" [attr.aria-label]="S.ASSET_DETAILS">
      <span class="thumb" role="img" [attr.aria-label]="S.ASSET_PHOTO">
        <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
      </span>
      <div>
        <h3 class="name">{{ v.asset.name }}</h3>
        <p class="code">{{ compact ? S.assetId(v.asset.code) : S.codeLine(v.asset.code, v.categoryLabel) }}</p>
        <div class="pills" *ngIf="!compact">
          <span class="tohfa-badge tohfa-badge-success">{{ S.PILL_ACTIVE }}</span>
          <span class="tohfa-badge tohfa-badge-danger" *ngIf="v.overdue">{{ S.PILL_OVERDUE }}</span>
        </div>
      </div>
      <span class="tohfa-badge tohfa-badge-lg tohfa-badge-success" *ngIf="compact">{{ S.PILL_ACTIVE }}</span>
      <dl class="dates" *ngIf="!compact">
        <div>
          <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span>{{ S.PURCHASED }}</dt>
          <dd>{{ date(v.asset.purchasedOn) }}</dd>
        </div>
        <div>
          <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span>{{ S.LAST_SERVICE }}</dt>
          <dd>{{ v.asset.lastServicedOn ? date(v.asset.lastServicedOn) : S.NOT_SERVICED }}</dd>
        </div>
        <div>
          <dt><span class="material-symbols-outlined icon" aria-hidden="true">autorenew</span>{{ S.SERVICE_EVERY }}</dt>
          <dd>{{ S.days(v.asset.serviceIntervalDays) }}</dd>
        </div>
        <div>
          <dt><span class="material-symbols-outlined icon" aria-hidden="true">event_upcoming</span>{{ S.NEXT_SERVICE_DUE }}</dt>
          <dd [class.overdue]="v.overdue">{{ date(v.nextServiceDueOn) }}</dd>
        </div>
      </dl>
    </section>
  `,
})
export class FarmerAssetsSummaryComponent {
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) view!: AssetView;
  /** Edit Asset variant: name, "Asset ID: …" and the Active pill only. */
  @Input() compact = false;

  readonly S = S;

  date(iso: string): string {
    return formatIsoDate(iso, this.locale);
  }
}
