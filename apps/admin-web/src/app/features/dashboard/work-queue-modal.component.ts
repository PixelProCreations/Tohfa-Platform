import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface WorkQueueItem {
  id: string;
  category: 'purchase' | 'farmer' | 'audit' | 'price' | 'inventory';
  title: string;
  assignee: string;
  identifiers: string;
  note: string;
  createdDate: string;
  status: 'Exception' | 'Pending' | 'Overdue';
  statusType: 'err' | 'warn';
  actionLabel: string;
  actionLink: string;
}

@Component({
  selector: 'tohfa-work-queue-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font, 'Poppins', sans-serif);
      }

      * {
        box-sizing: border-box;
      }

      /* Modal Backdrop */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(18, 24, 20, 0.45);
        backdrop-filter: blur(3px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeInBackdrop 0.2s ease-out;
      }

      @keyframes fadeInBackdrop {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Modal Window */
      .modal-dialog {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 20px;
        max-width: 580px;
        width: 100%;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
        animation: slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }

      @keyframes slideUpModal {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Modal Header */
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .modal-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .modal-title-icon {
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-title {
        font-size: 20px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .close-btn:hover {
        background: var(--tohfa-page, #F7F5EE);
        color: var(--tohfa-ink, #1D2420);
      }

      /* Search & Filters */
      .search-box-wrap {
        padding: 18px 24px 8px;
      }

      .search-input-box {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        padding: 10px 14px;
        background: #ffffff;
        transition: border-color 0.15s ease;
      }

      .search-input-box:focus-within {
        border-color: var(--tohfa-amber, #E48932);
      }

      .search-icon {
        color: var(--tohfa-muted, #9AA294);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        border: none;
        outline: none;
        font-family: inherit;
        font-size: 13px;
        color: var(--tohfa-ink, #1D2420);
        background: transparent;
      }

      .search-input::placeholder {
        color: var(--tohfa-muted, #9AA294);
      }

      .filter-icon-btn {
        background: none;
        border: none;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Stats summary subtitle */
      .summary-text {
        padding: 0 24px 14px;
        font-size: 12px;
        font-weight: 500;
        color: var(--tohfa-slate, #5C6B63);
      }

      /* Scrollable list */
      .queue-items-list {
        padding: 0 24px 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
        max-height: 58vh;
      }

      .queue-items-list::-webkit-scrollbar {
        width: 5px;
      }

      .queue-items-list::-webkit-scrollbar-thumb {
        background: var(--tohfa-border, #E4E0D3);
        border-radius: 4px;
      }

      /* Queue Item Card */
      .queue-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 16px;
        padding: 18px 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .queue-card:hover {
        border-color: rgba(228, 137, 50, 0.5);
        box-shadow: 0 4px 14px rgba(228, 137, 50, 0.08);
      }

      .card-top-row {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }

      .item-icon-chip {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .card-info-col {
        flex: 1;
        min-width: 0;
      }

      .item-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 2px;
      }

      .item-title {
        font-size: 15px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 6px;
        text-transform: capitalize;
        white-space: nowrap;
      }

      .status-pill.err {
        background: var(--tohfa-tint-err, #FDE8E8);
        color: var(--tohfa-err, #9C2525);
      }

      .status-pill.warn {
        background: var(--tohfa-tint-warn, #FEF3D6);
        color: var(--tohfa-warn, #8F6B00);
      }

      .item-assignee {
        font-size: 13.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin: 3px 0 2px;
      }

      .item-identifiers {
        font-size: 11.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0 0 4px;
        font-weight: 500;
      }

      .item-note {
        font-size: 12px;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 3px;
        font-weight: 500;
      }

      .item-date {
        font-size: 11px;
        color: var(--tohfa-muted, #9AA294);
        margin: 0;
      }

      /* Card Review Button */
      .card-action-btn {
        display: block;
        width: 100%;
        margin-top: 14px;
        background: #ffffff;
        border: 1.5px solid var(--tohfa-amber, #E48932);
        color: var(--tohfa-brown, #8A4E15);
        border-radius: 9px;
        padding: 10px 16px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, transform 0.05s ease;
      }

      .card-action-btn:hover {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-brown-deep, #5C3410);
      }

      .card-action-btn:active {
        transform: translateY(1px);
      }

      /* Empty state */
      .empty-queue {
        text-align: center;
        padding: 40px 20px;
        color: var(--tohfa-slate, #5C6B63);
      }
    `,
  ],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <span class="modal-title-icon">
              <!-- Sliders / queue icon -->
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" x2="20" y1="21" y2="21"></line>
                <line x1="4" x2="20" y1="3" y2="3"></line>
                <line x1="4" x2="12" y1="12" y2="12"></line>
                <line x1="16" x2="20" y1="12" y2="12"></line>
                <line x1="14" x2="14" y1="9" y2="15"></line>
                <line x1="8" x2="8" y1="18" y2="24"></line>
                <line x1="16" x2="16" y1="0" y2="6"></line>
              </svg>
            </span>
            <h2 class="modal-title">Work Queue</h2>
          </div>

          <button class="close-btn" type="button" aria-label="Close" (click)="closeModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Search Input -->
        <div class="search-box-wrap">
          <div class="search-input-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search common or scientific name"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
            />
            <button class="filter-icon-btn" type="button" aria-label="Filter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="21" x2="14" y1="4" y2="4"></line>
                <line x1="10" x2="3" y1="4" y2="4"></line>
                <line x1="21" x2="12" y1="12" y2="12"></line>
                <line x1="8" x2="3" y1="12" y2="12"></line>
                <line x1="21" x2="16" y1="20" y2="20"></line>
                <line x1="12" x2="3" y1="20" y2="20"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Summary subline -->
        <div class="summary-text">{{ pendingCount }} pending · {{ exceptionCount }} blocked / exception</div>

        <!-- Items list -->
        <div class="queue-items-list">
          <div class="queue-card" *ngFor="let item of filteredItems()">
            <div class="card-top-row">
              <div class="item-icon-chip">
                <!-- Cart icon -->
                <svg *ngIf="item.category === 'purchase'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>

                <!-- Farmer user icon -->
                <svg *ngIf="item.category === 'farmer'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>

                <!-- Audit clipboard icon -->
                <svg *ngIf="item.category === 'audit'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <line x1="8" x2="16" y1="8" y2="8"></line>
                  <line x1="8" x2="16" y1="12" y2="12"></line>
                  <line x1="8" x2="12" y1="16" y2="16"></line>
                </svg>

                <!-- Price icon -->
                <svg *ngIf="item.category === 'price'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 3h12"></path>
                  <path d="M6 8h12"></path>
                  <path d="m6 13 8.5 8"></path>
                  <path d="M6 13h3a4 4 0 0 0 0-8"></path>
                </svg>

                <!-- Inventory icon -->
                <svg *ngIf="item.category === 'inventory'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="M12 22V12"></path>
                </svg>
              </div>

              <div class="card-info-col">
                <div class="item-title-row">
                  <h3 class="item-title">{{ item.title }}</h3>
                  <span class="status-pill" [ngClass]="item.statusType">{{ item.status }}</span>
                </div>
                <div class="item-assignee">{{ item.assignee }}</div>
                <div class="item-identifiers">{{ item.identifiers }}</div>
                <div class="item-note" *ngIf="item.note">{{ item.note }}</div>
                <div class="item-date">{{ item.createdDate }}</div>
              </div>
            </div>

            <a [routerLink]="item.actionLink" (click)="closeModal()" class="card-action-btn">
              {{ item.actionLabel }}
            </a>
          </div>

          <div *ngIf="filteredItems().length === 0" class="empty-queue">
            No work items match "{{ searchTerm() }}"
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WorkQueueModalComponent {
  @Output() close = new EventEmitter<void>();

  readonly searchTerm = signal('');

  readonly items: readonly WorkQueueItem[] = [
    {
      id: '1',
      category: 'purchase',
      title: 'Purchase exception',
      assignee: 'Arun',
      identifiers: 'TSK-PO-2026-00307 · PO-2026-00307',
      note: 'Quality discrepancy recorded',
      createdDate: 'Created 09 Oct 2026',
      status: 'Exception',
      statusType: 'err',
      actionLabel: 'Review Exception',
      actionLink: '/goods-receipts',
    },
    {
      id: '2',
      category: 'farmer',
      title: 'Farmer application',
      assignee: 'Sathish Kumar',
      identifiers: 'TSK-APP-2026-0101 · APP-2026-0101',
      note: 'Awaiting review',
      createdDate: 'Created 05 Oct 2026',
      status: 'Pending',
      statusType: 'warn',
      actionLabel: 'Review Application',
      actionLink: '/farmer-applications',
    },
    {
      id: '3',
      category: 'audit',
      title: 'Audit follow-up',
      assignee: 'Vijay',
      identifiers: 'TSK-AUD-2026-0052 · AUD-2026-0052',
      note: '',
      createdDate: 'Created 08 Oct 2026 · Due 08 Oct 2026',
      status: 'Overdue',
      statusType: 'err',
      actionLabel: 'View Audit',
      actionLink: '/goods-receipts',
    },
  ];

  readonly pendingCount = 6;
  readonly exceptionCount = 3;

  filteredItems(): readonly WorkQueueItem[] {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.assignee.toLowerCase().includes(q) ||
        it.identifiers.toLowerCase().includes(q) ||
        it.note.toLowerCase().includes(q),
    );
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
  }
}
