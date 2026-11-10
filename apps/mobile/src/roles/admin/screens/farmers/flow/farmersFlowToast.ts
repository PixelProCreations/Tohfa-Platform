/**
 * The success toasts of the shared Farmers flow (../FarmersFlow.tsx), in the
 * shape the existing TohfaToast takes. They replace the toasts the old
 * roles/farmer/App.tsx switcher showed ('Changes Saved', 'Application
 * Approved', 'Application Rejected'), with the text now from i18n.
 *
 * Each builder is called only from a screen callback that fires after the
 * server answered (onSaved, onApproved, onConfirmReject), so a toast is never
 * optimistic. Names come from the server's response; with none, the nameless
 * wording is used rather than a placeholder name.
 */
import type { ToastData } from '../../../components/TohfaToast';
import { t } from '../../../i18n';

function nameOf(name: string | null | undefined): string | null {
  return typeof name === 'string' && name.trim() !== '' ? name.trim() : null;
}

/** After PATCH /admin/farmers/{id} succeeded; `name` is the saved name. */
export function savedToast(name: string | null | undefined): ToastData {
  return {
    type: 'approve',
    title: t('farmersEntry.toast.saved.title'),
    message: t('farmersEntry.toast.saved.message', { name: nameOf(name) ?? '' }),
  };
}

/** After POST .../approve succeeded; `fullName` is the applicant's name on the result. */
export function approvedToast(fullName: string | null | undefined): ToastData {
  const name = nameOf(fullName);
  return {
    type: 'approve',
    title: t('farmersEntry.toast.approved.title'),
    message: name === null ? t('farmersEntry.toast.approved.messageNoName') : t('farmersEntry.toast.approved.message', { name }),
  };
}

/** After POST .../reject succeeded; `reason` is the chosen reason's label. */
export function rejectedToast(fullName: string | null | undefined, reason: string): ToastData {
  const name = nameOf(fullName);
  return {
    type: 'reject',
    title: t('farmersEntry.toast.rejected.title'),
    message:
      name === null
        ? t('farmersEntry.toast.rejected.messageNoName', { reason })
        : t('farmersEntry.toast.rejected.message', { name, reason }),
  };
}
