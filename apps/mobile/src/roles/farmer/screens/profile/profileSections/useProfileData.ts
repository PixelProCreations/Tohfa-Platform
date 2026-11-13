import { useCallback, useEffect, useState } from 'react';
import { getMyFarmerProfile, maskAadhaar, maskMobile } from '../../../api/farmer';
import { getFarms, getPlots, type Farm } from '../../../api/farms';
import { listSoilTests, type SoilTestRecord } from '../../../api/soil';
import type { Locale } from '../../../../../i18n/farmer';
import { buildFarmMapPreview } from '../farmMapPreview';
import type { FarmDetailsData, PersonalDetailsData } from './profileHelpers';

/**
 * Personal details, farm summary, farm list, soil test and preferred locale: everything the
 * Profile screen loads from the farmer-profile / farms / soil endpoints. One hook because the
 * farms load also back-fills `personalDetails.farmName/location`, so the pieces share state.
 */
export function useProfileData() {
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsData>({
    fullName: '',
    dob: '',
    mobile: '',
    aadhaar: '',
    yearsInOrganic: '',
    farmingType: '',
    farmName: '',
    location: '',
  });

  const [farmDetails, setFarmDetails] = useState<FarmDetailsData>({
    acres: '—',
    zones: '—',
    farms: '—',
    fmbPts: '—',
    waterSource: '—',
    tags: [],
  });

  const [farmsList, setFarmsList] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState<boolean>(true);

  // Real TOHFA farmer id from GET /v1/farmers/me; empty until first fetch.
  const [farmerId, setFarmerId] = useState<string>('');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');
  const [latestSoilTest, setLatestSoilTest] = useState<SoilTestRecord | null>(null);
  const [soilLoading, setSoilLoading] = useState<boolean>(true);
  // Set when the Farm & FMB preview map's style could not load (e.g. token refused, offline on
  // first launch) -- the card then shows its placeholder rather than a blank map-shaped panel.
  const [previewMapFailed, setPreviewMapFailed] = useState(false);

  const loadFarms = useCallback(async () => {
    setFarmsLoading(true);
    // A reload remounts the preview map (its key changes), so give it a fresh chance to load.
    setPreviewMapFailed(false);
    try {
      const list = await getFarms();
      setFarmsList(list);
      if (list.length > 0) {
        const primary = list.find((f) => f.isPrimary) ?? list[0]!;

        // Calculate total acres across all farms
        const totalAcres = list.reduce((acc, f) => {
          const a = f.areaAcres ?? f.boundaryAreaAcres ?? 0;
          return acc + a;
        }, 0);

        // Calculate total zones across all farms
        const totalZones = list.reduce((acc, f) => acc + (f.plotCount ?? 0), 0);

        // FMB points of the farm the map preview shows -- not blindly the primary/first farm,
        // which may have no boundary while another farm does (see farmMapPreview.ts).
        const fmbPointCount = buildFarmMapPreview(list).fmbPointCount;

        // Extract unique water sources
        const waterSources = Array.from(
          new Set(list.flatMap((f) => f.waterSources || []).filter(Boolean)),
        );

        // Context tags: keep the raw codes in state and translate at render time
        // (farmTagLabel) rather than baking an English label in here -- a label
        // computed once at load time would stay frozen in its original language
        // across a later locale switch, since nothing re-runs this load on its own.
        const rawTags = primary.landBoundaryContext || [];

        setFarmDetails({
          acres:
            totalAcres > 0
              ? `${Number(totalAcres.toFixed(2))}`
              : primary.areaAcres
                ? `${primary.areaAcres}`
                : '—',
          zones: `${totalZones}`,
          farms: `${list.length}`,
          fmbPts: fmbPointCount > 0 ? `${fmbPointCount}` : '—',
          waterSource: waterSources.length > 0 ? waterSources.join(', ') : '—',
          tags: rawTags,
        });

        if (primary.name) {
          setPersonalDetails((prev) => ({
            ...prev,
            farmName: prev.farmName || primary.name,
            location:
              prev.location ||
              (primary.village ? `${primary.village}, ${primary.district}` : primary.district),
          }));
        }
      }
    } catch {
      // Fallback gracefully
    } finally {
      setFarmsLoading(false);
    }
  }, []);

  // Attempt to load from API in background, maintaining rich defaults if mock
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getMyFarmerProfile();
        if (res) {
          if (res.tohfaFarmerId) {
            setFarmerId(res.tohfaFarmerId);
          }
          setPersonalDetails((prev) => ({
            ...prev,
            fullName: res.fullName || prev.fullName,
            mobile: res.mobile ? maskMobile(res.mobile) : prev.mobile,
            aadhaar: res.aadhaarLast4 ? maskAadhaar(res.aadhaarLast4) : prev.aadhaar,
            // `FarmerProfile.dob` was already part of the API response but was never read into
            // this screen's state, so Date of Birth always showed blank regardless of what the
            // backend actually had.
            dob: res.dob
              ? new Date(res.dob).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : prev.dob,
            // Stored as the bare number -- the "X years" phrasing is applied at render time
            // (farmer.profile.yearsValue) so it re-renders in whichever locale is live.
            yearsInOrganic: res.farmingExperienceYears
              ? String(res.farmingExperienceYears)
              : prev.yearsInOrganic,
            location: res.address || prev.location,
          }));
          if (res.preferredLocale) {
            setSelectedLocale(res.preferredLocale as Locale);
          }
        }
      } catch {
        // Fallback gracefully to default rich data
      }
    }

    async function fetchSoilTest() {
      try {
        const farms = await getFarms();
        if (farms[0]?.id) {
          const plots = await getPlots(farms[0].id);
          if (plots.length > 0) {
            const perPlot = await Promise.all(
              plots.map((p) => listSoilTests(farms[0]!.id, p.id).catch(() => [])),
            );
            const allTests = perPlot.flat().sort((a, b) => (a.testDate < b.testDate ? 1 : -1));
            if (allTests[0]) {
              setLatestSoilTest(allTests[0]);
            }
          }
        }
      } catch {
        // Fallback gracefully -- latestSoilTest stays null, which renders the
        // same honest "no test yet" state as a farm with no real test on record.
      } finally {
        setSoilLoading(false);
      }
    }

    void fetchProfile();
    void loadFarms();
    void fetchSoilTest();
  }, [loadFarms]);

  return {
    personalDetails,
    setPersonalDetails,
    farmDetails,
    setFarmDetails,
    farmsList,
    farmsLoading,
    farmerId,
    latestSoilTest,
    soilLoading,
    selectedLocale,
    setSelectedLocale,
    previewMapFailed,
    setPreviewMapFailed,
    loadFarms,
  };
}
