/**
 * Live data for the produce screens (screens/produce). Thin wrappers over
 * ./hooks.ts; requests and keys live in ./produce.ts, decisions in
 * screens/produce/produceLogic.ts (tested), since hooks cannot be rendered in
 * this app's plain-Node vitest.
 *
 * Every hook takes `{ enabled }` so a screen skips a request its `can()` denies.
 * The server still decides (root CLAUDE.md 2.1).
 */
import {
  CROP_TAXONOMY_MODULE,
  PLATFORM_EVENTS_MODULE,
  countProduceRecords,
  createCropMaster,
  createDiaryCategory,
  createDiarySubActivity,
  createPlatformEvent,
  deletePlatformEvent,
  getProduceCalendar,
  getProduceFilterOptions,
  listCatalogCategories,
  listCropMaster,
  listPlatformEvents,
  listProduceCalendarEvents,
  produceKeys,
  updateCropMaster,
  type CreateCropMasterBody,
  type CreateDiaryCategoryBody,
  type CreateDiarySubActivityBody,
  type CreatePlatformEventBody,
  type ProduceCalendarEventDto,
  type ProduceCalendarEventPage,
  type ProduceFilters,
  type UpdateCropMasterBody,
} from './produce';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from './hooks';
import { adminKeys } from './queryKeys';

export interface ProduceHookOptions {
  enabled?: boolean | undefined;
}

function keepEvent(dto: ProduceCalendarEventDto): ProduceCalendarEventDto {
  return dto;
}

export function useProduceRecordCount(filters: ProduceFilters, options: ProduceHookOptions = {}) {
  return useAdminQuery(produceKeys.recordCount(filters), (signal) => countProduceRecords(filters, signal), options);
}

export function useProduceCalendar(month: string, filters: ProduceFilters, options: ProduceHookOptions = {}) {
  return useAdminQuery(produceKeys.calendar(month, filters), (signal) => getProduceCalendar(month, filters, signal), options);
}

export function useProduceCalendarEvents(
  date: string,
  filters: ProduceFilters,
  options: ProduceHookOptions = {},
): CursorList<ProduceCalendarEventDto, ProduceCalendarEventPage> {
  return useCursorList<ProduceCalendarEventDto, ProduceCalendarEventDto, ProduceCalendarEventPage>(
    produceKeys.events(date, filters),
    (cursor, signal) => listProduceCalendarEvents(date, filters, cursor, signal),
    keepEvent,
    options,
  );
}

export function useProduceFilterOptions(options: ProduceHookOptions = {}) {
  return useAdminQuery(produceKeys.filterOptions(), (signal) => getProduceFilterOptions(signal), options);
}

export function useCropMasterList(options: ProduceHookOptions = {}) {
  return useAdminQuery(produceKeys.cropMaster(), (signal) => listCropMaster(signal), options);
}

export function useCatalogCategories(options: ProduceHookOptions = {}) {
  return useAdminQuery(produceKeys.categories(), (signal) => listCatalogCategories(signal), options);
}

export function usePlatformEventList(options: ProduceHookOptions = {}) {
  return useAdminQuery(produceKeys.platformEvents(), (signal) => listPlatformEvents(signal), options);
}

const CROP_INVALIDATES = [adminKeys.module(CROP_TAXONOMY_MODULE)] as const;
const EVENT_INVALIDATES = [adminKeys.module(PLATFORM_EVENTS_MODULE)] as const;

export function useCreateCropMaster() {
  return useAdminMutation({
    mutationFn: (body: CreateCropMasterBody) => createCropMaster(body),
    invalidates: CROP_INVALIDATES,
  });
}

export function useUpdateCropMaster() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: UpdateCropMasterBody }) => updateCropMaster(vars.id, vars.body),
    invalidates: CROP_INVALIDATES,
  });
}

export interface CreateDiaryCategoryVars {
  category: CreateDiaryCategoryBody;
  subActivities: CreateDiarySubActivityBody[];
}

/** The category first, then each sub-activity under it, in order. */
export function useCreateDiaryCategory() {
  return useAdminMutation({
    mutationFn: async (vars: CreateDiaryCategoryVars) => {
      const created = await createDiaryCategory(vars.category);
      for (const sub of vars.subActivities) await createDiarySubActivity(created.key, sub);
      return created;
    },
  });
}

export function useCreatePlatformEvent() {
  return useAdminMutation({
    mutationFn: (body: CreatePlatformEventBody) => createPlatformEvent(body),
    invalidates: EVENT_INVALIDATES,
  });
}

export function useDeletePlatformEvent() {
  return useAdminMutation({
    mutationFn: (id: string) => deletePlatformEvent(id),
    invalidates: EVENT_INVALIDATES,
  });
}
