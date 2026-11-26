import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertThresholdModalComponent } from '../dashboard/alert-threshold-modal.component';

export interface TierThresholdItem {
  id: string;
  category: string;
  scoreRange: string;
  effectiveDate: string;
  reason: string;
  status: 'Active' | 'Inactive';
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

@Component({
  selector: 'tohfa-alert-thresholds',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertThresholdModalComponent],
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

      /* Breadcrumbs */
      .breadcrumb-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: var(--fw-semi, 600);
        margin-bottom: 12px;
      }

      .bc-link {
        color: var(--tohfa-slate, #5C6B63);
        text-decoration: none;
      }

      .bc-link:hover {
        color: var(--tohfa-amber, #E48932);
      }

      .bc-sep {
        color: var(--tohfa-muted, #9AA294);
      }

      .bc-orange {
        color: var(--tohfa-amber, #E48932);
        font-weight: var(--fw-bold, 700);
      }

      .bc-current {
        color: var(--tohfa-ink, #1D2420);
        font-weight: var(--fw-bold, 700);
      }

      /* Page Header */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
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

      .btn-add-tier {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        border: none;
        border-radius: var(--r-tab, 9px);
        padding: 10px 18px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12.5px;
        font-weight: var(--fw-bold, 700);
        cursor: pointer;
        transition: background 0.15s ease, transform 0.1s ease;
        box-shadow: 0 4px 12px rgba(228, 137, 50, 0.25);
      }

      .btn-add-tier:hover {
        background: var(--tohfa-amber-hover, #C97420);
      }

      .btn-add-tier:active {
        transform: scale(0.98);
      }

      /* KPI Stat Cards */
      .kpi-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
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
        background: var(--tohfa-amber-tint, #FBEEDE);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--tohfa-amber, #E48932);
        flex-shrink: 0;
      }

      .stat-val {
        font-size: 22px;
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.1;
      }

      .stat-label {
        font-size: 12px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
        margin-top: 3px;
      }

      /* Filter Bar */
      .filter-bar {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
      }

      .search-box {
        flex: 1;
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

      .filter-dropdown {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 4px 10px;
      }

      .filter-dropdown-label {
        font-size: 11px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
      }

      .filter-dropdown-select {
        border: none;
        background: transparent;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        outline: none;
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
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-amber, #E48932);
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .btn-reset:hover {
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      /* Table Container */
      .table-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        overflow: hidden;
      }

      .threshold-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        text-align: left;
      }

      .threshold-table thead th {
        background: var(--tohfa-surface, #FFFFFF);
        padding: 14px 18px;
        font-size: 10.5px;
        font-weight: var(--fw-xbold, 800);
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: var(--tohfa-slate, #5C6B63);
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .threshold-table tbody tr {
        border-bottom: 1px solid #F0ECE1;
        transition: background 0.12s ease;
      }

      .threshold-table tbody tr:hover {
        background: #FAF8F2;
      }

      .threshold-table tbody tr:last-child {
        border-bottom: none;
      }

      .threshold-table tbody td {
        padding: 16px 18px;
        vertical-align: middle;
        color: var(--tohfa-ink, #1D2420);
      }

      .cell-category {
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        font-size: 12.5px;
      }

      .cell-score {
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-ink, #1D2420);
      }

      .cell-date {
        color: var(--tohfa-ink, #1D2420);
      }

      .cell-reason {
        color: var(--tohfa-slate, #5C6B63);
      }

      .cell-updated-by {
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-ink, #1D2420);
      }

      .cell-updated-at {
        font-size: 11px;
        color: var(--tohfa-muted, #9AA294);
        margin-top: 2px;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: var(--fw-bold, 700);
      }

      .status-pill.active {
        background: var(--ok-bg, #E6F5ED);
        color: var(--ok, #1E8E5A);
      }

      .status-pill.inactive {
        background: #F4F3ED;
        color: var(--tohfa-muted, #9AA294);
      }

      .actions-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .btn-edit {
        background: transparent;
        border: none;
        color: var(--tohfa-amber, #E48932);
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        cursor: pointer;
        padding: 0;
      }

      .btn-edit:hover {
        text-decoration: underline;
      }

      .btn-dots {
        background: transparent;
        border: none;
        color: var(--tohfa-muted, #9AA294);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .btn-dots:hover {
        background: #EAE6DB;
        color: var(--tohfa-ink, #1D2420);
      }

      /* Table Pagination Footer */
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
        transition: all 0.15s ease;
      }

      .page-btn:hover {
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
      }

      .page-btn.active {
        background: #FBEEDE;
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
      }

      .page-ellipsis {
        font-size: 12px;
        color: var(--tohfa-muted, #9AA294);
        padding: 0 4px;
      }

      /* Toast notification */
      .toast-msg {
        position: fixed;
        bottom: 28px;
        right: 28px;
        background: #1D2420;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12.5px;
        font-weight: var(--fw-semi, 600);
        z-index: 2000;
        animation: toastSlideUp 0.25s ease-out;
      }

      @keyframes toastSlideUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  template: `
    <!-- Breadcrumb -->
    <div class="breadcrumb-bar">
      <a routerLink="/dashboard" class="bc-link">Dashboard</a>
      <span class="bc-sep">/</span>
      <span class="bc-orange">Module 2</span>
      <span class="bc-sep">/</span>
      <span class="bc-current">Alert Thresholds</span>
    </div>

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Alert Thresholds</h1>
        <p class="page-subtitle">Manage threshold rules and farmer eligibility ranges</p>
      </div>

      <button type="button" class="btn-add-tier" (click)="openAddTier()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add Tier</span>
      </button>
    </div>

    <!-- 3 Stat Cards Row (from Screenshot 1) -->
    <div class="kpi-row">
      <div class="stat-card">
        <div class="stat-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div>
          <div class="stat-val">24</div>
          <div class="stat-label">Farmers</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div>
          <div class="stat-val">24 <span style="font-size: 15px; font-weight: 600; color: #5C6B63;">of 24</span></div>
          <div class="stat-label">Farmers</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="stat-val">5</div>
          <div class="stat-label">Active Tiers</div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA294" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search threshold or reason..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
        />
      </div>

      <div class="filter-dropdown">
        <span class="filter-dropdown-label">Status</span>
        <select
          class="filter-dropdown-select"
          [ngModel]="selectedStatus()"
          (ngModelChange)="selectedStatus.set($event)"
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div class="filter-dropdown">
        <span class="filter-dropdown-label">Category</span>
        <select
          class="filter-dropdown-select"
          [ngModel]="selectedCategory()"
          (ngModelChange)="selectedCategory.set($event)"
        >
          <option value="All">All</option>
          <option value="Audit">Audit</option>
          <option value="Soil Test">Soil Test</option>
          <option value="FMB Verification">FMB Verification</option>
          <option value="KYC Verification">KYC Verification</option>
          <option value="Farmer Rating">Farmer Rating</option>
        </select>
      </div>

      <button type="button" class="btn-reset" (click)="resetFilters()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        <span>Reset</span>
      </button>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <table class="threshold-table">
        <thead>
          <tr>
            <th>Threshold / Category</th>
            <th>Score Range</th>
            <th>Effective Date</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of filteredTiers()">
            <td class="cell-category">{{ row.category }}</td>
            <td class="cell-score">{{ row.scoreRange }}</td>
            <td class="cell-date">{{ row.effectiveDate }}</td>
            <td class="cell-reason">{{ row.reason }}</td>
            <td>
              <span class="status-pill" [class.active]="row.status === 'Active'" [class.inactive]="row.status === 'Inactive'">
                {{ row.status }}
              </span>
            </td>
            <td>
              <div class="cell-updated-by">{{ row.lastUpdatedBy }}</div>
              <div class="cell-updated-at">{{ row.lastUpdatedAt }}</div>
            </td>
            <td>
              <div class="actions-cell">
                <button type="button" class="btn-edit" (click)="openAddTier()">Edit</button>
                <button type="button" class="btn-dots">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Footer -->
      <div class="table-footer">
        <span class="footer-info">Showing 1–5 of 24 farmers/tiers</span>
        <div class="pagination-row">
          <button type="button" class="page-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button type="button" class="page-btn active">1</button>
          <button type="button" class="page-btn">2</button>
          <button type="button" class="page-btn">3</button>
          <span class="page-ellipsis">...</span>
          <button type="button" class="page-btn">5</button>
          <button type="button" class="page-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL (From Screenshot 4 & 5) -->
    <tohfa-alert-threshold-modal
      *ngIf="addTierModalOpen()"
      (close)="addTierModalOpen.set(false)"
      (saved)="onTierSaved()"
    />

    <!-- Toast Notification -->
    <div class="toast-msg" *ngIf="toastMessage()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8ED18C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{{ toastMessage() }}</span>
    </div>
  `,
})
export class AlertThresholdsComponent {
  readonly addTierModalOpen = signal(false);
  readonly searchQuery = signal('');
  readonly selectedStatus = signal('All');
  readonly selectedCategory = signal('All');
  readonly toastMessage = signal<string | null>(null);

  readonly tiers = signal<readonly TierThresholdItem[]>([
    {
      id: '1',
      category: 'Audit',
      scoreRange: '64 — 92',
      effectiveDate: '15 Oct 2026',
      reason: 'Good for farmer',
      status: 'Active',
      lastUpdatedBy: 'Demo Super Admin',
      lastUpdatedAt: '14 Oct 2026, 10:00',
    },
    {
      id: '2',
      category: 'Soil Test',
      scoreRange: '60 — 90',
      effectiveDate: '15 Oct 2026',
      reason: 'Soil quality assessment',
      status: 'Active',
      lastUpdatedBy: 'Demo Super Admin',
      lastUpdatedAt: '14 Oct 2026, 10:00',
    },
    {
      id: '3',
      category: 'FMB Verification',
      scoreRange: '65 — 95',
      effectiveDate: '15 Oct 2026',
      reason: 'Land verification',
      status: 'Active',
      lastUpdatedBy: 'Demo Super Admin',
      lastUpdatedAt: '14 Oct 2026, 10:00',
    },
    {
      id: '4',
      category: 'KYC Verification',
      scoreRange: '70 — 100',
      effectiveDate: '15 Oct 2026',
      reason: 'Farmer document verification',
      status: 'Active',
      lastUpdatedBy: 'Demo Super Admin',
      lastUpdatedAt: '14 Oct 2026, 10:00',
    },
    {
      id: '5',
      category: 'Farmer Rating',
      scoreRange: '50 — 85',
      effectiveDate: '15 Oct 2026',
      reason: 'Farmer performance evaluation',
      status: 'Active',
      lastUpdatedBy: 'Demo Super Admin',
      lastUpdatedAt: '14 Oct 2026, 10:00',
    },
  ]);

  filteredTiers(): readonly TierThresholdItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.selectedStatus();
    const cat = this.selectedCategory();

    return this.tiers().filter((item) => {
      if (st !== 'All' && item.status !== st) return false;
      if (cat !== 'All' && item.category !== cat) return false;
      if (q) {
        const matchCat = item.category.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        const matchScore = item.scoreRange.toLowerCase().includes(q);
        return matchCat || matchReason || matchScore;
      }
      return true;
    });
  }

  openAddTier(): void {
    this.addTierModalOpen.set(true);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('All');
    this.selectedCategory.set('All');
  }

  onTierSaved(): void {
    this.toastMessage.set('Alert threshold saved successfully');
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
