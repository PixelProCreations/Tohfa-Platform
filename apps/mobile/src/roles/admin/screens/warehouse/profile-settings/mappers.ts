import type { CurrentUserDto, HelpArticleDto, MySessionDto } from '../../../api/profile';
import type { StorageLocationDto, WarehouseDto } from '../../../api/warehouses';
import type { WarehouseDocumentDto, WarehouseDocumentType } from '../../../api/warehouseDocuments';
import type {
  AdminAccountProfile,
  CurrentSessionInfo,
  DocumentCategory,
  FaqCategory,
  FaqItem,
  StorageLocationItem,
  StorageType,
  WarehouseDocItem,
  WarehouseProfileInfo,
  WarehouseScope,
} from './types';
import { roleLabelOf } from './fixtures';

export function formatIstDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTimeOrDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return formatIstDate(isoString);
  } catch {
    return isoString;
  }
}

export function mapCurrentUserDtoToProfile(dto: CurrentUserDto, scope?: WarehouseScope): AdminAccountProfile {
  const warehouseLabel = scope?.warehouseName ?? (scope?.warehouseId ? scope.warehouseId : 'All Warehouses');
  const roleCode = dto.roles?.[0]?.code ?? 'Admin';
  const roleLabel = scope ? roleLabelOf(scope) : 'Warehouse Admin';

  return {
    fullName: dto.fullName,
    roleLabel,
    adminId: dto.id,
    mobileNumber: dto.mobile ?? '—',
    email: dto.email ?? '—',
    warehouseLabel,
    accessLevel: roleCode === 'MAIN_WH_ADMIN' ? 'Main Warehouse Administrator' : 'Sub Warehouse Administrator',
    createdDate: dto.createdAt ? formatIstDate(dto.createdAt) : '—',
    lastLogin: dto.lastLoginAt ? formatRelativeTimeOrDate(dto.lastLoginAt) : 'Never',
    passwordChanged: '—',
    status: dto.status === 'DISABLED' ? 'Inactive' : 'Active',
  };
}

export function mapWarehouseDtoToProfileInfo(dto: WarehouseDto): WarehouseProfileInfo {
  const coordinates = dto.latitude && dto.longitude ? `${dto.latitude}° N, ${dto.longitude}° E` : '—';
  const currentStock = dto.capacityKg ? `${Math.round(parseFloat(dto.capacityKg))} KG total capacity` : '—';

  return {
    warehouseId: dto.id,
    warehouseName: dto.name,
    code: dto.code,
    status: dto.isActive ? 'Active' : 'Inactive',
    kind: dto.type === 'MAIN' ? 'Main Warehouse' : 'Sub Warehouse',
    region: dto.city ?? 'Nilgiris',
    assignedAdmin: 'Admin',
    address: dto.address ?? '—',
    coordinates,
    mapAddress: dto.address ?? '—',
    currentStock,
  };
}

export function mapStorageLocationDtoToItem(dto: StorageLocationDto): StorageLocationItem {
  let type: StorageType = 'Bulk Storage';
  if (dto.locationType) {
    const lower = dto.locationType.toLowerCase();
    if (lower.includes('cold')) type = 'Cold Storage';
    else if (lower.includes('dry')) type = 'Dry Storage';
    else if (lower.includes('staging')) type = 'Staging Area';
  }

  // Negative rule: Storage location hierarchy/used-kg -> '—' or hide / set to 0
  return {
    id: dto.id,
    warehouseId: dto.warehouseId,
    name: dto.name,
    code: dto.code,
    type,
    status: dto.isActive ? 'Active' : 'Inactive',
    capacityKg: dto.capacityKg ? Math.round(parseFloat(dto.capacityKg)) : 0,
    currentKg: 0,
  };
}

export function mapDocTypeToCategory(docType: WarehouseDocumentType): DocumentCategory {
  switch (docType) {
    case 'LICENSE':
      return 'License';
    case 'FSSAI':
    case 'FIRE_SAFETY':
      return 'Compliance';
    case 'LEASE':
    case 'INSURANCE':
      return 'Registration';
    default:
      return 'Other';
  }
}

export function mapWarehouseDocumentDtoToItem(dto: WarehouseDocumentDto): WarehouseDocItem {
  const status: 'Active' | 'Expiring Soon' =
    dto.status === 'EXPIRING_SOON' || dto.status === 'EXPIRED' ? 'Expiring Soon' : 'Active';
  const dateNote = dto.expiryDate ? `Expires ${dto.expiryDate}` : dto.issueDate ? `Issued ${dto.issueDate}` : 'Active';

  return {
    id: dto.id,
    warehouseId: dto.warehouseId,
    name: dto.title,
    code: dto.documentNumber ?? dto.id.slice(0, 8),
    category: mapDocTypeToCategory(dto.docType),
    status,
    dateNote,
    expiry: dto.expiryDate ?? undefined,
  };
}

export function mapMySessionDtoToSession(dto: MySessionDto): CurrentSessionInfo {
  return {
    device: dto.platform ? dto.platform.toUpperCase() : 'Terminal',
    browser: dto.userAgent ?? 'App',
    location: dto.lastSeenIp ?? '—',
    started: formatRelativeTimeOrDate(dto.issuedAt),
    lastActive: dto.lastSeenAt ? formatRelativeTimeOrDate(dto.lastSeenAt) : 'Active now',
    sessionId: dto.id.slice(0, 8) + '...',
  };
}

export function mapHelpArticleDtoToFaq(dto: HelpArticleDto): FaqItem {
  return {
    id: dto.id,
    category: dto.category as FaqCategory,
    question: dto.title,
    answer: dto.body,
  };
}
