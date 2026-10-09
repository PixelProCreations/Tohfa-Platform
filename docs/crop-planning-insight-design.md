# Design Note: Crop Planning Insight (Module 10)

**Status:** DESIGN NOTE + READ-ONLY AGGREGATOR  
**Date:** 2026-10-08  
**Author:** Backend Architecture Team  
**Governing Rule:** BR-38 (No automated advisory / manual-only data boundary), BR-36 (Own-data scoping)

---

## 1. Overview & Screen Breakdown
The mobile `CropPlanningInsightScreen` (`apps/mobile/src/roles/farmer/screens/dashboard/CropPlanningInsightScreen.tsx`) provides farmers with situational awareness regarding what crops they grow, upcoming yields, rotation history, and seasonal availability.

### What the Screen Displays
1. **Header & Context:**
   - Filter chips: `All`, `You grow this`, `In season`.
   - Explanatory banner noting that automated supply/demand recommendations are deferred.
2. **Crop Insight Cards:**
   - Crop name and category.
   - Status indicators: `You grow this` badge, `In season` / `Off season` badge.
   - Active plantings summary: Plot names where currently active, total acreage, expected yield (kg).
   - Historical performance: Total past harvests, days elapsed since last harvest.
   - Rotation signals: Consecutive planting warning (when the same crop is grown back-to-back on the same plot), or in-season opportunity (in-season crop not currently grown).

---

## 2. Derivable vs. Spec-Gap Information Matrix

| Displayed Metric / Feature | Derivable from Existing Tables? | Source Table(s) / Query | Spec Gap Status |
|---|---|---|---|
| **Active Crops & Plots** | **YES** | `farm_crops` JOIN `plots` JOIN `farms` (where `status IN ('PLANNED', 'GROWING')` and `farms.farmer_id = $farmerId`) | Fully implemented in read-only aggregator. |
| **Total Acreage per Crop** | **YES** | `SUM(plots.area_acres)` over the distinct plots of the active plantings | Fully implemented in read-only aggregator. |
| **Expected Yield (kg)** | **YES** | `SUM(farm_crops.expected_yield_kg)` for active plantings | Fully implemented in read-only aggregator. |
| **In-Season Status** | **YES** | `crop_master.season_months` vs current month in `Asia/Kolkata` (1–12) | Fully implemented in read-only aggregator. |
| **Past Harvests Count & Recency** | **YES** | `farm_crops` (where `status = 'HARVESTED'`, `MAX(actual_harvest_on)`) | Fully implemented in read-only aggregator. |
| **Consecutive Planting Signal** | **YES** | Consecutive `farm_crops` on the same plot having identical `crop_id` (`farm_crops.crop_id` -> `crop_master.id`) | Fully implemented in read-only aggregator. |
| **Market Supply vs Demand** | **NO** | Deferred. Requires platform-wide demand aggregation and warehouse intake projections. | **SPEC GAP 1**: Requires owner decision on market projection algorithm. |
| **"Plant More" / "Switch Crop" Advice** | **NO** | Prohibited under BR-38 (no invented agronomy rules or automated advisory). | **SPEC GAP 2**: Requires owner to define certified agronomist advisory rules. |
| **Target Ceiling Price Forecasting** | **NO** | Not available. Ceiling prices are static admin entries under BR-08, not future market forecasts. | **SPEC GAP 3**: Requires owner to define pricing trends model. |

---

## 3. Read-Only Aggregator Endpoint Specification

- **Path:** `GET /v1/farmers/me/crop-planning-insight`
- **Permission:** `farmer.crops.view_own`
- **Scope:** `OWN` (caller farmer profile only)
- **Response Shape:**
```json
{
  "generatedAt": "2026-10-08T18:30:00.000Z",
  "crops": [
    {
      "cropMasterId": "00000000-0000-0000-0000-000000000001",
      "cropName": "Carrot",
      "category": "Root Vegetables",
      "youGrow": true,
      "inSeason": true,
      "activePlots": ["Plot A - Terraced North"],
      "totalAcreageGrown": 1.5,
      "expectedYieldKg": 4200,
      "pastHarvestCount": 3,
      "lastHarvestedOn": "2026-06-15",
      "hasConsecutivePlanting": false,
      "consecutivePlotNames": []
    }
  ]
}
```

The response carries derived facts only. The deferred features in section 2 (spec gaps 1-3) are documented here and are deliberately NOT repeated as strings in the API response, so no English text is sent to the app. Every field above is always present; `inSeason`, `expectedYieldKg` and `lastHarvestedOn` are `null` when there is no data (no `season_months`, no yield entered, no harvest yet).

---

## 4. Specific Spec Gaps for Platform Owner
1. **Supply & Demand Metric Formulation:** Does TOHFA intend to publish platform-level aggregate supply (active listings + warehouse stock) vs customer demand (30-day trailing customer orders) to farmers, or is crop planning purely farm-internal?
2. **Soil Depletion & Crop Rotation Rules:** Should consecutive monoculture warnings be strictly informational, or should they impact audit ratings (BR-06) or PGS compliance?
3. **Agronomy Knowledge Base:** If automated reminders and crop suggestions are introduced in Phase 3, what certified institution's agronomy guidelines (e.g. TNAU, ICAR) will define the recommendation rules?
