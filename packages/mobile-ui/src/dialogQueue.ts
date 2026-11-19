/**
 * The state behind the shared in-app dialog (`DialogHost` in ./Dialog.tsx).
 *
 * Why this exists: the farmer app calls React Native's `Alert.alert` in well over
 * a hundred places. The native alert ignores the design tokens, cannot show a tone
 * (success / warning / error), and on Android renders the platform's own dialog.
 * `showDialog` / `appAlert` replace it with one themed, safe-area-aware dialog,
 * and `appAlert` takes exactly Alert.alert's arguments so the migration is a
 * mechanical rename.
 *
 * Deliberately React-free and React-Native-free: apps/mobile's vitest runs in
 * plain Node, so the queueing and button rules live here where they can be
 * unit-tested (apps/mobile/src/roles/farmer/tests/dialogQueue.test.ts imports
 * this file directly). Dialog.tsx only renders `dialogStore.current()`.
 *
 * Behaviour, and where it intentionally differs from Alert.alert:
 * - One dialog at a time. A second `showDialog` while one is open is queued
 *   (FIFO) instead of stacking native windows on top of each other.
 * - A button press closes the dialog *first*, then runs its `onPress`, so a
 *   handler that opens a follow-up dialog sees an empty slot. A second tap on
 *   a dialog that already closed is ignored (no double submit).
 * - Back button / backdrop tap ("close request") only works when `cancelable`.
 *   It runs the `cancel`-style button's `onPress` (if any), then `onDismiss`.
 *   `cancelable` defaults to true when the dialog has a single button or a
 *   cancel button, and to false when it offers several actions and no cancel
 *   (the user has to choose one).
 */

export type DialogTone = 'info' | 'success' | 'warning' | 'error';
export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  /** Visible text. Omitted only for the implicit single button; the host then shows its default label. */
  label?: string | undefined;
  style?: DialogButtonStyle | undefined;
  onPress?: (() => void) | undefined;
  testID?: string | undefined;
}

export interface DialogOptions {
  title: string;
  message?: string | undefined;
  /** Omitted or empty: one default button labelled by the host (OK). */
  buttons?: readonly DialogButton[] | undefined;
  tone?: DialogTone | undefined;
  /** See the module docblock for the default. */
  cancelable?: boolean | undefined;
  /** Runs after a close request (back / backdrop) closed the dialog. */
  onDismiss?: (() => void) | undefined;
}

export interface NormalizedDialogButton {
  label: string | undefined;
  style: DialogButtonStyle;
  onPress: (() => void) | undefined;
  testID: string | undefined;
}

export interface DialogRequest {
  readonly id: number;
  readonly title: string;
  readonly message: string | undefined;
  readonly buttons: readonly NormalizedDialogButton[];
  readonly tone: DialogTone;
  readonly cancelable: boolean;
  readonly onDismiss: (() => void) | undefined;
}

export function normalizeDialog(options: DialogOptions, id: number): DialogRequest {
  const given = options.buttons ?? [];
  const buttons: NormalizedDialogButton[] =
    given.length === 0
      ? [{ label: undefined, style: 'default', onPress: undefined, testID: undefined }]
      : given.map((b) => ({
          label: b.label,
          style: b.style ?? 'default',
          onPress: b.onPress,
          testID: b.testID,
        }));
  const hasCancel = buttons.some((b) => b.style === 'cancel');
  return {
    id,
    title: options.title,
    message: options.message,
    buttons,
    tone: options.tone ?? 'info',
    cancelable: options.cancelable ?? (buttons.length === 1 || hasCancel),
    onDismiss: options.onDismiss,
  };
}

export interface DialogStore {
  /** Queue a dialog; returns its id (for `dismiss`). */
  show(options: DialogOptions): number;
  /** The button at `index` of dialog `id` was pressed. Ignored unless `id` is on screen. */
  press(id: number, index: number): void;
  /** Back button / backdrop. Returns false (and keeps the dialog) when it is not cancelable. */
  requestClose(id: number): boolean;
  /** Remove dialog `id` (on screen or queued) without running any callback. */
  dismiss(id: number): void;
  /** The dialog on screen, or null. Same object until the queue changes. */
  current(): DialogRequest | null;
  size(): number;
  subscribe(listener: () => void): () => void;
}

