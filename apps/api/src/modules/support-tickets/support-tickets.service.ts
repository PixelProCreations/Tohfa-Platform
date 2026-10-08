import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  supportTicketsRepo,
  type CategoryRow,
  type MessageRow,
  type StatusHistoryRow,
  type SupportTicketsRepo,
  type TicketRow,
} from './support-tickets.repo.js';
import type {
  AssignTicketBody,
  CreateSupportTicketBody,
  ListAdminTicketsQuery,
  ListMyTicketsQuery,
  SendTicketMessageBody,
  SupportTicketCategoryResponse,
  SupportTicketMessageResponse,
  SupportTicketStatusHistoryResponse,
  SupportTicketSummaryResponse,
  TicketStatus,
  TransitionTicketStatusBody,
} from './support-tickets.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface SupportTicketsServiceDeps {
  repo: SupportTicketsRepo;
  db: Executor;
  runTx: TransactionRunner;
}

function mapCategory(row: CategoryRow): SupportTicketCategoryResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
  };
}

function mapTicket(row: TicketRow): SupportTicketSummaryResponse {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    farmerId: row.farmer_id,
    categoryCode: row.category_code,
    subject: row.subject,
    description: row.description,
    attachmentUrl: row.attachment_url,
    status: row.status,
    priority: row.priority,
    assignedToUserId: row.assigned_to_user_id,
    messageCount: Number(row.message_count ?? 0),
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): SupportTicketMessageResponse {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderUserId: row.sender_user_id,
    senderRole: row.sender_role,
    message: row.message,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
  };
}

