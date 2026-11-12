/**
 * Field rules for the tree-planting forms (Add / Edit planting).
 * Limits copied from docs/openapi.yaml TreePlanting request bodies:
 * speciesName maxLength 200, treeCount integer 1..2147483647,
 * zoneName maxLength 200, purpose maxLength 500.
 */
import { integer, maxLength, required, type FieldRules } from '../../../utils/validation';

export type PlantingField = 'species' | 'treeCount' | 'zone' | 'purpose';

export const PLANTING_FIELD_ORDER: readonly PlantingField[] = ['species', 'treeCount', 'zone', 'purpose'];

export const PLANTING_RULES: FieldRules<PlantingField> = {
  species: [required(), maxLength(200)],
  treeCount: [required(), integer({ min: 1, max: 2147483647 })],
  zone: [maxLength(200)],
  purpose: [maxLength(500)],
};
