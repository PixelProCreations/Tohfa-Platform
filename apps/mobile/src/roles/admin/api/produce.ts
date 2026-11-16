/**
 * Produce configuration and the consolidated Produce Calendar (docs/openapi.yaml):
 *
 *   GET    /admin/produce/records              produce.calendar.view_consolidated (BR-142)
 *   GET    /admin/produce/calendar             produce.calendar.view_consolidated
 *   GET    /admin/produce/calendar/events      produce.calendar.view_consolidated
 *   GET    /admin/produce/filter-options       produce.calendar.view_consolidated
 *   GET    /admin/crop-master                  admin.crop_taxonomy.manage
 *   POST   /admin/crop-master                  admin.crop_taxonomy.manage
 *   PATCH  /admin/crop-master/{id}             admin.crop_taxonomy.manage (isActive=false deactivates)
 *   POST   /admin/diary/categories             admin.diary_taxonomy.manage (BR-45)
 *   POST   /admin/diary/categories/{key}/sub-activities
 *   GET    /admin/platform-events              platform.event.manage
 *   POST   /admin/platform-events              platform.event.manage
 *   DELETE /admin/platform-events/{id}         platform.event.manage
 *   GET    /catalog/categories                 public: maps crop_master.categoryId to a name
 *
 * The calendar's `harvest` count is RECORDED harvests only; an expected harvest
 * is a forecast and the server never returns it on the calendar (BR-142 rule 7).
 *
 * None of these writes moves money, so none sends an Idempotency-Key.
 * No UI imports, so any admin area can reuse this module.
 */
import { adminDelete, adminGet, adminPatch, adminPost } from './http';
import { adminKeys } from './queryKeys';

export const PRODUCE_MODULE = 'produce';
export const CROP_TAXONOMY_MODULE = 'cropTaxonomy';
export const PLATFORM_EVENTS_MODULE = 'platformEvents';

// ---------------------------------------------------------------------------
// Produce Calendar
// ---------------------------------------------------------------------------

export interface ProduceFilters {
  zoneId?: string | undefined;
  cropId?: string | undefined;
  q?: string | undefined;
}

export interface ProduceCalendarDayDto {
  date: string;
  planting: number;
  growthStage: number;
  harvest: number;
}

export interface ProduceCalendarDto {
  month: string;
  days: ProduceCalendarDayDto[];
}

export type ProduceEventType = 'PLANTING' | 'GROWTH_STAGE' | 'HARVEST';

export interface ProduceCalendarEventDto {
  eventType: ProduceEventType;
  date: string;
  stage: { code: string; name: string } | null;
  record: {
    id: string;
    crop: { id: string; name: string };
    farmer: { id: string; name: string };
    zone: { id: string; name: string } | null;
    plot: { id: string; name: string };
  };
}

export interface ProducePageMeta {
  nextCursor: string | null;
  hasMore: boolean;
  total?: number | undefined;
}

export interface ProduceCalendarEventPage {
  items: ProduceCalendarEventDto[];
  page: ProducePageMeta;
}

export interface ProduceRecordPage {
  items: unknown[];
  page: ProducePageMeta;
}

export interface ProduceFilterOptionsDto {
  zones: { id: string; code: string; name: string }[];
  crops: { id: string; name: string; botanicalName: string | null }[];
}

function filterQuery(filters: ProduceFilters) {
  return { zoneId: filters.zoneId, cropId: filters.cropId, q: filters.q };
}

/** One record and the count of every record in scope (`page.total`); only the count is used. */
export function countProduceRecords(filters: ProduceFilters, signal?: AbortSignal): Promise<ProduceRecordPage> {
  return adminGet<ProduceRecordPage>(
    '/admin/produce/records',
    { ...filterQuery(filters), limit: 1, includeTotal: 'true' },
    signal,
  );
}

/** `month` is YYYY-MM. */
export function getProduceCalendar(month: string, filters: ProduceFilters, signal?: AbortSignal): Promise<ProduceCalendarDto> {
  return adminGet<ProduceCalendarDto>('/admin/produce/calendar', { ...filterQuery(filters), month }, signal);
}

/** `date` is YYYY-MM-DD. */
export function listProduceCalendarEvents(
  date: string,
  filters: ProduceFilters,
  cursor: string | undefined,
  signal?: AbortSignal,
): Promise<ProduceCalendarEventPage> {
  return adminGet<ProduceCalendarEventPage>(
    '/admin/produce/calendar/events',
    { ...filterQuery(filters), date, cursor },
    signal,
  );
}

export function getProduceFilterOptions(signal?: AbortSignal): Promise<ProduceFilterOptionsDto> {
  return adminGet<ProduceFilterOptionsDto>('/admin/produce/filter-options', undefined, signal);
}

// ---------------------------------------------------------------------------
// Crop taxonomy (crop_master)
// ---------------------------------------------------------------------------

export interface CropMasterDto {
  id: string;
  slug: string;
  name: string;
  nameTa: string | null;
  categoryId: string;
  botanicalName: string | null;
  defaultUnit: string;
  seasonMonths: number[] | null;
  shelfLifeDays: number | null;
  iconKey: string | null;
  isActive: boolean;
}

export interface CropMasterListDto {
  items: CropMasterDto[];
}

export interface CreateCropMasterBody {
  slug: string;
  name: string;
  nameTa?: string | undefined;
  categoryId: string;
}

