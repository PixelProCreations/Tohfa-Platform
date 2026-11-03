/**
 * AnimalDetailScreen's add-record modals used to "save" by pushing a fake row
 * into local state (and the production modal logged MEAT/WOOL/MANURE as MILK,
 * always in litres). These tests pin the pure form -> request-body mapping in
 * `screens/farm/livestock/animalRecordForms.ts` to the real Zod contract in
 * apps/api/src/modules/livestock/livestock.schema.ts: exact enum values,
 * YYYY-MM-DD dates, exact unit conversion (no float drift), and validation
 * that refuses to build a body the server would 422.
 */
import { describe, expect, it } from 'vitest';
import {
  BREEDING_RECORD_TYPE_OPTIONS,
  FEED_LOG_UNIT_OPTIONS,
  FEED_TYPE_OPTIONS,
  HEALTH_RECORD_TYPE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  PRODUCTION_UNIT_OPTIONS,
  VACCINATION_ROUTE_OPTIONS,
  WATER_SOURCE_OPTIONS,
  buildCalvingBody,
  buildCheckupBody,
  buildDewormingBody,
  buildFeedLogBody,
  buildFeedPlanBody,
  buildHeatBody,
  buildHousingRecordBody,
  buildHygieneLogBody,
  buildInseminationBody,
  buildPregnancyCheckBody,
  buildProductionLogBody,
  buildTreatmentBody,
  buildVaccinationBody,
  fieldErrorMessage,
  optionLabel,
  optionValues,
  parseFormDate,
  parseFormTime,
  scaleDecimal,
  type BuildResult,
  type FieldError,
} from '../screens/farm/livestock/animalRecordForms';
import {
  breedingRecordTypes,
  feedTypes,
  healthRecordTypes,
  housingTypes,
  waterSources,
} from '../api/livestock';

const ANIMAL = 'a0000000-0000-4000-8000-000000000001';

function errorsOf<B>(result: BuildResult<B>): FieldError[] {
  if (result.ok) throw new Error(`expected validation errors, got body ${JSON.stringify(result.body)}`);
  return result.errors;
}

function bodyOf<B>(result: BuildResult<B>): B {
  if (!result.ok) throw new Error(`expected a body, got errors ${JSON.stringify(result.errors)}`);
  return result.body;
}

describe('parseFormDate', () => {
  it.each([
    ['2026-07-12', '2026-07-12'],
    ['12/07/2026', '2026-07-12'],
    ['1/7/2026', '2026-07-01'],
    ['12-07-2026', '2026-07-12'],
    ['12.07.2026', '2026-07-12'],
    ['12/07/26', '2026-07-12'],
    ['12 Jul 2026', '2026-07-12'],
    ['12 july 2026', '2026-07-12'],
    ['  3 Feb 2025 ', '2025-02-03'],
  ])('%s -> %s', (input, expected) => {
    expect(parseFormDate(input)).toBe(expected);
  });

  it('returns undefined for a blank value (an optional date that was left empty)', () => {
    expect(parseFormDate('')).toBeUndefined();
    expect(parseFormDate('   ')).toBeUndefined();
  });

  it.each(['31/02/2026', '2026-13-01', '00/01/2026', 'tomorrow', '12 Foo 2026', '12/07', '2026-7-1x'])(
    'rejects %s',
    (input) => {
      expect(parseFormDate(input)).toBeNull();
    },
  );
});

describe('parseFormTime', () => {
  it('pads and accepts HH:MM 24-hour', () => {
    expect(parseFormTime('7:05')).toBe('07:05');
    expect(parseFormTime('23:59')).toBe('23:59');
    expect(parseFormTime('')).toBeUndefined();
  });
  it('rejects anything else', () => {
    expect(parseFormTime('24:00')).toBeNull();
    expect(parseFormTime('7pm')).toBeNull();
  });
});

