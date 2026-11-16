/**
 * i18n labels and success toasts of the listing approval flow. Each enum maps
 * to a literal key so the source guard can see every key the flow uses.
 *
 * The toast builders are called only from a write's onDone, which fires after
 * the server answered, so a toast is never optimistic.
 */
import type { ToastData } from '../../components/TohfaToast';
import type { ListingGrade, RejectReasonCode } from '../../api/listings';
import { t, type TranslationKey } from '../../i18n';
import type { GradeTab } from './listingsLogic';

const GRADE_KEYS: Readonly<Record<ListingGrade | GradeTab, TranslationKey>> = {
  ALL: 'listingsAdmin.grade.ALL',
  GRADE_1: 'listingsAdmin.grade.GRADE_1',
  GRADE_2: 'listingsAdmin.grade.GRADE_2',
  GRADE_3: 'listingsAdmin.grade.GRADE_3',
  REJECT: 'listingsAdmin.grade.REJECT',
};

const REJECT_CODE_KEYS: Readonly<Record<RejectReasonCode, TranslationKey>> = {
  QUALITY_CONCERN: 'listingsAdmin.reject.code.QUALITY_CONCERN',
  PRICE_UNACCEPTABLE: 'listingsAdmin.reject.code.PRICE_UNACCEPTABLE',
  NO_DEMAND: 'listingsAdmin.reject.code.NO_DEMAND',
  CERT_ISSUE: 'listingsAdmin.reject.code.CERT_ISSUE',
  DUPLICATE: 'listingsAdmin.reject.code.DUPLICATE',
  OTHER: 'listingsAdmin.reject.code.OTHER',
};

export function gradeLabel(grade: ListingGrade | GradeTab): string {
  return t(GRADE_KEYS[grade]);
}

export function rejectCodeLabel(code: RejectReasonCode): string {
  return t(REJECT_CODE_KEYS[code]);
}

export function approvedToast(crop: string | null): ToastData {
  return {
    type: 'approve',
    title: t('listingsAdmin.toast.approved.title'),
    message: crop === null ? t('listingsAdmin.toast.approved.messageNoName') : t('listingsAdmin.toast.approved.message', { crop }),
  };
}

export function rejectedToast(crop: string | null): ToastData {
  return {
    type: 'reject',
    title: t('listingsAdmin.toast.rejected.title'),
    message: crop === null ? t('listingsAdmin.toast.rejected.messageNoName') : t('listingsAdmin.toast.rejected.message', { crop }),
  };
}

export function counterSentToast(crop: string | null): ToastData {
  return {
    type: 'info_request',
    title: t('listingsAdmin.toast.counter.title'),
    message: crop === null ? t('listingsAdmin.toast.counter.messageNoName') : t('listingsAdmin.toast.counter.message', { crop }),
  };
}