export interface UpdateCropMasterBody {
  name?: string | undefined;
  nameTa?: string | null | undefined;
  categoryId?: string | undefined;
  isActive?: boolean | undefined;
}

/** Contract format of crop_master.slug (crops.schema.ts), not a business rule. */
export const CROP_SLUG_RE = /^[a-z0-9-]{1,80}$/;

export function listCropMaster(signal?: AbortSignal): Promise<CropMasterListDto> {
  return adminGet<CropMasterListDto>('/admin/crop-master', undefined, signal);
}

export function createCropMaster(body: CreateCropMasterBody): Promise<CropMasterDto> {
  const allowed: CreateCropMasterBody = { slug: body.slug, name: body.name, categoryId: body.categoryId };
  if (body.nameTa !== undefined && body.nameTa !== '') allowed.nameTa = body.nameTa;
  return adminPost<CropMasterDto>('/admin/crop-master', allowed);
}

export function updateCropMaster(id: string, body: UpdateCropMasterBody): Promise<CropMasterDto> {
  return adminPatch<CropMasterDto>(`/admin/crop-master/${encodeURIComponent(id)}`, body);
}

export interface CatalogCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export function listCatalogCategories(signal?: AbortSignal): Promise<{ items: CatalogCategoryDto[] }> {
  return adminGet<{ items: CatalogCategoryDto[] }>('/catalog/categories', undefined, signal);
}

// ---------------------------------------------------------------------------
// Farm diary taxonomy (admin)
// ---------------------------------------------------------------------------

export interface CreateDiaryCategoryBody {
  key: string;
  name: string;
  sortOrder: number;
}

export interface CreateDiarySubActivityBody {
  key: string;
  name: string;
  sortOrder: number;
}

export interface DiaryCategoryDto {
  key: string;
  name: string;
  nameTa: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
}

export function createDiaryCategory(body: CreateDiaryCategoryBody): Promise<DiaryCategoryDto> {
  return adminPost<DiaryCategoryDto>('/admin/diary/categories', body);
}

export function createDiarySubActivity(categoryKey: string, body: CreateDiarySubActivityBody): Promise<unknown> {
  return adminPost<unknown>(`/admin/diary/categories/${encodeURIComponent(categoryKey)}/sub-activities`, body);
}

// ---------------------------------------------------------------------------
// Platform events
// ---------------------------------------------------------------------------

export const PLATFORM_EVENT_TYPES = ['WORKSHOP', 'TRAINING', 'COMMUNITY_MEET', 'MARKET_DAY', 'OTHER'] as const;
export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

export const PLATFORM_EVENT_AUDIENCES = ['ALL', 'FARMER', 'CUSTOMER'] as const;
export type PlatformEventAudience = (typeof PLATFORM_EVENT_AUDIENCES)[number];

export interface PlatformEventDto {
  id: string;
  title: string;
  description: string | null;
  eventType: PlatformEventType;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  targetAudience: PlatformEventAudience;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PlatformEventListDto {
  items: PlatformEventDto[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePlatformEventBody {
  title: string;
  description?: string | undefined;
  eventType: PlatformEventType;
  eventDate: string;
  startTime?: string | undefined;
  endTime?: string | undefined;
  locationName?: string | undefined;
  targetAudience: PlatformEventAudience;
  isPublished: boolean;
}

/** The server's page-size ceiling for this list (calendar.schema.ts). */
export const PLATFORM_EVENTS_PAGE_LIMIT = 100;

export function listPlatformEvents(signal?: AbortSignal): Promise<PlatformEventListDto> {
  return adminGet<PlatformEventListDto>('/admin/platform-events', { page: 1, limit: PLATFORM_EVENTS_PAGE_LIMIT }, signal);
}

export function createPlatformEvent(body: CreatePlatformEventBody): Promise<PlatformEventDto> {
  return adminPost<PlatformEventDto>('/admin/platform-events', body);
}

export function deletePlatformEvent(id: string): Promise<void> {
  return adminDelete(`/admin/platform-events/${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const produceKeys = {
  recordCount: (filters: ProduceFilters) =>
    adminKeys.scoped(PRODUCE_MODULE, undefined, { resource: 'recordCount', ...filterKey(filters) }),
  calendar: (month: string, filters: ProduceFilters) =>
    adminKeys.scoped(PRODUCE_MODULE, undefined, { resource: 'calendar', month, ...filterKey(filters) }),
  events: (date: string, filters: ProduceFilters) =>
    adminKeys.scoped(PRODUCE_MODULE, undefined, { resource: 'events', date, ...filterKey(filters) }),
  filterOptions: () => adminKeys.scoped(PRODUCE_MODULE, undefined, { resource: 'filterOptions' }),
  cropMaster: () => adminKeys.scoped(CROP_TAXONOMY_MODULE, undefined, { resource: 'list' }),
  categories: () => adminKeys.scoped(CROP_TAXONOMY_MODULE, undefined, { resource: 'categories' }),
  platformEvents: () => adminKeys.scoped(PLATFORM_EVENTS_MODULE, undefined, { resource: 'list' }),
};

function filterKey(filters: ProduceFilters) {
  return { zoneId: filters.zoneId ?? null, cropId: filters.cropId ?? null, q: filters.q ?? null };
}