describe('scaleDecimal — exact decimal maths, no float drift', () => {
  it('ml -> L', () => {
    expect(scaleDecimal('750', '0.001')).toBe('0.75');
    expect(scaleDecimal('1', '0.001')).toBe('0.001');
  });
  it('lb -> kg (0.45359237 exactly), rounded half-up to 3 dp', () => {
    expect(scaleDecimal('2.5', '0.45359237')).toBe('1.134');
    expect(scaleDecimal('10', '0.45359237')).toBe('4.536');
    expect(scaleDecimal('1', '0.45359237')).toBe('0.454');
  });
  it('a value that floats would drift on stays exact', () => {
    // 0.1 + 0.2 style: 0.3 * 3 in floats is 0.8999999999999999.
    expect(scaleDecimal('0.3', '3')).toBe('0.9');
    expect(scaleDecimal('1.005', '1', 2)).toBe('1.01');
  });
  it('rejects non-decimals', () => {
    expect(scaleDecimal('abc', '1')).toBeNull();
    expect(scaleDecimal('1e3', '1')).toBeNull();
    expect(scaleDecimal('-1', '1')).toBeNull();
  });
});

describe('health records', () => {
  it('VACCINATION: maps every UI field to the API body', () => {
    const body = bodyOf(
      buildVaccinationBody({
        recordDate: '12/07/2026',
        veterinarian: ' Dr. Rao ',
        vaccineName: 'FMD',
        dose: '2',
        doseUnit: 'ML',
        route: 'INJECTION_SC',
        batchNumber: 'B-1',
        nextDueDate: '10 Oct 2026',
        notes: '',
      }),
    );
    expect(body).toEqual({
      recordType: 'VACCINATION',
      recordDate: '2026-07-12',
      veterinarian: 'Dr. Rao',
      vaccineName: 'FMD',
      dose: { value: 2, unit: 'ML' },
      route: 'INJECTION_SC',
      batchNumber: 'B-1',
      nextDueDate: '2026-10-10',
    });
  });

  it('VACCINATION: a 0 dose (the form default) is omitted, not sent', () => {
    const body = bodyOf(
      buildVaccinationBody({ recordDate: '2026-07-12', vaccineName: 'HS', dose: '0', doseUnit: 'ML', route: 'ORAL' }),
    );
    expect(body).not.toHaveProperty('dose');
    expect(body.route).toBe('ORAL');
  });

  it('VACCINATION: blocks a missing name, a bad date and a next date before the record date', () => {
    const errs = errorsOf(
      buildVaccinationBody({ recordDate: '31/02/2026', vaccineName: '  ', nextDueDate: '2026-01-01' }),
    );
    expect(errs).toEqual(
      expect.arrayContaining([
        { field: 'recordDate', problem: 'invalidDate' },
        { field: 'vaccineName', problem: 'required' },
      ]),
    );
    const order = errorsOf(
      buildVaccinationBody({ recordDate: '2026-07-12', vaccineName: 'FMD', nextDueDate: '2026-07-01' }),
    );
    expect(order).toEqual([{ field: 'nextDueDate', problem: 'beforeRecordDate' }]);
  });

  it('DEWORMING: maps product, parasite, route, weight unit and reaction', () => {
    const body = bodyOf(
      buildDewormingBody({
        recordDate: '01/07/2026',
        productName: 'Albendazole',
        activeIngredient: '',
        targetParasite: 'TICKS_AND_LICE',
        dose: '10',
        doseUnit: 'ML',
        route: 'POUR_ON',
        animalWeight: '320',
        weightUnit: 'KG',
        batchNumber: '',
        expiryDate: '',
        administeredBy: 'Self',
        nextDueDate: '01/10/2026',
        observedReaction: '',
        notes: 'ok',
      }),
    );
    expect(body).toEqual({
      recordType: 'DEWORMING',
      recordDate: '2026-07-01',
      productName: 'Albendazole',
      targetParasite: 'TICKS_AND_LICE',
      dose: { value: 10, unit: 'ML' },
      route: 'POUR_ON',
      animalWeight: { value: 320, unit: 'KG' },
      administeredBy: 'Self',
      nextDueDate: '2026-10-01',
      notes: 'ok',
    });
  });

  it('CHECKUP: requires type, vet and clinic; follow-up date only when follow-up is Yes', () => {
    const errs = errorsOf(buildCheckupBody({ recordDate: '2026-07-12', checkupType: '', veterinarian: '', clinic: '' }));
    expect(errs).toEqual(
      expect.arrayContaining([
        { field: 'checkupType', problem: 'required' },
        { field: 'veterinarian', problem: 'required' },
        { field: 'clinic', problem: 'required' },
      ]),
    );
    expect(
      errorsOf(
        buildCheckupBody({
          recordDate: '2026-07-12',
          checkupType: 'ROUTINE',
          veterinarian: 'Dr. Rao',
          clinic: 'Ooty Vet',
          followUpRequired: 'YES',
          followUpDate: '',
        }),
      ),
    ).toEqual([{ field: 'followUpDate', problem: 'required' }]);

    const body = bodyOf(
      buildCheckupBody({
        recordDate: '12 Jul 2026',
        time: '9:30',
        checkupType: 'POST_CALVING',
        veterinarian: 'Dr. Rao',
        clinic: 'Ooty Vet',
        bodyTemp: '38.6',
        bodyTempUnit: 'C',
        bodyWeight: '0',
        bodyWeightUnit: 'KG',
        healthStatus: 'MILD_ILLNESS',
        appetite: 'VERY_LOW',
        activityLevel: '',
        symptoms: 'cough',
        findings: '',
        diagnosis: '',
        treatmentRequired: 'YES',
        followUpRequired: 'NO',
        followUpDate: '2026-08-01',
        recommendedActions: '',
      }),
    );
    expect(body).toEqual({
      recordType: 'CHECKUP',
      recordDate: '2026-07-12',
      checkupTime: '09:30',
      checkupType: 'POST_CALVING',
      veterinarian: 'Dr. Rao',
      clinic: 'Ooty Vet',
      bodyTemperature: { value: 38.6, unit: 'C' },
      healthStatus: 'MILD_ILLNESS',
      appetite: 'VERY_LOW',
      symptoms: 'cough',
      treatmentRequired: true,
      // followUpRequired false => the server rejects a followUpDate, so the typed one is dropped.
      followUpRequired: false,
    });
  });

  it('BR-137: TREATMENT with milk + meat withdrawal sends both windows as YYYY-MM-DD', () => {
    const body = bodyOf(
      buildTreatmentBody({
        recordDate: '12/07/2026',
        treatmentType: 'FIRST_AID',
        condition: 'Mastitis',
        symptoms: '',
        description: 'Herbal udder wash',
        medicineName: 'Neem paste',
        dosage: '5',
        dosageUnit: 'GRAM',
        route: 'INTRA_MAMMARY',
        frequency: 'TWICE_DAILY',
        startDate: '12/07/2026',
        endDate: '15/07/2026',
        milkWithdrawalRequired: 'YES',
        milkWithdrawalStart: '12/07/2026',
        milkWithdrawalEnd: '19/07/2026',
        withdrawalReason: 'Residue',
        meatWithdrawalRequired: 'YES',
        meatWithdrawalEnd: '26/07/2026',
        prescribedBy: 'Dr. Rao',
        administeredBy: '',
        notes: '',
      }),
    );
    expect(body).toEqual({
      recordType: 'TREATMENT',
      recordDate: '2026-07-12',
      treatmentType: 'FIRST_AID',
      condition: 'Mastitis',
      description: 'Herbal udder wash',
      medicineName: 'Neem paste',
      dosage: { value: 5, unit: 'GRAM' },
      route: 'INTRA_MAMMARY',
      frequency: 'TWICE_DAILY',
      medicationStartDate: '2026-07-12',
      medicationEndDate: '2026-07-15',
      milkWithdrawal: { startDate: '2026-07-12', endDate: '2026-07-19', reason: 'Residue' },
      meatWithdrawal: { endDate: '2026-07-26' },
      prescribedBy: 'Dr. Rao',
    });
  });

  it('BR-137c: a withdrawal that ends before it starts / before the record date is blocked client-side', () => {
    const errs = errorsOf(
      buildTreatmentBody({
        recordDate: '2026-07-12',
        condition: 'Mastitis',
        description: 'x',
        milkWithdrawalRequired: 'YES',
        milkWithdrawalStart: '2026-07-12',
        milkWithdrawalEnd: '2026-07-10',
        meatWithdrawalRequired: 'YES',
        meatWithdrawalEnd: '2026-07-01',
      }),
    );
    expect(errs).toEqual(
      expect.arrayContaining([
        { field: 'milkWithdrawalEnd', problem: 'beforeStartDate' },
        { field: 'meatWithdrawalEnd', problem: 'beforeRecordDate' },
      ]),
    );
  });

  it('TREATMENT: "No" withdrawal sends no window even if dates were typed', () => {
    const body = bodyOf(
      buildTreatmentBody({
        recordDate: '2026-07-12',
        condition: 'Wound',
        description: 'cleaned',
        milkWithdrawalRequired: 'NO',
        milkWithdrawalStart: '2026-07-12',
        milkWithdrawalEnd: '2026-07-19',
        meatWithdrawalRequired: 'NO',
      }),
    );
    expect(body).not.toHaveProperty('milkWithdrawal');
    expect(body).not.toHaveProperty('meatWithdrawal');
  });
});

