/**
 * Customer support tickets. All business logic; takes a ResolvedScope, never a Request.
 *
 *  - own rows only: every read and write is keyed by `scope.customerId`; another customer's id is a
 *    404 (never 403), same as any missing id (BR-36).
 *  - BR-97 / BR-16: customer-authored text (subject, description, message) that names a farmer or farm
 *    is REFUSED 422; staff text read back is redacted (`[redacted]`, `redacted: true`) and internal
 *    notes are excluded in SQL.
 *  - a CLOSED ticket takes no further messages: 409 CONFLICT (same wording as the admin reply).
 *  - photos come through the existing upload flow: the upload must be the caller's own and signed
 *    with purpose ISSUE_PHOTO (EXIF/GPS stripped at upload, BR-16).
 *  - the status vocabulary is the API's: DB INVESTIGATING reads as IN_PROGRESS.
 */
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { defaultBlobStorage } from '../../storage/blobStorage.js';
import { UploadPurpose, uploadPurposeOfStorageKey } from '../uploads/uploads.schema.js';
import type { Redactor } from '../customers/customers.policy.js';
import {
  customerSupportRepo,
  type CustomerSupportRepo,
  type MessageDbRow,
  type TicketDbRow,
} from './customer-support.repo.js';
import {
  buildFarmerRedactor,
  refuseFarmerIdentity,
  type FarmerIdentityLookup,
} from './farmerRedaction.js';
import type {
  CreateTicketBody,
  CustomerTicketDetail,
  CustomerTicketList,
  CustomerTicketMessage,
  CustomerTicketSummary,
  ListTicketsQuery,
  SendMessageBody,
  TicketCategory,
  TicketStatus,
} from './customer-support.schema.js';

export interface CustomerSupportService {
  createTicket(scope: ResolvedScope, body: CreateTicketBody): Promise<CustomerTicketDetail>;
  listTickets(scope: ResolvedScope, query: ListTicketsQuery): Promise<CustomerTicketList>;
  getTicket(scope: ResolvedScope, ticketId: string): Promise<CustomerTicketDetail>;
  addMessage(scope: ResolvedScope, ticketId: string, body: SendMessageBody): Promise<CustomerTicketMessage>;
}

export interface CustomerSupportDeps {
  repo: CustomerSupportRepo;
  db: Executor;
  transaction: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
  publicUrl: (storageKey: string) => string;
  identityLookup?: FarmerIdentityLookup;
}

const ticketNotFound = (): AppError => new AppError('NOT_FOUND', { detail: 'No support ticket with that id.' });

function requireCustomerId(scope: ResolvedScope): string {
  if (scope.customerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'Support tickets are available to customers only.' });
  }
  return scope.customerId;
}

const apiStatus = (dbStatus: string): TicketStatus =>
  (dbStatus === 'INVESTIGATING' ? 'IN_PROGRESS' : dbStatus) as TicketStatus;

