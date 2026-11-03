import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

describe('AnimalDetailScreen - Health Record Form & Modal', () => {
  const filePath = path.resolve(__dirname, '../screens/farm/livestock/AnimalDetailScreen.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  it('contains the Add button in the Health tab', () => {
    expect(fileContent).toContain('healthTopBar');
    expect(fileContent).toContain('addHealthButton');
    expect(fileContent).toContain('setIsAddHealthModalVisible(true)');
  });

  it('contains the Add Health Record modal with the header and back button', () => {
    expect(fileContent).toContain('isAddHealthModalVisible');
    // Header title is now an i18n key (en: "Add Health Record").
    expect(fileContent).toContain("t('farmer.livestock.detail.health.addRecord')");
    expect(fileContent).toContain('GreenBackArrowIcon');
  });

  it('contains animal summary card with avatar, name and specs', () => {
    // The modal card has always rendered PawPrintIcon; the unused CowAvatarIcon was removed (lint).
    expect(fileContent).toContain('PawPrintIcon');
    expect(fileContent).toContain('modalAnimalCard');
    expect(fileContent).toContain('displayName');
    expect(fileContent).toContain('GenderSymbolIcon');
  });

  // The reference spec's example VALUES ("12 Jul 2026", "Dr. Anand", "FMD vaccine",
  // "FMD-2026-001", "10 Oct 2026", "vaccine_receipt.jpg (240 KB)") were mock data baked
  // into the screen; the wired screen must NOT contain them. The fields themselves remain.
  it('contains all 10 required form fields from the reference specification', () => {
    // The field captions used to be asserted as English literals in the source. They are i18n
    // keys now (en + ta), so the test pins the key in the source and its English value.
    const field = (key: string, english: string): void => {
      expect(fileContent).toContain(`t('${key}')`);
      expect((farmerEn as Record<string, string>)[key]).toBe(english);
      expect((farmerTa as Record<string, string>)[key]).toBeTruthy();
    };
    // 1. Record type (4 options, from the API enum table)
    field('farmer.livestock.detail.healthForm.recordType', 'Record type');
    expect(fileContent).toContain('HEALTH_RECORD_TYPE_OPTIONS');
    for (const v of ['VACCINATION', 'DEWORMING', 'CHECKUP', 'TREATMENT']) expect(fileContent).toContain(`'${v}'`);

    // 2. Record date
    field('farmer.livestock.detail.field.recordDate', 'Record date');
    expect(fileContent).not.toContain('12 Jul 2026');

    // 3. Veterinarian
    field('farmer.livestock.detail.field.veterinarian', 'Veterinarian');
    expect(fileContent).not.toContain('Dr. Anand');

    // 4. Vaccine name
    field('farmer.livestock.detail.field.vaccineName', 'Vaccine name');
    expect(fileContent).not.toContain('FMD vaccine');

    // 5. Dose and unit
    field('farmer.livestock.detail.field.dose', 'Dose');
    expect(fileContent).toContain('doseUnit');

    // 6. Administration route (default Injection (IM), now the enum INJECTION_IM with a translated label)
    field('farmer.livestock.detail.healthForm.administrationRoute', 'Administration route');
    expect(fileContent).toContain("useState<string>('INJECTION_IM')");
    expect((farmerEn as Record<string, string>)['farmer.livestock.detail.option.route.INJECTION_IM']).toBe('Injection (IM)');

    // 7. Batch / Lot number
    field('farmer.livestock.detail.field.batchNumber', 'Batch / Lot number');
    expect(fileContent).not.toContain('FMD-2026-001');

    // 8. Next vaccination date
    field('farmer.livestock.detail.healthForm.nextVaccinationDate', 'Next vaccination date');
    expect(fileContent).not.toContain('10 Oct 2026');

    // 9. Notes textarea
    field('farmer.livestock.detail.field.notes', 'Notes');

    // 10. Attachment (optional) — a real picker/upload now, never a fabricated file.
    expect(fileContent).toContain("t('farmer.livestock.detail.attachment.title')");
    expect(fileContent).toContain('handlePickAttachment(setAttachment');
    expect(fileContent).not.toContain('vaccine_receipt.jpg');
    expect(fileContent).not.toContain('240 KB');
  });

  it('contains Cancel and Save action buttons with appropriate handlers', () => {
    expect(fileContent).toContain('cancelBtn');
    expect(fileContent).toContain('saveBtn');
    expect(fileContent).toContain('handleSaveHealthRecord');
  });

  it('asserts no raw hex literals in AnimalDetailScreen.tsx', () => {
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
    const matches = fileContent.match(hexPattern);
    expect(matches).toBeNull();
  });

  it('asserts no forbidden emoji characters in AnimalDetailScreen.tsx', () => {
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u;
    expect(emojiPattern.test(fileContent)).toBe(false);
  });
});
