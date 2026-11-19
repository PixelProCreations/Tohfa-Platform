import { describe, expect, it, vi } from 'vitest';
// Imported by relative path on purpose: @tohfa/mobile-ui's index pulls in React Native, which
// plain-Node vitest cannot load. dialogQueue.ts is React-free for this reason (see its docblock).
import {
  alertButtonsToDialogButtons,
  createDialogStore,
  layoutDialogButtons,
  normalizeDialog,
} from '../../../../../../packages/mobile-ui/src/dialogQueue';

describe('dialogQueue: normalizeDialog', () => {
  it('gives a dialog with no buttons one default button whose label the host fills in', () => {
    const d = normalizeDialog({ title: 'Saved' }, 1);
    expect(d.buttons).toHaveLength(1);
    expect(d.buttons[0]?.style).toBe('default');
    expect(d.buttons[0]?.label).toBeUndefined();
    expect(d.tone).toBe('info');
  });

  it('treats an empty buttons array like no buttons (Alert.alert does the same)', () => {
    expect(normalizeDialog({ title: 'x', buttons: [] }, 1).buttons).toHaveLength(1);
  });

  it('is cancelable by default with one button or with a cancel button', () => {
    expect(normalizeDialog({ title: 'x' }, 1).cancelable).toBe(true);
    expect(
      normalizeDialog({ title: 'x', buttons: [{ label: 'No', style: 'cancel' }, { label: 'Yes' }] }, 1).cancelable,
    ).toBe(true);
  });

  it('is NOT cancelable by default with several buttons and no cancel button: the user must choose', () => {
    expect(normalizeDialog({ title: 'x', buttons: [{ label: 'A' }, { label: 'B' }] }, 1).cancelable).toBe(false);
  });

  it('lets an explicit cancelable override the default either way', () => {
    expect(normalizeDialog({ title: 'x', cancelable: false }, 1).cancelable).toBe(false);
    expect(normalizeDialog({ title: 'x', buttons: [{ label: 'A' }, { label: 'B' }], cancelable: true }, 1).cancelable).toBe(
      true,
    );
  });
});

describe('dialogQueue: store', () => {
  it('shows the first dialog and queues the next one (FIFO), never stacking two at once', () => {
    const store = createDialogStore();
    const a = store.show({ title: 'A' });
    const b = store.show({ title: 'B' });
    expect(store.current()?.id).toBe(a);
    expect(store.size()).toBe(2);
    store.press(a, 0);
    expect(store.current()?.id).toBe(b);
    store.press(b, 0);
    expect(store.current()).toBeNull();
  });

  it('runs the pressed button once, after the dialog has closed', () => {
    const store = createDialogStore();
    let currentWhenPressed: unknown = 'unset';
    const onPress = vi.fn(() => {
      currentWhenPressed = store.current();
    });
    const id = store.show({ title: 'Delete?', buttons: [{ label: 'Cancel', style: 'cancel' }, { label: 'Delete', style: 'destructive', onPress }] });
    store.press(id, 1);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(currentWhenPressed).toBeNull();
  });

  it('ignores a second tap on a dialog that has already closed (no double submit)', () => {
    const store = createDialogStore();
    const onPress = vi.fn();
    const id = store.show({ title: 'Pay', buttons: [{ label: 'Pay', onPress }] });
    store.press(id, 0);
    store.press(id, 0);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores a press aimed at a dialog that is queued but not on screen', () => {
    const store = createDialogStore();
    const first = store.show({ title: 'first' });
    const onPress = vi.fn();
    const second = store.show({ title: 'second', buttons: [{ label: 'Go', onPress }] });
    store.press(second, 0);
    expect(onPress).not.toHaveBeenCalled();
    expect(store.current()?.id).toBe(first);
  });

  it('a dialog opened from a button handler is shown next', () => {
    const store = createDialogStore();
    const id = store.show({
      title: 'Saved',
      buttons: [{ label: 'OK', onPress: () => store.show({ title: 'Follow-up' }) }],
    });
    store.press(id, 0);
    expect(store.current()?.title).toBe('Follow-up');
  });

  it('back / backdrop on a cancelable dialog runs the cancel button, then onDismiss', () => {
    const store = createDialogStore();
    const calls: string[] = [];
    const id = store.show({
      title: 'Discard?',
      buttons: [
        { label: 'Keep', style: 'cancel', onPress: () => calls.push('cancel') },
        { label: 'Discard', style: 'destructive', onPress: () => calls.push('discard') },
      ],
      onDismiss: () => calls.push('dismiss'),
    });
    expect(store.requestClose(id)).toBe(true);
    expect(calls).toEqual(['cancel', 'dismiss']);
    expect(store.current()).toBeNull();
  });

  it('back / backdrop on a non-cancelable dialog does nothing and keeps it open', () => {
    const store = createDialogStore();
    const onDismiss = vi.fn();
    const id = store.show({ title: 'Choose', buttons: [{ label: 'A' }, { label: 'B' }], onDismiss });
    expect(store.requestClose(id)).toBe(false);
    expect(store.current()?.id).toBe(id);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismiss() removes a dialog programmatically, current or queued, without running callbacks', () => {
    const store = createDialogStore();
    const onDismiss = vi.fn();
    const a = store.show({ title: 'A', onDismiss });
    const b = store.show({ title: 'B' });
    const c = store.show({ title: 'C' });
    store.dismiss(b);
    store.dismiss(a);
    expect(store.current()?.id).toBe(c);
    expect(store.size()).toBe(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('notifies subscribers on every change and stops after unsubscribe', () => {
    const store = createDialogStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const id = store.show({ title: 'A' });
    store.press(id, 0);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.show({ title: 'B' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('returns the same snapshot object until something changes (useSyncExternalStore contract)', () => {
    const store = createDialogStore();
    store.show({ title: 'A' });
    expect(store.current()).toBe(store.current());
  });
});

describe('dialogQueue: alertButtonsToDialogButtons (Alert.alert call shape)', () => {
  it('maps text -> label and keeps style and onPress', () => {
    const onPress = vi.fn();
    const buttons = alertButtonsToDialogButtons([{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress }]);
    expect(buttons?.map((b) => ({ label: b.label, style: b.style }))).toEqual([
      { label: 'Cancel', style: 'cancel' },
      { label: 'Delete', style: 'destructive' },
    ]);
    expect(buttons?.[0]?.onPress).toBeUndefined();
    buttons?.[1]?.onPress?.();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for no buttons so the default OK button applies', () => {
    expect(alertButtonsToDialogButtons(undefined)).toBeUndefined();
  });
});

describe('dialogQueue: layoutDialogButtons', () => {
  const cancel = { label: 'Cancel', style: 'cancel' as const };
  const ok = { label: 'OK', style: 'default' as const };
  const del = { label: 'Delete', style: 'destructive' as const };

  it('puts one or two short buttons in a row, the cancel (dismissive) one first', () => {
    expect(layoutDialogButtons([ok, cancel])).toEqual({ direction: 'row', order: [1, 0] });
    expect(layoutDialogButtons([ok])).toEqual({ direction: 'row', order: [0] });
  });

  it('stacks three or more buttons, actions first in their given order, cancel last', () => {
    expect(layoutDialogButtons([cancel, ok, del])).toEqual({ direction: 'column', order: [1, 2, 0] });
  });

  it('stacks two buttons when a label is too long to share a row (e.g. Tamil labels)', () => {
    const longLabel = { label: 'சான்றிதழ் ஆவணத்தைத் திறக்கவும்', style: 'default' as const };
    expect(layoutDialogButtons([cancel, longLabel]).direction).toBe('column');
  });
});
