import { Directive, ElementRef, EventEmitter, HostListener, Output, inject, type AfterViewInit, type OnDestroy } from '@angular/core';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal focus handling for an in-page `role="dialog"` element: moves focus into the dialog when it
 * opens, keeps Tab / Shift+Tab inside it, emits `dialogClose` on Escape, and returns focus to the
 * element that had it before the dialog opened. Backdrop click is the host template's job.
 *
 * Only the innermost open dialog reacts to Escape, so a confirm stacked on a dialog closes alone.
 */
@Directive({
  selector: '[tohfaDialogFocus]',
  standalone: true,
})
export class DialogFocusDirective implements AfterViewInit, OnDestroy {
  @Output() readonly dialogClose = new EventEmitter<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private static readonly stack: DialogFocusDirective[] = [];

  ngAfterViewInit(): void {
    DialogFocusDirective.stack.push(this);
    // After the first render so `[autofocus]`-style targets inside *ngIf blocks exist.
    setTimeout(() => {
      const preferred = this.host.nativeElement.querySelector<HTMLElement>('[data-autofocus]');
      (preferred ?? this.focusables()[0] ?? this.host.nativeElement).focus();
    });
  }

  ngOnDestroy(): void {
    const stack = DialogFocusDirective.stack;
    const index = stack.indexOf(this);
    if (index >= 0) stack.splice(index, 1);
    if (this.opener?.isConnected) this.opener.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const stack = DialogFocusDirective.stack;
    if (stack[stack.length - 1] !== this) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.dialogClose.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = this.focusables();
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null,
    );
  }
}
