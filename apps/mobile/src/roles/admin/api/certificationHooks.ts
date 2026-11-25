/**
 * Reads over ./certifications.ts, in the shape the farmer hooks use
 * (./farmerHooks.ts): a `LiveQueryState` plus the rows, nothing branching.
 *
 * Only a cursor page is fetched, not the whole history: a screen that shows a
 * farmer's current certificate wants the first page, and `loadMore` is there
 * for one that wants the rest.
 */
import {
  listCertifications,
  type CertificationDto,
  type CertificationListPage,
  type CertificationVerificationStatus,
} from './certifications';
import { useCursorList, type AdminQueryOptions, type CursorList } from './hooks';
import { certificationKeys } from './queryKeys';

export interface CertificationListFilters {
  farmerId?: string | undefined;
  status?: CertificationVerificationStatus | undefined;
}

function identity(dto: CertificationDto): CertificationDto {
  return dto;
}

/**
 * certification.view. Pass `enabled: false` (or no farmerId) and nothing is
 * fetched, so a collapsed section costs no request.
 */
export function useCertificationList(
  warehouseId: string | undefined,
  filters: CertificationListFilters = {},
  options: AdminQueryOptions = {},
): CursorList<CertificationDto, CertificationListPage> {
  return useCursorList<CertificationDto, CertificationDto, CertificationListPage>(
    certificationKeys.list(warehouseId, filters),
    (cursor, signal) => listCertifications({ ...filters, cursor }, signal),
    identity,
    options,
  );
}
