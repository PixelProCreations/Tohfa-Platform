/**
 * KYC document dialog (SA-M3-S05 "Identity Proof" / "Land Ownership Proof" modals), opened by View
 * on the Farmer Details → KYC tab.
 *
 * The preview is the real file: the signed `readUrl` of docs/openapi.yaml `AdminFarmerDocument`,
 * fetched fresh by the tab just before opening (it expires after 15 minutes, BR-54c). An image is
 * shown in an <img>, a PDF in an <iframe>; any other type gets an honest "cannot preview" state.
 * No mock-up of an Aadhaar or Patta card is ever drawn.
 *
 * The detail rows are built by the tab from the API and handed in as label/value pairs, so this
 * component holds no knowledge of where each value came from. Download is handed back to the tab,
 * which fetches another fresh URL. Reject is disabled: the API has no reject endpoint for an
 * approved farmer's document (only POST …/documents/{docId}/verify).
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
  type ElementRef,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { DialogFocusDirective } from './dialog-focus.directive';
import type { AdminFarmerDocument } from './farmers.service';
import { fileKind, formatBytes, isEmbeddableUrl } from './farmer-kyc-tab.service';
import { FARMER_KYC_STRINGS as S } from './farmer-kyc-tab.strings';

export type KycBadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

/** One label/value line. `value` null renders "—" with `hint` as its tooltip. */
export interface KycDetailRow {
  label: string;
  value: string | null;
  hint?: string | undefined;
  /** Render the value as the document reference (link styling, no navigation). */
  reference?: boolean;
}

export interface KycDetailSection {
  title: string;
  rows: KycDetailRow[];
}

export interface KycNote {
  label: string;
  text: string | null;
  tone: 'ok' | 'danger';
  hint?: string | undefined;
}

let nextDialogId = 0;

