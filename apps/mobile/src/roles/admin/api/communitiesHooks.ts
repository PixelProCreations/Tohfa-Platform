/**
 * Live data for the Communities screens. Thin wrappers over ./hooks.ts;
 * requests and types live in ./communities.ts, keys in ./queryKeys.ts. No
 * decisions here: hooks cannot be rendered in this app's plain-Node vitest, so
 * anything with a branch belongs in ./hookHelpers.ts or screens/community/
 * communityLogic.ts (both tested).
 *
 * Every hook takes `{ enabled }` so a screen can skip a request its `can()`
 * denies. The server still decides (root CLAUDE.md 2.1): every route here needs
 * `community.group.moderate`, which is not the learning permission.
 *
 * The lists page by number, so they return NumberedList (items, total,
 * allPagesLoaded). `total` is the server's count over the whole filtered set;
 * a count derived from `items` goes through hookHelpers.countLoadedWhere.
 *
 * A group write changes a community's `groupCount`/`memberCount`, and a
 * community write changes what the group form can pick, so the community
 * module is invalidated by the learning writes too (learningHooks.ts) and the
 * learning module by the writes here.
 */
import { adminKeys } from './queryKeys';
import { useAdminMutation, useAdminQuery, useNumberedList, type AdminQueryOptions, type NumberedList } from './hooks';
import {
  COMMUNITIES_MODULE,
  archiveCommunity,
  communityKeys,
  createCommunity,
  getCommunity,
  listCommunities,
  listCommunityGroups,
  listCommunityMembers,
  updateCommunity,
  type CommunityDto,
  type CommunityMemberDto,
  type CreateCommunityBody,
  type ListCommunitiesParams,
  type UpdateCommunityBody,
} from './communities';
import { LEARNING_MODULE, type LearningGroupDto } from './learning';

/** The rows reach the screens as the server sent them; there is nothing to derive yet. */
function identity<T>(dto: T): T {
  return dto;
}

// ── Lists ───────────────────────────────────────────────────────────────────

export function useCommunities(params: ListCommunitiesParams = {}, options: AdminQueryOptions = {}): NumberedList<CommunityDto> {
  return useNumberedList(
    communityKeys.list(params),
    (page, signal) => listCommunities({ ...params, page }, signal),
    identity<CommunityDto>,
    options,
  );
}

/** The learning groups of one community; disabled until a community id is known. */
export function useCommunityGroups(id: string | undefined, options: AdminQueryOptions = {}): NumberedList<LearningGroupDto> {
  return useNumberedList(
    communityKeys.groups(id),
    (page, signal) => listCommunityGroups(id ?? '', { page }, signal),
    identity<LearningGroupDto>,
    { enabled: (options.enabled ?? true) && id !== undefined },
  );
}

/** The distinct farmers across one community's groups (derived, BR-59s). */
export function useCommunityMembers(id: string | undefined, options: AdminQueryOptions = {}): NumberedList<CommunityMemberDto> {
  return useNumberedList(
    communityKeys.members(id),
    (page, signal) => listCommunityMembers(id ?? '', { page }, signal),
    identity<CommunityMemberDto>,
    { enabled: (options.enabled ?? true) && id !== undefined },
  );
}

// ── Detail ──────────────────────────────────────────────────────────────────

export function useCommunity(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(communityKeys.detail(id), (signal) => getCommunity(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

// ── Writes ──────────────────────────────────────────────────────────────────

/**
 * One module prefix per side: a community write refetches every community query
 * and the learning module (a group row carries `communityId`).
 */
const COMMUNITY_INVALIDATES = [adminKeys.module(COMMUNITIES_MODULE), adminKeys.module(LEARNING_MODULE)] as const;

export function useCreateCommunity() {
  return useAdminMutation({
    mutationFn: (body: CreateCommunityBody) => createCommunity(body),
    invalidates: COMMUNITY_INVALIDATES,
  });
}

export function useUpdateCommunity() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: UpdateCommunityBody }) => updateCommunity(vars.id, vars.body),
    invalidates: COMMUNITY_INVALIDATES,
  });
}

export function useArchiveCommunity() {
  return useAdminMutation({
    mutationFn: (id: string) => archiveCommunity(id),
    invalidates: COMMUNITY_INVALIDATES,
  });
}
