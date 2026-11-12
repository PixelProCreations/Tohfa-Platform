/**
 * Text-input validation for the livestock screens: register / edit animal,
 * the produce-log modal and sale / transfer / cull. The record modals under
 * animalDetail validate through animalRecordForms (animal_record_forms.test.ts);
 * here we pin their input maxLength table.
 */
import { describe, expect, it } from 'vitest';
import { validateAnimalText } from '../screens/farm/livestock/animalForm/validation';
import { validateProduceForm, type ProduceFormValues } from '../screens/farm/livestock/dairyProduce/validation';
import { validateSaleTransferCull } from '../screens/farm/livestock/saleTransferCullValidation';
import { INPUT_MAX_LENGTH } from '../screens/farm/livestock/animalRecordForms';
import { t } from '../../../i18n/farmer';

const TAG_REQUIRED = 'Tag is required';

describe('animal form text rules', () => {
  const ok = { tag: 'TN-001', breed: 'Jersey', sourceFarm: '', purchased: false };
  it('accepts a valid animal', () => {
    expect(validateAnimalText(ok, TAG_REQUIRED)).toEqual({});
  });
  it('requires the tag and keeps the screen-specific wording', () => {
    expect(validateAnimalText({ ...ok, tag: '   ' }, TAG_REQUIRED)).toEqual({ tag: TAG_REQUIRED });
  });
  it('limits tag 40, breed 120, source farm 160 (docs/openapi.yaml)', () => {
    expect(validateAnimalText({ ...ok, tag: 'A'.repeat(41) }, TAG_REQUIRED)['tag']).toBe(t('farmer.validation.tooLong', { max: 40 }));
    expect(validateAnimalText({ ...ok, tag: 'A'.repeat(40) }, TAG_REQUIRED)).toEqual({});
    expect(validateAnimalText({ ...ok, breed: 'b'.repeat(121) }, TAG_REQUIRED)['breed']).toBeDefined();
    const purchased = { ...ok, purchased: true, sourceFarm: 'f'.repeat(161) };
    expect(validateAnimalText(purchased, TAG_REQUIRED)['sourceFarm']).toBeDefined();
  });
  it('ignores sourceFarm for a born-on-farm animal (it is not sent)', () => {
    expect(validateAnimalText({ ...ok, sourceFarm: 'f'.repeat(500) }, TAG_REQUIRED)).toEqual({});
  });
});

describe('produce log rules', () => {
  const blank: ProduceFormValues = { quantity: '', fat: '', milkUsed: '', count: '', damaged: '', notes: '' };
  it('milk: quantity required, positive, at most 3 decimals / 7 integer digits', () => {
    expect(validateProduceForm('milk', blank)['quantity']?.key).toBe('farmer.validation.required');
    expect(validateProduceForm('milk', { ...blank, quantity: '0' })['quantity']).toBeDefined();
    expect(validateProduceForm('milk', { ...blank, quantity: '5abc' })['quantity']?.key).toBe('farmer.validation.decimalInvalid');
    expect(validateProduceForm('milk', { ...blank, quantity: '-2' })['quantity']).toBeDefined();
    expect(validateProduceForm('milk', { ...blank, quantity: '1.2345' })['quantity']?.key).toBe('farmer.validation.tooManyDecimals');
    expect(validateProduceForm('milk', { ...blank, quantity: '12345678' })['quantity']?.key).toBe('farmer.validation.tooManyDigits');
    expect(validateProduceForm('milk', { ...blank, quantity: '12.5' })).toEqual({});
  });
  it('milk: fat percent is optional but 0..100', () => {
    expect(validateProduceForm('milk', { ...blank, quantity: '1', fat: '4.5' })).toEqual({});
    expect(validateProduceForm('milk', { ...blank, quantity: '1', fat: '101' })['fat']?.key).toBe('farmer.validation.numberTooLarge');
    expect(validateProduceForm('milk', { ...blank, quantity: '1', fat: 'x' })['fat']).toBeDefined();
  });
  it('eggs: whole number count >= 1, damaged whole >= 0', () => {
    expect(validateProduceForm('eggs', blank)['count']?.key).toBe('farmer.validation.required');
    expect(validateProduceForm('eggs', { ...blank, count: '5.5' })['count']?.key).toBe('farmer.validation.integerInvalid');
    expect(validateProduceForm('eggs', { ...blank, count: '0' })['count']?.key).toBe('farmer.validation.numberTooSmall');
    expect(validateProduceForm('eggs', { ...blank, count: '30', damaged: '2' })).toEqual({});
    expect(validateProduceForm('eggs', { ...blank, count: '30', damaged: '-1' })['damaged']).toBeDefined();
  });
  it('curd / paneer: milk used optional but positive; other products have no milkUsed rule', () => {
    expect(validateProduceForm('curd', { ...blank, quantity: '2', milkUsed: '0' })['milkUsed']).toBeDefined();
    expect(validateProduceForm('paneer', { ...blank, quantity: '2', milkUsed: '10' })).toEqual({});
    expect(validateProduceForm('ghee', { ...blank, quantity: '2', milkUsed: 'zzz' })).toEqual({});
  });
  it('notes are limited to 2000 characters', () => {
    expect(validateProduceForm('ghee', { ...blank, quantity: '1', notes: 'n'.repeat(2001) })['notes']).toBeDefined();
  });
});

describe('sale / transfer / cull rules', () => {
  const v = { buyer: '', salePrice: '', destinationFarm: '', cullReason: '' };
  it('sale price is an optional rupee amount with at most 2 decimals, zero allowed', () => {
    expect(validateSaleTransferCull('sale', { ...v, salePrice: '12500.50' })).toEqual({});
    expect(validateSaleTransferCull('sale', { ...v, salePrice: '0' })).toEqual({});
    expect(validateSaleTransferCull('sale', { ...v, salePrice: '10.555' })['salePrice']).toBeDefined();
    expect(validateSaleTransferCull('sale', { ...v, salePrice: '1e5' })['salePrice']).toBeDefined();
    expect(validateSaleTransferCull('sale', { ...v, salePrice: '-5' })['salePrice']).toBeDefined();
  });
  it('counterparty 160 and reason 500, only for the chosen event', () => {
    expect(validateSaleTransferCull('sale', { ...v, buyer: 'b'.repeat(161) })['buyer']).toBeDefined();
    expect(validateSaleTransferCull('transfer', { ...v, destinationFarm: 'd'.repeat(161) })['destinationFarm']).toBeDefined();
    expect(validateSaleTransferCull('cull', { ...v, cullReason: 'r'.repeat(501) })['cullReason']).toBeDefined();
    expect(validateSaleTransferCull('cull', { ...v, buyer: 'b'.repeat(500), salePrice: 'x' })).toEqual({});
  });
});

describe('record modal input limits', () => {
  it('match the server schema limits', () => {
    expect(INPUT_MAX_LENGTH).toMatchObject({ short: 160, long: 2000, batch: 80, date: 10, time: 5 });
  });
});
