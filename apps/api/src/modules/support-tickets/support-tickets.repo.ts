import type { Executor } from '../../db/pool.js';
import type {
  CreateSupportTicketBody,
  ListAdminTicketsQuery,
  ListMyTicketsQuery,
  TicketPriority,
  TicketStatus,
} from './support-tickets.schema.js';

export interface CategoryRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TicketRow {
  id: string;
  ticket_number: string;
  farmer_id: string;
  category_code: string;
  subject: string;
  description: string;
  attachment_url: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_user_id: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  message_count?: string | number;
}

export interface MessageRow {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  sender_role: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

export interface StatusHistoryRow {
  id: string;
  ticket_id: string;
  from_status: TicketStatus;
  to_status: TicketStatus;
  changed_by_user_id: string;
  reason: string | null;
  created_at: string;
}

export interface SupportTicketsRepo {
  // Categories
  findActiveCategories(db: Executor): Promise<CategoryRow[]>;
  findCategoryByCode(db: Executor, code: string): Promise<CategoryRow | null>;

  // Tickets
  findTicketsByFarmer(
    db: Executor,
    farmerId: string,
    params: ListMyTicketsQuery,
  ): Promise<{ rows: TicketRow[]; total: number }>;
  findTicketByIdAndFarmer(db: Executor, id: string, farmerId: string): Promise<TicketRow | null>;
  findTicketById(db: Executor, id: string): Promise<TicketRow | null>;
  findAllTickets(
    db: Executor,
    params: ListAdminTicketsQuery,
  ): Promise<{ rows: TicketRow[]; total: number }>;
  createTicket(db: Executor, farmerId: string, body: CreateSupportTicketBody): Promise<TicketRow>;
  updateTicketStatus(
    db: Executor,
    id: string,
    status: TicketStatus,
    resolvedAt?: string | null | undefined,
    closedAt?: string | null | undefined,
  ): Promise<TicketRow | null>;
  updateTicketAssignment(
    db: Executor,
    id: string,
    assignedToUserId: string | null | undefined,
  ): Promise<TicketRow | null>;

  // Messages
  findMessagesByTicket(db: Executor, ticketId: string): Promise<MessageRow[]>;
  addMessage(
    db: Executor,
    params: {
      ticketId: string;
      senderUserId: string;
      senderRole: string;
      message: string;
      attachmentUrl?: string | null | undefined;
    },
  ): Promise<MessageRow>;

