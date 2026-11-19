/**
 * Confirming "Remove" used to swallow the delete's error and navigate back to
 * the list anyway ("Ignore error and navigate back to list which refreshes"),
 * and skipped the call entirely — still navigating back — when the item had no
 * id. Both told the farmer their machine, tool or tree planting was gone while
 * the server still held the record.
 *
 * performRemoveItem is the decision App.tsx's RemoveItem handler now defers to:
 * it only reports 'deleted' when the delete actually reached the server.
 */
import { describe, it, expect, vi } from 'vitest';
import { performRemoveItem } from '../utils/removeItem';
import { t } from '../../../i18n/farmer';
import type { RemoveItemData } from '../screens/farm/assets/RemoveItemScreen';

const machinery: RemoveItemData = {
  id: 'asset-1',
  name: 'Power Tiller',
  category: 'Machinery',
  dateInfo: 'Machinery · Purchased 08 Feb 2023',
};

function deps(over: Partial<Parameters<typeof performRemoveItem>[1]> = {}) {
  return {
    deleteTreePlanting: vi.fn().mockResolvedValue(undefined),
    deleteFarmAsset: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('performRemoveItem', () => {
  it('reports the real error and does not navigate when the delete fails', async () => {
    const d = deps({ deleteFarmAsset: vi.fn().mockRejectedValue(new Error('Server unavailable')) });

    const outcome = await performRemoveItem(machinery, d);

    expect(outcome.kind).toBe('failed');
    expect(outcome.kind === 'failed' && outcome.message).toContain('Server unavailable');
    expect(outcome).not.toHaveProperty('next');
  });

  it('falls back to an honest message when the failure carries no message', async () => {
    const d = deps({ deleteFarmAsset: vi.fn().mockRejectedValue(undefined) });

    const outcome = await performRemoveItem(machinery, d);

    expect(outcome).toEqual({
      kind: 'failed',
      title: t('farmer.removeItem.deleteFailed.title'),
      message: t('farmer.removeItem.deleteFailed.body'),
    });
  });

  it('does not treat a missing id as a successful delete', async () => {
    const d = deps();

    const outcome = await performRemoveItem({ ...machinery, id: undefined }, d);

    expect(d.deleteFarmAsset).not.toHaveBeenCalled();
    expect(d.deleteTreePlanting).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      kind: 'failed',
      title: t('farmer.removeItem.deleteFailed.title'),
      message: t('farmer.removeItem.deleteUnavailable'),
    });
  });

  it('does not treat a missing item as a successful delete', async () => {
    const d = deps();

    const outcome = await performRemoveItem(null, d);

    expect(d.deleteFarmAsset).not.toHaveBeenCalled();
    expect(outcome.kind).toBe('failed');
  });

  it('navigates back to the matching list only when the server accepted the delete', async () => {
    const d = deps();

    expect(await performRemoveItem(machinery, d)).toEqual({
      kind: 'deleted',
      next: 'MachineryList',
    });
    expect(d.deleteFarmAsset).toHaveBeenCalledWith('asset-1');

    expect(await performRemoveItem({ ...machinery, category: 'Tools' }, d)).toEqual({
      kind: 'deleted',
      next: 'ToolsList',
    });
    expect(await performRemoveItem({ ...machinery, category: 'Equipment' }, d)).toEqual({
      kind: 'deleted',
      next: 'EquipmentList',
    });
  });

  it('BR-55d: a tree planting deletes through deleteTreePlanting', async () => {
    const d = deps();

    const outcome = await performRemoveItem({ ...machinery, category: 'Trees' }, d);

    expect(d.deleteTreePlanting).toHaveBeenCalledWith('asset-1');
    expect(d.deleteFarmAsset).not.toHaveBeenCalled();
    expect(outcome).toEqual({ kind: 'deleted', next: 'TreesList' });
  });
});

describe('App.tsx RemoveItem handler source guard', () => {
  it('no longer swallows the delete error', async () => {
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const source = readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');

    expect(source).not.toContain('Ignore error and navigate back to list which refreshes');
  });
});
