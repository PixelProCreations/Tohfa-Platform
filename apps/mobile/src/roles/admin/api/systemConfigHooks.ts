/**
 * TanStack Query hooks for admin system config (D12).
 */
import { listSystemConfig, updateSystemConfig, type SystemConfigEntryDto } from './systemConfig';
import { useAdminMutation, useAdminQuery } from './hooks';
import { adminKeys } from './queryKeys';

export const SYSTEM_CONFIG_MODULE = 'systemConfig';

export function useSystemConfig(enabled = true) {
  return useAdminQuery<{ items: SystemConfigEntryDto[] }>(
    adminKeys.scoped(SYSTEM_CONFIG_MODULE, undefined, { resource: 'list' }),
    (signal) => listSystemConfig(signal),
    { enabled },
  );
}

export function useUpdateSystemConfig() {
  return useAdminMutation<{ key: string; value: unknown }, SystemConfigEntryDto>({
    mutationFn: ({ key, value }) => updateSystemConfig(key, value),
    invalidates: [adminKeys.module(SYSTEM_CONFIG_MODULE)],
  });
}
