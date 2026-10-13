import { describe, expect, it, vi } from 'vitest';
import { createAdminSignOut } from '../session/signOut';

function deps(logout: () => Promise<void> = async () => undefined) {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      logout: vi.fn(async () => {
        calls.push('logout');
        await logout();
      }),
      clearLocalAuth: vi.fn(async () => {
        calls.push('clearLocalAuth');
      }),
      clearCache: vi.fn(() => {
        calls.push('clearCache');
      }),
      onSignOut: vi.fn(() => {
        calls.push('onSignOut');
      }),
    },
  };
}

describe('admin sign-out', () => {
  it('after a password change: no logout call (the server already ended every session), cache cleared, host signs out', async () => {
    const { calls, deps: d } = deps();
    await createAdminSignOut(d).afterPasswordChange();
    expect(d.logout).not.toHaveBeenCalled();
    expect(calls).toEqual(['clearLocalAuth', 'clearCache', 'onSignOut']);
  });

  it('a manual sign-out calls logout, then clears the device and hands back to the host', async () => {
    const { calls, deps: d } = deps();
    await createAdminSignOut(d).signOut();
    expect(calls).toEqual(['logout', 'clearLocalAuth', 'clearCache', 'onSignOut']);
  });

  it('a failed logout (dead network) still signs the device out', async () => {
    const { calls, deps: d } = deps(async () => {
      throw new Error('offline');
    });
    await createAdminSignOut(d).signOut();
    expect(calls).toEqual(['logout', 'clearLocalAuth', 'clearCache', 'onSignOut']);
  });
});
