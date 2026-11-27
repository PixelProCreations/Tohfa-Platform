import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export interface ApprovalRowItem {
  id: string;
  type: string;
  typeIcon: 'payout' | 'transfer' | 'admin' | 'stock' | 'farmer';
  title: string;
  requestedBy: string;
  submitted: string;
  waiting: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Escalated' | 'Pending' | 'Awaiting Review' | 'Approved';
  statusType: 'red' | 'amber' | 'blue' | 'green';
}

@Component({
  selector: 'tohfa-approvals-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font, 'Poppins', sans-serif);
        color: var(--tohfa-ink, #1D2420);
        padding-bottom: 40px;
      }

      * {
        box-sizing: border-box;
      }

      /* Page Header */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 22px;
        gap: 16px;
      }

      .page-title {
        font-size: 22px;
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 4px;
        line-height: 1.2;
      }

      .page-subtitle {
        font-size: 12px;
        font-weight: var(--fw-medium, 500);
        color: var(--tohfa-slate, #5C6B63);
        margin: 0;
      }

      .top-search-wrap {
        position: relative;
        width: 320px;
        max-width: 100%;
      }

      .top-search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--tohfa-muted, #9AA294);
        pointer-events: none;
      }

      .top-search-input {
        width: 100%;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 9px 12px 9px 38px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        color: var(--tohfa-ink, #1D2420);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .top-search-input:focus {
        border-color: var(--tohfa-amber, #E48932);
        box-shadow: 0 0 0 3px rgba(228, 137, 50, 0.15);
      }

      /* 4 Stat Cards Row */
      .kpi-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon-wrap.tint {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
      }

      .stat-icon-wrap.pink {
        background: #FDF2F2;
        color: #B3261E;
      }

      .stat-icon-wrap.yellow {
        background: #FEF8E8;
        color: #C98A02;
      }

      .stat-val {
        font-size: 22px;
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.1;
      }

      .stat-label {
        font-size: 11.5px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
        margin-bottom: 2px;
      }

      /* Filter Bar */
      .filter-bar {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 200px;
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 12px;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 9px 12px 9px 38px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        color: var(--tohfa-ink, #1D2420);
        outline: none;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .search-input:focus {
        border-color: var(--tohfa-amber, #E48932);
        background: #FFFFFF;
      }

      .filter-select {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 9px 12px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11.5px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-ink, #1D2420);
        outline: none;
        cursor: pointer;
      }

      .btn-date-range {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 9px 14px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11.5px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
      }

      .btn-reset {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-amber, #E48932);
        border-radius: var(--r-tab, 9px);
        padding: 8px 14px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-amber, #E48932);
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .btn-reset:hover {
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      /* Table */
      .table-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        overflow: hidden;
      }

      .inbox-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        text-align: left;
      }

      .inbox-table thead th {
        background: var(--tohfa-surface, #FFFFFF);
        padding: 14px 18px;
        font-size: 10px;
        font-weight: var(--fw-xbold, 800);
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: var(--tohfa-slate, #5C6B63);
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .inbox-table tbody tr {
        border-bottom: 1px solid #F0ECE1;
        transition: background 0.12s ease;
      }

      .inbox-table tbody tr:hover {
        background: #FAF8F2;
      }

      .inbox-table tbody tr:last-child {
        border-bottom: none;
      }

      .inbox-table tbody td {
        padding: 14px 18px;
        vertical-align: middle;
        color: var(--tohfa-ink, #1D2420);
      }

      .type-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: var(--fw-bold, 700);
        font-size: 12px;
      }

      .req-title {
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-ink, #1D2420);
        max-width: 380px;
        line-height: 1.35;
      }

      .req-by {
        color: var(--tohfa-slate, #5C6B63);
        font-size: 11.5px;
      }

      .req-submitted {
        color: var(--tohfa-slate, #5C6B63);
        font-size: 11px;
        line-height: 1.3;
      }

      .req-waiting {
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-brown, #8A4E15);
      }

      .priority-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: var(--fw-bold, 700);
        font-size: 11.5px;
      }

      .priority-indicator.high {
        color: var(--err, #B3261E);
      }

      .priority-indicator.medium {
        color: #C98A02;
      }

      .priority-indicator.low {
        color: var(--ok, #1E8E5A);
      }

      .status-pill {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: var(--fw-bold, 700);
      }

      .status-pill.red {
        background: #FDF2F2;
        color: #B3261E;
      }

      .status-pill.amber {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
      }

      .status-pill.blue {
        background: #E8F0FE;
        color: #2C6FB0;
      }

      .status-pill.green {
        background: var(--ok-bg, #E6F5ED);
        color: var(--ok, #1E8E5A);
      }

      .actions-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-view-details {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 6px;
        padding: 6px 12px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn-view-details:hover {
        background: #EAE6DB;
      }

      .btn-review {
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 6px 14px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .btn-review:hover {
        background: var(--tohfa-amber-hover, #C97420);
      }

      /* Table Footer */
      .table-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        border-top: 1px solid var(--tohfa-border, #E4E0D3);
        background: var(--tohfa-surface, #FFFFFF);
      }

      .footer-info {
        font-size: 11.5px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
      }

      .pagination-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .page-btn {
        min-width: 28px;
        height: 28px;
        padding: 0 6px;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        background: var(--tohfa-surface, #FFFFFF);
        border-radius: 6px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-slate, #5C6B63);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .page-btn.active {
        background: #FBEEDE;
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
      }
    `,
  ],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Approvals Inbox</h1>
        <p class="page-subtitle">Review and action pending organisation-wide approvals.</p>
      </div>

      <div class="top-search-wrap">
        <svg class="top-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="top-search-input"
          placeholder="Search farmers, orders, produce"
          [ngModel]="topSearchQuery()"
          (ngModelChange)="topSearchQuery.set($event)"
        />
      </div>
    </div>

    <!-- 4 Stat Cards Row (from Screenshot 1) -->
    <div class="kpi-row">
      <div class="stat-card">
        <div class="stat-icon-wrap tint">
          <!-- Document Icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div>
          <div class="stat-label">Total Pending</div>
          <div class="stat-val">7</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap pink">
          <!-- High Priority Triangle Alert -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div>
          <div class="stat-label">High Priority</div>
          <div class="stat-val">2</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap yellow">
          <!-- Clock Icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div>
          <div class="stat-label">Waiting Over 24h</div>
          <div class="stat-val">1</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap tint">
          <!-- Calendar Icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="21" y1="10" y2="10"></line>
          </svg>
        </div>
        <div>
          <div class="stat-label">Due Today</div>
          <div class="stat-val">4</div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA294" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search approvals..."
          [ngModel]="tableSearchQuery()"
          (ngModelChange)="tableSearchQuery.set($event)"
        />
      </div>

      <select class="filter-select" [ngModel]="selectedType()" (ngModelChange)="selectedType.set($event)">
        <option value="All">Approval Type</option>
        <option value="Payout">Payout</option>
        <option value="Transfer">Transfer</option>
        <option value="Admin">Admin</option>
        <option value="Stock">Stock</option>
        <option value="Farmer">Farmer</option>
      </select>

      <select class="filter-select" [ngModel]="selectedPriority()" (ngModelChange)="selectedPriority.set($event)">
        <option value="All">Priority</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <select class="filter-select" [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)">
        <option value="All">Status</option>
        <option value="Escalated">Escalated</option>
        <option value="Pending">Pending</option>
        <option value="Awaiting Review">Awaiting Review</option>
      </select>

      <button type="button" class="btn-date-range">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
        <span>Select date range</span>
      </button>

      <button type="button" class="btn-reset" (click)="resetFilters()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        <span>Reset Filters</span>
      </button>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <table class="inbox-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Request Details</th>
            <th>Requested By</th>
            <th>Submitted</th>
            <th>Waiting</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of filteredApprovals()">
            <!-- Type -->
            <td>
              <span class="type-chip">
                <!-- Payout icon -->
                <svg *ngIf="row.typeIcon === 'payout'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E48932" stroke-width="2">
                  <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <!-- Transfer icon -->
                <svg *ngIf="row.typeIcon === 'transfer'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C6FB0" stroke-width="2">
                  <path d="m17 2 4 4-4 4"></path>
                  <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                  <path d="m7 22-4-4 4-4"></path>
                  <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                </svg>
                <!-- Admin icon -->
                <svg *ngIf="row.typeIcon === 'admin'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3410" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <!-- Stock icon -->
                <svg *ngIf="row.typeIcon === 'stock'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B3261E" stroke-width="2">
                  <path d="m7.5 4.27 9 5.15"></path>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                </svg>
                <!-- Farmer icon -->
                <svg *ngIf="row.typeIcon === 'farmer'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{{ row.type }}</span>
              </span>
            </td>

            <!-- Request Details -->
            <td>
              <div class="req-title">{{ row.title }}</div>
            </td>

            <!-- Requested By -->
            <td class="req-by">{{ row.requestedBy }}</td>

            <!-- Submitted -->
            <td class="req-submitted">{{ row.submitted }}</td>

            <!-- Waiting -->
            <td class="req-waiting">{{ row.waiting }}</td>

            <!-- Priority -->
            <td>
              <span
                class="priority-indicator"
                [class.high]="row.priority === 'High'"
                [class.medium]="row.priority === 'Medium'"
                [class.low]="row.priority === 'Low'"
              >
                • {{ row.priority }}
              </span>
            </td>

            <!-- Status -->
            <td>
              <span class="status-pill" [ngClass]="row.statusType">{{ row.status }}</span>
            </td>

            <!-- Actions -->
            <td>
              <div class="actions-cell">
                <button type="button" class="btn-view-details" (click)="viewDetails(row)">View Details</button>
                <button type="button" class="btn-review" (click)="review(row)">Review</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Table Footer -->
      <div class="table-footer">
        <span class="footer-info">Showing 1 - 7 of 7</span>
        <div class="pagination-row">
          <button type="button" class="page-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button type="button" class="page-btn active">1</button>
          <button type="button" class="page-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ApprovalsInboxComponent {
  private readonly router = inject(Router);

  readonly topSearchQuery = signal('');
  readonly tableSearchQuery = signal('');
  readonly selectedType = signal('All');
  readonly selectedPriority = signal('All');
  readonly selectedStatus = signal('All');

  readonly approvals = signal<readonly ApprovalRowItem[]>([
    {
      id: 'PAY-2026-00128',
      type: 'Payout',
      typeIcon: 'payout',
      title: 'Farmer payout > ₹10,000 · escalated by TOHFA Admin',
      requestedBy: 'TOHFA Admin',
      submitted: '14 Oct 2026, 12:30 PM',
      waiting: '6h waiting',
      priority: 'High',
      status: 'Escalated',
      statusType: 'red',
    },
    {
      id: 'TRF-2026-00342',
      type: 'Transfer',
      typeIcon: 'transfer',
      title: 'High-value inter-warehouse transfer · Ooty → Coonoor',
      requestedBy: 'Warehouse Admin',
      submitted: '14 Oct 2026, 04:30 PM',
      waiting: '2h waiting',
      priority: 'High',
      status: 'Pending',
      statusType: 'amber',
    },
    {
      id: 'ADM-2026-00089',
      type: 'Admin',
      typeIcon: 'admin',
      title: 'Warehouse admin promotion · Priya Nair → Main Admin',
      requestedBy: 'HR Admin',
      submitted: '13 Oct 2026, 10:15 AM',
      waiting: '1d waiting',
      priority: 'Medium',
      status: 'Pending',
      statusType: 'amber',
    },
    {
      id: 'STK-2026-00512',
      type: 'Stock',
      typeIcon: 'stock',
      title: 'Stock adjustment · Kotagiri Sub, -42 kg Carrot',
      requestedBy: 'Warehouse Admin',
      submitted: '14 Oct 2026, 07:20 AM',
      waiting: '11h waiting',
      priority: 'High',
      status: 'Pending',
      statusType: 'amber',
    },
    {
      id: 'APP-2026-00194',
      type: 'Farmer',
      typeIcon: 'farmer',
      title: 'Farmer application · 3 awaiting final review',
      requestedBy: 'Field Coordinator',
      submitted: '14 Oct 2026, 02:45 PM',
      waiting: '4h waiting',
      priority: 'Medium',
      status: 'Awaiting Review',
      statusType: 'blue',
    },
    {
      id: 'APP-2026-00195',
      type: 'Farmer',
      typeIcon: 'farmer',
      title: 'Farmer application · Ramesh Babu (Zone: Gudalur)',
      requestedBy: 'Field Coordinator',
      submitted: '14 Oct 2026, 11:10 AM',
      waiting: '7h waiting',
      priority: 'Medium',
      status: 'Awaiting Review',
      statusType: 'blue',
    },
    {
      id: 'APP-2026-00196',
      type: 'Farmer',
      typeIcon: 'farmer',
      title: 'Farmer application · Meena Devi (Zone: Coonoor)',
      requestedBy: 'Field Coordinator',
      submitted: '13 Oct 2026, 05:40 PM',
      waiting: '1d 2h waiting',
      priority: 'High',
      status: 'Pending',
      statusType: 'amber',
    },
  ]);

  filteredApprovals(): readonly ApprovalRowItem[] {
    const q = this.tableSearchQuery().toLowerCase().trim();
    const type = this.selectedType();
    const priority = this.selectedPriority();
    const status = this.selectedStatus();

    return this.approvals().filter((item) => {
      if (type !== 'All' && item.type !== type) return false;
      if (priority !== 'All' && item.priority !== priority) return false;
      if (status !== 'All' && item.status !== status) return false;
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchReq = item.requestedBy.toLowerCase().includes(q);
        const matchType = item.type.toLowerCase().includes(q);
        return matchTitle || matchReq || matchType;
      }
      return true;
    });
  }

  viewDetails(row: ApprovalRowItem): void {
    this.router.navigate(['/approvals', row.id], { queryParams: { mode: 'details' } });
  }

  review(row: ApprovalRowItem): void {
    this.router.navigate(['/approvals', row.id], { queryParams: { mode: 'review' } });
  }

  resetFilters(): void {
    this.tableSearchQuery.set('');
    this.selectedType.set('All');
    this.selectedPriority.set('All');
    this.selectedStatus.set('All');
  }
}
