/**
 * TanStack Query hooks for admin approved inputs catalogue (D11).
 */
import {
  createAdminInput,
  deleteAdminInput,
  getAdminInput,
  listAdminInputs,
  updateAdminInput,
  type ApprovedInputDto,
  type CreateApprovedInputBody,
  type UpdateApprovedInputBody,
} from './inputs';
import { useAdminMutation, useAdminQuery } from './hooks';
import { adminKeys } from './queryKeys';

export const INPUTS_MODULE = 'inputs';

export function useAdminInputs(enabled = true) {
  return useAdminQuery<{ items: ApprovedInputDto[] }>(
    adminKeys.scoped(INPUTS_MODULE, undefined, { resource: 'list' }),
    (signal) => listAdminInputs(signal),
    { enabled },
  );
}

export function useAdminInput(inputId: string | undefined, enabled = true) {
  return useAdminQuery<ApprovedInputDto>(
    adminKeys.scoped(INPUTS_MODULE, undefined, { resource: 'detail', inputId: inputId ?? null }),
    (signal) => getAdminInput(inputId!, signal),
    { enabled: enabled && Boolean(inputId) },
  );
}

export function useCreateAdminInput() {
  return useAdminMutation<CreateApprovedInputBody, ApprovedInputDto>({
    mutationFn: (body) => createAdminInput(body),
    invalidates: [adminKeys.module(INPUTS_MODULE)],
  });
}

export function useUpdateAdminInput(inputId: string) {
  return useAdminMutation<UpdateApprovedInputBody, ApprovedInputDto>({
    mutationFn: (body) => updateAdminInput(inputId, body),
    invalidates: [adminKeys.module(INPUTS_MODULE)],
  });
}

export function useDeleteAdminInput() {
  return useAdminMutation<string, void>({
    mutationFn: (inputId) => deleteAdminInput(inputId),
    invalidates: [adminKeys.module(INPUTS_MODULE)],
  });
}
