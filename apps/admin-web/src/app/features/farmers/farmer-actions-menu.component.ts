/**
 * The "More Actions" dropdown of the Farmer Details header.
 *
 * A WAI-ARIA menu button: Enter/Space/ArrowDown open it on the first item, ArrowUp on the last;
 * arrows, Home and End move between items; Escape closes it and returns focus to the trigger;
 * Tab or a click outside closes it. Disabled items stay focusable (aria-disabled) so a keyboard
 * user can still read why an action is unavailable from its title, as the menu pattern advises.
 *
 * Which items are enabled is decided by the parent from docs/rbac.json and the farmer's state.
 * That is a courtesy only: the API re-checks every permission on the request.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  ViewChildren,
  inject,
  signal,
  type QueryList,
} from '@angular/core';

export type MenuItemTone = 'default' | 'success' | 'danger';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  tone: MenuItemTone;
  /** Items with different groups are separated by a divider. */
  group: number;
  disabled: boolean;
  /** Tooltip, used to say why a disabled item is unavailable. */
  hint?: string | undefined;
}

@Component({
  selector: 'tohfa-farmer-actions-menu',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        position: relative;
        display: inline-block;
      }
      .trigger {
        min-height: 44px;
        padding: var(--space-10) var(--space-16);
        background: var(--tohfa-surface);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        color: var(--tohfa-ink);
        font-size: var(--fs-cell);
      }
      .trigger:hover {
        background: var(--tohfa-page);
      }
      .trigger .icon {
        font-size: var(--icon-chevron);
        color: var(--tohfa-slate);
      }
      .menu {
        position: absolute;
        top: calc(100% + var(--space-8));
        right: 0;
        z-index: 20;
        min-width: 300px;
        margin: 0;
        padding: var(--space-8) 0;
        list-style: none;
        background: var(--tohfa-surface);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-presentation);
      }
      .divider {
        height: 0;
        margin: var(--space-6) 0;
        border-top: var(--border-divider);
      }
      .item {
        display: flex;
        align-items: center;
        gap: var(--space-14);
        width: 100%;
        padding: var(--space-10) var(--space-18);
        border: none;
        background: transparent;
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        text-align: left;
        cursor: pointer;
      }
      .item .icon {
        font-size: var(--icon-nav);
      }
      .item:hover:not([aria-disabled='true']),
      .item:focus-visible {
        outline: none;
        background: var(--tohfa-page);
      }
      .item.tone-success,
      .item.tone-success .icon {
        color: var(--ok);
      }
      /* The destructive item is always tinted, enabled or not, as in the design. */
      .item.tone-danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .item.tone-danger:focus-visible {
        box-shadow: inset var(--tohfa-focus-ring);
      }
      .item[aria-disabled='true'] {
        cursor: not-allowed;
      }
      .item[aria-disabled='true'] .label,
      .item[aria-disabled='true'] .icon {
        opacity: 0.45;
      }
      .item.tone-default[aria-disabled='true'] .label {
        color: var(--tohfa-muted);
        opacity: 1;
      }
    `,
  ],
  template: `
    <button
      #trigger
      type="button"
      class="tohfa-btn trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? menuId : null"
      (click)="toggle()"
      (keydown)="onTriggerKey($event)"
    >
      {{ label }}
      <span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
    </button>

    <ul class="menu" *ngIf="open()" role="menu" [id]="menuId" [attr.aria-label]="label" (keydown)="onMenuKey($event)">
      <ng-container *ngFor="let item of items; let i = index">
        <li class="divider" role="separator" *ngIf="startsGroup(i)"></li>
        <li role="none">
          <button
            #menuItem
            type="button"
            role="menuitem"
            tabindex="-1"
            class="item tone-{{ item.tone }}"
            [attr.aria-disabled]="item.disabled"
            [title]="item.hint ?? ''"
            (click)="choose(item)"
          >
            <span class="material-symbols-outlined icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="label">{{ item.label }}</span>
          </button>
        </li>
      </ng-container>
    </ul>
  `,
})
export class FarmerActionsMenuComponent {
  private static nextId = 0;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input({ required: true }) label = '';
  @Input({ required: true }) items: readonly MenuItem[] = [];
  @Output() readonly selected = new EventEmitter<string>();

  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;
  @ViewChildren('menuItem') private menuItems?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly menuId = `tohfa-actions-menu-${FarmerActionsMenuComponent.nextId++}`;
  readonly open = signal(false);

  /** A divider goes before every item whose group differs from the previous item's. */
  startsGroup(index: number): boolean {
    return index > 0 && this.items[index - 1]?.group !== this.items[index]?.group;
  }

  toggle(): void {
    if (this.open()) this.close(false);
    else this.openAt(0);
  }

  onTriggerKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.openAt(this.items.length - 1);
    }
  }

  onMenuKey(event: KeyboardEvent): void {
    const buttons = this.menuItems?.toArray().map((r) => r.nativeElement) ?? [];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const last = buttons.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        buttons[current >= last ? 0 : current + 1]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        buttons[current <= 0 ? last : current - 1]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        buttons[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        buttons[last]?.focus();
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close(false);
        break;
    }
  }

  choose(item: MenuItem): void {
    if (item.disabled) return;
    this.close(true);
    this.selected.emit(item.id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close(false);
  }

  private openAt(index: number): void {
    this.open.set(true);
    // The items exist only after this change-detection pass renders the menu.
    setTimeout(() => this.menuItems?.get(index)?.nativeElement.focus());
  }

  private close(returnFocus: boolean): void {
    this.open.set(false);
    if (returnFocus) this.trigger?.nativeElement.focus();
  }
}
