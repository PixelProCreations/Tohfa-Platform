/**
 * Validation rules for the farm-asset Add/Edit forms (tools, machinery,
 * equipment). One place so the six screens cannot drift apart.
 *
 * Limits mirror docs/openapi.yaml `FarmAssetCreateRequest` / `FarmAssetUpdateRequest`:
 * name <= 160, makeModel <= 160, fuelType <= 80, serviceIntervalDays an integer > 0,
 * coverageAreaAcres >= 0. The OpenAPI schema has NO upper bound for the interval
 * or the coverage area; the defaults below are conservative generic limits
 * (spec gap) and callers may override them through the parameters.
 */
import { decimal, integer, maxLength, required, type FieldRules } from '../../../utils/validation';

export const ASSET_NAME_MAX_LENGTH = 160;
export const ASSET_MAKE_MODEL_MAX_LENGTH = 160;
export const ASSET_FUEL_TYPE_MAX_LENGTH = 80;

/** TextInput maxLength helpers matching the default generic limits (spec gap). */
export const ASSET_INTERVAL_MAX_DIGITS = 5;
export const ASSET_AREA_MAX_CHARS = 9;

export interface AssetRuleLimits {
  /** Spec gap: generic ceiling (100 years) -- openapi only says exclusiveMinimum 0. */
  maxIntervalDays?: number;
  /** Spec gap: generic ceiling on coverage area -- openapi only says minimum 0. */
  maxCoverageAcres?: number;
}

export type ToolField = 'name' | 'serviceInterval';
export type MachineryField = 'name' | 'makeModel' | 'fuelType' | 'serviceInterval';
export type EquipmentField = 'name' | 'coverageArea' | 'serviceInterval';

function serviceIntervalRules(limits: AssetRuleLimits) {
  return [required(), integer({ min: 1, max: limits.maxIntervalDays ?? 36500 })] as const;
}

export function toolRules(limits: AssetRuleLimits = {}): FieldRules<ToolField> {
  return {
    name: [required(), maxLength(ASSET_NAME_MAX_LENGTH)],
    serviceInterval: serviceIntervalRules(limits),
  };
}

export function machineryRules(limits: AssetRuleLimits = {}): FieldRules<MachineryField> {
  return {
    name: [required(), maxLength(ASSET_NAME_MAX_LENGTH)],
    makeModel: [maxLength(ASSET_MAKE_MODEL_MAX_LENGTH)],
    fuelType: [maxLength(ASSET_FUEL_TYPE_MAX_LENGTH)],
    serviceInterval: serviceIntervalRules(limits),
  };
}

export function equipmentRules(limits: AssetRuleLimits = {}): FieldRules<EquipmentField> {
  return {
    name: [required(), maxLength(ASSET_NAME_MAX_LENGTH)],
    coverageArea: [decimal({ min: 0, max: limits.maxCoverageAcres ?? 100000, maxDecimals: 2 })],
    serviceInterval: serviceIntervalRules(limits),
  };
}

// Module-level so the rule objects keep a stable identity across renders.
export const TOOL_RULES = toolRules();
export const MACHINERY_RULES = machineryRules();
export const EQUIPMENT_RULES = equipmentRules();
