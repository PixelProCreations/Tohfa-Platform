/**
 * One content item, whichever of the four Learning Hub resources it is.
 *
 * All four detail hooks are called every render because hooks cannot be
 * called conditionally; `enabled` means only the matching one requests
 * anything. No decisions live here — the mapping to what a screen renders is
 * in ./communityLogic.ts, which plain-Node vitest can test (hooks cannot be
 * rendered in this app's test setup; see api/hooks.ts).
 */
import { useLearningArticle, useLearningGroup, useLearningTraining, useLearningVideo } from '../../api/learningHooks';
import type { ContentDto, ContentKind } from './communityLogic';

export interface ContentItemState {
  content: ContentDto | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useContentItem(kind: ContentKind | undefined, id: string | undefined, allowed: boolean): ContentItemState {
  const asked = allowed && id !== undefined && kind !== undefined;
  const article = useLearningArticle(id, { enabled: asked && kind === 'article' });
  const video = useLearningVideo(id, { enabled: asked && kind === 'video' });
  const training = useLearningTraining(id, { enabled: asked && kind === 'training' });
  const group = useLearningGroup(id, { enabled: asked && kind === 'group' });

  const query = kind === 'video' ? video : kind === 'training' ? training : kind === 'group' ? group : article;

  let content: ContentDto | undefined;
  if (kind === 'article' && article.data !== undefined) content = { kind: 'article', dto: article.data };
  else if (kind === 'video' && video.data !== undefined) content = { kind: 'video', dto: video.data };
  else if (kind === 'training' && training.data !== undefined) content = { kind: 'training', dto: training.data };
  else if (kind === 'group' && group.data !== undefined) content = { kind: 'group', dto: group.data };

  return {
    content,
    isLoading: asked && query.isPending,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
