/**
 * Local file chooser for the audit step screens (steps 7, 8, 10 and 11). UI ONLY — the chosen file is
 * never read or uploaded; only its name and size are shown.
 *
 * Three looks, one behaviour:
 *   variant="button"    small dashed "Upload file" button (design 85)
 *   variant="dropzone"  large dashed drop zone with drag-and-drop (design 86)
 *   variant="row"       dashed row with an icon tile, title and hint (designs 88/89)
 *
 * The parent owns the selection (`fileName` / `fileSize` inputs) so it can clear it, e.g. after
 * "Add Evidence". The picker validates type (PDF/JPG/PNG) and size (10 MB) itself, shows its own
 * error, and emits `picked` only for an acceptable file.
 *
 * ```html
 * <tohfa-audit-step-file-picker variant="dropzone" inputId="s8-file"
 *   [title]="T.DROP_TITLE" [hint]="T.DROP_HINT" [formats]="T.DROP_FORMATS"
 *   [fileName]="fileName()" [fileSize]="fileSize()"
 *   (picked)="onPicked($event)" (removed)="onRemoved()" />
 * ```
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_FILE_PICKER_STRINGS as F } from './audit-step-7-file-picker.strings';
import { AUDIT_UPLOAD_ACCEPT, auditUploadProblem } from './audit-steps-7-12.mock';

export interface AuditPickedFile {
  readonly name: string;
  readonly size: number;
}

@Component({
  selector: 'tohfa-audit-step-file-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null' },
  styles: [
    AUDIT_SHARED_STYLES,
    `
      :host {
        gap: var(--space-6);
      }
      .file-input {
        display: none;
      }
      .pick-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        box-sizing: border-box;
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-8) var(--space-12);
        border: var(--border-dropzone);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-surface);
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .pick-btn:hover {
        background: var(--tohfa-amber-tint);
      }
      .pick-btn:focus-visible,
      .pick-row:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .pick-btn .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .audit-dropzone.is-dragover {
        background: var(--tohfa-amber-tint);
      }
      .pick-row {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        box-sizing: border-box;
        width: 100%;
        padding: var(--space-16);
        border: var(--border-dropzone);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-surface);
        font-family: var(--font);
        text-align: left;
        cursor: pointer;
      }
      .pick-row:hover {
        background: var(--tohfa-page);
      }
      .row-tile {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-18) * 2);
        height: calc(var(--space-18) * 2);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .row-text {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .chip-name {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        min-width: 0;
        font-weight: var(--fw-semi);
        overflow-wrap: anywhere;
      }
      .chip-name .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .chip-size {
        color: var(--tohfa-slate);
        font-weight: var(--fw-medium);
      }
      .chip-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        min-width: var(--tohfa-min-touch-target);
        min-height: var(--tohfa-min-touch-target);
        padding: 0;
        border: none;
        border-radius: var(--r-sm);
        background: none;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .chip-remove:hover {
        color: var(--err);
      }
      .chip-remove:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
    `,
  ],
  template: `
    <input
      #fileInput
      class="file-input"
      type="file"
      tabindex="-1"
      aria-hidden="true"
      [accept]="accept"
      (change)="onInputChange($event)"
    />

    <ng-container [ngSwitch]="variant">
      <button
        *ngSwitchCase="'dropzone'"
        type="button"
        class="audit-dropzone"
        [id]="inputId"
        [class.is-dragover]="dragOver()"
        [attr.aria-label]="ariaLabel || null"
        [attr.aria-describedby]="error() !== '' ? errorId : null"
        (click)="open()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
      >
        <span class="material-symbols-outlined audit-dropzone-icon" aria-hidden="true">cloud_upload</span>
        <span class="audit-dropzone-text">{{ title }}</span>
        <span class="audit-dropzone-hint" *ngIf="hint">{{ hint }}</span>
        <span class="audit-dropzone-hint" *ngIf="formats">{{ formats }}</span>
      </button>

      <button
        *ngSwitchCase="'row'"
        type="button"
        class="pick-row"
        [id]="inputId"
        [attr.aria-label]="ariaLabel || null"
        [attr.aria-describedby]="error() !== '' ? errorId : null"
        (click)="open()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
      >
        <span class="row-tile" aria-hidden="true">
          <span class="material-symbols-outlined icon">description</span>
        </span>
        <span class="row-text">
          <span class="audit-dropzone-text">{{ title }}</span>
          <span class="audit-dropzone-hint" *ngIf="hint">{{ hint }}</span>
        </span>
      </button>

      <button
        *ngSwitchDefault
        type="button"
        class="pick-btn"
        [id]="inputId"
        [attr.aria-label]="ariaLabel || null"
        [attr.aria-describedby]="error() !== '' ? errorId : null"
        (click)="open()"
      >
        <span class="material-symbols-outlined" aria-hidden="true">download</span>
        {{ title }}
      </button>
    </ng-container>

    <div class="audit-file-chip" *ngIf="fileName">
      <span class="chip-name">
        <span class="material-symbols-outlined" aria-hidden="true">attach_file</span>
        <span class="sr-only">{{ F.SELECTED }}</span>
        {{ fileName }}
        <span class="chip-size" *ngIf="fileSize !== null">{{ F.size(fileSize) }}</span>
      </span>
      <button type="button" class="chip-remove" [attr.aria-label]="F.removeAria(fileName)" (click)="remove()">
        <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
      </button>
    </div>

    <p class="audit-field-error" [id]="errorId" role="alert" *ngIf="error() !== ''">{{ error() }}</p>
  `,
})
export class AuditStepFilePickerComponent {
  readonly F = F;
  readonly accept = AUDIT_UPLOAD_ACCEPT;

  @Input() variant: 'button' | 'dropzone' | 'row' = 'button';
  /** id of the clickable element, so a <label for> or the parent's error summary can target it. */
  @Input() inputId = 'audit-file-picker';
  @Input() title = '';
  @Input() hint = '';
  @Input() formats = '';
  /** Accessible name when the visible title alone is ambiguous (several pickers on one screen). */
  @Input() ariaLabel = '';
  @Input() fileName: string | null = null;
  @Input() fileSize: number | null = null;

  @Output() readonly picked = new EventEmitter<AuditPickedFile>();
  @Output() readonly removed = new EventEmitter<void>();

  @ViewChild('fileInput', { static: true }) private fileInput?: ElementRef<HTMLInputElement>;

  readonly error = signal('');
  readonly dragOver = signal(false);

  get errorId(): string {
    return `${this.inputId}-error`;
  }

  open(): void {
    this.fileInput?.nativeElement.click();
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    // Reset so choosing the same file again still fires `change`.
    input.value = '';
    if (file !== null) this.acceptFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files.item(0) ?? null;
    if (file !== null) this.acceptFile(file);
  }

  remove(): void {
    this.error.set('');
    this.removed.emit();
  }

  private acceptFile(file: File): void {
    const problem = auditUploadProblem(file);
    if (problem === 'TYPE') {
      this.error.set(F.ERROR_TYPE);
      return;
    }
    if (problem === 'SIZE') {
      this.error.set(F.ERROR_SIZE);
      return;
    }
    this.error.set('');
    this.picked.emit({ name: file.name, size: file.size });
  }
}
