/** SQL only. Customer side of the shared `support_tickets` / `support_messages` tables (0008). */
import type { Executor } from '../../db/pool.js';
import type { ListTicketsQuery } from './customer-support.schema.js';

export interface TicketDbRow {
  id: string;
  ticket_number: string;
  order_id: string | null;
  category: string;
  subject: string;
  description: string | null;
  photo_keys: string[] | null;
  /** Raw DB status: INVESTIGATING where the API says IN_PROGRESS. */
  status: string;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  message_count: number;
}

export interface MessageDbRow {
  id: string;
  ticket_id: string;
  from_customer: boolean;
  body: string;
  attachment_key: string | null;
  created_at: Date;
}

export interface UploadInfo {
  id: string;
  storageKey: string;
  uploadedBy: string | null;
}

export interface CustomerSupportRepo {
  createTicket(
    db: Executor,
    customerId: string,
    input: { category: string; subject: string; description: string; orderId: string | null; photoKeys: string[] },
  ): Promise<TicketDbRow>;
  listTickets(
    db: Executor,
    customerId: string,
    query: ListTicketsQuery,
  ): Promise<{ rows: TicketDbRow[]; total: number }>;
  /** Own ticket only: a cross-customer id finds nothing (404, never 403). */
  findTicket(db: Executor, customerId: string, ticketId: string, forUpdate?: boolean): Promise<TicketDbRow | null>;
  /** Customer-visible messages only: `is_internal` notes are excluded in SQL. */
  listMessages(db: Executor, ticketIds: string[]): Promise<MessageDbRow[]>;
  insertMessage(
    db: Executor,
    input: { ticketId: string; senderUserId: string; body: string; attachmentKey: string | null },
  ): Promise<MessageDbRow>;
  touchTicket(db: Executor, ticketId: string): Promise<void>;
  orderBelongsToCustomer(db: Executor, customerId: string, orderId: string): Promise<boolean>;
  findUploads(db: Executor, ids: string[]): Promise<UploadInfo[]>;
}

const COLUMNS = `st.id, st.ticket_number, st.order_id, st.category, st.subject, st.description, st.photo_keys,
  st.status, st.resolved_at, st.created_at, COALESCE(st.updated_at, st.created_at) AS updated_at,
  (SELECT count(*)::int FROM support_messages m WHERE m.ticket_id = st.id AND NOT m.is_internal) AS message_count`;

export const customerSupportRepo: CustomerSupportRepo = {
  async createTicket(db, customerId, input) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO support_tickets (ticket_number, customer_id, order_id, category, subject, description, photo_keys)
       VALUES (app_next_customer_ticket_number(), $1, $2, $3, $4, $5, $6::text[])
       RETURNING id`,
      [customerId, input.orderId, input.category, input.subject, input.description, input.photoKeys],
    );
    const id = res.rows[0]!.id;
    const row = await customerSupportRepo.findTicket(db, customerId, id);
    return row!;
  },

  async listTickets(db, customerId, { page, limit, status }) {
    const dbStatus = status === undefined ? null : status === 'IN_PROGRESS' ? 'INVESTIGATING' : status;
    const count = await db.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM support_tickets st
        WHERE st.customer_id = $1 AND ($2::text IS NULL OR st.status = $2)`,
      [customerId, dbStatus],
    );
    const res = await db.query<TicketDbRow>(
      `SELECT ${COLUMNS}
         FROM support_tickets st
        WHERE st.customer_id = $1 AND ($2::text IS NULL OR st.status = $2)
        ORDER BY st.created_at DESC, st.id DESC
        LIMIT $3 OFFSET $4`,
      [customerId, dbStatus, limit, (page - 1) * limit],
    );
    return { rows: res.rows, total: count.rows[0]?.total ?? 0 };
  },

  async findTicket(db, customerId, ticketId, forUpdate = false) {
    // The lock is taken on the bare row first; the correlated count stays out of the locking SELECT.
    if (forUpdate) {
      const locked = await db.query<{ id: string }>(
        `SELECT id FROM support_tickets WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
        [ticketId, customerId],
      );
      if (locked.rows[0] === undefined) return null;
    }
    const res = await db.query<TicketDbRow>(
      `SELECT ${COLUMNS} FROM support_tickets st WHERE st.id = $1 AND st.customer_id = $2 LIMIT 1`,
      [ticketId, customerId],
    );
    return res.rows[0] ?? null;
  },

  async listMessages(db, ticketIds) {
    if (ticketIds.length === 0) return [];
    const res = await db.query<MessageDbRow>(
      `SELECT m.id, m.ticket_id, (m.sender_user_id = cu.user_id) AS from_customer,
              m.body, m.attachment_key, m.created_at
         FROM support_messages m
         JOIN support_tickets st ON st.id = m.ticket_id
         JOIN customers cu ON cu.id = st.customer_id
        WHERE m.ticket_id = ANY($1::uuid[]) AND NOT m.is_internal
        ORDER BY m.created_at, m.id`,
      [ticketIds],
    );
    return res.rows;
  },

  async insertMessage(db, input) {
    const res = await db.query<{ id: string; created_at: Date }>(
      `INSERT INTO support_messages (ticket_id, sender_user_id, body, attachment_key, is_internal)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, created_at`,
      [input.ticketId, input.senderUserId, input.body, input.attachmentKey],
    );
    const row = res.rows[0]!;
    return {
      id: row.id,
      ticket_id: input.ticketId,
      from_customer: true,
      body: input.body,
      attachment_key: input.attachmentKey,
      created_at: row.created_at,
    };
  },

  async touchTicket(db, ticketId) {
    await db.query(`UPDATE support_tickets SET updated_at = now() WHERE id = $1`, [ticketId]);
  },

  async orderBelongsToCustomer(db, customerId, orderId) {
    const res = await db.query(`SELECT 1 FROM orders WHERE id = $1 AND customer_id = $2`, [orderId, customerId]);
    return res.rows.length > 0;
  },

  async findUploads(db, ids) {
    if (ids.length === 0) return [];
    const res = await db.query<{ id: string; storage_key: string; uploaded_by: string | null }>(
      `SELECT id, storage_key, uploaded_by FROM uploads WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [ids],
    );
    return res.rows.map((r) => ({ id: r.id, storageKey: r.storage_key, uploadedBy: r.uploaded_by }));
  },
};
