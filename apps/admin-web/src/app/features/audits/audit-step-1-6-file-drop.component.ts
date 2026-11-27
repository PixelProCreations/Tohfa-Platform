/**
 * Local file drop zone for inspection steps 1–6 (designs 80, 82, 83). UI ONLY.
 *
 * Opens the browser's file chooser (or accepts a dropped file), checks type (PDF / JPG / PNG) and size
 * (10 MB) locally, and shows the chosen file name as a chip. NOTHING is uploaded or read — when
 * integrated the file goes to `POST /uploads` and the server re-validates it.
 *
 * ```html
 * <tohfa-audit-step-file-drop inputId="fmb-upload" [multiple]="false"
 *   [title]="''" (filesChange)="onFiles($event)"></tohfa-audit-step-file-drop>
 * ```
 *
 * variant 'zone'   dashed drop zone ("Drag & drop file here or Browse file").
 * variant 'button' compact bordered "Upload file" button (design 83).
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import {
  AUDIT_STEP_FILE_ACCEPT,
  auditStepFileError,
  type AuditStepLocalFile,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';

@Component({
  selector: 'tohfa-audit-step-file-drop',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null' },
  styles: [
    AUDIT_SHARED_STYLES,
    `
      :host {
        gap: var(--space-8);
      }
      .audit-dropzone,
      .upload-btn {
        position: relative;
      }
      /* Visually hidden but focusable, so the label's focus ring shows on keyboard focus. */
      .drop-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }
      .audit-dropzone.is-dragover {
        background: var(--tohfa-amber-tint);
      }
      .audit-dropzone.is-invalid {
        border-color: var(--err);
      }
      .drop-text {
        font-weight: var(--fw-medium);
        color: var(--tohfa-ink);
      }
      .drop-browse {
        color: var(--tohfa-amber-active);
        font-weight: var(--fw-bold);
        text-decoration: underline;
      }
      .upload-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        box-sizing: border-box;
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-10) var(--space-12);
        border: var(--border-input);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-surface);
        color: var(--tohfa-brown);
        font-size: var(--fs-input);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .upload-btn:focus-within {
        border-color: var(--tohfa-amber);
        box-shadow: var(--tohfa-focus-ring);
      }
      .upload-btn.is-invalid {
        border-color: var(--err);
      }
      .upload-btn .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .chips {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .chip-name {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        min-width: 0;
        font-weight: var(--fw-bold);
        overflow-wrap: anywhere;
      }
      .chip-name .material-symbols-outlined {
        font-size: var(--icon-row-action);
        color: var(--tohfa-amber);
      }
      .chip-size {
        font-weight: var(--fw-medium);
        color: var(--tohfa-muted);
      }
      .chip-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: calc(var(--space-14) * 2);
        height: calc(var(--space-14) * 2);
        padding: 0;
        border: none;
        border-radius: var(--r-circle);
        background: none;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .chip-remove:hover {
        background: var(--tohfa-page);
      }
      .chip-remove:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
    `,
  ],
  template: `
    <label
      *ngIf="variant === 'zone'; else buttonVariant"
      class="audit-dropzone"
      [class.is-dragover]="dragOver()"
      [class.is-invalid]="error() !== ''"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
    >
      <input
        class="drop-input"
        type="file"
        [id]="inputId"
        [accept]="accept"
        [multiple]="multiple"
        [attr.aria-describedby]="inputId + '-hint ' + inputId + '-error'"
        [attr.aria-invalid]="error() !== '' ? 'true' : null"
        (change)="onInputChange($event)"
      />
      <span class="material-symbols-outlined audit-dropzone-icon" aria-hidden="true">cloud_upload</span>
      <span *ngIf="title !== ''" class="audit-dropzone-text">{{ title }}</span>
      <span class="drop-text">
        {{ multiple ? C.DROP_TEXT_PREFIX_PLURAL : C.DROP_TEXT_PREFIX }}
        <span class="drop-browse">{{ multiple ? C.BROWSE_FILES : C.BROWSE_FILE }}</span>
      </span>
      <span class="audit-dropzone-hint" [id]="inputId + '-hint'">{{ hint }}</span>
    </label>

    <ng-template #buttonVariant>
      <label class="upload-btn" [class.is-invalid]="error() !== ''">
        <input
          class="drop-input"
          type="file"
          [id]="inputId"
          [accept]="accept"
          [multiple]="multiple"
          [attr.aria-describedby]="inputId + '-hint ' + inputId + '-error'"
          [attr.aria-invalid]="error() !== '' ? 'true' : null"
          (change)="onInputChange($event)"
        />
        <span class="material-symbols-outlined" aria-hidden="true">upload</span>
        <span>{{ title !== '' ? title : C.UPLOAD_FILE }}</span>
        <span class="sr-only" [id]="inputId + '-hint'">{{ hint }}</span>
      </label>
    </ng-template>

    <p class="audit-field-error" [id]="inputId + '-error'" role="alert">{{ error() }}</p>

    <ul class="chips" *ngIf="files().length > 0">
      <li class="audit-file-chip" *ngFor="let f of files(); let i = index">
        <span class="chip-name">
          <span class="material-symbols-outlined" aria-hidden="true">description</span>
          <span>{{ f.name }}</span>
          <span class="chip-size">({{ C.fileSize(f.sizeBytes) }})</span>
        </span>
        <button
          type="button"
          class="chip-remove"
          [attr.aria-label]="C.removeFileLabel(f.name)"
          (click)="remove(i)"
        >
          <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
        </button>
      </li>
    </ul>
    <p class="audit-helper" *ngIf="files().length > 0">{{ C.FILE_LOCAL_NOTE }}</p>
  `,
})
export class AuditStepFileDropComponent {
  readonly C = C;
  readonly accept = AUDIT_STEP_FILE_ACCEPT;

  /** Unique id of the hidden file input (also used to link a visible `<label for>`). */
  @Input() inputId = 'audit-step-file';
  @Input() variant: 'zone' | 'button' = 'zone';
  /** Bold first line inside the zone ("Upload supporting documents"); '' hides it. */
  @Input() title = '';
  @Input() hint: string = C.DROP_HINT;
  @Input() multiple = false;

  @Output() readonly filesChange = new EventEmitter<readonly AuditStepLocalFile[]>();

  readonly files = signal<readonly AuditStepLocalFile[]>([]);
  readonly error = signal('');
  readonly dragOver = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.take(event.dataTransfer?.files ?? null);
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.take(input.files);
    // Reset so choosing the same file again still fires `change`.
    input.value = '';
  }

  remove(index: number): void {
    this.files.set(this.files().filter((_, i) => i !== index));
    this.error.set('');
    this.filesChange.emit(this.files());
  }

  private take(list: FileList | null): void {
    if (list === null || list.length === 0) return;
    const chosen = this.multiple ? Array.from(list) : [list[0] as File];
    const accepted: AuditStepLocalFile[] = [];
    let error = '';
    for (const file of chosen) {
      const problem = auditStepFileError(file);
      if (problem === 'type') error = C.FILE_ERROR_TYPE;
      else if (problem === 'size') error = C.FILE_ERROR_SIZE;
      else accepted.push({ name: file.name, sizeBytes: file.size });
    }
    this.error.set(error);
    if (accepted.length === 0) return;
    this.files.set(this.multiple ? [...this.files(), ...accepted] : accepted);
    this.filesChange.emit(this.files());
  }
}
