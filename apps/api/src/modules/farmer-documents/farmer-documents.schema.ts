import { z } from 'zod';

export const farmerDocumentItemSchema = z.object({
  docType: z.string(),
  displayName: z.string(),
  uploadStatus: z.string(),
  readUrl: z.string().nullable(),
  fileName: z.string().nullable().optional(),
  docSubType: z.string().nullable().optional(),
  documentNumberLast4: z.string().nullable().optional(),
  uploadedAt: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
});

export type FarmerDocumentItem = z.infer<typeof farmerDocumentItemSchema>;

export const farmerProfileDocumentsResponseSchema = z.object({
  documents: z.array(farmerDocumentItemSchema),
});

export type FarmerProfileDocumentsResponse = z.infer<typeof farmerProfileDocumentsResponseSchema>;
