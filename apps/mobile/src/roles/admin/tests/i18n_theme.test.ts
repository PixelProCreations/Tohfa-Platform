import { describe, expect, it } from 'vitest';
import { t } from '../i18n';
import { adminTheme } from '../theme';
import { semantic, tokens } from '@tohfa/design-tokens';

describe('admin i18n', () => {
  it('has the shared strings every admin flow needs', () => {
    expect(t('admin.common.loading')).not.toBe('admin.common.loading');
    expect(t('admin.common.retry').length).toBeGreaterThan(0);
    expect(t('admin.common.empty').length).toBeGreaterThan(0);
    expect(t('admin.errors.generic').length).toBeGreaterThan(0);
  });

  it('interpolates {named} params', () => {
    expect(t('admin.common.loadMoreError', { count: 3 })).not.toContain('{');
  });

  it('keeps the existing scaffold keys working', () => {
    expect(t('scaffold.heading')).toBe('TOHFA Admin');
  });
});

describe('admin theme', () => {
  it('is built from design tokens, not literals', () => {
    expect(adminTheme.colors.primary).toBe(semantic('primary'));
    expect(adminTheme.colors.danger).toBe(semantic('danger'));
    expect(adminTheme.spacing).toBe(tokens.spacing);
    expect(adminTheme.radius).toBe(tokens.radius);
  });
});
