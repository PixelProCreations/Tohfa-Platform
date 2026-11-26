import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'tohfa-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        padding: 40px 20px;
        font-family: var(--font, 'Poppins', sans-serif);
      }

      .placeholder-card {
        background: var(--tohfa-surface, #FFFFFF);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        max-width: 640px;
        margin: 0 auto;
        padding: 48px 36px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      }

      .placeholder-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
      }

      .placeholder-icon svg {
        width: 32px;
        height: 32px;
      }

      .placeholder-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 10px;
      }

      .placeholder-desc {
        font-size: 13.5px;
        color: var(--tohfa-slate, #5C6B63);
        line-height: 1.6;
        margin: 0 0 28px;
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        padding: 10px 24px;
        border-radius: 9px;
        font-size: 13.5px;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.15s ease, transform 0.05s ease;
      }

      .back-btn:hover {
        background: var(--tohfa-amber-hover, #D47922);
      }

      .back-btn:active {
        transform: translateY(1px);
      }
    `,
  ],
  template: `
    <div class="placeholder-card">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M3 9h18"></path>
          <path d="M9 21V9"></path>
        </svg>
      </div>
      <h2 class="placeholder-title">{{ moduleName }}</h2>
      <p class="placeholder-desc">
        This module is currently configured for the Nilgiris Sustainable Farmer Collective operations.
        Live telemetry and actions will be populated based on assigned administrative scope.
      </p>
      <a routerLink="/dashboard" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"></path>
        </svg>
        Return to Dashboard
      </a>
    </div>
  `,
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly moduleName = this.route.snapshot.data['title'] ?? 'Module Management';
}
