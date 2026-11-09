/**
 * The add-record forms on AnimalDetailScreen validate on the device with the
 * SAME constraints the server's zod schemas apply
 * (apps/api/src/modules/livestock/livestock.schema.ts), so a farmer sees the
 * problem next to the field instead of a 422 after the round trip. These pin
 * the pure body builders in animalRecordForms.ts: required fields, enums,
 * lengths, positive numbers and the cross-field date rules (BR-138c and
 * friends), and that every body is shaped for the strict server variant.
 */
import { describe, expect, it } from 'vitest';
import {
  buildBreedingBody,
  buildFeedLogBody,
  buildFeedPlanBody,
  buildHealthBody,
  buildHousingBody,
  buildHygieneBody,
  buildProductionBody,
  initialFormValues,
  productionUnderWithdrawal,
  type FormValues,
} from '../screens/farm/livestock/animalRecordForms';
import { t } from '../../../i18n/farmer';

const A = 'a0000000-0000-4000-8000-000000000001';
const TODAY = '2026-07-12';

function values(kind: Parameters<typeof initialFormValues>[0], overrides: Record<string, string>): FormValues {
  return { ...initialFormValues(kind, TODAY), ...overrides };
}

function errorsOf<T>(result: { ok: true; body: T } | { ok: false; errors: Record<string, string> }): Record<string, string> {
  return result.ok ? {} : result.errors;
}

function bodyOf<T>(result: { ok: true; body: T } | { ok: false; errors: Record<string, string> }): T {
  if (!result.ok) throw new Error(`expected a body, got errors ${JSON.stringify(result.errors)}`);
  return result.body;
}

