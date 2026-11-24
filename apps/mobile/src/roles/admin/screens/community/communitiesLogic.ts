/**
 * Pure decisions for the Communities screens (BR-59s). No React, so the app's
 * plain-Node vitest covers it (tests/community_wiring_logic.test.ts).
 *
 * What a community actually has (api/communities.ts): a name, description,
 * category, rules, an archived flag, and two server-counted figures —
 * `groupCount` and `memberCount`, the latter DERIVED from group membership.
 * What the designed screens show beyond that has no field: discoverability,
 * membership method, language, posting permissions, knowledge-post and
 * announcement counts, a cover image. Those slots stay drawn and carry the dash
 * (the governing rule: a value the API cannot supply renders ADMIN_NO_VALUE and
 * the element stays), and the form controls for them are disabled rather than
 * accepting a choice that is never stored.
 */
import type { CommunityDto, CommunityMemberDto, CreateCommunityBody } from '../../api/communities';
import type { LearningGroupDto } from '../../api/learning';
import { t, type TranslationKey } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  archiveStatus,
  dayText,
  groupSwatch,
  joinMeta,
  orDash,
  statusLabel,
  subCountText,
  totalText,
  type BuiltBody,
  type CommunityStatus,
  type GroupSwatch,
} from './communityLogic';

/** The permission behind every /admin/communities route (docs/rbac.json); not the learning permission. */
export const COMMUNITY_MODERATE = 'community.group.moderate';

/** Fails closed: no `can` means nothing is fetched and the screens say so. */
export function canModerateCommunities(can: ((code: string) => boolean) | undefined): boolean {
  return can === undefined ? false : can(COMMUNITY_MODERATE);
}

const BAD = (errorKey: TranslationKey): { ok: false; errorKey: TranslationKey } => ({ ok: false, errorKey });

/** Why a designed dropdown still says "Select": it is empty, not a value. */
function chosen(value: string): string {
  return value === 'Select' ? '' : value.trim();
}

export interface CommunityFormInput {
  name: string;
  description: string;
  category: string;
  rules: string;
}

/**
 * CreateCommunityRequest / UpdateCommunityRequest (BR-59s), bounds as in the
 * spec so a form never sends what the server would answer 422 to. Name,
 * description and category are the designed required fields; rules are optional
 * and an empty rule is `null`, which on an update clears a stored one. An edit
 * sends the same four fields: they are all the form holds.
 */
export function buildCommunityBody(input: CommunityFormInput): BuiltBody<CreateCommunityBody> {
  const name = input.name.trim();
  const description = input.description.trim();
  const category = chosen(input.category);
  const rules = input.rules.trim();
  if (name === '' || name.length > 120) return BAD('community.validation.communityName');
  if (description === '' || description.length > 2000) return BAD('community.validation.communityDescription');
  if (category === '' || category.length > 100) return BAD('community.validation.communityCategory');
  if (rules.length > 4000) return BAD('community.validation.communityRules');
  return { ok: true, body: { name, description, category, rules: rules === '' ? null : rules } };
}

export interface CommunityRowView {
  id: string;
  name: string;
  status: CommunityStatus;
  statusText: string;
  swatch: GroupSwatch;
  /**
   * The designed "discoverability · membership · members" line. The first two
   * slots have no field, so they are the dash; the third is the server's own
   * derived `memberCount`.
   */
  subtitle: string;
}

export function communityRow(dto: CommunityDto, index: number): CommunityRowView {
  const status = archiveStatus(dto.isArchived);
  return {
    id: dto.id,
    name: orDash(dto.name),
    status,
    statusText: statusLabel(status),
    swatch: groupSwatch(index),
    subtitle: joinMeta([ADMIN_NO_VALUE, ADMIN_NO_VALUE, t('community.groups.members', { count: String(dto.memberCount) })]),
  };
}

/**
 * The "N communities (M active)" caption. `total` is the server's count over
 * the whole filtered set; `active` is derived from loaded rows, so it arrives
 * here already as countLoadedWhere's null-until-complete answer.
 */
