import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'tohfa-alert-threshold-modal',
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
        max-width: 600px;
        width: 100%;
        max-height: 92vh;
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

      /* Header */
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
        flex-shrink: 0;
      }

      .header-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .header-icon {
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-title {
        font-size: 19px;
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

      /* Scrollable Body */
      .modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        flex: 1;
      }

      .modal-body::-webkit-scrollbar {
        width: 5px;
      }

      .modal-body::-webkit-scrollbar-thumb {
        background: var(--tohfa-border, #E4E0D3);
        border-radius: 4px;
      }

      /* Section Banner */
      .section-banner {
        background: var(--tohfa-amber-tint, #FBEEDE);
        border-radius: 9px;
        padding: 9px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }

      .section-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .section-title {
        font-size: 13px;
        font-weight: 800;
        color: var(--tohfa-brown, #8A4E15);
      }

      /* Form controls */
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      .form-label {
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .req {
        color: var(--tohfa-err, #9C2525);
      }

      .text-input,
      .text-area,
      .select-input {
        width: 100%;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 10px 14px;
        font-family: inherit;
        font-size: 13px;
        color: var(--tohfa-ink, #1D2420);
        background: #ffffff;
        transition: border-color 0.15s ease;
      }

      .text-input:focus,
      .text-area:focus,
      .select-input:focus {
        outline: none;
        border-color: var(--tohfa-amber, #E48932);
      }

      .text-area {
        resize: vertical;
        min-height: 70px;
        line-height: 1.45;
      }

      .char-count {
        font-size: 10.5px;
        color: var(--tohfa-slate, #5C6B63);
        text-align: right;
        margin-top: 2px;
      }

      /* Custom category select box */
      .select-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .select-icon-left {
        position: absolute;
        left: 14px;
        color: var(--tohfa-slate, #5C6B63);
        pointer-events: none;
      }

      .select-with-icon {
        padding-left: 40px;
        appearance: none;
        cursor: pointer;
      }

      .select-chevron {
        position: absolute;
        right: 14px;
        color: var(--tohfa-slate, #5C6B63);
        pointer-events: none;
      }

      /* Two inputs row */
      .inputs-row {
        display: grid;
        grid-template-columns: 1fr 140px;
        gap: 12px;
      }

      /* Radio Cards Grid */
      .radio-cards-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .radio-card {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 12px 14px;
        background: #ffffff;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .radio-card:hover {
        border-color: rgba(228, 137, 50, 0.4);
      }

      .radio-card.active {
        border: 1.5px solid var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      .radio-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid var(--tohfa-border, #E4E0D3);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .radio-card.active .radio-dot {
        border-color: var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber, #E48932);
      }

      .radio-dot-inner {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ffffff;
      }

      .radio-text {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      /* Checkbox Cards List */
      .checkbox-cards-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .checkbox-card {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 11px 14px;
        background: #ffffff;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .checkbox-card:hover {
        border-color: rgba(228, 137, 50, 0.4);
      }

      .checkbox-card.checked {
        border: 1.5px solid var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      .checkbox-box {
        width: 18px;
        height: 18px;
        border-radius: 5px;
        border: 2px solid var(--tohfa-border, #E4E0D3);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .checkbox-card.checked .checkbox-box {
        border-color: var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
      }

      .checkbox-text {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--tohfa-ink, #1D2420);
      }

      /* Toggle Switch */
      .status-toggle-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 4px 0;
      }

      .status-label {
        font-size: 13px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
      }

      .switch-wrap {
        width: 44px;
        height: 24px;
        border-radius: 999px;
        background: var(--tohfa-border, #E4E0D3);
        padding: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: background 0.2s ease;
      }

      .switch-wrap.active {
        background: var(--tohfa-amber, #E48932);
      }

      .switch-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transform: translateX(0);
        transition: transform 0.2s ease;
      }

      .switch-wrap.active .switch-thumb {
        transform: translateX(20px);
      }

      .status-text {
        font-size: 13px;
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
        flex-shrink: 0;
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
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .btn-cancel:hover {
        background: var(--tohfa-page, #F7F5EE);
        border-color: var(--tohfa-slate, #5C6B63);
      }

      .btn-save {
        flex: 1.6;
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

      .btn-save:hover {
        background: var(--tohfa-amber-hover, #D47922);
      }

      .btn-save:active {
        transform: translateY(1px);
      }
    `,
  ],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title-row">
            <span class="header-icon">
              <!-- Stack / Layers icon -->
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </span>
            <h2 class="modal-title">Add Compliance Tier Threshold</h2>
          </div>

          <button class="close-btn" type="button" aria-label="Close" (click)="closeModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Body Form -->
        <div class="modal-body">
          <!-- 1. Basic Information -->
          <div>
            <div class="section-banner">
              <span class="section-num">1</span>
              <span class="section-title">Basic Information</span>
            </div>

            <div class="form-group">
              <label class="form-label">Alert Name <span class="req">*</span></label>
              <input
                type="text"
                class="text-input"
                [ngModel]="alertName()"
                (ngModelChange)="alertName.set($event)"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Description <span class="req">*</span></label>
              <textarea
                class="text-area"
                [ngModel]="description()"
                (ngModelChange)="description.set($event)"
                maxlength="250"
              ></textarea>
              <div class="char-count">{{ description().length }} / 250</div>
            </div>

            <div class="form-group">
              <label class="form-label">Category <span class="req">*</span></label>
              <div class="select-wrap">
                <svg class="select-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="M12 22V12"></path>
                </svg>
                <select
                  class="select-input select-with-icon"
                  [ngModel]="category()"
                  (ngModelChange)="category.set($event)"
                >
                  <option value="Stock">Stock</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Quality">Quality</option>
                  <option value="Logistics">Logistics</option>
                </select>
                <svg class="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <!-- 2. Trigger Condition -->
          <div>
            <div class="section-banner">
              <span class="section-num">2</span>
              <span class="section-title">Trigger Condition</span>
            </div>

            <div class="form-group">
              <label class="form-label">Alert Condition <span class="req">*</span></label>
              <div class="select-wrap">
                <select
                  class="select-input"
                  [ngModel]="condition()"
                  (ngModelChange)="condition.set($event)"
                >
                  <option value="Stock is less than or equal to">Stock is less than or equal to</option>
                  <option value="Stock is greater than">Stock is greater than</option>
                  <option value="Variance exceeds">Variance exceeds</option>
                  <option value="Days without movement greater than">Days without movement greater than</option>
                </select>
                <svg class="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Threshold Value <span class="req">*</span></label>
              <div class="inputs-row">
                <input
                  type="number"
                  class="text-input"
                  [ngModel]="thresholdValue()"
                  (ngModelChange)="thresholdValue.set($event)"
                />
                <div class="select-wrap">
                  <select
                    class="select-input"
                    [ngModel]="thresholdUnit()"
                    (ngModelChange)="thresholdUnit.set($event)"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Bags">Bags</option>
                    <option value="Litres">Litres</option>
                    <option value="Units">Units</option>
                  </select>
                  <svg class="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Applies to <span class="req">*</span></label>
              <div class="radio-cards-grid">
                <div
                  class="radio-card"
                  [class.active]="appliesTo() === 'all'"
                  (click)="appliesTo.set('all')"
                >
                  <div class="radio-dot">
                    <div class="radio-dot-inner" *ngIf="appliesTo() === 'all'"></div>
                  </div>
                  <span class="radio-text">All Warehouses</span>
                </div>

                <div
                  class="radio-card"
                  [class.active]="appliesTo() === 'specific'"
                  (click)="appliesTo.set('specific')"
                >
                  <div class="radio-dot">
                    <div class="radio-dot-inner" *ngIf="appliesTo() === 'specific'"></div>
                  </div>
                  <span class="radio-text">Specific Warehouse</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Notification Settings -->
          <div>
            <div class="section-banner">
              <span class="section-num">3</span>
              <span class="section-title">Notification Settings</span>
            </div>

            <div class="form-group">
              <label class="form-label">Notify to <span class="req">*</span></label>
              <div class="checkbox-cards-list">
                <div
                  class="checkbox-card"
                  *ngFor="let recipient of recipientOptions"
                  [class.checked]="isRecipientSelected(recipient.key)"
                  (click)="toggleRecipient(recipient.key)"
                >
                  <div class="checkbox-box">
                    <svg *ngIf="isRecipientSelected(recipient.key)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span class="checkbox-text">{{ recipient.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Alert Status -->
          <div>
            <div class="section-banner">
              <span class="section-num">4</span>
              <span class="section-title">Alert Status</span>
            </div>

            <div class="status-toggle-row">
              <span class="status-label">Status</span>
              <div
                class="switch-wrap"
                [class.active]="isActive()"
                (click)="toggleStatus()"
              >
                <div class="switch-thumb"></div>
              </div>
              <span class="status-text">{{ isActive() ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" type="button" (click)="closeModal()">Cancel</button>
          <button class="btn-save" type="button" (click)="saveThreshold()">Save Alert Threshold</button>
        </div>
      </div>
    </div>
  `,
})
export class AlertThresholdModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly alertName = signal('Low Stock Alert');
  readonly description = signal('Get alerted when the stock of a product falls below the configured minimum level');
  readonly category = signal('Stock');
  readonly condition = signal('Stock is less than or equal to');
  readonly thresholdValue = signal(100);
  readonly thresholdUnit = signal('Kg');
  readonly appliesTo = signal<'all' | 'specific'>('all');
  readonly isActive = signal(true);

  readonly recipientOptions = [
    { key: 'tohfa_admins', label: 'TOHFA Admins' },
    { key: 'wh_admins', label: 'Warehouse Admins' },
    { key: 'farmer_admins', label: 'Farmer Admins' },
    { key: 'customer', label: 'Customer' },
    { key: 'farmer', label: 'Farmer' },
  ];

  readonly selectedRecipients = signal<Set<string>>(new Set(['tohfa_admins']));

  isRecipientSelected(key: string): boolean {
    return this.selectedRecipients().has(key);
  }

  toggleRecipient(key: string): void {
    const next = new Set(this.selectedRecipients());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.selectedRecipients.set(next);
  }

  toggleStatus(): void {
    this.isActive.update((v) => !v);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  saveThreshold(): void {
    this.saved.emit();
    this.closeModal();
  }
}
