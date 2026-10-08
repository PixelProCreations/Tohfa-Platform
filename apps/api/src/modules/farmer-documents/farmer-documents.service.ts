import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { defaultBlobStorage, type BlobStorage } from '../../storage/blobStorage.js';
import {
  farmerDocumentsRepo,
  type FarmerDocumentsRepo,
} from './farmer-documents.repo.js';
import type {
  FarmerDocumentItem,
  FarmerProfileDocumentsResponse,
} from './farmer-documents.schema.js';

export interface FarmerDocumentsServiceDeps {
  repo?: FarmerDocumentsRepo;
  db?: Executor;
  storage?: BlobStorage;
}

export function createFarmerDocumentsService(deps: FarmerDocumentsServiceDeps = {}) {
  const repo = deps.repo ?? farmerDocumentsRepo;
  const db = deps.db ?? pool;
  const storage = deps.storage ?? defaultBlobStorage;

  async function resolveReadUrl(fileUrlOrKey: string | null | undefined): Promise<string | null> {
    if (!fileUrlOrKey) return null;

    // If it's a storage key (no URI protocol)
    if (!fileUrlOrKey.startsWith('http://') && !fileUrlOrKey.startsWith('https://')) {
      return storage.generateReadUrl(fileUrlOrKey, 15);
    }

    // If it's a URL pointing to /storage/<key>
    const storageMatch = fileUrlOrKey.match(/\/storage\/(.+)$/);
    if (storageMatch && storageMatch[1]) {
      const key = storageMatch[1].split('?')[0];
      if (key) return storage.generateReadUrl(key, 15);
    }

    // If it's a URL pointing to /mock/<key>
    const mockMatch = fileUrlOrKey.match(/\/mock\/(.+)$/);
    if (mockMatch && mockMatch[1]) {
      const key = mockMatch[1].split('?')[0];
      if (key) return storage.generateReadUrl(key, 15);
    }

    return fileUrlOrKey;
  }

  return {
    async getMyDocuments(actor: Actor): Promise<FarmerProfileDocumentsResponse> {
      const farmer = await repo.findFarmerByUserId(db, actor.userId);
      if (!farmer) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found' });
      }

      const [app, docRows, certRows] = await Promise.all([
        repo.findLatestApplicationByFarmerIdOrUserId(db, farmer.id, actor.userId),
        repo.findFarmerDocuments(db, farmer.id),
        repo.findCertifications(db, farmer.id),
      ]);

      const appDocs: Array<{
        docType: string;
        fileUrl: string;
        fileName?: string;
        docSubType?: string;
      }> = Array.isArray((app?.step4Documents as any)?.documents)
        ? (app?.step4Documents as any).documents
        : [];

      // Extract Aadhaar last 4 digits only (BR-54b)
      let aadhaarLast4: string | null = farmer.aadhaarLast4 ?? null;
      if (!aadhaarLast4 && app?.step1Personal) {
        const rawAadhaar =
          (app.step1Personal as any).aadhaarNumber ??
          (app.step1Personal as any).aadhaar;
        if (typeof rawAadhaar === 'string' && rawAadhaar.length >= 4) {
          aadhaarLast4 = rawAadhaar.slice(-4);
        }
      }

      const documents: FarmerDocumentItem[] = [];

      // 1. Aadhaar Card (ID_PROOF)
      const aadhaarAppDoc = appDocs.find(
        (d) =>
          d.docType === 'ID_PROOF' ||
          d.docSubType?.toLowerCase().includes('aadhaar') ||
          d.fileName?.toLowerCase().includes('aadhaar'),
      );
      const aadhaarRowDoc = docRows.find((d) => d.docType === 'ID_PROOF');
      const aadhaarKeyOrUrl = aadhaarRowDoc?.storageKey ?? aadhaarAppDoc?.fileUrl ?? null;
      const aadhaarReadUrl = await resolveReadUrl(aadhaarKeyOrUrl);

      documents.push({
        docType: 'ID_PROOF',
        displayName: 'Aadhaar Card',
        uploadStatus:
          farmer.kycStatus === 'VERIFIED' || aadhaarRowDoc?.verificationStatus === 'VERIFIED'
            ? 'VERIFIED'
            : aadhaarKeyOrUrl
              ? 'UPLOADED'
              : 'PENDING',
        readUrl: aadhaarReadUrl,
        fileName: aadhaarAppDoc?.fileName ?? (aadhaarRowDoc ? 'aadhaar.pdf' : null),
        docSubType: 'Aadhaar Card',
        documentNumberLast4: aadhaarLast4,
        uploadedAt: aadhaarRowDoc?.createdAt.toISOString() ?? app?.createdAt.toISOString() ?? null,
        verifiedAt: aadhaarRowDoc?.verifiedAt?.toISOString() ?? null,
      });

      // 2. Land Patta / FMB Map (LAND_PATTA or FARM_DOC)
      const pattaAppDoc = appDocs.find(
        (d) =>
          d.docType === 'FARM_DOC' ||
          d.docSubType?.toLowerCase().includes('patta') ||
          d.fileName?.toLowerCase().includes('patta') ||
          d.fileName?.toLowerCase().includes('fmb'),
      );
      const pattaRowDoc = docRows.find((d) => d.docType === 'FARM_DOC');
      const pattaKeyOrUrl = pattaRowDoc?.storageKey ?? pattaAppDoc?.fileUrl ?? null;
      const pattaReadUrl = await resolveReadUrl(pattaKeyOrUrl);

      documents.push({
        docType: 'LAND_PATTA',
        displayName: 'Land Patta / FMB Map',
        uploadStatus:
          pattaRowDoc?.verificationStatus === 'VERIFIED' || app?.status === 'APPROVED'
            ? 'VERIFIED'
            : pattaKeyOrUrl
              ? 'UPLOADED'
              : 'PENDING',
        readUrl: pattaReadUrl,
        fileName: pattaAppDoc?.fileName ?? (pattaRowDoc ? 'land_patta.pdf' : null),
        docSubType: 'Land Patta / FMB Map',
        uploadedAt: pattaRowDoc?.createdAt.toISOString() ?? app?.createdAt.toISOString() ?? null,
        verifiedAt: pattaRowDoc?.verifiedAt?.toISOString() ?? null,
      });

      // 3. PGS Scope Certificate (CERTIFICATE)
      const certAppDoc = appDocs.find(
        (d) =>
          d.docType === 'CERTIFICATE' ||
          d.docSubType?.toLowerCase().includes('pgs') ||
          d.fileName?.toLowerCase().includes('pgs'),
      );
      const certRow = certRows[0];
      const certRowDoc = docRows.find((d) => d.docType === 'CERTIFICATE');
      const certKeyOrUrl =
        certRow?.documentUrl ?? certRowDoc?.storageKey ?? certAppDoc?.fileUrl ?? null;
      const certReadUrl = await resolveReadUrl(certKeyOrUrl);

      documents.push({
        docType: 'CERTIFICATE',
        displayName: certRow?.customTypeName ?? 'PGS Scope Certificate',
        uploadStatus:
          certRow?.isVerified || certRowDoc?.verificationStatus === 'VERIFIED'
            ? 'VERIFIED'
            : certKeyOrUrl
              ? 'UPLOADED'
              : 'PENDING',
        readUrl: certReadUrl,
        fileName: certAppDoc?.fileName ?? (certKeyOrUrl ? 'certificate.pdf' : null),
        docSubType: certRow?.certType ?? 'PGS Scope Certificate',
        uploadedAt:
          certRow?.createdAt.toISOString() ??
          certRowDoc?.createdAt.toISOString() ??
          app?.createdAt.toISOString() ??
          null,
        verifiedAt:
          certRow?.verifiedAt?.toISOString() ?? certRowDoc?.verifiedAt?.toISOString() ?? null,
      });

      // 4. Annual Soil & Water Health Card (SOIL_CARD)
      const soilAppDoc = appDocs.find(
        (d) =>
          d.docSubType?.toLowerCase().includes('soil') ||
          d.fileName?.toLowerCase().includes('soil'),
      );
      const soilRowDoc = docRows.find(
        (d) => d.docType === 'FARM_DOC' && d.storageKey.includes('soil'),
      );
      const soilKeyOrUrl = soilRowDoc?.storageKey ?? soilAppDoc?.fileUrl ?? null;
      const soilReadUrl = await resolveReadUrl(soilKeyOrUrl);

      documents.push({
        docType: 'SOIL_CARD',
        displayName: 'Annual Soil & Water Health Card',
        uploadStatus: soilRowDoc?.verificationStatus === 'VERIFIED'
          ? 'VERIFIED'
          : soilKeyOrUrl
            ? 'UPLOADED'
            : 'ACTION_NEEDED',
        readUrl: soilReadUrl,
        fileName: soilAppDoc?.fileName ?? (soilRowDoc ? 'soil_card.pdf' : null),
        docSubType: 'Annual Soil & Water Health Card',
        uploadedAt: soilRowDoc?.createdAt.toISOString() ?? null,
        verifiedAt: soilRowDoc?.verifiedAt?.toISOString() ?? null,
      });

      // 5. Append any other documents uploaded in appDocs that don't match the 4 standard slots
      for (const otherDoc of appDocs) {
        if (
          otherDoc === aadhaarAppDoc ||
          otherDoc === pattaAppDoc ||
          otherDoc === certAppDoc ||
          otherDoc === soilAppDoc
        ) {
          continue;
        }
        const readUrl = await resolveReadUrl(otherDoc.fileUrl);
        documents.push({
          docType: otherDoc.docType ?? 'OTHER',
          displayName: otherDoc.docSubType ?? otherDoc.fileName ?? 'Other Document',
          uploadStatus: app?.status === 'APPROVED' ? 'VERIFIED' : 'UPLOADED',
          readUrl,
          fileName: otherDoc.fileName ?? null,
          docSubType: otherDoc.docSubType ?? null,
          uploadedAt: app?.createdAt.toISOString() ?? null,
        });
      }

      return { documents };
    },
  };
}

export const farmerDocumentsService = createFarmerDocumentsService();