export function communityCountText(total: number | undefined, active: number | null): string {
  return t('community.communities.count', { total: totalText(total), active: subCountText(active) });
}

export interface CommunityDetailRow {
  /** The designed row label, as the screen draws it. */
  label: string;
  value: string;
}

export interface CommunityDetailView {
  name: string;
  status: CommunityStatus;
  statusText: string;
  /** "discoverability · membership · members": two dashes and the derived member count. */
  bannerSubtitle: string;
  /** The six rows of the overview card, in the designed order. */
  summary: CommunityDetailRow[];
}

const SUMMARY_LABELS = ['Members', 'Groups', 'Knowledge posts', 'Open discussions', 'Announcements', 'Created'] as const;

/**
 * The detail screen's banner and overview card. Members and Groups are the
 * server's counts; Knowledge posts, Open discussions and Announcements have no
 * per-community figure anywhere in the spec (an article, a question and an
 * announcement carry no community link that can be counted as "open"), so they
 * stay dashed. "Created" is the date; the creating admin is an id with no name.
 */
export function communityDetailView(dto: CommunityDto | undefined): CommunityDetailView {
  const values =
    dto === undefined
      ? SUMMARY_LABELS.map(() => ADMIN_NO_VALUE)
      : [
          String(dto.memberCount),
          String(dto.groupCount),
          ADMIN_NO_VALUE,
          ADMIN_NO_VALUE,
          ADMIN_NO_VALUE,
          dayText(dto.createdAt),
        ];
  const summary = SUMMARY_LABELS.map((label, index) => ({ label, value: values[index] ?? ADMIN_NO_VALUE }));
  if (dto === undefined) {
    return { name: ADMIN_NO_VALUE, status: 'unknown', statusText: ADMIN_NO_VALUE, bannerSubtitle: joinMeta([ADMIN_NO_VALUE, ADMIN_NO_VALUE, ADMIN_NO_VALUE]), summary };
  }
  const status = archiveStatus(dto.isArchived);
  return {
    name: orDash(dto.name),
    status,
    statusText: statusLabel(status),
    bannerSubtitle: joinMeta([ADMIN_NO_VALUE, ADMIN_NO_VALUE, t('community.groups.members', { count: String(dto.memberCount) })]),
    summary,
  };
}

export interface MemberRowView {
  id: string;
  name: string;
  subtitle: string;
}

/** One derived member: a farmer who belongs to at least one of the community's groups. */
export function memberRow(dto: CommunityMemberDto): MemberRowView {
  return {
    id: dto.farmerId,
    name: orDash(dto.farmerName),
    subtitle: joinMeta([orDash(dto.phone), orDash(dto.village), t('community.members.groupCount', { count: String(dto.groupCount) })]),
  };
}

export interface CommunityGroupRowView {
  id: string;
  name: string;
  subtitle: string;
}

/** One group inside a community: its name, its category and the server's member count. */
export function communityGroupRow(dto: LearningGroupDto): CommunityGroupRowView {
  return {
    id: dto.id,
    name: orDash(dto.name),
    subtitle: joinMeta([orDash(dto.category), t('community.groups.members', { count: String(dto.memberCount) })]),
  };
}

export interface CommunityOption {
  id: string;
  name: string;
}

/**
 * What the group form's parent-community selector offers: the communities the
 * server returned, minus archived ones (an archived community "stops new
 * members", so nothing should be filed under it).
 */
export function communityOptions(items: readonly CommunityDto[]): CommunityOption[] {
  return items.filter((c) => !c.isArchived).map((c) => ({ id: c.id, name: c.name }));
}

/** The name of the chosen parent, or the dash when it is not among the loaded options. */
export function communityNameOf(id: string | null, options: readonly CommunityOption[]): string {
  if (id === null) return ADMIN_NO_VALUE;
  const found = options.find((o) => o.id === id);
  return found === undefined ? ADMIN_NO_VALUE : orDash(found.name);
}