describe('health records', () => {
  it('defaults the record date to today (Asia/Kolkata date passed in)', () => {
    expect(initialFormValues('health', TODAY)['recordDate']).toBe(TODAY);
  });

  it('a vaccination needs a vaccine name, and sends only the vaccination fields', () => {
    expect(errorsOf(buildHealthBody(values('health', { recordType: 'VACCINATION' })))).toHaveProperty('vaccineName');
    const body = bodyOf(
      buildHealthBody(values('health', { recordType: 'VACCINATION', vaccineName: '  HS vaccine ', doseValue: '2', doseUnit: 'ML' })),
    );
    expect(body).toEqual({ recordType: 'VACCINATION', recordDate: TODAY, vaccineName: 'HS vaccine', dose: { value: 2, unit: 'ML' } });
  });

  it('rejects a name over the server limit of 160 characters', () => {
    const errors = errorsOf(buildHealthBody(values('health', { recordType: 'VACCINATION', vaccineName: 'x'.repeat(161) })));
    expect(errors['vaccineName']).toBe(t('farmer.livestock.detail.form.error.tooLong', { max: 160 }));
  });

  it('rejects a dose that is not more than zero', () => {
    const errors = errorsOf(buildHealthBody(values('health', { recordType: 'VACCINATION', vaccineName: 'HS', doseValue: '0' })));
    expect(errors['doseValue']).toBe(t('farmer.livestock.detail.form.error.positive'));
  });

  it('rejects a next due date before the record date', () => {
    const errors = errorsOf(
      buildHealthBody(values('health', { recordType: 'VACCINATION', vaccineName: 'HS', nextDueDate: '2026-07-11' })),
    );
    expect(errors).toHaveProperty('nextDueDate');
  });

  it('rejects a date that is not a real calendar date', () => {
    const errors = errorsOf(buildHealthBody(values('health', { recordType: 'VACCINATION', vaccineName: 'HS', recordDate: '2026-02-30' })));
    expect(errors['recordDate']).toBe(t('farmer.livestock.detail.form.error.date'));
  });

  it('a checkup needs type, veterinarian and clinic', () => {
    const errors = errorsOf(buildHealthBody(values('health', { recordType: 'CHECKUP', checkupType: '' })));
    expect(Object.keys(errors).sort()).toEqual(['checkupType', 'clinic', 'veterinarian']);
  });

  it('a checkup with follow-up required needs a follow-up date; without it no date is sent', () => {
    const base = { recordType: 'CHECKUP', checkupType: 'ROUTINE', veterinarian: 'Dr. Priya', clinic: 'Ooty vet' };
    expect(errorsOf(buildHealthBody(values('health', { ...base, followUpRequired: 'true' })))).toHaveProperty('followUpDate');
    const off = bodyOf(buildHealthBody(values('health', { ...base, followUpRequired: '', followUpDate: '2026-08-01' })));
    expect(off).not.toHaveProperty('followUpDate');
    expect(off).toMatchObject({ followUpRequired: false });
    const on = bodyOf(buildHealthBody(values('health', { ...base, followUpRequired: 'true', followUpDate: '2026-08-01' })));
    expect(on).toMatchObject({ followUpRequired: true, followUpDate: '2026-08-01' });
  });

  it('a checkup time must be HH:MM 24-hour', () => {
    const base = { recordType: 'CHECKUP', checkupType: 'ROUTINE', veterinarian: 'V', clinic: 'C' };
    expect(errorsOf(buildHealthBody(values('health', { ...base, checkupTime: '24:00' })))['checkupTime']).toBe(
      t('farmer.livestock.detail.form.error.time'),
    );
  });

  describe('treatment', () => {
    const base = { recordType: 'TREATMENT', condition: 'Mastitis', description: 'Herbal udder wash' };

    it('needs a condition and a description', () => {
      const errors = errorsOf(buildHealthBody(values('health', { recordType: 'TREATMENT' })));
      expect(Object.keys(errors).sort()).toEqual(['condition', 'description']);
    });

    it('BR-138c: rejects a withdrawal end date before its start date', () => {
      const errors = errorsOf(
        buildHealthBody(values('health', { ...base, milkWithdrawalStart: '2026-07-15', milkWithdrawalEnd: '2026-07-14' })),
      );
      expect(errors['milkWithdrawalEnd']).toBe(
        t('farmer.livestock.detail.form.error.notBefore', { field: t('farmer.livestock.detail.form.field.milkWithdrawalStart') }),
      );
    });

    it('BR-138c: rejects a withdrawal end date before the record date', () => {
      const errors = errorsOf(
        buildHealthBody(values('health', { ...base, milkWithdrawalStart: '2026-07-01', milkWithdrawalEnd: '2026-07-11' })),
      );
      expect(errors['milkWithdrawalEnd']).toBe(
        t('farmer.livestock.detail.form.error.notBefore', { field: t('farmer.livestock.detail.form.field.recordDate') }),
      );
      const meat = errorsOf(buildHealthBody(values('health', { ...base, meatWithdrawalEnd: '2026-07-10' })));
      expect(meat).toHaveProperty('meatWithdrawalEnd');
    });

    it('BR-138: a milk withdrawal needs both ends; a meat withdrawal needs its end', () => {
      expect(errorsOf(buildHealthBody(values('health', { ...base, milkWithdrawalStart: '2026-07-12' })))).toHaveProperty(
        'milkWithdrawalEnd',
      );
      expect(errorsOf(buildHealthBody(values('health', { ...base, milkWithdrawalEnd: '2026-07-20' })))).toHaveProperty(
        'milkWithdrawalStart',
      );
      expect(errorsOf(buildHealthBody(values('health', { ...base, meatWithdrawalStart: '2026-07-12' })))).toHaveProperty(
        'meatWithdrawalEnd',
      );
    });

    it('BR-138: sends valid withdrawal windows (meat start optional)', () => {
      const body = bodyOf(
        buildHealthBody(
          values('health', { ...base, milkWithdrawalStart: '2026-07-12', milkWithdrawalEnd: '2026-07-20', meatWithdrawalEnd: '2026-07-30' }),
        ),
      );
      expect(body).toMatchObject({
        recordType: 'TREATMENT',
        condition: 'Mastitis',
        description: 'Herbal udder wash',
        milkWithdrawal: { startDate: '2026-07-12', endDate: '2026-07-20' },
        meatWithdrawal: { endDate: '2026-07-30' },
      });
      expect((body as { meatWithdrawal: Record<string, unknown> }).meatWithdrawal).not.toHaveProperty('startDate');
    });

    it('BR-138: rejects a medication end date before the medication start date', () => {
      const errors = errorsOf(
        buildHealthBody(values('health', { ...base, medicationStartDate: '2026-07-12', medicationEndDate: '2026-07-11' })),
      );
      expect(errors).toHaveProperty('medicationEndDate');
    });

    it('BR-138d: withdrawal fields never ride along on a non-treatment record', () => {
      const body = bodyOf(
        buildHealthBody(
          values('health', {
            recordType: 'VACCINATION',
            vaccineName: 'HS',
            milkWithdrawalStart: '2026-07-12',
            milkWithdrawalEnd: '2026-07-20',
            condition: 'stale',
          }),
        ),
      );
      expect(Object.keys(body)).not.toContain('milkWithdrawal');
      expect(Object.keys(body)).not.toContain('condition');
    });
  });
});