describe('breeding records', () => {
  it('HEAT requires a sire and maps the breeding method', () => {
    expect(errorsOf(buildHeatBody({ recordDate: '2026-02-12', breedingMethod: 'NATURAL_SERVICE', sire: '' }))).toEqual([
      { field: 'sire', problem: 'required' },
    ]);
    expect(
      bodyOf(buildHeatBody({ recordDate: '12/02/2026', breedingMethod: 'NATURAL_SERVICE', sire: 'B-07', heatSigns: 'restless' })),
    ).toEqual({
      recordType: 'HEAT',
      recordDate: '2026-02-12',
      breedingMethod: 'NATURAL_SERVICE',
      sire: 'B-07',
      heatSigns: 'restless',
    });
  });

  it('INSEMINATION maps type and HH:MM time', () => {
    expect(
      bodyOf(buildInseminationBody({ recordDate: '12/02/2026', inseminationType: 'ARTIFICIAL', time: '6:15', technician: 'Ravi' })),
    ).toEqual({
      recordType: 'INSEMINATION',
      recordDate: '2026-02-12',
      inseminationType: 'ARTIFICIAL',
      inseminationTime: '06:15',
      technician: 'Ravi',
    });
    expect(errorsOf(buildInseminationBody({ recordDate: '2026-02-12', inseminationType: 'ARTIFICIAL', time: '25:00' }))).toEqual([
      { field: 'inseminationTime', problem: 'invalidTime' },
    ]);
  });

  it('PREGNANCY_CHECK requires a next check date and maps result / method', () => {
    expect(
      errorsOf(
        buildPregnancyCheckBody({
          recordDate: '2026-04-01',
          checkType: 'ROUTINE',
          result: 'POSITIVE',
          examinationMethod: 'ULTRASOUND',
          nextCheckDate: '',
        }),
      ),
    ).toEqual([{ field: 'nextCheckDate', problem: 'required' }]);
    expect(
      bodyOf(
        buildPregnancyCheckBody({
          recordDate: '01/04/2026',
          checkType: 'CONFIRMATION',
          result: 'INCONCLUSIVE',
          examinationMethod: 'RECTAL_PALPATION',
          expectedDeliveryDate: '20 Nov 2026',
          nextCheckDate: '01/05/2026',
        }),
      ),
    ).toEqual({
      recordType: 'PREGNANCY_CHECK',
      recordDate: '2026-04-01',
      checkType: 'CONFIRMATION',
      result: 'INCONCLUSIVE',
      examinationMethod: 'RECTAL_PALPATION',
      expectedDeliveryDate: '2026-11-20',
      nextCheckDate: '2026-05-01',
    });
  });

  it('CALVING maps outcome, count, delivery type, gender and birth weight unit', () => {
    expect(
      bodyOf(
        buildCalvingBody({
          recordDate: '14/03/2025',
          outcome: 'LIVE_BIRTH',
          offspringCount: '1',
          deliveryType: 'ASSISTED',
          offspringName: 'Nila',
          offspringGender: 'FEMALE',
          birthWeight: '28.5',
          birthWeightUnit: 'LB',
          findings: '',
        }),
      ),
    ).toEqual({
      recordType: 'CALVING',
      recordDate: '2025-03-14',
      outcome: 'LIVE_BIRTH',
      offspringCount: 1,
      deliveryType: 'ASSISTED',
      offspringName: 'Nila',
      offspringGender: 'FEMALE',
      birthWeight: { value: 28.5, unit: 'LB' },
    });
    expect(errorsOf(buildCalvingBody({ recordDate: '2025-03-14', outcome: 'STILLBIRTH', offspringCount: '2.5' }))).toEqual([
      { field: 'offspringCount', problem: 'notWholeNumber' },
    ]);
  });
});

