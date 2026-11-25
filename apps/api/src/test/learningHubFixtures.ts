/**
 * Committed fixtures for the Learning Hub real-SQL suites.
 *
 * WHY: those suites go through the shared pool (the service owns its own
 * transactions), so a rollback is impossible and every row is COMMITTED. Each
 * helper records the id it created in a `LearningFixtureIds` bag that the test
 * hands to `cleanupLearningFixtures` from a `finally`, so a failing assertion
 * halfway through fixture creation still removes what was created. Names and
 * categories carry a per-run random suffix, so a rerun or a parallel run never
 * matches another run's rows.
 */
import { randomUUID } from 'node:crypto';
import type { Executor } from '../db/pool.js';
import { randomMobile } from './dbFixtures.js';

/** A short random suffix for names, tags and categories that must be unique to one run. */
export function runSuffix(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

export interface LearningFixtureIds {
  articles: string[];
  videos: string[];
  trainings: string[];
  groups: string[];
  farmers: string[];
  users: string[];
}

export function emptyLearningFixtureIds(): LearningFixtureIds {
  return { articles: [], videos: [], trainings: [], groups: [], farmers: [], users: [] };
}

export async function insertLearningArticle(
  db: Executor,
  ids: LearningFixtureIds,
  row: { title: string; tag: string; isPublished: boolean; content?: string },
): Promise<string> {
  const res = await db.query<{ id: string }>(
    `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
     VALUES ($1, $2, 'snippet', '3 min', 'Admin', $3, 'en', $4) RETURNING id`,
    [row.title, row.content ?? 'content', row.tag, row.isPublished],
  );
  const id = res.rows[0]!.id;
  ids.articles.push(id);
  return id;
}

export async function insertLearningVideo(
  db: Executor,
  ids: LearningFixtureIds,
  row: { title: string; isPublished: boolean },
): Promise<string> {
  const res = await db.query<{ id: string }>(
    `INSERT INTO learning_videos (title, video_url, duration, author, language, is_published)
     VALUES ($1, 'https://youtu.be/fixture', '3:00', 'Admin', 'en', $2) RETURNING id`,
    [row.title, row.isPublished],
  );
  const id = res.rows[0]!.id;
  ids.videos.push(id);
  return id;
}

export async function insertLearningTraining(
  db: Executor,
  ids: LearningFixtureIds,
  row: { title: string; isPublished: boolean },
): Promise<string> {
  const res = await db.query<{ id: string }>(
    `INSERT INTO learning_trainings
       (title, training_date, start_time, mode, location, instructor, language, is_published)
     VALUES ($1, '2026-12-01', '10:00 AM', 'IN_FIELD', 'Field', 'Instructor', 'en', $2) RETURNING id`,
    [row.title, row.isPublished],
  );
  const id = res.rows[0]!.id;
  ids.trainings.push(id);
  return id;
}

export async function insertLearningGroup(
  db: Executor,
  ids: LearningFixtureIds,
  row: { name: string; category: string; id?: string },
): Promise<string> {
  const res = await db.query<{ id: string }>(
    `INSERT INTO learning_groups (id, name, category) VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3) RETURNING id`,
    [row.id ?? null, row.name, row.category],
  );
  const id = res.rows[0]!.id;
  ids.groups.push(id);
  return id;
}

/** A user + APPROVED farmer profile, both new. */
export async function insertLearningFarmer(
  db: Executor,
  ids: LearningFixtureIds,
  suffix: string,
): Promise<{ userId: string; farmerId: string }> {
  const user = await db.query<{ id: string }>(
    `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'LH Fixture Farmer', 'FARMER', 'ACTIVE') RETURNING id`,
    [randomMobile()],
  );
  const userId = user.rows[0]!.id;
  ids.users.push(userId);
  const farmer = await db.query<{ id: string }>(
    `INSERT INTO farmers (user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, 'APPROVED') RETURNING id`,
    [userId, `TF-LH-${suffix}-${ids.farmers.length}`],
  );
  const farmerId = farmer.rows[0]!.id;
  ids.farmers.push(farmerId);
  return { userId, farmerId };
}

/**
 * Deletes everything recorded in `ids`. Memberships and enrolments cascade from
 * their group / training / farmer. A user that an audit_log row names as actor
 * is kept: audit_log is append-only and its FK forbids deleting the user.
 */
export async function cleanupLearningFixtures(db: Executor, ids: LearningFixtureIds): Promise<void> {
  await db.query(`DELETE FROM learning_groups WHERE id = ANY($1::uuid[])`, [ids.groups]);
  await db.query(`DELETE FROM learning_articles WHERE id = ANY($1::uuid[])`, [ids.articles]);
  await db.query(`DELETE FROM learning_videos WHERE id = ANY($1::uuid[])`, [ids.videos]);
  await db.query(`DELETE FROM learning_trainings WHERE id = ANY($1::uuid[])`, [ids.trainings]);
  await db.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [ids.farmers]);
  await db.query(
    `DELETE FROM users u WHERE u.id = ANY($1::uuid[])
       AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.actor_id = u.id)`,
    [ids.users],
  );
}