describe('breeding records', () => {
  it('a heat record needs a breeding method and a sire', () => {
    const errors = errorsOf(buildBreedingBody(values('breeding', { recordType: 'HEAT', breedingMethod: '' })));
    expect(Object.keys(errors).sort()).toEqual(['breedingMethod', 'sire']);
  });

  it('a pregnancy check needs a next check date on or after the record date', () => {
    const base = { recordType: 'PREGNANCY_CHECK', checkType: 'ROUTINE', result: 'POSITIVE', examinationMethod: 'ULTRASOUND' };
    expect(errorsOf(buildBreedingBody(values('breeding', base)))).toHaveProperty('nextCheckDate');
    expect(errorsOf(buildBreedingBody(values('breeding', { ...base, nextCheckDate: '2026-07-01' })))).toHaveProperty('nextCheckDate');
    expect(
      errorsOf(buildBreedingBody(values('breeding', { ...base, nextCheckDate: '2026-08-01', expectedDeliveryDate: '2026-07-01' }))),
    ).toHaveProperty('expectedDeliveryDate');
    expect(bodyOf(buildBreedingBody(values('breeding', { ...base, nextCheckDate: '2026-08-01' })))).toEqual({
      recordType: 'PREGNANCY_CHECK',
      recordDate: TODAY,
      checkType: 'ROUTINE',
      result: 'POSITIVE',
      examinationMethod: 'ULTRASOUND',
      nextCheckDate: '2026-08-01',
    });
  });

  it('a calving offspring count is a whole number from 0 to 20', () => {
    const base = { recordType: 'CALVING', outcome: 'LIVE_BIRTH' };
    expect(errorsOf(buildBreedingBody(values('breeding', { ...base, offspringCount: '1.5' })))).toHaveProperty('offspringCount');
    expect(errorsOf(buildBreedingBody(values('breeding', { ...base, offspringCount: '21' })))).toHaveProperty('offspringCount');
    expect(bodyOf(buildBreedingBody(values('breeding', { ...base, offspringCount: '0' })))).toMatchObject({ offspringCount: 0 });
  });
});

