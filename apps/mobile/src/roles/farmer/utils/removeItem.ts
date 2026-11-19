/**
 * What confirming "Remove" on RemoveItemScreen actually does.
 *
 * This used to live inline in App.tsx and swallowed the delete's error:
 * `catch { /* Ignore error and navigate back to list which refreshes *\/ }`.
 * Returning to the list is this flow's way of saying "it is gone", so a
 * swallowed failure told the farmer their machine, tool or tree planting had
 * been removed when the server still held the record. A missing `id` was
 * treated the same way — skipped silently, then navigated back.
 *
 * It lives here, as a pure decision over injected delete functions, so that
 * behaviour can be tested without mounting App.tsx's 3,000-line screen
 * switcher (same reason as utils/navigationSession.ts).
 */
import { formatErrorMessage } from '../../../shell/api/client';
import { t } from '../../../i18n/farmer';
import { canDeleteAsset, type RemoveItemData } from '../screens/farm/assets/RemoveItemScreen';

/** The list screen each category returns to once its item really is gone. */
export type RemoveListScreen = 'ToolsList' | 'EquipmentList' | 'TreesList' | 'MachineryList';

export type RemoveOutcome =
  /** The server accepted the delete: it is safe to go back to the list. */
  | { kind: 'deleted'; next: RemoveListScreen }
  /** Nothing was deleted: show this and stay where we are. */
  | { kind: 'failed'; title: string; message: string };

export interface RemoveItemDeps {
  deleteTreePlanting: (id: string) => Promise<void>;
  deleteFarmAsset: (id: string) => Promise<void>;
}

function listScreenFor(category: RemoveItemData['category']): RemoveListScreen {
  if (category === 'Tools') return 'ToolsList';
  if (category === 'Equipment') return 'EquipmentList';
  if (category === 'Trees') return 'TreesList';
  return 'MachineryList';
}

export async function performRemoveItem(
  item: RemoveItemData | null | undefined,
  deps: RemoveItemDeps,
): Promise<RemoveOutcome> {
  // No id, or a category with no delete endpoint (canDeleteAsset is the single
  // source of truth for that, see RemoveItemScreen.tsx), means nothing was sent
  // to the server. That is not a successful removal.
  if (!item?.id || !canDeleteAsset(item.category)) {
    return {
      kind: 'failed',
      title: t('farmer.removeItem.deleteFailed.title'),
      message: t('farmer.removeItem.deleteUnavailable'),
    };
  }

  try {
    // Trees delete via BR-55d; everything else through farm-assets.
    if (item.category === 'Trees') {
      await deps.deleteTreePlanting(item.id);
    } else {
      await deps.deleteFarmAsset(item.id);
    }
  } catch (err: unknown) {
    return {
      kind: 'failed',
      title: t('farmer.removeItem.deleteFailed.title'),
      message: formatErrorMessage(err, t('farmer.removeItem.deleteFailed.body')),
    };
  }

  return { kind: 'deleted', next: listScreenFor(item.category) };
}
