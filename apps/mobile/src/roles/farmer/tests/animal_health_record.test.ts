import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

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
    expect(fileContent).toContain('Add Health Record');
    expect(fileContent).toContain('GreenBackArrowIcon');
  });

  it('contains animal summary card with avatar, name and specs', () => {
    expect(fileContent).toContain('CowAvatarIcon');
    expect(fileContent).toContain('modalAnimalCard');
    expect(fileContent).toContain('displayName');
    expect(fileContent).toContain('GenderSymbolIcon');
  });

  it('contains all 10 required form fields from the reference specification', () => {
    // 1. Record type (with 4 pills)
    expect(fileContent).toContain('Record type');
    expect(fileContent).toContain('Vaccination');
    expect(fileContent).toContain('Deworming');
    expect(fileContent).toContain('Checkup');
    expect(fileContent).toContain('Treatment');

    // 2. Record date
    expect(fileContent).toContain('Record date');
    expect(fileContent).toContain('12 Jul 2026');

    // 3. Veterinarian dropdown
    expect(fileContent).toContain('Veterinarian');
    expect(fileContent).toContain('Dr. Anand');

    // 4. Vaccine name
    expect(fileContent).toContain('Vaccine name');
    expect(fileContent).toContain('FMD vaccine');

    // 5. Dose and unit
    expect(fileContent).toContain('Dose');
    expect(fileContent).toContain('doseUnit');

    // 6. Administration route
    expect(fileContent).toContain('Administration route');
    expect(fileContent).toContain('Injection (IM)');

    // 7. Batch / Lot number
    expect(fileContent).toContain('Batch / Lot number');
    expect(fileContent).toContain('FMD-2026-001');

    // 8. Next vaccination date with calendar icons
    expect(fileContent).toContain('Next vaccination date');
    expect(fileContent).toContain('10 Oct 2026');

    // 9. Notes textarea
    expect(fileContent).toContain('Notes');

    // 10. Attachment (optional)
    expect(fileContent).toContain('Attachment (optional)');
    expect(fileContent).toContain('vaccine_receipt.jpg');
    expect(fileContent).toContain('240 KB');
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