describe('feed plan', () => {
  it('maps type, water source, grazing and items; drops blank item rows', () => {
    const body = bodyOf(
      buildFeedPlanBody({
        planName: 'Summer',
        feedType: 'PASTURE_GRAZING',
        source: 'Own farm',
        grazingDuration: '5',
        grazingUnit: 'HOURS_PER_DAY',
        waterSource: 'POND_RIVER',
        startTime: '6:00',
        endTime: '11:00',
        items: [
          { name: 'Napier grass', amount: '18', unit: 'KG_PER_DAY' },
          { name: '', amount: '', unit: 'KG_PER_DAY' },
        ],
        notes: '',
      }),
    );
    expect(body).toEqual({
      planName: 'Summer',
      feedType: 'PASTURE_GRAZING',
      source: 'Own farm',
      grazingDuration: { value: 5, unit: 'HOURS_PER_DAY' },
      waterSource: 'POND_RIVER',
      startTime: '06:00',
      endTime: '11:00',
      items: [{ name: 'Napier grass', amount: 18, unit: 'KG_PER_DAY' }],
    });
  });

  it('blocks a missing water source, >24 h/day grazing and a half-filled item', () => {
    const errs = errorsOf(
      buildFeedPlanBody({
        feedType: 'GREEN_FODDER',
        waterSource: '',
        grazingDuration: '30',
        grazingUnit: 'HOURS_PER_DAY',
        items: [{ name: 'Hay', amount: '', unit: 'KG_PER_DAY' }],
      }),
    );
    expect(errs).toEqual(
      expect.arrayContaining([
        { field: 'waterSource', problem: 'required' },
        { field: 'grazingDuration', problem: 'outOfRange' },
        { field: 'feedItems', problem: 'incomplete' },
      ]),
    );
  });
});

