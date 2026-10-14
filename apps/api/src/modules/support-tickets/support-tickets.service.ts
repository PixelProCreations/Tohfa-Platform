import { RoleCode } from '@tohfa/shared-types';
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
  FarmerSupportTicketMessageResponse,
  FarmerSupportTicketSummaryResponse,
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

/** The admin permission an assignee must hold (docs/rbac.json). */
const ADMIN_TICKET_PERMISSION = 'support.ticket.manage_any';

function mapCategory(row: CategoryRow): SupportTicketCategoryResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
  };
}

// ── Admin mappers: full fields ───────────────────────────────────────────────
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

// ── Farmer mappers: no staff identity ────────────────────────────────────────
function mapFarmerTicket(row: TicketRow): FarmerSupportTicketSummaryResponse {
  const { assignedToUserId: _assignedToUserId, ...rest } = mapTicket(row);
  return rest;
}

function mapFarmerMessage(row: MessageRow): FarmerSupportTicketMessageResponse {
  const { senderUserId: _senderUserId, senderRole, ...rest } = mapMessage(row);
  return { ...rest, senderRole: senderRole === RoleCode.FARMER ? 'FARMER' : 'SUPPORT' };
}

// ── Audit images ─────────────────────────────────────────────────────────────
// Ids, statuses and lengths only. The audit log is read by staff who may not be entitled to a farmer's
// free text, and it is append-only, so text written here could never be removed again.
type TicketAuditImage = {
  id: string;
  ticketNumber: string;
  categoryCode: string;
  status: TicketStatus;
  priority: string;
  assignedToUserId: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  subjectLength: number;
  descriptionLength: number;
  hasAttachment: boolean;
};

function ticketAuditImage(row: TicketRow): TicketAuditImage {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    categoryCode: row.category_code,
    status: row.status,
    priority: row.priority,
    assignedToUserId: row.assigned_to_user_id,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    subjectLength: row.subject.length,
    descriptionLength: row.description.length,
    hasAttachment: row.attachment_url !== null,
  };
}

function messageAuditImage(row: MessageRow) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderRole: row.sender_role,
    messageLength: row.message.length,
    hasAttachment: row.attachment_url !== null,
  };
}

// Shipped behaviour, NOT an owner decision: it allows OPEN->CLOSED, IN_PROGRESS->OPEN and RESOLVED->IN_PROGRESS,
// which differs from the original brief (OPEN->IN_PROGRESS->RESOLVED->CLOSED); awaiting an owner decision
// (see BR-60). A transition to the ticket's current status is never legal: CLOSED has no outgoing edge and the
// other states do not list themselves.
const LEGAL_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

function ticketNotFound(): AppError {
  return new AppError('NOT_FOUND', { detail: 'Support ticket not found' });
}

