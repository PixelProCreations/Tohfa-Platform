import { posix } from 'node:path';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { defaultBlobStorage, type BlobStorage } from '../../storage/blobStorage.js';
import {
  farmerDocumentsRepo,
  type ApplicationUploadRecord,
  type FarmerDocumentsRepo,
} from './farmer-documents.repo.js';
import {
  aadhaarLast4Schema,
  storedApplicationDocumentSchema,
  type FarmerDocumentItem,
  type FarmerProfileDocumentsResponse,
  type StoredApplicationDocument,
} from './farmer-documents.schema.js';

/** BR-54c: a signed read URL lives for this long. */
const READ_URL_TTL_MINUTES = 15;

/** The only place a user-facing document label lives. */
const DOCUMENT_LABELS = {
  ID_PROOF: 'Aadhaar Card',
  LAND_PATTA: 'Land Patta / FMB Map',
  CERTIFICATE: 'PGS Scope Certificate',
  SOIL_CARD: 'Annual Soil & Water Health Card',
  OTHER: 'Other Document',
} as const;

/** What a standard slot shows once its file has been located and proven to be the farmer's. */
interface LocatedFile {
  storageKey: string;
  fileName: string | null;
  docSubType: string | null;
  uploadedAt: Date;
  verifiedAt: Date | null;
  /** True only when a human-verified record exists for this exact file. */
  verified: boolean;
}

/** A step4 application document whose file is proven to be one of this application's uploads. */
interface ApplicationFile extends LocatedFile {
  docType: string;
}

export interface FarmerDocumentsServiceDeps {
  repo?: FarmerDocumentsRepo;
  db?: Executor;
  storage?: BlobStorage;
}

