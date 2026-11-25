/**
 * W5 (brief 07) source guard over the farmers / inputs / produce files this
 * stream touched. Each pattern below was a fixture, an invented value or a
 * success message with no request behind it.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ADMIN = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ADMIN, rel), 'utf8');
/** Strips comments so a comment explaining a removal does not trip the guard. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const FILES = [
  'screens/farmers/AdminEditRatingCategoriesScreen.tsx',
  'screens/farmers/AdminEditFarmRecordScreen.tsx',
  'screens/farmers/AdminFarmMapScreen.tsx',
  'screens/farmers/AdminRatingScorecardScreen.tsx',
  'screens/farmers/FarmRecordsSection.tsx',
  'screens/farmers/FarmerBankAccountDetailsScreen.tsx',
  'screens/farmers/FarmerManagementFlow.tsx',
  'screens/farmers/FarmerPayoutTabSection.tsx',
  'screens/farmers/SuperAdminFarmRecordsScreen.tsx',
  'screens/inputs/ApprovedInputsScreen.tsx',
  'screens/inputs/FarmerPestIncidentsScreen.tsx',
  'screens/inputs/InputDetailScreen.tsx',
  'screens/inputs/InputsPestHomeScreen.tsx',
  'screens/inputs/PestIncidentDetailScreen.tsx',
  'screens/inputs/index.ts',
  'screens/produce/CropHistoryRecordsScreen.tsx',
  'screens/produce/ZoneCropBreakdownScreen.tsx',
  'screens/produce/ProduceControlFiltersModal.tsx',
  'screens/produce/ProduceControlFlow.tsx',
  'api/produceHooks.ts',
  'api/w5ProduceRecords.ts',
  'api/w5FarmRecords.ts',
  'api/w5FarmerPayouts.ts',
];

const FORBIDDEN: [string, RegExp][] = [
  ['inline dash (use ADMIN_NO_VALUE)', /—/],
  ['fixture constant', /\b(DEMO_PAYOUT_ITEMS|CATALOG_INPUTS|SAMPLE_INCIDENTS|INITIAL_CATEGORIES|DEFAULT_CATEGORY_NAMES)\b/],
  ['fake success alert', /'(Scorecard Saved|Stage Updated|Harvest Recorded|Record Ended|Asset Retired|Saved|Account Deactivated|Terminated|Deleted|Production Logged|Service Recorded)'/],
  ['fake photo attach', /Photo attached/],
  ['BR-53: these accounts are not payout destinations', /Used for farmer payouts/],
  ['hard-coded date default', /28-10-2026|'28 Oct 2026'/],
  ['invented farmer', /Farmer #00124|Farmer FR-\d/],
  ['invented registration id', /-TN`/],
  ['status fallback literal', /\|\|\s*'Approved'/],
  ['dead 0-1000 scale / literal tier threshold', /score >= (750|700|650)|\/ 1000|totalScore \/ 1000/],
  ['invented exclusion count', /\(2 excluded\)|2 open records excluded/],
  ['unsourced map claims', /Geo-fenced|under FMB record/],
  ['invented bank values', /HDFC Bank|IDIB000C123|501004821992|\*\*\*\*\*\*4821|'Savings'/],
  ['invented payout fixture', /PAY-0008|PO-2026-0038|₹10,800/],
  ['invented incident count', /14 incidents · 4 ongoing/],
];

describe('W5 source guard', () => {
  for (const rel of FILES) {
    it(`${rel} has none of the removed fakes`, () => {
      const src = code(read(rel));
      for (const [why, re] of FORBIDDEN) expect(src, `${rel}: ${why}`).not.toMatch(re);
    });
  }

  it('the flow passes the farmer UUID (not the TOHFA code) to the bank-account and payout screens', () => {
    const flow = code(read('screens/farmers/FarmerManagementFlow.tsx'));
    expect(flow).not.toMatch(/farmerId=\{selectedFarmer\.code \?\? selectedFarmer\.id\}/);
  });

  it('the produce record screens read records, never the crop-type dropdown list', () => {
    for (const rel of ['screens/produce/CropHistoryRecordsScreen.tsx', 'screens/produce/ZoneCropBreakdownScreen.tsx']) {
      const src = code(read(rel));
      expect(src, rel).toMatch(/useProduceRecordList/);
      expect(src, rel).not.toMatch(/filterOpts\?\.crops|crops\.slice\(0, 2\)/);
    }
  });

  it('BR-53: the bank screen gates its read on farmer.bank_account.view', () => {
    const src = code(read('screens/farmers/FarmerBankAccountDetailsScreen.tsx'));
    expect(src).toMatch(/farmer\.bank_account\.view/);
    expect(src).not.toMatch(/docType === 'CERTIFICATE'/);
  });
});
