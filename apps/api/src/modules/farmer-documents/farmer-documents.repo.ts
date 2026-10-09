import type { Executor } from '../../db/pool.js';

export interface FarmerRecord {
  id: string;
  aadhaarLast4: string | null;
}

export interface FarmerApplicationRecord {
  id: string;
  step1Personal: Record<string, unknown> | null;
  step4Documents: Record<string, unknown> | null;
}

/** A file uploaded against the farmer's registration application (uploads table). */
export interface ApplicationUploadRecord {
  storageKey: string;
  createdAt: Date;
}

export interface FarmerDocumentRecord {
  id: string;
  docType: string;
  storageKey: string;
  verificationStatus: string;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface CertificationRecord {
  id: string;
  certType: string;
  customTypeName: string | null;
  verificationStatus: string;
  verifiedAt: Date | null;
  /** Storage key of the farmer_documents row the certificate points at; null when none. */
  documentStorageKey: string | null;
  documentUploadedAt: Date | null;
}

export interface FarmerDocumentsRepo {
  findFarmerByUserId(db: Executor, userId: string): Promise<FarmerRecord | null>;
  /**
   * The newest not-deleted application that belongs to this farmer, matched by
   * the farmer id it was linked to on approval or by the applicant's user id.
   */
  findLatestApplicationByFarmerIdOrUserId(
    db: Executor,
    farmerId: string,
    userId: string,
  ): Promise<FarmerApplicationRecord | null>;
  /**
   * The files recorded as uploaded against one application. This is the only
   * proof that a file URL kept inside the application's step4_documents JSON
   * (which no schema constrains) really is a file this application uploaded.
   */
  findApplicationUploads(db: Executor, applicationId: string): Promise<ApplicationUploadRecord[]>;
  findFarmerDocuments(db: Executor, farmerId: string): Promise<FarmerDocumentRecord[]>;
  findCertifications(db: Executor, farmerId: string): Promise<CertificationRecord[]>;
}

export const farmerDocumentsRepo: FarmerDocumentsRepo = {
  async findFarmerByUserId(db, userId) {
    const res = await db.query<{ id: string; aadhaar_last4: string | null }>(
      `SELECT id, aadhaar_last4
         FROM farmers
        WHERE user_id = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [userId],
    );
    const row = res.rows[0];
    return row ? { id: row.id, aadhaarLast4: row.aadhaar_last4 } : null;
  },

  async findLatestApplicationByFarmerIdOrUserId(db, farmerId, userId) {
    const res = await db.query<{
      id: string;
      step1_personal: Record<string, unknown> | null;
      step4_documents: Record<string, unknown> | null;
    }>(
      `SELECT id, step1_personal, step4_documents
         FROM farmer_applications
        WHERE (farmer_id = $1 OR user_id = $2) AND deleted_at IS NULL
        ORDER BY created_at DESC, id DESC
        LIMIT 1`,
      [farmerId, userId],
    );
    const row = res.rows[0];
    return row
      ? { id: row.id, step1Personal: row.step1_personal, step4Documents: row.step4_documents }
      : null;
  },

  async findApplicationUploads(db, applicationId) {
    const res = await db.query<{ storage_key: string; created_at: Date }>(
      `SELECT storage_key, created_at
         FROM uploads
        WHERE entity_type = 'farmer_application' AND entity_id = $1 AND deleted_at IS NULL
        ORDER BY created_at ASC, id ASC`,
      [applicationId],
    );
    return res.rows.map((r) => ({ storageKey: r.storage_key, createdAt: r.created_at }));
  },

  async findFarmerDocuments(db, farmerId) {
    const res = await db.query<{
      id: string;
      doc_type: string;
      storage_key: string;
      verification_status: string;
      verified_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, doc_type, storage_key, verification_status::text AS verification_status,
              verified_at, created_at
         FROM farmer_documents
        WHERE farmer_id = $1 AND deleted_at IS NULL
        ORDER BY created_at ASC, id ASC`,
      [farmerId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      docType: r.doc_type,
      storageKey: r.storage_key,
      verificationStatus: r.verification_status,
      verifiedAt: r.verified_at,
      createdAt: r.created_at,
    }));
  },

  async findCertifications(db, farmerId) {
    // The certificate's file is the farmer_documents row it points at, joined
    // the same way the certifications repo does. The join is restricted to the
    // same farmer and to a not-deleted row so a certificate can never surface
    // another farmer's or a removed file.
    const res = await db.query<{
      id: string;
      cert_type: string;
      custom_type_name: string | null;
      verification_status: string;
      verified_at: Date | null;
      document_storage_key: string | null;
      document_uploaded_at: Date | null;
    }>(
      `SELECT c.id, c.cert_type::text AS cert_type, c.custom_type_name,
              c.verification_status::text AS verification_status, c.verified_at,
              fd.storage_key AS document_storage_key, fd.created_at AS document_uploaded_at
         FROM certifications c
         LEFT JOIN farmer_documents fd
           ON fd.id = c.document_id AND fd.farmer_id = c.farmer_id AND fd.deleted_at IS NULL
        WHERE c.farmer_id = $1 AND c.deleted_at IS NULL
        ORDER BY c.created_at ASC, c.id ASC`,
      [farmerId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      certType: r.cert_type,
      customTypeName: r.custom_type_name,
      verificationStatus: r.verification_status,
      verifiedAt: r.verified_at,
      documentStorageKey: r.document_storage_key,
      documentUploadedAt: r.document_uploaded_at,
    }));
  },
};
