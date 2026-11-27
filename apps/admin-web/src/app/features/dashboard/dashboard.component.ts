import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertThresholdModalComponent } from './alert-threshold-modal.component';
import { MarketControlModalComponent, MarketModalMode } from './market-control-modal.component';
import { WorkQueueModalComponent } from './work-queue-modal.component';

interface KpiItem {
  label: string;
  value: string;
  sub: string;
  subType: 'ok' | 'warn' | 'err' | 'neutral';
  icon: string;
}

interface ApprovalItem {
  id: string;
  title: string;
  source: string;
  wait: string;
  waitType: 'amber' | 'blue' | 'tint' | 'red';
  icon: string;
}

interface ZoneHealthItem {
  zone: string;
  farmers: number;
  status: string;
  statusType: 'ok' | 'warn' | 'neutral';
}

interface ActivityItem {
  title: string;
  meta: string;
  badge?: string;
  badgeType?: 'ok' | 'info' | 'warn' | 'err';
  dotColor: string;
}

interface ScheduleItem {
  name: string;
  time: string;
  type: 'open' | 'close';
  status: string;
}

interface QuickAction {
  label: string;
  icon: string;
  link?: string;
  action?: 'workQueue' | 'alertThresholds';
}

@Component({
  selector: 'tohfa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, WorkQueueModalComponent, AlertThresholdModalComponent, MarketControlModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font, 'Poppins', sans-serif);
        color: var(--tohfa-ink, #1D2420);
      }

      * {
        box-sizing: border-box;
      }

      /* Page Header */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .page-header-title {
        font-size: var(--fs-page, 16px);
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 4px;
        line-height: 1.2;
      }

      .page-header-sub {
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
        margin: 0;
      }

      .date-select-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 8px 14px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .date-select-btn:hover {
        background: var(--tohfa-page, #F7F5EE);
        border-color: var(--tohfa-amber, #E48932);
      }

      .date-select-btn svg {
        color: var(--tohfa-muted, #9AA294);
      }

      /* 6-Column KPI Grid */
      .kpi-row {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
        margin-bottom: 18px;
      }

      .kpi-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 15px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 110px;
        box-shadow: none;
      }

      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .kpi-label {
        font-size: var(--fs-label, 10.5px);
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-slate, #5C6B63);
      }

      .kpi-icon-chip {
        width: 28px;
        height: 28px;
        border-radius: var(--r-sm, 8px);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }

      .kpi-icon-chip.ok { background: var(--ok-bg, #E6F5ED); color: var(--ok, #1E8E5A); }
      .kpi-icon-chip.warn { background: var(--warn-bg, #FDF3DC); color: var(--warn, #C98A02); }
      .kpi-icon-chip.err { background: var(--err-bg, #FDECEC); color: var(--err, #B3261E); }
      .kpi-icon-chip.neutral { background: var(--tohfa-amber-tint, #FBEEDE); color: var(--tohfa-brown, #8A4E15); }

      .kpi-val {
        font-size: var(--fs-kpi, 24px);
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.1;
        margin: 8px 0 4px;
      }

      .kpi-sub {
        font-size: 10px;
        font-weight: var(--fw-bold, 700);
        line-height: 1.2;
      }

      .kpi-sub.ok { color: var(--ok, #1E8E5A); }
      .kpi-sub.warn { color: var(--warn, #C98A02); }
      .kpi-sub.err { color: var(--err, #B3261E); }
      .kpi-sub.neutral { color: var(--tohfa-slate, #5C6B63); }

      /* Section Rhythm */
      .section-row {
        display: grid;
        gap: 14px;
        margin-bottom: 18px;
      }

      .row-1-6-1 { grid-template-columns: 1.6fr 1fr; }
      .row-1-1 { grid-template-columns: 1fr 1fr; }
      .row-1-1-6 { grid-template-columns: 1fr 1.6fr; }
      .row-1-2-1-8 { grid-template-columns: 1.2fr 1.8fr; }

      /* Cards Common */
      .dash-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 18px;
        box-shadow: none;
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .card-title {
        font-size: var(--fs-card, 14px);
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
        line-height: 1.3;
      }

      .card-action-link {
        font-size: var(--fs-cap, 11px);
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-brown, #8A4E15);
        text-decoration: underline;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
      }

      .card-action-link:hover {
        color: var(--tohfa-brown-deep, #5C3410);
      }

      /* Chart Legends */
      .chart-legend {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .legend-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .time-btn-sm {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-sm, 8px);
        padding: 4px 10px;
        font-size: 10.5px;
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
      }

      /* Segmented Bar (Admins by Role) */
      .segmented-total {
        font-size: var(--fs-kpi, 24px);
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 12px;
      }

      .segmented-total span {
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-slate, #5C6B63);
      }

      .segmented-bar {
        display: flex;
        height: 9px;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 16px;
        gap: 2px;
      }

      .bar-seg {
        height: 100%;
        transition: width 0.3s ease;
      }

      .role-legend-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .role-legend-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: var(--fs-dense, 11.5px);
      }

      .role-legend-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--tohfa-slate, #5C6B63);
        font-weight: var(--fw-semi, 600);
      }

      .role-legend-count {
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
      }

      /* Approvals Inbox list */
      .inbox-list {
        display: flex;
        flex-direction: column;
      }

      .inbox-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--tohfa-divider, #F0EEE4);
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .inbox-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .inbox-item:hover {
        background: rgba(247, 245, 238, 0.4);
      }

      .inbox-icon {
        width: 28px;
        height: 28px;
        border-radius: var(--r-sm, 8px);
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-brown, #8A4E15);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }

      .inbox-title {
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .waiting-chip {
        display: inline-flex;
        align-items: center;
        padding: 3px 9px;
        border-radius: var(--r-badge-sm, 6px);
        font-size: 10px;
        font-weight: var(--fw-xbold, 800);
        white-space: nowrap;
      }

      .waiting-chip.amber {
        background: var(--warn-bg, #FDF3DC);
        color: var(--warn, #C98A02);
      }

      .waiting-chip.blue {
        background: var(--info-bg, #E4EDF5);
        color: var(--info, #2C6FB0);
      }

      .waiting-chip.tint {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-brown, #8A4E15);
      }

      .waiting-chip.red {
        background: var(--err-bg, #FDECEC);
        color: var(--err, #B3261E);
      }

      .inbox-chevron {
        color: var(--tohfa-muted, #9AA294);
        flex: none;
      }

      /* Zone Health Table */
      .health-table {
        width: 100%;
        border-collapse: collapse;
      }

      .health-table th {
        text-align: left;
        font-size: var(--fs-table-header, 9.5px);
        font-weight: var(--fw-xbold, 800);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        color: var(--tohfa-muted, #9AA294);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .health-table td {
        padding: 11px 0;
        border-bottom: 1px solid var(--tohfa-divider, #F0EEE4);
        font-size: 12px;
        color: var(--tohfa-ink, #1D2420);
      }

      .health-table tr:last-child td {
        border-bottom: none;
      }

      .badge-pill {
        display: inline-flex;
        align-items: center;
        padding: 3px 9px;
        border-radius: var(--r-badge-sm, 6px);
        font-size: 10px;
        font-weight: var(--fw-bold, 700);
      }

      .badge-pill.ok {
        background: var(--ok-bg, #E6F5ED);
        color: var(--ok, #1E8E5A);
        border: 1px solid var(--ok-bd, #BFE4CF);
      }

      .badge-pill.warn {
        background: var(--warn-bg, #FDF3DC);
        color: var(--warn, #C98A02);
        border: 1px solid var(--warn-bd, #F6D9B3);
      }

      .badge-pill.err {
        background: var(--err-bg, #FDECEC);
        color: var(--err, #B3261E);
        border: 1px solid var(--err-bd, #F3C1C1);
      }

      .badge-pill.info {
        background: var(--info-bg, #E4EDF5);
        color: var(--info, #2C6FB0);
        border: 1px solid var(--info-bd, #D7E8F5);
      }

      .badge-pill.neutral {
        background: var(--tohfa-divider, #F0EEE4);
        color: var(--tohfa-slate, #5C6B63);
      }

      /* Donut Chart (Revenue by Channel) */
      .donut-wrap {
        display: flex;
        align-items: center;
        justify-content: space-around;
        gap: 16px;
      }

      .donut-legend {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .donut-legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
      }

      .donut-legend-item span.pct {
        font-weight: var(--fw-xbold, 800);
        margin-left: 6px;
      }

      /* Activity Feed */
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .activity-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--tohfa-divider, #F0EEE4);
      }

      .activity-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .activity-left {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .activity-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        margin-top: 5px;
        flex: none;
      }

      .activity-text {
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-semi, 600);
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.35;
      }

      .activity-meta {
        font-size: 10px;
        color: var(--tohfa-slate, #5C6B63);
        margin-top: 2px;
      }

      /* Market Control Card */
      .market-status-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }

      .market-open-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--ok-bg, #E6F5ED);
        color: var(--ok, #1E8E5A);
        border: 1px solid var(--ok-bd, #BFE4CF);
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: var(--fw-bold, 700);
      }

      .market-open-chip.closed {
        background: var(--err-bg, #FDF2F2);
        color: var(--err, #B3261E);
        border-color: var(--err-bd, #F5C6C6);
      }

      .market-open-chip.closed .market-dot {
        background: #B3261E;
      }

      .market-btn-group {
        display: flex;
        gap: 10px;
        margin: 16px 0;
      }

      .btn-outline-cancel {
        flex: 1;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-md, 10px);
        padding: 10px 14px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
      }

      .btn-amber-action {
        flex: 1.3;
        background: var(--tohfa-amber, #E48932);
        border: none;
        border-radius: var(--r-md, 10px);
        padding: 10px 14px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: #ffffff;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .btn-amber-action:hover {
        background: var(--tohfa-amber-hover, #C97420);
      }

      .schedule-sec-title {
        font-size: 10px;
        font-weight: var(--fw-xbold, 800);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--tohfa-muted, #9AA294);
        margin: 16px 0 10px;
      }

      .schedule-item {
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .schedule-item:hover {
        background: #F1ECE0;
        border-color: #D6D0C0;
      }

      .schedule-item:last-child {
        margin-bottom: 0;
      }

      .schedule-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .schedule-icon {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--tohfa-slate, #5C6B63);
      }

      .schedule-name {
        font-size: var(--fs-dense, 11.5px);
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
      }

      .schedule-time {
        font-size: 10px;
        color: var(--tohfa-slate, #5C6B63);
        margin-top: 1px;
      }

      /* Quick Actions Grid (3x3) */
      .quick-actions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .action-tile {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 14px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 8px;
        cursor: pointer;
        text-decoration: none;
        font-family: inherit;
        appearance: none;
        width: 100%;
        transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
      }

      .action-tile:hover {
        border-color: var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber-tint, #FBEEDE);
        transform: translateY(-2px);
      }

      .toast-msg {
        position: fixed;
        bottom: 24px;
        right: 28px;
        background: var(--tohfa-ink, #1D2420);
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 1200;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeInToast 0.2s ease;
      }

      @keyframes fadeInToast {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .action-tile-icon {
        color: var(--tohfa-slate, #5C6B63);
      }

      .action-tile:hover .action-tile-icon {
        color: var(--tohfa-amber, #E48932);
      }

      .action-tile-label {
        font-size: 11px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.25;
      }

      /* Responsive */
      @media (max-width: 1200px) {
        .kpi-row { grid-template-columns: repeat(3, 1fr); }
        .row-1-6-1, .row-1-1, .row-1-1-6, .row-1-2-1-8 { grid-template-columns: 1fr; }
      }
    `,
  ],
  template: `
    <!-- Top Bar with Title and Date Filter -->
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Super Admin Dashboard</h1>
        <p class="page-header-sub">Module 2 · Role-Based Dashboards — platform-wide view across all roles, modules and approvals.</p>
      </div>

      <button class="date-select-btn" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
        <span>Oct 1 – Oct 31, 2026</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>

    <!-- 6 KPI CARDS -->
    <div class="kpi-row">
      <div class="kpi-card" *ngFor="let kpi of kpis">
        <div class="kpi-top">
          <span class="kpi-label">{{ kpi.label }}</span>
          <div class="kpi-icon-chip" [ngClass]="kpi.subType">
            <!-- Dynamic Mini Icon -->
            <svg *ngIf="kpi.icon === 'admin'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <svg *ngIf="kpi.icon === 'farmer'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 20a6 6 0 0 0-12 0"></path>
              <circle cx="12" cy="10" r="4"></circle>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <svg *ngIf="kpi.icon === 'inbox'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
            <svg *ngIf="kpi.icon === 'warehouse'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <svg *ngIf="kpi.icon === 'revenue'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" x2="12" y1="2" y2="22"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <svg *ngIf="kpi.icon === 'dispute'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m14 13-7.5 7.5"></path>
              <path d="m16 9 3 3"></path>
              <path d="m19 6 2 2"></path>
              <path d="m8.5 7.5 5 5"></path>
            </svg>
          </div>
        </div>
        <div class="kpi-val">{{ kpi.value }}</div>
        <div class="kpi-sub" [ngClass]="kpi.subType">{{ kpi.sub }}</div>
      </div>
    </div>

    <!-- ROW 1: PLATFORM SALES & PROCUREMENT CHART + ADMINS BY ROLE -->
    <div class="section-row row-1-6-1">
      <!-- Sales & Procurement Line Chart -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Platform Sales & Procurement</h3>
          <div class="chart-legend">
            <span class="legend-pill">
              <span class="legend-dot" style="background: var(--tohfa-amber, #E48932);"></span>
              Sales (₹)
            </span>
            <span class="legend-pill">
              <span class="legend-dot" style="background: var(--info, #2C6FB0);"></span>
              Procurement (₹)
            </span>
            <button class="time-btn-sm" type="button">Last 30 days</button>
          </div>
        </div>

        <!-- SVG Line Chart with Crisp Paths and Floating Tooltip -->
        <div style="position: relative; width: 100%; height: 210px;">
          <svg width="100%" height="180" viewBox="0 0 650 180" preserveAspectRatio="none" style="overflow: visible;">
            <!-- Grid Lines -->
            <line x1="0" y1="30" x2="650" y2="30" stroke="#F0EEE4" stroke-width="1"></line>
            <line x1="0" y1="80" x2="650" y2="80" stroke="#F0EEE4" stroke-width="1"></line>
            <line x1="0" y1="130" x2="650" y2="130" stroke="#F0EEE4" stroke-width="1"></line>

            <!-- Sales Line (Amber #E48932) -->
            <path
              d="M 20 130 Q 90 115 160 120 T 300 80 T 450 70 T 560 30 T 630 45"
              fill="none"
              stroke="#E48932"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>

            <!-- Procurement Line (Blue #2C6FB0) -->
            <path
              d="M 20 160 Q 90 150 160 155 T 300 135 T 450 135 T 560 95 L 630 95"
              fill="none"
              stroke="#2C6FB0"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>

            <!-- End Dots -->
            <circle cx="560" cy="30" r="4.5" fill="#E48932"></circle>
            <circle cx="560" cy="95" r="4.5" fill="#2C6FB0"></circle>
          </svg>

          <!-- Floating Tooltip Box matching Design -->
          <div style="position: absolute; right: 55px; top: 12px; background: #1D2420; color: #FFFFFF; padding: 6px 12px; border-radius: 7px; font-size: 10px; font-weight: 700; line-height: 1.4; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <div>Sales ₹18.4L (platform)</div>
            <div style="color: #9AA294;">Procure ₹11.1L (platform)</div>
          </div>

          <!-- X-Axis Labels -->
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #9AA294; font-weight: 700; margin-top: 6px;">
            <span>Oct 1</span>
            <span>Oct 31</span>
          </div>
        </div>
      </div>

      <!-- Admins by Role Card -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Admins by Role</h3>
          <button class="card-action-link" type="button">Manage</button>
        </div>

        <div class="segmented-total">
          38 <span>total admins</span>
        </div>

        <!-- Segmented Bar -->
        <div class="segmented-bar">
          <div class="bar-seg" style="width: 5%; background: var(--tohfa-brown, #8A4E15);"></div>
          <div class="bar-seg" style="width: 21%; background: var(--tohfa-amber, #E48932);"></div>
          <div class="bar-seg" style="width: 32%; background: var(--info, #2C6FB0);"></div>
          <div class="bar-seg" style="width: 16%; background: var(--ok, #1E8E5A);"></div>
          <div class="bar-seg" style="width: 26%; background: var(--warn, #C98A02);"></div>
        </div>

        <!-- Breakdown List -->
        <div class="role-legend-list">
          <div class="role-legend-item">
            <span class="role-legend-label">
              <span class="legend-dot" style="background: var(--tohfa-brown, #8A4E15);"></span>
              Super Admins
            </span>
            <span class="role-legend-count">2</span>
          </div>
          <div class="role-legend-item">
            <span class="role-legend-label">
              <span class="legend-dot" style="background: var(--tohfa-amber, #E48932);"></span>
              TOHFA Admins
            </span>
            <span class="role-legend-count">8</span>
          </div>
          <div class="role-legend-item">
            <span class="role-legend-label">
              <span class="legend-dot" style="background: var(--info, #2C6FB0);"></span>
              Farmer Admins
            </span>
            <span class="role-legend-count">12</span>
          </div>
          <div class="role-legend-item">
            <span class="role-legend-label">
              <span class="legend-dot" style="background: var(--ok, #1E8E5A);"></span>
              Main Warehouse Admins
            </span>
            <span class="role-legend-count">6</span>
          </div>
          <div class="role-legend-item">
            <span class="role-legend-label">
              <span class="legend-dot" style="background: var(--warn, #C98A02);"></span>
              Sub Warehouse Admins
            </span>
            <span class="role-legend-count">10</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ROW 2: APPROVALS INBOX + ZONE & WAREHOUSE HEALTH -->
    <div class="section-row row-1-1">
      <!-- Approvals Inbox -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Approvals Inbox</h3>
          <a class="card-action-link" routerLink="/approvals" style="text-decoration: none;">View All (7)</a>
        </div>

        <div class="inbox-list">
          <div class="inbox-item" *ngFor="let item of approvals" (click)="onApprovalItemClick(item)" style="cursor: pointer;">
            <div class="inbox-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>
            <div class="inbox-title">{{ item.title }}</div>
            <span class="waiting-chip" [ngClass]="item.waitType">{{ item.wait }}</span>
            <svg class="inbox-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <!-- Zone & Warehouse Health -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Zone & Warehouse Health</h3>
          <button class="card-action-link" type="button">Open Map</button>
        </div>

        <table class="health-table">
          <thead>
            <tr>
              <th>ZONE</th>
              <th>FARMERS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let z of zones">
              <td style="font-weight: 700;">{{ z.zone }}</td>
              <td style="font-weight: 700;">{{ z.farmers }}</td>
              <td>
                <span class="badge-pill" [ngClass]="z.statusType">{{ z.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ROW 3: REVENUE BY CHANNEL + PLATFORM ACTIVITY (From Image 2) -->
    <div class="section-row row-1-1-6">
      <!-- Revenue by Channel (Donut Chart) -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Revenue by Channel</h3>
        </div>

        <div class="donut-wrap">
          <!-- Inline SVG Donut Chart -->
          <svg width="124" height="124" viewBox="0 0 36 36">
            <!-- Background circle -->
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#F0EEE4"
              stroke-width="5"
            ></path>
            <!-- Direct Sales (42% Amber) -->
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E48932"
              stroke-width="5"
              stroke-dasharray="42, 100"
            ></path>
            <!-- Online Orders (26% Blue) -->
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#2C6FB0"
              stroke-width="5"
              stroke-dasharray="26, 100"
              stroke-dashoffset="-42"
            ></path>
            <!-- Market Sales (20% Green) -->
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#1E8E5A"
              stroke-width="5"
              stroke-dasharray="20, 100"
              stroke-dashoffset="-68"
            ></path>
            <!-- B2B (12% Purple) -->
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#6B4FA0"
              stroke-width="5"
              stroke-dasharray="12, 100"
              stroke-dashoffset="-88"
            ></path>
          </svg>

          <!-- Legend -->
          <div class="donut-legend">
            <div class="donut-legend-item">
              <span class="legend-dot" style="background: #E48932;"></span>
              <span>Direct Sales</span>
              <span class="pct">42%</span>
            </div>
            <div class="donut-legend-item">
              <span class="legend-dot" style="background: #2C6FB0;"></span>
              <span>Online Orders</span>
              <span class="pct">26%</span>
            </div>
            <div class="donut-legend-item">
              <span class="legend-dot" style="background: #1E8E5A;"></span>
              <span>Market Sales</span>
              <span class="pct">20%</span>
            </div>
            <div class="donut-legend-item">
              <span class="legend-dot" style="background: #6B4FA0;"></span>
              <span>B2B / HORECA</span>
              <span class="pct">12%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Platform Activity Feed -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Platform Activity</h3>
        </div>

        <div class="activity-list">
          <div class="activity-item" *ngFor="let act of activities">
            <div class="activity-left">
              <span class="activity-dot" [style.background]="act.dotColor"></span>
              <div>
                <div class="activity-text">{{ act.title }}</div>
                <div class="activity-meta">{{ act.meta }}</div>
              </div>
            </div>
            <span *ngIf="act.badge" class="badge-pill" [ngClass]="act.badgeType">{{ act.badge }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ROW 4: MARKET CONTROL + QUICK ACTIONS (From Image 2) -->
    <div class="section-row row-1-2-1-8">
      <!-- Market Control -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Market Control</h3>
          <span class="market-open-chip" [class.closed]="!isMarketOpen()">
            <span class="market-dot" [style.background]="isMarketOpen() ? '#1E8E5A' : '#B3261E'" style="width: 6px; height: 6px; border-radius: 50%;"></span>
            {{ isMarketOpen() ? 'Market is Open' : 'Market is Closed' }}
          </span>
        </div>
        <p style="font-size: 11.5px; color: var(--tohfa-slate, #5C6B63); margin: 0 0 14px;">
          Manage live market availability for customers.
        </p>

        <div class="market-btn-group">
          <button class="btn-outline-cancel" type="button" (click)="onMarketToggleClick()">
            {{ isMarketOpen() ? 'Close Market' : 'Open Market' }}
          </button>
          <button class="btn-amber-action" type="button" (click)="openMarketSchedule('open')">
            Schedule Open / Close
          </button>
        </div>

        <div class="schedule-sec-title">Upcoming Schedules</div>

        <div class="schedule-item" *ngFor="let s of schedules" (click)="openMarketSchedule(s.type)">
          <div class="schedule-left">
            <div class="schedule-icon">
              <!-- Lock icon -->
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <div class="schedule-name">{{ s.name }}</div>
              <div class="schedule-time">{{ s.time }}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-pill ok">{{ s.status }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA294" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Actions (3x3 Grid) -->
      <div class="dash-card">
        <div class="card-head">
          <h3 class="card-title">Quick Actions</h3>
        </div>

        <div class="quick-actions-grid">
          <ng-container *ngFor="let qa of quickActions">
            <button
              *ngIf="qa.action"
              type="button"
              class="action-tile"
              (click)="handleQuickAction(qa.action)"
            >
              <div class="action-tile-icon">
                <svg *ngIf="qa.icon === 'person_add'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" x2="19" y1="8" y2="14"></line>
                  <line x1="22" x2="16" y1="11" y2="11"></line>
                </svg>
                <svg *ngIf="qa.icon === 'inbox'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
                <svg *ngIf="qa.icon === 'tag'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                  <path d="M7 7h.01"></path>
                </svg>
                <svg *ngIf="qa.icon === 'donut'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
                <svg *ngIf="qa.icon === 'sync'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m17 2 4 4-4 4"></path>
                  <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                  <path d="m7 22-4-4 4-4"></path>
                  <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                </svg>
                <svg *ngIf="qa.icon === 'tune'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="21" x2="14" y1="4" y2="4"></line>
                  <line x1="10" x2="3" y1="4" y2="4"></line>
                  <line x1="21" x2="12" y1="12" y2="12"></line>
                  <line x1="8" x2="3" y1="12" y2="12"></line>
                  <line x1="21" x2="16" y1="20" y2="20"></line>
                  <line x1="12" x2="3" y1="20" y2="20"></line>
                </svg>
                <svg *ngIf="qa.icon === 'cash'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
                <svg *ngIf="qa.icon === 'work'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                  <line x1="8" x2="16" y1="6" y2="6"></line>
                  <line x1="8" x2="16" y1="10" y2="10"></line>
                  <line x1="8" x2="12" y1="14" y2="14"></line>
                </svg>
                <svg *ngIf="qa.icon === 'map'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" x2="9" y1="3" y2="18"></line>
                  <line x1="15" x2="15" y1="6" y2="21"></line>
                </svg>
                <svg *ngIf="qa.icon === 'report'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" x2="8" y1="13" y2="13"></line>
                  <line x1="16" x2="8" y1="17" y2="17"></line>
                </svg>
              </div>
              <div class="action-tile-label">{{ qa.label }}</div>
            </button>

            <a
              *ngIf="!qa.action"
              [routerLink]="qa.link"
              class="action-tile"
            >
              <div class="action-tile-icon">
                <svg *ngIf="qa.icon === 'person_add'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" x2="19" y1="8" y2="14"></line>
                  <line x1="22" x2="16" y1="11" y2="11"></line>
                </svg>
                <svg *ngIf="qa.icon === 'inbox'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
                <svg *ngIf="qa.icon === 'tag'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                  <path d="M7 7h.01"></path>
                </svg>
                <svg *ngIf="qa.icon === 'donut'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
                <svg *ngIf="qa.icon === 'sync'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m17 2 4 4-4 4"></path>
                  <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                  <path d="m7 22-4-4 4-4"></path>
                  <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                </svg>
                <svg *ngIf="qa.icon === 'tune'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="21" x2="14" y1="4" y2="4"></line>
                  <line x1="10" x2="3" y1="4" y2="4"></line>
                  <line x1="21" x2="12" y1="12" y2="12"></line>
                  <line x1="8" x2="3" y1="12" y2="12"></line>
                  <line x1="21" x2="16" y1="20" y2="20"></line>
                  <line x1="12" x2="3" y1="20" y2="20"></line>
                </svg>
                <svg *ngIf="qa.icon === 'cash'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
                <svg *ngIf="qa.icon === 'work'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                  <line x1="8" x2="16" y1="6" y2="6"></line>
                  <line x1="8" x2="16" y1="10" y2="10"></line>
                  <line x1="8" x2="12" y1="14" y2="14"></line>
                </svg>
                <svg *ngIf="qa.icon === 'map'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" x2="9" y1="3" y2="18"></line>
                  <line x1="15" x2="15" y1="6" y2="21"></line>
                </svg>
                <svg *ngIf="qa.icon === 'report'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" x2="8" y1="13" y2="13"></line>
                  <line x1="16" x2="8" y1="17" y2="17"></line>
                </svg>
              </div>
              <div class="action-tile-label">{{ qa.label }}</div>
            </a>
          </ng-container>
        </div>
      </div>
    </div>

    <!-- MODALS -->
    <tohfa-work-queue-modal
      *ngIf="workQueueModalOpen()"
      (close)="workQueueModalOpen.set(false)"
    />

    <tohfa-alert-threshold-modal
      *ngIf="alertThresholdModalOpen()"
      (close)="alertThresholdModalOpen.set(false)"
      (saved)="onThresholdSaved()"
    />

    <tohfa-market-control-modal
      *ngIf="marketControlModalOpen()"
      [mode]="marketControlModalMode()"
      (close)="marketControlModalOpen.set(false)"
      (marketStatusChanged)="onMarketStatusChanged($event)"
    />

    <!-- TOAST NOTIFICATION -->
    <div class="toast-msg" *ngIf="toastMessage()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8ED18C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{{ toastMessage() }}</span>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly workQueueModalOpen = signal(false);
  readonly alertThresholdModalOpen = signal(false);
  readonly isMarketOpen = signal(true);
  readonly marketControlModalOpen = signal(false);
  readonly marketControlModalMode = signal<MarketModalMode>('schedule_open');
  readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    const path = window.location.pathname;
    if (path.includes('work-queue')) {
      this.workQueueModalOpen.set(true);
    } else if (path.includes('alert-thresholds')) {
      this.router.navigate(['/alert-thresholds']);
    }

    this.route.queryParams.subscribe((params) => {
      if (params['modal'] === 'work-queue') {
        this.workQueueModalOpen.set(true);
      } else if (params['modal'] === 'alert-thresholds') {
        this.router.navigate(['/alert-thresholds']);
      } else if (params['modal'] === 'market-schedule') {
        this.openMarketSchedule('open');
      } else if (params['modal'] === 'market-close') {
        this.onMarketToggleClick();
      }
    });
  }

  handleQuickAction(action?: 'workQueue' | 'alertThresholds'): void {
    if (action === 'workQueue') {
      this.workQueueModalOpen.set(true);
    } else if (action === 'alertThresholds') {
      this.router.navigate(['/alert-thresholds']);
    }
  }

  onApprovalItemClick(item: ApprovalItem): void {
    if (item.id === '1') {
      this.router.navigate(['/approvals']);
    } else {
      this.workQueueModalOpen.set(true);
    }
  }

  onMarketToggleClick(): void {
    if (this.isMarketOpen()) {
      this.marketControlModalMode.set('confirm_close');
    } else {
      this.marketControlModalMode.set('confirm_open');
    }
    this.marketControlModalOpen.set(true);
  }

  openMarketSchedule(type: 'open' | 'close'): void {
    this.marketControlModalMode.set(type === 'open' ? 'schedule_open' : 'schedule_close');
    this.marketControlModalOpen.set(true);
  }

  onMarketStatusChanged(isOpen: boolean): void {
    this.isMarketOpen.set(isOpen);
    this.toastMessage.set(isOpen ? 'Market opened successfully!' : 'Market closed successfully!');
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  onThresholdSaved(): void {
    this.toastMessage.set('Alert threshold saved successfully');
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  readonly kpis: readonly KpiItem[] = [
    { label: 'Total Admins', value: '38', sub: '5 roles active', subType: 'ok', icon: 'admin' },
    { label: 'Total Farmers', value: '260', sub: '248 active', subType: 'ok', icon: 'farmer' },
    { label: 'Approvals Pending', value: '7', sub: 'Needs Super Admin', subType: 'warn', icon: 'inbox' },
    { label: 'Active Warehouses', value: '4', sub: 'of 5 zones', subType: 'neutral', icon: 'warehouse' },
    { label: 'Platform Revenue', value: '₹18.4L', sub: '+9% MoM', subType: 'ok', icon: 'revenue' },
    { label: 'Open Disputes', value: '5', sub: '2 escalated', subType: 'err', icon: 'dispute' },
  ];

  readonly approvals: readonly ApprovalItem[] = [
    {
      id: '1',
      title: 'Farmer payout > ₹10,000 · escalated by TOHFA Admin',
      source: 'Finance',
      wait: '6h waiting',
      waitType: 'amber',
      icon: 'payout',
    },
    {
      id: '2',
      title: 'High-value inter-warehouse transfer · Ooty → Coonoor',
      source: 'Warehouse',
      wait: '2h waiting',
      waitType: 'blue',
      icon: 'transfer',
    },
    {
      id: '3',
      title: 'Warehouse admin promotion · Priya Nair → Main Admin',
      source: 'Staff',
      wait: '1d waiting',
      waitType: 'tint',
      icon: 'promo',
    },
    {
      id: '4',
      title: 'Stock adjustment · Kotagiri Sub, -42 kg Carrot',
      source: 'Inventory',
      wait: '11h waiting',
      waitType: 'red',
      icon: 'stock',
    },
    {
      id: '5',
      title: 'Farmer application · 3 awaiting final review',
      source: 'Farmers',
      wait: '4h waiting',
      waitType: 'amber',
      icon: 'farmer',
    },
  ];

  readonly zones: readonly ZoneHealthItem[] = [
    { zone: 'Ooty Zone', farmers: 92, status: 'Healthy', statusType: 'ok' },
    { zone: 'Coonoor Zone', farmers: 64, status: 'Healthy', statusType: 'ok' },
    { zone: 'Kotagiri Zone', farmers: 41, status: '1 discrepancy', statusType: 'warn' },
    { zone: 'Gudalur Zone', farmers: 29, status: 'Healthy', statusType: 'ok' },
    { zone: 'Kundah Zone', farmers: 22, status: 'Inactive', statusType: 'neutral' },
  ];

  readonly activities: readonly ActivityItem[] = [
    {
      title: 'Farmer payout of ₹14,200 approved · escalated from TOHFA Admin',
      meta: 'by Demo Super Admin · 10:20 AM',
      badge: 'Approved',
      badgeType: 'ok',
      dotColor: '#1E8E5A',
    },
    {
      title: 'New TOHFA Admin account created · demo.ta02@tohfa.org',
      meta: '09:48 AM',
      badge: 'Created',
      badgeType: 'info',
      dotColor: '#2C6FB0',
    },
    {
      title: 'Inter-warehouse transfer approved · Ooty Main → Coonoor Sub, 480 kg',
      meta: 'by Demo Super Admin · 09:20 AM',
      badge: 'Approved',
      badgeType: 'ok',
      dotColor: '#1E8E5A',
    },
    {
      title: 'Fair price ceiling updated · Tomato, platform-wide',
      meta: '08:55 AM',
      dotColor: '#8A4E15',
    },
    {
      title: 'Stock adjustment submitted for approval · Kotagiri Sub, -42 kg Carrot',
      meta: '08:30 AM',
      badge: 'Pending',
      badgeType: 'warn',
      dotColor: '#C98A02',
    },
    {
      title: 'Dispute escalated to Super Admin · Listing auto-routed from Farmer Admin\'s own listing',
      meta: '08:05 AM',
      badge: 'Escalated',
      badgeType: 'err',
      dotColor: '#B3261E',
    },
  ];

  readonly schedules: readonly ScheduleItem[] = [
    { name: 'Auto Opens', time: 'Nov 19, 2026 · 6:00 AM · Repeats Daily', type: 'open', status: 'Scheduled' },
    { name: 'Auto Closes', time: 'Nov 19, 2026 · 9:00 PM · Repeats Daily', type: 'close', status: 'Scheduled' },
  ];

  readonly quickActions: readonly QuickAction[] = [
    { label: 'Create Staff', icon: 'person_add', link: '/warehouses' },
    { label: 'Approvals Inbox', icon: 'inbox', link: '/approvals' },
    { label: 'Set Fair Price', icon: 'tag', link: '/pricing' },
    { label: 'Configure Allocation', icon: 'donut', link: '/allocations' },
    { label: 'Manage Transfers', icon: 'sync', link: '/inventory' },
    { label: 'Alert Thresholds', icon: 'tune', link: '/alert-thresholds' },
    { label: 'Work Queue', icon: 'work', action: 'workQueue' },
    { label: 'Manage Zones', icon: 'map', link: '/warehouses' },
    { label: 'Generate Report', icon: 'report', link: '/payouts' },
  ];
}
