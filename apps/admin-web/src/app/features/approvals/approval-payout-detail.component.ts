import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

export type ApprovalViewMode =
  | 'details'
  | 'review'
  | 'approved_detail'
  | 'processing'
  | 'paid_awaiting'
  | 'settled'
  | 'settlement_full';

interface TimelineStep {
  title: string;
  desc: string;
  time?: string;
  badge: string;
  badgeType: 'submitted' | 'reviewed' | 'escalated' | 'approved' | 'processed' | 'settled' | 'in_progress';
  status: 'done' | 'current' | 'warn' | 'pending';
}

@Component({
  selector: 'tohfa-approval-payout-detail',
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

      /* ================= TOP SUMMARY CARDS ================= */
      .top-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 16px 20px;
        margin-bottom: 16px;
      }

      .top-summary-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 14px 22px;
        margin-bottom: 16px;
      }

      .top-summary-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .top-summary-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 20px;
      }

      .top-summary-title {
        font-size: 15px;
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 2px;
      }

      .top-summary-sub {
        font-size: 11px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0;
      }

      .top-summary-meta-row {
        display: flex;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
      }

      /* Screen 2 Top Info Card */
      .req-info-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 16px;
        align-items: center;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .info-lbl {
        font-size: 10px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-slate, #5C6B63);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .info-val {
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
      }

      .info-val-orange {
        color: var(--tohfa-amber, #E48932);
        font-size: 14px;
        font-weight: var(--fw-xbold, 800);
      }

      /* Screen 3 Top Summary Card with Avatar */
      .summary-card-review {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 14px 20px;
        margin-bottom: 16px;
      }

      .review-avatar-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar-circle {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        font-weight: var(--fw-xbold, 800);
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--tohfa-amber-border, #F6D9B3);
        flex-shrink: 0;
      }

      .review-meta-row {
        display: flex;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
      }

      /* Common Cards & Layouts */
      .layout-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .layout-3col {
        display: grid;
        grid-template-columns: 1fr 1fr 1.15fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .col-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 18px 20px;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .card-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .card-title {
        font-size: 13px;
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
      }

      .card-header-icon {
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
      }

      /* Table: Payout Breakdown */
      .payout-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 11px;
      }

      .payout-table th {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-slate, #5C6B63);
        font-size: 9.5px;
        font-weight: var(--fw-bold, 700);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 8px 12px;
        text-align: left;
        border-top: 1px solid var(--tohfa-border, #E4E0D3);
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .payout-table th:first-child {
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
        border-left: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .payout-table th:last-child {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        border-right: 1px solid var(--tohfa-border, #E4E0D3);
        text-align: right;
      }

      .payout-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--tohfa-divider, #F0EEE4);
        color: var(--tohfa-ink, #1D2420);
        font-weight: var(--fw-medium, 500);
      }

      .payout-table td:last-child {
        text-align: right;
        font-weight: var(--fw-bold, 700);
      }

      .payout-table tr.total-row td {
        background: var(--tohfa-amber-tint, #FBEEDE);
        font-weight: var(--fw-xbold, 800);
        font-size: 12px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
        border-top: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-ink, #1D2420);
      }

      .payout-table tr.total-row td:first-child {
        border-bottom-left-radius: 6px;
        border-top-left-radius: 6px;
        border-left: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .payout-table tr.total-row td:last-child {
        border-bottom-right-radius: 6px;
        border-top-right-radius: 6px;
        border-right: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-ink, #1D2420);
      }

      /* Requester's Justification Quote Box */
      .justification-box {
        background: #FBF9F2;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 14px 16px;
        font-size: 11px;
        line-height: 1.6;
        color: var(--tohfa-slate, #5C6B63);
      }

      /* Supporting Documents */
      .doc-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .doc-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
      }

      .doc-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .doc-icon {
        width: 32px;
        height: 32px;
        border-radius: 7px;
        background: #FEECEB;
        color: #E24C4C;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .doc-name {
        font-size: 11px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 2px;
      }

      .doc-meta {
        font-size: 10px;
        color: var(--tohfa-muted, #9AA294);
        margin: 0;
      }

      .doc-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-doc-action {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 8px);
        padding: 5px 10px;
        font-size: 10.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }

      .btn-doc-action:hover {
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
      }

      /* Steppers */
      .stepper-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 16px 20px;
        flex: 1;
      }

      .stepper-progress {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        padding: 8px 16px;
      }

      .stepper-track-line {
        position: absolute;
        top: 22px;
        left: 36px;
        right: 36px;
        height: 2px;
        background: #1E8E5A;
        z-index: 1;
      }

      .stepper-track-line.pending-end {
        background: linear-gradient(to right, #1E8E5A 66%, var(--tohfa-border, #E4E0D3) 66%);
      }

      .stepper-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        z-index: 2;
        text-align: center;
      }

      .stepper-circle {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
      }

      .stepper-circle.done {
        background: var(--ok, #1E8E5A);
        color: #ffffff;
      }

      .stepper-circle.active-amber {
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
      }

      .stepper-circle.pending {
        background: #ffffff;
        border: 2px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-muted, #9AA294);
      }

      .stepper-lbl {
        font-size: 11px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
      }

      .stepper-sub {
        font-size: 9px;
        color: var(--tohfa-slate, #5C6B63);
      }

      /* Alert Banners */
      .banner-amber {
        flex: 1;
        background: #FFF9ED;
        border: 1px solid #FCE4B8;
        border-radius: var(--r-card, 14px);
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .banner-green {
        flex: 1;
        background: var(--ok-bg, #E6F5ED);
        border: 1px solid var(--ok-border, #A3E0BF);
        border-radius: var(--r-card, 14px);
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .banner-green-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .banner-meta-right {
        display: flex;
        align-items: center;
        gap: 24px;
        flex-shrink: 0;
      }

      /* Form Elements */
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-bottom: 12px;
      }

      .form-label {
        font-size: 10.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
      }

      .input-text {
        width: 100%;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 8px);
        padding: 8px 12px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11px;
        color: var(--tohfa-ink, #1D2420);
        outline: none;
      }

      .input-text:focus {
        border-color: var(--tohfa-amber, #E48932);
      }

      .bank-acc-callout {
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 8px);
        padding: 8px 12px;
        font-size: 11px;
        color: var(--tohfa-ink, #1D2420);
        font-weight: var(--fw-bold, 700);
      }

      .note-box {
        background: var(--ok-bg, #E6F5ED);
        border: 1px solid var(--ok-border, #A3E0BF);
        border-radius: var(--r-tab, 9px);
        padding: 10px 12px;
        font-size: 10.5px;
        color: #145A32;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        line-height: 1.45;
      }

      /* Checklist */
      .checklist-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 11.5px;
        font-weight: var(--fw-medium, 500);
        color: var(--tohfa-ink, #1D2420);
      }

      .chk-box {
        width: 17px;
        height: 17px;
        border: 1.5px solid var(--tohfa-checkbox-border, #D6D1C4);
        border-radius: 4px;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }

      .chk-box.checked {
        background: var(--tohfa-amber, #E48932);
        border-color: var(--tohfa-amber, #E48932);
        color: #ffffff;
      }

      /* Timeline */
      .timeline-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: relative;
        padding-left: 20px;
      }

      .timeline-wrap::before {
        content: '';
        position: absolute;
        left: 6px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        background: var(--tohfa-border, #E4E0D3);
      }

      .timeline-step {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .timeline-dot {
        position: absolute;
        left: -20px;
        top: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #ffffff;
        border: 2px solid var(--ok, #1E8E5A);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timeline-dot.escalated {
        border-color: #C0392B;
        background: #FEECEB;
      }

      .timeline-dot.in-progress {
        border-color: var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      .timeline-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .timeline-step-title {
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
      }

      .timeline-time {
        font-size: 9.5px;
        color: var(--tohfa-muted, #9AA294);
      }

      .timeline-step-desc {
        font-size: 10.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0;
      }

      .pill-badge {
        font-size: 9.5px;
        font-weight: var(--fw-bold, 700);
        padding: 2px 7px;
        border-radius: 12px;
        display: inline-block;
      }

      .pill-submitted, .pill-reviewed, .pill-approved, .pill-completed, .pill-processed, .pill-settled {
        background: var(--ok-bg, #E6F5ED);
        color: var(--ok, #1E8E5A);
      }

      .pill-escalated {
        background: #FEECEB;
        color: #C0392B;
      }

      .pill-inprogress, .pill-paid {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-brown, #8A4E15);
      }

      .audit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        row-gap: 12px;
        column-gap: 16px;
      }

      /* Bottom Action Bars */
      .bottom-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .btn-back {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-tab, 9px);
        padding: 10px 16px;
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
      }

      .btn-back:hover {
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
      }

      .btn-primary-action {
        background: var(--tohfa-amber, #E48932);
        border: none;
        border-radius: var(--r-tab, 9px);
        padding: 10px 22px;
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.15s ease;
      }

      .btn-primary-action:hover:not(:disabled) {
        background: var(--tohfa-amber-hover, #C97420);
      }

      .status-pill-approved, .status-pill-settled, .status-pill-reconciled {
        color: var(--ok, #1E8E5A);
        font-weight: var(--fw-bold, 700);
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11.5px;
      }

      .status-pill-awaiting {
        color: var(--tohfa-brown, #8A4E15);
        font-weight: var(--fw-bold, 700);
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11.5px;
      }

      .priority-pill-high {
        color: #C0392B;
        font-weight: var(--fw-bold, 700);
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11.5px;
      }

      .red-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #C0392B;
      }

      .green-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ok, #1E8E5A);
      }

      /* Modal Popups */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(29, 36, 32, 0.55);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        backdrop-filter: blur(2px);
      }

      .modal-dialog {
        background: #ffffff;
        border-radius: 16px;
        width: 100%;
        max-width: 520px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
        position: relative;
        padding: 30px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .modal-close-btn {
        position: absolute;
        top: 18px;
        right: 18px;
        background: transparent;
        border: none;
        color: var(--tohfa-muted, #9AA294);
        cursor: pointer;
        padding: 4px;
      }

      .modal-icon-circle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
        font-size: 24px;
      }

      .modal-icon-circle.success {
        background: #E8F7EE;
        color: var(--ok, #1E8E5A);
      }

      .modal-icon-circle.reject {
        background: #FEECEB;
        color: #C0392B;
      }

      .modal-title {
        font-size: 19px;
        font-weight: var(--fw-xbold, 800);
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 6px;
      }

      .modal-sub {
        font-size: 11.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0 0 20px;
        line-height: 1.5;
        max-width: 420px;
      }

      .modal-info-box-success {
        width: 100%;
        background: #F2FAF5;
        border: 1px solid #C8ECD6;
        border-radius: 12px;
        padding: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        text-align: left;
        margin-bottom: 16px;
      }

      .modal-kv {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 11px;
      }

      .modal-kv-content {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .modal-kv-lbl {
        font-size: 9.5px;
        color: var(--tohfa-slate, #5C6B63);
        font-weight: var(--fw-semi, 600);
      }

      .modal-kv-val {
        font-size: 11.5px;
        font-weight: var(--fw-bold, 700);
        color: var(--tohfa-ink, #1D2420);
      }

      .modal-kv-val.approved {
        color: var(--ok, #1E8E5A);
      }

      .modal-alert-note {
        width: 100%;
        background: #EFF6FF;
        border: 1px solid #BFDBFE;
        border-radius: 9px;
        padding: 10px 14px;
        font-size: 11px;
        color: #1E40AF;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 22px;
      }

      .modal-btn-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .modal-btn-ok {
        flex: 1;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        border: none;
        border-radius: var(--r-tab, 9px);
        padding: 10px;
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        cursor: pointer;
      }

      .modal-btn-outline {
        flex: 1;
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-ink, #1D2420);
        border-radius: var(--r-tab, 9px);
        padding: 10px;
        font-size: 12px;
        font-weight: var(--fw-bold, 700);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      /* PDF Viewer Modal (Exact match to Bank Transfer Confirmation mockup) */
      .pdf-modal-dialog {
        background: #ffffff;
        border-radius: 12px;
        width: 95%;
        max-width: 860px;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
      }

      .pdf-modal-header {
        padding: 16px 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #ffffff;
      }

      .pdf-meta-badge {
        width: 38px;
        height: 38px;
        background: #FEE2E2;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #DC2626;
        flex-shrink: 0;
      }

      .pdf-toolbar {
        background: #1D2420;
        color: #D1D5DB;
        padding: 8px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11.5px;
        font-weight: 500;
      }

      .pdf-toolbar-filename {
        color: #F3F4F6;
        font-weight: 500;
      }

      .pdf-toolbar-controls {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .pdf-tb-btn {
        color: #D1D5DB;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 4px;
        font-size: 12px;
        line-height: 1;
      }

      .pdf-tb-btn:hover {
        color: #ffffff;
      }

      .pdf-body-scroll {
        background: #F4F1EB;
        padding: 24px 32px;
        overflow-y: auto;
        display: flex;
        justify-content: center;
      }

      .pdf-sheet {
        background: #ffffff;
        width: 100%;
        max-width: 740px;
        padding: 36px 44px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .pdf-stamp-circle {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        border: 2px solid #1E8E5A;
        color: #1E8E5A;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform: rotate(-12deg);
        padding: 4px;
        flex-shrink: 0;
      }

      .btn-pdf-close {
        background: #ffffff;
        border: 1px solid #D1D5DB;
        color: #374151;
        font-weight: 600;
        font-size: 12.5px;
        padding: 8px 24px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-pdf-close:hover {
        background: #F9FAFB;
        border-color: #9CA3AF;
      }

      .btn-pdf-download {
        background: var(--tohfa-brand, #E86A17);
        color: #ffffff;
        font-weight: 700;
        font-size: 12.5px;
        padding: 8px 22px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 1px 3px rgba(232, 106, 23, 0.25);
        transition: all 0.15s ease;
      }
      .btn-pdf-download:hover {
        background: #cf5c11;
      }

      /* Quick Stage Navigation Strip */
      .stage-nav-bar {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 8px 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        overflow-x: auto;
      }
      .stage-nav-inner {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .stage-nav-title {
        font-size: 11px;
        font-weight: 700;
        color: var(--tohfa-slate, #5C6B63);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .stage-pills-row {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
      }
      .stage-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #FAF8F2;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 999px;
        padding: 4px 12px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 11px;
        font-weight: 600;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .stage-pill-btn:hover {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        border-color: var(--tohfa-amber, #E48932);
      }
      .stage-pill-btn.active {
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        border-color: var(--tohfa-amber, #E48932);
        box-shadow: 0 2px 6px rgba(228, 137, 50, 0.25);
      }
      .stage-pill-btn .pill-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgba(0,0,0,0.08);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 9.5px;
        font-weight: 700;
      }
      .stage-pill-btn.active .pill-dot {
        background: rgba(255,255,255,0.25);
        color: #ffffff;
      }
      .btn-pdf-quick {
        background: var(--tohfa-amber-tint, #FBEEDE);
        border: 1px solid var(--tohfa-amber, #E48932);
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 700;
        color: var(--tohfa-amber, #E48932);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .btn-pdf-quick:hover {
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
      }
    `,
  ],
  template: `
    <!-- Quick Stage Navigation Strip for seamless testing & transition -->
    <div class="stage-nav-bar">
      <div class="stage-nav-inner">
        <span class="stage-nav-title">Workflow Stage:</span>
        <div class="stage-pills-row">
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'details'" (click)="currentView.set('details')">
            <span class="pill-dot">1</span>
            <span>Request Details</span>
          </button>
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'review'" (click)="currentView.set('review')">
            <span class="pill-dot">2</span>
            <span>Review Decision</span>
          </button>
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'approved_detail'" (click)="currentView.set('approved_detail')">
            <span class="pill-dot">3</span>
            <span>Approved</span>
          </button>
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'processing'" (click)="currentView.set('processing')">
            <span class="pill-dot">4</span>
            <span>Finance Processing</span>
          </button>
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'paid_awaiting'" (click)="currentView.set('paid_awaiting')">
            <span class="pill-dot">5</span>
            <span>Paid (Awaiting)</span>
          </button>
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'settled'" (click)="currentView.set('settled')">
            <span class="pill-dot">6</span>
            <span>Settled Summary</span>
          </button>
          <button type="button" class="stage-pill-btn" [class.active]="currentView() === 'settlement_full'" (click)="currentView.set('settlement_full')">
            <span class="pill-dot">7</span>
            <span>Payout Settled Details</span>
          </button>
        </div>
      </div>
      <button type="button" class="btn-pdf-quick" (click)="openDoc('Bank_Transfer_Confirmation.pdf')">
        <span>📄 View Bank PDF</span>
      </button>
    </div>

    <!-- ========================================================================= -->
    <!-- SCREEN 2: FARMER PAYOUT REQUEST DETAILS                                   -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'details'">
      <div class="top-card">
        <div class="req-info-grid">
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
          <div class="info-item"><span class="info-lbl">Requested Payout</span><span class="info-val-orange">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Payout Purpose</span><span class="info-val">Produce procurement settlement</span></div>
          <div class="info-item"><span class="info-lbl">Requested by</span><span class="info-val">TOHFA Admin</span></div>
          <div class="info-item"><span class="info-lbl">Submitted On</span><span class="info-val">14 Oct 2026, 12:30 PM</span></div>
        </div>
      </div>

      <div class="layout-2col">
        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Payout Breakdown</h3></div>
            <table class="payout-table">
              <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                <tr><td>Produce amount</td><td>₹16,800</td></tr>
                <tr><td>Quality adjustment</td><td>₹700</td></tr>
                <tr><td>Previous balance (credit)</td><td>₹1,000</td></tr>
                <tr class="total-row"><td>Total Requested Payout</td><td>₹18,500</td></tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Requester's Justification</h3></div>
            <div class="justification-box">
              Payment for produce procurement from farmer Ramesh Kumar for the period 01 Oct 2026 - 10 Oct 2026. Quality verified and accepted by the procurement team. Requesting payout of ₹18,500 as per the attached statement.
            </div>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Supporting Documents (2)</h3></div>
            <div class="doc-list">
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Purchase_Statement_Oct.pdf</p><p class="doc-meta">2.4 MB | Uploaded on 14 Oct 2026, 12:10 PM</p></div>
                <div class="doc-actions">
                  <button type="button" class="btn-doc-action" (click)="openDoc('Purchase_Statement_Oct.pdf')">View</button>
                  <button type="button" class="btn-doc-action">Download</button>
                </div>
              </div>
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Quality_Verification.pdf</p><p class="doc-meta">1.8 MB | Uploaded on 14 Oct 2026, 12:12 PM</p></div>
                <div class="doc-actions">
                  <button type="button" class="btn-doc-action" (click)="openDoc('Quality_Verification.pdf')">View</button>
                  <button type="button" class="btn-doc-action">Download</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Approval History</h3></div>
            <div class="timeline-wrap">
              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Submitted by TOHFA Admin</span><span class="timeline-time">14 Oct 2026, 12:30 PM</span></div>
                <p class="timeline-step-desc">Request created and submitted for approval.</p>
              </div>
              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Reviewed by Finance Team</span><span class="timeline-time">14 Oct 2026, 02:10 PM</span></div>
                <p class="timeline-step-desc">Payout details and documents verified.</p>
              </div>
              <div class="timeline-step">
                <div class="timeline-dot escalated"><span class="red-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Escalated to Super Admin</span><span class="timeline-time">14 Oct 2026, 06:30 PM</span></div>
                <p class="timeline-step-desc">Escalated due to high payout amount (₹18,500).</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <button type="button" class="btn-back" (click)="goBack()">← Back to Approvals Inbox</button>
        <button type="button" class="btn-primary-action" (click)="goToReview()">Continue to Review →</button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 3: REVIEW SCREEN                                                   -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'review'">
      <div class="summary-card-review">
        <div class="review-avatar-wrap">
          <div class="avatar-circle">RK</div>
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
        </div>
        <div class="review-meta-row">
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Request ID</span><span class="info-val">PAY-2026-00128</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
          <div class="info-item"><span class="info-lbl">Requested Payout</span><span class="info-val-orange">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Status</span><span class="status-pill-escalated"><span class="red-dot"></span>Escalated</span></div>
          <div class="info-item"><span class="info-lbl">Priority</span><span class="priority-pill-high"><span class="red-dot"></span>High</span></div>
          <div class="info-item"><span class="info-lbl">Requested By</span><span class="info-val">TOHFA Admin</span></div>
        </div>
      </div>

      <div class="layout-2col">
        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Payout Breakdown</h3></div>
            <table class="payout-table">
              <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                <tr><td>Produce amount</td><td>₹16,800</td></tr>
                <tr><td>Quality adjustment</td><td>₹700</td></tr>
                <tr><td>Previous balance (credit)</td><td>₹1,000</td></tr>
                <tr class="total-row"><td>Total Requested Payout</td><td>₹18,500</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">Supporting Documents (2)</h3></div>
            <div class="doc-list">
              <div class="doc-row"><p class="doc-name">Purchase_Statement_Oct.pdf</p><button type="button" class="btn-doc-action" (click)="openDoc('Purchase_Statement_Oct.pdf')">View</button></div>
              <div class="doc-row"><p class="doc-name">Quality_Verification.pdf</p><button type="button" class="btn-doc-action" (click)="openDoc('Quality_Verification.pdf')">View</button></div>
            </div>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Verification Checklist</h3></div>
            <div class="checklist-group">
              <label class="checklist-item" (click)="chkDetails = !chkDetails"><div class="chk-box" [class.checked]="chkDetails">✓</div><span>Farmer and payout details verified</span></label>
              <label class="checklist-item" (click)="chkDocs = !chkDocs"><div class="chk-box" [class.checked]="chkDocs">✓</div><span>Supporting documents reviewed</span></label>
              <label class="checklist-item" (click)="chkAmount = !chkAmount"><div class="chk-box" [class.checked]="chkAmount">✓</div><span>Payout amount and breakdown verified</span></label>
              <label class="checklist-item" (click)="chkRequester = !chkRequester"><div class="chk-box" [class.checked]="chkRequester">✓</div><span>Requester is not the approver</span></label>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Decision</h3></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div class="btn-back" [style.border-color]="selectedDecision === 'Approve' ? '#1E8E5A' : '#E4E0D3'" (click)="selectedDecision = 'Approve'" style="justify-content: center; color: #1E8E5A;">Approve Payout</div>
              <div class="btn-back" [style.border-color]="selectedDecision === 'Reject' ? '#E24C4C' : '#E4E0D3'" (click)="selectedDecision = 'Reject'" style="justify-content: center; color: #E24C4C;">Reject Payout</div>
            </div>
            <div class="form-group">
              <label class="form-label">Review Remarks *</label>
              <textarea class="input-text" rows="3" [(ngModel)]="reviewRemarks"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <button type="button" class="btn-back" (click)="goToDetails()">← Back to Details</button>
        <button type="button" class="btn-primary-action" (click)="submitDecision()">✓ Submit Decision</button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 4: DECISION SUBMITTED POPUP MODAL                                  -->
    <!-- ========================================================================= -->
    <div class="modal-backdrop" *ngIf="showDecisionModal" (click)="showDecisionModal = false">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-icon-circle success">✓</div>
        <h2 class="modal-title">Decision Submitted Successfully!</h2>
        <p class="modal-sub">Your decision has been recorded for the payout request.</p>

        <div class="modal-info-box-success">
          <div class="modal-kv"><div class="modal-kv-content"><span class="modal-kv-lbl">Request ID</span><span class="modal-kv-val">PAY-2026-00128</span></div></div>
          <div class="modal-kv"><div class="modal-kv-content"><span class="modal-kv-lbl">Decision</span><span class="modal-kv-val approved">Approved</span></div></div>
          <div class="modal-kv"><div class="modal-kv-content"><span class="modal-kv-lbl">Farmer</span><span class="modal-kv-val">Ramesh Kumar</span></div></div>
          <div class="modal-kv"><div class="modal-kv-content"><span class="modal-kv-lbl">Decision Date</span><span class="modal-kv-val">14 Oct 2026, 06:42 PM</span></div></div>
          <div class="modal-kv"><div class="modal-kv-content"><span class="modal-kv-lbl">Requested Amount</span><span class="modal-kv-val">₹18,500</span></div></div>
          <div class="modal-kv"><div class="modal-kv-content"><span class="modal-kv-lbl">Decided By</span><span class="modal-kv-val">Super Admin (SA-0001)</span></div></div>
        </div>

        <div class="modal-alert-note">The approval has been saved and the request has moved to the next step (Finance / Payout Processing).</div>

        <div class="modal-btn-row">
          <button type="button" class="modal-btn-ok" (click)="goBack()">OK</button>
          <button type="button" class="modal-btn-outline" (click)="openApprovedDetail()">View Request Details ↗</button>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- SCREEN 5: APPROVED REQUEST DETAILS                                        -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'approved_detail'">
      <div class="top-summary-header">
        <div class="top-summary-left">
          <div class="top-summary-icon">💵</div>
          <div><h2 class="top-summary-title">Farmer Payout</h2><p class="top-summary-sub">Request ID: PAY-2026-00128</p></div>
        </div>
        <div class="top-summary-meta-row">
          <div class="info-item"><span class="info-lbl">Status</span><span class="status-pill-approved">✓ Approved</span></div>
          <div class="info-item"><span class="info-lbl">Priority</span><span class="priority-pill-high"><span class="red-dot"></span>High</span></div>
          <div class="info-item"><span class="info-lbl">Requested Amount</span><span class="info-val">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
        </div>
      </div>

      <div class="banner-row">
        <div class="banner-green">
          <div class="banner-green-left">
            <div class="status-alert-icon">✓</div>
            <div><h4 class="status-alert-title">Approval completed — payout not yet settled.</h4><p class="status-alert-sub">The request has been approved and is now awaiting finance processing.</p></div>
          </div>
        </div>
        <div class="next-step-box" (click)="currentView.set('processing')">
          <div><span class="next-step-label">Next Step</span><h5 class="next-step-title">Finance / Payout Processing</h5></div>
        </div>
      </div>

      <div class="layout-2col">
        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Request Information</h3></div>
            <div class="audit-grid">
              <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
              <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
              <div class="info-item"><span class="info-lbl">Requested By</span><span class="info-val">TOHFA Admin</span></div>
              <div class="info-item"><span class="info-lbl">Submitted On</span><span class="info-val">14 Oct 2026, 12:30 PM</span></div>
              <div class="info-item"><span class="info-lbl">Payout Purpose</span><span class="info-val">Produce procurement settlement</span></div>
              <div class="info-item"><span class="info-lbl">Requested Amount</span><span class="info-val-orange">₹18,500</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Payout Breakdown</h3></div>
            <table class="payout-table">
              <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                <tr><td>Produce amount</td><td>₹16,800</td></tr>
                <tr><td>Quality adjustment</td><td>₹700</td></tr>
                <tr><td>Previous balance (credit)</td><td>₹1,000</td></tr>
                <tr class="total-row"><td>Total Requested Payout</td><td>₹18,500</td></tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Supporting Documents (2)</h3></div>
            <div class="doc-list">
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Purchase_Statement_Oct.pdf</p><p class="doc-meta">2.4 MB | Uploaded on 14 Oct 2026, 12:10 PM</p></div>
                <div class="doc-actions"><button type="button" class="btn-doc-action" (click)="openDoc('Purchase_Statement_Oct.pdf')">View</button><button type="button" class="btn-doc-action">Download</button></div>
              </div>
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Quality_Verification.pdf</p><p class="doc-meta">1.8 MB | Uploaded on 14 Oct 2026, 12:12 PM</p></div>
                <div class="doc-actions"><button type="button" class="btn-doc-action" (click)="openDoc('Quality_Verification.pdf')">View</button><button type="button" class="btn-doc-action">Download</button></div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Decision Summary</h3></div>
            <div class="decision-status-row">
              <div class="pill-decision-approved">✓ Approved</div>
              <div class="info-item"><span class="info-lbl">Decided By</span><span class="info-val">Super Admin (SA-0001)</span></div>
              <div class="info-item"><span class="info-lbl">Decision Date</span><span class="info-val">14 Oct 2026, 06:42 PM</span></div>
            </div>
            <p class="remarks-quote">"Documents verified. Payout breakdown checked and approved for processing."</p>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Approval Timeline</h3></div>
            <div class="timeline-wrap">
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Submitted by TOHFA Admin</span><span class="timeline-time">14 Oct 2026, 12:30 PM</span></div><p class="timeline-step-desc">Request created and submitted for approval.</p></div>
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Reviewed by Finance Team</span><span class="timeline-time">14 Oct 2026, 02:10 PM</span></div><p class="timeline-step-desc">Payout details and documents verified.</p></div>
              <div class="timeline-step"><div class="timeline-dot escalated"><span class="red-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Escalated to Super Admin</span><span class="timeline-time">14 Oct 2026, 06:30 PM</span></div><p class="timeline-step-desc">Escalated due to high payout amount (₹18,500).</p></div>
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Approved by Super Admin</span><span class="timeline-time">14 Oct 2026, 06:42 PM</span></div><p class="timeline-step-desc">Request approved for finance processing.</p></div>
              <div class="timeline-step"><div class="timeline-dot in-progress"><span class="red-dot" style="background: var(--tohfa-amber, #E48932);"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Awaiting Finance Processing</span></div><p class="timeline-step-desc">Approved request is awaiting payout processing by the Finance team.</p></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Audit Information</h3></div>
            <div class="audit-grid">
              <div class="info-item"><span class="info-lbl">Created On</span><span class="info-val">14 Oct 2026, 12:30 PM</span></div>
              <div class="info-item"><span class="info-lbl">Last Updated On</span><span class="info-val">14 Oct 2026, 06:42 PM</span></div>
              <div class="info-item"><span class="info-lbl">Source Module</span><span class="info-val">Purchase Management</span></div>
              <div class="info-item"><span class="info-lbl">Assigned Approver</span><span class="info-val">Super Admin (SA-0001)</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <button type="button" class="btn-back" (click)="goBack()">← Back to Approvals Inbox</button>
        <button type="button" class="btn-primary-action" (click)="currentView.set('processing')">View Finance Processing →</button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 6: 3-COLUMN FINANCE PROCESSING                                     -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'processing'">
      <div class="top-summary-header">
        <div class="top-summary-left">
          <div class="top-summary-icon">💵</div>
          <div><h2 class="top-summary-title">Farmer Payout</h2><p class="top-summary-sub">Request ID: PAY-2026-00128</p></div>
        </div>
        <div class="top-summary-meta-row">
          <div class="info-item"><span class="info-lbl">Status</span><span class="status-pill-awaiting">🔄 Awaiting Processing</span></div>
          <div class="info-item"><span class="info-lbl">Approved Amount</span><span class="info-val">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
        </div>
      </div>

      <div class="layout-3col">
        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Farmer & Request Details</h3></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Requested By</span><span class="info-val">TOHFA Admin</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Approval Date</span><span class="info-val">14 Oct 2026, 06:42 PM</span></div>
            <div class="info-item"><span class="info-lbl">Payout Purpose</span><span class="info-val">Produce procurement settlement</span></div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Payout Breakdown</h3></div>
            <table class="payout-table">
              <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                <tr><td>Produce amount</td><td>₹16,800</td></tr>
                <tr><td>Quality adjustment</td><td>₹700</td></tr>
                <tr><td>Previous balance (credit)</td><td>₹1,000</td></tr>
                <tr class="total-row"><td>Total Payout Amount</td><td>₹18,500</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Payment & Settlement Details</h3></div>
            <div class="stepper-progress">
              <div class="stepper-track-line" style="background: linear-gradient(to right, #1E8E5A 33%, #E4E0D3 33%);"></div>
              <div class="stepper-item"><div class="stepper-circle done">✓</div><span class="stepper-lbl">Approved</span><span class="stepper-sub">14 Oct 2026</span></div>
              <div class="stepper-item"><div class="stepper-circle active-amber">🟠</div><span class="stepper-lbl" style="color: var(--tohfa-amber, #E48932)">In Processing</span><span class="stepper-sub">Finance</span></div>
              <div class="stepper-item"><div class="stepper-circle pending">⚪</div><span class="stepper-lbl">Paid</span><span class="stepper-sub">Not Yet</span></div>
              <div class="stepper-item"><div class="stepper-circle pending">⚪</div><span class="stepper-lbl">Settled</span><span class="stepper-sub">Not Yet</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Supporting Documents (2)</h3></div>
            <div class="doc-list">
              <div class="doc-row"><p class="doc-name">Purchase_Statement_Oct.pdf</p><button type="button" class="btn-doc-action" (click)="openDoc('Purchase_Statement_Oct.pdf')">View</button></div>
              <div class="doc-row"><p class="doc-name">Quality_Verification.pdf</p><button type="button" class="btn-doc-action" (click)="openDoc('Quality_Verification.pdf')">View</button></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Transaction Timeline</h3></div>
            <div class="timeline-wrap">
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Approval Completed</span><span class="timeline-time">14 Oct 2026, 06:42 PM</span></div><p class="timeline-step-desc">Request approved by Super Admin.</p></div>
              <div class="timeline-step"><div class="timeline-dot in-progress"><span class="red-dot" style="background: var(--tohfa-amber, #E48932);"></span></div><div class="timeline-header-row"><span class="timeline-step-title" style="color: var(--tohfa-amber, #E48932);">In Finance Processing</span><span class="timeline-time">14 Oct 2026, 06:45 PM</span></div><p class="timeline-step-desc">Payout is being processed.</p></div>
              <div class="timeline-step"><div class="timeline-dot" style="border-color: #E4E0D3; background: #fff;"></div><div class="timeline-header-row"><span class="timeline-step-title" style="color: #9AA294">Payment Completed</span></div><p class="timeline-step-desc">Payment will be recorded after transfer.</p></div>
              <div class="timeline-step"><div class="timeline-dot" style="border-color: #E4E0D3; background: #fff;"></div><div class="timeline-header-row"><span class="timeline-step-title" style="color: #9AA294">Settlement Completed</span></div><p class="timeline-step-desc">Payout will be marked as settled.</p></div>
            </div>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Process Payout</h3></div>
            <div class="form-group">
              <label class="form-label">Payment Method *</label>
              <select class="input-text"><option>Bank Transfer (NEFT/RTGS)</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Bank Account (Farmer)</label>
              <div class="bank-acc-callout">A/c No: 501234567891 | IFSC: SBIN0008765</div>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Reference No. *</label>
              <input type="text" class="input-text" [(ngModel)]="paymentRef" />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Date *</label>
              <input type="text" class="input-text" [(ngModel)]="paymentDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Remarks (Optional)</label>
              <textarea class="input-text" rows="2" [(ngModel)]="paymentRemarks"></textarea>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px;">
              <button type="button" class="btn-back" style="flex: 1; justify-content: center;">Save as Draft</button>
              <button type="button" class="btn-primary-action" style="flex: 1; justify-content: center;" (click)="currentView.set('paid_awaiting')">✓ Mark as Paid</button>
            </div>
          </div>

          <div class="note-box">
            <strong>Note:</strong> Once marked as paid, the payout will move to settlement reconciliation.
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <button type="button" class="btn-back" (click)="currentView.set('approved_detail')">← Back to Request Details</button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 7: PAID — AWAITING SETTLEMENT (Image 1 & 2 in previous upload)     -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'paid_awaiting'">
      <div class="top-summary-header">
        <div class="top-summary-left">
          <div class="top-summary-icon">💵</div>
          <div><h2 class="top-summary-title">Farmer Payout</h2><p class="top-summary-sub">Request ID: PAY-2026-00128</p></div>
        </div>
        <div class="top-summary-meta-row">
          <div class="info-item"><span class="info-lbl">Status</span><span class="status-pill-awaiting">🔄 Paid — Awaiting Settlement</span></div>
          <div class="info-item"><span class="info-lbl">Amount</span><span class="info-val">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
        </div>
      </div>

      <div class="banner-row">
        <div class="stepper-card">
          <div class="card-header" style="margin-bottom: 8px;"><h3 class="card-title">Payment Progress</h3></div>
          <div class="stepper-progress">
            <div class="stepper-track-line pending-end"></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('approved_detail')"><div class="stepper-circle done">✓</div><span class="stepper-lbl">Approved</span><span class="stepper-sub">14 Oct 2026<br/>06:42 PM</span></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('processing')"><div class="stepper-circle done">✓</div><span class="stepper-lbl">In Processing</span><span class="stepper-sub">14 Oct 2026<br/>06:45 PM</span></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('paid_awaiting')"><div class="stepper-circle active-amber">✓</div><span class="stepper-lbl" style="color: var(--tohfa-amber, #E48932)">Paid</span><span class="stepper-sub">14 Oct 2026<br/>07:10 PM</span></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('settled')"><div class="stepper-circle pending">⚪</div><span class="stepper-lbl" style="color: var(--tohfa-muted, #9AA294)">Settled</span><span class="stepper-sub">Pending</span></div>
          </div>
        </div>

        <div class="banner-amber">
          <div style="font-size: 20px;">ⓘ</div>
          <div>
            <h4 style="font-size: 13px; font-weight: 700; color: #8C590E; margin: 0 0 2px;">Bank payment has been recorded.</h4>
            <p style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); margin: 0;">The payout of ₹18,500 has been completed, but final settlement confirmation is still pending.</p>
          </div>
        </div>
      </div>

      <div class="layout-2col">
        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Payment Confirmation</h3></div>
            <div class="audit-grid" style="margin-bottom: 14px;">
              <div class="info-item"><span class="info-lbl">Payment Method</span><span class="info-val">Bank Transfer (NEFT/RTGS)</span></div>
              <div class="info-item"><span class="info-lbl">Bank Account (Farmer)</span><span class="info-val">A/c No: ******67891</span></div>
              <div class="info-item"><span class="info-lbl">Payment Reference / UTR</span><span class="info-val">TXN78543021</span></div>
              <div class="info-item"><span class="info-lbl">Payment Date</span><span class="info-val">14 Oct 2026</span></div>
              <div class="info-item"><span class="info-lbl">Paid Amount</span><span class="info-val-orange">₹18,500</span></div>
              <div class="info-item"><span class="info-lbl">Payment Recorded By</span><span class="info-val">Finance Team</span></div>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Proof</label>
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Bank_Transfer_Confirmation.pdf</p><p class="doc-meta">1.2 MB | Uploaded on 14 Oct 2026, 07:12 PM</p></div>
                <div class="doc-actions">
                  <button type="button" class="btn-doc-action" (click)="openDoc('Bank_Transfer_Confirmation.pdf')">View</button>
                  <button type="button" class="btn-doc-action">Download</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Settlement Reconciliation</h3></div>
            <div style="margin-bottom: 12px;"><span class="info-lbl">Settlement Status</span><span class="pill-badge pill-inprogress">Pending Confirmation</span></div>
            <div class="form-group"><label class="form-label">Bank Confirmation Date *</label><input type="text" class="input-text" [(ngModel)]="bankConfirmDate" /></div>
            <div class="form-group"><label class="form-label">Settlement Reference / Bank UTR *</label><input type="text" class="input-text" [(ngModel)]="settlementRef" /></div>
            <div class="form-group"><label class="form-label">Reconciliation Remarks *</label><textarea class="input-text" rows="3" [(ngModel)]="reconciliationRemarks"></textarea></div>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Settlement Checklist</h3></div>
            <div class="checklist-group">
              <label class="checklist-item" (click)="chkUtr = !chkUtr"><div class="chk-box" [class.checked]="chkUtr">✓</div><span>Payment reference / UTR verified</span></label>
              <label class="checklist-item" (click)="chkMatch = !chkMatch"><div class="chk-box" [class.checked]="chkMatch">✓</div><span>Paid amount matches the approved amount (₹18,500)</span></label>
              <label class="checklist-item" (click)="chkBankRecv = !chkBankRecv"><div class="chk-box" [class.checked]="chkBankRecv">✓</div><span>Bank confirmation received (credit to farmer's account)</span></label>
              <label class="checklist-item" (click)="chkProof = !chkProof"><div class="chk-box" [class.checked]="chkProof">✓</div><span>Transaction proof (bank confirmation) attached</span></label>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Transaction Timeline</h3></div>
            <div class="timeline-wrap">
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Approved</span><span class="timeline-time">14 Oct 2026, 06:42 PM</span></div></div>
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">In Processing</span><span class="timeline-time">14 Oct 2026, 06:45 PM</span></div></div>
              <div class="timeline-step"><div class="timeline-dot in-progress"><span class="red-dot" style="background: var(--tohfa-amber, #E48932);"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Paid</span><span class="timeline-time">14 Oct 2026, 07:10 PM</span></div></div>
              <div class="timeline-step"><div class="timeline-dot" style="border-color: #E4E0D3; background: #fff;"></div><div class="timeline-header-row"><span class="timeline-step-title" style="color: #9AA294;">Awaiting Settlement</span></div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <button type="button" class="btn-back" (click)="currentView.set('processing')">← Back to Payout Processing</button>
        <button type="button" class="btn-primary-action" (click)="currentView.set('settled')">✓ Confirm Settlement</button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 8: PAYOUT SETTLED (Initial Settled View - Image 1 in latest upload) -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'settled'">
      <div class="top-summary-header">
        <div class="top-summary-left">
          <div class="top-summary-icon">💵</div>
          <div><h2 class="top-summary-title">Farmer Payout</h2><p class="top-summary-sub">Request ID: PAY-2026-00128</p></div>
        </div>
        <div class="top-summary-meta-row">
          <div class="info-item"><span class="info-lbl">Status</span><span class="status-pill-settled">✓ Settled</span></div>
          <div class="info-item"><span class="info-lbl">Amount</span><span class="info-val">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
        </div>
      </div>

      <div class="banner-row">
        <div class="stepper-card">
          <div class="card-header" style="margin-bottom: 8px;"><h3 class="card-title">Payment Progress</h3></div>
          <div class="stepper-progress">
            <div class="stepper-track-line" style="background: #1E8E5A;"></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('approved_detail')"><div class="stepper-circle done">✓</div><span class="stepper-lbl">Approved</span><span class="stepper-sub">14 Oct 2026<br/>06:42 PM</span></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('processing')"><div class="stepper-circle done">✓</div><span class="stepper-lbl">In Processing</span><span class="stepper-sub">14 Oct 2026<br/>06:45 PM</span></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('paid_awaiting')"><div class="stepper-circle done">✓</div><span class="stepper-lbl">Paid</span><span class="stepper-sub">14 Oct 2026<br/>07:10 PM</span></div>
            <div class="stepper-item" style="cursor: pointer;" (click)="currentView.set('settlement_full')"><div class="stepper-circle done">✓</div><span class="stepper-lbl" style="color: #1E8E5A">Settled</span><span class="stepper-sub">14 Oct 2026<br/>07:38 PM</span></div>
          </div>
        </div>

        <div class="banner-green">
          <div class="banner-green-left">
            <div class="status-alert-icon" style="font-size: 22px;">✓</div>
            <div>
              <h4 class="status-alert-title">Payout Settled</h4>
              <p class="status-alert-sub">The payout of ₹18,500 has been fully processed, confirmed by the bank and marked as settled.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="layout-2col">
        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Payment & Settlement Details</h3></div>
            <div class="audit-grid">
              <div class="info-item"><span class="info-lbl">Payment Method</span><span class="info-val">Bank Transfer (NEFT/RTGS)</span></div>
              <div class="info-item"><span class="info-lbl">Bank Account (Farmer)</span><span class="info-val">A/c No: ******67891 | IFSC: SBIN0008765</span></div>
              <div class="info-item"><span class="info-lbl">Payment Reference / UTR</span><span class="info-val">TXN78543021</span></div>
              <div class="info-item"><span class="info-lbl">Payment Date</span><span class="info-val">14 Oct 2026, 07:10 PM</span></div>
              <div class="info-item"><span class="info-lbl">Settlement Date</span><span class="info-val">14 Oct 2026, 07:38 PM</span></div>
              <div class="info-item"><span class="info-lbl">Paid Amount</span><span class="info-val-orange">₹18,500</span></div>
              <div class="info-item"><span class="info-lbl">Settlement Status</span><span class="status-pill-settled">✓ Settled</span></div>
              <div class="info-item"><span class="info-lbl">Settlement Reference</span><span class="info-val">SET-2026-00456</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Settlement Documents (2)</h3></div>
            <div class="doc-list">
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Bank_Transfer_Confirmation.pdf</p><p class="doc-meta">1.2 MB | Uploaded on 14 Oct 2026, 07:12 PM</p></div>
                <div class="doc-actions"><button type="button" class="btn-doc-action" (click)="openDoc('Bank_Transfer_Confirmation.pdf')">View</button><button type="button" class="btn-doc-action">Download</button></div>
              </div>
              <div class="doc-row">
                <div class="doc-left"><p class="doc-name">Settlement_Confirmation.pdf</p><p class="doc-meta">0.8 MB | Uploaded on 14 Oct 2026, 07:38 PM</p></div>
                <div class="doc-actions"><button type="button" class="btn-doc-action" (click)="openDoc('Settlement_Confirmation.pdf')">View</button><button type="button" class="btn-doc-action">Download</button></div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Settlement Remarks</h3></div>
            <div class="justification-box">
              Bank payment confirmed. Payout of ₹18,500 settled successfully.
            </div>
          </div>
        </div>

        <div class="col-stack">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Settlement Summary</h3></div>
            <div class="note-box" style="margin-bottom: 14px;">
              <strong>✓ Settlement Completed</strong> — Bank confirmation received and the payout is fully settled.
            </div>
            <div class="checklist-group">
              <div class="checklist-item"><div class="chk-box checked">✓</div><span>Payment reference / UTR verified</span></div>
              <div class="checklist-item"><div class="chk-box checked">✓</div><span>Paid amount matches the approved amount (₹18,500)</span></div>
              <div class="checklist-item"><div class="chk-box checked">✓</div><span>Bank confirmation received (credit to farmer's account)</span></div>
              <div class="checklist-item"><div class="chk-box checked">✓</div><span>Transaction proof (bank confirmation) attached</span></div>
              <div class="checklist-item"><div class="chk-box checked">✓</div><span>Settlement recorded in accounts</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Transaction Timeline</h3></div>
            <div class="timeline-wrap">
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Approved</span><span class="timeline-time">14 Oct 2026, 06:42 PM</span></div></div>
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">In Processing</span><span class="timeline-time">14 Oct 2026, 06:45 PM</span></div></div>
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Paid</span><span class="timeline-time">14 Oct 2026, 07:10 PM</span></div></div>
              <div class="timeline-step"><div class="timeline-dot"><span class="green-dot"></span></div><div class="timeline-header-row"><span class="timeline-step-title">Settled</span><span class="timeline-time">14 Oct 2026, 07:38 PM</span></div></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Audit Information</h3></div>
            <div class="audit-grid">
              <div class="info-item"><span class="info-lbl">Created On</span><span class="info-val">14 Oct 2026, 12:30 PM</span></div>
              <div class="info-item"><span class="info-lbl">Last Updated On</span><span class="info-val">14 Oct 2026, 07:38 PM</span></div>
              <div class="info-item"><span class="info-lbl">Last Updated By</span><span class="info-val">Finance Team</span></div>
              <div class="info-item"><span class="info-lbl">Source Module</span><span class="info-val">Finance / Payout Processing</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar: Matches Image 1 -->
      <div class="bottom-bar">
        <button type="button" class="btn-back" (click)="currentView.set('paid_awaiting')">← Back to Request Details</button>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn-back" (click)="printReport()">🖨 Print</button>
          <button type="button" class="btn-back" (click)="openDoc('Bank_Transfer_Confirmation.pdf')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Settlement Report</span>
          </button>
          <button type="button" class="btn-primary-action" (click)="viewProduceDetails()">
            <span>View details</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 9: FULL PAYOUT SETTLEMENT DETAILS (Image 3 & 4 in latest upload)   -->
    <!-- SA-M2-S19j · Payout Settlement Details (Settled)                          -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'settlement_full'">
      <!-- Top Summary Card with Payout ID -->
      <div class="top-summary-header">
        <div class="top-summary-left">
          <div class="top-summary-icon">💵</div>
          <div><h2 class="top-summary-title">Payout ID</h2><p class="top-summary-sub">PAY-2026-00128</p></div>
        </div>
        <div class="top-summary-meta-row">
          <div class="info-item"><span class="info-lbl">Status</span><span class="status-pill-settled">✓ Settled</span></div>
          <div class="info-item"><span class="info-lbl">Settlement Amount</span><span class="info-val">₹18,500</span></div>
          <div class="info-item"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
          <div class="info-item"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
          <div class="info-item"><span class="info-lbl">Zone</span><span class="info-val">Coonoor</span></div>
        </div>
      </div>

      <!-- Banner Row with Settled On & Settlement Ref. No. -->
      <div class="banner-row">
        <div class="banner-green">
          <div class="banner-green-left">
            <div class="status-alert-icon" style="font-size: 22px;">✓</div>
            <div>
              <h4 class="status-alert-title">Payout Settled Successfully</h4>
              <p class="status-alert-sub">The payout of ₹18,500 has been fully processed, transferred to the farmer's bank account and marked as settled.</p>
            </div>
          </div>
          <div class="banner-meta-right">
            <div class="info-item">
              <span class="info-lbl">Settled On</span>
              <span class="info-val">14 Oct 2026, 07:38 PM</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">Settlement Ref. No.</span>
              <span class="info-val">SET-2026-00456</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3-Column Layout from Image 3 & 4 -->
      <div class="layout-3col">
        <!-- Col 1: Request Information & Payout Breakdown -->
        <div class="col-stack">
          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <h3 class="card-title">Request Information</h3>
              </div>
            </div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Farmer</span><span class="info-val">Ramesh Kumar</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Farmer ID</span><span class="info-val">FMR-00124</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Requested By</span><span class="info-val">TOHFA Admin</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Submitted On</span><span class="info-val">14 Oct 2026, 12:30 PM</span></div>
            <div class="info-item" style="margin-bottom: 10px;"><span class="info-lbl">Payout Purpose</span><span class="info-val">Produce procurement settlement</span></div>
            <div class="info-item"><span class="info-lbl">Requested Amount</span><span class="info-val-orange">₹18,500</span></div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </span>
                <h3 class="card-title">Payout Breakdown</h3>
              </div>
            </div>
            <table class="payout-table">
              <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                <tr><td>Produce amount</td><td>₹16,800</td></tr>
                <tr><td>Quality adjustment</td><td>₹700</td></tr>
                <tr><td>Previous balance (credit)</td><td>₹1,000</td></tr>
                <tr class="total-row"><td>Total Settlement Amount</td><td>₹18,500</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Col 2: Settlement Details & Bank Transaction Details -->
        <div class="col-stack">
          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </span>
                <h3 class="card-title">Settlement Details</h3>
              </div>
            </div>
            <div class="audit-grid">
              <div class="info-item"><span class="info-lbl">Settlement Status</span><span class="status-pill-settled">✓ Settled</span></div>
              <div class="info-item"><span class="info-lbl">Settlement Date</span><span class="info-val">14 Oct 2026, 07:38 PM</span></div>
              <div class="info-item"><span class="info-lbl">Paid Amount</span><span class="info-val-orange">₹18,500</span></div>
              <div class="info-item"><span class="info-lbl">Payment Method</span><span class="info-val">Bank Transfer (NEFT/RTGS)</span></div>
              <div class="info-item"><span class="info-lbl">Settlement Reference</span><span class="info-val">SET-2026-00456</span></div>
              <div class="info-item"><span class="info-lbl">Reconciliation Status</span><span class="status-pill-reconciled">✓ Reconciled</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2l9 5H3l9-5z"></path>
                  </svg>
                </span>
                <h3 class="card-title">Bank Transaction Details</h3>
              </div>
            </div>
            <div class="audit-grid">
              <div class="info-item"><span class="info-lbl">Bank Name</span><span class="info-val">Bank of India</span></div>
              <div class="info-item"><span class="info-lbl">Account Number</span><span class="info-val">•••• 6789</span></div>
              <div class="info-item"><span class="info-lbl">IFSC Code</span><span class="info-val">SBIN0008765</span></div>
              <div class="info-item"><span class="info-lbl">Transaction ID / UTR</span><span class="info-val">TXN78543021</span></div>
              <div class="info-item"><span class="info-lbl">Transaction Date & Time</span><span class="info-val">14 Oct 2026, 07:10 PM</span></div>
              <div class="info-item"><span class="info-lbl">Bank Confirmation</span><span class="status-pill-settled">✓ Received</span></div>
            </div>
          </div>
        </div>

        <!-- Col 3: Settlement Timeline (6 steps) -->
        <div class="col-stack">
          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                <h3 class="card-title">Settlement Timeline</h3>
              </div>
            </div>
            <div class="timeline-wrap">
              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Submitted by TOHFA Admin</span><span class="timeline-time">14 Oct 2026, 12:30 PM</span></div>
                <p class="timeline-step-desc">Request created and submitted for approval.</p>
                <div><span class="pill-badge pill-submitted">Submitted</span></div>
              </div>

              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Reviewed by Finance Team</span><span class="timeline-time">14 Oct 2026, 02:10 PM</span></div>
                <p class="timeline-step-desc">Payout details and documents verified.</p>
                <div><span class="pill-badge pill-reviewed">Reviewed</span></div>
              </div>

              <div class="timeline-step">
                <div class="timeline-dot escalated"><span class="red-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Escalated to Super Admin</span><span class="timeline-time">14 Oct 2026, 06:30 PM</span></div>
                <p class="timeline-step-desc">Escalated due to high payout amount (₹18,500).</p>
                <div><span class="pill-badge pill-escalated">Escalated</span></div>
              </div>

              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Approved by Super Admin</span><span class="timeline-time">14 Oct 2026, 06:42 PM</span></div>
                <p class="timeline-step-desc">Request approved for finance processing.</p>
                <div><span class="pill-badge pill-approved">Approved</span></div>
              </div>

              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Finance Processing</span><span class="timeline-time">14 Oct 2026, 07:10 PM</span></div>
                <p class="timeline-step-desc">Payment initiated to the farmer's bank account.</p>
                <div><span class="pill-badge pill-processed">Processed</span></div>
              </div>

              <div class="timeline-step">
                <div class="timeline-dot"><span class="green-dot"></span></div>
                <div class="timeline-header-row"><span class="timeline-step-title">Payout Settled</span><span class="timeline-time">14 Oct 2026, 07:38 PM</span></div>
                <p class="timeline-step-desc">Bank confirmation received and payout settled.</p>
                <div><span class="pill-badge pill-settled">Settled</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Settlement Documents & Audit Information -->
      <div class="layout-2col">
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="card-header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                </svg>
              </span>
              <h3 class="card-title">Settlement Documents (2)</h3>
            </div>
          </div>
          <div class="doc-list">
            <div class="doc-row">
              <div class="doc-left">
                <div class="doc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>
                <div><p class="doc-name">Bank_Transfer_Confirmation.pdf</p><p class="doc-meta">1.2 MB | Uploaded on 14 Oct 2026, 07:12 PM</p></div>
              </div>
              <div class="doc-actions">
                <button type="button" class="btn-doc-action" (click)="openDoc('Bank_Transfer_Confirmation.pdf')">View</button>
                <button type="button" class="btn-doc-action">Download</button>
              </div>
            </div>
            <div class="doc-row">
              <div class="doc-left">
                <div class="doc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>
                <div><p class="doc-name">Settlement_Confirmation.pdf</p><p class="doc-meta">0.8 MB | Uploaded on 14 Oct 2026, 07:38 PM</p></div>
              </div>
              <div class="doc-actions">
                <button type="button" class="btn-doc-action" (click)="openDoc('Settlement_Confirmation.pdf')">View</button>
                <button type="button" class="btn-doc-action">Download</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="card-header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              <h3 class="card-title">Audit Information</h3>
            </div>
          </div>
          <div class="audit-grid">
            <div class="info-item"><span class="info-lbl">Created On</span><span class="info-val">14 Oct 2026, 12:30 PM</span></div>
            <div class="info-item"><span class="info-lbl">Last Updated On</span><span class="info-val">14 Oct 2026, 07:38 PM</span></div>
            <div class="info-item"><span class="info-lbl">Updated By</span><span class="info-val">Finance Team</span></div>
            <div class="info-item"><span class="info-lbl">Source Module</span><span class="info-val">Finance / Payout Processing</span></div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar: Matches Image 4 -->
      <div class="bottom-bar">
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn-back" (click)="goBack()">← Back to Approvals Inbox</button>
          <button type="button" class="btn-back" (click)="currentView.set('settled')">← Back to Summary</button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn-back" (click)="printReport()">🖨 Print</button>
          <button type="button" class="btn-back" (click)="openDoc('Bank_Transfer_Confirmation.pdf')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Settlement Report</span>
          </button>
          <button type="button" class="btn-primary-action" (click)="viewProduceDetails()">
            <span>View Produce & Crop Details</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- DOCUMENT VIEWER MODAL: BANK TRANSFER CONFIRMATION (Exact to Mockup)          -->
    <!-- ========================================================================= -->
    <div class="modal-backdrop" *ngIf="showDocViewerModal" (click)="showDocViewerModal = false">
      <div class="pdf-modal-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="pdf-modal-header">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="pdf-meta-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <h3 style="font-size: 14.5px; font-weight: 700; color: var(--tohfa-ink, #1D2420); margin: 0 0 2px;">Bank Transfer Confirmation</h3>
              <p style="font-size: 11.5px; color: var(--tohfa-slate, #5C6B63); margin: 0 0 4px;">Bank_Transfer_Confirmation.pdf</p>
              <div style="display: flex; align-items: center; gap: 16px; font-size: 11px; color: #6B7280;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  1.2 MB
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Uploaded on 14 Oct 2026, 07:12 PM
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Uploaded by Finance Team
                </span>
              </div>
            </div>
          </div>
          <button type="button" class="modal-close-btn" style="position: static; font-size: 18px; color: #4B5563;" (click)="showDocViewerModal = false">✕</button>
        </div>

        <!-- PDF Toolbar -->
        <div class="pdf-toolbar">
          <span class="pdf-toolbar-filename">Bank_Transfer_Confirmation.pdf</span>
          <div class="pdf-toolbar-controls">
            <button type="button" class="pdf-tb-btn">&lt;</button>
            <span style="color: #E5E7EB; font-weight: 500;">1 / 1</span>
            <button type="button" class="pdf-tb-btn">&gt;</button>
            <span style="margin: 0 4px; color: #6B7280;">|</span>
            <button type="button" class="pdf-tb-btn">−</button>
            <span style="color: #E5E7EB; font-weight: 500;">100%</span>
            <button type="button" class="pdf-tb-btn">+</button>
            <span style="margin: 0 4px; color: #6B7280;">|</span>
            <button type="button" class="pdf-tb-btn" title="Fullscreen">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
            <button type="button" class="pdf-tb-btn" title="Download">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button type="button" class="pdf-tb-btn" title="Print">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
          </div>
        </div>

        <!-- Sheet Preview -->
        <div class="pdf-body-scroll">
          <div class="pdf-sheet">
            <!-- Sheet Header / Logo -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="2.2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 16px; font-weight: 800; color: #1D2420; letter-spacing: 0.5px;">TOHFA</span>
                <div style="font-size: 9.5px; color: #5C6B63; font-weight: 500; line-height: 1.25;">
                  Nilgiris Horticulture<br/>Organic Farmers Association
                </div>
              </div>
            </div>

            <div style="margin: 22px 0 6px;">
              <h3 style="font-size: 15px; font-weight: 800; color: #1E8E5A; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
                BANK TRANSFER CONFIRMATION
              </h3>
            </div>
            <div style="height: 1.5px; background: #1E8E5A; margin: 10px 0 24px; opacity: 0.85;"></div>

            <!-- Two Column Key-Value aligned with colon -->
            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 12px; margin-bottom: 28px;">
              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Transaction Reference (UTR)</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">TXN78543021</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Settlement Reference</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">SET-2026-00456</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Farmer Name</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">Ramesh Kumar</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Farmer ID</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">FMR-00124</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Bank Account</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">Bank of India •••• 6789</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">IFSC Code</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">SBIN0008765</strong>
              </div>

              <!-- Highlighted Amount Row -->
              <div style="display: flex; align-items: center; background: #EAF6EE; padding: 10px 14px; border-radius: 6px; margin: 2px 0;">
                <span style="width: 216px; color: #166534; font-weight: 600;">Amount Transferred</span>
                <span style="color: #166534; margin-right: 8px; font-weight: 700;">:</span>
                <strong style="color: #166534; font-size: 13.5px; font-weight: 800;">₹18,500.00</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Transaction Date & Time</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <strong style="color: #1D2420; font-weight: 800;">14 Oct 2026, 07:10 PM</strong>
              </div>

              <div style="display: flex; align-items: center;">
                <span style="width: 230px; color: #5C6B63; font-weight: 500;">Transaction Status</span>
                <span style="color: #5C6B63; margin-right: 8px;">:</span>
                <span style="background: #E8F7EE; color: #1E8E5A; font-weight: 800; font-size: 10px; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.5px;">SUCCESSFUL</span>
              </div>
            </div>

            <!-- Bottom Confirmation & Stamp -->
            <div style="margin-top: 36px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 38px; height: 38px; border-radius: 6px; background: #FAF5EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2">
                    <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2L2 7h20L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h4 style="font-size: 12px; font-weight: 700; color: #1D2420; margin: 0 0 2px 0;">Bank Confirmation</h4>
                  <p style="font-size: 11px; color: #5C6B63; margin: 0; max-width: 340px; line-height: 1.35;">
                    The above amount of ₹18,500.00 has been successfully transferred to the farmer's bank account.
                  </p>
                </div>
              </div>

              <!-- Circular Green Stamp -->
              <div class="pdf-stamp-circle">
                <div style="width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #1E8E5A; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span style="font-size: 6.5px; font-weight: 800; color: #1E8E5A; text-align: center; line-height: 1.15; letter-spacing: 0.3px;">
                  BANK CONFIRMATION<br/>RECEIVED
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 14px 24px; display: flex; justify-content: flex-end; align-items: center; gap: 12px; border-top: 1px solid var(--tohfa-border, #E4E0D3); background: #ffffff;">
          <button type="button" class="btn-pdf-close" (click)="showDocViewerModal = false">Close</button>
          <button type="button" class="btn-pdf-download" (click)="showDocViewerModal = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ApprovalPayoutDetailComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentView = signal<ApprovalViewMode>('details');
  showDecisionModal = false;
  showDocViewerModal = false;
  activeDocName = 'Bank_Transfer_Confirmation.pdf';

  // Review Form
  chkDetails = true;
  chkDocs = true;
  chkAmount = true;
  chkRequester = true;
  selectedDecision: 'Approve' | 'Reject' = 'Approve';
  reviewRemarks = 'Documents verified. Payout breakdown checked and approved for processing.';

  // Finance Form
  paymentRef = 'TXN78543021';
  paymentDate = '14 Oct 2026';
  paymentRemarks = 'Payout processed for produce settlement.';

  // Settlement Form (Image 1 & 2)
  bankConfirmDate = '14 Oct 2026';
  settlementRef = 'SET-2026-00456';
  reconciliationRemarks = 'Bank confirmation received and verified. Amount successfully credited.';
  chkUtr = true;
  chkMatch = true;
  chkBankRecv = true;
  chkProof = true;

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode'] || params['tab'];
      if (mode === 'review') {
        this.currentView.set('review');
      } else if (mode === 'approved') {
        this.currentView.set('approved_detail');
      } else if (mode === 'processing') {
        this.currentView.set('processing');
      } else if (mode === 'paid_awaiting') {
        this.currentView.set('paid_awaiting');
      } else if (mode === 'settled') {
        this.currentView.set('settled');
      } else if (mode === 'settlement_full') {
        this.currentView.set('settlement_full');
      } else {
        this.currentView.set('details');
      }
    });
  }

  goBack(): void {
    this.showDecisionModal = false;
    this.showDocViewerModal = false;
    this.router.navigate(['/approvals']);
  }

  goToReview(): void {
    this.currentView.set('review');
  }

  goToDetails(): void {
    this.currentView.set('details');
  }

  submitDecision(): void {
    this.showDecisionModal = true;
  }

  openApprovedDetail(): void {
    this.showDecisionModal = false;
    this.currentView.set('approved_detail');
  }

  openDoc(name: string): void {
    this.activeDocName = name;
    this.showDocViewerModal = true;
  }

  printReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  viewProduceDetails(): void {
    this.router.navigate(['/listings'], { queryParams: { view: 'crop_detail', cropId: 'CR-2026-0017' } });
  }
}
