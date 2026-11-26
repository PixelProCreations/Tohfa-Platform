/**
 * Application shell matching the TOHFA Admin Dashboard Desktop Design System:
 * - 244px fixed gradient sidebar (#5C3410 to #8A4E15)
 * - 72px fixed surface header with greeting, role pill, notifications, and profile menu
 * - Scrolling content canvas on cream background (#F7F5EE)
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { RoleCode } from '@tohfa/shared-types';
import { NAV, type NavRoute } from '../app.routes';
import { AuthService } from '../core/auth.service';
import { RbacService } from '../core/rbac.service';

interface ShellNotification {
  id: number;
  title: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'tohfa-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--tohfa-page, #F7F5EE);
        font-family: var(--font, 'Poppins', sans-serif);
        color: var(--tohfa-ink, #1D2420);
      }

      * {
        box-sizing: border-box;
      }

      /* ================= SIDEBAR ================= */
      .sidebar {
        width: 244px;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        background: linear-gradient(180deg, var(--tohfa-brown-deep, #5C3410) 0%, var(--tohfa-brown, #8A4E15) 100%);
        color: #ffffff;
        z-index: 100;
        display: flex;
        flex-direction: column;
        box-shadow: 2px 0 16px rgba(0, 0, 0, 0.12);
        transition: width 0.2s ease, transform 0.2s ease;
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 16px 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .brand-row {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: #ffffff;
      }

      .brand-icon-box {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8ED18C;
        flex-shrink: 0;
      }

      .brand-text-block {
        display: flex;
        flex-direction: column;
      }

      .brand-title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.05em;
        line-height: 1.1;
        color: #ffffff;
      }

      .brand-sub {
        font-size: 9.5px;
        font-weight: 500;
        color: rgba(255, 248, 238, 0.72);
        line-height: 1.2;
        margin-top: 2px;
        max-width: 140px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sidebar-toggle-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.75);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        padding: 0;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .sidebar-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      .nav-section-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.45);
        padding: 14px 18px 6px;
        margin: 0;
      }

      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 0 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .sidebar-nav::-webkit-scrollbar {
        width: 4px;
      }

      .sidebar-nav::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 4px;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 38px;
        padding: 0 12px;
        border-radius: 10px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.82);
        font-size: 12.5px;
        font-weight: 500;
        transition: all 0.15s ease;
      }

      .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .nav-link.active {
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        font-weight: 600;
        box-shadow: 0 3px 10px rgba(228, 137, 50, 0.35);
      }

      .nav-link-icon {
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        opacity: 0.9;
      }

      .nav-link.active .nav-link-icon {
        opacity: 1;
      }

      .nav-link-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }

      .sidebar-footer {
        padding: 14px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.1);
      }

      .sidebar-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .sidebar-user-name {
        font-size: 12.5px;
        font-weight: 600;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ================= TOP HEADER ================= */
      .top-header {
        position: fixed;
        top: 0;
        left: 244px;
        right: 0;
        height: 72px;
        background: var(--tohfa-surface, #FFFFFF);
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
        z-index: 90;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        transition: left 0.2s ease;
      }

      .header-greeting-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
        line-height: 1.2;
      }

      .header-greeting-sub {
        font-size: 12px;
        font-weight: 500;
        color: var(--tohfa-slate, #5C6B63);
        margin: 2px 0 0;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      /* Role Pill Dropdown */
      .role-pill-btn {
        background: var(--tohfa-amber-tint, #FBEEDE);
        border: 1px solid rgba(228, 137, 50, 0.3);
        color: var(--tohfa-brown, #8A4E15);
        padding: 6px 14px;
        border-radius: 999px;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .role-pill-btn:hover {
        background: #f7e4ce;
        border-color: var(--tohfa-amber, #E48932);
      }

      /* Notification Bell */
      .bell-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-brown-deep, #5C3410);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .bell-btn:hover {
        background: #ede9dc;
        border-color: var(--tohfa-amber, #E48932);
      }

      .unread-dot {
        position: absolute;
        top: 8px;
        right: 9px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #E53935;
        border: 1.5px solid #ffffff;
      }

      /* User Profile Pill */
      .user-profile-menu {
        position: relative;
      }

      .profile-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 999px;
        transition: opacity 0.15s ease;
      }

      .profile-pill:hover {
        opacity: 0.85;
      }

      .profile-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        font-size: 13.5px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .profile-text-col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }

      .profile-name {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.2;
      }

      .profile-email {
        font-size: 10.5px;
        color: var(--tohfa-slate, #5C6B63);
        line-height: 1.2;
      }

      .profile-chevron {
        color: var(--tohfa-slate, #5C6B63);
      }

      /* ================= DROPDOWNS ================= */
      .dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 110;
        background: transparent;
      }

      .dropdown-box {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
        z-index: 120;
        overflow: hidden;
      }

      .notifications-box {
        width: 320px;
      }

      .notifications-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .mark-read-btn {
        background: none;
        border: none;
        color: var(--tohfa-amber, #E48932);
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }

      .notification-list {
        max-height: 280px;
        overflow-y: auto;
      }

      .notification-row {
        padding: 12px 16px;
        border-bottom: 1px solid #f2eee3;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        transition: background 0.15s ease;
      }

      .notification-row:last-child {
        border-bottom: none;
      }

      .notification-row.unread {
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      .notif-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
        margin-top: 5px;
        flex-shrink: 0;
      }

      .notif-text {
        font-size: 12.5px;
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.35;
      }

      .notif-time {
        font-size: 10.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin-top: 3px;
      }

      .profile-box {
        width: 230px;
        padding: 8px 0;
      }

      .profile-box-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        color: var(--tohfa-ink, #1D2420);
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .profile-box-item:hover {
        background: var(--tohfa-page, #F7F5EE);
        color: var(--tohfa-amber, #E48932);
      }

      .profile-box-divider {
        height: 1px;
        background: var(--tohfa-border, #E4E0D3);
        margin: 6px 0;
      }

      /* Role selection dropdown */
      .role-select-box {
        width: 220px;
        padding: 6px 0;
      }

      .role-option {
        padding: 8px 16px;
        font-size: 12.5px;
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .role-option:hover {
        background: var(--tohfa-page, #F7F5EE);
      }

      .role-option.active {
        font-weight: 700;
        color: var(--tohfa-amber, #E48932);
      }

      /* ================= MAIN CONTENT CANVAS ================= */
      .content-area {
        margin-left: 244px;
        margin-top: 72px;
        min-height: calc(100vh - 72px);
        background: var(--tohfa-page, #F7F5EE);
        padding: 24px 28px 36px;
        transition: margin-left 0.2s ease;
      }
    `,
  ],
  template: `
    <!-- FIXED LEFT SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <a routerLink="/dashboard" class="brand-row">
          <div class="brand-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
          </div>
          <div class="brand-text-block">
            <span class="brand-title">TOHFA</span>
            <span class="brand-sub">A Nilgiri Sustainable Farmer Collective</span>
          </div>
        </a>

        <button class="sidebar-toggle-btn" type="button" aria-label="Toggle Navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" x2="21" y1="6" y2="6"></line>
            <line x1="3" x2="21" y1="12" y2="12"></line>
            <line x1="3" x2="21" y1="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="nav-section-label">MAIN</div>

      <nav class="sidebar-nav">
        <a
          *ngFor="let item of visibleNav()"
          [routerLink]="item.path"
          routerLinkActive="active"
          class="nav-link"
        >
          <!-- Material Symbol / SVG Icon for each nav item -->
          <span class="nav-link-icon">
            <!-- Dashboard -->
            <svg *ngIf="item.icon === 'dashboard'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"></rect>
              <rect width="7" height="5" x="14" y="3" rx="1"></rect>
              <rect width="7" height="9" x="14" y="12" rx="1"></rect>
              <rect width="7" height="5" x="3" y="16" rx="1"></rect>
            </svg>

            <!-- Approvals Inbox -->
            <svg *ngIf="item.icon === 'inbox'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>

            <!-- Farmers Management -->
            <svg *ngIf="item.icon === 'agriculture'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="7" cy="17" r="2"></circle>
              <circle cx="17" cy="17" r="2"></circle>
              <path d="M9 17h6"></path>
              <path d="M19 17h1a1 1 0 0 0 1-1v-3.5a1.5 1.5 0 0 0-1.5-1.5H16l-3-6H7a1 1 0 0 0-1 1v6"></path>
              <path d="M5 17H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2"></path>
            </svg>

            <!-- Produce & Crops -->
            <svg *ngIf="item.icon === 'eco'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>

            <!-- Audit Management -->
            <svg *ngIf="item.icon === 'fact_check'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="m9 12 2 2 4-4"></path>
            </svg>

            <!-- Inputs & Pest -->
            <svg *ngIf="item.icon === 'pest_control'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m8 2 1.88 1.88"></path>
              <path d="M14.12 3.88 16 2"></path>
              <rect width="8" height="14" x="8" y="6" rx="4"></rect>
              <path d="M19 13h2"></path>
              <path d="M3 13h2"></path>
            </svg>

            <!-- Market & Pricing -->
            <svg *ngIf="item.icon === 'currency_rupee'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3h12"></path>
              <path d="M6 8h12"></path>
              <path d="m6 13 8.5 8"></path>
              <path d="M6 13h3a4 4 0 0 0 0-8"></path>
            </svg>

            <!-- Purchases Management -->
            <svg *ngIf="item.icon === 'shopping_cart'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>

            <!-- Sales Management -->
            <svg *ngIf="item.icon === 'bar_chart'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" x2="12" y1="20" y2="10"></line>
              <line x1="18" x2="18" y1="20" y2="4"></line>
              <line x1="6" x2="6" y1="20" y2="16"></line>
            </svg>

            <!-- Inventory & Warehouse -->
            <svg *ngIf="item.icon === 'warehouse'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21V9l9-6 9 6v12H3z"></path>
              <path d="M9 21v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8"></path>
            </svg>

            <!-- Reserve & Allocation -->
            <svg *ngIf="item.icon === 'sync_alt'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21 12-4-4v3H7v2h10v3z"></path>
              <path d="m3 12 4 4v-3h10v-2H7V8z"></path>
            </svg>

            <!-- Customers Management -->
            <svg *ngIf="item.icon === 'groups'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>

            <!-- Accounts & Finance -->
            <svg *ngIf="item.icon === 'account_balance_wallet'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2"></rect>
              <line x1="2" x2="22" y1="10" y2="10"></line>
            </svg>

            <!-- Workforce & Staff -->
            <svg *ngIf="item.icon === 'badge'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>

            <!-- Notifications & Reports -->
            <svg *ngIf="item.icon === 'notifications'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>

            <!-- Settings & Profile -->
            <svg *ngIf="item.icon === 'settings'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>

          <span class="nav-link-text">{{ item.label }}</span>
          <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
        </a>
      </nav>

      <!-- Sidebar User Footer -->
      <div class="sidebar-footer">
        <div class="sidebar-avatar">{{ profileInitials() }}</div>
        <span class="sidebar-user-name">{{ activeRoleDisplay() }}</span>
      </div>
    </aside>

    <!-- FIXED TOP HEADER -->
    <header class="top-header">
      <div class="header-left">
        <h1 class="header-greeting-title">Good Morning, {{ activeRoleDisplay() }}</h1>
        <p class="header-greeting-sub">Nilgiris Horticulture Organic Farmers Association · Platform-wide view</p>
      </div>

      <div class="header-right">
        <!-- Role Pill with switch capability -->
        <div class="user-profile-menu">
          <button class="role-pill-btn" type="button" (click)="toggleRoleMenu()">
            <span>Role: {{ formatRole(activeRole()) }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Role selection menu if multiple roles -->
          <div class="dropdown-box role-select-box" *ngIf="roleMenuOpen()">
            <div
              class="role-option"
              *ngFor="let role of roles()"
              [class.active]="role === activeRole()"
              (click)="selectRole(role)"
            >
              <span>{{ formatRole(role) }}</span>
              <svg *ngIf="role === activeRole()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <!-- Notification Bell -->
        <div class="user-profile-menu">
          <button class="bell-btn" type="button" aria-label="Notifications" (click)="toggleNotifications()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="unread-dot" *ngIf="unreadCount() > 0"></span>
          </button>

          <!-- Notifications Panel -->
          <div class="dropdown-box notifications-box" *ngIf="notificationsOpen()">
            <div class="notifications-header">
              <span>Notifications ({{ unreadCount() }})</span>
              <button class="mark-read-btn" type="button" (click)="markAllRead()">Mark all read</button>
            </div>
            <div class="notification-list">
              <div class="notification-row" *ngFor="let n of notifications()" [class.unread]="n.unread">
                <span class="notif-dot" *ngIf="n.unread"></span>
                <div>
                  <div class="notif-text">{{ n.title }}</div>
                  <div class="notif-time">{{ n.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile Pill -->
        <div class="user-profile-menu">
          <button class="profile-pill" type="button" (click)="toggleProfile()">
            <div class="profile-avatar">{{ profileInitials() }}</div>
            <div class="profile-text-col">
              <span class="profile-name">{{ activeRoleDisplay() }}</span>
              <span class="profile-email">super.admin&#64;tohfa.org</span>
            </div>
            <svg class="profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Profile Dropdown -->
          <div class="dropdown-box profile-box" *ngIf="profileOpen()">
            <a routerLink="/settings" class="profile-box-item" (click)="closeMenus()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              View Profile
            </a>
            <a routerLink="/settings" class="profile-box-item" (click)="closeMenus()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Account Settings
            </a>
            <div class="profile-box-divider"></div>
            <button class="profile-box-item" type="button" (click)="onLogout()" style="color: #DC2626;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" x2="9" y1="12" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Backdrop for closing dropdowns -->
      <div
        class="dropdown-backdrop"
        *ngIf="notificationsOpen() || profileOpen() || roleMenuOpen()"
        (click)="closeMenus()"
      ></div>
    </header>

    <!-- MAIN SCROLLING CONTENT CANVAS -->
    <main class="content-area">
      <router-outlet />
    </main>
  `,
})
export class ShellComponent {
  private readonly rbac = inject(RbacService);
  private readonly auth = inject(AuthService);

  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly activeRole = computed(() => this.auth.activeRole());
  readonly roles = computed(() => this.auth.roles());

  formatRole(role: string | null): string {
    if (!role) return 'Super Admin';
    return role
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  readonly activeRoleDisplay = computed(() => {
    const role = this.activeRole();
    return this.formatRole(role);
  });

  /** Recomputes whenever active roles change */
  readonly visibleNav = computed<readonly NavRoute[]>(() => {
    this.rbac.activeRoles();
    return NAV.filter((item) => this.rbac.can(item.permission));
  });

  readonly profileInitials = computed(() => {
    const role = this.activeRole();
    if (!role) return 'SA';
    const parts = role.split('_');
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    if (first && second) {
      return (first + second).toUpperCase();
    }
    return role.slice(0, 2).toUpperCase();
  });

  readonly notifications = signal<ShellNotification[]>([
    { id: 1, title: 'Farmer payout of ₹14,200 escalated to Super Admin', time: '10:20 AM', unread: true },
    { id: 2, title: 'High-value inter-warehouse transfer pending approval', time: '09:20 AM', unread: true },
    { id: 3, title: 'Stock adjustment submitted for Kotagiri Sub (-42 kg)', time: '08:30 AM', unread: true },
    { id: 4, title: 'Dispute escalated to Super Admin', time: '08:05 AM', unread: false },
  ]);

  readonly unreadCount = computed(() => this.notifications().filter((n) => n.unread).length);

  readonly notificationsOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly roleMenuOpen = signal(false);

  toggleNotifications(): void {
    this.closeMenus();
    this.notificationsOpen.update((open) => !open);
  }

  toggleProfile(): void {
    this.closeMenus();
    this.profileOpen.update((open) => !open);
  }

  toggleRoleMenu(): void {
    if (this.roles().length <= 1) return;
    this.closeMenus();
    this.roleMenuOpen.update((open) => !open);
  }

  closeMenus(): void {
    this.notificationsOpen.set(false);
    this.profileOpen.set(false);
    this.roleMenuOpen.set(false);
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, unread: false })));
  }

  selectRole(role: RoleCode): void {
    this.auth.selectRole(role);
    this.closeMenus();
  }

  onLogout(): void {
    this.auth.logout();
  }
}

/** Landing page when a guard rejects a navigation. */
@Component({
  selector: 'tohfa-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        font-family: var(--font, 'Poppins', sans-serif);
      }
      .forbidden-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        max-width: 440px;
        text-align: center;
        padding: 40px 32px;
      }
      .forbidden-icon {
        width: 54px;
        height: 54px;
        margin: 0 auto 16px;
        border-radius: 14px;
        background: var(--tohfa-tint-err, #FDE8E8);
        color: var(--tohfa-err, #9C2525);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .forbidden-icon svg {
        width: 28px;
        height: 28px;
      }
      .forbidden-title {
        font-size: 19px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--tohfa-ink, #1D2420);
      }
      .forbidden-text {
        font-size: 13.5px;
        font-weight: 400;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0 0 24px;
        line-height: 1.5;
      }
      .return-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--tohfa-amber, #E48932);
        color: #fff;
        padding: 9px 20px;
        border-radius: 9px;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
      }
    `,
  ],
  template: `
    <div class="forbidden-card">
      <div class="forbidden-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </div>
      <h2 class="forbidden-title">Not permitted</h2>
      <p class="forbidden-text">Your role does not grant access to this screen. Contact a TOHFA Admin if you need it.</p>
      <a routerLink="/dashboard" class="return-link">Return to Dashboard</a>
    </div>
  `,
})
export class ForbiddenComponent {}
