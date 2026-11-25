/**
 * Admin system config API (D12):
 * - GET /v1/admin/system-config
 * - PATCH /v1/admin/system-config/:key
 */
import { adminGet, adminPatch } from './http';

export interface SystemConfigEntryDto {
  key: string;
  value: unknown;
  description?: string | null;
  isReadOnly?: boolean;
  updatedAt?: string;
}

export function listSystemConfig(signal?: AbortSignal) {
  return adminGet<{ items: SystemConfigEntryDto[] }>('/v1/admin/system-config', undefined, signal);
}

export function updateSystemConfig(key: string, value: unknown) {
  return adminPatch<SystemConfigEntryDto>(`/v1/admin/system-config/${encodeURIComponent(key)}`, { value });
}