@Component({
  selector: 'tohfa-farmer-kyc-document-dialog',
  standalone: true,
  imports: [CommonModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .dialog {
        display: flex;
        flex-direction: column;
        max-width: 1100px;
        width: calc(100vw - var(--space-32) * 2);
        max-height: calc(100vh - var(--space-32) * 2);
        padding: 0;
        overflow: hidden;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }
      [aria-disabled='true'] {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .muted {
        color: var(--tohfa-muted);
        font-weight: var(--fw-regular);
      }

      /* ---------- Header ---------- */
      .head {
        display: flex;
        align-items: center;
        gap: var(--space-16);
        padding: var(--space-20) var(--space-28);
        background: var(--tohfa-amber-tint);
        border-bottom: 1px solid var(--tohfa-amber-border);
      }
      .hero {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-24) * 2);
        height: calc(var(--space-24) * 2);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-border);
        color: var(--tohfa-amber);
      }
      .hero .icon {
        font-size: var(--fs-kpi);
      }
      .head-text {
        flex: 1 1 auto;
        min-width: 0;
      }
      .title {
        margin: 0 0 var(--space-4);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
        line-height: 1.2;
      }
      .subtitle {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .head-status {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding-right: var(--space-16);
        border-right: 1px solid var(--tohfa-amber-border-alt2);
      }
      .head-status .tohfa-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
      }
      .close {
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .close .icon {
        font-size: var(--icon-dialog-close);
      }
      .close:focus-visible,
      .ref:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      /* ---------- Body ---------- */
      .body {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
        overflow-y: auto;
      }
      .left {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
        min-width: 0;
        padding: var(--space-24) var(--space-28);
      }
      .right {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
        padding: var(--space-24) var(--space-28);
        border-left: var(--border-divider);
      }

      .file {
        display: flex;
        align-items: center;
        gap: var(--space-12);
      }
      .file.boxed {
        padding: var(--space-14) var(--space-16);
        border: var(--border-card);
        border-radius: var(--r-md);
      }
      .file-badge {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-18) * 2);
        height: calc(var(--space-18) * 2);
        border-radius: var(--r-sm);
        background: var(--err);
        color: var(--tohfa-surface);
        font-size: var(--fs-badge-s);
        font-weight: var(--fw-xbold);
      }
      .file-badge.image {
        background: var(--info);
      }
      .file-text {
        flex: 1 1 auto;
        min-width: 0;
      }
      .file-name {
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .file-meta {
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .file-tools {
        display: flex;
        gap: var(--space-10);
      }
      .file-tools .tohfa-btn {
        padding: var(--space-8) var(--space-14);
        font-size: var(--fs-dense);
      }

      .preview {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(var(--space-32) * 10);
        border: var(--border-card);
        border-radius: var(--r-card);
        background: var(--tohfa-page);
        overflow: hidden;
      }
      .preview:fullscreen {
        border-radius: 0;
        background: var(--tohfa-ink);
      }
      .preview img {
        display: block;
        max-width: 100%;
        max-height: calc(var(--space-32) * 14);
        object-fit: contain;
      }
      .preview:fullscreen img {
        max-height: 100vh;
      }
      .preview iframe {
        display: block;
        width: 100%;
        height: calc(var(--space-32) * 14);
        border: none;
        background: var(--tohfa-surface);
      }
      .preview:fullscreen iframe {
        height: 100vh;
      }
      .preview-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-8);
        max-width: calc(var(--space-32) * 10);
        padding: var(--space-24);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
        text-align: center;
      }
      .preview-empty .icon {
        font-size: var(--icon-dialog-hero);
        color: var(--tohfa-muted);
      }

      .section-title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .section-title + dl {
        margin-top: var(--space-4);
      }
      dl {
        margin: 0;
      }
      .kv {
        display: flex;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-12) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-cell);
      }
      .kv:last-child {
        border-bottom: none;
      }
      .kv dt {
        color: var(--tohfa-slate);
      }
      .kv dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
        overflow-wrap: anywhere;
      }
      .ref {
        color: var(--tohfa-brown);
        text-decoration: underline;
      }
      .note-label {
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .note {
        display: flex;
        align-items: flex-start;
        gap: var(--space-10);
        padding: var(--space-14) var(--space-16);
        border-radius: var(--r-md);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        line-height: 1.5;
      }
      .note.ok {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .note.danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .note .icon {
        flex: none;
        margin-top: var(--space-4);
        font-size: var(--icon-btn);
      }

      /* ---------- Footer ---------- */
      .foot {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-12);
        padding: var(--space-18) var(--space-28);
        border-top: var(--border-divider);
      }
      .foot .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-10) var(--space-24);
        border-radius: var(--tohfa-radius-button);
        font-size: var(--fs-button-l);
      }
      .btn-reject {
        border: 1px solid var(--err);
        background: var(--tohfa-surface);
        color: var(--err);
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="closed.emit()">
      <div
        class="tohfa-dialog dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        [attr.aria-describedby]="ids.subtitle"
        tohfaDialogFocus
        (dialogClose)="closed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="head">
          <span class="hero" aria-hidden="true"><span class="material-symbols-outlined icon">{{ icon }}</span></span>
          <div class="head-text">
            <h2 class="title" [id]="ids.title">{{ title }}</h2>
            <p class="subtitle" [id]="ids.subtitle">{{ subtitle }}</p>
          </div>
          <span class="head-status">
            <span class="tohfa-badge tohfa-badge-{{ statusTone }}">
              <span *ngIf="statusTone === 'success'" class="material-symbols-outlined icon" aria-hidden="true">check_circle</span>
              {{ statusLabel }}
            </span>
          </span>
          <button type="button" class="close" data-autofocus [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="closed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="body">
          <!-- ============ Left: file + preview ============ -->
          <div class="left">
            <div class="file" [class.boxed]="!showFileTools">
              <span class="file-badge" [class.image]="isImage()" aria-hidden="true">{{ kind() }}</span>
              <div class="file-text">
                <div class="file-name" [title]="S.FILE_NAME_NOT_IN_API">{{ fileLabel }}</div>
                <div class="file-meta">{{ S.fileMetaDot(kind(), size()) }}</div>
              </div>
              <div class="file-tools" *ngIf="showFileTools">
                <button
                  type="button"
                  class="tohfa-btn tohfa-btn-secondary"
                  [attr.aria-disabled]="previewKind() === 'none' ? 'true' : null"
                  [title]="previewKind() === 'none' ? S.PREVIEW_UNSUPPORTED : S.BTN_VIEW_FULLSCREEN"
                  (click)="toggleFullscreen()"
                >
                  <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.BTN_VIEW_FULLSCREEN }}
                </button>
                <button
                  type="button"
                  class="tohfa-btn tohfa-btn-secondary"
                  [attr.aria-disabled]="downloadHint ? 'true' : null"
                  [title]="downloadHint ?? S.BTN_DOWNLOAD"
                  (click)="requestDownload()"
                >
                  <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_DOWNLOAD }}
                </button>
              </div>
            </div>

            <div class="preview" #previewFrame [attr.aria-label]="S.PREVIEW_LABEL" role="group">
              <img *ngIf="previewKind() === 'image'" [src]="url()" [alt]="title" />
              <iframe *ngIf="previewKind() === 'pdf'" [src]="safeUrl()" [title]="title"></iframe>
              <div *ngIf="previewKind() === 'none'" class="preview-empty">
                <span class="material-symbols-outlined icon" aria-hidden="true">draft</span>
                <span>{{ url() ? S.PREVIEW_UNSUPPORTED : S.DOCUMENT_NO_FILE }}</span>
              </div>
            </div>
          </div>

          <!-- ============ Right: details ============ -->
          <div class="right">
            <ng-container *ngFor="let section of sections">
              <h3 class="section-title">{{ section.title }}</h3>
              <dl>
                <div class="kv" *ngFor="let row of section.rows">
                  <dt>{{ row.label }}</dt>
                  <dd *ngIf="row.value !== null; else dash" [title]="row.hint ?? ''">
                    <span [class.ref]="row.reference">{{ row.value }}</span>
                  </dd>
                  <ng-template #dash><dd class="muted" [title]="row.hint ?? S.NOT_IN_API">{{ S.DASH }}</dd></ng-template>
                </div>
              </dl>
            </ng-container>

            <ng-container *ngIf="note">
              <h3 class="note-label">{{ note.label }}</h3>
              <div *ngIf="note.text !== null; else noNote" class="note" [ngClass]="note.tone">
                <span class="material-symbols-outlined icon" aria-hidden="true">{{ note.tone === 'ok' ? 'check_circle' : 'error' }}</span>
                <span>{{ note.text }}</span>
              </div>
              <ng-template #noNote>
                <span class="muted" [title]="note.hint ?? S.NOT_IN_API">{{ S.DASH }}</span>
              </ng-template>
            </ng-container>
          </div>
        </div>

        <footer class="foot">
          <button type="button" class="tohfa-btn btn-reject" aria-disabled="true" [title]="S.REJECT_NOT_IN_API">{{ S.BTN_REJECT }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="closed.emit()">{{ S.BTN_CLOSE }}</button>
          <button
            type="button"
            class="tohfa-btn tohfa-btn-primary"
            [attr.aria-disabled]="downloadHint ? 'true' : null"
            [title]="downloadHint ?? ''"
            (click)="requestDownload()"
          >
            <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_DOWNLOAD_DOCUMENT }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerKycDocumentDialogComponent {
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) set document(value: AdminFarmerDocument) {
    this.doc.set(value);
  }
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() icon = 'description';
  @Input() statusLabel = '';
  @Input() statusTone: KycBadgeTone = 'neutral';
  /** The document's display name; the API returns no original file name. */
  @Input() fileLabel = '';
  @Input() sections: readonly KycDetailSection[] = [];
  @Input() note: KycNote | null = null;
  /** The land-proof variant shows View Fullscreen + Download beside the file name. */
  @Input() showFileTools = false;
  /** Non-null disables both Download buttons, with this text as the reason. */
  @Input() downloadHint: string | null = null;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly download = new EventEmitter<void>();

  @ViewChild('previewFrame') private previewFrame?: ElementRef<HTMLElement>;

  readonly S = S;
  readonly ids = (() => {
    const n = nextDialogId++;
    return { title: `kyc-doc-dialog-title-${n}`, subtitle: `kyc-doc-dialog-subtitle-${n}` };
  })();

  private readonly doc = signal<AdminFarmerDocument | null>(null);

  readonly kind = computed(() => fileKind(this.doc()?.mimeType ?? ''));
  readonly size = computed(() => formatBytes(this.doc()?.sizeBytes ?? null));
  readonly isImage = computed(() => (this.doc()?.mimeType ?? '').startsWith('image/'));

  /** The signed URL, only when it is an http(s) URL. */
  readonly url = computed(() => {
    const url = this.doc()?.readUrl ?? null;
    return url !== null && isEmbeddableUrl(url) ? url : null;
  });

  readonly previewKind = computed<'image' | 'pdf' | 'none'>(() => {
    if (this.url() === null) return 'none';
    const mime = this.doc()?.mimeType ?? '';
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    return 'none';
  });

  /**
   * An <iframe> src needs a resource URL. The value is the API's own signed storage URL, already
   * restricted to http(s) by `url()`, so trusting it cannot introduce a `javascript:` URL.
   */
  readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.url();
    return url === null ? null : this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  requestDownload(): void {
    if (this.downloadHint === null) this.download.emit();
  }

  toggleFullscreen(): void {
    const frame = this.previewFrame?.nativeElement;
    if (!frame || this.previewKind() === 'none') return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.requestFullscreen?.();
  }
}
