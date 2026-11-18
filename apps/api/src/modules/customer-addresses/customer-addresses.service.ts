/**
 * Customer delivery addresses (BR-160).
 *
 *  - Own data only: every read and write is keyed on the scope's customerId. An
 *    unknown, deleted or other customer's address is the same 404 (BR-36).
 *  - Exactly one live default per customer. The partial unique index
 *    uq_customer_addresses_default would reject two, so the old default is
 *    cleared before the new one is set, in one transaction, and
 *    customers.default_address_id is kept in step.
 *  - Delete is soft (deleted_at). Orders keep pointing at the row they used, so
 *    an order's delivery address is never rewritten by an address edit later.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { customerAddressesRepo, type CustomerAddressesRepo } from './customer-addresses.repo.js';
import type {
  CreateAddressBody,
  CustomerAddress,
  ListAddressesResponse,
  UpdateAddressBody,
} from './customer-addresses.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CustomerAddressesServiceDeps {
  repo: CustomerAddressesRepo;
  db: Executor;
  transaction: TransactionRunner;
}

export interface CustomerAddressesService {
  list(scope: ResolvedScope): Promise<ListAddressesResponse>;
  get(scope: ResolvedScope, addressId: string): Promise<CustomerAddress>;
  create(scope: ResolvedScope, body: CreateAddressBody): Promise<CustomerAddress>;
  update(scope: ResolvedScope, addressId: string, body: UpdateAddressBody): Promise<CustomerAddress>;
  remove(scope: ResolvedScope, addressId: string): Promise<void>;
  setDefault(scope: ResolvedScope, addressId: string): Promise<CustomerAddress>;
}

async function assertPickupPoint(repo: CustomerAddressesRepo, db: Executor, id: string | null | undefined): Promise<void> {
  if (id == null) return;
  if (!(await repo.pickupPointExists(db, id))) {
    throw new AppError('VALIDATION_FAILED', {
      detail: 'nearestPickupPointId is not an active pickup point.',
      errors: { nearestPickupPointId: ['unknown or inactive pickup point'] },
    });
  }
}

function notFound(addressId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No address with id ${addressId} is visible to you.` });
}

/** Only a customer has addresses. A scope without a customer is a 404 on every id, not a 403. */
function customerOf(scope: ResolvedScope): string | null {
  return scope.customerId ?? null;
}

export function createCustomerAddressesService(
  deps: Partial<CustomerAddressesServiceDeps> = {},
): CustomerAddressesService {
  const repo = deps.repo ?? customerAddressesRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));

  return {
    async list(scope) {
      const customerId = customerOf(scope);
      if (customerId === null) return { items: [] };
      return { items: await repo.list(db, customerId) };
    },

    async get(scope, addressId) {
      const customerId = customerOf(scope);
      const row = customerId === null ? null : await repo.findOwn(db, customerId, addressId);
      if (row === null) throw notFound(addressId);
      return row;
    },

    async create(scope, body) {
      const customerId = customerOf(scope);
      if (customerId === null) {
        throw new AppError('FORBIDDEN', { detail: 'Only a customer account has delivery addresses.' });
      }
      await assertPickupPoint(repo, db, body.nearestPickupPointId);
      return transaction(async (tx) => {
        // The first address becomes the default whatever the client asked.
        const makeDefault = body.isDefault || (await repo.countLive(tx, customerId)) === 0;
        if (makeDefault) await repo.clearDefault(tx, customerId);
        const created = await repo.insert(tx, customerId, {
          label: body.label,
          line1: body.line1,
          line2: body.line2 ?? null,
          city: body.city,
          district: body.district ?? null,
          state: body.state,
          pincode: body.pincode,
          lat: body.lat ?? null,
          lng: body.lng ?? null,
          landmark: body.landmark ?? null,
          contactPhone: body.contactPhone ?? null,
          nearestPickupPointId: body.nearestPickupPointId ?? null,
        });
        if (!makeDefault) return created;
        await repo.markDefault(tx, customerId, created.id);
        await repo.setCustomerDefault(tx, customerId, created.id);
        return { ...created, isDefault: true };
      });
    },

    async update(scope, addressId, body) {
      const customerId = customerOf(scope);
      await assertPickupPoint(repo, db, body.nearestPickupPointId);
      const row = customerId === null ? null : await repo.update(db, customerId, addressId, body);
      if (row === null) throw notFound(addressId);
      return row;
    },

    async remove(scope, addressId) {
      const customerId = customerOf(scope);
      if (customerId === null) throw notFound(addressId);
      await transaction(async (tx) => {
        const current = await repo.findOwn(tx, customerId, addressId);
        if (current === null) throw notFound(addressId);
        await repo.softDelete(tx, customerId, addressId);
        // A deleted default leaves the customer with no default; we do not guess a new one.
        if (current.isDefault) await repo.setCustomerDefault(tx, customerId, null);
      });
    },

    async setDefault(scope, addressId) {
      const customerId = customerOf(scope);
      if (customerId === null) throw notFound(addressId);
      return transaction(async (tx) => {
        const current = await repo.findOwn(tx, customerId, addressId);
        if (current === null) throw notFound(addressId);
        if (!current.isDefault) {
          await repo.clearDefault(tx, customerId);
          await repo.markDefault(tx, customerId, addressId);
        }
        await repo.setCustomerDefault(tx, customerId, addressId);
        return { ...current, isDefault: true };
      });
    },
  };
}

export const customerAddressesService: CustomerAddressesService = createCustomerAddressesService();