describe('housing record', () => {
  it('maps type, name, spaces and start date', () => {
    expect(
      bodyOf(
        buildHousingRecordBody({
          housingType: 'OPEN_SHED',
          housingName: 'North shed',
          location: '',
          indoorSpace: '12',
          indoorUnit: 'SQ_FT',
          outdoorSpace: '0',
          outdoorUnit: 'SQ_M',
          startDate: '01/06/2026',
          notes: '',
        }),
      ),
    ).toEqual({
      housingType: 'OPEN_SHED',
      housingName: 'North shed',
      indoorSpacePerAnimal: { value: 12, unit: 'SQ_FT' },
      outdoorSpace: { value: 0, unit: 'SQ_M' },
      startDate: '2026-06-01',
    });
  });

  it('requires name, a positive indoor space and a start date', () => {
    const errs = errorsOf(
      buildHousingRecordBody({ housingType: 'BARN', housingName: '', indoorSpace: '0', indoorUnit: 'SQ_FT', outdoorSpace: '', outdoorUnit: 'SQ_FT', startDate: '' }),
    );
    expect(errs).toEqual(
      expect.arrayContaining([
        { field: 'housingName', problem: 'required' },
        { field: 'indoorSpace', problem: 'notPositive' },
        { field: 'outdoorSpace', problem: 'required' },
        { field: 'startDate', problem: 'required' },
      ]),
    );
  });
});