describe('feed plans and feed logs', () => {
  it('a feed plan needs a feed type and a water source', () => {
    const errors = errorsOf(buildFeedPlanBody(values('feedPlan', { feedType: '', waterSource: '' })));
    expect(Object.keys(errors).sort()).toEqual(['feedType', 'waterSource']);
  });

  it('grazing is at most 24 hours per day and 168 hours per week', () => {
    const base = { feedType: 'GREEN_FODDER', waterSource: 'WELL' };
    expect(errorsOf(buildFeedPlanBody(values('feedPlan', { ...base, grazingValue: '25', grazingUnit: 'HOURS_PER_DAY' })))).toHaveProperty(
      'grazingValue',
    );
    expect(errorsOf(buildFeedPlanBody(values('feedPlan', { ...base, grazingValue: '169', grazingUnit: 'HOURS_PER_WEEK' })))).toHaveProperty(
      'grazingValue',
    );
    expect(bodyOf(buildFeedPlanBody(values('feedPlan', { ...base, grazingValue: '100', grazingUnit: 'HOURS_PER_WEEK' })))).toMatchObject({
      grazingDuration: { value: 100, unit: 'HOURS_PER_WEEK' },
      feedType: 'GREEN_FODDER',
      waterSource: 'WELL',
    });
  });

  it('a feed log needs a quantity above zero and within the server maximum', () => {
    const base = { feedType: 'GREEN_FODDER', unit: 'KG' };
    expect(errorsOf(buildFeedLogBody(values('feedLog', { ...base, quantity: '' })))).toHaveProperty('quantity');
    expect(errorsOf(buildFeedLogBody(values('feedLog', { ...base, quantity: '-3' })))).toHaveProperty('quantity');
    expect(errorsOf(buildFeedLogBody(values('feedLog', { ...base, quantity: '10000000' })))).toHaveProperty('quantity');
    expect(errorsOf(buildFeedLogBody(values('feedLog', { ...base, quantity: 'abc' })))['quantity']).toBe(
      t('farmer.livestock.detail.form.error.number'),
    );
    expect(bodyOf(buildFeedLogBody(values('feedLog', { ...base, quantity: '18.5' })))).toEqual({
      fedOn: TODAY,
      feedType: 'GREEN_FODDER',
      quantity: 18.5,
      unit: 'KG',
    });
  });
});

describe('housing and hygiene', () => {
  it('housing needs a positive indoor space; outdoor space may be zero', () => {
    const base = { housingType: 'BARN', housingName: 'Main barn' };
    expect(errorsOf(buildHousingBody(values('housing', { ...base, indoorValue: '0', outdoorValue: '0' })))).toHaveProperty('indoorValue');
    expect(bodyOf(buildHousingBody(values('housing', { ...base, indoorValue: '14', outdoorValue: '0' })))).toEqual({
      housingType: 'BARN',
      housingName: 'Main barn',
      indoorSpacePerAnimal: { value: 14, unit: 'SQ_FT' },
      outdoorSpace: { value: 0, unit: 'SQ_FT' },
      startDate: TODAY,
    });
  });

  it('hygiene needs an activity', () => {
    expect(errorsOf(buildHygieneBody(values('hygiene', { activity: '  ' })))).toHaveProperty('activity');
    expect(bodyOf(buildHygieneBody(values('hygiene', { activity: 'Floor scrubbed' })))).toEqual({
      activity: 'Floor scrubbed',
      performedOn: TODAY,
    });
  });
});

describe('production (MEAT / WOOL / MANURE)', () => {
  it('always logs in KG for the animal, with no fatPercent', () => {
    for (const productType of ['MEAT', 'WOOL', 'MANURE']) {
      const body = bodyOf(buildProductionBody(values('production', { productType, quantity: '4.2' }), A));
      expect(body).toEqual({ animalId: A, productType, quantity: 4.2, unit: 'KG', loggedOn: TODAY });
      expect(body).not.toHaveProperty('fatPercent');
    }
  });

  it('only MEAT, WOOL or MANURE can be logged here', () => {
    expect(errorsOf(buildProductionBody(values('production', { productType: 'MILK', quantity: '3' }), A))).toHaveProperty('productType');
  });

  it('a quantity must be more than zero', () => {
    expect(errorsOf(buildProductionBody(values('production', { productType: 'WOOL', quantity: '0' }), A))).toHaveProperty('quantity');
  });

  it('BR-139: an animal is under withdrawal for a log when withdrawalUntil is on or after the logged date', () => {
    expect(productionUnderWithdrawal('2026-07-12', '2026-07-12', TODAY)).toBe(true);
    expect(productionUnderWithdrawal('2026-07-11', '2026-07-12', TODAY)).toBe(false);
    expect(productionUnderWithdrawal(null, '2026-07-12', TODAY)).toBe(false);
    // A back-dated log inside an already-ended window is still restricted by the server.
    expect(productionUnderWithdrawal('2026-07-05', '2026-07-01', TODAY)).toBe(true);
    // An unparseable logged date falls back to today, the server's default.
    expect(productionUnderWithdrawal('2026-07-12', 'not a date', TODAY)).toBe(true);
  });
});
