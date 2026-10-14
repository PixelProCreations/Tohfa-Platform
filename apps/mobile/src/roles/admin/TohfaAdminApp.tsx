import React from 'react';
import { TohfaAdminDashboardScreen } from './screens/dashboard/TohfaAdminDashboardScreen';

export function TohfaAdminApp(): React.JSX.Element {
  return (
    <TohfaAdminDashboardScreen
      onSignOut={() => {}}
      onNavigate={() => {}}
    />
  );
}

export default TohfaAdminApp;
