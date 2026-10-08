import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  CategoryRow,
  MessageRow,
  StatusHistoryRow,
  SupportTicketsRepo,
  TicketRow,
} from './support-tickets.repo.js';
import { createSupportTicketsService } from './support-tickets.service.js';

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';

function farmerScope(farmerId: string, permission = 'farmer.support_ticket.manage_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

function adminScope(): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId: newId(),
    roleCode: RoleCode.TOHFA_ADMIN,
    permission: 'support.ticket.manage_any',
  });
}

interface FakeDbState {
  categories: Map<string, CategoryRow>;
  tickets: Map<string, TicketRow>;
  messages: MessageRow[];
  history: StatusHistoryRow[];
  auditLogs: unknown[][];
}

function createFakeRepo(state: FakeDbState): SupportTicketsRepo {
  return {
    async findActiveCategories(_db) {
      return Array.from(state.categories.values()).filter((c) => c.is_active);
    },

    async findCategoryByCode(_db, code) {
      return state.categories.get(code) ?? null;
    },

    async findTicketsByFarmer(_db, farmerId, { page, limit, status }) {
      let list = Array.from(state.tickets.values()).filter((t) => t.farmer_id === farmerId);
      if (status) list = list.filter((t) => t.status === status);
      const total = list.length;
      const offset = (page - 1) * limit;
      const rows = list.slice(offset, offset + limit).map((t) => ({
        ...t,
        message_count: state.messages.filter((m) => m.ticket_id === t.id).length,
      }));
      return { rows, total };
    },

    async findTicketByIdAndFarmer(_db, id, farmerId) {
      const t = state.tickets.get(id);
      if (!t || t.farmer_id !== farmerId) return null;
      return {
        ...t,
        message_count: state.messages.filter((m) => m.ticket_id === t.id).length,
      };
    },

    async findTicketById(_db, id) {
      const t = state.tickets.get(id);
      if (!t) return null;
      return {
        ...t,
        message_count: state.messages.filter((m) => m.ticket_id === t.id).length,
      };
    },

    async findAllTickets(_db, { page, limit, status, categoryCode, priority, assignedToUserId }) {
      let list = Array.from(state.tickets.values());
      if (status) list = list.filter((t) => t.status === status);
      if (categoryCode) list = list.filter((t) => t.category_code === categoryCode);
      if (priority) list = list.filter((t) => t.priority === priority);
      if (assignedToUserId) list = list.filter((t) => t.assigned_to_user_id === assignedToUserId);
      const total = list.length;
      const offset = (page - 1) * limit;
      const rows = list.slice(offset, offset + limit).map((t) => ({
        ...t,
        message_count: state.messages.filter((m) => m.ticket_id === t.id).length,
      }));
      return { rows, total };
    },

    async createTicket(_db, farmerId, body) {
      const id = newId();
      const row: TicketRow = {
        id,
        ticket_number: `TKT-${state.tickets.size + 1001}`,
        farmer_id: farmerId,
        category_code: body.categoryCode,
        subject: body.subject,
        description: body.description,
        attachment_url: body.attachmentUrl ?? null,
        status: 'OPEN',
        priority: body.priority ?? 'NORMAL',
        assigned_to_user_id: null,
        resolved_at: null,
        closed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
      };
      state.tickets.set(id, row);
      return { ...row };
    },

    async updateTicketStatus(_db, id, status, resolvedAt, closedAt) {
      const t = state.tickets.get(id);
      if (!t) return null;
      t.status = status;
      if (resolvedAt !== undefined) t.resolved_at = resolvedAt;
      if (closedAt !== undefined) t.closed_at = closedAt;
      t.updated_at = new Date().toISOString();
      return {
        ...t,
        message_count: state.messages.filter((m) => m.ticket_id === t.id).length,
      };
    },

    async updateTicketAssignment(_db, id, assignedToUserId) {
      const t = state.tickets.get(id);
      if (!t) return null;
      t.assigned_to_user_id = assignedToUserId ?? null;
      t.updated_at = new Date().toISOString();
      return {
        ...t,
        message_count: state.messages.filter((m) => m.ticket_id === t.id).length,
      };
    },

    async findMessagesByTicket(_db, ticketId) {
      return state.messages.filter((m) => m.ticket_id === ticketId);
    },

    async addMessage(_db, params) {
      const row: MessageRow = {
        id: newId(),
        ticket_id: params.ticketId,
        sender_user_id: params.senderUserId,
        sender_role: params.senderRole,
        message: params.message,
        attachment_url: params.attachmentUrl ?? null,
        created_at: new Date().toISOString(),
      };
      state.messages.push(row);
      return { ...row };
    },

    async findStatusHistoryByTicket(_db, ticketId) {
      return state.history.filter((h) => h.ticket_id === ticketId);
    },

    async addStatusHistory(_db, params) {
      const row: StatusHistoryRow = {
        id: newId(),
        ticket_id: params.ticketId,
        from_status: params.fromStatus,
        to_status: params.toStatus,
        changed_by_user_id: params.changedByUserId,
        reason: params.reason ?? null,
        created_at: new Date().toISOString(),
      };
      state.history.push(row);
      return { ...row };
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    categories: new Map([
      ['ACCOUNT', { id: newId(), code: 'ACCOUNT', name: 'Account', description: null, is_active: true, created_at: new Date().toISOString() }],
      ['PAYMENTS', { id: newId(), code: 'PAYMENTS', name: 'Payments', description: null, is_active: true, created_at: new Date().toISOString() }],
      ['LISTINGS', { id: newId(), code: 'LISTINGS', name: 'Listings', description: null, is_active: true, created_at: new Date().toISOString() }],
      ['APP_PROBLEM', { id: newId(), code: 'APP_PROBLEM', name: 'App problem', description: null, is_active: true, created_at: new Date().toISOString() }],
      ['OTHER', { id: newId(), code: 'OTHER', name: 'Other', description: null, is_active: true, created_at: new Date().toISOString() }],
    ]),
    tickets: new Map(),
    messages: [],
    history: [],
    auditLogs: [],
  };

  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (sql: string, params?: unknown[]) => {
      // Row lock mock for support_tickets
      if (sql.includes('SELECT') && sql.includes('FROM support_tickets') && sql.includes('FOR UPDATE')) {
        const id = params?.[0] as string;
        const farmerId = params?.[1] as string | undefined;
        const t = state.tickets.get(id);
        if (!t) return { rows: [], rowCount: 0 } as never;
        if (farmerId && t.farmer_id !== farmerId) return { rows: [], rowCount: 0 } as never;
        return { rows: [{ ...t }], rowCount: 1 } as never;
      }
      state.auditLogs.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };

  const service = createSupportTicketsService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.auditLogs };
}

