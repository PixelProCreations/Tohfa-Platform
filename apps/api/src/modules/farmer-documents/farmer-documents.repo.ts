import type { Executor } from '../../db/pool.js';

export interface FarmerRecord {
  id: string;
  userId: string;
  tohfaFarmerId: string;
  fullName: string;
  aadhaarLast4: string | null;
  kycStatus: string;
}

export interface FarmerApplicationRecord {
  id: string;
  userId: string | null;
  farmerId: string | null;
  status: string;
  step1Personal: Record<string, unknown> | null;
  step4Documents: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface FarmerDocumentRecord {
  id: string;
  farmerId: string;
  docType: string;
  storageKey: string;
  mimeType: string;
  isMandatory: boolean;
  verificationStatus: string;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface CertificationRecord {
  id: string;
  farmerId: string;
  certType: string;
  customTypeName: string | null;
  certNumber: string;
  documentId: string | null;
  documentUrl: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  expiresOn: string;
  createdAt: Date;
}

export const farmerDocumentsRepo = {
  async findFarmerByUserId(db: Executor, userId: string): Promise<FarmerRecord | null> {
    const res = await db.query<{
      id: string;
      user_id: string;
      tohfa_farmer_id: string;
      full_name: string;
      aadhaar_last4: string | null;
      kyc_status: string;
    }>(
      `SELECT id, user_id, tohfa_farmer_id, full_name, aadhaar_last4, kyc_status
       FROM farmers
       WHERE user_id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [userId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      tohfaFarmerId: row.tohfa_farmer_id,
      fullName: row.full_name,
      aadhaarLast4: row.aadhaar_last4,
      kycStatus: row.kyc_status,
    };
  },

  async findLatestApplicationByFarmerIdOrUserId(
    db: Executor,
    farmerId: string,
    userId: string,
  ): Promise<FarmerApplicationRecord | null> {
    const res = await db.query<{
      id: string;
      user_id: string | null;
      farmer_id: string | null;
      status: string;
      step1_personal: Record<string, unknown> | null;
      step4_documents: Record<string, unknown> | null;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `SELECT id, user_id, farmer_id, status, step1_personal, step4_documents, created_at, updated_at
       FROM farmer_applications
       WHERE farmer_id = $1 OR user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [farmerId, userId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      farmerId: row.farmer_id,
      status: row.status,
      step1Personal: row.step1_personal,
      step4Documents: row.step4_documents,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async findFarmerDocuments(db: Executor, farmerId: string): Promise<FarmerDocumentRecord[]> {
    const res = await db.query<{
      id: string;
      farmer_id: string;
      doc_type: string;
      storage_key: string;
      mime_type: string;
      is_mandatory: boolean;
      verification_status: string;
      verified_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, farmer_id, doc_type, storage_key, mime_type, is_mandatory, verification_status, verified_at, created_at
       FROM farmer_documents
       WHERE farmer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [farmerId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      farmerId: r.farmer_id,
      docType: r.doc_type,
      storageKey: r.storage_key,
      mimeType: r.mime_type,
      isMandatory: r.is_mandatory,
      verificationStatus: r.verification_status,
      verifiedAt: r.verified_at,
      createdAt: r.created_at,
    }));
  },

  async findCertifications(db: Executor, farmerId: string): Promise<CertificationRecord[]> {
    const res = await db.query<{
      id: string;
      farmer_id: string;
      cert_type: string;
      custom_type_name: string | null;
      cert_number: string;
      document_id: string | null;
      document_url: string | null;
      is_verified: boolean;
      verified_at: Date | null;
      expires_on: string;
      created_at: Date;
    }>(
      `SELECT id, farmer_id, cert_type, custom_type_name, cert_number, document_id, document_url, is_verified, verified_at, expires_on, created_at
       FROM certifications
       WHERE farmer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [farmerId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      farmerId: r.farmer_id,
      certType: r.cert_type,
      customTypeName: r.custom_type_name,
      certNumber: r.cert_number,
      documentId: r.document_id,
      documentUrl: r.document_url,
      isVerified: r.is_verified,
      verifiedAt: r.verified_at,
      expiresOn: r.expires_on,
      createdAt: r.created_at,
    }));
  },
};

export type FarmerDocumentsRepo = typeof farmerDocumentsRepo;