  // Status History
  findStatusHistoryByTicket(db: Executor, ticketId: string): Promise<StatusHistoryRow[]>;
  addStatusHistory(
    db: Executor,
    params: {
      ticketId: string;
      fromStatus: TicketStatus;
      toStatus: TicketStatus;
      changedByUserId: string;
      reason?: string | null | undefined;
    },
  ): Promise<StatusHistoryRow>;
}

export const supportTicketsRepo: SupportTicketsRepo = {
  // ── Categories ─────────────────────────────────────────────────────────────
  async findActiveCategories(db) {
    const res = await db.query<CategoryRow>(
      `SELECT id, code, name, description, is_active, created_at
       FROM support_ticket_categories
       WHERE is_active = true
       ORDER BY name ASC`,
    );
    return res.rows;
  },

  async findCategoryByCode(db, code) {
    const res = await db.query<CategoryRow>(
      `SELECT id, code, name, description, is_active, created_at
       FROM support_ticket_categories
       WHERE code = $1`,
      [code],
    );
    return res.rows[0] ?? null;
  },

  // ── Tickets ────────────────────────────────────────────────────────────────
  async findTicketsByFarmer(db, farmerId, { page, limit, status }) {
    const conditions: string[] = ['t.farmer_id = $1'];
    const params: unknown[] = [farmerId];
    let idx = 2;

    if (status) {
      conditions.push(`t.status = $${idx++}`);
      params.push(status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await db.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM support_tickets t ${where}`,
      params,
    );
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT t.id, t.ticket_number, t.farmer_id, t.category_code, t.subject,
             t.description, t.attachment_url, t.status, t.priority,
             t.assigned_to_user_id, t.resolved_at, t.closed_at,
             t.created_at, t.updated_at,
             (SELECT count(*)::int FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS message_count
      FROM support_tickets t
      ${where}
      ORDER BY t.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<TicketRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async findTicketByIdAndFarmer(db, id, farmerId) {
    const res = await db.query<TicketRow>(
      `SELECT t.id, t.ticket_number, t.farmer_id, t.category_code, t.subject,
              t.description, t.attachment_url, t.status, t.priority,
              t.assigned_to_user_id, t.resolved_at, t.closed_at,
              t.created_at, t.updated_at,
              (SELECT count(*)::int FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS message_count
       FROM support_tickets t
       WHERE t.id = $1 AND t.farmer_id = $2`,
      [id, farmerId],
    );
    return res.rows[0] ?? null;
  },

  async findTicketById(db, id) {
    const res = await db.query<TicketRow>(
      `SELECT t.id, t.ticket_number, t.farmer_id, t.category_code, t.subject,
              t.description, t.attachment_url, t.status, t.priority,
              t.assigned_to_user_id, t.resolved_at, t.closed_at,
              t.created_at, t.updated_at,
              (SELECT count(*)::int FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS message_count
       FROM support_tickets t
       WHERE t.id = $1`,
      [id],
    );
    return res.rows[0] ?? null;
  },

  async findAllTickets(db, { page, limit, status, categoryCode, priority, assignedToUserId }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`t.status = $${idx++}`);
      params.push(status);
    }
    if (categoryCode) {
      conditions.push(`t.category_code = $${idx++}`);
      params.push(categoryCode);
    }
    if (priority) {
      conditions.push(`t.priority = $${idx++}`);
      params.push(priority);
    }
    if (assignedToUserId) {
      conditions.push(`t.assigned_to_user_id = $${idx++}`);
      params.push(assignedToUserId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await db.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM support_tickets t ${where}`,
      params,
    );
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT t.id, t.ticket_number, t.farmer_id, t.category_code, t.subject,
             t.description, t.attachment_url, t.status, t.priority,
             t.assigned_to_user_id, t.resolved_at, t.closed_at,
             t.created_at, t.updated_at,
             (SELECT count(*)::int FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS message_count
      FROM support_tickets t
      ${where}
      ORDER BY
        CASE t.priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'NORMAL' THEN 3
          WHEN 'LOW' THEN 4
        END ASC,
        t.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<TicketRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async createTicket(db, farmerId, body) {
    const res = await db.query<TicketRow>(
      `INSERT INTO support_tickets
       (farmer_id, category_code, subject, description, attachment_url, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, ticket_number, farmer_id, category_code, subject, description,
                 attachment_url, status, priority, assigned_to_user_id,
                 resolved_at, closed_at, created_at, updated_at`,
      [
        farmerId,
        body.categoryCode,
        body.subject,
        body.description,
        body.attachmentUrl ?? null,
        body.priority ?? 'NORMAL',
      ],
    );
    const row = res.rows[0]!;
    row.message_count = 0;
    return row;
  },

  async updateTicketStatus(db, id, status, resolvedAt, closedAt) {
    const res = await db.query<TicketRow>(
      `UPDATE support_tickets
       SET status = $2,
           resolved_at = $3,
           closed_at = $4,
           updated_at = now()
       WHERE id = $1
       RETURNING id, ticket_number, farmer_id, category_code, subject, description,
                 attachment_url, status, priority, assigned_to_user_id,
                 resolved_at, closed_at, created_at, updated_at,
                 (SELECT count(*)::int FROM support_ticket_messages m WHERE m.ticket_id = $1) AS message_count`,
      [id, status, resolvedAt ?? null, closedAt ?? null],
    );
    return res.rows[0] ?? null;
  },

  async updateTicketAssignment(db, id, assignedToUserId) {
    const res = await db.query<TicketRow>(
      `UPDATE support_tickets
       SET assigned_to_user_id = $2,
           updated_at = now()
       WHERE id = $1
       RETURNING id, ticket_number, farmer_id, category_code, subject, description,
                 attachment_url, status, priority, assigned_to_user_id,
                 resolved_at, closed_at, created_at, updated_at,
                 (SELECT count(*)::int FROM support_ticket_messages m WHERE m.ticket_id = $1) AS message_count`,
      [id, assignedToUserId ?? null],
    );
    return res.rows[0] ?? null;
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  async findMessagesByTicket(db, ticketId) {
    const res = await db.query<MessageRow>(
      `SELECT id, ticket_id, sender_user_id, sender_role, message, attachment_url, created_at
       FROM support_ticket_messages
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [ticketId],
    );
    return res.rows;
  },

  async addMessage(db, params) {
    const res = await db.query<MessageRow>(
      `INSERT INTO support_ticket_messages
       (ticket_id, sender_user_id, sender_role, message, attachment_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, ticket_id, sender_user_id, sender_role, message, attachment_url, created_at`,
      [
        params.ticketId,
        params.senderUserId,
        params.senderRole,
        params.message,
        params.attachmentUrl ?? null,
      ],
    );
    return res.rows[0]!;
  },

  // ── Status History ─────────────────────────────────────────────────────────
  async findStatusHistoryByTicket(db, ticketId) {
    const res = await db.query<StatusHistoryRow>(
      `SELECT id, ticket_id, from_status, to_status, changed_by_user_id, reason, created_at
       FROM support_ticket_status_history
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [ticketId],
    );
    return res.rows;
  },

  async addStatusHistory(db, params) {
    const res = await db.query<StatusHistoryRow>(
      `INSERT INTO support_ticket_status_history
       (ticket_id, from_status, to_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, ticket_id, from_status, to_status, changed_by_user_id, reason, created_at`,
      [
        params.ticketId,
        params.fromStatus,
        params.toStatus,
        params.changedByUserId,
        params.reason ?? null,
      ],
    );
    return res.rows[0]!;
  },
};
