/**
 * The admin Communities resource (docs/openapi.yaml tag Communities, BR-59s):
 *
 *   GET   /admin/communities                    community.group.moderate
 *   POST  /admin/communities                    community.group.moderate
 *   GET   /admin/communities/{id}               community.group.moderate
 *   PATCH /admin/communities/{id}               community.group.moderate
 *   POST  /admin/communities/{id}/archive       community.group.moderate
 *   GET   /admin/communities/{id}/groups        community.group.moderate
 *   GET   /admin/communities/{id}/members       community.group.moderate
 *
 * A community is a container for learning groups. It has a name, description,
 * category and rules, and nothing else: no visibility, membership method,
 * language, posting permission or cover image. Its members are DERIVED — the
 * distinct farmers who belong to any of its groups — so there is no member
 * write at all, and `memberCount` / `groupCount` are the server's own counts.
 *
 * The only lifecycle transition is archive. There is no unarchive, no
 * deactivate and no block, so a screen offers none of them as live controls.
 *
 * Paging is `page`/`limit` with `{ items, total, page, limit }` (NumberedPage),
 * the same as the Learning Hub lists and unlike the cursor lists elsewhere, so
 * these use useNumberedList. Writes move no money and take no Idempotency-Key
 * (root CLAUDE.md 2.4).
 *
 * Wire types are duplicated from the spec here rather than shared with
 * roles/farmer, for the cross-role import reason in apps/mobile/CLAUDE.md.
 * No UI imports.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { NumberedPage } from '../../../shell/api/pagination';
import type { LearningGroupDto } from './learning';
import { adminGet, adminPatch, adminPost } from './http';

export { COMMUNITIES_MODULE, communityKeys, type CommunityListKeyFilters } from './queryKeys';

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/** docs/openapi.yaml Community. */
export interface CommunityDto {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  rules?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
  /** The server's count of groups in this community. */
  groupCount: number;
  /** The server's count of distinct farmers across those groups (derived, BR-59s). */
  memberCount: number;
  /** The creating admin's user id; no name is sent, so a screen shows the dash. */
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml CommunityMemberGroup: a group a member belongs to within this community. */
export interface CommunityMemberGroupDto {
  id: string;
  name: string;
}

/** docs/openapi.yaml CommunityMember: one distinct farmer across the community's groups. */
export interface CommunityMemberDto {
  farmerId: string;
  farmerName: string;
  phone: string;
  village?: string | null;
  joinedAt: string;
  groupCount: number;
  groups: CommunityMemberGroupDto[];
}

/** docs/openapi.yaml CommunitiesListResponse. */
export type CommunitiesPage = NumberedPage<CommunityDto>;
/** docs/openapi.yaml CommunityMembersListResponse. */
export type CommunityMembersPage = NumberedPage<CommunityMemberDto>;
/** docs/openapi.yaml LearningGroupsListResponse, scoped to one community. */
export type CommunityGroupsPage = NumberedPage<LearningGroupDto>;

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

/** docs/openapi.yaml CreateCommunityRequest. */
export interface CreateCommunityBody {
  /** 1-120 characters. */
  name: string;
  /** Up to 2000 characters. */
  description?: string | null;
  /** 1-100 characters. */
  category: string;
  /** Up to 4000 characters. */
  rules?: string | null;
}

/** docs/openapi.yaml UpdateCommunityRequest: every field optional, same bounds. */
export type UpdateCommunityBody = Partial<CreateCommunityBody>;

// ---------------------------------------------------------------------------
// List params
// ---------------------------------------------------------------------------

export interface CommunityPageParams {
  page?: number | undefined;
  limit?: number | undefined;
}

/** The `sort` query of GET /admin/communities. */
export type CommunitySort = 'name' | 'members' | 'groups' | 'createdAt';

/** Every documented query of GET /admin/communities. */
export interface ListCommunitiesParams extends CommunityPageParams {
  category?: string | undefined;
  /** Absent means both active and archived. */
  isArchived?: boolean | undefined;
  /** Case-insensitive name substring, 1-80 characters; longer is 422. */
  q?: string | undefined;
  sort?: CommunitySort | undefined;
}

/** Every documented query of GET /admin/communities/{id}/members. */
export interface ListCommunityMembersParams extends CommunityPageParams {
  /** 1-80 characters. */
  q?: string | undefined;
}

/** These endpoints document no problem codes of their own beyond the generic ones. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const COMMUNITIES = '/admin/communities';

function itemPath(id: string): string {
  return `${COMMUNITIES}/${encodeURIComponent(id)}`;
}

/** One page of communities, active and archived unless `isArchived` says otherwise. */
export function listCommunities(params: ListCommunitiesParams = {}, signal?: AbortSignal): Promise<CommunitiesPage> {
  return adminGet<CommunitiesPage>(
    COMMUNITIES,
    {
      page: params.page,
      limit: params.limit,
      category: params.category,
      isArchived: params.isArchived,
      q: params.q,
      sort: params.sort,
    },
    signal,
  );
}

/** Create a community (201, the full community). */
export function createCommunity(body: CreateCommunityBody, signal?: AbortSignal): Promise<CommunityDto> {
  return adminPost<CommunityDto>(COMMUNITIES, body, { signal });
}

/** One community with its member and group counts; 404 on an unknown id. */
export function getCommunity(id: string, signal?: AbortSignal): Promise<CommunityDto> {
  return adminGet<CommunityDto>(itemPath(id), undefined, signal);
}

/** Edit a community's name, description, category or rules. */
export function updateCommunity(id: string, body: UpdateCommunityBody, signal?: AbortSignal): Promise<CommunityDto> {
  return adminPatch<CommunityDto>(itemPath(id), body, { signal });
}

/** Archive a community: the only lifecycle change there is (no unarchive, deactivate or block). */
export function archiveCommunity(id: string, signal?: AbortSignal): Promise<CommunityDto> {
  return adminPost<CommunityDto>(`${itemPath(id)}/archive`, {}, { signal });
}

/** One page of the learning groups that belong to this community. */
export function listCommunityGroups(id: string, params: CommunityPageParams = {}, signal?: AbortSignal): Promise<CommunityGroupsPage> {
  return adminGet<CommunityGroupsPage>(`${itemPath(id)}/groups`, { page: params.page, limit: params.limit }, signal);
}

/** One page of the distinct farmers who belong to any group in this community. */
export function listCommunityMembers(id: string, params: ListCommunityMembersParams = {}, signal?: AbortSignal): Promise<CommunityMembersPage> {
  return adminGet<CommunityMembersPage>(`${itemPath(id)}/members`, { page: params.page, limit: params.limit, q: params.q }, signal);
}
