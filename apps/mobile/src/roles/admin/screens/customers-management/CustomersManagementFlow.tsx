/**
 * CustomersManagementFlow: the thin host the Tohfa Admin shell mounts for the
 * More menu's Customers row. One screen today; the Customer Directory and GST &
 * Business screens are not built, so the Quick action cards draw without a
 * destination (they get a handler when those screens land).
 *
 * `can` is the signed-in admin's permission check; the screen gates on
 * `customer.list.view` and the server authorises every request again.
 */
import React from 'react';
import type { Can } from '../../permissions/can';
import { CustomersManagementScreen } from './CustomersManagementScreen';

export interface CustomersManagementFlowProps {
  can: Can;
  onBack: () => void;
}

export function CustomersManagementFlow({ can, onBack }: CustomersManagementFlowProps) {
  return <CustomersManagementScreen can={can} onBack={onBack} />;
}