export function createCustomerSupportService(deps: Partial<CustomerSupportDeps> = {}): CustomerSupportService {
  const repo = deps.repo ?? customerSupportRepo;
  const db = deps.db ?? pool;
  const transaction = deps.transaction ?? ((fn) => withTransaction(fn));
  const publicUrl = deps.publicUrl ?? ((key: string) => defaultBlobStorage.getPublicUrl(key));

  function summary(row: TicketDbRow, redactor: Redactor): CustomerTicketSummary {
    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      orderId: row.order_id,
      category: row.category as TicketCategory,
      subject: redactor.redact(row.subject).text,
      description: redactor.redact(row.description ?? '').text,
      photos: (row.photo_keys ?? []).map(publicUrl),
      status: apiStatus(row.status),
      messageCount: Number(row.message_count),
      resolvedAt: row.resolved_at === null ? null : row.resolved_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  function message(row: MessageDbRow, redactor: Redactor): CustomerTicketMessage {
    const redacted = redactor.redact(row.body);
    return {
      id: row.id,
      ticketId: row.ticket_id,
      // Staff identity and role never reach a customer: two labels only.
      sender: row.from_customer ? 'CUSTOMER' : 'SUPPORT',
      message: redacted.text,
      attachmentUrl: row.attachment_key === null ? null : publicUrl(row.attachment_key),
      redacted: redacted.changed,
      createdAt: row.created_at.toISOString(),
    };
  }

  /** The caller's own ISSUE_PHOTO uploads, as storage keys; 422 for anything else. */
  async function resolvePhotos(executor: Executor, userId: string, uploadIds: string[]): Promise<string[]> {
    if (uploadIds.length === 0) return [];
    const unique = [...new Set(uploadIds)];
    const found = await repo.findUploads(executor, unique);
    const byId = new Map(found.map((u) => [u.id, u]));
    return unique.map((id) => {
      const upload = byId.get(id);
      if (upload === undefined || upload.uploadedBy !== userId) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'A photo does not reference an upload you own.',
          errors: { 'body.photoUploadIds': ['Must be uploads you signed yourself.'] },
        });
      }
      if (uploadPurposeOfStorageKey(upload.storageKey) !== UploadPurpose.ISSUE_PHOTO) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'A photo must be an upload signed with purpose ISSUE_PHOTO.',
          errors: { 'body.photoUploadIds': ['Must be ISSUE_PHOTO uploads.'] },
        });
      }
      return upload.storageKey;
    });
  }

  async function detail(executor: Executor, customerId: string, row: TicketDbRow): Promise<CustomerTicketDetail> {
    const redactor = await buildFarmerRedactor(executor, customerId, row.order_id === null ? [] : [row.order_id], deps.identityLookup);
    const messages = await repo.listMessages(executor, [row.id]);
    return { ...summary(row, redactor), messageCount: messages.length, messages: messages.map((m) => message(m, redactor)) };
  }

  return {
    async createTicket(scope, body) {
      const customerId = requireCustomerId(scope);
      return transaction(async (tx) => {
        if (body.orderId !== undefined && !(await repo.orderBelongsToCustomer(tx, customerId, body.orderId))) {
          throw new AppError('NOT_FOUND', { detail: 'No order with that id.' });
        }
        const redactor = await buildFarmerRedactor(tx, customerId, body.orderId === undefined ? [] : [body.orderId], deps.identityLookup);
        refuseFarmerIdentity(redactor, { 'body.subject': body.subject, 'body.description': body.description });
        const photoKeys = await resolvePhotos(tx, scope.userId, body.photoUploadIds);
        const row = await repo.createTicket(tx, customerId, {
          category: body.category,
          subject: body.subject,
          description: body.description,
          orderId: body.orderId ?? null,
          photoKeys,
        });
        return detail(tx, customerId, row);
      });
    },

    async listTickets(scope, query) {
      const customerId = requireCustomerId(scope);
      const { rows, total } = await repo.listTickets(db, customerId, query);
      const orderIds = rows.flatMap((r) => (r.order_id === null ? [] : [r.order_id]));
      const redactor = await buildFarmerRedactor(db, customerId, orderIds, deps.identityLookup);
      return { items: rows.map((r) => summary(r, redactor)), total, page: query.page, limit: query.limit };
    },

    async getTicket(scope, ticketId) {
      const customerId = requireCustomerId(scope);
      const row = await repo.findTicket(db, customerId, ticketId);
      if (row === null) throw ticketNotFound();
      return detail(db, customerId, row);
    },

    async addMessage(scope, ticketId, body) {
      const customerId = requireCustomerId(scope);
      return transaction(async (tx) => {
        const row = await repo.findTicket(tx, customerId, ticketId, true);
        if (row === null) throw ticketNotFound();
        if (row.status === 'CLOSED') {
          throw new AppError('CONFLICT', { detail: 'The ticket is closed; a closed ticket takes no further messages.' });
        }
        const redactor = await buildFarmerRedactor(tx, customerId, row.order_id === null ? [] : [row.order_id], deps.identityLookup);
        refuseFarmerIdentity(redactor, { 'body.message': body.message });
        const [attachmentKey] = await resolvePhotos(
          tx,
          scope.userId,
          body.attachmentUploadId === undefined ? [] : [body.attachmentUploadId],
        );
        const stored = await repo.insertMessage(tx, {
          ticketId: row.id,
          senderUserId: scope.userId,
          body: body.message,
          attachmentKey: attachmentKey ?? null,
        });
        await repo.touchTicket(tx, row.id);
        return message(stored, redactor);
      });
    },
  };
}

export const customerSupportService = createCustomerSupportService();
