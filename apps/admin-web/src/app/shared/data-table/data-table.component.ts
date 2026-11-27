/**
 * The reusable admin data table.
 *
 * Every list screen in the console uses this: same paging controls, same empty
 * state, same column definition shape. Screens supply columns + rows; they do
 * not restyle the table.
 *
 * ```html
 * <tohfa-data-table
 *   [columns]="columns"
 *   [rows]="warehouses()"
 *   [total]="total()"
 *   [page]="page()"
 *   (pageChange)="page.set($event)">
 *   <!-- Optional: a custom cell for one column (badges, links, action icons). -->
 *   <ng-template tohfaCell="status" let-row>
 *     <span class="tohfa-badge tohfa-badge-success">{{ row.status }}</span>
 *   </ng-template>
 * </tohfa-data-table>
 * ```
 *
 * Paging works for both API styles in docs/openapi.yaml:
 * - offset paging: pass `total`; page buttons are derived from it.
 * - cursor paging (`PageMeta` without `total`): pass `total = null` and `hasMore`;
 *   the pager then only offers pages the caller can actually reach (the
 *   previous ones it holds cursors for, and the next one).
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  TemplateRef,
  inject,
  type QueryList,
} from '@angular/core';

export type Row = Record<string, unknown>;

export interface Column<T extends Row = Row> {
  /** Property on the row. */
  key: keyof T & string;
  header: string;
  /** Optional formatter; defaults to String(value). Use for Money and dates. */
  format?: (value: unknown, row: T) => string;
  align?: 'left' | 'right';
}

/** Marks an `<ng-template>` as the cell renderer for the column whose key it names. */
@Directive({
  selector: 'ng-template[tohfaCell]',
  standalone: true,
})
export class DataTableCellDirective {
  @Input({ required: true }) tohfaCell = '';
  readonly template = inject<TemplateRef<{ $implicit: Row }>>(TemplateRef);
}

@Component({
  selector: 'tohfa-data-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .table-card {
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
        overflow: hidden;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: var(--space-14) var(--space-16);
        text-align: left;
        white-space: nowrap;
        font-family: var(--font);
      }
      th {
        background: var(--tohfa-page);
        border-bottom: var(--border-card);
        color: var(--tohfa-muted);
        font-size: var(--fs-table-header);
        font-weight: var(--fw-xbold);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      td {
        border-bottom: var(--border-divider);
        color: var(--tohfa-ink);
        font-size: var(--fs-cell);
      }
      tbody tr:hover td {
        background: var(--tohfa-page);
      }
      .right {
        text-align: right;
      }
      .empty {
        padding: var(--space-24);
        text-align: center;
        color: var(--tohfa-slate);
        font-size: var(--fs-cell);
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-16);
        border-top: var(--border-divider);
        background: var(--tohfa-surface);
      }
      .range {
        color: var(--tohfa-slate);
        font-size: var(--fs-dense);
      }
      .pager {
        display: flex;
        align-items: center;
        gap: var(--space-6);
      }
      .pager button {
        box-sizing: border-box;
        min-width: 30px;
        height: 30px;
        padding: 0 var(--space-12);
        line-height: 1;
        border: var(--border-card);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-surface);
        color: var(--tohfa-slate);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-medium);
        cursor: pointer;
      }
      .pager button:hover:not([disabled]):not(.active) {
        background: var(--tohfa-page);
        color: var(--tohfa-ink);
      }
      .pager button.active {
        background: var(--tohfa-amber);
        border-color: var(--tohfa-amber);
        color: var(--tohfa-neutral-white);
        font-weight: var(--fw-bold);
      }
      .pager button[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pager button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      /* Embedded: the table sits inside a card that already draws the frame (detail pages). */
      :host(.embedded) .table-card {
        border: none;
        border-radius: 0;
      }
      :host(.embedded) th {
        background: transparent;
        padding: var(--space-8) var(--space-6);
      }
      :host(.embedded) td {
        padding: var(--space-10) var(--space-6);
      }
      :host(.embedded) th:first-child,
      :host(.embedded) td:first-child {
        padding-left: 0;
      }
    `,
  ],
  template: `
    <div class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th *ngFor="let column of columns" [class.right]="column.align === 'right'">
                {{ column.header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td *ngFor="let column of columns" [class.right]="column.align === 'right'">
                <ng-container *ngIf="cellTemplate(column.key) as tpl; else plain">
                  <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row }"></ng-container>
                </ng-container>
                <ng-template #plain>{{ render(column, row) }}</ng-template>
              </td>
            </tr>
            <tr *ngIf="!rows || rows.length === 0">
              <td class="empty" [attr.colspan]="columns.length">{{ emptyMessage }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer" *ngIf="showFooter">
        <span class="range">{{ footerLabel || rangeLabel }}</span>
        <div class="pager" *ngIf="lastPage > 1">
          <button type="button" [disabled]="page <= 1" (click)="goTo(page - 1)">{{ prevLabel }}</button>
          <button
            type="button"
            *ngFor="let p of pageWindow"
            [class.active]="p === page"
            [attr.aria-current]="p === page ? 'page' : null"
            (click)="goTo(p)"
          >
            {{ p }}
          </button>
          <button type="button" [disabled]="page >= lastPage" (click)="goTo(page + 1)">{{ nextLabel }}</button>
        </div>
      </div>
    </div>
  `,
})
export class DataTableComponent {
  @Input() columns: readonly Column[] = [];
  @Input() rows: readonly Row[] = [];
  /** Total matching rows. `null` when the API is cursor-paged and does not report one. */
  @Input() total: number | null = 0;
  @Input() page = 1;
  @Input() pageSize = 20;
  /** Cursor paging only: whether a next page exists (`PageMeta.hasMore`). */
  @Input() hasMore = false;
  @Input() emptyMessage = 'Nothing to show yet.';
  /** Overrides the default "first–last of total" footer text. */
  @Input() footerLabel = '';
  @Input() prevLabel = 'Previous';
  @Input() nextLabel = 'Next';
  /** Drop the table's own card frame and use compact cells, for a table inside a card. */
  @Input() @HostBinding('class.embedded') embedded = false;

  @Output() readonly pageChange = new EventEmitter<number>();

  @ContentChildren(DataTableCellDirective) cellTemplates?: QueryList<DataTableCellDirective>;

  get lastPage(): number {
    if (this.total === null) return this.hasMore ? this.page + 1 : this.page;
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get showFooter(): boolean {
    return this.lastPage > 1 || this.footerLabel !== '';
  }

  /** The current page and its neighbours — every page in it is reachable in either paging mode. */
  get pageWindow(): number[] {
    const first = Math.max(1, this.page - 1);
    const last = Math.min(this.lastPage, this.page + 1);
    const pages: number[] = [];
    for (let p = first; p <= last; p++) pages.push(p);
    return pages;
  }

  get rangeLabel(): string {
    const first = this.rows.length === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
    if (this.total === null) return `${first}–${first + Math.max(0, this.rows.length - 1)}`;
    if (this.total === 0) return '0 of 0';
    const last = Math.min(this.page * this.pageSize, this.total);
    return `${first}–${last} of ${this.total}`;
  }

  cellTemplate(key: string): TemplateRef<{ $implicit: Row }> | null {
    return this.cellTemplates?.find((c) => c.tohfaCell === key)?.template ?? null;
  }

  render(column: Column, row: Row): string {
    const value = row[column.key];
    if (column.format !== undefined) return column.format(value, row);
    return value === null || value === undefined ? '—' : String(value);
  }

  goTo(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.page) return;
    this.pageChange.emit(page);
  }
}
