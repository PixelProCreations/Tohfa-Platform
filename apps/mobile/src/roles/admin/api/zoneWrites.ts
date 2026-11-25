/**
 * Admin zone write APIs (D10):
 * - POST /v1/admin/zones
 * - PATCH /v1/admin/zones/:id
 * - POST /v1/admin/zones/:id/transfer-farmers
 */
import { adminPatch, adminPost } from './http';

export interface CreateZoneBody {
  name: string;
  code: string;
  warehouseId: string;
  district?: string;
  talukIds?: string[];
  managerId?: string;
}

export interface UpdateZoneBody {
  name?: string;
  warehouseId?: string;
  district?: string;
  talukIds?: string[];
  managerId?: string | null;
  isActive?: boolean;
}

export interface TransferZoneFarmersBody {
  targetZoneId: string;
  farmerIds?: string[];
  reason?: string;
}

export interface ZoneWriteResponse {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  isActive: boolean;
}

export function createZone(body: CreateZoneBody) {
  return adminPost<ZoneWriteResponse>('/v1/admin/zones', body);
}

export function updateZone(zoneId: string, body: UpdateZoneBody) {
  return adminPatch<ZoneWriteResponse>(`/v1/admin/zones/${zoneId}`, body);
}

export function transferZoneFarmers(zoneId: string, body: TransferZoneFarmersBody) {
  return adminPost<{ transferredCount: number }>(`/v1/admin/zones/${zoneId}/transfer-farmers`, body);
}
