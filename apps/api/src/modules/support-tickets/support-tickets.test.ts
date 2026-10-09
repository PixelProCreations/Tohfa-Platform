import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool } from '../../db/pool.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CategoryRow,
  MessageRow,
  StatusHistoryRow,
  SupportTicketsRepo,
  TicketRow,
} from './support-tickets.repo.js';
import {
  assignTicketBody,
  createSupportTicketBody,
  listAdminTicketsQuery,
  sendTicketMessageBody,
  transitionTicketStatusBody,
} from './support-tickets.schema.js';
import { createSupportTicketsService, supportTicketsService } from './support-tickets.service.js';

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';

function farmerScope(
  farmerId: string,
  userId: string = newId(),
  permission = 'farmer.support_ticket.manage_own',
): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId,
    roleCode: RoleCode.FARMER,
    permission,
  });
}

function adminScope(userId: string = newId()): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId,
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
  /** Users the fake repo reports as active admins holding the ticket permission. */
  eligibleAssignees: Set<string>;
  touched: string[];
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

    async lockTicketForFarmer(_db, id, farmerId) {
      const t = state.tickets.get(id);
      return t && t.farmer_id === farmerId ? { ...t } : null;
    },

    async lockTicketById(_db, id) {
      const t = state.tickets.get(id);
      return t ? { ...t } : null;
    },

    async touchTicket(_db, id) {
      state.touched.push(id);
    },

    async userHoldsPermission(_db, userId, _permissionCode) {
      return state.eligibleAssignees.has(userId);
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
        priority: 'NORMAL',
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
      t.resolved_at = resolvedAt;
      t.closed_at = closedAt;
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
    eligibleAssignees: new Set(),
    touched: [],
  };

  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
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
  it('BR-60a: scopes farmer tickets to own profile and returns 404 for cross-farmer access', async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    // Farmer A creates a ticket
    const resA = await service.createTicket(scopeA, {
      categoryCode: 'PAYMENTS',
      subject: 'Delayed payout confirmation',
      description: 'Payout for PO-102 has not reached bank account.',
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

  it('BR-60b: enforces ticket lifecycle state machine and rejects illegal transitions with 409 INVALID_STATE_TRANSITION', async () => {
    const { service } = createTestContext();
    const admin = adminScope();
    const farmer = farmerScope(FARMER_A);

    // Create ticket (OPEN)
    const res = await service.createTicket(farmer, {
      categoryCode: 'APP_PROBLEM',
      subject: 'Listing image upload fails',
      description: 'Error when uploading certificate JPG.',
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
    expect(resolved.ticket.resolvedAt).toBeTruthy();

    // Legal: RESOLVED -> CLOSED
    const closed = await service.transitionStatus(admin, ticketId, {
      status: 'CLOSED',
      reason: 'Confirmed by user',
    });
    expect(closed.ticket.status).toBe('CLOSED');
    expect(closed.ticket.closedAt).toBeTruthy();

    // Illegal: CLOSED is terminal (cannot transition to OPEN or IN_PROGRESS)
    await expect(service.transitionStatus(admin, ticketId, { status: 'OPEN' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('BR-60c: permits farmers to close their own tickets and prevents mutations once closed', async () => {
    const { service } = createTestContext();
    const farmer = farmerScope(FARMER_A);

    const res = await service.createTicket(farmer, {
      categoryCode: 'ACCOUNT',
      subject: 'Need help updating bank account',
      description: 'How to update IFSC code?',
    });

    // Farmer closes ticket
    const closed = await service.closeMyTicket(farmer, res.ticket.id);
    expect(closed.ticket.status).toBe('CLOSED');

    // Attempting to close again throws 409 INVALID_STATE_TRANSITION
    await expect(service.closeMyTicket(farmer, res.ticket.id)).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('BR-60d: enforces append-only message thread and blocks replies on closed tickets', async () => {
    const { service } = createTestContext();
    const farmer = farmerScope(FARMER_A);
    const admin = adminScope();

    const res = await service.createTicket(farmer, {
      categoryCode: 'LISTINGS',
      subject: 'Clarification on counter-offer',
      description: 'Why was grade downgraded?',
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

  it('BR-60e: admin mutations record audit logs and track status history', async () => {
    const { service, audits, state } = createTestContext();
    const farmer = farmerScope(FARMER_A);
    const admin = adminScope();

    const res = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Annual summit attendance',
      description: 'Are travel expenses reimbursed?',
    });
    const ticketId = res.ticket.id;

    // Admin assigns ticket
    const assignedAdminId = newId();
    state.eligibleAssignees.add(assignedAdminId);
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

  it('BR-60b: rejects a transition to the ticket\'s current status with 409 INVALID_STATE_TRANSITION', async () => {
    const { service, state } = createTestContext();
    const admin = adminScope();
    const farmer = farmerScope(FARMER_A);
    const { ticket } = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Same status',
      description: 'No-op transitions must not succeed silently.',
    });

    await expect(service.transitionStatus(admin, ticket.id, { status: 'OPEN' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
    // Nothing was recorded for the rejected no-op: only the creation row exists.
    expect(state.history).toHaveLength(1);

    await service.transitionStatus(admin, ticket.id, { status: 'CLOSED' });
    await expect(service.transitionStatus(admin, ticket.id, { status: 'CLOSED' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('BR-60b: records creation as NULL -> OPEN, clears resolved_at when leaving RESOLVED and keeps it when closing', async () => {
    const { service, state } = createTestContext();
    const admin = adminScope();
    const farmer = farmerScope(FARMER_A);
    const { ticket } = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Resolution timestamps',
      description: 'resolved_at must describe the current resolution.',
    });
    expect(state.history[0]).toMatchObject({ from_status: null, to_status: 'OPEN' });

    await service.transitionStatus(admin, ticket.id, { status: 'IN_PROGRESS' });
    const resolved = await service.transitionStatus(admin, ticket.id, { status: 'RESOLVED' });
    expect(resolved.ticket.resolvedAt).toBeTruthy();

    const reopened = await service.transitionStatus(admin, ticket.id, { status: 'IN_PROGRESS' });
    expect(reopened.ticket.resolvedAt).toBeNull();

    await service.transitionStatus(admin, ticket.id, { status: 'RESOLVED' });
    const closed = await service.transitionStatus(admin, ticket.id, { status: 'CLOSED' });
    expect(closed.ticket.resolvedAt).toBeTruthy();
    expect(closed.ticket.closedAt).toBeTruthy();
  });

  it('BR-60d: a new message bumps the ticket updated_at, for both farmer and admin replies', async () => {
    const { service, state } = createTestContext();
    const farmer = farmerScope(FARMER_A);
    const { ticket } = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Activity',
      description: 'A reply is activity.',
    });

    await service.addMyTicketMessage(farmer, ticket.id, { message: 'hello' });
    await service.addAdminMessage(adminScope(), ticket.id, { message: 'hi' });
    expect(state.touched).toEqual([ticket.id, ticket.id]);
  });

  it('BR-60f: a farmer cannot set triage priority at creation (strict body schema rejects it)', () => {
    const ok = createSupportTicketBody.safeParse({ categoryCode: 'OTHER', subject: 's', description: 'd' });
    expect(ok.success).toBe(true);
    const withPriority = createSupportTicketBody.safeParse({
      categoryCode: 'OTHER',
      subject: 's',
      description: 'd',
      priority: 'URGENT',
    });
    expect(withPriority.success).toBe(false);
  });

  it('BR-60f: a created ticket is NORMAL priority', async () => {
    const { service, state } = createTestContext();
    const { ticket } = await service.createTicket(farmerScope(FARMER_A), {
      categoryCode: 'OTHER',
      subject: 'Priority',
      description: 'Defaults to NORMAL.',
    });
    expect(state.tickets.get(ticket.id)?.priority).toBe('NORMAL');
  });

  it('BR-60g: farmer responses hide staff identity; admin responses keep the full fields', async () => {
    const { service, state } = createTestContext();
    const farmerUserId = newId();
    const farmer = farmerScope(FARMER_A, farmerUserId);
    const admin = adminScope();
    const staffId = newId();
    state.eligibleAssignees.add(staffId);

    const { ticket } = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Who answered',
      description: 'The farmer must not learn staff ids or roles.',
    });
    await service.assignTicket(admin, ticket.id, { assignedToUserId: staffId });
    await service.addAdminMessage(admin, ticket.id, { message: 'staff reply' });
    await service.addMyTicketMessage(farmer, ticket.id, { message: 'farmer reply' });

    const mine = await service.getMyTicket(farmer, ticket.id);
    expect(mine.ticket).not.toHaveProperty('assignedToUserId');
    expect(mine.messages.map((m) => m.senderRole)).toEqual(['SUPPORT', 'FARMER']);
    for (const m of mine.messages) {
      expect(m).not.toHaveProperty('senderUserId');
    }
    expect(JSON.stringify(mine)).not.toContain(staffId);
    expect(JSON.stringify(mine)).not.toContain('TOHFA_ADMIN');

    const list = await service.listMyTickets(farmer, { page: 1, limit: 20 });
    expect(list.items[0]).not.toHaveProperty('assignedToUserId');
    const posted = await service.addMyTicketMessage(farmer, ticket.id, { message: 'again' });
    expect(posted).not.toHaveProperty('senderUserId');
    const closed = await service.closeMyTicket(farmer, ticket.id);
    expect(closed.ticket).not.toHaveProperty('assignedToUserId');
    expect(closed.messages.every((m) => !('senderUserId' in m))).toBe(true);

    const adminView = await service.getAdminTicket(admin, ticket.id);
    expect(adminView.ticket.assignedToUserId).toBe(staffId);
    const staffMessage = adminView.messages.find((m) => m.message === 'staff reply');
    expect(staffMessage).toMatchObject({ senderRole: 'TOHFA_ADMIN', senderUserId: admin.userId });
    const farmerMessage = adminView.messages.find((m) => m.message === 'farmer reply');
    expect(farmerMessage).toMatchObject({ senderRole: 'FARMER', senderUserId: farmerUserId });
  });

  it('BR-60h: rejects assigning a ticket to a user who is not an active ticket admin (422) without touching the ticket', async () => {
    const { service, state } = createTestContext();
    const admin = adminScope();
    const { ticket } = await service.createTicket(farmerScope(FARMER_A), {
      categoryCode: 'OTHER',
      subject: 'Assign',
      description: 'Assignee must be a live admin.',
    });

    await expect(
      service.assignTicket(admin, ticket.id, { assignedToUserId: newId() }),
    ).rejects.toThrow(expect.objectContaining({ status: 422, code: 'VALIDATION_FAILED' }));
    expect(state.tickets.get(ticket.id)?.assigned_to_user_id).toBeNull();

    const eligible = newId();
    state.eligibleAssignees.add(eligible);
    const assigned = await service.assignTicket(admin, ticket.id, { assignedToUserId: eligible });
    expect(assigned.ticket.assignedToUserId).toBe(eligible);

    // null un-assigns and needs no eligibility lookup.
    const cleared = await service.assignTicket(admin, ticket.id, { assignedToUserId: null });
    expect(cleared.ticket.assignedToUserId).toBeNull();
  });

  it('BR-60h: rejects assignment on a CLOSED ticket with 409 and on a missing ticket with 404', async () => {
    const { service, state } = createTestContext();
    const admin = adminScope();
    const farmer = farmerScope(FARMER_A);
    const { ticket } = await service.createTicket(farmer, {
      categoryCode: 'OTHER',
      subject: 'Closed assign',
      description: 'No assignment once closed.',
    });
    const eligible = newId();
    state.eligibleAssignees.add(eligible);
    await service.closeMyTicket(farmer, ticket.id);

    await expect(
      service.assignTicket(admin, ticket.id, { assignedToUserId: eligible }),
    ).rejects.toThrow(expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }));
    await expect(
      service.assignTicket(admin, newId(), { assignedToUserId: eligible }),
    ).rejects.toThrow(expect.objectContaining({ status: 404, code: 'NOT_FOUND' }));
  });

  it('BR-60i: audit rows carry ids, statuses and lengths, never ticket or message text', async () => {
    const { service, audits } = createTestContext();
    const farmer = farmerScope(FARMER_A);
    const admin = adminScope();
    const secret = 'SECRET-BANK-DETAILS-4455';
    const { ticket } = await service.createTicket(farmer, {
      categoryCode: 'PAYMENTS',
      subject: `subject ${secret}`,
      description: `description ${secret}`,
    });
    await service.addMyTicketMessage(farmer, ticket.id, { message: `message ${secret}` });
    await service.addAdminMessage(admin, ticket.id, { message: `reply ${secret}` });
    await service.transitionStatus(admin, ticket.id, { status: 'IN_PROGRESS', reason: `why ${secret}` });
    await service.closeMyTicket(farmer, ticket.id);

    expect(audits.length).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(audits)).not.toContain(secret);
    expect(JSON.stringify(audits)).toContain('messageLength');
  });

  it('BR-60j: enforces max lengths on free text (description, message, reason, category code)', () => {
    const over = (n: number) => 'x'.repeat(n + 1);
    expect(createSupportTicketBody.safeParse({ categoryCode: 'OTHER', subject: 's', description: over(2000) }).success).toBe(false);
    expect(createSupportTicketBody.safeParse({ categoryCode: over(64), subject: 's', description: 'd' }).success).toBe(false);
    expect(sendTicketMessageBody.safeParse({ message: over(2000) }).success).toBe(false);
    expect(sendTicketMessageBody.safeParse({ message: 'x'.repeat(2000) }).success).toBe(true);
    expect(transitionTicketStatusBody.safeParse({ status: 'CLOSED', reason: over(500) }).success).toBe(false);
    expect(transitionTicketStatusBody.safeParse({ status: 'CLOSED', reason: 'x'.repeat(500) }).success).toBe(true);
    expect(listAdminTicketsQuery.safeParse({ categoryCode: over(64) }).success).toBe(false);
    expect(assignTicketBody.safeParse({ assignedToUserId: null }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: real Postgres, migration 0039 applied. Skipped (not silently passed) when the table is
// missing. Fixtures are committed: the thread and history tables are append-only, so a ticket that has
// rows in them can never be deleted again - run this suite against a throwaway/test database only.
// ---------------------------------------------------------------------------
const rand = (): string => Math.random().toString().slice(2, 12).padStart(10, '0');

async function makeUser(userType: 'FARMER' | 'ADMIN', status = 'ACTIVE'): Promise<string> {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, $3, $4) RETURNING id`,
    [`+91${rand()}`, `m8 test ${userType}`, userType, status],
  );
  return res.rows[0]!.id;
}

async function makeFarmer(): Promise<{ farmerId: string; userId: string }> {
  const userId = await makeUser('FARMER');
  const res = await pool.query<{ id: string }>(
    `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
    [userId, `M8-${rand()}`],
  );
  return { farmerId: res.rows[0]!.id, userId };
}

async function makeAdmin(roleCode = 'TOHFA_ADMIN', status = 'ACTIVE'): Promise<string> {
  const userId = await makeUser('ADMIN', status);
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, role_code) SELECT $1, id, code FROM roles WHERE code = $2`,
    [userId, roleCode],
  );
  return userId;
}

describeIfDatabase('Support Tickets (BR-60) against Postgres', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('farmer_support_tickets');
    if (!ready) console.warn('[skip] farmer_support_tickets not migrated - apply 0039_support_tickets.sql');
  });

  afterAll(async () => {
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  async function newTicket(farmer: { farmerId: string; userId: string }) {
    const scope = farmerScope(farmer.farmerId, farmer.userId);
    const { ticket } = await supportTicketsService.createTicket(scope, {
      categoryCode: 'OTHER',
      subject: 'integration ticket',
      description: 'integration ticket body',
    });
    return { scope, ticketId: ticket.id };
  }

  it('BR-60: migration 0039 created the farmer ticket tables, sequence, triggers and left 0008 support_tickets alone', async (ctx) => {
    if (!ready) return ctx.skip();
    const rel = await pool.query<{ name: string; kind: string }>(
      `SELECT relname AS name, relkind AS kind FROM pg_class
       WHERE relnamespace = 'public'::regnamespace
         AND relname IN ('farmer_support_tickets', 'support_ticket_messages', 'support_ticket_status_history',
                         'support_ticket_categories', 'support_ticket_seq')`,
    );
    expect(Object.fromEntries(rel.rows.map((r) => [r.name, r.kind]))).toEqual({
      farmer_support_tickets: 'r',
      support_ticket_messages: 'r',
      support_ticket_status_history: 'r',
      support_ticket_categories: 'r',
      support_ticket_seq: 'S',
    });

    const triggers = await pool.query<{ tgname: string }>(
      `SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN
         ('farmer_support_tickets'::regclass, 'support_ticket_messages'::regclass, 'support_ticket_status_history'::regclass)`,
    );
    expect(triggers.rows.map((r) => r.tgname).sort()).toEqual([
      'trg_farmer_support_tickets_touch_updated_at',
      'trg_support_ticket_messages_append_only',
      'trg_support_ticket_messages_no_truncate',
      'trg_support_ticket_status_history_append_only',
      'trg_support_ticket_status_history_no_truncate',
    ]);

    // The original 0008 table is intact (it has customer_id; the farmer help-desk table does not).
    const old = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'customer_id'`,
    );
    expect(old.rowCount).toBe(1);
    const cats = await pool.query(`SELECT count(*)::int AS n FROM support_ticket_categories WHERE is_active`);
    expect(cats.rows[0]?.n).toBeGreaterThanOrEqual(5);
  });

  it('BR-60a: a farmer cannot read another farmer\'s ticket (404 NOT_FOUND through the real SQL)', async (ctx) => {
    if (!ready) return ctx.skip();
    const a = await makeFarmer();
    const b = await makeFarmer();
    const { ticketId } = await newTicket(a);
    const scopeB = farmerScope(b.farmerId, b.userId);

    await expect(supportTicketsService.getMyTicket(scopeB, ticketId)).rejects.toThrow(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    );
    await expect(
      supportTicketsService.addMyTicketMessage(scopeB, ticketId, { message: 'not mine' }),
    ).rejects.toThrow(expect.objectContaining({ status: 404, code: 'NOT_FOUND' }));
    await expect(supportTicketsService.closeMyTicket(scopeB, ticketId)).rejects.toThrow(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    );
    expect((await supportTicketsService.listMyTickets(scopeB, { page: 1, limit: 20 })).items).toEqual([]);
  });

  it('BR-60d: a farmer cannot message after the ticket is CLOSED (409), and the thread stays empty', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);
    await supportTicketsService.closeMyTicket(scope, ticketId);

    await expect(
      supportTicketsService.addMyTicketMessage(scope, ticketId, { message: 'too late' }),
    ).rejects.toThrow(expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }));
    const thread = await supportTicketsService.getMyTicket(scope, ticketId);
    expect(thread.messages).toEqual([]);
  });

  it('BR-60d: a message that waits on the row lock re-reads the committed CLOSED status (409, nothing inserted)', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);

    // Hold the ticket row lock in an open transaction, like a close that is mid-flight.
    const holder = await pool.connect();
    try {
      await holder.query('BEGIN');
      await holder.query('SELECT id FROM farmer_support_tickets WHERE id = $1 FOR UPDATE', [ticketId]);

      let settled = false;
      const pending = supportTicketsService.addMyTicketMessage(scope, ticketId, { message: 'racing' });
      pending.then(
        () => (settled = true),
        () => (settled = true),
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Without FOR UPDATE the message would have read OPEN and been inserted already.
      expect(settled).toBe(false);

      await holder.query(`UPDATE farmer_support_tickets SET status = 'CLOSED', closed_at = now() WHERE id = $1`, [ticketId]);
      await holder.query('COMMIT');

      await expect(pending).rejects.toThrow(
        expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
      );
    } finally {
      holder.release();
    }
    const count = await pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM support_ticket_messages WHERE ticket_id = $1`,
      [ticketId],
    );
    expect(count.rows[0]?.n).toBe(0);
  });

  it('BR-60c: two parallel closes are serialised - one 200, one 409, never a 500', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);

    const results = await Promise.allSettled([
      supportTicketsService.closeMyTicket(scope, ticketId),
      supportTicketsService.closeMyTicket(scope, ticketId),
    ]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.reason).toMatchObject({ status: 409, code: 'INVALID_STATE_TRANSITION' });

    const history = await pool.query<{ to_status: string }>(
      `SELECT to_status FROM support_ticket_status_history WHERE ticket_id = $1 ORDER BY created_at, id`,
      [ticketId],
    );
    expect(history.rows.filter((r) => r.to_status === 'CLOSED')).toHaveLength(1);
  });

  it('BR-60d: a close racing a message never yields a 500 and never a message on a ticket it reported closed', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);

    const [message, close] = await Promise.allSettled([
      supportTicketsService.addMyTicketMessage(scope, ticketId, { message: 'racing' }),
      supportTicketsService.closeMyTicket(scope, ticketId),
    ]);
    expect(close.status).toBe('fulfilled');
    const messages = await pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM support_ticket_messages WHERE ticket_id = $1`,
      [ticketId],
    );
    if (message.status === 'fulfilled') {
      expect(messages.rows[0]?.n).toBe(1);
    } else {
      expect(message.reason).toMatchObject({ status: 409, code: 'INVALID_STATE_TRANSITION' });
      expect(messages.rows[0]?.n).toBe(0);
    }
  });

  it('BR-60d: the thread and the status history reject UPDATE and DELETE at the database', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);
    await supportTicketsService.addMyTicketMessage(scope, ticketId, { message: 'immutable' });

    const append = /append-only/;
    await expect(pool.query(`UPDATE support_ticket_messages SET message = 'edited' WHERE ticket_id = $1`, [ticketId])).rejects.toThrow(append);
    await expect(pool.query(`DELETE FROM support_ticket_messages WHERE ticket_id = $1`, [ticketId])).rejects.toThrow(append);
    await expect(pool.query(`UPDATE support_ticket_status_history SET reason = 'edited' WHERE ticket_id = $1`, [ticketId])).rejects.toThrow(append);
    await expect(pool.query(`DELETE FROM support_ticket_status_history WHERE ticket_id = $1`, [ticketId])).rejects.toThrow(append);
    // The cascade from the ticket hits the same guard, so a ticket with a thread cannot be deleted either.
    await expect(pool.query(`DELETE FROM farmer_support_tickets WHERE id = $1`, [ticketId])).rejects.toThrow(append);
  });

  it('BR-60b: a transition to the current status is 409 INVALID_STATE_TRANSITION, including CLOSED -> CLOSED, with no history row', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const admin = adminScope(await makeAdmin());
    const { ticketId } = await newTicket(farmer);

    await expect(supportTicketsService.transitionStatus(admin, ticketId, { status: 'OPEN' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
    await supportTicketsService.transitionStatus(admin, ticketId, { status: 'CLOSED' });
    await expect(supportTicketsService.transitionStatus(admin, ticketId, { status: 'CLOSED' })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
    const history = await pool.query<{ from_status: string | null; to_status: string }>(
      `SELECT from_status, to_status FROM support_ticket_status_history WHERE ticket_id = $1 ORDER BY created_at, id`,
      [ticketId],
    );
    expect(history.rows).toEqual([
      { from_status: null, to_status: 'OPEN' },
      { from_status: 'OPEN', to_status: 'CLOSED' },
    ]);
  });

  it('BR-60b: leaving RESOLVED clears resolved_at in the database', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const admin = adminScope(await makeAdmin());
    const { ticketId } = await newTicket(farmer);

    await supportTicketsService.transitionStatus(admin, ticketId, { status: 'IN_PROGRESS' });
    await supportTicketsService.transitionStatus(admin, ticketId, { status: 'RESOLVED' });
    const resolved = await pool.query<{ resolved_at: Date | null }>(`SELECT resolved_at FROM farmer_support_tickets WHERE id = $1`, [ticketId]);
    expect(resolved.rows[0]?.resolved_at).not.toBeNull();
    await supportTicketsService.transitionStatus(admin, ticketId, { status: 'IN_PROGRESS' });
    const reopened = await pool.query<{ resolved_at: Date | null }>(`SELECT resolved_at FROM farmer_support_tickets WHERE id = $1`, [ticketId]);
    expect(reopened.rows[0]?.resolved_at).toBeNull();
  });

  it('BR-60d: a reply bumps updated_at and the thread comes back in a stable order', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);
    const before = await pool.query<{ updated_at: Date }>(`SELECT updated_at FROM farmer_support_tickets WHERE id = $1`, [ticketId]);

    await supportTicketsService.addMyTicketMessage(scope, ticketId, { message: 'first' });
    await supportTicketsService.addMyTicketMessage(scope, ticketId, { message: 'second' });

    const after = await pool.query<{ updated_at: Date }>(`SELECT updated_at FROM farmer_support_tickets WHERE id = $1`, [ticketId]);
    expect(after.rows[0]!.updated_at.getTime()).toBeGreaterThan(before.rows[0]!.updated_at.getTime());
    const thread = await supportTicketsService.getMyTicket(scope, ticketId);
    expect(thread.messages.map((m) => m.message)).toEqual(['first', 'second']);
  });

  it('BR-60h: assignment accepts a live ticket admin and rejects a farmer, a disabled admin, an unknown id and a closed ticket', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const adminUserId = await makeAdmin();
    const admin = adminScope(adminUserId);
    const { ticketId } = await newTicket(farmer);

    const assigned = await supportTicketsService.assignTicket(admin, ticketId, { assignedToUserId: adminUserId });
    expect(assigned.ticket.assignedToUserId).toBe(adminUserId);

    const ineligible = [
      farmer.userId, // an active user without the ticket permission
      await makeAdmin('TOHFA_ADMIN', 'DISABLED'),
      await makeAdmin('FARMER_ADMIN'), // admin role that does not hold support.ticket.manage_any
      newId(), // no such user: must be a 422, not a foreign-key 500
    ];
    for (const assignedToUserId of ineligible) {
      await expect(supportTicketsService.assignTicket(admin, ticketId, { assignedToUserId })).rejects.toThrow(
        expect.objectContaining({ status: 422, code: 'VALIDATION_FAILED' }),
      );
    }

    await supportTicketsService.transitionStatus(admin, ticketId, { status: 'CLOSED' });
    await expect(supportTicketsService.assignTicket(admin, ticketId, { assignedToUserId: adminUserId })).rejects.toThrow(
      expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('BR-60g: the real farmer and admin responses differ - no staff identity for the farmer', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const adminUserId = await makeAdmin();
    const admin = adminScope(adminUserId);
    const { scope, ticketId } = await newTicket(farmer);
    await supportTicketsService.assignTicket(admin, ticketId, { assignedToUserId: adminUserId });
    await supportTicketsService.addAdminMessage(admin, ticketId, { message: 'staff reply' });

    const mine = await supportTicketsService.getMyTicket(scope, ticketId);
    expect(mine.ticket).not.toHaveProperty('assignedToUserId');
    expect(mine.messages[0]).toMatchObject({ senderRole: 'SUPPORT' });
    expect(mine.messages[0]).not.toHaveProperty('senderUserId');
    expect(JSON.stringify(mine)).not.toContain(adminUserId);

    const theirs = await supportTicketsService.getAdminTicket(admin, ticketId);
    expect(theirs.ticket.assignedToUserId).toBe(adminUserId);
    expect(theirs.messages[0]).toMatchObject({ senderRole: 'TOHFA_ADMIN', senderUserId: adminUserId });
  });

  it('BR-60i: the stored audit rows hold no ticket or message text', async (ctx) => {
    if (!ready) return ctx.skip();
    const farmer = await makeFarmer();
    const { scope, ticketId } = await newTicket(farmer);
    const secret = `SECRET-${rand()}`;
    await supportTicketsService.addMyTicketMessage(scope, ticketId, { message: secret });

    const rows = await pool.query<{ before: unknown; after: unknown }>(
      `SELECT before, after FROM audit_log WHERE entity_type IN ('support_ticket', 'support_ticket_message')
         AND (entity_id::text = $1 OR after->>'ticketId' = $1)`,
      [ticketId],
    );
    expect(rows.rowCount).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(rows.rows)).not.toContain(secret);
    expect(JSON.stringify(rows.rows)).not.toContain('integration ticket body');
  });
});