describe('production log — product type and unit exactness', () => {
  const base = { animalId: ANIMAL, date: '03/11/2026', restrictedFromSale: false, notes: '', details: [] };

  it('MILK in ml is converted to litres exactly, with session, grade and fat %', () => {
    expect(
      bodyOf(
        buildProductionLogBody({
          ...base,
          productionType: 'MILK',
          quantity: '750',
          unit: 'ML',
          session: 'EVENING',
          qualityGrade: 'Grade A',
          fatPercent: '4.25',
        }),
      ),
    ).toEqual({
      animalId: ANIMAL,
      productType: 'MILK',
      quantity: 0.75,
      unit: 'LITERS',
      loggedOn: '2026-11-03',
      session: 'EVENING',
      qualityGrade: 'Grade A',
      fatPercent: 4.25,
      restrictedFromSale: false,
    });
  });

  it('MEAT in lbs is logged as MEAT in KG (never MILK / LITERS)', () => {
    const body = bodyOf(buildProductionLogBody({ ...base, productionType: 'MEAT', quantity: '10', unit: 'LB', qualityGrade: 'Grade 1 (Prime)' }));
    expect(body).toMatchObject({ productType: 'MEAT', quantity: 4.536, unit: 'KG', qualityGrade: 'Grade 1 (Prime)' });
    expect(body).not.toHaveProperty('session');
    expect(body).not.toHaveProperty('fatPercent');
  });

  it('WOOL and MANURE are their own product types in KG; tonnes convert exactly', () => {
    expect(bodyOf(buildProductionLogBody({ ...base, productionType: 'WOOL', quantity: '2.5', unit: 'LB' }))).toMatchObject({
      productType: 'WOOL',
      quantity: 1.134,
      unit: 'KG',
    });
    expect(bodyOf(buildProductionLogBody({ ...base, productionType: 'MANURE', quantity: '1.25', unit: 'TONNE' }))).toMatchObject({
      productType: 'MANURE',
      quantity: 1250,
      unit: 'KG',
    });
  });

  it('EGGS: trays of 30 become a whole COUNT', () => {
    expect(
      bodyOf(buildProductionLogBody({ ...base, productionType: 'EGGS', quantity: '2', unit: 'TRAYS_30', session: 'MORNING' })),
    ).toMatchObject({ productType: 'EGGS', quantity: 60, unit: 'COUNT', session: 'MORNING' });
    expect(errorsOf(buildProductionLogBody({ ...base, productionType: 'EGGS', quantity: '2.5', unit: 'PIECES' }))).toEqual([
      { field: 'quantity', problem: 'notWholeNumber' },
    ]);
  });

  it('refuses a unit with no exact conversion (milk by weight, manure by bag) instead of guessing', () => {
    expect(errorsOf(buildProductionLogBody({ ...base, productionType: 'MILK', quantity: '10', unit: 'KG' }))).toEqual([
      { field: 'unit', problem: 'unsupportedUnit' },
    ]);
    expect(errorsOf(buildProductionLogBody({ ...base, productionType: 'MANURE', quantity: '3', unit: 'BAGS' }))).toEqual([
      { field: 'unit', problem: 'unsupportedUnit' },
    ]);
  });

  it('blocks a missing date / quantity and sends nothing', () => {
    const errs = errorsOf(buildProductionLogBody({ ...base, date: '', productionType: 'MILK', quantity: '', unit: 'L' }));
    expect(errs).toEqual(
      expect.arrayContaining([
        { field: 'productionDate', problem: 'required' },
        { field: 'quantity', problem: 'required' },
      ]),
    );
  });

  it('BR-139: sends the farmer-chosen restrictedFromSale flag explicitly', () => {
    expect(
      bodyOf(buildProductionLogBody({ ...base, productionType: 'MILK', quantity: '5', unit: 'L', restrictedFromSale: true })),
    ).toMatchObject({ restrictedFromSale: true });
  });

  it('folds form-only details into notes, after the farmer note', () => {
    const body = bodyOf(
      buildProductionLogBody({
        ...base,
        productionType: 'MILK',
        quantity: '5',
        unit: 'L',
        notes: 'calm',
        details: [
          { label: 'Milk appearance', value: 'Normal' },
          { label: 'Empty', value: '' },
        ],
      }),
    );
    expect(body.notes).toBe('calm\nMilk appearance: Normal');
  });
});

