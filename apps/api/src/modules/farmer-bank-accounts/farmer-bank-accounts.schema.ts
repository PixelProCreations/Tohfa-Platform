import { z } from 'zod';

export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const upiVpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
export const accountLast4Regex = /^[0-9]{4}$/;

export const createFarmerBankAccountBody = z
  .object({
    accountHolderName: z.string().trim().min(2).max(120),
    accountNumber: z.string().trim().min(9).max(18),
    ifsc: z.string().trim().regex(ifscRegex, 'Invalid IFSC format'),
    bankName: z.string().trim().min(2).max(120),
    branchName: z.string().trim().max(120).optional(),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export type CreateFarmerBankAccountBody = z.input<typeof createFarmerBankAccountBody>;

export const updateFarmerBankAccountBody = z
  .object({
    accountHolderName: z.string().trim().min(2).max(120).optional(),
    accountNumber: z.string().trim().min(9).max(18).optional(),
    ifsc: z.string().trim().regex(ifscRegex, 'Invalid IFSC format').optional(),
    bankName: z.string().trim().min(2).max(120).optional(),
    branchName: z.string().trim().max(120).nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type UpdateFarmerBankAccountBody = z.input<typeof updateFarmerBankAccountBody>;

export const farmerBankAccountIdParam = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type FarmerBankAccountIdParam = z.infer<typeof farmerBankAccountIdParam>;

export const farmerBankAccountResponse = z.object({
  id: z.string().uuid(),
  accountHolderName: z.string(),
  accountNumberLast4: z.string().regex(accountLast4Regex).nullable(),
  ifsc: z.string().nullable(),
  bankName: z.string(),
  branchName: z.string().nullable(),
  upiVpa: z.string().nullable(),
  isVerified: z.boolean(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});

export type FarmerBankAccountResponse = z.infer<typeof farmerBankAccountResponse>;

export const updateFarmerUpiBody = z
  .object({
    upiVpa: z.string().trim().regex(upiVpaRegex, 'Invalid UPI ID format'),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export type UpdateFarmerUpiBody = z.input<typeof updateFarmerUpiBody>;

export const farmerUpiResponse = z.object({
  id: z.string().uuid().nullable().optional(),
  upiVpa: z.string(),
  isVerified: z.boolean(),
  isDefault: z.boolean(),
});

export type FarmerUpiResponse = z.infer<typeof farmerUpiResponse>;