function mapStatusHistory(row: StatusHistoryRow): SupportTicketStatusHistoryResponse {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedByUserId: row.changed_by_user_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

const LEGAL_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

export class SupportTicketsService {
  constructor(private readonly deps: SupportTicketsServiceDeps) {}

  // ── Categories ─────────────────────────────────────────────────────────────
  async listCategories() {
    const rows = await this.deps.repo.findActiveCategories(this.deps.db);
    return { items: rows.map(mapCategory) };
  }

  // ── Farmer Methods ─────────────────────────────────────────────────────────
  async listMyTickets(scope: ResolvedScope, query: ListMyTicketsQuery) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can view their own support tickets' });
    }

    const { rows, total } = await this.deps.repo.findTicketsByFarmer(this.deps.db, farmerId, query);
    return {
      items: rows.map(mapTicket),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async createTicket(scope: ResolvedScope, body: CreateSupportTicketBody) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can create support tickets' });
    }

    const category = await this.deps.repo.findCategoryByCode(this.deps.db, body.categoryCode);
    if (!category || !category.is_active) {
      throw new AppError('VALIDATION_FAILED', {
        detail: `Category "${body.categoryCode}" is invalid or inactive`,
      });
    }

    return this.deps.runTx(async (tx) => {
      const created = await this.deps.repo.createTicket(tx, farmerId, body);
      await this.deps.repo.addStatusHistory(tx, {
        ticketId: created.id,
        fromStatus: 'OPEN',
        toStatus: 'OPEN',
        changedByUserId: scope.userId,
        reason: 'Ticket created',
      });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'support_ticket.create',
        entityType: 'support_ticket',
        entityId: created.id,
        after: created,
      });

      return {
        ticket: mapTicket(created),
        messages: [],
      };
    });
  }

  async getMyTicket(scope: ResolvedScope, id: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can view their own support tickets' });
    }

    const ticket = await this.deps.repo.findTicketByIdAndFarmer(this.deps.db, id, farmerId);
    if (!ticket) {
      throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
    }

    const messages = await this.deps.repo.findMessagesByTicket(this.deps.db, id);
    return {
      ticket: mapTicket(ticket),
      messages: messages.map(mapMessage),
    };
  }

  async addMyTicketMessage(scope: ResolvedScope, ticketId: string, body: SendTicketMessageBody) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can reply to their own support tickets' });
    }

    return this.deps.runTx(async (tx) => {
      const lockRes = await tx.query<TicketRow>(
        `SELECT id, status, farmer_id FROM support_tickets WHERE id = $1 AND farmer_id = $2 FOR UPDATE`,
        [ticketId, farmerId],
      );
      const ticket = lockRes.rows[0];
      if (!ticket) {
        throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
      }

      if (ticket.status === 'CLOSED') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: 'Cannot send messages to a closed support ticket',
        });
      }

      const msg = await this.deps.repo.addMessage(tx, {
        ticketId,
        senderUserId: scope.userId,
        senderRole: 'FARMER',
        message: body.message,
        attachmentUrl: body.attachmentUrl,
      });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'support_ticket.message_add',
        entityType: 'support_ticket_message',
        entityId: msg.id,
        after: msg,
      });

      return mapMessage(msg);
    });
  }

  async closeMyTicket(scope: ResolvedScope, id: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can close their own support tickets' });
    }

    return this.deps.runTx(async (tx) => {
      const lockRes = await tx.query<TicketRow>(
        `SELECT * FROM support_tickets WHERE id = $1 AND farmer_id = $2 FOR UPDATE`,
        [id, farmerId],
      );
      const ticket = lockRes.rows[0];
      if (!ticket) {
        throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
      }

      if (ticket.status === 'CLOSED') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: 'Support ticket is already closed',
        });
      }

      const closedAt = new Date().toISOString();
      const updated = await this.deps.repo.updateTicketStatus(
        tx,
        id,
        'CLOSED',
        ticket.resolved_at,
        closedAt,
      );

      await this.deps.repo.addStatusHistory(tx, {
        ticketId: id,
        fromStatus: ticket.status,
        toStatus: 'CLOSED',
        changedByUserId: scope.userId,
        reason: 'Closed by farmer',
      });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'support_ticket.close',
        entityType: 'support_ticket',
        entityId: id,
        before: ticket,
        after: updated,
        changedFields: changedFields(ticket as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      const messages = await this.deps.repo.findMessagesByTicket(tx, id);
      return {
        ticket: mapTicket(updated!),
        messages: messages.map(mapMessage),
      };
    });
  }

  // ── Admin Methods ──────────────────────────────────────────────────────────
  async listAllTickets(_scope: ResolvedScope, query: ListAdminTicketsQuery) {
    const { rows, total } = await this.deps.repo.findAllTickets(this.deps.db, query);
    return {
      items: rows.map(mapTicket),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getAdminTicket(_scope: ResolvedScope, id: string) {
    const ticket = await this.deps.repo.findTicketById(this.deps.db, id);
    if (!ticket) {
      throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
    }

    const messages = await this.deps.repo.findMessagesByTicket(this.deps.db, id);
    const statusHistory = await this.deps.repo.findStatusHistoryByTicket(this.deps.db, id);

    return {
      ticket: mapTicket(ticket),
      messages: messages.map(mapMessage),
      statusHistory: statusHistory.map(mapStatusHistory),
    };
  }

  async addAdminMessage(scope: ResolvedScope, ticketId: string, body: SendTicketMessageBody) {
    return this.deps.runTx(async (tx) => {
      const lockRes = await tx.query<TicketRow>(
        `SELECT id, status FROM support_tickets WHERE id = $1 FOR UPDATE`,
        [ticketId],
      );
      const ticket = lockRes.rows[0];
      if (!ticket) {
        throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
      }

      if (ticket.status === 'CLOSED') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: 'Cannot send messages to a closed support ticket',
        });
      }

      const msg = await this.deps.repo.addMessage(tx, {
        ticketId,
        senderUserId: scope.userId,
        senderRole: scope.roleCode ?? 'TOHFA_ADMIN',
        message: body.message,
        attachmentUrl: body.attachmentUrl,
      });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'support_ticket.message_add',
        entityType: 'support_ticket_message',
        entityId: msg.id,
        after: msg,
      });

      return mapMessage(msg);
    });
  }

  async transitionStatus(scope: ResolvedScope, id: string, body: TransitionTicketStatusBody) {
    return this.deps.runTx(async (tx) => {
      const lockRes = await tx.query<TicketRow>(
        `SELECT * FROM support_tickets WHERE id = $1 FOR UPDATE`,
        [id],
      );
      const ticket = lockRes.rows[0];
      if (!ticket) {
        throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
      }

      if (ticket.status === body.status) {
        const messages = await this.deps.repo.findMessagesByTicket(tx, id);
        const statusHistory = await this.deps.repo.findStatusHistoryByTicket(tx, id);
        return {
          ticket: mapTicket(ticket),
          messages: messages.map(mapMessage),
          statusHistory: statusHistory.map(mapStatusHistory),
        };
      }

      const allowed = LEGAL_TRANSITIONS[ticket.status] ?? [];
      if (!allowed.includes(body.status)) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: `Cannot transition support ticket from "${ticket.status}" to "${body.status}"`,
        });
      }

      const resolvedAt = body.status === 'RESOLVED' ? new Date().toISOString() : ticket.resolved_at;
      const closedAt = body.status === 'CLOSED' ? new Date().toISOString() : ticket.closed_at;

      const updated = await this.deps.repo.updateTicketStatus(
        tx,
        id,
        body.status,
        resolvedAt,
        closedAt,
      );

      await this.deps.repo.addStatusHistory(tx, {
        ticketId: id,
        fromStatus: ticket.status,
        toStatus: body.status,
        changedByUserId: scope.userId,
        reason: body.reason ?? null,
      });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'support_ticket.status_change',
        entityType: 'support_ticket',
        entityId: id,
        before: ticket,
        after: updated,
        changedFields: changedFields(ticket as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      const messages = await this.deps.repo.findMessagesByTicket(tx, id);
      const statusHistory = await this.deps.repo.findStatusHistoryByTicket(tx, id);

      return {
        ticket: mapTicket(updated!),
        messages: messages.map(mapMessage),
        statusHistory: statusHistory.map(mapStatusHistory),
      };
    });
  }

  async assignTicket(scope: ResolvedScope, id: string, body: AssignTicketBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findTicketById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
      }

      const updated = await this.deps.repo.updateTicketAssignment(tx, id, body.assignedToUserId);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
      }

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'support_ticket.assign',
        entityType: 'support_ticket',
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      const messages = await this.deps.repo.findMessagesByTicket(tx, id);
      const statusHistory = await this.deps.repo.findStatusHistoryByTicket(tx, id);

      return {
        ticket: mapTicket(updated),
        messages: messages.map(mapMessage),
        statusHistory: statusHistory.map(mapStatusHistory),
      };
    });
  }
}

export function createSupportTicketsService(deps: SupportTicketsServiceDeps): SupportTicketsService {
  return new SupportTicketsService(deps);
}

export const supportTicketsService = new SupportTicketsService({
  repo: supportTicketsRepo,
  db: pool,
  runTx: withTransaction,
});