describe('calving time (createBreedingRecordBody CALVING.calvingTime)', () => {
  it('sends an optional HH:MM 24-hour calvingTime, padded', () => {
    expect(bodyOf(buildCalvingBody({ recordDate: '2026-03-14', outcome: 'LIVE_BIRTH', time: '5:40' }))).toEqual({
      recordType: 'CALVING',
      recordDate: '2026-03-14',
      outcome: 'LIVE_BIRTH',
      calvingTime: '05:40',
    });
    expect(bodyOf(buildCalvingBody({ recordDate: '2026-03-14', outcome: 'LIVE_BIRTH', time: '' }))).not.toHaveProperty(
      'calvingTime',
    );
  });

  it.each(['24:00', '12:60', '7pm', '12.30', '1230'])('rejects %s (server regex ^([01]\\d|2[0-3]):[0-5]\\d$)', (time) => {
    expect(errorsOf(buildCalvingBody({ recordDate: '2026-03-14', outcome: 'LIVE_BIRTH', time }))).toEqual([
      { field: 'calvingTime', problem: 'invalidTime' },
    ]);
  });

  it('every accepted time matches the server regex', () => {
    const server = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const time of ['0:00', '00:00', '9:05', '23:59']) {
      const body = bodyOf(buildCalvingBody({ recordDate: '2026-03-14', outcome: 'LIVE_BIRTH', time }));
      expect(body.calvingTime).toMatch(server);
    }
  });
});

describe('feed log (createFeedLogBody)', () => {
  it('maps date, enum feed type, positive decimal quantity and enum unit', () => {
    expect(
      bodyOf(buildFeedLogBody({ fedOn: '16/07/2026', feedType: 'DRY_FODDER', quantity: '2.75', unit: 'BUNDLES', notes: ' wet ' })),
    ).toEqual({ fedOn: '2026-07-16', feedType: 'DRY_FODDER', quantity: 2.75, unit: 'BUNDLES', notes: 'wet' });
  });

  it('blocks a missing date, an unknown feed type / unit, and a zero or negative quantity', () => {
    expect(errorsOf(buildFeedLogBody({ fedOn: '', feedType: 'Green fodder', quantity: '0', unit: 'kg' }))).toEqual(
      expect.arrayContaining([
        { field: 'fedOn', problem: 'required' },
        { field: 'feedType', problem: 'required' },
        { field: 'unit', problem: 'required' },
        { field: 'quantity', problem: 'notPositive' },
      ]),
    );
    expect(errorsOf(buildFeedLogBody({ fedOn: '2026-07-16', feedType: 'SILAGE', quantity: '-1', unit: 'KG' }))).toEqual([
      { field: 'quantity', problem: 'notPositive' },
    ]);
    expect(errorsOf(buildFeedLogBody({ fedOn: '2026-07-16', feedType: 'SILAGE', quantity: 'abc', unit: 'KG' }))).toEqual([
      { field: 'quantity', problem: 'invalidNumber' },
    ]);
    expect(errorsOf(buildFeedLogBody({ fedOn: '2026-07-16', feedType: 'SILAGE', quantity: '10000000', unit: 'KG' }))).toEqual([
      { field: 'quantity', problem: 'outOfRange' },
    ]);
    expect(errorsOf(buildFeedLogBody({ fedOn: '2026-07-16', feedType: 'SILAGE', quantity: '', unit: 'KG' }))).toEqual([
      { field: 'quantity', problem: 'required' },
    ]);
  });
});

