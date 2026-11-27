/**
 * Farmers Management → Farmer Ratings (list). UI ONLY: placeholder rows (farmer-ratings-list.mock.ts).
 * "View" opens the existing per-farmer rating screen (/farmers/:id/rating).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import { FARMER_RATINGS_MOCK, type FarmerRatingRow } from './farmer-ratings-list.mock';
import { FARMER_RATINGS_LIST_STRINGS as S } from './farmer-ratings-list.strings';

@Component({
  selector: 'tohfa-farmer-ratings-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .crumbs {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .crumbs a {
        color: inherit;
        text-decoration: none;
      }
      .crumbs a:hover {
        color: var(--tohfa-ink);
      }
      .crumbs [aria-current='page'] {
        color: var(--tohfa-ink);
        font-weight: var(--fw-semi);
      }
      .page-title {
        margin: 0;
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .view-link {
        color: var(--tohfa-amber);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        text-decoration: none;
      }
      .view-link:hover {
        text-decoration: underline;
      }
      .table-wrap {
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
        overflow: hidden;
      }
      .table-wrap ::ng-deep .table-card {
        border: none;
        border-radius: 0;
      }
    `,
  ],
  template: `
    <nav class="crumbs" [attr.aria-label]="S.BREADCRUMB_LABEL">
      <a routerLink="/dashboard">{{ S.CRUMB_DASHBOARD }}</a><span aria-hidden="true">/</span>
      <a routerLink="/farmers">{{ S.CRUMB_FARMERS }}</a><span aria-hidden="true">/</span>
      <span aria-current="page">{{ S.CRUMB_CURRENT }}</span>
    </nav>

    <h1 class="page-title">{{ S.TITLE }}</h1>

    <div class="table-wrap">
      <tohfa-data-table
        [columns]="columns"
        [rows]="rows"
        [total]="rows.length"
        [page]="1"
        [pageSize]="rows.length"
        [emptyMessage]="S.EMPTY"
      >
        <ng-template tohfaCell="rating" let-row>{{ ratingText(row) }}</ng-template>
        <ng-template tohfaCell="tier" let-row>
          <span class="tohfa-badge tohfa-badge-{{ tierTone(row) }}">{{ tierText(row) }}</span>
        </ng-template>
        <ng-template tohfaCell="actions" let-row>
          <a
            class="view-link"
            [routerLink]="['/farmers', asRow(row).id, 'rating']"
            [attr.aria-label]="S.viewLabel(asRow(row).name)"
            >{{ S.ACTION_VIEW }}</a
          >
        </ng-template>
      </tohfa-data-table>
    </div>
  `,
})
export class FarmerRatingsListComponent {
  readonly S = S;

  readonly columns: readonly Column[] = [
    { key: 'farmerCode', header: S.COL_ID },
    { key: 'name', header: S.COL_NAME },
    { key: 'zone', header: S.COL_ZONE },
    { key: 'rating', header: S.COL_RATING },
    { key: 'tier', header: S.COL_TIER },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  readonly rows: readonly Row[] = FARMER_RATINGS_MOCK.map((r) => ({ ...r, actions: null }));

  asRow(row: Row): FarmerRatingRow {
    return row as unknown as FarmerRatingRow;
  }

  ratingText(row: Row): string {
    const r = this.asRow(row).rating;
    return r === null ? S.NO_RATING : S.rating(r);
  }

  tierText(row: Row): string {
    return this.asRow(row).tier ?? S.TIER_NONE;
  }

  tierTone(row: Row): string {
    return this.asRow(row).tier === null ? 'neutral' : 'amber';
  }
}
