/**
 * The announcement publish write for the Community & Knowledge module. Thin
 * wrapper over ./hooks.ts; the request and its types live in ./announcements.ts.
 *
 * Nothing in the mobile app reads the announcement list through a query yet, so
 * a publish invalidates nothing of its own: the reader-facing system messages
 * (api/notifications.ts) refetch on their own schedule.
 */
import { useAdminMutation } from './hooks';
import { createAdminAnnouncement, type CreateAnnouncementBody } from './announcements';

export function useCreateAdminAnnouncement() {
  return useAdminMutation({
    mutationFn: (body: CreateAnnouncementBody) => createAdminAnnouncement(body),
  });
}
