/**
 * Admin approved inputs catalogue API (D11):
 * - GET /v1/admin/inputs
 * - GET /v1/admin/inputs/:id
 * - POST /v1/admin/inputs
 * - PATCH /v1/admin/inputs/:id
 * - DELETE /v1/admin/inputs/:id
 */
import { adminDelete, adminGet, adminPatch, adminPost } from './http';

export interface ApprovedInputDto {
  id: string;
  name: string;
  category: string;
  brand?: string | null;
  activeIngredient?: string | null;
  dosageGuide?: string | null;
  safetyNotes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateApprovedInputBody {
  name: string;
  category: string;
  brand?: string;
  activeIngredient?: string;
  dosageGuide?: string;
  safetyNotes?: string;
}

export interface UpdateApprovedInputBody {
  name?: string;
  category?: string;
  brand?: string;
  activeIngredient?: string;
  dosageGuide?: string;
  safetyNotes?: string;
  isActive?: boolean;
}

export function listAdminInputs(signal?: AbortSignal) {
  return adminGet<{ items: ApprovedInputDto[] }>('/v1/admin/inputs', undefined, signal);
}

export function getAdminInput(inputId: string, signal?: AbortSignal) {
  return adminGet<ApprovedInputDto>(`/v1/admin/inputs/${inputId}`, undefined, signal);
}

export function createAdminInput(body: CreateApprovedInputBody) {
  return adminPost<ApprovedInputDto>('/v1/admin/inputs', body);
}

export function updateAdminInput(inputId: string, body: UpdateApprovedInputBody) {
  return adminPatch<ApprovedInputDto>(`/v1/admin/inputs/${inputId}`, body);
}

export function deleteAdminInput(inputId: string) {
  return adminDelete(`/v1/admin/inputs/${inputId}`);
}