function ticketClosed(): AppError {
  return new AppError('INVALID_STATE_TRANSITION', {
    detail: 'Cannot send messages to a closed support ticket',
  });
}

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
      items: rows.map(mapFarmerTicket),
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
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: scope.userId,
        reason: 'Ticket created',
      });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'support_ticket.create',
        entityType: 'support_ticket',
        entityId: created.id,
        after: ticketAuditImage(created),
      });

      return {
        ticket: mapFarmerTicket(created),
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
      throw ticketNotFound();
    }

    const messages = await this.deps.repo.findMessagesByTicket(this.deps.db, id);
    return {
      ticket: mapFarmerTicket(ticket),
      messages: messages.map(mapFarmerMessage),
    };
  }

  async addMyTicketMessage(scope: ResolvedScope, ticketId: string, body: SendTicketMessageBody) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can reply to their own support tickets' });
    }

    return this.deps.runTx(async (tx) => {
      // The row lock serialises this against a concurrent close: whichever transaction takes the lock
      // first wins, and the other re-reads the committed status.
      const ticket = await this.deps.repo.lockTicketForFarmer(tx, ticketId, farmerId);
      if (!ticket) {
        throw ticketNotFound();
      }

      if (ticket.status === 'CLOSED') {
        throw ticketClosed();
      }

      const msg = await this.deps.repo.addMessage(tx, {
        ticketId,
        senderUserId: scope.userId,
        senderRole: scope.roleCode,
        message: body.message,
        attachmentUrl: body.attachmentUrl,
      });
      await this.deps.repo.touchTicket(tx, ticketId);

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'support_ticket.message_add',
        entityType: 'support_ticket_message',
        entityId: msg.id,
        after: messageAuditImage(msg),
      });

      return mapFarmerMessage(msg);
    });
  }

  async closeMyTicket(scope: ResolvedScope, id: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can close their own support tickets' });
    }

    return this.deps.runTx(async (tx) => {
      const ticket = await this.deps.repo.lockTicketForFarmer(tx, id, farmerId);
      if (!ticket) {
        throw ticketNotFound();
      }

      if (ticket.status === 'CLOSED') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: 'Support ticket is already closed',
        });
      }

      const updated = await this.deps.repo.updateTicketStatus(
        tx,
        id,
        'CLOSED',
        ticket.resolved_at,
        new Date().toISOString(),
      );
      if (!updated) {
        throw ticketNotFound();
      }

      await this.deps.repo.addStatusHistory(tx, {
        ticketId: id,
        fromStatus: ticket.status,
        toStatus: 'CLOSED',
        changedByUserId: scope.userId,
        reason: 'Closed by farmer',
      });

      const before = ticketAuditImage(ticket);
      const after = ticketAuditImage(updated);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'support_ticket.close',
        entityType: 'support_ticket',
        entityId: id,
        before,
        after,
        changedFields: changedFields(before, after),
      });

      const messages = await this.deps.repo.findMessagesByTicket(tx, id);
      return {
        ticket: mapFarmerTicket(updated),
        messages: messages.map(mapFarmerMessage),
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
      throw ticketNotFound();
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
      const ticket = await this.deps.repo.lockTicketById(tx, ticketId);
      if (!ticket) {
        throw ticketNotFound();
      }

      if (ticket.status === 'CLOSED') {
        throw ticketClosed();
      }

      const msg = await this.deps.repo.addMessage(tx, {
        ticketId,
        senderUserId: scope.userId,
        senderRole: scope.roleCode,
        message: body.message,
        attachmentUrl: body.attachmentUrl,
      });
      await this.deps.repo.touchTicket(tx, ticketId);

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'support_ticket.message_add',
        entityType: 'support_ticket_message',
        entityId: msg.id,
        after: messageAuditImage(msg),
      });

      return mapMessage(msg);
    });
  }

  async transitionStatus(scope: ResolvedScope, id: string, body: TransitionTicketStatusBody) {
    return this.deps.runTx(async (tx) => {
      const ticket = await this.deps.repo.lockTicketById(tx, id);
      if (!ticket) {
        throw ticketNotFound();
      }

      if (!LEGAL_TRANSITIONS[ticket.status].includes(body.status)) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: `Cannot transition support ticket from "${ticket.status}" to "${body.status}"`,
        });
      }

      // resolved_at describes the ticket's CURRENT resolution: stamped on entering RESOLVED, kept when
      // a resolved ticket is closed, cleared when it is re-opened for work.
      const now = new Date().toISOString();
      let resolvedAt: string | null = null;
      if (body.status === 'RESOLVED') resolvedAt = now;
      else if (body.status === 'CLOSED') resolvedAt = ticket.resolved_at;
      const closedAt = body.status === 'CLOSED' ? now : ticket.closed_at;

      const updated = await this.deps.repo.updateTicketStatus(tx, id, body.status, resolvedAt, closedAt);
      if (!updated) {
        throw ticketNotFound();
      }

      await this.deps.repo.addStatusHistory(tx, {
        ticketId: id,
        fromStatus: ticket.status,
        toStatus: body.status,
        changedByUserId: scope.userId,
        reason: body.reason ?? null,
      });

      const before = ticketAuditImage(ticket);
      const after = ticketAuditImage(updated);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'support_ticket.status_change',
        entityType: 'support_ticket',
        entityId: id,
        before,
        after,
        changedFields: changedFields(before, after),
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

  async assignTicket(scope: ResolvedScope, id: string, body: AssignTicketBody) {
    const assigneeId = body.assignedToUserId ?? null;

    return this.deps.runTx(async (tx) => {
      // Lock first so the CLOSED check and the write see the same row (a concurrent close cannot slip in).
      const ticket = await this.deps.repo.lockTicketById(tx, id);
      if (!ticket) {
        throw ticketNotFound();
      }

      if (ticket.status === 'CLOSED') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: 'Cannot change the assignee of a closed support ticket',
        });
      }

      // null un-assigns. A non-null assignee must be a live admin who can actually work the queue;
      // checked here so a bad id is a clear 422 rather than a foreign-key 500.
      if (
        assigneeId !== null &&
        !(await this.deps.repo.userHoldsPermission(tx, assigneeId, ADMIN_TICKET_PERMISSION))
      ) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'assignedToUserId must be an active admin user who can manage support tickets',
        });
      }

      const updated = await this.deps.repo.updateTicketAssignment(tx, id, assigneeId);
      if (!updated) {
        throw ticketNotFound();
      }

      const before = ticketAuditImage(ticket);
      const after = ticketAuditImage(updated);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'support_ticket.assign',
        entityType: 'support_ticket',
        entityId: id,
        before,
        after,
        changedFields: changedFields(before, after),
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
