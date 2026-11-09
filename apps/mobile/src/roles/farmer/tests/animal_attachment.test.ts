/**
 * animalAttachment.ts is the pick + sign + upload flow for an animal record's
 * attachment (the server checks the caller owns the upload, BR-137c). It must
 * go through the repo's documentPicker adapter, never the removed
 * `react-native-document-picker` package (it does not build on RN 0.88).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const picker = vi.hoisted(() => ({
  pickSingle: vi.fn(),
  isCancel: vi.fn(),
  types: { pdf: 'pdf', images: 'images' },
}));
vi.mock('../native/documentPicker', () => ({ default: picker }));
vi.mock('../api/registration', () => ({ signUpload: vi.fn() }));
vi.mock('../api/uploader', () => ({ uploadWithResume: vi.fn() }));

import { ATTACHMENT_MAX_BYTES, attachmentSizeParts, pickAnimalAttachment } from '../screens/farm/livestock/animalAttachment';

beforeEach(() => {
  picker.pickSingle.mockReset();
  picker.isCancel.mockReset();
  picker.isCancel.mockReturnValue(false);
});

describe('animalAttachment', () => {
  it('B1: imports the documentPicker adapter, not react-native-document-picker', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../screens/farm/livestock/animalAttachment.ts'), 'utf8');
    expect(src).toContain("from '../../../native/documentPicker'");
    expect(src).not.toContain('react-native-document-picker');
  });

  it('returns the local copy of a picked PDF with its content type', async () => {
    picker.pickSingle.mockResolvedValue({ uri: 'content://x', fileCopyUri: 'file:///c/x.pdf', name: 'Receipt.PDF', type: null, size: 2048 });
    const outcome = await pickAnimalAttachment();
    expect(outcome).toEqual({
      kind: 'picked',
      file: { uri: 'file:///c/x.pdf', name: 'Receipt.PDF', contentType: 'application/pdf', sizeBytes: 2048 },
    });
  });

  it('refuses a file over the limit', async () => {
    picker.pickSingle.mockResolvedValue({ uri: 'file:///big.jpg', fileCopyUri: null, name: 'big.jpg', type: 'image/jpeg', size: ATTACHMENT_MAX_BYTES + 1 });
    expect(await pickAnimalAttachment()).toEqual({ kind: 'tooLarge' });
  });

  it('maps a cancel to cancelled and any other error to failed', async () => {
    const cancel = new Error('cancel');
    picker.pickSingle.mockRejectedValueOnce(cancel);
    picker.isCancel.mockImplementation((e: unknown) => e === cancel);
    expect(await pickAnimalAttachment()).toEqual({ kind: 'cancelled' });

    const boom = new Error('boom');
    picker.pickSingle.mockRejectedValueOnce(boom);
    expect(await pickAnimalAttachment()).toEqual({ kind: 'failed', error: boom });
  });

  it('formats the size for the attachment card', () => {
    expect(attachmentSizeParts(null)).toBeNull();
    expect(attachmentSizeParts(240 * 1024)).toEqual({ value: '240', unit: 'KB' });
    expect(attachmentSizeParts(1.2 * 1024 * 1024)).toEqual({ value: '1.2', unit: 'MB' });
  });
});
