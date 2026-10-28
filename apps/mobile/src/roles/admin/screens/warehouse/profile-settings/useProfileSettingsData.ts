import { useCallback, useEffect, useState } from 'react';
import {
  changeOwnPassword,
  getAdminHelp,
  getMe,
  listAdminNotificationPreferences,
  listMySessions,
  updateAdminNotificationPreference,
  updateMe,
  type AdminNotificationCategory,
  type AdminNotificationPreferenceDto,
  type CurrentUserDto,
  type HelpResponseDto,
  type MySessionDto,
  type UpdateMeBody,
} from '../../../api/profile';
import {
  getWarehouse,
  getWarehouseCapacity,
  listStorageLocations,
  type StorageLocationDto,
  type WarehouseCapacityDto,
  type WarehouseDto,
} from '../../../api/warehouses';
import {
  setWarehouseCapacity,
  updateWarehouseProfile,
  type UpdateWarehouseProfileBody,
} from '../../../api/warehouseSettings';
import {
  listWarehouseDocuments,
  type WarehouseDocumentDto,
  type WarehouseDocumentStatus,
  type WarehouseDocumentType,
} from '../../../api/warehouseDocuments';
import { listAlerts } from '../../../api/alerts';
import {
  formatRelativeTimeOrDate,
  mapCurrentUserDtoToProfile,
  mapHelpArticleDtoToFaq,
  mapMySessionDtoToSession,
  mapStorageLocationDtoToItem,
  mapWarehouseDocumentDtoToItem,
  mapWarehouseDtoToProfileInfo,
} from './mappers';
import type {
  AdminAccountProfile,
  CurrentSessionInfo,
  FaqItem,
  LoginHistoryItem,
  StorageLocationItem,
  WarehouseDocItem,
  WarehouseProfileInfo,
  WarehouseScope,
} from './types';

export function useUserProfile(scope?: WarehouseScope) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [profile, setProfile] = useState<AdminAccountProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMe();
      setUser(res);
      setProfile(mapCurrentUserDtoToProfile(res, scope));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (body: UpdateMeBody) => {
      setLoading(true);
      setError(null);
      try {
        const res = await updateMe(body);
        setUser(res);
        setProfile(mapCurrentUserDtoToProfile(res, scope));
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [scope],
  );

  return { user, profile, loading, error, refetch: fetchProfile, updateProfile };
}

export function useWarehouseProfile(warehouseId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseDto | null>(null);
  const [capacity, setCapacity] = useState<WarehouseCapacityDto | null>(null);
  const [profileInfo, setProfileInfo] = useState<WarehouseProfileInfo | null>(null);

  const fetchWarehouse = useCallback(async () => {
    if (!warehouseId) {
      setWarehouse(null);
      setCapacity(null);
      setProfileInfo(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [whRes, capRes] = await Promise.allSettled([
        getWarehouse(warehouseId),
        getWarehouseCapacity(warehouseId),
      ]);

      if (whRes.status === 'fulfilled') {
        setWarehouse(whRes.value);
        setProfileInfo(mapWarehouseDtoToProfileInfo(whRes.value));
      }
      if (capRes.status === 'fulfilled') {
        setCapacity(capRes.value);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouse');
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    void fetchWarehouse();
  }, [fetchWarehouse]);

  return { warehouse, capacity, profileInfo, loading, error, refetch: fetchWarehouse };
}

export function useStorageLocations(warehouseId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<StorageLocationItem[]>([]);
  const [capacity, setCapacity] = useState<WarehouseCapacityDto | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!warehouseId) {
      setLocations([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [locRes, capRes] = await Promise.allSettled([
        listStorageLocations(warehouseId, { pageSize: 100 }),
        getWarehouseCapacity(warehouseId),
      ]);

      if (locRes.status === 'fulfilled') {
        const mapped = (locRes.value.items ?? []).map(mapStorageLocationDtoToItem);
        setLocations(mapped);
      }
      if (capRes.status === 'fulfilled') {
        setCapacity(capRes.value);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load storage locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  return { locations, capacity, loading, error, refetch: fetchLocations };
}

export function useWarehouseDocuments(
  warehouseId?: string,
  docType?: WarehouseDocumentType,
  status?: WarehouseDocumentStatus,
  q?: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<WarehouseDocItem[]>([]);

  const fetchDocs = useCallback(async () => {
    if (!warehouseId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listWarehouseDocuments(warehouseId, {
        docType,
        status,
        q,
        pageSize: 100,
      });
      const mapped = (res.items ?? []).map(mapWarehouseDocumentDtoToItem);
      setDocuments(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, docType, status, q]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  return { documents, loading, error, refetch: fetchDocs };
}

export function useWarehouseSettings(warehouseId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<WarehouseCapacityDto | null>(null);
  const [isCapacityNearFull, setIsCapacityNearFull] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!warehouseId) {
      setCapacity(null);
      setIsCapacityNearFull(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [capRes, alertRes] = await Promise.allSettled([
        getWarehouseCapacity(warehouseId),
        // Enforces negative rule: Capacity threshold % -> use CAPACITY_NEAR_FULL alert only; never hardcode 75%/90%
        listAlerts({ warehouseId, type: 'CAPACITY_NEAR_FULL' }),
      ]);

      if (capRes.status === 'fulfilled') {
        setCapacity(capRes.value);
      }
      if (alertRes.status === 'fulfilled') {
        const nearFullAlert = (alertRes.value.items ?? []).some(
          (a) => a.type === 'CAPACITY_NEAR_FULL' && a.state === 'ACTIVE',
        );
        setIsCapacityNearFull(nearFullAlert);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const updateCapacity = useCallback(
    async (capacityKg: string) => {
      if (!warehouseId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await setWarehouseCapacity(warehouseId, capacityKg);
        setCapacity(res);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to set capacity';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [warehouseId],
  );

  return {
    capacity,
    isCapacityNearFull,
    loading,
    error,
    updateCapacity,
    refetch: fetchSettings,
  };
}

export function useNotificationPreferences() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminNotificationPreferenceDto[]>([]);

  const fetchPrefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminNotificationPreferences();
      setItems(res.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrefs();
  }, [fetchPrefs]);

  const toggle = useCallback(async (category: AdminNotificationCategory, enabled: boolean) => {
    try {
      setItems((prev) =>
        prev.map((item) => (item.category === category ? { ...item, enabled } : item)),
      );
      await updateAdminNotificationPreference(category, enabled);
    } catch {
      // Revert on failure
      void fetchPrefs();
    }
  }, [fetchPrefs]);

  return { items, loading, error, toggle, refetch: fetchPrefs };
}

export function useSessions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CurrentSessionInfo | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMySessions();
      if (res.length > 0 && res[0]) {
        setCurrentSession(mapMySessionDtoToSession(res[0]));
      }
      const history = res.map((s) => ({
        id: s.id,
        device: s.platform ? s.platform.toUpperCase() : 'Terminal',
        time: formatRelativeTimeOrDate(s.issuedAt),
        result: 'Successful' as const,
      }));
      setLoginHistory(history);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  return { currentSession, loginHistory, loading, error, refetch: fetchSessions };
}

export function useHelpSupport(category?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState<HelpResponseDto | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  const fetchHelp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminHelp({ locale: 'en', category });
      setHelp(res);
      const mapped = (res.items ?? []).map(mapHelpArticleDtoToFaq);
      setFaqs(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load help articles');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void fetchHelp();
  }, [fetchHelp]);

  return {
    help,
    faqs,
    contact: help?.contact ?? { phone: null, email: null },
    categories: help?.categories ?? [],
    loading,
    error,
    refetch: fetchHelp,
  };
}
