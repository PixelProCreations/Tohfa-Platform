import { z } from 'zod';

/** docs/openapi.yaml FarmerDocumentItem.uploadStatus. */
export const DOCUMENT_UPLOAD_STATUSES = ['VERIFIED', 'UPLOADED', 'PENDING', 'ACTION_NEEDED'] as const;
export type DocumentUploadStatus = (typeof DOCUMENT_UPLOAD_STATUSES)[number];

export const farmerDocumentItemSchema = z.object({
  docType: z.string(),
  displayName: z.string(),
  uploadStatus: z.enum(DOCUMENT_UPLOAD_STATUSES),
  readUrl: z.string().nullable(),
  fileName: z.string().nullable().optional(),
  docSubType: z.string().nullable().optional(),
  // BR-54b: the response type itself refuses anything but four digits.
  documentNumberLast4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .nullable()
    .optional(),
  uploadedAt: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
});

export type FarmerDocumentItem = z.infer<typeof farmerDocumentItemSchema>;

export const farmerProfileDocumentsResponseSchema = z.object({
  documents: z.array(farmerDocumentItemSchema),
});

export type FarmerProfileDocumentsResponse = z.infer<typeof farmerProfileDocumentsResponseSchema>;

/**
 * One entry of farmer_applications.step4_documents.documents. That column is
 * unvalidated JSONB written from the client, so each entry is parsed
 * defensively here and anything that does not fit is ignored.
 */
export const storedApplicationDocumentSchema = z.object({
  docType: z.string(),
  fileUrl: z.string(),
  fileName: z.string().optional(),
  docSubType: z.string().optional(),
});

export type StoredApplicationDocument = z.infer<typeof storedApplicationDocumentSchema>;

/** farmer_applications.step1_personal: only the masked Aadhaar value is ever read. */
export const aadhaarLast4Schema = z.string().regex(/^[0-9]{4}$/);