describe('hygiene log (createHygieneLogBody)', () => {
  it('maps activity, date and notes', () => {
    expect(bodyOf(buildHygieneLogBody({ activity: ' Floor scrubbed ', performedOn: '14 Jul 2026', notes: '' }))).toEqual({
      activity: 'Floor scrubbed',
      performedOn: '2026-07-14',
    });
  });

  it('requires an activity of at most 160 characters and a valid date', () => {
    expect(errorsOf(buildHygieneLogBody({ activity: '  ', performedOn: '31/02/2026' }))).toEqual(
      expect.arrayContaining([
        { field: 'activity', problem: 'required' },
        { field: 'performedOn', problem: 'invalidDate' },
      ]),
    );
    expect(errorsOf(buildHygieneLogBody({ activity: 'x'.repeat(161), performedOn: '2026-07-14' }))).toEqual([
      { field: 'activity', problem: 'tooLong' },
    ]);
  });
});

describe('option tables: the modal holds the API enum, displays a translated label', () => {
  it('each table covers exactly the server enum (no label-keyed lookups left)', () => {
    expect(optionValues(FEED_TYPE_OPTIONS)).toEqual([...feedTypes]);
    expect(optionValues(WATER_SOURCE_OPTIONS)).toEqual([...waterSources]);
    expect(optionValues(HOUSING_TYPE_OPTIONS)).toEqual([...housingTypes]);
    expect(optionValues(HEALTH_RECORD_TYPE_OPTIONS).sort()).toEqual([...healthRecordTypes].sort());
    expect(optionValues(BREEDING_RECORD_TYPE_OPTIONS)).toEqual([...breedingRecordTypes]);
    expect(optionValues(FEED_LOG_UNIT_OPTIONS)).toEqual(['KG', 'G', 'BUNDLES']);
  });

  it('optionLabel translates a value and returns empty for a value outside the table', () => {
    expect(optionLabel(VACCINATION_ROUTE_OPTIONS, 'INJECTION_IM')).toBe('Injection (IM)');
    expect(optionLabel(FEED_TYPE_OPTIONS, 'GREEN_FODDER')).toBe('Green fodder');
    expect(optionLabel(VACCINATION_ROUTE_OPTIONS, 'Injection (IM)')).toBe('');
  });

  it('an old English label is no longer accepted as an enum value', () => {
    const body = bodyOf(buildVaccinationBody({ recordDate: '2026-07-12', vaccineName: 'HS', route: 'Injection (IM)' }));
    expect(body).not.toHaveProperty('route');
  });

  it('production units are codes with exact factors only', () => {
    expect(PRODUCTION_UNIT_OPTIONS).toEqual({
      MILK: ['L', 'ML'],
      EGGS: ['PIECES', 'TRAYS_30'],
      MEAT: ['KG', 'LB'],
      WOOL: ['KG', 'LB'],
      MANURE: ['KG', 'TONNE'],
    });
  });
});

describe('fieldErrorMessage', () => {
  it('renders a translated message naming the field', () => {
    const msg = fieldErrorMessage({ field: 'recordDate', problem: 'invalidDate' });
    expect(msg).toContain('Record date');
    expect(msg.length).toBeGreaterThan('Record date'.length);
  });
});
