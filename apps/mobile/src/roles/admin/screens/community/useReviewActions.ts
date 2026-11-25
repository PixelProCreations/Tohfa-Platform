/**
 * The review button of the two content screens (BR-59t): which action it is,
 * whether it can fire, and what firing it does. The decisions (which state
 * offers which action) are in ./reviewLogic.ts; this file only wires them to
 * the two writes and the prompts.
 *
 * Review state and published state are independent axes. Nothing here reads
 * `isPublished`, neither write carries it, and no publish write is made or
 * blocked: a review decision on published content leaves it published.
 *
 * Only a settled write reports anything. Every success Alert sits inside the
 * mutation's onSuccess; a failure is exposed as `error` for the screen to draw.
 * The approve / reject choice is a genuine prompt (Alert buttons), not a
 * success message.
 */
import { Alert } from 'react-native';
import { t } from '../../i18n';
import { useReviewLearningContent, useSubmitLearningForReview } from '../../api/learningHooks';
import type { ContentDto } from './communityLogic';
import { contentTypeOf, reviewAction, reviewSuccessKey, type ReviewAction } from './reviewLogic';

export interface ReviewActionState {
  action: ReviewAction;
  /** The button is unavailable: nothing to send, or a request is in flight. */
  disabled: boolean;
  isPending: boolean;
  /** What the last review write threw; undefined/null when it did not fail. */
  error: unknown;
  onPress: () => void;
}

export function useReviewActions(content: ContentDto | undefined, can: ((code: string) => boolean) | undefined): ReviewActionState {
  const submit = useSubmitLearningForReview();
  const review = useReviewLearningContent();
  const action = reviewAction(content, can);
  const isPending = submit.isPending || review.isPending;
  const disabled = action.disabled || isPending;

  const decide = (type: ReturnType<typeof contentTypeOf>, id: string, status: 'APPROVED' | 'REJECTED') => {
    review.mutate(
      { type, id, status },
      {
        onSuccess: () => {
          Alert.alert(t('community.publish.success.title'), t(reviewSuccessKey(status)));
        },
      },
    );
  };

  const onPress = () => {
    if (content === undefined || disabled) return;
    const type = contentTypeOf(content.kind);
    const id = content.dto.id;
    if (action.kind === 'submit') {
      submit.mutate(
        { type, id },
        {
          onSuccess: () => {
            Alert.alert(t('community.publish.success.title'), t(reviewSuccessKey('submit')));
          },
        },
      );
    } else if (action.kind === 'decide') {
      Alert.alert(t('community.review.prompt.title'), t('community.review.prompt.message'), [
        { text: t('community.review.approve'), onPress: () => decide(type, id, 'APPROVED') },
        { text: t('community.review.reject'), style: 'destructive', onPress: () => decide(type, id, 'REJECTED') },
        { text: t('community.action.cancel'), style: 'cancel' },
      ]);
    }
  };

  return { action, disabled, isPending, error: submit.error ?? review.error, onPress };
}
