/**
 * Pure decisions for the announcement path of the content form (BR-213). No
 * React, so the app's plain-Node vitest covers it (tests/community_wiring_logic.test.ts).
 *
 * The API's targets are SYSTEM_WIDE | WAREHOUSE | ZONE | ROLE, and only
 * SYSTEM_WIDE and WAREHOUSE can be authored: docs/rbac.json has no create
 * permission for ZONE or ROLE, so the server answers 422. The designed
 * "Send to" dropdown lists "All" and four role audiences; "All" is SYSTEM_WIDE,
 * and the four role audiences would be ROLE, so they stay in the list,
 * disabled. WAREHOUSE works on the server but the form has no warehouse option
 * to send it with (and adding one would be new design), so it is not offered.
 *
 * Two judgment calls, both flagged for the owner in the hand-off report:
 *   - the form's category is mapped onto the API's `type`: a weather alert is an
 *     ALERT and every other category is GENERAL. `type` is an unconfirmed value
 *     set on the server (BR-134), so nothing richer is guessed;
 *   - the form has a short summary and a full description but the API has one
 *     `body`, so the body is the summary, a blank line, then the description.
 */
import type { AnnouncementType, CreateAnnouncementBody } from '../../api/announcements';
import type { BuiltBody } from './communityLogic';

/** The permission behind a SYSTEM_WIDE announcement (docs/rbac.json). */
export const ANNOUNCE_SYSTEM_WIDE = 'announcement.system_wide.create';

/** Fails closed: no `can` means nothing is published. */
export function canPublishAnnouncement(can: ((code: string) => boolean) | undefined): boolean {
  return can === undefined ? false : can(ANNOUNCE_SYSTEM_WIDE);
}

export interface AnnouncementAudience {
  /** The designed dropdown label. */
  label: string;
  /** The target it sends, or null when it cannot be authored (ROLE). */
  target: 'SYSTEM_WIDE' | null;
}

export const ANNOUNCEMENT_AUDIENCES: readonly AnnouncementAudience[] = [
  { label: 'All', target: 'SYSTEM_WIDE' },
  { label: 'All Farmers', target: null },
  { label: 'Sub-Warehouse Managers', target: null },
  { label: 'Buyers & Retailers', target: null },
  { label: 'Field Officers', target: null },
];

/** The target a designed audience label sends; null for one that cannot be authored or is unknown. */
export function audienceTarget(label: string): 'SYSTEM_WIDE' | null {
  return ANNOUNCEMENT_AUDIENCES.find((a) => a.label === label)?.target ?? null;
}

/** The form category -> API type table. Change it here and nowhere else. */
const TYPE_BY_CATEGORY: Readonly<Record<string, AnnouncementType>> = {
  'Weather Alert': 'ALERT',
};

export function announcementTypeFor(category: string): AnnouncementType {
  return TYPE_BY_CATEGORY[category] ?? 'GENERAL';
}

export interface AnnouncementFormInput {
  title: string;
  summary: string;
  description: string;
  category: string;
  audience: string;
}

/** CreateAnnouncementRequest (BR-213), bounds as in the spec: title 1-200, body 1-5000. */
export function buildAnnouncementBody(input: AnnouncementFormInput): BuiltBody<CreateAnnouncementBody> {
  const title = input.title.trim();
  const summary = input.summary.trim();
  const description = input.description.trim();
  const target = audienceTarget(input.audience);
  if (title === '' || title.length > 200) return { ok: false, errorKey: 'community.validation.announcementTitle' };
  if (description === '') return { ok: false, errorKey: 'community.validation.announcementBody' };
  if (input.category === 'Select' || input.category.trim() === '') return { ok: false, errorKey: 'community.validation.category' };
  if (target === null) return { ok: false, errorKey: 'community.validation.announcementAudience' };
  const body = summary === '' ? description : `${summary}\n\n${description}`;
  if (body.length > 5000) return { ok: false, errorKey: 'community.validation.announcementBody' };
  return { ok: true, body: { target, type: announcementTypeFor(input.category), title, body } };
}
