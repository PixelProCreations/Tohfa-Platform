import { describe, expect, it } from 'vitest';
// Relative import on purpose: @tohfa/mobile-ui's index pulls in React Native (see overlayLabel.test.ts).
import { documentKind, isOpenableDocumentUrl } from '../../../../../../packages/mobile-ui/src/documentKind';

describe('documentKind', () => {
  it('classifies images by the URL path extension, ignoring query string, fragment and case', () => {
    expect(documentKind('https://cdn.tohfa.in/docs/cert.JPG')).toBe('image');
    expect(documentKind('https://x.blob.core.windows.net/c/certificate/abc.png?sv=2024&sig=a.pdf')).toBe('image');
    expect(documentKind('http://localhost:3000/storage/certificate/abc.webp#top')).toBe('image');
    expect(documentKind('https://cdn.tohfa.in/a.jpeg')).toBe('image');
  });

  it('classifies a PDF', () => {
    expect(documentKind('https://cdn.tohfa.in/docs/8f1c/npop-2026.pdf')).toBe('pdf');
    expect(documentKind('https://cdn.tohfa.in/docs/npop.PDF?expires=2026-01-01T00%3A00')).toBe('pdf');
  });

  it('falls back to unknown for no or an unrecognised extension', () => {
    expect(documentKind('https://cdn.tohfa.in/docs/abc')).toBe('unknown');
    expect(documentKind('https://cdn.tohfa.in/docs/abc.docx')).toBe('unknown');
    expect(documentKind('https://cdn.tohfa.in.pdf/docs/abc')).toBe('unknown');
  });
});

describe('isOpenableDocumentUrl', () => {
  it('accepts only absolute http(s) URLs', () => {
    expect(isOpenableDocumentUrl('https://cdn.tohfa.in/a.pdf')).toBe(true);
    expect(isOpenableDocumentUrl('http://10.0.2.2:3000/storage/a.pdf')).toBe(true);
  });

  it('refuses other schemes and relative paths, so a stored value can never launch an arbitrary intent', () => {
    expect(isOpenableDocumentUrl('javascript:alert(1)')).toBe(false);
    expect(isOpenableDocumentUrl('intent://scan/#Intent;scheme=zxing;end')).toBe(false);
    expect(isOpenableDocumentUrl('file:///sdcard/a.pdf')).toBe(false);
    expect(isOpenableDocumentUrl('/storage/a.pdf')).toBe(false);
    expect(isOpenableDocumentUrl('')).toBe(false);
    expect(isOpenableDocumentUrl('  https://cdn.tohfa.in/a.pdf')).toBe(false);
  });
});
