/**
 * Typed API client for a farmer's own payout destinations: bank accounts and the
 * UPI id (BR-53). Every route is `/farmers/me/...`, so the caller is identified
 * by the token and no farmer id ever travels in the request.
 *
 * Field names match docs/openapi.yaml (FarmerBankAccount, FarmerUpiPreference and
 * their request bodies) verbatim. None of these endpoints move money, so none takes
 * an Idempotency-Key.
 */
import { api } from '../../../shell/api/client';

/** Account numbers are never returned in full (BR-53a): only the last four digits. */
export interface FarmerBankAccount {
  id: string;
  accountHolderName: string;
  accountNumberLast4: string | null;
  ifsc: string | null;
  bankName: string | null;
  branchName: string | null;
  upiVpa: string | null;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateFarmerBankAccountInput {
  accountHolderName: string;
  /** Digits only, 9 to 18. Only the last four are kept by the server. */
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branchName?: string | undefined;
  isDefault?: boolean | undefined;
}

export interface UpdateFarmerBankAccountInput {
  accountHolderName?: string | undefined;
  accountNumber?: string | undefined;
  ifsc?: string | undefined;
  bankName?: string | undefined;
  branchName?: string | null | undefined;
  isDefault?: boolean | undefined;
}

export interface FarmerUpiPreference {
  id: string;
  upiVpa: string;
  isVerified: boolean;
  isDefault: boolean;
}

export interface SetFarmerUpiInput {
  upiVpa: string;
  /** Applied only when sent; omitted keeps the current default flag. */
  isDefault?: boolean | undefined;
}

export async function listMyBankAccounts(): Promise<FarmerBankAccount[]> {
  return await api.get<FarmerBankAccount[]>('/farmers/me/bank-accounts');
}

export async function createMyBankAccount(
  input: CreateFarmerBankAccountInput,
): Promise<FarmerBankAccount> {
  return await api.post<FarmerBankAccount>('/farmers/me/bank-accounts', input);
}

export async function updateMyBankAccount(
  id: string,
  input: UpdateFarmerBankAccountInput,
): Promise<FarmerBankAccount> {
  return await api.patch<FarmerBankAccount>(
    `/farmers/me/bank-accounts/${encodeURIComponent(id)}`,
    input,
  );
}

/** Rejects with a 404 ApiError when the farmer has no UPI id registered. */
export async function getMyUpiPreference(): Promise<FarmerUpiPreference> {
  return await api.get<FarmerUpiPreference>('/farmers/me/upi');
}

export async function setMyUpiPreference(input: SetFarmerUpiInput): Promise<FarmerUpiPreference> {
  return await api.put<FarmerUpiPreference>('/farmers/me/upi', input);
}