export function createDialogStore(): DialogStore {
  let queue: readonly DialogRequest[] = [];
  let nextId = 1;
  const listeners = new Set<() => void>();

  const setQueue = (next: readonly DialogRequest[]): void => {
    queue = next;
    listeners.forEach((listener) => listener());
  };

  /** Removes `id` if it is the dialog on screen; returns it, or undefined. */
  const takeCurrent = (id: number): DialogRequest | undefined => {
    const head = queue[0];
    if (head === undefined || head.id !== id) return undefined;
    setQueue(queue.slice(1));
    return head;
  };

  return {
    show(options) {
      const id = nextId;
      nextId += 1;
      setQueue([...queue, normalizeDialog(options, id)]);
      return id;
    },
    press(id, index) {
      const head = queue[0];
      if (head === undefined || head.id !== id || head.buttons[index] === undefined) return;
      const dialog = takeCurrent(id);
      dialog?.buttons[index]?.onPress?.();
    },
    requestClose(id) {
      const head = queue[0];
      if (head === undefined || head.id !== id || !head.cancelable) return false;
      const dialog = takeCurrent(id);
      dialog?.buttons.find((b) => b.style === 'cancel')?.onPress?.();
      dialog?.onDismiss?.();
      return true;
    },
    dismiss(id) {
      if (!queue.some((d) => d.id === id)) return;
      setQueue(queue.filter((d) => d.id !== id));
    },
    current() {
      return queue[0] ?? null;
    },
    size() {
      return queue.length;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The app-wide queue `DialogHost` renders. */
export const dialogStore: DialogStore = createDialogStore();

/** Show a themed dialog. Returns its id, for `dismissDialog`. */
export function showDialog(options: DialogOptions): number {
  return dialogStore.show(options);
}

export function dismissDialog(id: number): void {
  dialogStore.dismiss(id);
}

/** Alert.alert's button shape (`text`, not `label`). */
export interface AlertStyleButton {
  text?: string | undefined;
  style?: DialogButtonStyle | undefined;
  onPress?: ((value?: string) => void) | undefined;
}

export interface AppAlertOptions {
  cancelable?: boolean | undefined;
  onDismiss?: (() => void) | undefined;
  tone?: DialogTone | undefined;
}

export function alertButtonsToDialogButtons(
  buttons: readonly AlertStyleButton[] | undefined,
): DialogButton[] | undefined {
  if (buttons === undefined) return undefined;
  return buttons.map((b) => {
    const mapped: DialogButton = { label: b.text, style: b.style };
    if (b.onPress !== undefined) {
      const onPress = b.onPress;
      mapped.onPress = () => onPress();
    }
    return mapped;
  });
}

/**
 * Drop-in for `Alert.alert(title, message?, buttons?, options?)`: the same
 * arguments, rendered by `DialogHost`. `options.tone` is the one addition.
 */
export function appAlert(
  title: string,
  message?: string,
  buttons?: readonly AlertStyleButton[],
  options?: AppAlertOptions,
): number {
  return showDialog({
    title,
    message,
    buttons: alertButtonsToDialogButtons(buttons),
    tone: options?.tone,
    cancelable: options?.cancelable,
    onDismiss: options?.onDismiss,
  });
}

/**
 * Longest label (in characters) that still shares a row with another button.
 * Beyond it the buttons stack, so a long Tamil label wraps across the full
 * width instead of squeezing into half of it.
 */
export const DIALOG_ROW_LABEL_MAX = 14;

export interface DialogButtonLayout {
  direction: 'row' | 'column';
  /** Indexes into the dialog's buttons, in render order. */
  order: number[];
}

/**
 * Row (dismissive button first, as Material dialogs do) for one or two short
 * buttons; otherwise a column with the actions first and cancel last.
 */
export function layoutDialogButtons(
  buttons: readonly { label?: string | undefined; style?: DialogButtonStyle | undefined }[],
): DialogButtonLayout {
  const indexes = buttons.map((_, i) => i);
  const isCancel = (i: number): boolean => buttons[i]?.style === 'cancel';
  const fitsRow =
    buttons.length <= 2 && buttons.every((b) => (b.label ?? '').length <= DIALOG_ROW_LABEL_MAX);
  if (fitsRow) {
    return { direction: 'row', order: [...indexes.filter(isCancel), ...indexes.filter((i) => !isCancel(i))] };
  }
  return { direction: 'column', order: [...indexes.filter((i) => !isCancel(i)), ...indexes.filter(isCancel)] };
}
