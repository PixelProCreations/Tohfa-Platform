/**
 * Frame for the 12 audit inspection step screens (designs 79–90). UI ONLY.
 *
 * Renders: header (tinted icon tile, bold title, "AUD-2026-0042 · Ramesh Kumar" subtitle with the
 * amber step pill, optional right-side slot), the step's content (default slot), and the footer
 * (outlined "Back to Inspection", outlined "Save as Draft", amber primary "Save" / "Save & Next")
 * with an aria-live status line.
 *
 * ```html
 * <tohfa-audit-step-shell
 *   title="Soil Testing & Soil Report"      icon="science"
 *   [auditId]="audit.id"                    [farmerName]="audit.farmerName"
 *   stepLabel="Step 5 of 10"                [primaryLabel]="S.SHELL_SAVE_NEXT"
 *   primaryIcon="arrow_forward"
 *   [backLink]="routes.inspection(audit.id)"
 *   (draft)="onDraft()" (primary)="onSave()">
 *   <div shellHeaderAside>…optional right side of header…</div>
 *   …step content (cards, form grid)…
 * </tohfa-audit-step-shell>
 * ```
 *
 * INPUTS
 *   title: string (required)        Step title (h1).
 *   icon: string = 'fact_check'     Material Symbols name for the header tile.
 *   auditId: string = ''            First half of the subtitle.
 *   farmerName: string = ''         Second half of the subtitle.
 *   stepLabel: string = ''          Text of the amber pill ("Step 3 of 10", "1/10"); hidden when ''.
 *   showBack: boolean = true        Show "Back to Inspection".
 *   backLabel: string               Default AUDIT_STRINGS.SHELL_BACK.
 *   backLink: string | null = null  When set, Back is a routerLink to it (still emits `back`).
 *   showDraft: boolean = true       Show "Save as Draft".
 *   draftLabel: string              Default AUDIT_STRINGS.SHELL_DRAFT.
 *   showPrimary: boolean = true     Show the primary button.
 *   primaryLabel: string            Default AUDIT_STRINGS.SHELL_SAVE ("Save"); pass SHELL_SAVE_NEXT.
 *   primaryIcon: string | null      Trailing glyph on the primary button (e.g. 'arrow_forward').
 *   primaryDisabled: boolean        Disables the primary button.
 *   statusMessage: string = ''      Text for the aria-live status line. Overrides `announce()`.
 *   autoAnnounce: boolean = true    Draft / primary clicks announce "Draft saved (demo — not stored)" /
 *                                   "Saved (demo — not stored)" automatically.
 *
 * OUTPUTS
 *   back: void      Back button clicked.
 *   draft: void     Save as Draft clicked.
 *   primary: void   Primary clicked. The host decides what happens (validate, navigate to the next
 *                   step via AUDIT_ROUTES.step, etc.).
 *
 * PUBLIC METHODS (via a template ref / viewChild)
 *   announce(message: string): void   Put a message in the status line (e.g. a validation summary).
 *   clearStatus(): void
 *
 * SLOTS
 *   default             The step content.
 *   [shellHeaderAside]  Optional element on the right of the header.
 *   [shellFooterStart]  Optional element at the start of the footer (before the buttons).
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_STRINGS as S } from './audit.strings';

@Component({
  selector: 'tohfa-audit-step-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `title` is an input; without this a static `title="…"` would also become the host's native
  // tooltip over the whole step.
  host: { '[attr.title]': 'null' },
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .shell-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-16);
      }
      .shell-heading {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
      }
      .shell-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
      }
      .primary-icon {
        font-size: var(--icon-btn);
      }
    `,
  ],
  template: `
    <header class="shell-header">
      <div class="shell-heading">
        <span class="audit-title-tile" aria-hidden="true">
          <span class="material-symbols-outlined">{{ icon }}</span>
        </span>
        <div>
          <h1 class="audit-title">{{ title }}</h1>
          <p class="audit-meta-row">
            <span>{{ subtitle }}</span>
            <span class="audit-step-pill" *ngIf="stepLabel !== ''">{{ stepLabel }}</span>
          </p>
        </div>
      </div>
      <ng-content select="[shellHeaderAside]"></ng-content>
    </header>

    <div class="shell-content">
      <ng-content></ng-content>
    </div>

    <footer class="audit-footer" [attr.aria-label]="S.SHELL_ACTIONS_LABEL">
      <p class="audit-footer-status" role="status" aria-live="polite">{{ status() }}</p>
      <ng-content select="[shellFooterStart]"></ng-content>

      <ng-container *ngIf="showBack">
        <a
          *ngIf="backLink !== null; else backButton"
          class="tohfa-btn audit-btn audit-btn-outline"
          [routerLink]="backLink"
          (click)="back.emit()"
          >{{ backLabel }}</a
        >
        <ng-template #backButton>
          <button type="button" class="tohfa-btn audit-btn audit-btn-outline" (click)="back.emit()">
            {{ backLabel }}
          </button>
        </ng-template>
      </ng-container>

      <button
        *ngIf="showDraft"
        type="button"
        class="tohfa-btn audit-btn audit-btn-outline"
        (click)="onDraft()"
      >
        {{ draftLabel }}
      </button>

      <button
        *ngIf="showPrimary"
        type="button"
        class="tohfa-btn tohfa-btn-primary audit-btn"
        [disabled]="primaryDisabled"
        (click)="onPrimary()"
      >
        {{ primaryLabel }}
        <span *ngIf="primaryIcon" class="material-symbols-outlined primary-icon" aria-hidden="true">{{
          primaryIcon
        }}</span>
      </button>
    </footer>
  `,
})
export class AuditStepShellComponent {
  readonly S = S;

  @Input({ required: true }) title = '';
  @Input() icon = 'fact_check';
  @Input() auditId = '';
  @Input() farmerName = '';
  @Input() stepLabel = '';

  @Input() showBack = true;
  @Input() backLabel: string = S.SHELL_BACK;
  @Input() backLink: string | null = null;

  @Input() showDraft = true;
  @Input() draftLabel: string = S.SHELL_DRAFT;

  @Input() showPrimary = true;
  @Input() primaryLabel: string = S.SHELL_SAVE;
  @Input() primaryIcon: string | null = null;
  @Input() primaryDisabled = false;

  @Input() set statusMessage(value: string) {
    this.externalStatus.set(value);
  }
  @Input() autoAnnounce = true;

  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly draft = new EventEmitter<void>();
  @Output() readonly primary = new EventEmitter<void>();

  private readonly externalStatus = signal('');
  private readonly internalStatus = signal('');
  readonly status = computed(() => this.externalStatus() || this.internalStatus());

  get subtitle(): string {
    return S.shellSubtitle(this.auditId, this.farmerName);
  }

  announce(message: string): void {
    this.internalStatus.set(message);
  }

  clearStatus(): void {
    this.internalStatus.set('');
  }

  onDraft(): void {
    if (this.autoAnnounce) this.announce(S.SHELL_DRAFT_SAVED_DEMO);
    this.draft.emit();
  }

  onPrimary(): void {
    if (this.autoAnnounce) this.announce(S.SHELL_SAVED_DEMO);
    this.primary.emit();
  }
}