describe('Support Tickets (BR-60)', () => {
  it('BR-60a scopes farmer tickets to own profile and returns 404 for cross-farmer access', async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    // Farmer A creates a ticket
    const resA = await service.createTicket(scopeA, {
      categoryCode: 'PAYMENTS',
      subject: 'Delayed payout confirmation',
      description: 'Payout for PO-102 has not reached bank account.',
      priority: 'NORMAL',
    });
    expect(resA.ticket.farmerId).toBe(FARMER_A);
    expect(resA.ticket.status).toBe('OPEN');

    // Farmer A sees their ticket
    const fetchedA = await service.getMyTicket(scopeA, resA.ticket.id);
    expect(fetchedA.ticket.id).toBe(resA.ticket.id);

    // Farmer B cannot access Farmer A's ticket (404 NOT_FOUND)
    await expect(service.getMyTicket(scopeB, resA.ticket.id)).rejects.toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it('BR-60b enforces ticket lifecycle state machine and rejects illegal transitions with 409 INVALID_STATE_TRANSITION', async () => {
    const { service } = createTestContext();
    const admin = adminScope();
    const farmer = farmerScope(FARMER_A);

    // Create ticket (OPEN)
    const res = await service.createTicket(farmer, {
      categoryCode: 'APP_PROBLEM',
      subject: 'Listing image upload fails',
      description: 'Error when uploading certificate JPG.',
      priority: 'NORMAL',
    });
    const ticketId = res.ticket.id;

    // Illegal: OPEN -> RESOLVED (must be IN_PROGRESS first)
    await expect(service.transitionStatus(admin, ticketId, { status: 'RESOLVED' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );

    // Legal: OPEN -> IN_PROGRESS
    const inProgress = await service.transitionStatus(admin, ticketId, {
      status: 'IN_PROGRESS',
      reason: 'Assigned to technical support',
    });
    expect(inProgress.ticket.status).toBe('IN_PROGRESS');

    // Legal: IN_PROGRESS -> RESOLVED
    const resolved = await service.transitionStatus(admin, ticketId, {
      status: 'RESOLVED',
      reason: 'Bug fixed in app version 1.2',
    });
    expect(resolved.ticket.status).toBe('RESOLVED');
    expect(resolved.ticket.resolvedAt).toBeDefined();

    // Legal: RESOLVED -> CLOSED
    const closed = await service.transitionStatus(admin, ticketId, {
      status: 'CLOSED',
      reason: 'Confirmed by user',
    });
    expect(closed.ticket.status).toBe('CLOSED');
    expect(closed.ticket.closedAt).toBeDefined();

    // Illegal: CLOSED is terminal (cannot transition to OPEN or IN_PROGRESS)
    await expect(service.transitionStatus(admin, ticketId, { status: 'OPEN' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('BR-60c permits farmers to close their own tickets and prevents mutations once closed', async () => {
    const { service } = createTestContext();
    const farmer = farmerScope(FARMER_A);

    const res = await service.createTicket(farmer, {
      categoryCode: 'ACCOUNT',
      subject: 'Need help updating bank account',
      description: 'How to update IFSC code?',
      priority: 'NORMAL',
    });

    // Farmer closes ticket
    const closed = await service.closeMyTicket(farmer, res.ticket.id);
    expect(closed.ticket.status).toBe('CLOSED');

    // Attempting to close again throws 409 INVALID_STATE_TRANSITION
    await expect(service.closeMyTicket(farmer, res.ticket.id)).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('BR-60d enforces append-only message thread and blocks replies on closed tickets', async () => {
    const { service } = createTestContext();
    const farmer = farmerScope(FARMER_A);
    const admin = adminScope();

    const res = await service.createTicket(farmer, {
      categoryCode: 'LISTINGS',
      subject: 'Clarification on counter-offer',
      description: 'Why was grade downgraded?',
      priority: 'NORMAL',
    });
    const ticketId = res.ticket.id;

    // Admin replies
    const msg1 = await service.addAdminMessage(admin, ticketId, {
      message: 'Quality inspector flagged moisture content above 14%.',
    });
    expect(msg1.senderRole).toBe('TOHFA_ADMIN');

    // Farmer replies
    const msg2 = await service.addMyTicketMessage(farmer, ticketId, {
      message: 'Understood, will re-dry batch before delivery.',
    });
    expect(msg2.senderRole).toBe('FARMER');

    // Close ticket
    await service.closeMyTicket(farmer, ticketId);

    // Replying on closed ticket fails with 409 INVALID_STATE_TRANSITION
    await expect(
      service.addMyTicketMessage(farmer, ticketId, { message: 'One more thing...' }),
    ).rejects.toThrow(expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }));

    await expect(
      service.addAdminMessage(admin, ticketId, { message: 'Admin follow-up...' }),
    ).rejects.toThrow(expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }));
  });

  it('BR-60e admin mutations record audit logs and track status history', async () => {
    const { service, audits, state } = createTestContext();
    const farmer = farmerScope(FARMER_A);
    const admin = adminScope();

    const res = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Annual summit attendance',
      description: 'Are travel expenses reimbursed?',
      priority: 'NORMAL',
    });
    const ticketId = res.ticket.id;

    // Admin assigns ticket
    const assignedAdminId = newId();
    await service.assignTicket(admin, ticketId, { assignedToUserId: assignedAdminId });
    expect(audits.some((a) => a.includes('support_ticket.assign'))).toBe(true);

    // Admin transitions status
    await service.transitionStatus(admin, ticketId, { status: 'IN_PROGRESS', reason: 'Triage' });
    expect(audits.some((a) => a.includes('support_ticket.status_change'))).toBe(true);

    // Verify status history
    const history = state.history.filter((h) => h.ticket_id === ticketId);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some((h) => h.to_status === 'IN_PROGRESS')).toBe(true);
  });
});