function withoutQueryOrFragment(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

/**
 * step4_documents is unvalidated client JSON, so a file URL in it proves
 * nothing. A document is accepted only when its URL is the public URL of a file
 * in the uploads table recorded against THIS farmer's application, and the key
 * that gets signed is the one from that uploads row, never one parsed out of
 * the supplied URL. Anything else is dropped.
 */
function locateApplicationFiles(
  step4Documents: Record<string, unknown> | null,
  uploads: ApplicationUploadRecord[],
  storage: BlobStorage,
): ApplicationFile[] {
  const listed: unknown = step4Documents?.['documents'];
  if (!Array.isArray(listed)) return [];

  const uploadByPublicUrl = new Map(uploads.map((u) => [storage.getPublicUrl(u.storageKey), u]));
  const files: ApplicationFile[] = [];
  for (const entry of listed) {
    const parsed = storedApplicationDocumentSchema.safeParse(entry);
    if (!parsed.success) continue;
    const doc: StoredApplicationDocument = parsed.data;
    const upload = uploadByPublicUrl.get(withoutQueryOrFragment(doc.fileUrl));
    if (upload === undefined) continue;
    files.push({
      docType: doc.docType,
      storageKey: upload.storageKey,
      fileName: doc.fileName ?? null,
      docSubType: doc.docSubType ?? null,
      uploadedAt: upload.createdAt,
      verifiedAt: null,
      verified: false,
    });
  }
  return files;
}

export function createFarmerDocumentsService(deps: FarmerDocumentsServiceDeps = {}) {
  const repo = deps.repo ?? farmerDocumentsRepo;
  const db = deps.db ?? pool;
  const storage = deps.storage ?? defaultBlobStorage;

  async function toItem(
    docType: string,
    displayName: string,
    file: LocatedFile | null,
    extras: { documentNumberLast4?: string | null } = {},
  ): Promise<FarmerDocumentItem> {
    return {
      docType,
      displayName,
      uploadStatus: file === null ? 'PENDING' : file.verified ? 'VERIFIED' : 'UPLOADED',
      readUrl: file === null ? null : await storage.generateReadUrl(file.storageKey, READ_URL_TTL_MINUTES),
      fileName: file?.fileName ?? null,
      docSubType: file?.docSubType ?? null,
      uploadedAt: file?.uploadedAt.toISOString() ?? null,
      verifiedAt: file?.verified === true ? (file.verifiedAt?.toISOString() ?? null) : null,
      ...extras,
    };
  }

  return {
    async getMyDocuments(actor: Actor): Promise<FarmerProfileDocumentsResponse> {
      const farmer = await repo.findFarmerByUserId(db, actor.userId);
      if (!farmer) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found' });
      }

      // Sequential on purpose: `db` may be a single transaction client, which
      // must not run overlapping queries.
      const application = await repo.findLatestApplicationByFarmerIdOrUserId(db, farmer.id, actor.userId);
      const documentRows = await repo.findFarmerDocuments(db, farmer.id);
      const certifications = await repo.findCertifications(db, farmer.id);
      const uploads = application ? await repo.findApplicationUploads(db, application.id) : [];
      const applicationFiles = application
        ? locateApplicationFiles(application.step4Documents, uploads, storage)
        : [];

      // BR-54b: the profile value wins; the application's masked value is the
      // fallback. A full number is never read, so it cannot be returned.
      const profileLast4 = aadhaarLast4Schema.safeParse(farmer.aadhaarLast4);
      const applicationLast4 = aadhaarLast4Schema.safeParse(application?.step1Personal?.['aadhaarLast4']);
      const aadhaarLast4 = profileLast4.success
        ? profileLast4.data
        : applicationLast4.success
          ? applicationLast4.data
          : null;

      // A farmer_documents row is the only place a file's verification lives,
      // so it is preferred over the unverified application upload of the same type.
      const fromRow = (docType: string): LocatedFile | null => {
        const row = documentRows.filter((r) => r.docType === docType).at(-1);
        if (row === undefined) return null;
        return {
          storageKey: row.storageKey,
          fileName: posix.basename(row.storageKey),
          docSubType: null,
          uploadedAt: row.createdAt,
          verifiedAt: row.verifiedAt,
          verified: row.verificationStatus === 'VERIFIED',
        };
      };

      const claimed = new Set<ApplicationFile>();
      const slotFile = (docType: string): LocatedFile | null => {
        const applicationFile = applicationFiles.find((f) => f.docType === docType);
        if (applicationFile !== undefined) claimed.add(applicationFile);
        return fromRow(docType) ?? applicationFile ?? null;
      };

      const idProof = slotFile('ID_PROOF');
      const farmDocument = slotFile('FARM_DOC');

      // The certificate slot shows the first certificate (oldest first) and its
      // own file; it is VERIFIED only through that certificate's verification.
      const certificate = certifications[0];
      const certificateApplicationFile = applicationFiles.find((f) => f.docType === 'CERTIFICATE');
      if (certificateApplicationFile !== undefined) claimed.add(certificateApplicationFile);
      const certificateKey = certificate?.documentStorageKey ?? null;
      const certificateFile: LocatedFile | null =
        certificate !== undefined && certificateKey !== null && certificate.documentUploadedAt !== null
          ? {
              storageKey: certificateKey,
              fileName: posix.basename(certificateKey),
              docSubType: certificate.certType,
              uploadedAt: certificate.documentUploadedAt,
              verifiedAt: certificate.verifiedAt,
              verified: certificate.verificationStatus === 'VERIFIED',
            }
          : (certificateApplicationFile ?? null);

      const documents: FarmerDocumentItem[] = [
        await toItem('ID_PROOF', DOCUMENT_LABELS.ID_PROOF, idProof, { documentNumberLast4: aadhaarLast4 }),
        await toItem('LAND_PATTA', DOCUMENT_LABELS.LAND_PATTA, farmDocument),
        await toItem('CERTIFICATE', certificate?.customTypeName ?? DOCUMENT_LABELS.CERTIFICATE, certificateFile),
        // No document type or upload purpose in farmer_documents or in the
        // application's documents identifies a soil card, so nothing can prove
        // one has been uploaded. The slot stays a call to action.
        {
          docType: 'SOIL_CARD',
          displayName: DOCUMENT_LABELS.SOIL_CARD,
          uploadStatus: 'ACTION_NEEDED',
          readUrl: null,
          fileName: null,
          docSubType: null,
          uploadedAt: null,
          verifiedAt: null,
        },
      ];

      // Every other recognised application upload is listed, never dropped.
      for (const file of applicationFiles) {
        if (claimed.has(file)) continue;
        documents.push(await toItem(file.docType, file.docSubType ?? file.fileName ?? DOCUMENT_LABELS.OTHER, file));
      }

      return { documents };
    },
  };
}

export const farmerDocumentsService = createFarmerDocumentsService();
