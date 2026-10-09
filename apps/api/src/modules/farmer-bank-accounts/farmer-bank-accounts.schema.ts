import { z } from 'zod';

export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const upiVpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
export const accountNumberRegex = /^[0-9]{9,18}$/;
export const accountLast4Regex = /^[0-9]{4}$/;

// Zod is the single source of format validation (BR-53b); the service trusts
// what it is handed. IFSC is upper-cased BEFORE the regex so a farmer typing
// "hdfc0001234" on a phone keyboard is accepted and stored canonically.
const ifscField = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(ifscRegex, 'Invalid IFSC format'));

const accountNumberField = z
  .string()
  .trim()
  .regex(accountNumberRegex, 'Account number must be 9 to 18 digits');

export const createFarmerBankAccountBody = z
  .object({
    accountHolderName: z.string().trim().min(2).max(120),
    accountNumber: accountNumberField,
    ifsc: ifscField,
    bankName: z.string().trim().min(2).max(120),
    branchName: z.string().trim().max(120).optional(),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export type CreateFarmerBankAccountBody = z.infer<typeof createFarmerBankAccountBody>;

export const updateFarmerBankAccountBody = z
  .object({
    accountHolderName: z.string().trim().min(2).max(120).optional(),
    accountNumber: accountNumberField.optional(),
    ifsc: ifscField.optional(),
    bankName: z.string().trim().min(2).max(120).optional(),
    branchName: z.string().trim().max(120).nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type UpdateFarmerBankAccountBody = z.infer<typeof updateFarmerBankAccountBody>;

export const farmerBankAccountIdParam = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const farmerBankAccountResponse = z.object({
  id: z.string().uuid(),
  accountHolderName: z.string(),
  accountNumberLast4: z.string().regex(accountLast4Regex).nullable(),
  ifsc: z.string().nullable(),
  // Nullable in the table, and always NULL on a UPI row (we do not invent a bank name).
  bankName: z.string().nullable(),
  branchName: z.string().nullable(),
  upiVpa: z.string().nullable(),
  isVerified: z.boolean(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});

export type FarmerBankAccountResponse = z.infer<typeof farmerBankAccountResponse>;

// `isDefault` has no Zod default on purpose: an omitted flag must leave an
// existing default alone rather than silently demote it.
export const updateFarmerUpiBody = z
  .object({
    upiVpa: z.string().trim().regex(upiVpaRegex, 'Invalid UPI ID format'),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type UpdateFarmerUpiBody = z.infer<typeof updateFarmerUpiBody>;

export const farmerUpiResponse = z.object({
  id: z.string().uuid(),
  upiVpa: z.string(),
  isVerified: z.boolean(),
  isDefault: z.boolean(),
});

export type FarmerUpiResponse = z.infer<typeof farmerUpiResponse>;
