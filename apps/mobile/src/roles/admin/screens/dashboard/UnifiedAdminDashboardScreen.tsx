/**
 * Unified Admin Dashboard Screen — Shared Screen Architecture for TOHFA Admin & Farmer Admin
 * 
 * Implements consolidation requirements:
 * 1. Single unified entry point for both TOHFA Admin and Farmer Admin roles.
 * 2. RBAC-based permission checks using can(code) from docs/rbac.json.
 * 3. Scope-aware data rendering (e.g. Zone-scoped vs Platform-scoped).
 * 4. Renders exact visual UI from reference PDFs for Tohfa Admin and Farmer Admin.
 * 5. Preserves all navigation flows, modals, subviews, and tab configurations.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  LogBox,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

LogBox.ignoreLogs([
  'getSystemConfig: /config/farmer lookup failed',
]);

import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import { makeCan, type Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { TohfaAdminDashboardScreen, type TohfaAdminTab } from './TohfaAdminDashboardScreen';
import { FarmerAdminDashboardScreen, type FarmerAdminTab } from './FarmerAdminDashboardScreen';
import { SuperAdminDashboardScreen, type SuperAdminTab } from './SuperAdminDashboardScreen';

export type UnifiedAdminTab = TohfaAdminTab | FarmerAdminTab | SuperAdminTab;

export interface UnifiedAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onSwitchRole?: (() => void) | undefined;
  initialTab?: UnifiedAdminTab | undefined;
  initialRole?: ('TOHFA_ADMIN' | 'FARMER_ADMIN' | 'SUPER_ADMIN') | undefined;
}

/**
 * UnifiedAdminDashboardScreen
 *
 * Automatically inspects the authenticated user via fetchMe() and resolves:
 * - permissions list (docs/rbac.json codes)
 * - roleCode ('TOHFA_ADMIN' vs 'FARMER_ADMIN')
 * - user scope (zone_id for Farmer Admin, platform-wide for Tohfa Admin)
 *
 * Seamlessly presents the design-exact screens matching the reference PDFs:
 * - Tohfa Admin (TA): 5 bottom tabs [Home, Work Queue, Inventory, Finance, More] + 15 operational modules.
 * - Farmer Admin (FA): 5 bottom tabs [Home, Farmers, Produce, Audits, More] + own-zone scope & conflict guards.
 */
export function UnifiedAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onSwitchRole,
  initialTab,
  initialRole,
}: UnifiedAdminDashboardScreenProps): React.JSX.Element {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [effectiveRole, setEffectiveRole] = useState<'TOHFA_ADMIN' | 'FARMER_ADMIN' | 'SUPER_ADMIN'>(
    initialRole || 'TOHFA_ADMIN'
  );

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const me = await fetchMe();
        if (!isMounted) return;
        setUser(me);
        
        // Determine role from server response
        const roles = me?.roles?.map((r: { code: string }) => r.code) || [];
        if (roles.includes('FARMER_ADMIN') && !roles.includes('TOHFA_ADMIN')) {
          setEffectiveRole('FARMER_ADMIN');
        } else if (roles.includes('TOHFA_ADMIN')) {
          setEffectiveRole('TOHFA_ADMIN');
        } else if (roles.includes('SUPER_ADMIN')) {
          setEffectiveRole('SUPER_ADMIN');
        } else if (initialRole) {
          setEffectiveRole(initialRole);
        }
      } catch {
        // Fallback safely to initialRole or default
        if (initialRole) {
          setEffectiveRole(initialRole);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [initialRole]);

  const can = useMemo<Can>(() => {
    if (user?.permissions && user.permissions.length > 0) {
      return makeCan(user.permissions);
    }
    if (effectiveRole === 'SUPER_ADMIN') {
      return (code: string) =>
        !code.endsWith('.create_own') &&
        code !== 'order.create_own' &&
        code !== 'listing.create_own' &&
        code !== 'cart.manage_own';
    }
    return makeCan(user?.permissions ?? []);
  }, [user?.permissions, effectiveRole]);

  // Determine if user has platform-level or zone-level admin capabilities
  const isFarmerAdmin = effectiveRole === 'FARMER_ADMIN';

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.loadingInner}>
          <Text style={styles.loadingText}>Loading Admin Workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (effectiveRole === 'SUPER_ADMIN') {
    return (
      <SuperAdminDashboardScreen
        can={can}
        scope={{ warehouseName: 'All Warehouses' }}
        role="SUPER_ADMIN"
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        initialTab={initialTab as SuperAdminTab | undefined}
      />
    );
  }

  if (isFarmerAdmin) {
    return (
      <FarmerAdminDashboardScreen
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
        initialTab={initialTab as FarmerAdminTab | undefined}
      />
    );
  }

  if (effectiveRole === 'SUPER_ADMIN') {
    return (
      <SuperAdminDashboardScreen
        can={can}
        scope={{ warehouseName: 'All Warehouses' }}
        role="SUPER_ADMIN"
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole ? () => onSwitchRole() : undefined}
        initialTab={initialTab as SuperAdminTab | undefined}
      />
    );
  }

  return (
    <TohfaAdminDashboardScreen
      onSignOut={onSignOut}
      onNavigate={onNavigate}
      onSwitchRole={onSwitchRole ? (_role: string) => onSwitchRole() : undefined}
      initialTab={initialTab as TohfaAdminTab | undefined}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  loadingInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UnifiedAdminDashboardScreen;

