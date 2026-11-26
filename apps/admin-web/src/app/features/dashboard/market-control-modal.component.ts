import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type MarketModalMode =
  | 'schedule_open'
  | 'schedule_close'
  | 'confirm_close'
  | 'confirm_open'
  | 'success_closed'
  | 'success_opened';

@Component({
  selector: 'tohfa-market-control-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        max-width: 520px;
        width: 100%;
        max-height: 90vh;
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
        align-items: flex-start;
        justify-content: space-between;
        padding: 22px 24px 16px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .modal-title {
        font-size: 18px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 4px;
        line-height: 1.25;
      }

      .modal-sub {
        font-size: 12px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        padding: 4px;
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

      /* Modal Body */
      .modal-body {
        padding: 20px 24px;
        overflow-y: auto;
      }

      /* Form Controls */
      .grid-2-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 18px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .req {
        color: var(--tohfa-err, #9C2525);
      }

      .input-with-icon {
        position: relative;
        display: flex;
        align-items: center;
      }

      .text-input {
        width: 100%;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 10px 38px 10px 14px;
        font-family: inherit;
        font-size: 13px;
        color: var(--tohfa-ink, #1D2420);
        background: #ffffff;
        transition: border-color 0.15s ease;
      }

      .text-input:focus,
      .text-area:focus {
        outline: none;
        border-color: var(--tohfa-amber, #E48932);
      }

      .input-icon-right {
        position: absolute;
        right: 12px;
        color: var(--tohfa-slate, #5C6B63);
        pointer-events: none;
      }

      /* Repeat Tabs */
      .repeat-tabs-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 18px;
      }

      .repeat-tab {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 10px 6px;
        background: #ffffff;
        text-align: center;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .repeat-tab:hover {
        border-color: rgba(228, 137, 50, 0.4);
      }

      .repeat-tab.active {
        border: 1.5px solid var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-brown, #8A4E15);
        font-weight: 700;
      }

      /* Summary Box */
      .summary-card {
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        padding: 16px 18px;
        margin-bottom: 6px;
      }

      .summary-head {
        font-size: 10.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0 0 12px;
      }

      .summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12.5px;
        margin-bottom: 8px;
      }

      .summary-row:last-child {
        margin-bottom: 0;
      }

      .summary-label {
        color: var(--tohfa-slate, #5C6B63);
        font-weight: 500;
      }

      .summary-val {
        color: var(--tohfa-ink, #1D2420);
        font-weight: 700;
      }

      /* Confirmation Modal Elements */
      .center-badge-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 14px;
      }

      .badge-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .badge-circle.amber {
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
      }

      .badge-circle.red {
        background: var(--tohfa-tint-err, #FDE8E8);
        color: var(--tohfa-err, #9C2525);
      }

      .badge-circle.green {
        background: #E6F4EA;
        color: #1E8E5A;
      }

      .center-title {
        font-size: 18px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        text-align: center;
        margin: 0 0 6px;
      }

      .center-desc {
        font-size: 12.5px;
        color: var(--tohfa-slate, #5C6B63);
        text-align: center;
        line-height: 1.45;
        margin: 0 0 18px;
      }

      /* Status Strip */
      .status-strip-box {
        background: var(--tohfa-amber-tint, #FBEEDE);
        border: 1px solid rgba(228, 137, 50, 0.2);
        border-radius: 10px;
        padding: 12px 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 18px;
      }

      .strip-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .strip-icon {
        color: var(--tohfa-slate, #5C6B63);
        flex-shrink: 0;
      }

      .strip-col {
        display: flex;
        flex-direction: column;
      }

      .strip-lbl {
        font-size: 10.5px;
        font-weight: 600;
        color: var(--tohfa-slate, #5C6B63);
      }

      .strip-val {
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .strip-val.ok {
        color: #1E8E5A;
      }

      .strip-val.err {
        color: var(--tohfa-err, #9C2525);
      }

      .dot-pill {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
      }

      .dot-pill.green { background: #1E8E5A; }
      .dot-pill.red { background: #E53935; }

      .text-area {
        width: 100%;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 10px 14px;
        font-family: inherit;
        font-size: 13px;
        color: var(--tohfa-ink, #1D2420);
        min-height: 80px;
        resize: vertical;
      }

      .char-count {
        font-size: 10.5px;
        color: var(--tohfa-slate, #5C6B63);
        text-align: right;
        margin-top: 4px;
      }

      /* Success Status Strip */
      .success-strip {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 12px 16px;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .success-strip-left {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      /* Footer */
      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--tohfa-border, #E4E0D3);
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
      }

      .btn-cancel {
        flex: 1;
        border: 1.5px solid var(--tohfa-border, #E4E0D3);
        background: #ffffff;
        color: var(--tohfa-ink, #1D2420);
        padding: 11px 20px;
        border-radius: 10px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .btn-cancel:hover {
        background: var(--tohfa-page, #F7F5EE);
      }

      .btn-amber {
        flex: 1.5;
        border: none;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        padding: 11px 20px;
        border-radius: 10px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(228, 137, 50, 0.35);
        transition: background 0.15s ease, transform 0.05s ease;
      }

      .btn-amber:hover {
        background: var(--tohfa-amber-hover, #D47922);
      }

      .btn-amber:active {
        transform: translateY(1px);
      }

      .btn-full {
        width: 100%;
        flex: none;
      }
    `,
  ],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">

        <!-- ================= CASE 1: SCHEDULE MARKET OPEN ================= -->
        <ng-container *ngIf="currentMode() === 'schedule_open'">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Schedule Market Open</h2>
              <p class="modal-sub">Set a date and time to automatically open the market for customers.</p>
            </div>
            <button class="close-btn" type="button" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" x2="6" y1="6" y2="18"></line>
                <line x1="6" x2="18" y1="6" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="grid-2-col">
              <div class="form-group">
                <label class="form-label">Opening Date <span class="req">*</span></label>
                <div class="input-with-icon">
                  <input
                    type="text"
                    class="text-input"
                    [ngModel]="openDate()"
                    (ngModelChange)="openDate.set($event)"
                  />
                  <svg class="input-icon-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Opening Time <span class="req">*</span></label>
                <div class="input-with-icon">
                  <input
                    type="text"
                    class="text-input"
                    [ngModel]="openTime()"
                    (ngModelChange)="openTime.set($event)"
                  />
                  <svg class="input-icon-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 18px;">
              <label class="form-label">Repeat Option</label>
              <div class="repeat-tabs-row">
                <div
                  class="repeat-tab"
                  *ngFor="let opt of repeatOptions"
                  [class.active]="repeatOpen() === opt"
                  (click)="repeatOpen.set(opt)"
                >
                  {{ opt }}
                </div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-head">SCHEDULE SUMMARY</div>
              <div class="summary-row">
                <span class="summary-label">Action</span>
                <span class="summary-val">Open Market</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Date</span>
                <span class="summary-val">{{ openDate() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Time</span>
                <span class="summary-val">{{ openTime() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Repeat</span>
                <span class="summary-val">{{ repeatOpen() }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn-amber" type="button" (click)="applyScheduleOpen()">Schedule Open</button>
          </div>
        </ng-container>

        <!-- ================= CASE 2: SCHEDULE MARKET CLOSE ================= -->
        <ng-container *ngIf="currentMode() === 'schedule_close'">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Schedule Market Close</h2>
              <p class="modal-sub">Set a date and time to automatically close the market for customers.</p>
            </div>
            <button class="close-btn" type="button" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" x2="6" y1="6" y2="18"></line>
                <line x1="6" x2="18" y1="6" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="grid-2-col">
              <div class="form-group">
                <label class="form-label">Closing Date <span class="req">*</span></label>
                <div class="input-with-icon">
                  <input
                    type="text"
                    class="text-input"
                    [ngModel]="closeDate()"
                    (ngModelChange)="closeDate.set($event)"
                  />
                  <svg class="input-icon-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Closing Time <span class="req">*</span></label>
                <div class="input-with-icon">
                  <input
                    type="text"
                    class="text-input"
                    [ngModel]="closeTime()"
                    (ngModelChange)="closeTime.set($event)"
                  />
                  <svg class="input-icon-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 18px;">
              <label class="form-label">Repeat Option</label>
              <div class="repeat-tabs-row">
                <div
                  class="repeat-tab"
                  *ngFor="let opt of repeatOptions"
                  [class.active]="repeatClose() === opt"
                  (click)="repeatClose.set(opt)"
                >
                  {{ opt }}
                </div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-head">SCHEDULE SUMMARY</div>
              <div class="summary-row">
                <span class="summary-label">Action</span>
                <span class="summary-val">Close Market</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Date</span>
                <span class="summary-val">{{ closeDate() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Time</span>
                <span class="summary-val">{{ closeTime() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Repeat</span>
                <span class="summary-val">{{ repeatClose() }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn-amber" type="button" (click)="applyScheduleClose()">Schedule Close</button>
          </div>
        </ng-container>

        <!-- ================= CASE 3: CLOSE MARKET CONFIRMATION ================= -->
        <ng-container *ngIf="currentMode() === 'confirm_close'">
          <div style="padding: 24px 24px 0; text-align: right;">
            <button class="close-btn" type="button" style="margin-left: auto;" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" x2="6" y1="6" y2="18"></line>
                <line x1="6" x2="18" y1="6" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body" style="padding-top: 0;">
            <div class="center-badge-wrap">
              <div class="badge-circle amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="4" height="16" x="6" y="4"></rect>
                  <rect width="4" height="16" x="14" y="4"></rect>
                </svg>
              </div>
            </div>

            <h2 class="center-title">Close Market — Confirmation</h2>
            <p class="center-desc">
              Are you sure you want to close the market now?<br />
              Customers will not be able to place new orders once the market is closed.
            </p>

            <div class="status-strip-box">
              <div class="strip-item">
                <svg class="strip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <div class="strip-col">
                  <span class="strip-lbl">Current Status</span>
                  <span class="strip-val ok">
                    <span class="dot-pill green"></span>
                    Market is Open
                  </span>
                </div>
              </div>

              <div class="strip-item">
                <svg class="strip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div class="strip-col">
                  <span class="strip-lbl">Action</span>
                  <span class="strip-val err">Close Market (Immediately)</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Reason for Closing <span class="req">*</span></label>
              <textarea
                class="text-area"
                placeholder="Enter reason for closing the market..."
                [ngModel]="closeReason()"
                (ngModelChange)="closeReason.set($event)"
                maxlength="250"
              ></textarea>
              <div class="char-count">{{ closeReason().length }} / 250</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn-amber" type="button" (click)="executeCloseMarket()">Confirm Close Market</button>
          </div>
        </ng-container>

        <!-- ================= CASE 4: MARKET CLOSED SUCCESS POPUP ================= -->
        <ng-container *ngIf="currentMode() === 'success_closed'">
          <div style="padding: 24px 24px 0; text-align: right;">
            <button class="close-btn" type="button" style="margin-left: auto;" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" x2="6" y1="6" y2="18"></line>
                <line x1="6" x2="18" y1="6" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body" style="padding-top: 0;">
            <div class="center-badge-wrap">
              <div class="badge-circle red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>

            <h2 class="center-title">Market Closed Successfully!</h2>
            <p class="center-desc">The market has been closed. Customers can no longer place new orders.</p>

            <div class="success-strip">
              <div class="success-strip-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
                <span>Market Status</span>
              </div>
              <span class="strip-val err">
                <span class="dot-pill red"></span>
                Market is Closed
              </span>
            </div>

            <button class="btn-amber btn-full" type="button" (click)="closeModal()">OK</button>
          </div>
        </ng-container>

        <!-- ================= CASE 5: MARKET OPENED SUCCESS POPUP ================= -->
        <ng-container *ngIf="currentMode() === 'success_opened'">
          <div style="padding: 24px 24px 0; text-align: right;">
            <button class="close-btn" type="button" style="margin-left: auto;" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" x2="6" y1="6" y2="18"></line>
                <line x1="6" x2="18" y1="6" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body" style="padding-top: 0;">
            <div class="center-badge-wrap">
              <div class="badge-circle green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>

            <h2 class="center-title">Market Opened Successfully!</h2>
            <p class="center-desc">The market is now open. Customers can place new orders.</p>

            <div class="success-strip">
              <div class="success-strip-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
                <span>Market Status</span>
              </div>
              <span class="strip-val ok">
                <span class="dot-pill green"></span>
                Market is Open
              </span>
            </div>

            <button class="btn-amber btn-full" type="button" (click)="closeModal()">OK</button>
          </div>
        </ng-container>

      </div>
    </div>
  `,
})
export class MarketControlModalComponent {
  @Input() set mode(val: MarketModalMode) {
    this.currentMode.set(val);
  }
  @Output() close = new EventEmitter<void>();
  @Output() marketStatusChanged = new EventEmitter<boolean>();

  readonly currentMode = signal<MarketModalMode>('schedule_open');

  // Schedule Open Form
  readonly openDate = signal('Nov 19, 2026');
  readonly openTime = signal('6:00 AM');
  readonly repeatOpen = signal('One Time');

  // Schedule Close Form
  readonly closeDate = signal('Nov 19, 2026');
  readonly closeTime = signal('9:00 PM');
  readonly repeatClose = signal('Daily');

  readonly repeatOptions = ['One Time', 'Daily', 'Weekly', 'Monthly'];

  // Confirmation Form
  readonly closeReason = signal('');

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  applyScheduleOpen(): void {
    this.marketStatusChanged.emit(true);
    this.currentMode.set('success_opened');
  }

  applyScheduleClose(): void {
    this.marketStatusChanged.emit(false);
    this.currentMode.set('success_closed');
  }

  executeCloseMarket(): void {
    this.marketStatusChanged.emit(false);
    this.currentMode.set('success_closed');
  }

  executeOpenMarket(): void {
    this.marketStatusChanged.emit(true);
    this.currentMode.set('success_opened');
  }
}
