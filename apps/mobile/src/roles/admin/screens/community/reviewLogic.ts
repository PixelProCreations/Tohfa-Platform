/**
 * Pure decisions for the content review workflow (BR-59t). No React, so the
 * app's plain-Node vitest covers it (tests/community_wiring_logic.test.ts).
 *
 * THE RULE THIS FILE EXISTS TO KEEP: review state and published state are two
 * independent axes, and the owner decided that on purpose. Content can be
 * published AND pending review at the same time; a review decision never moves
 * `isPublished`; publishing is never blocked by review state. So nothing here
 * reads `isPublished`, and publishAction (communityLogic.ts) reads no review
 * status. If a future change makes one depend on the other, that is a rule
 * change for the owner, not a refactor.
 *
 * Who may do what:
 *   - submit for review: `learning.admin.manage` (the same code as every other
 *     learning write), for content that is NOT_SUBMITTED or was REJECTED;
 *   - decide (approve or reject): `learning.content.review`, which only the
 *     Super Admin holds, for content that is PENDING_REVIEW.
 * The server enforces both and does not itself police the transition order, so
 * "which state offers which action" is this file's decision, written once.
 */
import type { LearningContentType } from '../../api/learning';
import type { TranslationKey } from '../../i18n';
import { canManageLearning, reviewStatusLabel, reviewStatusOf, type ContentDto, type ContentKind } from './communityLogic';

/** The permission behind POST /admin/learning/{type}/{id}/review (docs/rbac.json). */
export const LEARNING_REVIEW = 'learning.content.review';

/** Fails closed: no `can` means no decision. */
export function canReviewLearning(can: ((code: string) => boolean) | undefined): boolean {
  return can === undefined ? false : can(LEARNING_REVIEW);
}

const TYPE_PATH: Record<ContentKind, LearningContentType> = {
  article: 'articles',
  video: 'videos',
  training: 'trainings',
  group: 'groups',
};

/** The `{type}` path segment the review endpoints address an item by. */
export function contentTypeOf(kind: ContentKind): LearningContentType {
  return TYPE_PATH[kind];
}

export { reviewStatusLabel, reviewStatusOf };

/** What the review button on the two content screens does. */
export interface ReviewAction {
  /** `submit` sends submit-for-review, `decide` opens the approve / reject choice, `none` sends nothing. */
  kind: 'submit' | 'decide' | 'none';
  /** i18n key of the button label. */
  labelKey: TranslationKey;
  /** True when nothing can be sent; the button stays, drawn unavailable. */
  disabled: boolean;
}

/**
 * The review button, from the opened item's review status and the caller's
 * grants alone. `isPublished` is deliberately not an input (see the file note).
 * A `none` action's label is the status itself, so a disabled button still
 * tells the admin where the item stands.
 */
export function reviewAction(content: ContentDto | undefined, can: ((code: string) => boolean) | undefined): ReviewAction {
  const status = reviewStatusOf(content);
  const none: ReviewAction = {
    kind: 'none',
    labelKey: status === undefined ? 'community.action.review' : (`community.review.status.${status}` as TranslationKey),
    disabled: true,
  };
  if (content === undefined || status === undefined) return none;
  if ((status === 'NOT_SUBMITTED' || status === 'REJECTED') && canManageLearning(can)) {
    return { kind: 'submit', labelKey: 'community.action.submitReview', disabled: false };
  }
  if (status === 'PENDING_REVIEW' && canReviewLearning(can)) {
    return { kind: 'decide', labelKey: 'community.action.review', disabled: false };
  }
  return none;
}

/** The success line for a settled review write, in the catalogue. */
export function reviewSuccessKey(kind: 'submit' | 'APPROVED' | 'REJECTED'): TranslationKey {
  if (kind === 'submit') return 'community.review.submitted';
  return kind === 'APPROVED' ? 'community.review.approved' : 'community.review.rejected';
}
